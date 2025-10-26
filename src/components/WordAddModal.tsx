import React from 'react';
import { XCircle } from 'lucide-react';
import { WordEditor } from './WordEditor';

interface WordAddModalProps {
  addingWord: any;
  setAddingWord: (item: any | null) => void;
  onSave: (item: any) => Promise<void>;
}

export const WordAddModal: React.FC<WordAddModalProps> = ({ 
  addingWord, 
  setAddingWord, 
  onSave 
}) => {
  if (!addingWord) return null;

  return (
    <div className="studio-modal-overlay-brand">
      <div className="studio-modal-brand">
        <div className="modal-header-brand">
          <h3>Add Word</h3>
          <button className="btn-icon-ios" onClick={() => setAddingWord(null)}>
            <XCircle size={20} />
          </button>
        </div>
        <div className="modal-body-brand">
          <WordEditor 
            item={addingWord} 
            isNew={true}
            onChange={setAddingWord} 
            onSave={onSave}
          />
        </div>
      </div>
    </div>
  );
};
