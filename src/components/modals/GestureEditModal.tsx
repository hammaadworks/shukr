import React, { useState, useMemo } from 'react';
import { X, Save, Mic, List, Activity } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { type GestureDefinition, type GestureAction, type GestureMappingType } from '../../recognition/gestures/types';
import { WordCard } from '../WordCard';
import type { WordCardItem } from '../WordCard';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';

interface GestureEditModalProps {
  gesture: GestureDefinition;
  config: any;
  onClose: () => void;
  onSave: (updated: GestureDefinition) => void;
}

const SYSTEM_ACTIONS: { value: GestureAction; label_en: string; label_ur: string }[] = [
  { value: 'SELECT', label_en: 'Select / Speak', label_ur: 'منتخب / بولیں' },
  { value: 'NEXT', label_en: 'Next Item', label_ur: 'اگلا' },
  { value: 'PREV', label_en: 'Previous Item', label_ur: 'پچھلا' },
  { value: 'CLEAR', label_en: 'Clear / Home', label_ur: 'صاف کریں' },
  { value: 'DOODLE', label_en: 'Go to Doodle', label_ur: 'ڈرائنگ پر جائیں' },
  { value: 'YES', label_en: 'Speak "Yes"', label_ur: 'ہاں بولیں' },
  { value: 'SALAM', label_en: 'Speak "Salam"', label_ur: 'سلام بولیں' },
  { value: 'TOGGLE_RECOGNITION', label_en: 'Pause Tracking', label_ur: 'ٹریکنگ روکیں' },
];

export const GestureEditModal: React.FC<GestureEditModalProps> = ({ gesture, config, onClose, onSave }) => {
  const { isPrimary } = useLanguage();
  const [activeTab, setActiveTab] = useState<GestureMappingType>(gesture.type);
  const [labelEn, setLabelEn] = useState(gesture.label_en);
  const [labelUr, setLabelUr] = useState(gesture.label_ur);
  const [selectedValue, setSelectedValue] = useState<string | string[]>(gesture.value);
  const [searchQuery, setSearchQuery] = useState('');

  const allWords = useMemo(() => {
    return (config.categories || []).flatMap((c: any) => c.items || []);
  }, [config]);

  const searchResults = useFuzzySearch(allWords, searchQuery);

  const handleSave = () => {
    onSave({
      ...gesture,
      type: activeTab,
      label_en: labelEn,
      label_ur: labelUr,
      value: selectedValue
    });
  };

  const toggleWordSelection = (wordId: string) => {
    setSelectedValue(prev => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.includes(wordId)) {
        return current.filter(id => id !== wordId);
      } else {
        return [...current, wordId];
      }
    });
  };

  const renderActionTab = () => (
    <div className="gesture-edit-actions-grid">
      {SYSTEM_ACTIONS.map(action => (
        <button
          key={action.value}
          className={`gesture-action-option ${selectedValue === action.value ? 'active' : ''}`}
          onClick={() => {
            setSelectedValue(action.value);
            setLabelEn(action.label_en);
            setLabelUr(action.label_ur);
          }}
        >
          <span className="action-label">{isPrimary ? action.label_ur : action.label_en}</span>
        </button>
      ))}
    </div>
  );

  const renderWordsTab = () => {
    const selectedWords = Array.isArray(selectedValue) ? selectedValue : [];
    const selectedItems = allWords.filter((w: any) => selectedWords.includes(w.id));

    return (
      <div className="gesture-edit-words-container">
        <div className="selected-words-sequence">
          {selectedItems.length > 0 ? (
            selectedItems.map((w: any, idx: number) => (
              <div key={`${w.id}-${idx}`} className="sequence-item">
                <span>{isPrimary ? w.ur : w.en}</span>
                <button onClick={() => toggleWordSelection(w.id)}><X size={14}/></button>
              </div>
            ))
          ) : (
            <p className="empty-sequence-hint">{isPrimary ? 'الفاظ منتخب کریں' : 'Select words to speak'}</p>
          )}
        </div>

        <div className="word-picker-search">
          <input 
            type="text" 
            placeholder={isPrimary ? "لفظ تلاش کریں..." : "Search words..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="word-picker-grid">
          {searchResults.slice(0, 12).map((item: any) => (
            <div 
              key={item.id} 
              onClick={() => toggleWordSelection(item.id)}
              style={{ 
                border: selectedWords.includes(item.id) ? '3px solid var(--color-primary)' : '1px solid transparent',
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              <WordCard
                item={item as WordCardItem}
                isFocused={false}
                isPlaying={false}
                onClick={() => toggleWordSelection(item.id)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAudioTab = () => (
    <div className="gesture-edit-audio-container">
       <div className="audio-placeholder-card">
          <Mic size={48} color="var(--color-primary)" />
          <p>{isPrimary ? 'آڈیو ریکارڈنگ جلد آرہی ہے' : 'Audio recording coming soon'}</p>
          <p className="hint-text">{isPrimary ? 'فی الحال آپ ایکشن یا الفاظ منتخب کر سکتے ہیں' : 'For now, please use Actions or Words'}</p>
       </div>
    </div>
  );

  return (
    <div className="sos-modal-overlay gesture-edit-overlay">
      <div className="sos-modal-content gesture-edit-content">
        <button className="sos-close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="gesture-edit-header">
          <h2>{isPrimary ? 'اشارہ تبدیل کریں' : 'Edit Gesture'}</h2>
          <p className="gesture-id-badge">{gesture.id.replace('_', ' ').toUpperCase()}</p>
        </div>

        <div className="gesture-edit-tabs">
          <button className={activeTab === 'action' ? 'active' : ''} onClick={() => setActiveTab('action')}>
            <Activity size={18} />
            <span>{isPrimary ? 'ایکشن' : 'Action'}</span>
          </button>
          <button className={activeTab === 'words' ? 'active' : ''} onClick={() => {
            setActiveTab('words');
            if (!Array.isArray(selectedValue)) setSelectedValue([]);
          }}>
            <List size={18} />
            <span>{isPrimary ? 'الفاظ' : 'Words'}</span>
          </button>
          <button className={activeTab === 'audio' ? 'active' : ''} onClick={() => setActiveTab('audio')}>
            <Mic size={18} />
            <span>{isPrimary ? 'آڈیو' : 'Audio'}</span>
          </button>
        </div>

        <div className="gesture-edit-labels">
           <div className="label-input-group">
              <label>English Label</label>
              <input value={labelEn} onChange={e => setLabelEn(e.target.value)} placeholder="e.g. Next" />
           </div>
           <div className="label-input-group" dir="rtl">
              <label>اردو لیبل</label>
              <input value={labelUr} onChange={e => setLabelUr(e.target.value)} placeholder="مثلاً اگلا" />
           </div>
        </div>

        <div className="gesture-edit-tab-content">
          {activeTab === 'action' && renderActionTab()}
          {activeTab === 'words' && renderWordsTab()}
          {activeTab === 'audio' && renderAudioTab()}
        </div>

        <div className="gesture-edit-footer">
          <button className="btn-save-gesture" onClick={handleSave}>
            <Save size={20} />
            <span>{isPrimary ? 'محفوظ کریں' : 'Save Mapping'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
