import React, { useState, useEffect } from 'react';
import { Trash2, X, AlertCircle, Check } from 'lucide-react';
import { translator } from '../lib/translator';
import { useLanguage, SUPPORTED_LANGS } from '../hooks/useLanguage';

interface WordEditorProps {
  item: any | null;
  onClose?: () => void;
  onSave: (item: any, blob?: Blob | null) => void;
  onDelete: (id: string, label?: string) => void;
  onChange?: (item: any) => void;
  isNew?: boolean;
  existingWords?: any[];
}

const getLanguageLabel = (code: string) => {
  const lang = SUPPORTED_LANGS.find(l => l.code === code);
  return lang ? lang.label : code.toUpperCase();
};

const BilingualLabel: React.FC<{ primary: string; secondary: string; isRTL?: boolean }> = ({ primary, secondary, isRTL }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
    <span style={{ 
      fontSize: isRTL ? '1.4rem' : '1.1rem', 
      fontWeight: 800, 
      color: 'var(--color-primary)',
      fontFamily: isRTL ? 'var(--font-ur)' : 'var(--font-main)',
      lineHeight: 1.2
    }}>
      {primary}
    </span>
    <span style={{ 
      fontSize: isRTL ? '0.9rem' : '1.2rem', 
      fontWeight: 600, 
      color: 'var(--color-text-muted)',
      opacity: 0.8,
      fontFamily: isRTL ? 'var(--font-main)' : 'var(--font-ur)',
      lineHeight: 1
    }}>
      {secondary}
    </span>
  </div>
);

