import React from 'react';
import { WordCard } from './WordCard';
import { useLanguage } from '../hooks/useLanguage';

interface WordPredictionsProps {
  predictions: any[];
  focusedIndex: number;
  offset: number;
  onSelect?: (item: any) => void;
  className?: string;
}

export const WordPredictions: React.FC<WordPredictionsProps> = React.memo(({
  predictions,
  focusedIndex,
  offset,
  onSelect,
  className = '',
}) => {
  const { isPrimary } = useLanguage();
  if (!predictions || predictions.length === 0) return null;

  return (
    <div className={`word-predictions-container glass-container ${className}`} dir="ltr">
      {predictions.map((item, idx) => (
        <WordCard
          variant={2}
          key={item.id || idx}
          item={item}
          isFocused={focusedIndex === offset + idx}
          isPrimary={isPrimary}
          onClick={() => {
            if (onSelect) {
              onSelect(item);
            } else if (item.onClick) {
              item.onClick();
            }
          }}
        />
      ))}
    </div>
  );
});
