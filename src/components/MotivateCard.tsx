import React, { useState } from 'react';
import { Sparkles, Settings, Plus, X, Check, Trash2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface MotivateCardProps {
  quote: any;
  quotes: any[];
  onNext: () => void;
  updateConfig: (newConfig: any) => void;
  config: any;
  isFocused?: boolean;
}

export const MotivateCard: React.FC<MotivateCardProps> = ({ 
  quote, 
  quotes, 
  onNext, 
  updateConfig, 
  config,
  isFocused 
}) => {
  const { isUrdu } = useLanguage();
  const [isManaging, setIsManaging] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any | null>(null);
  const [newQuote, setNewQuote] = useState({ ur: '', en: '', source: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveQuote = (q: any, isNew: boolean) => {
    const newConfig = { ...config };
    if (isNew) {
      newConfig.quotes = [q, ...quotes];
      setIsAdding(false);
      setNewQuote({ ur: '', en: '', source: '' });
    } else {
      newConfig.quotes = quotes.map((item: any) => 
        item.en === (q.oldEn || q.en) ? { ur: q.ur, en: q.en, source: q.source } : item
      );
      setEditingQuote(null);
    }
    updateConfig(newConfig);
  };

  const handleDeleteQuote = (en: string) => {
    if (!window.confirm(isUrdu ? 'حذف کریں؟' : 'Delete?')) return;
    const newConfig = { ...config };
    newConfig.quotes = quotes.filter((q: any) => q.en !== en);
    updateConfig(newConfig);
  };

  return (
    <div className={`motivate-card-container ${isFocused ? 'focused-item' : ''} ${isManaging ? 'managing' : ''}`}>
      {!isManaging ? (
        <div className="motivate-view">
          <div className="motivate-header">
             <div className="motivate-tag">
                <Sparkles size={14} />
                <span>{isUrdu ? 'ترغیب' : 'Motivate'}</span>
             </div>
             <button className="manage-btn" onClick={() => setIsManaging(true)}>
                <Settings size={18} />
             </button>
          </div>
          
          <div className="motivate-content" onClick={onNext}>
            <div className="quote-text-ur">{quote?.ur || 'شکراً'}</div>
            <div className="quote-text-en">{quote?.en || 'Shukr'}</div>
            {quote?.source && <div className="quote-source">— {quote.source}</div>}
          </div>

          <button className="next-quote-hint" onClick={onNext}>
             {isUrdu ? 'اگلا جملہ' : 'Next Quote'}
          </button>
        </div>
      ) : (
        <div className="motivate-manage">
          <div className="manage-header">
            <h3>{isUrdu ? 'جملوں کا انتظام' : 'Manage Quotes'}</h3>
            <button className="close-btn" onClick={() => setIsManaging(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="manage-list">
            <button className="add-quote-inline" onClick={() => setIsAdding(!isAdding)}>
              {isAdding ? <X size={20} /> : <Plus size={20} />}
              {isUrdu ? 'نیا جملہ شامل کریں' : 'Add New Quote'}
            </button>

            {isAdding && (
              <div className="quote-edit-form">
                <input 
                  placeholder="Urdu (اردو)" 
                  value={newQuote.ur} 
                  onChange={e => setNewQuote({...newQuote, ur: e.target.value})}
                  dir="rtl"
                />
                <input 
                  placeholder="English (انگریزی)" 
                  value={newQuote.en} 
                  onChange={e => setNewQuote({...newQuote, en: e.target.value})}
                />
                <div className="form-actions">
                  <button className="btn-save-sm" onClick={() => handleSaveQuote(newQuote, true)}>
                    <Check size={18} /> {isUrdu ? 'محفوظ کریں' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {quotes.map((q, i) => (
              <div key={i} className="quote-item-sm">
                {editingQuote?.en === q.en ? (
                  <div className="quote-edit-form">
                    <input 
                      value={editingQuote.ur} 
                      onChange={e => setEditingQuote({...editingQuote, ur: e.target.value})}
                      dir="rtl"
                    />
                    <input 
                      value={editingQuote.en} 
                      onChange={e => setEditingQuote({...editingQuote, en: e.target.value})}
                    />
                    <div className="form-actions">
                      <button className="btn-save-sm" onClick={() => handleSaveQuote({ ...editingQuote, oldEn: q.en }, false)}>
                        <Check size={18} />
                      </button>
                      <button className="btn-cancel-sm" onClick={() => setEditingQuote(null)}>
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="quote-info" onClick={() => setEditingQuote(q)}>
                      <span className="q-ur">{q.ur}</span>
                      <span className="q-en">{q.en}</span>
                    </div>
                    <button className="delete-quote-btn" onClick={() => handleDeleteQuote(q.en)}>
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
