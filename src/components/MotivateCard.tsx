import React, { useState, useMemo } from 'react';
import { Sparkles, Settings, X, Check, Trash2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { universeDb } from '../lib/universeDb';
import { generateQuoteId } from '../lib/constants';

interface MotivateCardProps {
  quote: any;
  quotes: any[];
  onNext: () => void;
  updateConfig: (config: any) => void;
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
  const { isPrimary, language, primaryLanguage, secondaryLanguage } = useLanguage();
  const [showManager, setShowManager] = useState(false);
  const [newPrimary, setNewPrimary] = useState('');
  const [newSecondary, setNewSecondary] = useState('');

  const activeQuoteText = useMemo(() => {
    if (!quote) return '';
    return isPrimary ? quote.text_primary : quote.text_secondary;
  }, [quote, isPrimary]);

  const secondaryQuoteText = useMemo(() => {
    if (!quote) return '';
    return isPrimary ? quote.text_secondary : quote.text_primary;
  }, [quote, isPrimary]);

  const handleAddQuote = async () => {
    if (!newPrimary || !newSecondary) return;
    const newQuote: any = {
      id: generateQuoteId(),
      [primaryLanguage]: newPrimary,
      [secondaryLanguage]: newSecondary,
      translations: {
        [primaryLanguage]: newPrimary,
        [secondaryLanguage]: newSecondary
      },
      source: 'User',
      createdAt: Date.now()
    };
    
    const newQuotes = [newQuote, ...(config.quotes || [])];
    updateConfig({ ...config, quotes: newQuotes });
    await universeDb.quotes.put(newQuote);
    
    setNewPrimary('');
    setNewSecondary('');
  };

  const handleDeleteQuote = async (id: string) => {
    const newQuotes = quotes.filter((q: any) => q.id !== id);
    updateConfig({ ...config, quotes: newQuotes });
    await universeDb.quotes.delete(id);
  };

  return (
    <div className={`motivate-card-container ${isFocused ? 'focused-item' : ''}`}>
      <div className="motivate-view">
        <div className="motivate-header">
          <div className="motivate-tag">
            <Sparkles size={16} />
            <span>{isPrimary ? (language === 'ur' ? 'ترغیب' : 'Motivate') : 'Motivate'}</span>
          </div>
          <button className="manage-btn" onClick={() => setShowManager(!showManager)}>
            <Settings size={18} />
          </button>
        </div>
        
        <div className="motivate-content" onClick={onNext}>
          <div className="quote-text-ur">{activeQuoteText || 'شکراً'}</div>
          <div className="quote-text-en">{secondaryQuoteText || 'Shukr'}</div>
          {quote?.source && <div className="quote-source">— {quote.source}</div>}
        </div>

        <button className="next-quote-hint" onClick={onNext}>
           {isPrimary ? (language === 'ur' ? 'اگلا جملہ' : 'Next Quote') : 'Next Quote'}
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
                <Check size={20} /> Add Motivation
              </button>
            </div>

            <div className="manage-list">
              {(config.quotes || []).map((q: any) => (
                <div key={q.id} className="quote-item-sm">
                  <div className="quote-info">
                    <span className="q-ur">{q.text_primary || q.ur}</span>
                    <span className="q-en">{q.text_secondary || q.en}</span>
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
