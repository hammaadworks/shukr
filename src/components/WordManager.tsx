import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Sparkles, Shield, ShieldOff, AlertCircle, RefreshCw, Plus, Volume2, Mic, RotateCcw, PenTool, Settings, Save } from 'lucide-react';
import { universeDb } from '../lib/universeDb';
import type { WordUniverseItem } from '../lib/universeDb';
import { aiProvider } from '../lib/aiProvider';
import { useAppConfig } from '../hooks/useAppConfig';
import { SUPPORTED_LANGS, GEOMETRIC_CORES, STRUCTURAL_DESCRIPTORS } from '../lib/languages';
import { DoodleCanvas } from './Doodle/DoodleCanvas';
import type { Stroke, Point as StrokePoint } from '../recognition/sketchTypes';

const VoiceAudioItem: React.FC<{ 
  wordId: string, 
  voice: { id: string, name: string, language?: string }, 
  lang: string,
  onRecord: (params: { wordId: string, voiceId: string, language: string }) => void
}> = ({ wordId, voice, lang, onRecord }) => {
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const voiceId = voice.id === 'default' ? `${lang}_default` : voice.id;

  useEffect(() => {
    const checkIfAudioExists = async () => {
      const v = await universeDb.voices.where({ id: voiceId }).first();
      const vNumericId = v?.numericId;
      
      if (vNumericId !== undefined) {
          const record = await universeDb.audio.get([vNumericId, wordId]);
          setHasRecordedAudio(!!record?.blob);
      } else {
          setHasRecordedAudio(false);
      }
    };
    checkIfAudioExists();
  }, [wordId, voiceId]);

  const handlePlayAudio = async () => {
    const v = await universeDb.voices.where({ id: voiceId }).first();
    const vNumericId = v?.numericId;

    if (vNumericId !== undefined) {
        const record = await universeDb.audio.get([vNumericId, wordId]);
        if (record?.blob) {
          const url = URL.createObjectURL(record.blob);
          const audioInstance = new Audio(url);
          audioInstance.onended = () => URL.revokeObjectURL(url);
          audioInstance.play();
        }
    }
  };

  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 12,
      marginBottom: 4
    }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{voice.name}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {hasRecordedAudio ? (
          <button 
            className="btn-icon" 
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(45, 90, 39, 0.1)', color: 'var(--color-primary)' }}
            onClick={handlePlayAudio}
          >
            <Volume2 size={16} />
          </button>
        ) : (
          <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
            <Volume2 size={16} />
          </div>
        )}
        <button 
          className="btn-icon" 
          style={{ 
            width: 32, height: 32, borderRadius: 8, 
            background: hasRecordedAudio ? 'rgba(45, 90, 39, 0.05)' : 'var(--color-danger)', 
            color: hasRecordedAudio ? 'var(--color-primary)' : 'white' 
          }}
          onClick={() => onRecord({ wordId: wordId, voiceId: voice.id, language: lang })}
        >
          <Mic size={16} />
        </button>
      </div>
    </div>
  );
};

