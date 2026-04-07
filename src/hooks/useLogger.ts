import { useCallback } from 'react';
import { get, update } from 'idb-keyval';

type EventType = 'tap_raw' | 'speech_action' | 'navigation' | 'custom_input' | 'attention' | 'quote_action';

interface AppEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data: any;
  synced: boolean;
}

const OUTBOX_KEY = 'shukr_outbox';

export const useLogger = () => {
  const logEvent = useCallback(async (type: EventType, data: any) => {
    const event: AppEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: Date.now(),
      data,
      synced: false
    };

    try {
      // Save to IndexedDB outbox
      await update(OUTBOX_KEY, (val: AppEvent[] | undefined) => {
        const events = val || [];
        return [...events, event];
      });
      
      console.log(`[Logger] Saved event: ${type}`, data);
    } catch (err) {
      console.error('[Logger] Failed to save event', err);
    }
  }, []);

  const getUnsyncedEvents = useCallback(async () => {
    return (await get<AppEvent[]>(OUTBOX_KEY)) || [];
  }, []);

  const markAsSynced = useCallback(async (ids: string[]) => {
    await update(OUTBOX_KEY, (val: AppEvent[] | undefined) => {
      if (!val) return [];
      return val.filter(e => !ids.includes(e.id));
    });
  }, []);

  return { logEvent, getUnsyncedEvents, markAsSynced };
};
