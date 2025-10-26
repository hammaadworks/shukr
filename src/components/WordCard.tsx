import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Volume2, Plus, Heart, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { IconMap } from '../lib/icons';

export type WordCardVariant = 1 | 2 | 3;

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
    isFavorite?: boolean;
    onClick: () => void;
    onLongPress?: () => void;
    variant?: WordCardVariant;
    className?: string;
}

const LONG_PRESS_DELAY = 800;
const CLICK_VIBRATION_MS = 30;
const LONG_PRESS_VIBRATION_MS = 50;

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
    if (variant === 1) {
        if (isUrdu) {
            if (textLength > 10) return '1.1rem';
            if (textLength > 6) return '1.4rem';
            return '1.8rem';
        }

        if (textLength > 10) return '1.0rem';
        if (textLength > 6) return '1.2rem';
        return '1.4rem';
    }

    if (variant === 2) {
        if (isUrdu) {
            if (textLength > 10) return '0.85rem';
            return '0.95rem';
        }

        if (textLength > 10) return '0.8rem';
        return '0.9rem';
    }

    return isUrdu ? '1.1rem' : '1rem';
};

const getCardIcon = ({
                         isPrompt,
                         isFavorite,
                         iconKey,
                     }: {
    isPrompt: boolean;
    isFavorite: boolean;
    iconKey?: keyof typeof IconMap;
}): React.ReactNode => {
    if (isPrompt) return <Plus size={18} />;

    if (isFavorite) {
        return <Heart size={18} fill="#ff3b30" color="#ff3b30" />;
    }

    const Icon: LucideIcon = IconMap[iconKey ?? ''] || Volume2;
    return <Icon size={18} />;
};

const buildClassName = ({
                            variant,
                            isFocused,
                            isPrompt,
                            isFavorite,
                            className,
                        }: {
    variant: WordCardVariant;
    isFocused: boolean;
    isPrompt: boolean;
    isFavorite: boolean;
    className?: string;
}) =>
    [
        'word-card-root',
        `variant-${variant}`,
        isFocused && 'focused-item',
        isPrompt && 'prompt-card',
        isFavorite && 'is-favorite',
        className,
    ]
        .filter(Boolean)
        .join(' ');

export const WordCard: React.FC<WordCardProps> = ({
                                                      item,
                                                      isFocused,
                                                      isFavorite = false,
                                                      onClick,
                                                      onLongPress,
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

    const handlePressStart = useCallback(() => {
        if (!onLongPress) return;

        timerRef.current = setTimeout(() => {
            vibrate(LONG_PRESS_VIBRATION_MS);
            onLongPress();
            timerRef.current = null;
        }, LONG_PRESS_DELAY);
    }, [onLongPress]);

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
                isPrompt,
                isFavorite,
                className,
            })}
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
                    {getCardIcon({
                        isPrompt,
                        isFavorite,
                        iconKey: item.icon,
                    })}
                </div>
            )}

            <div className="card-word-display">
        <span className="u-text" style={{ fontSize }}>
          {displayText}
        </span>
            </div>

            {variant !== 3 && (
                <div className="card-bottom-meta">
          <span className="card-transliteration">
            {item.roman || fallbackText}
          </span>
                    <span className="card-divider">|</span>
                    <span className="card-translation">{fallbackText}</span>
                </div>
            )}
        </button>
    );
};