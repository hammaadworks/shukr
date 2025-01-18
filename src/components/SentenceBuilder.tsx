import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { WordCard } from './WordCard';

interface SentenceBuilderProps {
  words: any[];
  onClear: () => void;
  onBackspace: () => void;
  onPlay: () => void;
  focusedIndex: number;
  offset: number;
  canAddWords: boolean;
  builderScrollRef: React.RefObject<HTMLDivElement | null>;
  flashBorder: boolean;
  currentlyPlayingId?: string | null;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  words,
  onClear,
  onBackspace,
  onPlay,
  focusedIndex,
  offset,
  canAddWords,
  builderScrollRef,
  flashBorder,
  currentlyPlayingId,
}) => {
  const { isPrimary } = useLanguage();

  return (
    <div className={`sentence-dock-glass glass-container ${flashBorder ? 'flash-red-border' : ''}`}>
      <div className="smart-input-area">
        <div className="builder-scroll" ref={builderScrollRef}>
          {words.length === 0 && (
             <span className="builder-placeholder">
               {isPrimary ? 'جملہ بنائیں...' : 'Build a sentence...'}
             </span>
          )}
          {words.map((w: any, i: number) => (
            <WordCard
              key={`${w.id}-${i}`}
              item={w}
              variant={3}
              isFocused={false}
              isPlaying={currentlyPlayingId === w.id}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
      <div className="dock-actions">
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
          <span>{isPrimary ? 'بولیں' : 'SPEAK'}</span>
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
          className={`btn-dock-ios backspace-btn ${focusedIndex === offset ? 'focused-item' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onBackspace();
          }}
          disabled={words.length === 0}
        >
          <Delete size={18} />
        </button>
      </div>
    </div>
  );
};
