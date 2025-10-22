import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface GestureLegendProps {
  lastGesture: string;
}

export const GestureLegend: React.FC<GestureLegendProps> = ({ lastGesture }) => {
  const { isUrdu } = useLanguage();

  const gestures = [
    { id: 'SELECT', icon: '✊', labelEn: 'Select', labelUr: 'منتخب کریں' },
    { id: 'NEXT', icon: '☝️', labelEn: 'Next', labelUr: 'اگلا' },
    { id: 'PREV', icon: '✌️', labelEn: 'Prev', labelUr: 'پچھلا' },
    { id: 'YES', icon: '👍', labelEn: 'Yes', labelUr: 'جی ہاں' },
    { id: 'CLEAR', icon: '🖐️', labelEn: 'Clear', labelUr: 'صاف کریں' },
  ];
  return (
    <div className="gesture-legend-container" dir={isUrdu ? 'rtl' : 'ltr'}>
      {gestures.map((g) => {
        const isActive = lastGesture === g.id;
        return (
          <div key={g.id} className={`gesture-item ${isActive ? 'gesture-active' : ''}`}>
            <span className="gesture-icon">{g.icon}</span>
            <span className="gesture-label mobile-small-text">{isUrdu ? g.labelUr : g.labelEn}</span>
          </div>
        );
      })}
    </div>
  );
};
