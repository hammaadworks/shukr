import React from 'react';
import { WordCard } from './WordCard';
import { useLanguage } from '../hooks/useLanguage';
import { type GestureDefinition } from '../recognition/gestures/types';

interface GestureLegendProps {
  lastGesture: string;
  mappings: Record<string, GestureDefinition>;
  onLongPress: (gesture: GestureDefinition) => void;
}

const GESTURE_EMOJIS: Record<string, string> = {
  fist: '✊',
  mouth_open: '😮',
  one_finger: '☝️',
  two_fingers: '✌️',
  thumb_up: '👍',
  palm: '🖐️',
  peace_sign: '🖖',
  three_fingers: '🤟'
};

const getLocalizedActionLabel = (g: GestureDefinition, lang: string): string => {
  // If it's Urdu, we have a fixed label.
  if (lang === 'ur') return g.label_ur;
  // If it's English, we have a fixed label.
  if (lang === 'en') return g.label_en;
  
  // For others (Spanish, Arabic), we might want to translate or just use ID/English for now.
  // Ideally, we'd have these in our i18n JSON files too.
  // For now, return label_en as a generic fallback.
  return g.label_en;
};

export const GestureLegend: React.FC<GestureLegendProps> = ({ lastGesture, mappings, onLongPress }) => {
  const { isPrimary, language } = useLanguage();
  
  const orderedKeys = ['mouth_open', 'one_finger', 'palm', 'fist'];

  return (
    <div className="gesture-legend-container" dir="ltr">
      {orderedKeys.map((key) => {
        const g = mappings[key];
        if (!g) return null;
        const isActive = lastGesture === key;
        const emoji = GESTURE_EMOJIS[key] || '👋';
        const label = getLocalizedActionLabel(g, language);
        
        return (
          <WordCard
            key={key}
            variant={5}
            item={{
              id: `gesture_${key}`,
              // Primary is the visual symbol
              text_primary: emoji,
              // Secondary is the human-readable action
              text_secondary: label,
              ur: emoji,
              en: label,
              roman: label
            }}
            isFocused={isActive}
            onClick={() => {}}
            onEdit={() => onLongPress(g)}
            className="gesture-mini-card"
          />
        );
      })}
    </div>
  );
};
