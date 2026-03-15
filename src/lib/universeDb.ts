import Dexie, { type Table } from 'dexie';
import { DB_NAME, DB_VERSION, TABLES } from './constants';
import type { Stroke } from '../recognition/sketchTypes';

export interface WordUniverseItem {
  id: string;
  icon: string;
  next: string[];
  usageCount: number;
  lastUsedAt: number;
  timeBias: number[];
  doodle_shapes: string[];
  translations: Record<string, string>;
  transliterations: Record<string, Record<string, string>>;
  verified?: boolean;
  ur?: string;
  en?: string;
  roman?: string;
  transitions?: Record<string, number>;
  category?: string;
  categoryId?: string;
}

export interface DoodleItem {
  id: string;
  wordId: string;
  label?: string;
  en?: string;
  ur?: string;
  strokes: Stroke[];
}

export interface QuoteItem {
  id?: number; // Primary Key (Stable Integer)
  translations: Record<string, string>;
  source: string;
  ur?: string;
  en?: string;
}

export interface Voice {
  numericId?: number; // Primary Key (Stable Integer)
  id: string; // Business Key (Slug / String ID)
  name: string;
  language?: string;
  editable?: boolean;
}

export interface AudioItem {
  voiceNumericId: number; // Foreign Key to voice.numericId
  wordId: string; // Business Key to word.id
  blob: Blob;
}

export interface SettingsItem {
  key: string;
  value: any;
}

export class WordUniverseDatabase extends Dexie {
  words!: Table<WordUniverseItem>;
  doodles!: Table<DoodleItem>;
  quotes!: Table<QuoteItem>;
  voices!: Table<Voice>;
  audio!: Table<AudioItem>;
  settings!: Table<SettingsItem>;

  constructor() {
    super(DB_NAME);

    // Version 1: The Gold Standard Baseline.
    // Stable Integer Primary Keys for Voices and Quotes.
    // Normalized Audio table using voiceNumericId.
    this.version(DB_VERSION).stores({
        [TABLES.WORDS]: 'id, usageCount, lastUsedAt, *doodle_shapes, verified',
        [TABLES.DOODLES]: 'id, wordId',
        [TABLES.QUOTES]: '++id',
        [TABLES.VOICES]: '++numericId, &id, name, language',
        [TABLES.AUDIO]: '[voiceNumericId+wordId], voiceNumericId, wordId',
        [TABLES.SETTINGS]: 'key'
    });
  }
}

export const universeDb = new WordUniverseDatabase();
