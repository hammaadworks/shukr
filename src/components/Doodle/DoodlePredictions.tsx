import React from 'react';
import { WordCard } from '../WordCard';

interface DoodlePredictionsProps {
  predictions: any[];
  onSelect: (item: any) => void;
  focusedIndex: number;
  offset: number;
}

export const DoodlePredictions: React.FC<DoodlePredictionsProps> = ({ 
  predictions, 
  onSelect,
  focusedIndex,
  offset
}) => {
  if (!predictions || predictions.length === 0) return null;

  return (
    <div className="doodle-predictions-bar glass-container">
      {predictions.map((item, idx) => (
        <WordCard
          key={item.id || idx}
          item={item}
          variant={2}
          isFocused={focusedIndex === offset + idx}
          onClick={() => onSelect(item)}
        />
      ))}
    </div>
  );
};
