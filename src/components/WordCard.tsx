import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Volume2, Plus, Heart, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { IconMap } from '../lib/icons';
import { translator } from '../lib/translator';

export type WordCardVariant = 1 | 2 | 3 | 4 | 5;

export type WordCardItem = {
  id: string;
  translations?: Record<string, string>;
  text_primary?: string;
  text_secondary?: string;
  en?: string;
  ur?: string;
  roman?: string;
  transliterations?: Record<string, any>;
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
  languageOverride?: string; // Overrides the display language
  helperLanguageOverride?: string; // Overrides the translation/transliteration language
  forceDualMode?: boolean; // Forces dual mode regardless of app settings
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

const getDisplayText = (item: WordCardItem, selectedLang: string): string => {
  const t = translator.getTranslation(item.id, selectedLang);
  if (t) return t;
  
  if (selectedLang === 'ur' && item.ur) return item.ur;
  if (selectedLang === 'en' && item.en) return item.en;
  if (selectedLang === 'es' && (item as any).es) return (item as any).es;
  if (selectedLang === 'ar' && (item as any).ar) return (item as any).ar;
  
  return item.text_primary || item.ur || item.text_secondary || item.en || '';
};

const getFallbackText = (item: WordCardItem, unselectedLang: string): string => {
  const t = translator.getTranslation(item.id, unselectedLang);
  if (t) return t;

  if (unselectedLang === 'en' && item.en) return item.en;
  if (unselectedLang === 'ur' && item.ur) return item.ur;
  if (unselectedLang === 'es' && (item as any).es) return (item as any).es;
  if (unselectedLang === 'ar' && (item as any).ar) return (item as any).ar;
  
  return item.text_secondary || item.en || item.text_primary || item.ur || '';
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
  // @ts-ignore
  onDelete,
  onToggleFavorite,
  variant = 1,
  className = '',
  isPrimary: isPrimaryOverride,
  languageOverride,
  helperLanguageOverride,
  forceDualMode,
}) => {
  const { isPrimary: isPrimaryFromHook, primaryLanguage, secondaryLanguage, isDualMode: isDualModeFromHook } = useLanguage();
  const isPrimary = isPrimaryOverride !== undefined ? isPrimaryOverride : isPrimaryFromHook;
  const isDualMode = forceDualMode !== undefined ? forceDualMode : isDualModeFromHook;
  
  const selectedLang = languageOverride || (isPrimary ? primaryLanguage : secondaryLanguage);
  const unselectedLang = helperLanguageOverride || (isPrimary ? secondaryLanguage : primaryLanguage);

  const favTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPrompt = Boolean(item.isPrompt);
  
  const displayText = useMemo(() => getDisplayText(item, selectedLang), [item, selectedLang]);
  const fallbackText = useMemo(() => getFallbackText(item, unselectedLang), [item, unselectedLang]);
  const fontSize = useMemo(() => getFontSize({ textLength: displayText.length, variant, isPrimary }), [displayText.length, variant, isPrimary]);

  const transliteration = useMemo(() => {
    const result = translator.getTransliteration(item.id, selectedLang, unselectedLang);
    if (result) return result;
    if (item.roman && unselectedLang === 'en') return item.roman;
    return null;
  }, [item.id, item.roman, selectedLang, unselectedLang]);

  const clearAllTimers = useCallback(() => {
    if (favTimerRef.current) clearTimeout(favTimerRef.current);
    if (editTimerRef.current) clearTimeout(editTimerRef.current);
    favTimerRef.current = null;
    editTimerRef.current = null;
  }, []);

  const handlePressStart = useCallback((_e: React.MouseEvent | React.TouchEvent) => {
    if (isPrompt) return;
    
    if (variant === 1) {
      if (onEdit) {
        editTimerRef.current = setTimeout(() => {
          vibrate(EDIT_VIBRATION_MS);
          onEdit();
          clearAllTimers();
        }, LONG_PRESS_DELAY);
      }
    } else {
      favTimerRef.current = setTimeout(() => {
        vibrate(LONG_PRESS_VIBRATION_MS);
        onToggleFavorite?.();
      }, LONG_PRESS_DELAY);

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

  // Variant 3, 4, 5 typically don't show full meta
  const shouldShowFullMeta = isDualMode && variant !== 3 && variant !== 4 && variant !== 5;
  const shouldShowTranslationOnly = isDualMode && variant === 5;

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
          {transliteration && <span className="card-transliteration">{transliteration}</span>}
          {transliteration && <span className="card-divider">|</span>}
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
