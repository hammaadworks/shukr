import React from 'react';
import { WordCard } from './WordCard';
import { useLanguage } from '../hooks/useLanguage';

interface GestureLegendProps {
  lastGesture: string;
}

export const GestureLegend: React.FC<GestureLegendProps> = ({ lastGesture }) => {
  const { isUrdu } = useLanguage();

  const gestures = [
    { id: 'CLEAR', emoji: '🖐️', en: 'Clear', ur: 'صاف کریں' },
    { id: 'YES', emoji: '👍', en: 'Yes', ur: 'جی ہاں' },
    { id: 'PREV', emoji: '✌️', en: 'Prev', ur: 'پچھلا' },
    { id: 'NEXT', emoji: '☝️', en: 'Next', ur: 'اگلا' },
    { id: 'SELECT', emoji: '✊', en: 'Select', ur: 'منتخب کریں' },
  ];

  return (
    <div className="gesture-legend-container" dir="ltr">
      {gestures.map((g) => (
        <WordCard
          key={g.id}
          variant={2}
          item={{
            id: g.id,
            ur: g.emoji,
            en: g.emoji,
            roman: g.en,
            // We force the meta to show En | Ur by tricking the WordCard fields
            ...(isUrdu ? { en: g.ur } : { ur: g.ur })
          }}
          isFocused={lastGesture === g.id}
          onClick={() => {}}
          className="gesture-mini-card"
        />
      ))}
    </div>
  );
};
