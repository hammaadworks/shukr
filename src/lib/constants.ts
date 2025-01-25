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
  VOICE_PROFILES: 'voiceProfiles',
  AUDIO: 'audio',
  SETTINGS: 'settings',
} as const;

/**
 * Generates a unique key for audio storage.
 * @param wordId The unique ID of the word (e.g., 'want')
 * @param voiceProfileId The profile ID which includes the language (e.g., 'en_voice_hammaad')
 * @returns A composite key string (e.g., 'en_voice_hammaad_want')
 */
export const generateAudioStorageKey = (wordId: string, voiceProfileId: string): string => {
  if (!wordId || !voiceProfileId) {
    console.warn('[Constants] generateAudioStorageKey called with missing parameters:', { wordId, voiceProfileId });
  }
  return `${voiceProfileId}_${wordId}`;
};

/**
 * Parses an audio storage key back into its components.
 * Useful for extraction scripts.
 * @param storageKey The composite key string
 * @returns The wordId and voiceProfileId
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
      voiceProfileId: `${lang}_${voice}_${name}`,
      wordId
    };
  }
  return { voiceProfileId: '', wordId: storageKey };
};
