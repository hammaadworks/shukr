import { universeDb } from './universeDb';
import { db as recognitionDb } from '../recognition/db';
import { audioStorage } from './audioStorage';

export interface UniverseSnapshot {
  version: number;
  timestamp: number;
  words?: any[];
  doodles?: any[];
  audio?: Record<string, string>; // key -> base64 DataURL
  gesture_map?: Record<string, string>;
  quotes?: any[];
  emergency_contacts?: any[];
  activeVoiceProfile?: string;
  voiceProfiles?: any[];
  langPair?: any;
  user_nickname?: string;
  sos_settings?: any;
  preferences?: any;
}

/**
 * Utility to export and import the entire application state (The "Universe").
 * This handles the serialization of IndexedDB data and binary audio blobs.
 */
export const universePorter = {
  /**
   * Serializes the current local state into a portable snapshot.
   */
  async export(currentConfig: any = {}): Promise<UniverseSnapshot> {
    const words = await universeDb.words.toArray();
    const doodles = await recognitionDb.templates.toArray();
    const quotes = await universeDb.quotes.toArray();
    const audio = await this.serializeAllAudio();

    // Include the language pair from localStorage if it exists
    const langPair = localStorage.getItem('shukr_lang_pair');

    return {
      version: currentConfig.version || 1,
      timestamp: Date.now(),
      ...currentConfig, // Include settings like gestures, etc.
      words,
      doodles,
      quotes,
      audio,
      // Settings extension for global shukr
      langPair: langPair ? JSON.parse(langPair) : undefined
    };
  },

  /**
   * Hydrates the local IndexedDB with data from a snapshot.
   * If merge is false, it clears all existing data first.
   */
  async import(snapshot: any, shouldMerge = true) {
    if (!shouldMerge) {
      await this.clearAllLocalData();
    }

    await this.restoreWords(snapshot);
    await this.restoreDoodles(snapshot);
    await this.restoreQuotes(snapshot);
    await this.restoreAudio(snapshot);

    // Restore language pair if provided
    if (snapshot.langPair) {
      localStorage.setItem('shukr_lang_pair', JSON.stringify(snapshot.langPair));
    }
    
    console.log(`[Porter] Successfully imported universe snapshot from ${new Date(snapshot.timestamp).toLocaleString()}`);
  },

  /**
   * Triggers a browser download of the snapshot as a JSON file.
   */
  download(snapshot: UniverseSnapshot) {
    const fileName = `shukr_boot_data_${new Date().toISOString().split('T')[0]}.json`;
    const dataStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    
    URL.revokeObjectURL(url);
  },

  // --- Private Helpers (Internal Logic) ---

  async serializeAllAudio(): Promise<Record<string, string>> {
    const keys = await audioStorage.getAllKeys();
    const serialized: Record<string, string> = {};
    
    for (const key of keys) {
      const blob = await audioStorage.get(key);
      if (blob) {
        serialized[key] = await this.serializeBlob(blob);
      }
    }
    return serialized;
  },

  async restoreWords(snapshot: UniverseSnapshot) {
    let wordsToRestore = snapshot.words || [];
    
    // Legacy support: Words might be bundled inside categories in older snapshots
    if (wordsToRestore.length === 0 && (snapshot as any).categories) {
      wordsToRestore = (snapshot as any).categories.flatMap((cat: any) => cat.items || []);
    }

    if (wordsToRestore.length > 0) {
      await universeDb.words.bulkPut(wordsToRestore);
    }
  },

  async restoreDoodles(snapshot: UniverseSnapshot) {
    const doodles = snapshot.doodles || (snapshot as any).sketches || [];
    if (doodles.length > 0) {
      await recognitionDb.templates.bulkPut(doodles);
    }
  },

  async restoreQuotes(snapshot: UniverseSnapshot) {
    if (snapshot.quotes && snapshot.quotes.length > 0) {
      // Create valid IDs if they are missing
      const quotesToPut = snapshot.quotes.map((q: any, i: number) => ({
        ...q,
        id: q.id || `quote_imp_${crypto.randomUUID()}_${i}`
      }));
      await universeDb.quotes.bulkPut(quotesToPut);
    }
  },

  async restoreAudio(snapshot: UniverseSnapshot) {
    if (!snapshot.audio) return;

    for (const [key, dataUrl] of Object.entries(snapshot.audio)) {
      const blob = await this.deserializeBlob(dataUrl);
      await audioStorage.set(key, blob);
    }
  },

  async clearAllLocalData() {
    await Promise.all([
      universeDb.words.clear(),
      universeDb.quotes.clear(),
      universeDb.voiceProfiles.clear(),
      recognitionDb.templates.clear(),
      audioStorage.clear()
    ]);
  },

  serializeBlob(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  },

  async deserializeBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }
};
