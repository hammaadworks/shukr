import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'shukr_audio_storage';
const STORE_NAME = 'audio_blobs';
const DB_VERSION = 2; // Incremented for name change and potential schema updates

interface AudioStorageSchema {
  audio_blobs: {
    key: string;
    value: {
      id: string; // The cache key: ${profileId}_${wordId}_${language}
      blob: Blob;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AudioStorageSchema>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AudioStorageSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const audioStorage = {
  async get(id: string): Promise<Blob | null> {
    try {
      const db = await getDB();
      const entry = await db.get(STORE_NAME, id);
      return entry ? entry.blob : null;
    } catch (err) {
      console.error('[AudioStorage] Error getting audio:', err);
      return null;
    }
  },

  async set(id: string, blob: Blob): Promise<void> {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, {
        id,
        blob,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[AudioStorage] Error setting audio:', err);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, id);
    } catch (err) {
      console.error('[AudioStorage] Error deleting audio:', err);
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      const db = await getDB();
      return (await db.getAllKeys(STORE_NAME)) as string[];
    } catch (err) {
      console.error('[AudioStorage] Error getting all keys:', err);
      return [];
    }
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }
};
