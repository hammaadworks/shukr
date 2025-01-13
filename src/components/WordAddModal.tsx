import React from 'react';
import { WordEditor } from './WordEditor';

interface WordAddModalProps {
  addingWord: any;
  setAddingWord: (item: any | null) => void;
  onSave: (item: any, blob?: Blob | null) => Promise<void>;
  existingWords?: any[];
}

export const WordAddModal: React.FC<WordAddModalProps> = ({ 
  addingWord, 
  setAddingWord, 
  onSave,
  existingWords
}) => {
  if (!addingWord) return null;

  return (
    <WordEditor 
      item={addingWord} 
      isNew={true}
      onSave={onSave}
      onClose={() => setAddingWord(null)}
      onDelete={() => setAddingWord(null)}
      existingWords={existingWords}
    />
  );
};
