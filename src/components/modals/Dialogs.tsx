import React, { useState } from 'react';
import { Camera, ShieldAlert, X, Check, Mic } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { getLanguageLabel } from '../../lib/languages';

interface PermissionDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  status: 'prompt' | 'denied' | 'requesting';
  type: 'camera' | 'microphone';
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({ onConfirm, onCancel, status, type }) => {
  const { isPrimary } = useLanguage();

  const isMic = type === 'microphone';

  const getIcon = () => {
    if (status === 'denied') return <ShieldAlert size={48} color="var(--color-danger)" />;
    return isMic ? <Mic size={48} color="var(--color-primary)" /> : <Camera size={48} color="var(--color-primary)" />;
  };

  const getTitle = () => {
    if (status === 'denied') {
      return isMic 
        ? (isPrimary ? 'مائیکروفون بند ہے' : 'Microphone Access Denied')
        : (isPrimary ? 'کیمرہ بند ہے' : 'Camera Access Denied');
    }
    return isMic
      ? (isPrimary ? 'مائیکروفون استعمال کریں؟' : 'Enable Microphone?')
      : (isPrimary ? 'کیمرہ استعمال کریں؟' : 'Enable Hands-Free?');
  };

  const getDescription = () => {
    if (status === 'denied') {
      return isMic
        ? (isPrimary 
            ? 'آپ نے مائیکروفون بند کر دیا ہے۔ آواز ریکارڈ کرنے کے لیے براؤزر سیٹنگز میں جا کر اسے آن کریں۔' 
            : 'Microphone access is blocked. To record audio, please enable it in your browser settings.')
        : (isPrimary 
            ? 'آپ نے کیمرہ بند کر دیا ہے۔ اشاروں کے لیے براؤزر سیٹنگز میں جا کر کیمرہ آن کریں۔' 
            : 'Camera access is blocked. To use gestures, please enable it in your browser settings.');
    }
    return isMic
      ? (isPrimary 
          ? 'شکریہ آپ کی آواز ریکارڈ کرنے کے لیے مائیکروفون استعمال کرتی ہے۔ آپ کی ریکارڈنگز صرف آپ کے آلے پر رہتی ہیں۔' 
          : 'Shukr uses the microphone to record your voice. Your recordings are processed locally and never leave your device.')
      : (isPrimary 
          ? 'شکریہ آپ کے ہاتھ کے اشاروں کو پہچاننے کے لیے کیمرہ استعمال کرتی ہے۔ آپ کا ڈیٹا محفوظ رہتا ہے اور کہیں نہیں بھیجا جاتا۔' 
          : 'Shukr uses the camera to recognize your hand gestures. Your video is processed locally and never leaves your device.');
  };

  return (
    <div className="shukr-dialog-overlay">
      <div className="shukr-dialog naani-friendly">
        <div className="shukr-dialog-icon-header">
           {getIcon()}
        </div>
        
        <h2 className="shukr-dialog-title">
          {getTitle()}
        </h2>

        <div className="shukr-dialog-desc">
          <p>{getDescription()}</p>
        </div>

        <div className="shukr-dialog-actions">
          <button className="shukr-dialog-btn btn-cancel" onClick={onCancel}>
            {isPrimary ? 'بند کریں' : 'Close'}
          </button>
          {status !== 'denied' && (
            <button className="shukr-dialog-btn btn-confirm" onClick={onConfirm} disabled={status === 'requesting'}>
              <Check size={20} />
              {isPrimary ? 'جی ہاں' : 'Allow Access'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, onClose, title, description }) => {
  if (!isOpen) return null;
  return (
    <div className="shukr-dialog-overlay" onClick={onClose}>
      <div className="shukr-dialog naani-friendly" onClick={e => e.stopPropagation()}>
        <h2 className="shukr-dialog-title" style={{ marginTop: 0 }}>{title}</h2>
        <div className="shukr-dialog-desc">
          <p>{description}</p>
        </div>
        <div className="shukr-dialog-actions">
          <button className="shukr-dialog-btn btn-confirm" onClick={onClose} style={{ width: '100%' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, title, description, isDanger, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="shukr-dialog-overlay" onClick={onClose}>
      <div className="shukr-dialog naani-friendly" onClick={e => e.stopPropagation()}>
        <h2 className="shukr-dialog-title" style={{ marginTop: 0, color: isDanger ? 'var(--color-danger)' : 'inherit' }}>{title}</h2>
        <div className="shukr-dialog-desc">
          <p>{description}</p>
        </div>
        <div className="shukr-dialog-actions">
          <button className="shukr-dialog-btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="shukr-dialog-btn btn-confirm" 
            onClick={() => { onConfirm(); onClose(); }}
            style={isDanger ? { background: 'var(--color-danger)' } : {}}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onSubmit: (val: string) => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({ isOpen, onClose, title, placeholder, defaultValue = '', onSubmit }) => {
  const [val, setVal] = useState(defaultValue);

  React.useEffect(() => {
    if (isOpen) setVal(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;
  return (
    <div className="shukr-dialog-overlay" onClick={onClose}>
      <div className="shukr-dialog naani-friendly" onClick={e => e.stopPropagation()}>
        <h2 className="shukr-dialog-title" style={{ marginTop: 0 }}>{title}</h2>
        <div className="shukr-dialog-desc" style={{ marginBottom: 16 }}>
          <input 
            className="massive-input"
            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1.1rem' }}
            placeholder={placeholder}
            value={val}
            onChange={e => {
              const inputVal = e.target.value;
              // Only accept English alphabets
              if (/^[a-zA-Z]*$/.test(inputVal)) {
                setVal(inputVal);
              }
            }}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') { onSubmit(val); onClose(); } }}
          />
        </div>
        <div className="shukr-dialog-actions">
          <button className="shukr-dialog-btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="shukr-dialog-btn btn-confirm" 
            onClick={() => { onSubmit(val); onClose(); }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

interface VoiceAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  languages: { value: string; label: string }[];
  initialLanguage: string;
  onSubmit: (name: string, lang: string) => void;
}

export const VoiceAddDialog: React.FC<VoiceAddDialogProps> = ({ isOpen, onClose, title, languages, initialLanguage, onSubmit }) => {
  const [name, setName] = useState('');
  const [lang, setLang] = useState(initialLanguage);
  const [showLangSelect, setShowLangSelect] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setLang(initialLanguage);
      setShowLangSelect(false);
    }
  }, [isOpen, initialLanguage]);

  if (!isOpen) return null;

  return (
    <>
      <div className="shukr-dialog-overlay" onClick={onClose}>
        <div className="shukr-dialog naani-friendly" onClick={e => e.stopPropagation()}>
          <h2 className="shukr-dialog-title" style={{ marginTop: 0 }}>{title}</h2>
          
          <div className="shukr-dialog-desc" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-primary)' }}>VOICE NAME</label>
                <input 
                  className="massive-input"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1.1rem' }}
                  placeholder="e.g. MyVoice"
                  value={name}
                  onChange={e => {
                    const val = e.target.value;
                    // Only accept English alphabets
                    if (/^[a-zA-Z]*$/.test(val)) {
                      setName(val);
                    }
                  }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onSubmit(name, lang); onClose(); } }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-primary)' }}>RECORDING LANGUAGE</label>
                <button 
                  className="btn-icon-ios" 
                  onClick={() => setShowLangSelect(true)} 
                  aria-label="Recording Language" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 12,
                    width: '100%', 
                    height: 52, 
                    borderRadius: 14,
                    padding: '0 16px',
                    background: 'white',
                    border: '1.5px solid rgba(45, 90, 39, 0.15)',
                    boxShadow: 'var(--shadow-soft)',
                    justifyContent: 'flex-start'
                  }}
                >
                  <Mic size={18} color="var(--color-primary)" />
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--color-primary)' }}>{getLanguageLabel(lang).toUpperCase()}</div>
                </button>
              </div>
            </div>
          </div>

          <div className="shukr-dialog-actions">
            <button className="shukr-dialog-btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="shukr-dialog-btn btn-confirm" 
              disabled={!name.trim()}
              onClick={() => { onSubmit(name, lang); onClose(); }}
            >
              Create
            </button>
          </div>
        </div>
      </div>

      <SelectDialog 
        isOpen={showLangSelect} 
        onClose={() => setShowLangSelect(false)} 
        title="Select Language" 
        options={languages} 
        selectedValue={lang} 
        onSelect={(val) => setLang(val)} 
      />
    </>
  );
};

interface SelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onSelect: (val: string) => void;
}

export const SelectDialog: React.FC<SelectDialogProps> = ({ isOpen, onClose, title, options, selectedValue, onSelect }) => {
  if (!isOpen) return null;
  return (
    <div className="shukr-dialog-overlay" onClick={onClose}>
      <div className="shukr-dialog naani-friendly" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="shukr-dialog-title" style={{ margin: 0, textAlign: 'left' }}>{title}</h2>
          <button className="btn-icon" onClick={onClose} style={{ background: '#f2f2f7' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
          {options.map(opt => (
            <button
              key={opt.value}
              className="massive-input"
              style={{
                width: '100%',
                padding: '16px',
                textAlign: 'left',
                borderRadius: '16px',
                background: selectedValue === opt.value ? 'rgba(45,90,39,0.1)' : '#f2f2f7',
                color: selectedValue === opt.value ? 'var(--color-primary)' : 'inherit',
                border: selectedValue === opt.value ? '2px solid var(--color-primary)' : '2px solid transparent',
                fontSize: '1.1rem',
                cursor: 'pointer'
              }}
              onClick={() => { onSelect(opt.value); onClose(); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
