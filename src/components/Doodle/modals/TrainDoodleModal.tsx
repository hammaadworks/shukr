import React, { useState, useMemo } from 'react';
import { XCircle, Search } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useFuzzySearch } from '../../../hooks/useFuzzySearch';
import { WordEditor } from '../../WordEditor';

interface TrainDoodleModalProps {
  onSave: (label: string, en: string, ur: string, blob?: Blob | null) => void;
  onCancel: () => void;
  config: any;
}

export const TrainDoodleModal: React.FC<TrainDoodleModalProps> = ({ onSave, onCancel, config }) => {
  const { isUrdu } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  const allItems = useMemo(() => {
    if (!config?.categories) return [];
    return config.categories.flatMap((c: any) => c.items || []);
  }, [config]);

  const searchResults = useFuzzySearch(allItems, searchQuery);

  const handleStartNew = () => {
    setEditingItem({
      id: `word_${crypto.randomUUID()}`,
      en: searchQuery,
      ur: '',
      roman: '',
      icon: 'list-plus',
      next: []
    });
  };

  const handleEditorSave = (item: any, blob?: Blob | null) => {
    onSave(item.en, item.en, item.ur, blob);
  };

  return (
    <div className="studio-modal-overlay-brand">
      <div className="studio-modal-brand" style={{ maxWidth: '500px', width: '90%', height: 'auto', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header-brand" style={{ flexShrink: 0 }}>
          <h3>{isUrdu ? 'ڈوڈل سکھائیں' : 'Train Doodle'}</h3>
          <button className="btn-icon-ios" onClick={onCancel}>
            <XCircle size={20} />
          </button>
        </div>
        
        <div className="modal-body-brand" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {!editingItem ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                {isUrdu ? 'تلاش کریں کہ یہ ڈوڈل کس لفظ کے لیے ہے، یا نیا شامل کریں:' : 'Search for the word this doodle represents, or add a new one:'}
              </p>
              
              <div className="smart-input-area" style={{ borderRadius: '12px', background: 'rgba(0,0,0,0.03)' }}>
                <Search size={18} style={{ marginLeft: '12px', opacity: 0.5 }} />
                <input 
                  autoFocus
                  className="search-input-dock" 
                  style={{ width: '100%' }}
                  placeholder={isUrdu ? 'لفظ تلاش کریں...' : 'Search word...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="results-list" style={{ minHeight: '200px' }}>
                {searchResults.slice(0, 6).map((item: any) => (
                  <button 
                    key={item.id} 
                    className="list-item-ios" 
                    style={{ width: '100%', textAlign: 'left', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}
                    onClick={() => onSave(item.en, item.en, item.ur)}
                  >
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.en}</span>
                    <span style={{ fontFamily: 'var(--font-ur)', color: 'var(--color-primary)', fontSize: '1.2rem' }}>{item.ur}</span>
                  </button>
                ))}
                
                <button 
                  className="list-item-ios" 
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: 'none', marginTop: '12px' }}
                  onClick={handleStartNew}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                    {isUrdu ? (searchQuery ? `نیا لفظ: ${searchQuery}` : 'نیا لفظ شامل کریں') : (searchQuery ? `Add new word: ${searchQuery}` : 'Add a new word')}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <WordEditor 
              item={editingItem} 
              isNew={true}
              onChange={setEditingItem}
              onSave={handleEditorSave}
            />
          )}
        </div>
      </div>
    </div>
  );
};
