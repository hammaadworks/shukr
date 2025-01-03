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
  favorites?: string[];
  currentlyPlayingId?: string | null;
}
export const WordGrid: React.FC<WordGridProps> = ({
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
  onDeleteItem,
  favorites = [],
  currentlyPlayingId,
}) => {
  const { isUrdu } = useLanguage();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  return (
    <div className="smart-grid-apple">
      {gridItems.map((item, idx) => (
        <WordCard 
          key={item.id}
          item={item}
          isFocused={focusedIndex === offset + idx}
          isPlaying={currentlyPlayingId === item.id}
          onClick={item.onClick}
          onLongPress={() => {
             if (item.isPrompt) return;
             onEditItem?.(item);
          }}
          onToggleFavorite={() => onLongPressItem?.(item)}
          onDelete={() => setDeleteId(item.id)}
          isFavorite={favorites.includes(item.id)}
        />
      ))}

      {deleteId && (() => {
        const item = gridItems.find(i => i.id === deleteId);
        const label = isUrdu ? item?.ur : item?.en;
        return (
          <div className="delete-modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="delete-modal" onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', textAlign: isUrdu ? 'right' : 'left' }}>
                  {isUrdu ? `حذف کریں "${label}"؟` : `Delete "${label}"?`}
              </h3>
              <div className="modal-actions" style={{ flexDirection: 'row-reverse', gap: '8px' }}>
                <button 
                  className="btn-danger" 
                  onClick={() => { onDeleteItem?.(deleteId); setDeleteId(null); }}
                  style={{ borderRadius: '12px', padding: '10px 20px', backgroundColor: 'var(--color-danger)', color: 'white', border: 'none' }}
                >
                  {isUrdu ? 'حذف کریں' : 'Delete'}
                </button>
                <button 
                  onClick={() => setDeleteId(null)} 
                  style={{ background: '#f0f0f0', borderRadius: '12px', padding: '10px 20px', border: 'none' }}
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
};
