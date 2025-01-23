import Dexie, { type Table } from 'dexie';
import type { SketchRecognitionMode, Stroke } from '../recognition/db';

export interface WordUniverseItem {
  id: string;
  text_primary: string;
  text_secondary: string;
  en: string; // Legacy support
  ur: string; // Legacy support
  transliterations: Record<string, string>;
  category: string;
  icon: string;
  type: 'word' | 'phrase' | 'number' | 'alphabet' | 'contact';
  usageCount: number;
  lastUsedAt: number;
  timeBias?: number[];
  next: string[];
  tags: string[];
}

export interface CategoryFolder {
  id: string;
  label_primary: string;
  label_secondary: string;
  label_en: string; // Legacy support
  label_ur: string; // Legacy support
  icon: string;
  order: number;
  isSystem?: boolean;
}

export interface QuoteItem {
  id: string;
  text_primary: string;
  text_secondary: string;
  ur: string; // Legacy support
  en: string; // Legacy support
  source: string;
  createdAt: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  createdAt: number;
}

export interface SketchTemplate {
  id: string;
  wordId: string;
  label: string;
  category: SketchRecognitionMode;
  strokes: Stroke[];
  createdAt: number;
}

export class WordUniverseDatabase extends Dexie {
  words!: Table<WordUniverseItem>;
  categories!: Table<CategoryFolder>;
  sketchTemplates!: Table<SketchTemplate>;
  quotes!: Table<QuoteItem>;
  voiceProfiles!: Table<VoiceProfile>;

  constructor() {
    super('shukr_universe_db');
    this.version(1).stores({
      words: '++id, en, category, type, usageCount, lastUsedAt',
      categories: 'id, order',
      sketchTemplates: '++id, wordId, category, createdAt'
    });
    this.version(2).stores({
      words: '++id, en, category, type, usageCount, lastUsedAt',
      categories: 'id, order',
      sketchTemplates: '++id, wordId, category, createdAt',
      quotes: '++id, en, createdAt'
    });
    this.version(4).stores({
      words: '++id, en, category, type, usageCount, lastUsedAt',
      sketchTemplates: '++id, wordId, category, createdAt',
      quotes: '++id, en, createdAt',
      voiceProfiles: 'id, name, createdAt'
    });
    this.version(5).stores({
      words: 'id, en, category, type, usageCount, lastUsedAt',
      sketchTemplates: 'id, wordId, category, createdAt',
      quotes: 'id, en, createdAt',
      voiceProfiles: 'id, name, createdAt'
    });
  }
}

export const universeDb = new WordUniverseDatabase();