export const WordEditor: React.FC<WordEditorProps> = ({ item: initialItem, onClose, onSave, onDelete, isNew, existingWords, onChange }) => {
  const [item, setItem] = useState(initialItem);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFamily, setIsFamily] = useState(initialItem?.categoryId === 'khandan');
  const [error, setError] = useState<string | null>(null);
  const { primaryLanguage, secondaryLanguage } = useLanguage();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setItem(initialItem);
    setIsFamily(initialItem?.categoryId === 'khandan');
    setError(null);
    setShowDeleteConfirm(false);
  }, [initialItem]);

  if (!item) return null;

  const handleFieldChange = async (field: 'primary' | 'secondary' | 'roman', val: string) => {
    setError(null);
    const updated = { ...item };
    if (field === 'primary') {
        updated.text_primary = val;
        updated.ur = val;
    } else if (field === 'secondary') {
        updated.text_secondary = val;
        updated.en = val;
    } else {
        updated.roman = val;
    }
    
    setItem(updated);
    if (onChange) onChange(updated);

    if (val.length > 2) {
      setIsTranslating(true);
      try {
        const res = await translator.translate(val);
        if (res) {
          const finalItem = { ...updated };
          if (field === 'primary') {
            finalItem.text_secondary = res.en;
            finalItem.en = res.en;
            if (!finalItem.roman) finalItem.roman = res.roman;
          } else if (field === 'secondary') {
            finalItem.text_primary = res.ur;
            finalItem.ur = res.ur;
            if (!finalItem.roman) finalItem.roman = res.roman;
          }
          setItem(finalItem);
          if (onChange) onChange(finalItem);
        }
      } catch (e) {
        console.error("Translation failed", e);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const handleSaveClick = () => {
    const pText = item.text_primary || item.ur || '';
    const sText = item.text_secondary || item.en || '';

    if (!pText.trim() && !sText.trim()) {
        setError("Please enter a word.");
        return;
    }

    if (existingWords) {
        const isDuplicate = existingWords.some(w => {
            if (w.id === item.id) return false; 
            const matchP = pText.trim() && (w.ur === pText.trim() || w.text_primary === pText.trim());
            const matchS = sText.trim() && (w.en?.toLowerCase() === sText.trim().toLowerCase() || w.text_secondary?.toLowerCase() === sText.trim().toLowerCase());
            return matchP || matchS;
        });

        if (isDuplicate) {
            setError("This word already exists in your dictionary.");
            return;
        }
    }

    onSave({ ...item, categoryId: isFamily ? 'khandan' : (item.categoryId || 'common') }, null);
  };

  if (showDeleteConfirm) {
    return (
      <div className="sos-modal-overlay" style={{ zIndex: 3001, position: 'fixed', inset: 0, background: 'rgba(253, 251, 247, 0.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div 
          className="sos-modal-content naani-friendly" 
          style={{ 
            width: '90%',
            maxWidth: '440px',
            padding: '2.5rem 2rem',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-empathy)',
            boxShadow: 'var(--shadow-soft)',
            border: '2px solid var(--color-danger)',
            textAlign: 'center'
          }}
        >
          <div style={{ color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
            <Trash2 size={72} strokeWidth={2.5} />
          </div>
          
          <BilingualLabel 
            primary={primaryLanguage === 'ur' ? 'مٹانا چاہتے ہیں؟' : 'Delete this word?'} 
            secondary={primaryLanguage === 'ur' ? 'Delete this word?' : 'مٹانا چاہتے ہیں؟'}
            isRTL={primaryLanguage === 'ur'}
          />

          <p style={{ 
            fontSize: '1.1rem', 
            color: 'var(--color-text-muted)', 
            marginBottom: '2.5rem',
            fontWeight: 500,
            fontFamily: 'var(--font-main)'
          }}>
            "{item.text_primary || item.ur}" / "{item.text_secondary || item.en}"
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={() => onDelete(item.id, item.text_primary || item.ur)}
              style={{ 
                height: 72, borderRadius: '20px', background: 'var(--color-danger)', 
                color: 'white', border: 'none', fontSize: '1.4rem', fontWeight: 900,
                boxShadow: '0 12px 30px rgba(220, 38, 38, 0.2)', cursor: 'pointer'
              }}
            >
              {primaryLanguage === 'ur' ? 'جی ہاں، مٹا دیں' : 'Yes, Delete it'}
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              style={{ 
                height: 64, borderRadius: '20px', background: 'rgba(45, 90, 39, 0.05)', 
                color: 'var(--color-primary)', border: 'none', fontSize: '1.2rem', fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {primaryLanguage === 'ur' ? 'منسوخ کریں' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="edit-form naani-friendly" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
      
      {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1rem', background: 'rgba(220, 38, 38, 0.08)', color: 'var(--color-danger)', borderRadius: '16px', fontSize: '0.95rem', fontWeight: 700 }}>
              <AlertCircle size={20} />
              <span>{error}</span>
          </div>
      )}

      {/* Primary Language Input */}
      <div className="form-group">
        <BilingualLabel 
            primary={getLanguageLabel(primaryLanguage)} 
            secondary={getLanguageLabel(secondaryLanguage)} 
            isRTL={primaryLanguage === 'ur'} 
        />
        <input 
          type="text" 
          dir={primaryLanguage === 'ur' ? 'rtl' : 'ltr'}
          style={{ 
            width: '100%', padding: '1rem 1.25rem', fontSize: primaryLanguage === 'ur' ? '2.2rem' : '1.4rem', 
            borderRadius: '20px', border: '2px solid rgba(45, 90, 39, 0.1)', 
            background: 'var(--color-bg)', color: 'var(--color-text)', 
            fontFamily: primaryLanguage === 'ur' ? 'var(--font-ur)' : 'var(--font-main)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
            outline: 'none', transition: 'border-color 0.2s ease'
          }} 
          value={item.text_primary || item.ur || ''} 
          onChange={e => handleFieldChange('primary', e.target.value)} 
          placeholder={primaryLanguage === 'ur' ? 'یہاں لکھیں...' : 'Type here...'}
          autoFocus
        />
      </div>

      {/* Secondary Language Input */}
      <div className="form-group">
        <BilingualLabel 
            primary={getLanguageLabel(secondaryLanguage)} 
            secondary={getLanguageLabel(primaryLanguage)} 
            isRTL={secondaryLanguage === 'ur'} 
        />
        <input 
          type="text" 
          dir={secondaryLanguage === 'ur' ? 'rtl' : 'ltr'}
          style={{ 
            width: '100%', padding: '1rem 1.25rem', fontSize: secondaryLanguage === 'ur' ? '2.2rem' : '1.4rem', 
            borderRadius: '20px', border: '2px solid rgba(45, 90, 39, 0.1)', 
            background: 'var(--color-bg)', color: 'var(--color-text)', 
            fontFamily: secondaryLanguage === 'ur' ? 'var(--font-ur)' : 'var(--font-main)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
            outline: 'none'
          }} 
          value={item.text_secondary || item.en || ''} 
          onChange={e => handleFieldChange('secondary', e.target.value)} 
          placeholder="..."
        />
      </div>

      {/* Roman/Pronunciation */}
      <div className="form-group">
        <BilingualLabel 
            primary="Pronunciation / Transliteration" 
            secondary="تلفظ / رومن اردو" 
            isRTL={false} 
        />
        <input 
          type="text" 
          dir="ltr"
          style={{ 
            width: '100%', padding: '1rem 1.25rem', fontSize: '1.2rem', 
            borderRadius: '20px', border: '2px solid rgba(45, 90, 39, 0.1)', 
            background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-main)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
            outline: 'none'
          }} 
          value={item.roman || ''} 
          onChange={e => handleFieldChange('roman', e.target.value)} 
          placeholder="e.g. As-salaam-alaikum"
        />
        {isTranslating && <div style={{ marginTop: 8 }}><small style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.85rem' }}>Auto-populating...</small></div>}
      </div>

      {/* Family Toggle */}
      <div className="form-group">
        <label 
          onClick={() => setIsFamily(!isFamily)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', 
            padding: '1.25rem', background: isFamily ? 'rgba(45, 90, 39, 0.05)' : 'var(--color-bg)', 
            borderRadius: 'var(--radius-empathy)', border: `2px solid ${isFamily ? 'var(--color-primary)' : 'rgba(45, 90, 39, 0.1)'}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{
              width: 32, height: 32, borderRadius: '10px', border: `3px solid var(--color-primary)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', background: isFamily ? 'var(--color-primary)' : 'transparent',
              transition: 'all 0.2s ease'
          }}>
              {isFamily && <Check size={20} color="white" strokeWidth={4} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-ur)', lineHeight: 1.1 }}>
                خاندان میں شامل کریں
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-main)', opacity: 0.7 }}>
                Add to Family Members
            </span>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-row" style={{ marginTop: '0.5rem', display: 'flex', gap: 12 }}>
        <button 
          className="btn-save" 
          onClick={handleSaveClick} 
          style={{ 
            height: 80, borderRadius: 'var(--radius-empathy)', flex: 1, 
            background: 'var(--color-primary)', color: 'white', border: 'none', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            cursor: 'pointer', boxShadow: '0 12px 30px rgba(45, 90, 39, 0.2)', transition: 'all 0.2s ease' 
          }}
        >
          <span style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-ur)', lineHeight: 1 }}>محفوظ کریں</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-main)', opacity: 0.9 }}>Save Word</span>
        </button>
        
        {onDelete && !isNew && (
          <button 
            className="btn-delete" 
            onClick={() => setShowDeleteConfirm(true)} 
            style={{ 
              height: 80, width: 80, borderRadius: 'var(--radius-empathy)', 
              background: 'rgba(220, 38, 38, 0.08)', color: 'var(--color-danger)', 
              border: 'none', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <Trash2 size={32} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="sos-modal-overlay" onClick={onClose} style={{ zIndex: 3000, position: 'fixed', inset: 0, background: 'rgba(253, 251, 247, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        className="sos-modal-content naani-friendly" 
        onClick={e => e.stopPropagation()}
        style={{ 
          height: '100dvh',
          width: '100vw',
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface)',
          boxShadow: '0 0 100px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '1.5rem 1.5rem 1rem', position: 'sticky', top: 0, 
          background: 'var(--color-surface)', zIndex: 10, borderBottom: '1px solid rgba(0,0,0,0.05)' 
        }}>
          <button 
            className="btn-icon" 
            onClick={onClose}
            style={{ 
              background: 'rgba(0,0,0,0.05)', border: 'none', width: 44, height: 44, 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'var(--color-text)', cursor: 'pointer' 
            }}
          >
            <X size={24} />
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--color-primary)', fontFamily: 'var(--font-ur)', lineHeight: 1.1 }}>
              {isNew ? 'نیا لفظ' : 'ترمیم کریں'}
            </h2>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isNew ? 'Add Word' : 'Edit Word'}
            </div>
          </div>
          
          <div style={{ width: 44 }} />
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.5rem', flex: 1 }}>
          {content}
        </div>
      </div>
    </div>
  );
};
