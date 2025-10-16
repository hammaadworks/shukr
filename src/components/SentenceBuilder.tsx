import React, { useRef } from 'react';
import { Delete, RotateCcw, XCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { WordCard } from './WordCard';

interface SentenceBuilderProps {
  words: any[];
  onClear: () => void;
  onBackspace: () => void;
  onPlay: () => void;
  focusedIndex: number;
  offset: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  canAddWords: boolean;
  builderScrollRef: React.RefObject<HTMLDivElement>;
  flashBorder: boolean;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  words,
  onClear,
  onBackspace,
  onPlay,
  focusedIndex,
  offset,
  searchQuery,
  setSearchQuery,
  canAddWords,
  builderScrollRef,
  flashBorder,
}) => {
  const { isUrdu } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`sentence-dock-glass ${flashBorder ? 'flash-red-border' : ''}`} onClick={() => inputRef.current?.focus()}>
      <div className="smart-input-area">
        <div className="builder-scroll" ref={builderScrollRef}>
          {words.map((w: any, i: number) => (
            <WordCard key={`${w.id}-${i}`} item={w} variant={2} isFocused={false} onClick={() => {}} />
          ))}
          <input
            ref={inputRef}
            type="text"
            className="search-input-dock"
            placeholder={
              words.length === 0 ? (isUrdu ? 'تلاش یا جملہ...' : 'Search or build...') : ''
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && searchQuery === '') {
                e.preventDefault();
                onBackspace();
              }
            }}
            disabled={!canAddWords}
          />
        </div>
        {searchQuery && (
          <button
            className="btn-icon-ios"
            style={{ padding: 4 }}
            onClick={(e) => {
              e.stopPropagation();
              setSearchQuery('');
            }}
          >
            <XCircle size={18} color="#8e8e8e" />
          </button>
        )}
      </div>
      <div className="dock-actions">
        <button
          className={`btn-dock-ios backspace-btn ${focusedIndex === offset ? 'focused-item' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onBackspace();
          }}
          disabled={words.length === 0}
        >
          <Delete size={18} />
        </button>
        <button
          className={`btn-dock-ios clear-btn ${focusedIndex === offset + 1 ? 'focused-item' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          <RotateCcw size={18} />
        </button>
        <button
          className={`btn-dock-ios primary ${
            focusedIndex === offset + 2 ? 'focused-item' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          disabled={!canAddWords}
        >
          <span>{isUrdu ? 'بولیں' : 'SPEAK'}</span>
        </button>
      </div>
    </div>
  );
};
