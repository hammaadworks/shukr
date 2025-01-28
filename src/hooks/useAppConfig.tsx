import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { universeDb } from '../lib/universeDb';
import { universePorter } from '../lib/universePorter';
import { dataAssembler } from '../lib/dataAssembler';
import { useLanguage } from './useLanguage';
import { DEFAULT_GESTURE_MAP, type GestureDefinition } from '../recognition/gestures/types';
import { translator } from '../lib/translator';

export interface AppConfig {
  version: number;
  timestamp: number;
  user_nickname?: string;
  categories: any[];
  gesture_map: Record<string, string>;
  gesture_mappings?: Record<string, GestureDefinition>;
  quotes: any[];
  emergency_contacts: any[];
  sos_settings?: {
    message_template: string;
    countdown_seconds: number;
    play_alarm_sound: boolean;
  };
  preferences?: {
    theme?: string;
    font_size?: string;
    speech_rate?: number;
    enable_vibration?: boolean;
    enable_click_sound?: boolean;
    auto_clear_minutes?: number;
  };
  language_pair?: {
    primary: string;
    secondary: string;
  };
  active_voice?: string;
  voices?: any[];
  ai_config?: {
    endpoint?: string;
    apiKey?: string;
    model?: string;
    authType?: 'none' | 'bearer' | 'basic';
    username?: string;
    password?: string;
  };
  words?: any[];
  doodles?: any[];
  audio?: Record<string, string>;
  favorites?: string[];
  family?: string[];
  enableClickSound?: boolean;
}

interface ConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateConfig: (newConfig: AppConfig) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { primaryLanguage, secondaryLanguage } = useLanguage();

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      const bootData = await dataAssembler.assemble(primaryLanguage, secondaryLanguage);

      const lastHydratedPair = localStorage.getItem('shukr_last_hydrated_pair');
      const currentPair = `${primaryLanguage}_${secondaryLanguage}`;
      
      const lastVersion = parseInt(localStorage.getItem(`shukr_last_boot_version_${currentPair}`) || '0');
      const lastTimestamp = parseInt(localStorage.getItem(`shukr_last_boot_ts_${currentPair}`) || '0');

      const isNewer = bootData.version > lastVersion || (bootData.version === lastVersion && bootData.timestamp > lastTimestamp);
      const isDifferentPair = lastHydratedPair !== currentPair;
      
      const dbWordsCount = await universeDb.words.count();
      const isMissingWords = bootData.words && dbWordsCount < bootData.words.length;

      if ((isNewer || isDifferentPair || isMissingWords) && bootData) {
        console.log(`[AppConfig] Hydrating database for ${currentPair}...`);
        await universePorter.import(bootData as any, true);
        localStorage.setItem(`shukr_last_boot_version_${currentPair}`, bootData.version.toString());
        localStorage.setItem(`shukr_last_boot_ts_${currentPair}`, bootData.timestamp.toString());
        localStorage.setItem('shukr_last_hydrated_pair', currentPair);
      }

      const finalConfig = bootData;
      if (finalConfig && !finalConfig.gesture_mappings) {
        finalConfig.gesture_mappings = DEFAULT_GESTURE_MAP;
      }

      // Vital: Hydrate categories from the unified universeDb
      const dbWords = await universeDb.words.toArray();
      if (dbWords.length > 0 && finalConfig.categories) {
        finalConfig.categories = finalConfig.categories.map((cat: any) => {
          let items = [];
          if (cat.id === 'favorite') {
            items = dbWords.filter(w => (finalConfig.favorites || []).includes(w.id));
          } else if (cat.id === 'family') {
            items = dbWords.filter(w => (finalConfig.family || []).includes(w.id));
          } else {
            items = dbWords.filter(w => w.category === cat.id || w.categoryId === cat.id || (w.doodle_shapes && w.doodle_shapes.includes(cat.id)));
            if (cat.id === 'general' && items.length === 0) {
              items = dbWords;
            }
          }
          return { ...cat, items };
        });
      }

      // Apply AI defaults from environment variables if not set
      if (finalConfig) {
        if (!finalConfig.ai_config) finalConfig.ai_config = {};
        if (!finalConfig.ai_config.endpoint) finalConfig.ai_config.endpoint = import.meta.env.VITE_AI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        if (!finalConfig.ai_config.apiKey) finalConfig.ai_config.apiKey = import.meta.env.VITE_AI_API_KEY || import.meta.env.VITE_AI_GEMINI_KEY || '';
        if (!finalConfig.ai_config.model) finalConfig.ai_config.model = import.meta.env.VITE_AI_MODEL || 'gemini-1.5-flash';
        if (!finalConfig.ai_config.authType) finalConfig.ai_config.authType = (import.meta.env.VITE_AI_AUTH_TYPE as any) || 'none';
      }

      translator.refresh(finalConfig);
      setConfig(finalConfig);
    } catch (err: any) {
      console.error('[AppConfig] Boot failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [primaryLanguage, secondaryLanguage]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const updateConfig = useCallback(async (newConfig: AppConfig) => {
    translator.refresh(newConfig);
    setConfig(newConfig);
    
    try {
      const keysToSave = ['favorites', 'family', 'sos_settings', 'preferences', 'language_pair', 'active_voice', 'ai_config', 'gesture_mappings'];
      const settingsItems = keysToSave
        .map(k => ({ key: k, value: (newConfig as any)[k] }))
        .filter(item => item.value !== undefined);
        
      await universeDb.settings.bulkPut(settingsItems);
      
      // Sync Voices to their dedicated table
      await universeDb.voices.clear();
      if (newConfig.voices && newConfig.voices.length > 0) {
        await universeDb.voices.bulkPut(newConfig.voices);
      }
    } catch (err) {
      console.error('[AppConfig] DB Sync failed:', err);
    }
  }, []);

  const value = useMemo(() => ({
    config,
    isLoading,
    error,
    refresh: bootstrap,
    updateConfig
  }), [config, isLoading, error, bootstrap, updateConfig]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within a ConfigProvider');
  }
  return context;
};
