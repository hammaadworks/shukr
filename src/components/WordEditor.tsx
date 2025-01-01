import { useState } from 'react';
import { Trash2, Save, Languages, UserPlus, Type } from 'lucide-react';
import { translator } from '../lib/translator';

interface WordEditorProps {
  item: any;
  onChange: (newItem: any) => void;
  onSave?: (item: any, blob?: Blob | null) => void;
  onDelete?: (id: string, en?: string) => void;
  isNew?: boolean;
}

export const WordEditor: React.FC<WordEditorProps> = ({ item, onChange, onSave, onDelete, isNew }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEnChange = async (en: string) => {
    onChange({ ...item, en });
    if (en.length > 2) {
      setIsTranslating(true);
      const res = await translator.translate(en);
      if (res) {
        onChange({ ...item, en, ur: res.ur, roman: res.roman });
      }
      setIsTranslating(false);
    }
  };

  return (
    <div className="word-editor-container">
      {/* (rest of form code) */}
      
      {/* Global Actions */}
      {onSave && (
        <div className="editor-actions-brand">
          {onDelete && !isNew && (
            <button className="btn-editor-danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={24} />
            </button>
          )}
          <button className="btn-editor-main" onClick={() => onSave(item, null)}>
            <Save size={24} /> Save to Universe
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Delete "{item.en}"?</h3>
            <p>This action is irreversible.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => onDelete!(item.id, item.en)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
