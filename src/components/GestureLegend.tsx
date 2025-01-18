import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { type GestureDefinition } from '../recognition/gestures/types';

interface GestureLegendProps {
  lastGesture: string;
  mappings: Record<string, GestureDefinition>;
  onLongPress: (gesture: GestureDefinition) => void;
  gestureHits?: Record<string, number>;
}

const GESTURE_EMOJIS: Record<string, string> = {
  fist: '✊',
  mouth_open: '😮',
  one_finger: '☝️',
  palm: '🖐️'
};

// Fixed English Labels for the top part (as per good.png)
const ENGLISH_ACTIONS: Record<string, string> = {
  mouth_open: 'Select',
  one_finger: 'Next',
  palm: 'Clear',
  fist: 'Yes'
};

export const GestureLegend: React.FC<GestureLegendProps> = ({ lastGesture, mappings, onLongPress, gestureHits = {} }) => {
  const { language } = useLanguage();
  const orderedKeys = ['mouth_open', 'one_finger', 'palm', 'fist'];

  return (
    <div id="gesture-legend-root" className="gesture-legend-container" dir="ltr">
      {orderedKeys.map((key) => {
        const g = mappings[key];
        if (!g) return null;
        
        const isActive = lastGesture === key;
        const hits = gestureHits[key] || 0;
        const progress = Math.min((hits / 5) * 100, 100);

        const emoji = GESTURE_EMOJIS[key] || '👋';
        const localizedLabel = language === 'ur' ? g.label_ur : g.label_en;
        
        return (
          <div 
            key={key}
            className={`gesture-legend-card ${isActive ? 'active' : ''} ${hits > 0 ? 'charging' : ''}`}
            onContextMenu={(e) => {
               e.preventDefault();
               onLongPress(g);
            }}
            onClick={() => {}}
          >
            {/* Visual Charge Progress Bar */}
            {hits > 0 && (
              <div className="gesture-charge-bar-container">
                <div className="gesture-charge-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            <div className="gesture-top-area">
              <span className={`gesture-emoji-large ${hits > 0 ? 'pulse-hit' : ''}`} style={{ 
                transform: hits > 0 ? `scale(${1 + (hits * 0.1)})` : 'scale(1)',
                transition: 'transform 0.1s ease-out'
              }}>
                {emoji}
              </span>
            </div>
            <div className="gesture-bottom-bar">
              <span className={`gesture-label-text ${language === 'ur' ? 'is-urdu' : ''}`}>
                {localizedLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
