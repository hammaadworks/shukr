import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Volume2, Plus, Heart, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { IconMap } from '../lib/icons';

export type WordCardVariant = 1 | 2 | 3 | 4 | 5;

export type WordCardItem = {
  id: string;
  text_primary?: string;
  text_secondary?: string;
  en?: string;
  ur?: string;
  roman?: string;
  icon?: keyof typeof IconMap;
  isPrompt?: boolean;
};

interface WordCardProps {
  item: WordCardItem;
  isFocused: boolean;
  isPlaying?: boolean;
  isFavorite?: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  variant?: WordCardVariant;
  className?: string;
  isPrimary?: boolean; // Optional override
  languageOverride?: string; // e.g. 'en', 'ur', 'es', 'ar'
}

const LONG_PRESS_DELAY = 800; // For Favorites
const EDIT_PRESS_DELAY = 2500; // 2.5 Seconds for Editing
const CLICK_VIBRATION_MS = 30;
const LONG_PRESS_VIBRATION_MS = 50;
const EDIT_VIBRATION_MS = [100, 50, 100]; 

const vibrate = (duration: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

const getDisplayText = (item: WordCardItem, isPrimary: boolean, languageOverride?: string): string => {
  if (languageOverride) {
    return (item as any)[languageOverride] || item.ur || item.text_primary || '';
  }
  const primary = item.text_primary || item.ur;
  const secondary = item.text_secondary || item.en;
  return isPrimary ? (primary ?? '') : (secondary ?? '');
};

const getFallbackText = (item: WordCardItem, isPrimary: boolean, languageOverride?: string): string => {
  if (languageOverride) {
    // If we have an override, maybe fallback to English if it's not the override
    return languageOverride === 'en' ? (item.ur || item.text_primary || '') : (item.en || item.text_secondary || '');
  }
  const primary = item.text_primary || item.ur;
  const secondary = item.text_secondary || item.en;
  return isPrimary ? (secondary ?? '') : (primary ?? '');
};

const getFontSize = ({
  textLength,
  variant,
  isPrimary,
}: {
  textLength: number;
  variant: WordCardVariant;
  isPrimary: boolean;
}): string => {
  const sizeMap = {
    1: isPrimary
      ? textLength > 10 ? '1.4rem' : textLength > 6 ? '1.8rem' : '2.2rem'
      : textLength > 10 ? '1.2rem' : textLength > 6 ? '1.4rem' : '1.6rem',
    2: isPrimary
      ? textLength > 10 ? '1.0rem' : '1.2rem'
      : textLength > 10 ? '0.9rem' : '1.1rem',
    3: isPrimary ? '1.4rem' : '1.2rem',
    4: isPrimary ? '1.2rem' : '1.1rem',
    5: isPrimary ? '1.2rem' : '1.1rem',
  } as const;
  return sizeMap[variant];
};

const getCardIcon = ({ isPrompt, iconKey }: { isPrompt: boolean; iconKey?: keyof typeof IconMap; }): React.ReactNode => {
  if (isPrompt) return <Plus size={18} />;
  if (!iconKey) return null;
  const Icon: LucideIcon = IconMap[iconKey] || Volume2;
  return <Icon size={18} />;
};

const buildClassName = ({ variant, isFocused, isPlaying, isPrompt, isFavorite, className }: any) =>
  [
    'word-card-root',
    `variant-${variant}`,
    isFocused && 'focused-item',
    isPlaying && 'is-playing',
    isPrompt && 'prompt-card',
    isFavorite && 'is-favorite',
    className,
  ].filter(Boolean).join(' ');

export const WordCard: React.FC<WordCardProps> = React.memo(({
  item,
  isFocused,
  isPlaying = false,
  isFavorite = false,
  onClick,
  onEdit,
  onDelete,
  onToggleFavorite,
  variant = 1,
  className = '',
  isPrimary: isPrimaryOverride,
  languageOverride,
}) => {
  const { isPrimary: isPrimaryFromHook } = useLanguage();
  const isPrimary = isPrimaryOverride !== undefined ? isPrimaryOverride : isPrimaryFromHook;
  
  const favTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPrompt = Boolean(item.isPrompt);
  const displayText = useMemo(() => getDisplayText(item, isPrimary, languageOverride), [item, isPrimary, languageOverride]);
  const fallbackText = useMemo(() => getFallbackText(item, isPrimary, languageOverride), [item, isPrimary, languageOverride]);
  const fontSize = useMemo(() => getFontSize({ textLength: displayText.length, variant, isPrimary }), [displayText.length, variant, isPrimary]);

  const clearAllTimers = useCallback(() => {
    if (favTimerRef.current) clearTimeout(favTimerRef.current);
    if (editTimerRef.current) clearTimeout(editTimerRef.current);
    favTimerRef.current = null;
    editTimerRef.current = null;
  }, []);

  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isPrompt) return;
    
    if (variant === 1) {
      // For Variant 1: Only Edit Mode on Long Press (800ms)
      if (onEdit) {
        editTimerRef.current = setTimeout(() => {
          vibrate(EDIT_VIBRATION_MS);
          onEdit();
          clearAllTimers();
        }, LONG_PRESS_DELAY);
      }
    } else {
      // For Other Variants: Existing behavior
      // 1. Favorite Toggle (800ms)
      favTimerRef.current = setTimeout(() => {
        vibrate(LONG_PRESS_VIBRATION_MS);
        onToggleFavorite?.();
      }, LONG_PRESS_DELAY);

      // 2. Edit Mode (2500ms)
      if (onEdit) {
        editTimerRef.current = setTimeout(() => {
          if (favTimerRef.current) clearTimeout(favTimerRef.current);
          vibrate(EDIT_VIBRATION_MS);
          onEdit();
          clearAllTimers();
        }, EDIT_PRESS_DELAY);
      }
    }
  }, [isPrompt, variant, onToggleFavorite, onEdit, clearAllTimers]);

  const handlePressEnd = useCallback(() => {
    clearAllTimers();
  }, [clearAllTimers]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(CLICK_VIBRATION_MS);
    onClick();
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const shouldShowFullMeta = variant !== 3 && variant !== 4 && variant !== 5;
  const shouldShowTranslationOnly = variant === 5;

  return (
    <div
      role="button"
      tabIndex={0}
      className={buildClassName({ variant, isFocused, isPlaying, isPrompt, isFavorite, className })}
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
      style={{ '--font-size': fontSize } as React.CSSProperties}
    >
      {variant !== 2 && variant !== 3 && (
        <div className="card-icon-top-left">
          {getCardIcon({ isPrompt, iconKey: item.icon })}
        </div>
      )}

      {onToggleFavorite && !isPrompt && variant !== 2 && (
        <div 
          className="card-icon-top-right"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          style={{ cursor: 'pointer', zIndex: 10, position: 'absolute', top: '8px', right: '8px' }}
        >
          <Heart size={18} fill={isFavorite ? '#ff3b30' : 'none'} color={isFavorite ? '#ff3b30' : '#ccc'} />
        </div>
      )}

      <div className="card-word-display">
        <span className="u-text" style={{ fontSize }}>{displayText}</span>
      </div>

      {shouldShowFullMeta && (
        <div className="card-bottom-meta">
          {item.roman && <span className="card-transliteration">{item.roman}</span>}
          {item.roman && <span className="card-divider">|</span>}
          <span className="card-translation">{fallbackText}</span>
        </div>
      )}

      {shouldShowTranslationOnly && (
        <div className="card-bottom-meta">
          <span className="card-translation">{fallbackText}</span>
        </div>
      )}
    </div>
  );
});
