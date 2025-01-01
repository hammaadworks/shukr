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
      {/* English Card */}
      <div className="brand-editor-card">
        <label className="brand-editor-label">
          <Type size={14} /> 
          English <span className="label-ur">(انگریزی)</span>
        </label>
        <input 
          type="text" 
          className="massive-input-brand" 
          value={item.en} 
          onChange={e => handleEnChange(e.target.value)} 
          placeholder="e.g. Water"
          autoFocus
        />
      </div>

      {/* Urdu Card */}
      <div className="brand-editor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="brand-editor-label">
            <Languages size={14} /> 
            Urdu <span className="label-ur">(اردو)</span>
          </label>
          {isTranslating && <span className="translating-indicator">Translating...</span>}
        </div>
        <input 
          type="text" 
          className="massive-input-brand urdu-input-brand" 
          value={item.ur} 
          onChange={e => onChange({...item, ur: e.target.value, icon: item.icon || 'list-plus'})} 
          dir="rtl"
          placeholder="پانی"
        />
      </div>

      {/* Transliteration Card */}
      <div className="brand-editor-card">
        <label className="brand-editor-label">
          Roman Urdu <span className="label-ur">(رومن اردو)</span>
        </label>
        <input 
          type="text" 
          className="massive-input-brand" 
          value={item.roman || ''} 
          onChange={e => onChange({...item, roman: e.target.value})} 
          placeholder="e.g. Paani"
        />
      </div>

      {/* Family Toggle Card */}
      <div className="brand-editor-card family-toggle-card">
        <div className="toggle-info">
          <div className="toggle-title">
            <UserPlus size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Add to Family
          </div>
          <div className="toggle-subtitle">خاندان میں شامل کریں</div>
        </div>
        <input 
          type="checkbox" 
          className="apple-switch"
          checked={item.categoryId === 'khandan'} 
          onChange={e => onChange({...item, categoryId: e.target.checked ? 'khandan' : 'cat_custom'})} 
        />
      </div>

      {/* Global Actions */}
      {onSave && (
        <div className="editor-actions-brand">
          {onDelete && !isNew && (
            <button className="btn-editor-danger" onClick={() => onDelete(item.id)}>
              <Trash2 size={24} />
            </button>
          )}
          <button className="btn-editor-main" onClick={() => onSave(item, null)}>
            <Save size={24} /> Save to Universe
          </button>
        </div>
      )}
    </div>
  );
};
