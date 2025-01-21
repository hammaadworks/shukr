import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { type GestureDefinition } from '../recognition/gestures/types';
import { useLongPress } from '../hooks/useLongPress';

interface GestureLegendProps {
  lastGesture: string;
  mappings: Record<string, GestureDefinition>;
  onLongPress: (gesture: GestureDefinition) => void;
  onTrigger: (gestureKey: string) => void;
  gestureHits?: Record<string, number>;
}

const GESTURE_EMOJIS: Record<string, string> = {
  fist: '✊',
  mouth_open: '😮',
  one_finger: '☝️',
  palm: '🖐️'
};

export const GestureLegend: React.FC<GestureLegendProps> = ({ lastGesture, mappings, onLongPress, onTrigger, gestureHits = {} }) => {
  const { language } = useLanguage();
  const orderedKeys = ['mouth_open', 'one_finger', 'palm', 'fist'];

  return (
    <div id="gesture-legend-root" className="gesture-legend-container" dir="ltr">
      {orderedKeys.map((key) => {
        const g = mappings[key];
        if (!g) return null;
        
        return (
          <GestureItem 
            key={key}
            gestureKey={key}
            gesture={g}
            isActive={lastGesture === key}
            hits={gestureHits[key] || 0}
            language={language}
            onLongPress={onLongPress}
            onTrigger={onTrigger}
          />
        );
      })}
    </div>
  );
};

interface GestureItemProps {
  gestureKey: string;
  gesture: GestureDefinition;
  isActive: boolean;
  hits: number;
  language: string;
  onLongPress: (gesture: GestureDefinition) => void;
  onTrigger: (gestureKey: string) => void;
}

const GestureItem: React.FC<GestureItemProps> = ({ gestureKey, gesture, isActive, hits, language, onLongPress, onTrigger }) => {
  const progress = Math.min((hits / 5) * 100, 100);
  const emoji = GESTURE_EMOJIS[gestureKey] || '👋';
  const localizedLabel = language === 'ur' ? gesture.label_ur : gesture.label_en;

  const longPressProps = useLongPress(
    () => {
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress(gesture);
    },
    () => onTrigger(gestureKey),
    { delay: 600 }
  );

  return (
    <div 
      className={`gesture-legend-card ${isActive ? 'active' : ''} ${hits > 0 ? 'charging' : ''}`}
      {...longPressProps}
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
};
