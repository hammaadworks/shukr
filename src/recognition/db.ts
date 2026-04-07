import Dexie, { type Table } from 'dexie';

export type SketchRecognitionMode = 
  | 'numbers' 
  | 'english' 
  | 'urdu' 
  | 'needs' 
  | 'contacts' 
  | 'custom' 
  | 'auto';

export type StrokePoint = {
  x: number;
  y: number;
  t?: number;
};

export type Stroke = StrokePoint[];

export type UserSketchTemplate = {
  id: string;
  label: string;
  en: string;
  ur: string;
  category: SketchRecognitionMode;
  strokes: Stroke[];
  createdAt: number;
};

export class RecognitionDatabase extends Dexie {
  templates!: Table<UserSketchTemplate>;

  constructor() {
    super('shukr_recognition_db');
    this.version(1).stores({
      templates: '++id, label, en, category, createdAt'
    });
  }
}

export const db = new RecognitionDatabase();