const DoodleTrainer: React.FC<{ wordId: string, label: string, urLabel: string }> = ({ wordId, label, urLabel }) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<StrokePoint[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDoodleTemplates = async () => {
    const allTemplates = await universeDb.doodles.where('wordId').equals(wordId).toArray();
    setSavedTemplates(allTemplates);
  };

  useEffect(() => {
    fetchDoodleTemplates();
    setStrokes([]);
    setActiveStroke([]);
  }, [wordId]);

  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    setActiveStroke([{ x, y, t: Date.now() }]);
  };

  const handleMoveDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeStroke.length === 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    setActiveStroke(prev => [...prev, { x, y, t: Date.now() }]);
  };

  const handleEndDrawing = () => {
    if (activeStroke.length > 0) {
      setStrokes(prev => [...prev, activeStroke]);
      setActiveStroke([]);
    }
  };

  const handleSaveDoodle = async () => {
    if (strokes.length === 0) return;
    setIsSaving(true);
    try {
      const newDoodleTemplate = {
        id: `${wordId}_${Date.now()}`,
        wordId: wordId,
        label: label,
        en: label,
        ur: urLabel,
        strokes: strokes
      };
      await universeDb.doodles.add(newDoodleTemplate);
      setStrokes([]);
      fetchDoodleTemplates();
    } catch (e) {
      console.error('Error saving doodle:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDoodleTemplate = async (templateId: string) => {
    await universeDb.doodles.delete(templateId);
    fetchDoodleTemplates();
  };

  return (
    <div style={{ marginTop: 8, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 12 }}>
        DOODLE TRAINING
      </label>
      
      <div style={{ height: 200, position: 'relative', background: '#f9f9f9', borderRadius: 24, overflow: 'hidden', border: '2px dashed #ddd' }}>
        <DoodleCanvas 
          strokes={strokes} 
          activeStroke={activeStroke} 
          onStart={handleStartDrawing} 
          onMove={handleMoveDrawing} 
          onEnd={handleEndDrawing} 
        />
        
        {strokes.length > 0 && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 8 }}>
            <button 
              className="btn-icon" 
              style={{ background: 'white', color: 'var(--color-text-muted)', boxShadow: 'var(--shadow-soft)' }}
              onClick={() => setStrokes([])}
            >
              <RotateCcw size={20} />
            </button>
            <button 
              className="btn-save" 
              style={{ height: 44, padding: '0 16px', fontSize: '0.9rem' }}
              disabled={isSaving}
              onClick={handleSaveDoodle}
            >
              {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
              Save
            </button>
          </div>
        )}

        {strokes.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', textAlign: 'center', opacity: 0.3 }}>
            <PenTool size={48} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>DRAW DOODLE TO TRAIN</div>
          </div>
        )}
      </div>

      {savedTemplates.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {savedTemplates.map((template, _idx) => (
            <div key={template.id} style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 60, height: 60, background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 4 }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                  {template.strokes.map((stroke: Stroke, i: number) => (
                    <polyline 
                      key={i} 
                      points={stroke.map(point => `${point.x},${point.y}`).join(' ')} 
                      fill="none" 
                      stroke="var(--color-primary)" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  ))}
                </svg>
              </div>
              <button 
                onClick={() => handleDeleteDoodleTemplate(template.id)}
                style={{ position: 'absolute', top: -6, right: -6, background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface WordManagerProps {
  onClose: () => void;
  onRecord: (params: { wordId: string, voiceId: string, language: string }) => void;
}

export const WordManager: React.FC<WordManagerProps> = ({ onClose, onRecord }) => {
  const { config, updateConfig } = useAppConfig();
  const [words, setWords] = useState<WordUniverseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newWordKey, setNewWordKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAiConfig, setShowAiConfig] = useState(false);

  // Local state for the word being edited
  const [editableWord, setEditableWord] = useState<WordUniverseItem | null>(null);

  // Local state for AI config
  const [tempAiConfig, setTempAiConfig] = useState(config?.ai_config || {});

  useEffect(() => {
    if (config?.ai_config) {
      setTempAiConfig(config.ai_config);
    }
  }, [config?.ai_config]);

  const fetchAllWords = async () => {
    setIsLoading(true);
    try {
      const allWords = await universeDb.words.toArray();
      setWords(allWords);
      if (allWords.length > 0) {
        setEditableWord(allWords[currentIndex]);
      }
    } catch (e) {
      console.error('Failed to load words:', e);
      setError('Failed to load words');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllWords();
  }, []);

  useEffect(() => {
    if (words.length > 0) {
      setEditableWord(words[currentIndex]);
    }
  }, [currentIndex, words]);

  const verifiedCount = useMemo(() => words.filter(w => w.verified).length, [words]);
  const progress = words.length > 0 ? (verifiedCount / words.length) * 100 : 0;
  const isAllVerified = words.length > 0 && verifiedCount === words.length;

  const navigateNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const navigatePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const saveAndVerifyWord = async () => {
    if (!editableWord) return;
    const finalWord = { ...editableWord, verified: true };
    await universeDb.words.put(finalWord);
    
    const updatedWords = [...words];
    updatedWords[currentIndex] = finalWord;
    setWords(updatedWords);
    setEditableWord(finalWord);
  };

  const unverifyWord = async () => {
     if (!editableWord) return;
     const finalWord = { ...editableWord, verified: false };
     await universeDb.words.put(finalWord);
     
     const updatedWords = [...words];
     updatedWords[currentIndex] = finalWord;
     setWords(updatedWords);
     setEditableWord(finalWord);
  };

  const requestAiFix = async () => {
    if (!editableWord || !config || editableWord.verified) return;
    setIsAiLoading(true);
    setError(null);
    try {
      const suggestion = await aiProvider.getSuggestion(editableWord, config);
      if (suggestion) {
        const updatedWord: WordUniverseItem = {
          ...editableWord,
          translations: {
            ...editableWord.translations,
            ...suggestion.translations
          },
          transliterations: {
            ...editableWord.transliterations,
            ...suggestion.transliterations
          },
          doodle_shapes: suggestion.doodle_shapes,
          ur: suggestion.translations['ur'],
          en: suggestion.translations['en'],
          roman: suggestion.transliterations['ur']?.['en']
        };
        setEditableWord(updatedWord);
      }
    } catch (e: any) {
      setError(e.message || 'AI correction failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  const addNewWord = async () => {
    if (!newWordKey.trim() || !config) return;
    
    const exists = words.some(w => 
      w.id.toLowerCase() === newWordKey.trim().toLowerCase() ||
      (w.translations?.en || w.en || '').toLowerCase() === newWordKey.trim().toLowerCase()
    );

    if (exists) {
      setError(`"${newWordKey}" already exists.`);
      return;
    }

    setIsAdding(true);
    setError(null);
    try {
      const suggestion = await aiProvider.getSuggestion(newWordKey.trim(), config);
      if (suggestion) {
        const generatedId = (suggestion.translations['en'] || newWordKey).toLowerCase().replace(/[^a-z0-9]/g, '_');
        const newWordEntry: WordUniverseItem = {
          id: generatedId,
          icon: 'circle-help',
          next: [],
          usageCount: 0,
          lastUsedAt: Date.now(),
          timeBias: [],
          doodle_shapes: suggestion.doodle_shapes,
          translations: suggestion.translations,
          transliterations: suggestion.transliterations,
          verified: false,
          ur: suggestion.translations['ur'],
          en: suggestion.translations['en'],
          roman: suggestion.transliterations['ur']?.['en'],
          category: 'cat_custom',
          categoryId: 'cat_custom'
        };

        await universeDb.words.put(newWordEntry);
        const newWordsList = [...words, newWordEntry];
        setWords(newWordsList);
        setCurrentIndex(newWordsList.length - 1);
        setNewWordKey('');
      }
    } catch (e: any) {
      setError(e.message || 'AI generation failed');
    } finally {
      setIsAdding(false);
    }
  };

  const updateWordTranslation = (langCode: string, value: string) => {
    if (!editableWord) return;
    setEditableWord({
      ...editableWord,
      translations: { ...editableWord.translations, [langCode]: value }
    });
  };

  const updateWordTransliteration = (sourceLang: string, targetLang: string, value: string) => {
    if (!editableWord) return;
    const currentTransliterations = { ...(editableWord.transliterations || {}) };
    if (!currentTransliterations[sourceLang]) currentTransliterations[sourceLang] = {};
    currentTransliterations[sourceLang] = { ...currentTransliterations[sourceLang], [targetLang]: value };
    setEditableWord({ ...editableWord, transliterations: currentTransliterations });
  };

  const toggleWordDoodleShape = (shape: string) => {
    if (!editableWord) return;
    const currentShapes = [...(editableWord.doodle_shapes || [])];
    if (currentShapes.includes(shape)) {
      setEditableWord({ ...editableWord, doodle_shapes: currentShapes.filter(s => s !== shape) });
    } else {
      setEditableWord({ ...editableWord, doodle_shapes: [...currentShapes, shape] });
    }
  };

  if (isLoading) {
    return (
      <div className="settings-panel naani-friendly" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={48} className="animate-spin" color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className="settings-panel naani-friendly" lang="en" dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>
      <div className="settings-header">
        <button className="btn-icon large-icon" onClick={onClose}>
          <ChevronLeft size={36} />
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2 style={{ margin: 0 }}>Word Manager</h2>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {verifiedCount} / {words.length} Verified
          </div>
        </div>
        <button className="btn-icon large-icon" onClick={() => setShowAiConfig(!showAiConfig)}>
          <Settings size={32} color={showAiConfig ? 'var(--color-primary)' : 'currentColor'} />
        </button>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ height: 12, width: '100%', background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: isAllVerified ? 'var(--color-primary)' : 'var(--color-accent)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      <div className="settings-content" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
        {showAiConfig && (
          <div style={{ 
            background: 'white', 
            padding: 24, 
            borderRadius: 32, 
            boxShadow: 'var(--shadow-soft)',
            border: '2px solid var(--color-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} /> AI Configuration
            </h3>
            
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 8 }}>AI ENDPOINT (URL)</label>
              <input 
                className="massive-input"
                style={{ width: '100%', height: 50, padding: '0 16px', fontSize: '1rem', borderRadius: 12, background: '#f9f9f9', border: '1px solid #eee' }}
                placeholder="https://..."
                value={tempAiConfig.endpoint || ''}
                onChange={e => setTempAiConfig({ ...tempAiConfig, endpoint: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 8 }}>API KEY</label>
              <input 
                type="password"
                className="massive-input"
                style={{ width: '100%', height: 50, padding: '0 16px', fontSize: '1rem', borderRadius: 12, background: '#f9f9f9', border: '1px solid #eee' }}
                placeholder="Enter API Key"
                value={tempAiConfig.apiKey || ''}
                onChange={e => setTempAiConfig({ ...tempAiConfig, apiKey: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 8 }}>MODEL NAME</label>
              <input 
                className="massive-input"
                style={{ width: '100%', height: 50, padding: '0 16px', fontSize: '1rem', borderRadius: 12, background: '#f9f9f9', border: '1px solid #eee' }}
                placeholder="e.g. gemini-1.5-flash"
                value={tempAiConfig.model || ''}
                onChange={e => setTempAiConfig({ ...tempAiConfig, model: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 8 }}>AUTH TYPE</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['none', 'bearer', 'basic'].map(type => (
                  <button 
                    key={type}
                    style={{ 
                      flex: 1, height: 44, borderRadius: 12, border: 'none', 
                      background: tempAiConfig.authType === type ? 'var(--color-primary)' : '#f2f2f7',
                      color: tempAiConfig.authType === type ? 'white' : 'var(--color-text)',
                      fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase'
                    }}
                    onClick={() => setTempAiConfig({ ...tempAiConfig, authType: type as any })}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="btn-save" 
              style={{ height: 50, borderRadius: 16, fontSize: '1rem' }}
              onClick={async () => {
                if (config) {
                   await updateConfig({ ...config, ai_config: tempAiConfig });
                   setShowAiConfig(false);
                }
              }}
            >
              Update AI Credentials
            </button>
          </div>
        )}

        <div style={{ 
          background: 'var(--color-bg)', 
          padding: 16, 
          borderRadius: 24, 
          border: '2px solid rgba(45, 90, 39, 0.1)',
          display: 'flex',
          gap: 12,
          alignItems: 'center'
        }}>
          <input 
            className="massive-input"
            style={{ 
              flex: 1, height: 60, padding: '0 20px', fontSize: '1.2rem', 
              borderRadius: 16, border: 'none', background: 'white'
            }}
            placeholder="Quick Add Word (e.g. Water)"
            value={newWordKey}
            onChange={e => setNewWordKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNewWord()}
          />
          <button 
            className="btn-save" 
            style={{ 
              width: 60, height: 60, borderRadius: 16, padding: 0, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: !newWordKey.trim() || isAdding ? 0.5 : 1
            }}
            disabled={!newWordKey.trim() || isAdding}
            onClick={addNewWord}
          >
            {isAdding ? <RefreshCw className="animate-spin" size={24} /> : <Plus size={32} />}
          </button>
        </div>

        {isAllVerified ? (
          <div style={{ 
            background: 'rgba(45, 90, 39, 0.1)', 
            padding: 40, 
            borderRadius: 32, 
            textAlign: 'center',
            border: '2px dashed var(--color-primary)'
          }}>
            <Check size={80} color="var(--color-primary)" style={{ marginBottom: 20 }} />
            <h2 style={{ color: 'var(--color-primary)' }}>All Words Verified!</h2>
            <p>Your vocabulary is now clean and optimized.</p>
            <button className="btn-save w-full" style={{ marginTop: 20 }} onClick={onClose}>
              Finish
            </button>
          </div>
        ) : editableWord ? (
          <>
            <div style={{ 
              background: 'white', 
              padding: 24, 
              borderRadius: 32, 
              boxShadow: 'var(--shadow-soft)',
              opacity: editableWord.verified ? 0.7 : 1,
              pointerEvents: editableWord.verified ? 'none' : 'auto',
              border: editableWord.verified ? '2px solid var(--color-primary)' : '2px solid transparent'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#8e8e93' }}>WORD {currentIndex + 1} OF {words.length}</span>
                {editableWord.verified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontWeight: 800 }}>
                    <Shield size={16} /> VERIFIED
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {SUPPORTED_LANGS.map(lang => (
                  <div key={lang.code} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                      {lang.label} Translation
                    </label>
                    <input 
                       className="massive-input"
                       style={{ 
                         width: '100%', height: 60, fontSize: lang.code === 'ur' || lang.code === 'ar' ? '2rem' : '1.3rem', 
                         fontFamily: lang.code === 'ur' || lang.code === 'ar' ? 'var(--font-ur)' : 'inherit',
                         fontWeight: 800, background: '#f9f9f9', border: '1px solid #eee', borderRadius: 12, padding: '0 16px'
                       }}
                       value={editableWord.translations?.[lang.code] || ''}
                       onChange={e => updateWordTranslation(lang.code, e.target.value)}
                    />

                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Pronunciation Guides (Transliterations)
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {SUPPORTED_LANGS.filter(t => t.code !== lang.code).map(target => {
                           const currentVal = editableWord.transliterations?.[lang.code]?.[target.code] || '';
                           const shouldShow = target.code === 'en' || target.code === 'ur' || currentVal;
                           if (!shouldShow) return null;

                           return (
                             <div key={target.code} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                               <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#aaa', minWidth: 60 }}>IN {target.code.toUpperCase()}</span>
                               <input 
                                 style={{ flex: 1, height: 32, fontSize: '0.85rem', borderRadius: 8, border: '1px solid #eee', padding: '0 8px' }}
                                 placeholder={`Phonetic ${lang.code} in ${target.label}`}
                                 value={currentVal}
                                 onChange={e => updateWordTransliteration(lang.code, target.code, e.target.value)}
                               />
                             </div>
                           );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Voices
                      </label>
                      <VoiceAudioItem wordId={editableWord.id} voice={{ id: 'default', name: 'System Default' }} lang={lang.code} onRecord={onRecord} />
                      {(config?.voices || []).map((voice: any) => (
                        <VoiceAudioItem key={`${voice.id}_${lang.code}`} wordId={editableWord.id} voice={voice} lang={lang.code} onRecord={onRecord} />
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 12 }}>DOODLE SHAPES</label>
                  
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#aaa', display: 'block', marginBottom: 6 }}>GEOMETRIC CORE</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {GEOMETRIC_CORES.map(shape => (
                        <button 
                          key={shape}
                          onClick={() => toggleWordDoodleShape(shape)}
                          style={{ 
                            padding: '6px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, border: 'none',
                            background: editableWord.doodle_shapes?.includes(shape) ? 'var(--color-primary)' : '#f2f2f7',
                            color: editableWord.doodle_shapes?.includes(shape) ? 'white' : '#666'
                          }}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#aaa', display: 'block', marginBottom: 6 }}>STRUCTURAL DESCRIPTORS</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {STRUCTURAL_DESCRIPTORS.map(shape => (
                        <button 
                          key={shape}
                          onClick={() => toggleWordDoodleShape(shape)}
                          style={{ 
                            padding: '6px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, border: 'none',
                            background: editableWord.doodle_shapes?.includes(shape) ? 'var(--color-accent)' : '#f2f2f7',
                            color: editableWord.doodle_shapes?.includes(shape) ? 'white' : '#666'
                          }}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <DoodleTrainer 
                  wordId={editableWord.id} 
                  label={editableWord.translations?.['en'] || ''} 
                  urLabel={editableWord.translations?.['ur'] || ''} 
                />
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)', fontWeight: 700, padding: '0 10px' }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn-save" 
                style={{ 
                  flex: 1, height: 70, background: 'var(--color-accent)', color: 'white', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: editableWord.verified ? 0.5 : 1
                }}
                disabled={isAiLoading || editableWord.verified}
                onClick={requestAiFix}
              >
                {isAiLoading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                AI Fix
              </button>

              <button 
                className="btn-save" 
                style={{ 
                  flex: 1, height: 70, 
                  background: 'var(--color-primary)', 
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
                }}
                onClick={saveAndVerifyWord}
              >
                <Save />
                Save & Verify
              </button>
            </div>

            {editableWord.verified && (
               <button 
                 className="btn-icon w-full" 
                 style={{ height: 50, borderRadius: 16, background: '#eee', color: '#666', fontWeight: 700 }}
                 onClick={unverifyWord}
               >
                 <ShieldOff size={18} /> Unlock to Edit
               </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button 
                className="btn-icon" 
                style={{ width: 80, height: 80, borderRadius: 24, background: 'white', border: '1px solid #eee' }}
                onClick={navigatePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={40} color={currentIndex === 0 ? '#ccc' : 'var(--color-primary)'} />
              </button>

              <button 
                className="btn-icon" 
                style={{ width: 80, height: 80, borderRadius: 24, background: 'white', border: '1px solid #eee' }}
                onClick={navigateNext}
                disabled={currentIndex === words.length - 1}
              >
                <ChevronRight size={40} color={currentIndex === words.length - 1 ? '#ccc' : 'var(--color-primary)'} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>No words found.</div>
        )}
      </div>
    </div>
  );
};
