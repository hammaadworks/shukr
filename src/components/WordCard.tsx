import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Volume2, Plus, Heart, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { IconMap } from '../lib/icons';

export type WordCardVariant = 1 | 2 | 3 | 4 | 5;

type WordCardItem = {
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
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  variant?: WordCardVariant;
  className?: string;
}

const LONG_PRESS_DELAY = 800;
const DELETE_DELAY = 4000;
const CLICK_VIBRATION_MS = 30;
const LONG_PRESS_VIBRATION_MS = 50;
const DELETE_VIBRATION_MS = 200;

const vibrate = (duration: number) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

const getDisplayText = (item: WordCardItem, isUrdu: boolean): string =>
  isUrdu ? item.ur ?? '' : item.en ?? '';

const getFallbackText = (item: WordCardItem, isUrdu: boolean): string =>
  isUrdu ? item.en ?? '' : item.ur ?? '';

const getFontSize = ({
  textLength,
  variant,
  isUrdu,
}: {
  textLength: number;
  variant: WordCardVariant;
  isUrdu: boolean;
}): string => {
  const sizeMap = {
    1: isUrdu
      ? textLength > 10
        ? '1.4rem'
        : textLength > 6
        ? '1.8rem'
        : '2.2rem'
      : textLength > 10
      ? '1.2rem'
      : textLength > 6
      ? '1.4rem'
      : '1.6rem',

    2: isUrdu
      ? textLength > 10
        ? '1.0rem'
        : '1.2rem'
      : textLength > 10
      ? '0.9rem'
      : '1.1rem',

    3: isUrdu ? '1.4rem' : '1.2rem',
    4: isUrdu ? '1.2rem' : '1.1rem',
    5: isUrdu ? '1.2rem' : '1.1rem',
  } as const;

  return sizeMap[variant];
};

const getCardIcon = ({
  isPrompt,
  iconKey,
}: {
  isPrompt: boolean;
  iconKey?: keyof typeof IconMap;
}): React.ReactNode => {
  if (isPrompt) return <Plus size={18} />;

  const Icon: LucideIcon = IconMap[iconKey ?? ''] || Volume2;
  return <Icon size={18} />;
};

const buildClassName = ({
  variant,
  isFocused,
  isPlaying,
  isPrompt,
  isFavorite,
  className,
}: {
  variant: WordCardVariant;
  isFocused: boolean;
  isPlaying: boolean;
  isPrompt: boolean;
  isFavorite: boolean;
  className?: string;
}) =>
  [
    'word-card-root',
    `variant-${variant}`,
    isFocused && 'focused-item',
    isPlaying && 'is-playing',
    isPrompt && 'prompt-card',
    isFavorite && 'is-favorite',
    className,
  ]
    .filter(Boolean)
    .join(' ');

const shouldShowFullMeta = (variant: WordCardVariant) =>
  variant !== 3 && variant !== 4 && variant !== 5;

const shouldShowTranslationOnly = (variant: WordCardVariant) => variant === 5;

export const WordCard: React.FC<WordCardProps> = ({
  item,
  isFocused,
  isPlaying = false,
  isFavorite = false,
  onClick,
  onLongPress,
  onDelete,
  onToggleFavorite,
  variant = 1,
  className = '',
}) => {
  const { isUrdu } = useLanguage();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPrompt = Boolean(item.isPrompt);

  const displayText = useMemo(() => getDisplayText(item, isUrdu), [item, isUrdu]);
  const fallbackText = useMemo(() => getFallbackText(item, isUrdu), [item, isUrdu]);

  const fontSize = useMemo(
    () =>
      getFontSize({
        textLength: displayText.length,
        variant,
        isUrdu,
      }),
    [displayText.length, variant, isUrdu]
  );

  const clearLongPressTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(
    (callback: () => void, delay: number, vibrationMs: number) => {
      clearLongPressTimer();
      timerRef.current = setTimeout(() => {
        vibrate(vibrationMs);
        callback();
      }, delay);
    },
    [clearLongPressTimer]
  );

  const handlePressStart = useCallback(() => {
    // Word deletion only allowed on variant 1 via long-long press (4s)
    if (onDelete && variant === 1) {
      startTimer(onDelete, DELETE_DELAY, DELETE_VIBRATION_MS);
      return;
    }

    if (onLongPress) {
      startTimer(onLongPress, LONG_PRESS_DELAY, LONG_PRESS_VIBRATION_MS);
    }
  }, [onDelete, onLongPress, startTimer, variant]);

  const handlePressEnd = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      vibrate(CLICK_VIBRATION_MS);
      onClick();
    },
    [onClick]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onToggleFavorite) {
        vibrate(LONG_PRESS_VIBRATION_MS);
        onToggleFavorite();
      }
    },
    [onToggleFavorite]
  );

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onToggleFavorite?.();
    },
    [onToggleFavorite]
  );

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return (
    <button
      type="button"
      className={buildClassName({
        variant,
        isFocused,
        isPlaying,
        isPrompt,
        isFavorite,
        className,
      })}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {variant === 1 && (
        <>
          <div className="card-icon-top-left">
            {getCardIcon({ isPrompt, iconKey: item.icon })}
          </div>

          {onToggleFavorite && (
            <button
              type="button"
              className="card-icon-top-right"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={handleFavoriteClick}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                cursor: 'pointer',
                zIndex: 10,
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                padding: 0,
              }}
            >
              <Heart
                size={18}
                fill={isFavorite ? '#ff3b30' : 'none'}
                color={isFavorite ? '#ff3b30' : '#ccc'}
              />
            </button>
          )}
        </>
      )}

      <div className="card-word-display">
        <span className="u-text" style={{ fontSize }}>
          {displayText}
        </span>
      </div>

      {shouldShowFullMeta(variant) && (
        <div className="card-bottom-meta">
          <span className="card-transliteration">{item.roman || fallbackText}</span>
          <span className="card-divider">|</span>
          <span className="card-translation">{fallbackText}</span>
        </div>
      )}

      {shouldShowTranslationOnly(variant) && (
        <div className="card-bottom-meta">
          <span className="card-translation">{fallbackText}</span>
        </div>
      )}
    </button>
  );
};
