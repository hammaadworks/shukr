import { useEffect, useState, useCallback } from 'react';
import { universeDb } from '../lib/universeDb';
import { universePorter } from '../lib/universePorter';
import type { WordUniverseItem, CategoryFolder } from '../lib/universeDb';

// This bundles the boot data directly into the JavaScript for the ULTIMATE fallback.
// Even if the fetch fails, we have this version ready to go.
import bootDataFallback from '../boot_data.json';

const BOOT_DATA_URL = '/boot_data.json';
const LOCAL_CONFIG_KEY = 'shukr_app_config';
const LAST_BOOT_TIMESTAMP_KEY = 'shukr_last_boot_ts';
const LAST_BOOT_VERSION_KEY = 'shukr_last_boot_version';

export interface AppConfig {
  version: number;
  timestamp: number;
  categories: any[];
  gesture_map: Record<string, string>;
  quotes: any[];
  emergency_contacts: any[];
  activeVoiceProfile?: string;
  voiceProfiles?: any[];
  sketches?: any[];
  audio?: Record<string, string>;
  favorites?: string[];
}

/**
 * Hook to manage the application's configuration and initial data hydration.
 * It synchronizes the 'boot_data.json' from the public folder into the local IndexedDB.
 */
export const useAppConfig = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  /**
   * Main Bootstrapping logic:
   * 1. Check if we have an active config in LocalStorage.
   * 2. Fetch "boot_data.json" from public/ to see if there's a newer version.
   * 3. If newer, perform a full hydration of the local database.
   */
  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      const bootData = await fetchBootData();
      const localConfig = getStoredConfig();

      // If we are offline and have no local config, we use the BUNDLED fallback.
      if (!bootData && !localConfig) {
        console.warn('[AppConfig] Fetch failed and no local data. Using bundled fallback.');
        setIsOfflineMode(true);
        await hydrateLocalDatabase(bootDataFallback as any);
        persistBootMetadata(bootDataFallback as any);
        setConfig(bootDataFallback as any);
        return;
      }

      const shouldHydrate = isNewerThanLocal(bootData);
      
      let activeConfig = localConfig;
      if (shouldHydrate && bootData) {
        console.log('[AppConfig] New boot_data detected. Hydrating local database...');
        await hydrateLocalDatabase(bootData);
        activeConfig = bootData;
        persistBootMetadata(bootData);
      }

      const finalConfig = activeConfig || bootData || (bootDataFallback as any);
      setConfig(finalConfig);
      
      // Ensure the DB is in sync with the active config
      if (finalConfig) {
        await syncConfigToIndexedDB(finalConfig);
      }
    } catch (err: any) {
      console.error('[AppConfig] Boot failed:', err);
      setError(err.message);
      // Last-ditch effort: use fallback if everything else fails
      if (!config) setConfig(bootDataFallback as any);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBootData = async (): Promise<AppConfig | null> => {
    try {
      const response = await fetch(BOOT_DATA_URL);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };

  const getStoredConfig = (): AppConfig | null => {
    const saved = localStorage.getItem(LOCAL_CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  };

  const isNewerThanLocal = (bootData: AppConfig | null): boolean => {
    if (!bootData) return false;
    
    const lastVersion = parseInt(localStorage.getItem(LAST_BOOT_VERSION_KEY) || '0');
    const lastTimestamp = parseInt(localStorage.getItem(LAST_BOOT_TIMESTAMP_KEY) || '0');

    if (bootData.version > lastVersion) return true;
    if (bootData.version === lastVersion && bootData.timestamp > lastTimestamp) return true;
    
    return false;
  };

  const persistBootMetadata = (bootData: AppConfig) => {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(bootData));
    localStorage.setItem(LAST_BOOT_VERSION_KEY, (bootData.version || 1).toString());
    localStorage.setItem(LAST_BOOT_TIMESTAMP_KEY, (bootData.timestamp || Date.now()).toString());
  };

  const hydrateLocalDatabase = async (snapshot: AppConfig) => {
    await universePorter.import(snapshot as any, true);
  };

  const syncConfigToIndexedDB = async (config: AppConfig) => {
    try {
      // 1. Sync Categories
      const categories: CategoryFolder[] = config.categories.map((c: any, idx: number) => ({
        id: c.id,
        label_en: c.label_en || c.en,
        label_ur: c.label_ur || c.ur,
        icon: c.icon || 'folder',
        order: idx,
        isSystem: c.id === 'core'
      }));
      await universeDb.categories.bulkPut(categories);

      // 2. Sync Words
      const existingWords = await universeDb.words.toArray();
      const existingMap = new Map(existingWords.map(w => [w.id, w]));

      const words: WordUniverseItem[] = config.categories.flatMap((cat: any) => 
        (cat.items || []).map((item: any) => {
          const local = existingMap.get(item.id);
          return {
            ...item,
            category: cat.id,
            type: item.type || 'word',
            usageCount: local?.usageCount || item.usageCount || 0,
            lastUsedAt: local?.lastUsedAt || item.lastUsedAt || 0,
            timeBias: local?.timeBias || item.timeBias || [],
            next: item.next || [],
            tags: item.tags || []
          };
        })
      );
      await universeDb.words.bulkPut(words);
    } catch (err) {
      console.error('[AppConfig] Error syncing to DB:', err);
    }
  };

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const updateConfig = useCallback(async (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(newConfig));
    localStorage.setItem(LAST_BOOT_TIMESTAMP_KEY, Date.now().toString());
    await syncConfigToIndexedDB(newConfig);
  }, []);

  return { config, isLoading, error, refresh: bootstrap, updateConfig, isOfflineMode };
};
