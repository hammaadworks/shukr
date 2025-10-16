import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface GestureLegendProps {
  lastGesture: string;
}

export const GestureLegend: React.FC<GestureLegendProps> = ({ lastGesture }) => {
  const { isUrdu } = useLanguage();

  const gestures = [
    { id: 'SELECT', icon: '✊', labelEn: 'Select', labelUr: 'منتخب کریں', activeKey: 'fist' },
    { id: 'NEXT', icon: '☝️', labelEn: 'Next', labelUr: 'اگلا', activeKey: 'one_finger' },
    { id: 'PREV', icon: '✌️', labelEn: 'Prev', labelUr: 'پچھلا', activeKey: 'two_fingers' },
    { id: 'SPEAK', icon: '😮', labelEn: 'Speak', labelUr: 'بولیں', activeKey: 'mouth_open' },
    { id: 'CLEAR', icon: '🖐️', labelEn: 'Clear', labelUr: 'صاف کریں', activeKey: 'palm' },
  ];

  return (
    <div className="gesture-legend-container" dir={isUrdu ? 'rtl' : 'ltr'}>
      {gestures.map((g) => {
        const isActive = lastGesture === g.id;
        return (
          <div key={g.id} className={`gesture-item ${isActive ? 'gesture-active' : ''}`}>
            <span className="gesture-icon">{g.icon}</span>
            <span className="gesture-label">{isUrdu ? g.labelUr : g.labelEn}</span>
          </div>
        );
      })}
    </div>
  );
};
