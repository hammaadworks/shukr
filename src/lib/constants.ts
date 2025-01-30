/**
 * Global Constants & Key Generators
 */

// Database configuration
export const DB_NAME = 'shukr_universe_db';
export const DB_VERSION = 1;

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
 * Generates a unique key for audio storage.
 * @param wordId The unique ID of the word (e.g., 'want')
 * @param voiceId The voice ID which includes the language (e.g., 'en_voice_hammaad')
 * @returns A composite key string (e.g., 'en_voice_hammaad_want')
 */
export const generateAudioStorageKey = (wordId: string, voiceId: string): string => {
  if (!wordId || !voiceId) {
    console.warn('[Constants] generateAudioStorageKey called with missing parameters:', { wordId, voiceId });
  }
  return `${voiceId}_${wordId}`;
};

/**
 * Generates a unique key for quotes.
 * @returns A unique quote ID (e.g., 'q_1712451857000')
 */
export const generateQuoteId = (): string => {
  return `q_${Date.now()}`;
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
