import Dexie, { type Table } from 'dexie';
import type { SketchRecognitionMode, Stroke } from '../recognition/db';

export interface WordUniverseItem {
  id: string;
  en: string;
  ur: string;
  roman?: string;
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
  label_en: string;
  label_ur: string;
  icon: string;
  order: number;
  isSystem?: boolean;
}

export interface QuoteItem {
  id: string;
  ur: string;
  en: string;
  source: string;
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
  }
}

export const universeDb = new WordUniverseDatabase();
