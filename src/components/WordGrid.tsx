import React from 'react';
import { WordCard } from './WordCard';
import { useLanguage } from '../hooks/useLanguage';
import { MotivateCard } from './MotivateCard';

interface WordGridProps {
  gridItems: any[];
  focusedIndex: number;
  offset: number;
  randomQuote: any;
  quotes: any[];
  onNextQuote?: () => void;
  updateConfig?: (newConfig: any) => void;
  config?: any;
  quoteFocused: boolean;
  onLongPressItem?: (item: any) => void;
  onEditItem?: (item: any) => void;
  onDeleteItem?: (id: string) => void;
  onSelect?: (item: any) => void;
  favorites?: string[];
  currentlyPlayingId?: string | null;
}

export const WordGrid: React.FC<WordGridProps> = React.memo(({
  gridItems,
  focusedIndex,
  offset,
  randomQuote,
  quotes,
  onNextQuote,
  updateConfig,
  config,
  quoteFocused,
  onLongPressItem,
  onEditItem,
  // @ts-ignore
  onDeleteItem,
  onSelect,
  favorites = [],
  currentlyPlayingId,
}) => {

  // @ts-ignore
  const { isPrimary } = useLanguage();

  return (
    <div className="smart-grid-apple">
      {gridItems.map((item, idx) => (
        <WordCard 
          key={item.id}
          item={item}
          isFocused={focusedIndex === offset + idx}
          isPlaying={currentlyPlayingId === item.id}
          onClick={() => {
            if (item.onClick) item.onClick();
            else onSelect?.(item);
          }}
          onEdit={() => {
             if (item.isPrompt) return;
             onEditItem?.(item);
          }}
          onToggleFavorite={() => onLongPressItem?.(item)}
          onDelete={() => {
             if (item.isPrompt) return;
             onEditItem?.(item);
          }}
          isFavorite={favorites.includes(item.id)}
        />
      ))}

      {randomQuote && onNextQuote && updateConfig && config && (
        <MotivateCard 
          quote={randomQuote}
          quotes={quotes}
          onNext={onNextQuote}
          updateConfig={updateConfig}
          config={config}
          isFocused={quoteFocused}
        />
      )}
    </div>
  );
});
