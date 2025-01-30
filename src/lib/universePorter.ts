import { universeDb } from './universeDb';

export interface UniverseSnapshot {
  version: number;
  timestamp: number;
  words?: any[];
  doodles?: any[];
  audio?: Record<string, string>; // key -> base64 DataURL
  quotes?: any[];
  settings?: any[];
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
    const doodles = await universeDb.doodles.toArray();
    const quotes = await universeDb.quotes.toArray();
    const settings = await universeDb.settings.toArray();
    const voices = (await universeDb.voices.toArray()).map(vp => ({ ...vp, editable: false }));
    const audio = await this.serializeAllAudio();

    return {
      version: currentConfig.version || 1,
      timestamp: Date.now(),
      ...currentConfig,
      words,
      doodles,
      quotes,
      settings,
      voices,
      audio
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
    await this.restoreSettings(snapshot);
    await this.restoreAudio(snapshot);

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
    const records = await universeDb.audio.toArray();
    const serialized: Record<string, string> = {};
    
    for (const record of records) {
      if (record.blob) {
        serialized[record.id] = await this.serializeBlob(record.blob);
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
      const formattedWords = wordsToRestore.map((w: any) => ({
        ...w,
        translations: w.translations || { 
          ur: w.ur || w.text_primary || '', 
          en: w.en || w.text_secondary || '' 
        },
        transliterations: w.transliterations || {}
      }));
      await universeDb.words.bulkPut(formattedWords);
    }
  },

  async restoreDoodles(snapshot: UniverseSnapshot) {
    const doodles = snapshot.doodles || (snapshot as any).sketches || [];
    if (doodles.length > 0) {
      await universeDb.doodles.bulkPut(doodles);
    }
  },

  async restoreQuotes(snapshot: UniverseSnapshot) {
    if (snapshot.quotes && snapshot.quotes.length > 0) {
      const formattedQuotes = snapshot.quotes.map((q: any, i: number) => {
        const id = q.id || `q${i}`;
        const translations = q.translations || {
          ur: q.ur || q.text_primary || '',
          en: q.en || q.text_secondary || ''
        };
        return {
          ...q,
          id,
          translations,
          // Maintain flat keys if they exist, or sync from translations
          ur: q.ur || translations.ur,
          en: q.en || translations.en
        };
      });
      await universeDb.quotes.bulkPut(formattedQuotes);
    }
  },

  async restoreSettings(snapshot: UniverseSnapshot) {
    const settings = snapshot.settings || [];
    if (settings.length > 0) {
      await universeDb.settings.bulkPut(settings);
    }
  },

  async restoreAudio(snapshot: UniverseSnapshot) {
    if (!snapshot.audio) return;

    for (const [id, dataUrl] of Object.entries(snapshot.audio)) {
      const blob = await this.deserializeBlob(dataUrl);
      await universeDb.audio.put({ id, blob });
    }
  },

  async clearAllLocalData() {
    await Promise.all([
      universeDb.words.clear(),
      universeDb.quotes.clear(),
      universeDb.doodles.clear(),
      universeDb.voices.clear(),
      universeDb.audio.clear(),
      universeDb.settings.clear()
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
