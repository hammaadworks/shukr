import { useEffect, useState, useCallback } from 'react';
import { useLogger } from './useLogger';

export const useSync = () => {
  const { getUnsyncedEvents, markAsSynced } = useLogger();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  /**
   * Local sync placeholder.
   * In the future, this could be used for peer-to-peer sync or 
   * local network backup via Universe Porter.
   */
  const syncLocal = useCallback(async () => {
    const events = await getUnsyncedEvents();
    if (events.length === 0) return;

    console.log(`[Sync] Found ${events.length} unsynced local events.`);
    
    // For now, we just mark them as synced locally since we are offline-first
    // and using Universe Porter for manual backups.
    try {
      await markAsSynced(events.map(e => e.id));
      setLastSync(Date.now());
    } catch (err) {
      console.error('[Sync] Failed to process local logs:', err);
    }
  }, [getUnsyncedEvents, markAsSynced]);

  const syncAll = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await syncLocal();
    setIsSyncing(false);
  }, [syncLocal, isSyncing]);

  useEffect(() => {
    // Check for unsynced logs periodically
    const interval = setInterval(syncAll, 60000);
    return () => clearInterval(interval);
  }, [syncAll]);

  return { isSyncing, lastSync, syncToCloud: syncAll };
};
