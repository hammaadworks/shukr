import React from 'react';
import { WordCard } from './WordCard';

interface PredictionScrollerProps {
  predictions: any[];
  focusedIndex: number;
  offset: number;
}

export const PredictionScroller: React.FC<PredictionScrollerProps> = ({
  predictions,
  focusedIndex,
  offset,
}) => {
  if (!predictions || predictions.length === 0) return null;

  return (
    <div className="prediction-scroller glass-container">
      {predictions.map((item, idx) => (
        <WordCard
          variant={2}
          key={item.id}
          item={item}
          isFocused={focusedIndex === offset + idx}
          onClick={item.onClick}
        />
      ))}
    </div>
  );
};
