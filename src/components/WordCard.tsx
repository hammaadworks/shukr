import React, { useRef, useMemo } from 'react';
import { Volume2, Plus, Heart } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { IconMap } from '../lib/icons';

export type WordCardVariant = 1 | 2 | 3;

interface WordCardProps {
  item: any;
  isFocused: boolean;
  isFavorite?: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  variant?: WordCardVariant;
  className?: string;
}

/**
 * WordCard - Unified Communication Block
 * Variant 1: Large grid card (Hero style)
 * Variant 2: Compact card (Sentence builder/Affirmations)
 * Variant 3: Minimal list-style card
 */
export const WordCard: React.FC<WordCardProps> = ({ 
  item, 
  isFocused, 
  isFavorite = false,
  onClick, 
  onLongPress,
  variant = 1,
  className = ''
}) => {
  const { isUrdu } = useLanguage();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to prevent text overflow by scaling font size based on length
  const fontSize = useMemo(() => {
    const text = isUrdu ? item.ur : item.en;
    const len = text?.length || 0;
    
    if (variant === 1) {
      if (isUrdu) {
        if (len > 10) return '1.4rem';
        if (len > 6) return '1.8rem';
        return '2.2rem'; // Adjusted for perfect fit
      } else {
        if (len > 10) return '1.2rem';
        if (len > 6) return '1.5rem';
        return '1.8rem'; // Reduced English base size
      }
    }
    if (variant === 2) {
      if (isUrdu) {
        if (len > 10) return '0.85rem';
        return '1rem'; // Reduced to fit mini cards
      } else {
        if (len > 10) return '0.8rem';
        return '1rem';
      }
    }
    return isUrdu ? '1.1rem' : '1rem';
  }, [item, isUrdu, variant]);

  const handlePressStart = () => {
    if (!onLongPress) return;
    timerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress();
      timerRef.current = null;
    }, 800);
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(30);
    onClick();
  };

  const Icon = IconMap[item.icon] || Volume2;
  const isPrompt = item.isPrompt;

  return (
    <button
      className={`word-card-root variant-${variant} ${isFocused ? 'focused-item' : ''} ${isPrompt ? 'prompt-card' : ''} ${isFavorite ? 'is-favorite' : ''} ${className}`}
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {variant === 1 && (
        <div className="card-icon-top-left">
          {isPrompt ? <Plus size={18} /> : 
           isFavorite ? <Heart size={18} fill="#ff3b30" color="#ff3b30" /> : 
           <Icon size={18} />}
        </div>
      )}

      <div className="card-word-display">
        <span className="u-text" style={{ fontSize }}>
          {isUrdu ? item.ur : item.en}
        </span>
      </div>

      {variant !== 3 && (
        <div className="card-bottom-meta">
          <span className="card-transliteration">
            {item.roman || (isUrdu ? item.en : item.ur)}
          </span>
          {variant === 1 && (
            <>
              <span className="card-divider">|</span>
              <span className="card-translation">{isUrdu ? item.en : item.ur}</span>
            </>
          )}
        </div>
      )}
    </button>
  );
};
