import React from 'react';
import { WordCard } from './WordCard';

interface WordPredictionsProps {
  predictions: any[];
  focusedIndex: number;
  offset: number;
  onSelect?: (item: any) => void;
  className?: string;
}

export const WordPredictions: React.FC<WordPredictionsProps> = ({
  predictions,
  focusedIndex,
  offset,
  onSelect,
  className = '',
}) => {
  if (!predictions || predictions.length === 0) return null;

  return (
    <div className={`word-predictions-container glass-container ${className}`}>
      {predictions.map((item, idx) => (
        <WordCard
          variant={2}
          key={item.id || idx}
          item={item}
          isFocused={focusedIndex === offset + idx}
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
};
