export type RecognitionMode = 
  | 'numbers' 
  | 'english' 
  | 'urdu' 
  | 'needs' 
  | 'contacts' 
  | 'custom' 
  | 'auto';

export interface Point {
  x: number;
  y: number;
  t?: number;
}

export type Stroke = Point[];

export interface RecognitionResult {
  label: string;
  ur?: string;
  en: string;
  confidence: number;
  type: 'digit' | 'letter' | 'urdu' | 'need' | 'contact' | 'custom' | 'word';
  icon?: string;
}

export interface UserSketchTemplate {
  id: string;
  label: string;
  en: string;
  ur: string;
  category: RecognitionMode;
  strokes: Stroke[];
  createdAt: number;
}
