import React from 'react';
import { WordCard } from './WordCard';
import { useLanguage } from '../hooks/useLanguage';

interface GestureLegendProps {
  lastGesture: string;
}

export const GestureLegend: React.FC<GestureLegendProps> = ({ lastGesture }) => {
  const { isUrdu } = useLanguage();

  const gestures = [
    { id: 'SELECT', emoji: '😮', en: 'Select', ur: 'منتخب کریں' },
    { id: 'YES', emoji: '👍', en: 'Yes', ur: 'جی ہاں' },
    { id: 'CLEAR', emoji: '🖐️', en: 'Clear', ur: 'صاف کریں' },
    { id: 'NEXT', emoji: '☝️', en: 'Next', ur: 'اگلا' },
  ];

  return (
    <div className="gesture-legend-container" dir="ltr">
      {gestures.map((g) => (
        <WordCard
          key={g.id}
          variant={5}
          item={isUrdu 
            ? { id: g.id, ur: g.emoji, en: g.ur } 
            : { id: g.id, en: g.emoji, ur: g.en }
          }
          isFocused={lastGesture === g.id}
          onClick={() => {}}
          className="gesture-mini-card"
        />
      ))}
    </div>
  );
};
