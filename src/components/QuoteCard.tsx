import React, { useState, useMemo } from 'react';
import { Sparkles, Settings, X, Check, Trash2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { universeDb } from '../lib/universeDb';

interface QuoteCardProps {
  quote: any;
  quotes: any[];
  onNext: () => void;
  updateConfig: (config: any) => void;
  config: any;
  isFocused?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ 
  quote, 
  quotes, 
  onNext, 
  updateConfig, 
  config,
  isFocused 
}) => {
  const { isPrimary, language, primaryLanguage, secondaryLanguage } = useLanguage();
  const [showManager, setShowManager] = useState(false);
  const [newPrimary, setNewPrimary] = useState('');
  const [newSecondary, setNewSecondary] = useState('');

  const activeQuoteText = useMemo(() => {
    if (!quote) return '';
    return isPrimary ? (quote.text_primary || quote.ur) : (quote.text_secondary || quote.en);
  }, [quote, isPrimary]);

  const secondaryQuoteText = useMemo(() => {
    if (!quote) return '';
    return isPrimary ? (quote.text_secondary || quote.en) : (quote.text_primary || quote.ur);
  }, [quote, isPrimary]);

  const handleAddQuote = async () => {
    if (!newPrimary || !newSecondary) return;
    const newQuote: any = {
      translations: {
        [primaryLanguage]: newPrimary,
        [secondaryLanguage]: newSecondary
      },
      source: 'User',
      createdAt: Date.now()
    };
    
    // Add to DB first to get the auto-incremented ID
    const id = await universeDb.quotes.add(newQuote);
    const quoteWithId = { ...newQuote, id };
    
    const newQuotes = [quoteWithId, ...(config.quotes || [])];
    updateConfig({ ...config, quotes: newQuotes });
    
    setNewPrimary('');
    setNewSecondary('');
  };

  const handleDeleteQuote = async (id: number) => {
    const newQuotes = quotes.filter((q: any) => q.id !== id);
    updateConfig({ ...config, quotes: newQuotes });
    await universeDb.quotes.delete(id);
  };

  return (
    <div className={`quote-card-container ${isFocused ? 'focused-item' : ''}`}>
      <div className="quote-view">
        <div className="quote-header">
          <div className="quote-tag">
            <Sparkles size={16} />
            <span>{isPrimary ? (language === 'ur' ? 'اچھی بات' : 'Quote') : 'Quote'}</span>
          </div>
          <button className="manage-btn" onClick={() => setShowManager(!showManager)}>
            <Settings size={18} />
          </button>
        </div>
        
        <div className="quote-content" onClick={onNext}>
          <div className="quote-text-ur">{activeQuoteText || 'شکراً'}</div>
          <div className="quote-text-en">{secondaryQuoteText || 'Shukr'}</div>
          {quote?.source && <div className="quote-source">— {quote.source}</div>}
        </div>

        <button className="next-quote-hint" onClick={onNext}>
           {isPrimary ? (language === 'ur' ? 'اگلی بات' : 'Next Quote') : 'Next Quote'}
        </button>
      </div>

      {showManager && (
        <div className="quote-manager-overlay" onClick={() => setShowManager(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="quote-manager-modal" onClick={e => e.stopPropagation()} style={{
            background: 'white', padding: 24, borderRadius: 24, width: '90%', maxWidth: 450, maxHeight: '80vh', overflowY: 'auto'
          }}>
            <div className="manage-header">
              <h3>Manage Quotes</h3>
              <button className="close-btn" onClick={() => setShowManager(false)}><X size={24} /></button>
            </div>

            <div className="add-quote-form" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <input 
                className="massive-input"
                style={{ height: 50, fontSize: '1rem' }}
                placeholder="Primary Language Text..." 
                value={newPrimary} 
                onChange={e => setNewPrimary(e.target.value)} 
              />
              <input 
                className="massive-input"
                style={{ height: 50, fontSize: '1rem' }}
                placeholder="Secondary Language Text..." 
                value={newSecondary} 
                onChange={e => setNewSecondary(e.target.value)} 
              />
              <button className="btn-save-sm" onClick={handleAddQuote} style={{ height: 50, justifyContent: 'center' }}>
                <Check size={20} /> Add Quote
              </button>
            </div>

            <div className="manage-list">
              {(config.quotes || []).map((q: any) => (
                <div key={q.id} className="quote-item-sm">
                  <div className="quote-info">
                    <span className="q-ur">{q.text_primary || q.ur || q.translations?.[primaryLanguage]}</span>
                    <span className="q-en">{q.text_secondary || q.en || q.translations?.[secondaryLanguage]}</span>
                  </div>
                  <button className="delete-quote-btn" onClick={() => handleDeleteQuote(q.id)}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
