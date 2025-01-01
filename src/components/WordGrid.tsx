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
  onDeleteItem,
  favorites = [],
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

      {deleteId && (
        <div className="delete-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>
                {isUrdu ? 'کیا اس لفظ کو حذف کریں؟' : `Delete "${gridItems.find(i => i.id === deleteId)?.en || 'this word'}"?`}
            </h3>
            <div className="modal-actions" style={{ flexDirection: 'row-reverse' }}>
              <button className="btn-danger" onClick={() => { onDeleteItem?.(deleteId); setDeleteId(null); }}>
                {isUrdu ? 'حذف کریں' : 'Delete'}
              </button>
              <button onClick={() => setDeleteId(null)} style={{ background: '#f0f0f0' }}>
                {isUrdu ? 'منسوخ' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

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
