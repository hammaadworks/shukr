import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { universeDb } from '../lib/universeDb';
import { universePorter } from '../lib/universePorter';
import type { WordUniverseItem, CategoryFolder } from '../lib/universeDb';
import { dataAssembler } from '../lib/dataAssembler';
import { useLanguage } from './useLanguage';
import { audioStorage } from '../lib/audioStorage';
import { DEFAULT_GESTURE_MAP, type GestureDefinition } from '../recognition/gestures/types';

export interface AppConfig {
  version: number;
  timestamp: number;
  categories: any[];
  quick_actions?: any[];
  gesture_map: Record<string, string>;
  gesture_mappings?: Record<string, GestureDefinition>;
  quotes: any[];
  emergency_contacts: any[];
  activeVoiceProfile?: string;
  voiceProfiles?: any[];
  sketches?: any[];
  audio?: Record<string, string>;
  favorites?: string[];
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

  const getStoredConfig = useCallback((): AppConfig | null => {
    const saved = localStorage.getItem(`shukr_app_config_${primaryLanguage}_${secondaryLanguage}`);
    return saved ? JSON.parse(saved) : null;
  }, [primaryLanguage, secondaryLanguage]);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      const bootData = await dataAssembler.assemble(primaryLanguage, secondaryLanguage);
      const localConfig = getStoredConfig();

      const lastHydratedPair = localStorage.getItem('shukr_last_hydrated_pair');
      const currentPair = `${primaryLanguage}_${secondaryLanguage}`;
      
      const lastVersion = parseInt(localStorage.getItem(`shukr_last_boot_version_${currentPair}`) || '0');
      const lastTimestamp = parseInt(localStorage.getItem(`shukr_last_boot_ts_${currentPair}`) || '0');

      const isNewer = bootData.version > lastVersion || (bootData.version === lastVersion && bootData.timestamp > lastTimestamp);
      const isDifferentPair = lastHydratedPair !== currentPair;

      let activeConfig = localConfig;

      if ((isNewer || isDifferentPair) && bootData) {
        console.log(`[AppConfig] Hydrating database for ${currentPair}...`);
        await universePorter.import(bootData as any, true);
        localStorage.setItem(`shukr_last_boot_version_${currentPair}`, bootData.version.toString());
        localStorage.setItem(`shukr_last_boot_ts_${currentPair}`, bootData.timestamp.toString());
        localStorage.setItem('shukr_last_hydrated_pair', currentPair);
        activeConfig = bootData;
      }

      const finalConfig = activeConfig || bootData;
      if (finalConfig && !finalConfig.gesture_mappings) {
        finalConfig.gesture_mappings = DEFAULT_GESTURE_MAP;
      }
      setConfig(finalConfig);
    } catch (err: any) {
      console.error('[AppConfig] Boot failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [primaryLanguage, secondaryLanguage, getStoredConfig]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const updateConfig = useCallback(async (newConfig: AppConfig) => {
    setConfig(newConfig);
    const pair = `${primaryLanguage}_${secondaryLanguage}`;
    localStorage.setItem(`shukr_app_config_${pair}`, JSON.stringify(newConfig));
    localStorage.setItem(`shukr_last_boot_ts_${pair}`, Date.now().toString());
    
    // Sync to DB
    try {
      const categories: CategoryFolder[] = newConfig.categories.map((c: any, idx: number) => ({
        id: c.id,
        label_primary: c.label_primary || c.label_ur || c.ur,
        label_secondary: c.label_secondary || c.label_en || c.en,
        label_en: c.label_en || c.en,
        label_ur: c.label_ur || c.ur,
        icon: c.icon || 'folder',
        order: idx,
        isSystem: c.id === 'core'
      }));
      await universeDb.categories.bulkPut(categories);

      const words: WordUniverseItem[] = newConfig.categories.flatMap((cat: any) => 
        (cat.items || []).map((item: any) => ({
          ...item,
          text_primary: item.text_primary || item.ur,
          text_secondary: item.text_secondary || item.en,
          category: cat.id,
          type: item.type || 'word'
        }))
      );
      await universeDb.words.bulkPut(words);
    } catch (err) {
      console.error('[AppConfig] DB Sync failed:', err);
    }
  }, [primaryLanguage, secondaryLanguage]);

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
