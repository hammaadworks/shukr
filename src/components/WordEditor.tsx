import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, Check, Languages, Wand2, ShieldCheck, Save, ArrowLeft, Play, Mic } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { SUPPORTED_LANGS } from '../lib/languages';
import { useAppConfig } from '../hooks/useAppConfig';
import { ShukrButton } from './ShukrButton';
import { WordCard } from './WordCard';
import { SelectDialog, ConfirmDialog } from './modals/Dialogs';
import { useAudio } from '../hooks/useAudio';
import { aiProvider } from '../lib/aiProvider';
import { universeDb } from '../lib/universeDb';

interface WordEditorProps {
  item: any | null;
  onClose?: () => void;
  onSave: (item: any, blob?: Blob | null) => void;
  onDelete: (id: string, label?: string) => void;
  onChange?: (item: any) => void;
  isNew?: boolean;
  existingWords?: any[];
  onOpenVoiceStudio?: (wordId: string, language: string) => void;
}

const getLanguageLabel = (code: string) => {
  const lang = SUPPORTED_LANGS.find(l => l.code === code);
  return lang ? lang.label : code.toUpperCase();
};

export const WordEditor: React.FC<WordEditorProps> = ({ item: initialItem, onClose, onSave, onDelete, isNew, existingWords, onChange, onOpenVoiceStudio }) => {
  const { config } = useAppConfig();
  const [item, setItem] = useState(initialItem);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { primaryLanguage } = useLanguage();
  const [helperLanguage, setHelperLanguage] = useState('en');
  const [showHelperSelect, setShowHelperSelect] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState(primaryLanguage || 'ur');
  const [activeVoiceBlob, setActiveVoiceBlob] = useState<Blob | null>(null);

  const { playClick } = useAudio();
  const languageOptions = SUPPORTED_LANGS.map(l => ({ value: l.code, label: l.label }));

  useEffect(() => {
    setItem(initialItem);
    setError(null);
    setShowDeleteConfirm(false);
  }, [initialItem]);

  useEffect(() => {
    const fetchAudio = async () => {
      if (!config) return;
      const voiceOptions = (config.voices || []).filter((p: any) => p.language === activeTab);
      const wordId = item?.id;
      if (!wordId || isNew) {
         setActiveVoiceBlob(null);
         return;
      }
      
      let foundBlob = null;
      for (const v of voiceOptions) {
        // Resolve slug to numericId
        const voiceRecord = await universeDb.voices.where({ id: v.id }).first();
        if (voiceRecord?.numericId !== undefined) {
            const rec = await universeDb.audio.get([voiceRecord.numericId, wordId]);
            if (rec?.blob) {
               foundBlob = rec.blob;
               break;
            }
        }
      }
      setActiveVoiceBlob(foundBlob);
    };
    fetchAudio();
  }, [activeTab, item?.id, config?.voices, isNew]);

  const handlePlayVoice = async () => {
     if (activeVoiceBlob) {
        const url = URL.createObjectURL(activeVoiceBlob);
        const a = new Audio(url);
        a.onended = () => URL.revokeObjectURL(url);
        a.play();
     }
  };

  if (!item) return null;

  const handleFieldChange = (field: 'translation' | 'transliteration', lang: string, val: string) => {
    setError(null);
    const updated = { ...item };
    
    if (!updated.translations) updated.translations = {};
    if (!updated.transliterations) updated.transliterations = {};

    if (field === 'translation') {
        updated.translations[lang] = val;
        if (lang === 'ur') updated.text_primary = val;
        if (lang === 'en') updated.text_secondary = val;
    } else {
        if (!updated.transliterations[lang]) updated.transliterations[lang] = {};
        updated.transliterations[lang]['en'] = val;
    }
    
    setItem(updated);
    if (onChange) onChange(updated);
  };

  const handleToggleLangVerified = (lang: string) => {
      const updated = { ...item };
      if (!updated.verifiedLangs) updated.verifiedLangs = [];
      
      if (updated.verifiedLangs.includes(lang)) {
          updated.verifiedLangs = updated.verifiedLangs.filter((l: string) => l !== lang);
      } else {
          updated.verifiedLangs.push(lang);
      }
      
      updated.verified = SUPPORTED_LANGS.every(l => updated.verifiedLangs.includes(l.code));
      
      setItem(updated);
      if (onChange) onChange(updated);
  };

  const handleToggleFullVerified = () => {
      const updated = { ...item };
      updated.verified = !updated.verified;
      if (updated.verified) {
          updated.verifiedLangs = SUPPORTED_LANGS.map(l => l.code);
      } else {
          updated.verifiedLangs = [];
      }
      setItem(updated);
      if (onChange) onChange(updated);
  };

  const handleAITranslate = async (targetLang: string) => {
      if (!config?.ai_config?.endpoint) {
          setError("AI is not configured. Please set up AI in Settings.");
          return;
      }
      
      const sourceText = item.translations?.en || item.translations?.[helperLanguage] || Object.values(item.translations || {}).find(t => typeof t === 'string' && t.trim() !== '');
      
      if (!sourceText) {
          setError("Please enter at least one translation first (preferably English) so the AI has context.");
          return;
      }

      setIsTranslating(true);
      setError(null);
      try {
          const res = await aiProvider.getSingleLanguageSuggestion(sourceText as string, targetLang, config);
          if (res) {
              const updated = { ...item };
              if (!updated.translations) updated.translations = {};
              if (!updated.transliterations) updated.transliterations = {};
              if (!updated.transliterations[targetLang]) updated.transliterations[targetLang] = {};
              
              if (res.translation) {
                  updated.translations[targetLang] = res.translation;
                  if (targetLang === 'ur') updated.text_primary = res.translation;
                  if (targetLang === 'en') updated.text_secondary = res.translation;
              }
              if (res.transliteration) {
                  updated.transliterations[targetLang]['en'] = res.transliteration;
              }
              
              setItem(updated);
              if (onChange) onChange(updated);
          } else {
              setError("AI translation returned empty result.");
          }
      } catch (e: any) {
          console.error("AI translation failed", e);
          setError(e.message || "AI translation failed.");
      } finally {
          setIsTranslating(false);
      }
  };

  const handleSaveClick = () => {
    const translations = item.translations || {};
    const pText = (translations[primaryLanguage] || '').trim();
    const sText = (translations[helperLanguage] || '').trim();

    if (!pText && !sText && Object.keys(translations).length === 0) {
        setError("Please enter a word.");
        return;
    }

    const englishText = (translations['en'] || sText || pText || '').trim();
    let finalId = item.id;

    if (isNew || item.id.startsWith('word_')) {
      finalId = englishText.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '_');
    }

    if (!finalId) {
       setError("Could not generate a valid ID.");
       return;
    }

    if (existingWords) {
        const isDuplicate = existingWords.some(w => {
            if (w.id === item.id) return false; 
            const anyMatch = Object.keys(translations).some(lang => {
                const val = translations[lang];
                return val && w.translations?.[lang]?.toLowerCase() === val.toLowerCase();
            });
            return anyMatch || w.id === finalId;
        });

        if (isDuplicate) {
            setError("This word already exists in your dictionary.");
            return;
        }
    }

    onSave({ 
      ...item, 
      id: finalId,
      translations: translations,
      transliterations: item.transliterations || {},
      verified: !!item.verified,
      verifiedLangs: item.verifiedLangs || [],
      doodle_shapes: item.doodle_shapes || ['custom']
    }, null);
  };

  return (
    <div className="voice-studio-fullscreen" dir="ltr" style={{ zIndex: 3000, position: 'fixed', inset: 0, background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="apple-header consistent-header" dir="ltr" style={{ borderBottom: '1px solid rgba(45, 90, 39, 0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 8px' }}>
          {/* Back/Close */}
          <button className="btn-icon-ios" onClick={onClose} aria-label="Close" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ArrowLeft size={24} color="var(--color-primary)" />
          </button>

          {/* Center: Shukr */}
          <div className="shukr-button-wrapper" style={{ transform: 'scale(0.9)' }}>
            <ShukrButton
              onSOS={() => {
                if (typeof (window as any)._showSOS === 'function') {
                  (window as any)._showSOS();
                }
              }}
              onHome={() => onClose?.()}
              playClick={playClick}
              onOpenSettings={() => { onClose?.(); window.location.hash = '#settings'; }}
            />
          </div>

          {/* Info Language Selector */}
          <button
            className="btn-icon-ios highlight"
            onClick={() => setShowHelperSelect(true)}
            title="Info Language"
            style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-accent)', border: 'none', display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 12px', borderRadius: 16 }}
          >
            <Languages size={16} />
            <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>{helperLanguage.toUpperCase()}</div>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="studio-main-brand" style={{ padding: '24px 0', gap: 16, justifyContent: 'flex-start', overflowY: 'auto' }}>
        
        {/* Word Card Variant 1 */}
        <div style={{ width: '100%', maxWidth: 600, padding: '0 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 300 }}>
             <WordCard 
                item={item} 
                isFocused={false} 
                onClick={() => {}} 
                variant={1} 
                languageOverride={activeTab}
                helperLanguageOverride={helperLanguage}
                forceDualMode={true}
             />
          </div>
        </div>

        {error && (
            <div style={{ width: '100%', maxWidth: 500, padding: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1rem', background: 'rgba(220, 38, 38, 0.08)', color: 'var(--color-danger)', borderRadius: '16px', fontSize: '0.95rem', fontWeight: 700 }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            </div>
        )}

        {/* Scrollable Language Tabs */}
        <div style={{ width: '100%', overflowX: 'auto', display: 'flex', gap: 8, padding: '8px 16px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', flexShrink: 0 }}>
          {SUPPORTED_LANGS.map(lang => {
              const isVerified = item.verifiedLangs?.includes(lang.code);
              return (
                <button 
                  key={lang.code}
                  onClick={() => setActiveTab(lang.code)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '100px',
                    whiteSpace: 'nowrap',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    background: activeTab === lang.code ? 'var(--color-primary)' : 'white',
                    color: activeTab === lang.code ? 'white' : 'var(--color-text-muted)',
                    boxShadow: activeTab === lang.code ? '0 4px 12px rgba(45, 90, 39, 0.2)' : 'var(--shadow-soft)',
                    border: activeTab === lang.code ? 'none' : '1px solid rgba(45, 90, 39, 0.05)',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
                  }}
                >
                  {lang.label}
                  {isVerified && <ShieldCheck size={16} color={activeTab === lang.code ? 'white' : 'var(--color-success, #34c759)'} />}
                </button>
              );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px', flexShrink: 0 }}>
            {/* Audio Management */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'white', borderRadius: 24, border: '1px solid rgba(45, 90, 39, 0.1)', boxShadow: 'var(--shadow-soft)' }}>
               <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                   <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                       Audio Pronunciation
                   </label>
                   <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                       {activeVoiceBlob ? 'Custom audio recorded' : 'No custom audio'}
                   </span>
               </div>
               {activeVoiceBlob && (
                   <button 
                       onClick={handlePlayVoice} 
                       title="Play Audio"
                       style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-accent)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                   >
                       <Play size={20} fill="currentColor" />
                   </button>
               )}
               <button 
                   onClick={() => {
                       if (isNew) {
                           setError("Please save the concept first before recording audio.");
                           return;
                       }
                       if (onOpenVoiceStudio) onOpenVoiceStudio(item.id, activeTab);
                   }}
                   title={activeVoiceBlob ? 'Edit Audio' : 'Record Audio'}
                   style={{ padding: '0 16px', height: 44, borderRadius: 22, background: 'var(--color-primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
               >
                   <Mic size={16} />
                   {activeVoiceBlob ? 'Edit' : 'Record'}
               </button>
            </div>

            {/* Translation Input */}
            <div style={{ background: 'white', borderRadius: 24, padding: 16, border: '1px solid rgba(45, 90, 39, 0.1)', boxShadow: 'var(--shadow-soft)' }}>
               <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
                   {getLanguageLabel(activeTab)} Translation
               </label>
               <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                     dir={activeTab === 'ur' || activeTab === 'ar' ? 'rtl' : 'ltr'}
                     value={item.translations?.[activeTab] || ''}
                     onChange={e => handleFieldChange('translation', activeTab, e.target.value)}
                     style={{ flex: 1, padding: '16px 20px', borderRadius: 16, border: '2px solid rgba(45, 90, 39, 0.1)', fontSize: activeTab === 'ur' || activeTab === 'ar' ? '2.2rem' : '1.4rem', fontFamily: activeTab === 'ur' || activeTab === 'ar' ? 'var(--font-ur)' : 'var(--font-main)', outline: 'none', minWidth: 0, color: 'var(--color-primary)' }}
                     placeholder="Type translation..."
                  />
                  <button 
                     onClick={() => handleAITranslate(activeTab)}
                     disabled={isTranslating}
                     title="AI Translate"
                     style={{ width: 64, borderRadius: 16, background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-accent)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                     {isTranslating ? <div className="spinner" style={{width: 24, height: 24, border: '3px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}} /> : <Wand2 size={28} strokeWidth={2.5} />}
                  </button>
               </div>
            </div>

            {/* Transliteration Input */}
            <div style={{ background: 'white', borderRadius: 24, padding: 16, border: '1px solid rgba(45, 90, 39, 0.1)', boxShadow: 'var(--shadow-soft)' }}>
               <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
                   Pronunciation / Romanization
               </label>
               <input 
                  dir="ltr"
                  value={item.transliterations?.[activeTab]?.['en'] || ''}
                  onChange={e => handleFieldChange('transliteration', activeTab, e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '2px solid rgba(45, 90, 39, 0.1)', fontSize: '1.2rem', fontFamily: 'var(--font-main)', outline: 'none', color: 'var(--color-text)' }}
                  placeholder={`How does it sound in English letters?`}
               />
            </div>

            {/* Verify Tab Lang Toggle */}
            <div 
               onClick={() => handleToggleLangVerified(activeTab)}
               style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: item.verifiedLangs?.includes(activeTab) ? 'rgba(52, 199, 89, 0.08)' : 'white', borderRadius: 24, border: `2px solid ${item.verifiedLangs?.includes(activeTab) ? 'var(--color-success, #34c759)' : 'rgba(45, 90, 39, 0.1)'}`, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-soft)' }}
            >
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${item.verifiedLangs?.includes(activeTab) ? 'var(--color-success, #34c759)' : 'rgba(0,0,0,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.verifiedLangs?.includes(activeTab) ? 'var(--color-success, #34c759)' : 'transparent', transition: 'all 0.2s ease' }}>
                   {item.verifiedLangs?.includes(activeTab) && <Check color="white" size={18} strokeWidth={4} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontWeight: 900, fontSize: '1.05rem', color: item.verifiedLangs?.includes(activeTab) ? 'var(--color-success, #34c759)' : 'var(--color-text)' }}>Verify {getLanguageLabel(activeTab)}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Lock translation and pronunciation</span>
                </div>
            </div>
        </div>

        {/* Global Action Area */}
        <div style={{ width: '100%', maxWidth: 500, padding: '24px 16px 40px 16px', marginTop: 'auto', borderTop: '2px dashed rgba(45, 90, 39, 0.08)' }}>
            
            {/* Verify Full Word */}
            <div 
               onClick={handleToggleFullVerified}
               style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: item.verified ? 'rgba(212, 175, 55, 0.1)' : 'white', borderRadius: 24, border: `2px solid ${item.verified ? 'var(--color-accent)' : 'rgba(45, 90, 39, 0.1)'}`, cursor: 'pointer', marginBottom: 24, boxShadow: item.verified ? '0 8px 20px rgba(212, 175, 55, 0.2)' : 'var(--shadow-soft)', transition: 'all 0.3s ease' }}
            >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: item.verified ? 'var(--color-accent)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                    {item.verified && <ShieldCheck color="white" size={24} strokeWidth={2.5} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.2rem', color: item.verified ? 'var(--color-accent)' : 'var(--color-text)' }}>Fully Verified Concept</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Mark all {SUPPORTED_LANGS.length} languages as reviewed</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleSaveClick} style={{ flex: 1, height: 72, borderRadius: 24, background: 'var(--color-primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: '1.3rem', fontWeight: 900, boxShadow: '0 12px 30px rgba(45, 90, 39, 0.25)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <Save size={28} /> {isNew ? 'Create Concept' : 'Save Concept'}
                </button>
                {!isNew && (
                    <button onClick={() => setShowDeleteConfirm(true)} style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(220, 38, 38, 0.1)', color: 'var(--color-danger)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                        <Trash2 size={28} />
                    </button>
                )}
            </div>
        </div>
      </main>

      <SelectDialog isOpen={showHelperSelect} onClose={() => setShowHelperSelect(false)} title="Display Context Language" options={languageOptions} selectedValue={helperLanguage} onSelect={setHelperLanguage} />

      <ConfirmDialog 
         isOpen={showDeleteConfirm} 
         onClose={() => setShowDeleteConfirm(false)} 
         title="Delete Concept?" 
         description={`Are you sure you want to permanently delete "${item.translations?.en || item.text_secondary || 'this word'}" and all its translations?`} 
         isDanger={true} 
         onConfirm={() => onDelete(item.id, item.translations?.en || item.text_secondary)} 
      />
    </div>
  );
};
