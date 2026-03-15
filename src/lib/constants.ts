/**
 * Global Constants & Key Generators
 */

// Database configuration
export const DB_NAME = 'shukr_universe_v1';
export const DB_VERSION = 2;

// Table Names
export const TABLES = {
  WORDS: 'words',
  DOODLES: 'doodles',
  QUOTES: 'quotes',
  VOICES: 'voices',
  AUDIO: 'audio',
  SETTINGS: 'settings',
} as const;

/**
 * @deprecated Audio is now stored in IndexedDB using numeric foreign keys.
 * This is kept only for identifying static assets in src/lib/data/audio/
 */
export const generateAudioStorageKey = (wordId: string, voiceId: string): string => {
  if (!wordId || !voiceId) {
    console.warn('[Constants] generateAudioStorageKey called with missing parameters:', { wordId, voiceId });
  }
  return `${voiceId}_${wordId}`;
};

/**
 * Parses an audio storage key back into its components.
 * Useful for extraction scripts.
 * @param storageKey The composite key string
 * @returns The wordId and voiceId
 */
export const parseAudioStorageKey = (storageKey: string) => {
  // Format: <lang>_voice_<name>_<wordId>
  // e.g., en_voice_hammaad_want
  const parts = storageKey.split('_');
  if (parts.length >= 4) {
    const lang = parts[0];
    const voice = parts[1];
    const name = parts[2];
    const wordId = parts.slice(3).join('_'); // Word ID could potentially contain underscores
    return {
      voiceId: `${lang}_${voice}_${name}`,
      wordId
    };
  }
  return { voiceId: '', wordId: storageKey };
};
