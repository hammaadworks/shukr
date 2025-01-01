import React from 'react';
import { WordCard } from './WordCard';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface WordGridProps {
  gridItems: any[];
  focusedIndex: number;
  offset: number;
  randomQuote: any;
  onNextQuote?: () => void;
  quoteFocused: boolean;
  onLongPressItem?: (item: any) => void;
  onEditItem?: (item: any) => void;
  favorites?: string[];
}

export const WordGrid: React.FC<WordGridProps> = ({
  gridItems,
  focusedIndex,
  offset,
  randomQuote,
  onNextQuote,
  quoteFocused,
  onLongPressItem,
  onEditItem,
  favorites = [],
}) => {
  const { isUrdu } = useLanguage();
  const [pressTimer, setPressTimer] = React.useState<any>(null);

  return (
    <div className="smart-grid-apple">
      {gridItems.map((item, idx) => (
        <div 
            key={item.id}
            onMouseDown={() => setPressTimer(setTimeout(() => onEditItem?.(item), 800))}
            onMouseUp={() => clearTimeout(pressTimer)}
            onTouchStart={() => setPressTimer(setTimeout(() => onEditItem?.(item), 800))}
            onTouchEnd={() => clearTimeout(pressTimer)}
        >
        <WordCard 
          item={item}
          isFocused={focusedIndex === offset + idx}
          onClick={item.onClick}
          onLongPress={() => onLongPressItem && onLongPressItem(item)}
          isFavorite={favorites.includes(item.id)}
        />
        </div>
      ))}
      {randomQuote && (
        <div
          className={`quote-banner ${quoteFocused ? 'focused-item' : ''}`}
        >
          <button 
            className="quote-motivate-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onNextQuote?.();
            }}
            title="Motivate"
          >
            <Sparkles size={16} />
            <span>{isUrdu ? 'ترغیب' : 'Motivate'}</span>
          </button>
          <div className="quote-banner-ur">{isUrdu ? randomQuote.ur : randomQuote.en}</div>
        </div>
      )}
    </div>
  );
};
