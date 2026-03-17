import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Check, RotateCcw, Search, ChevronLeft, ChevronRight, Plus, Trash2, Play, ChevronDown, Edit2, Settings, Languages, Lock, Mic, Type
} from 'lucide-react';
import { ShukrButton } from '../ShukrButton';
import { WordEditor } from '../WordEditor';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useAudio } from '../../hooks/useAudio';
import { universeDb } from '../../lib/universeDb';
import { useLanguage } from '../../hooks/useLanguage';
import { SUPPORTED_LANGS } from '../../lib/languages';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';
import { AudioWaveform } from './AudioWaveform';
import { AudioTrimmer } from './AudioTrimmer';
import { decodeAudioData, trimAudioBuffer, audioBufferToWavBlob } from '../../lib/audioUtils';
import { WordCard } from '../WordCard';
import { AlertDialog, ConfirmDialog, PromptDialog, SelectDialog, VoiceAddDialog } from '../modals/Dialogs';

interface VoiceStudioProps {
  config: any;
  updateConfig: (newConfig: any) => void;
  onClose: () => void;
  initialWordId?: string;
  initialVoiceId?: string;
  initialLanguage?: string;
}

type RecordingState = 'idle' | 'recording' | 'reviewing';

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ 
  config, 
  updateConfig, 
  onClose,
  initialWordId,
  initialVoiceId,
  initialLanguage
}) => {
  const { language: globalLanguage, secondaryLanguage } = useLanguage();
  const { playClick } = useAudio();
  const [recordingLanguage, setRecordingLanguage] = useState(initialLanguage || globalLanguage);
  const [helperLanguage, setHelperLanguage] = useState(secondaryLanguage || 'en');
  const [showProgressInfo, setShowProgressInfo] = useState(false);
  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [isNewWord, setIsNewWord] = useState(false);
  
  useEffect(() => {
    (window as any)._voiceStudioInfoLang = helperLanguage;
    return () => {
      delete (window as any)._voiceStudioInfoLang;
    };
  }, [helperLanguage]);

  const voiceOptions = (config.voices || [])
    .filter((p: any) => p.language === recordingLanguage)
    .map((p: any) => ({ value: p.id, label: `${p.name} (${p.language?.toUpperCase() || '?'})` }));

  const [activeVoice, setActiveVoice] = useState(() => {
    if (initialVoiceId && initialVoiceId !== 'default') return initialVoiceId;
    if (config.active_voice && config.active_voice !== 'default') return config.active_voice;
    return voiceOptions.length > 0 ? voiceOptions[0].value : '';
  });

  useEffect(() => {
    if (!voiceOptions.find((o: {value: string}) => o.value === activeVoice)) {
      if (voiceOptions.length > 0) {
        setActiveVoice(voiceOptions[0].value);
      } else {
        setActiveVoice('');
      }
    }
  }, [recordingLanguage, voiceOptions, activeVoice]);

  const [recordedWordIds, setRecordedWordIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  const [hasAutoJumped, setHasAutoJumped] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState<{title: string, desc: string} | null>(null);
  const [confirmInfo, setConfirmInfo] = useState<{title: string, desc: string, isDanger?: boolean, action: () => void} | null>(null);
  const [promptInfo, setPromptInfo] = useState<{title: string, placeholder?: string, defaultValue?: string, action: (val: string) => void} | null>(null);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [showHelperSelect, setShowHelperSelect] = useState(false);
  const [showVoiceAddDialog, setShowVoiceAddDialog] = useState(false);

  const currentVoiceName = voiceOptions.find((o: any) => o.value === activeVoice)?.label || 'No Voice Selected';
  const activeVoiceData = (config.voices || []).find((p: any) => p.id === activeVoice);
  const isEditable = activeVoiceData?.editable !== false && !!activeVoice;

  const languageOptions = SUPPORTED_LANGS.map(l => ({ value: l.code, label: l.label }));

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const loopTimeoutRef = useRef<any>(null);

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(1);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { isRecording, startRecording, stopRecording, lastRecordedBlob, analyser, clearLastBlob } = useVoiceRecording();

  const stopReviewAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
  }, []);

  const handleRedo = useCallback(() => {
    stopReviewAudio();
    clearLastBlob();
    setAudioBuffer(null);
    setRecordingState('idle');
  }, [stopReviewAudio, clearLastBlob]);

  const refreshRecordedStatus = useCallback(async () => {
    if (!activeVoice) {
      setRecordedWordIds(new Set());
      return;
    }
    
    // Resolve slug to numericId
    const voice = await universeDb.voices.where({ id: activeVoice }).first();
    if (!voice?.numericId) {
      setRecordedWordIds(new Set());
      return;
    }
    
    const records = await universeDb.audio.where('voiceNumericId').equals(voice.numericId).toArray();
    setRecordedWordIds(new Set(records.map(r => r.wordId as string)));
  }, [activeVoice]);

  useEffect(() => { 
    refreshRecordedStatus();
    setHasAutoJumped(false); // Reset jump flag when voice/lang changes
    return () => stopReviewAudio();
  }, [refreshRecordedStatus, activeVoice, recordingLanguage, stopReviewAudio]);

  const allWords = useMemo(() => {
    return (config.words || []).map((item: any) => ({ ...item }));
  }, [config.words]);

  const filteredWords = useFuzzySearch(allWords, searchQuery) as any[];
  const currentWord = filteredWords[currentIndex] || null;

  useEffect(() => {
    if (initialWordId && filteredWords.length > 0 && !hasAutoNavigated) {
      const idx = filteredWords.findIndex(w => w.id === initialWordId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        setHasAutoNavigated(true);
        setHasAutoJumped(true); // Don't double jump if navigated by ID
      }
    }
  }, [initialWordId, filteredWords, hasAutoNavigated]);

  // Auto-jump to first unrecorded word if not manually navigated by initialWordId
  useEffect(() => {
    // We only jump if we haven't jumped yet, we have words, and we have FETCHED the recorded status
    // recordedWordIds.size might be 0 if nothing is recorded, but we need to know if it's the 
    // result of a query or just initial state. 
    // Since we reset hasAutoJumped when activeVoice/recordingLanguage changes, 
    // and refreshRecordedStatus is called in the same effect, 
    // we should wait until we have a definitive answer.
    
    if (!hasAutoJumped && filteredWords.length > 0) {
      // Find first word ID that is NOT in recordedWordIds
      const firstUnrecordedIdx = filteredWords.findIndex(w => !recordedWordIds.has(w.id));
      
      // If we find an unrecorded word that is NOT the first one, it means we definitely have data
      // If we are at index 0, and it is unrecorded, we should only 'jump' (set flag) if we are sure 
      // the recordedWordIds query has finished.
      if (firstUnrecordedIdx > 0) {
        setCurrentIndex(firstUnrecordedIdx);
        setHasAutoJumped(true);
      } else if (firstUnrecordedIdx === 0) {
        // If we have at least one recorded word in the whole set, then we know query finished
        if (recordedWordIds.size > 0) {
           // We are already at 0, and it's unrecorded. Just mark as jumped.
           setHasAutoJumped(true);
        }
      }
    }
  }, [filteredWords, recordedWordIds, hasAutoJumped]);

  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playReviewAudioRef = useRef<() => void>(undefined);

  const playReviewAudio = useCallback(() => {
    if (!audioBuffer) return;
    stopReviewAudio();
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    const duration = audioBuffer.duration;
    const startTime = trimStart * duration;
    const playDuration = (trimEnd - trimStart) * duration;
    source.start(0, startTime, playDuration);
    sourceNodeRef.current = source;
    setIsPlaying(true);
    const startSysTime = ctx.currentTime;
    
    const updateProgress = () => {
      if (sourceNodeRef.current !== source) return;
      const elapsed = ctx.currentTime - startSysTime;
      if (elapsed >= playDuration) {
        setPlaybackProgress(trimStart);
        loopTimeoutRef.current = setTimeout(() => {
          if (sourceNodeRef.current === source && playReviewAudioRef.current) {
            playReviewAudioRef.current();
          }
        }, 800);
        return;
      }
      setPlaybackProgress(trimStart + (elapsed / duration));
      animationRef.current = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    source.onended = () => { /* no-op */ };
  }, [audioBuffer, trimStart, trimEnd, stopReviewAudio]);

  useEffect(() => {
    playReviewAudioRef.current = playReviewAudio;
  }, [playReviewAudio]);

  useEffect(() => {
    if (lastRecordedBlob && !isRecording && recordingState === 'recording') {
      const initBuffer = async () => {
        const ctx = getAudioContext();
        try {
          const buffer = await decodeAudioData(lastRecordedBlob, ctx);
          setAudioBuffer(buffer);
          setRecordingState('reviewing');
        } catch (e) { handleRedo(); }
      };
      initBuffer();
    }
  }, [lastRecordedBlob, isRecording, recordingState]);

  useEffect(() => {
    if (recordingState === 'reviewing' && audioBuffer && !isPlaying) {
      playReviewAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingState, audioBuffer]);

  const handleNext = useCallback(() => {
    stopReviewAudio();
    clearLastBlob();
    setAudioBuffer(null);
    setRecordingState('idle');
    if (currentIndex < filteredWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, filteredWords.length, clearLastBlob, stopReviewAudio]);

  const handleConfirm = useCallback(async () => {
    if (!currentWord || !audioBuffer || !isEditable) return;
    const ctx = getAudioContext();
    const duration = audioBuffer.duration;
    const trimmedBuffer = trimAudioBuffer(audioBuffer, ctx, trimStart * duration, trimEnd * duration);
    const finalBlob = audioBufferToWavBlob(trimmedBuffer);
    
    // Resolve slug to numericId
    const voice = await universeDb.voices.where({ id: activeVoice }).first();
    if (voice?.numericId) {
        // Use native compound primary key [voiceNumericId, wordId] for absolute best performance
        await universeDb.audio.put({ 
          voiceNumericId: voice.numericId, 
          wordId: currentWord.id, 
          blob: finalBlob 
        });
        refreshRecordedStatus();
        handleNext();
    }
  }, [currentWord, audioBuffer, trimStart, trimEnd, activeVoice, refreshRecordedStatus, handleNext, isEditable]);

  const toggleRecording = useCallback(async () => {
    if (!activeVoice) {
      setAlertInfo({ title: "No Voice", desc: "Please select or create a voice first to start recording." });
      return;
    }
    if (recordingState === 'idle') {
      setRecordingState('recording');
      await startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  }, [recordingState, startRecording, stopRecording, activeVoice]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentIndex(0);
    handleRedo();
  };

  const handleAddVoice = () => {
    setShowVoiceAddDialog(true);
  };

  const handleFinishAddVoice = async (name: string, lang: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!/^[a-zA-Z]+$/.test(trimmed)) {
      setAlertInfo({ title: "Invalid Name", desc: "Name must contain only English alphabets." });
      return;
    }

    const sanitizedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    
    const isDuplicate = await universeDb.voices.where({ name: sanitizedName, language: lang }).count() > 0;
    if (isDuplicate) {
      setAlertInfo({ title: "Duplicate Name", desc: `A voice named "${sanitizedName}" already exists for ${lang.toUpperCase()}.` });
      return;
    }

    const id = `${lang}_voice_${sanitizedName.toLowerCase()}`;
    const voiceData = { id, name: sanitizedName, language: lang, editable: true };
    await universeDb.voices.put(voiceData);
    
    const newVoices = [...(config.voices || []), voiceData];
    updateConfig({ ...config, voices: newVoices, active_voice: id });
    setActiveVoice(id);
    setRecordingLanguage(lang);
    setShowVoiceAddDialog(false);
  };

  const handleRenameVoice = () => {
    if (!isEditable || !activeVoiceData) return;
    const placeholder = `${activeVoiceData.name} (${activeVoiceData.language?.toUpperCase()})`;
    
    setPromptInfo({
      title: "Rename Voice",
      placeholder: placeholder,
      defaultValue: activeVoiceData.name,
      action: async (newName) => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === activeVoiceData.name) return;
        
        if (!/^[a-zA-Z]+$/.test(trimmed)) {
          setAlertInfo({ title: "Invalid Name", desc: "Name must contain only English alphabets." });
          return;
        }

        const sanitizedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
        if (sanitizedName === activeVoiceData.name) return;

        const newId = `${activeVoiceData.language}_voice_${sanitizedName.toLowerCase()}`;

        const duplicateCheck = await universeDb.voices.where({ id: newId }).first();
        if (duplicateCheck && duplicateCheck.id !== activeVoice) {
          setAlertInfo({ title: "Duplicate Name", desc: `A voice named "${sanitizedName}" already exists for ${activeVoiceData.language?.toUpperCase()}.` });
          return;
        }

        if (activeVoiceData.numericId) {
            await universeDb.voices.update(activeVoiceData.numericId, { 
                id: newId, 
                name: sanitizedName 
            });
        }

        const newVoices = config.voices.map((p: any) => p.id === activeVoice ? { ...p, id: newId, name: sanitizedName } : p);
        updateConfig({ 
          ...config, 
          voices: newVoices,
          active_voice: config.active_voice === activeVoice ? newId : config.active_voice
        });
        
        setActiveVoice(newId);
      }
    });
  };

  const handleDeleteVoice = async () => {
    if (!isEditable) return;
    setConfirmInfo({
        title: "Delete Voice?",
        desc: "Are you sure? This will delete all its recordings permanently.",
        isDanger: true,
        action: async () => {
            if (activeVoiceData?.numericId !== undefined) {
                await universeDb.audio.where('voiceNumericId').equals(activeVoiceData.numericId).delete();
                await universeDb.voices.delete(activeVoiceData.numericId);
            }

            const newVoices = (config.voices || []).filter((p: any) => p.id !== activeVoice);
            const fallbackVoice = newVoices.find((p: any) => p.language === recordingLanguage)?.id || (newVoices.length > 0 ? newVoices[0].id : '');
            updateConfig({ ...config, voices: newVoices, active_voice: fallbackVoice });
            setActiveVoice(fallbackVoice);
            refreshRecordedStatus();
        }
    });
  };

  const totalWords = allWords.length || 1;
  const recordedCount = recordedWordIds.size;
  const progressPercent = Math.round((recordedCount / totalWords) * 100) || 0;
  const isCurrentRecorded = currentWord && recordedWordIds.has(currentWord.id);

  const handleGoHome = () => {
    stopReviewAudio();
    onClose();
  };

  const handleSaveWord = async (word: any) => {
    await universeDb.words.put(word);
    refreshRecordedStatus();
    setEditingWord(null);
    setIsNewWord(false);
    const updatedWords = (config.words || []).map((w: any) => w.id === word.id ? word : w);
    if (!updatedWords.find((w: any) => w.id === word.id)) updatedWords.push(word);
    updateConfig({ ...config, words: updatedWords });
  };

  const handleDeleteWord = async (wordId: string) => {
    await universeDb.words.delete(wordId);
    await universeDb.audio.where('wordId').equals(wordId).delete();
    await universeDb.doodles.where('wordId').equals(wordId).delete();
    refreshRecordedStatus();
    setEditingWord(null);
    const updatedWords = (config.words || []).filter((w: any) => w.id !== wordId);
    updateConfig({ ...config, words: updatedWords });
  };

  const handleOpenAddWord = () => {
    setIsNewWord(true);
    setEditingWord({
      id: `word_${Date.now()}`,
      icon: 'star',
      next: [],
      usageCount: 0,
      lastUsedAt: 0,
      timeBias: [],
      doodle_shapes: ['custom'],
      translations: { [recordingLanguage]: '', [helperLanguage]: '' }
    });
  };

  return (
    <div className="voice-studio-fullscreen" dir="ltr">
      <header className="apple-header consistent-header" dir="ltr">
        <div className="header-grid-layout">
          <div className="header-cell">
            <button className="btn-icon-ios" onClick={() => setShowLanguageSelect(true)} aria-label="Recording Language" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Mic size={16} color="var(--color-primary)" />
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-primary)' }}>{recordingLanguage.toUpperCase()}</div>
            </button>
          </div>
          <div className="header-cell">
            <button 
              className="btn-icon-ios highlight" 
              onClick={() => setShowHelperSelect(true)} 
              title="Info Language"
              style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-accent)', border: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Languages size={16} />
              <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>{helperLanguage.toUpperCase()}</div>
            </button>
          </div>
          <div className="header-cell span-2">
            <div className="shukr-button-wrapper">
              <ShukrButton
                onSOS={() => (window as any)._showSOS?.()}
                onHome={handleGoHome}
                playClick={playClick}
                onOpenSettings={() => window.location.hash = '#settings'}
              />
            </div>
          </div>
          <div className="header-cell">
            <button 
              className={`btn-icon-ios ${showProgressInfo ? 'active' : ''}`} 
              onClick={() => setShowProgressInfo(!showProgressInfo)} 
              title="Toggle Progress"
              style={{ position: 'relative', background: 'white' }}
            >
               <svg width="34" height="34" viewBox="0 0 34 34">
                  <circle cx="17" cy="17" r="14" fill="none" stroke="rgba(45, 90, 39, 0.1)" strokeWidth="3" />
                  <circle cx="17" cy="17" r="14" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - progressPercent / 100)} strokeLinecap="round" transform="rotate(-90 17 17)" />
               </svg>
               <div style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>{progressPercent}%</div>
            </button>
          </div>
          <div className="header-cell">
            <button className="btn-icon-ios" onClick={() => window.location.hash = '#settings'} aria-label="Settings">
              <Settings size={22} color="var(--color-primary)" />
            </button>
          </div>
        </div>
      </header>

      <main className="studio-main-brand">
        {showProgressInfo && (
          <div className="brand-progress-container" style={{ animation: 'slideDown 0.3s ease', marginBottom: 8 }}>
            <div className="progress-text-brand">{recordedCount} / {totalWords} ({progressPercent}%) COMPLETED</div>
            <div className="progress-bar-bg-brand">
              <div className="progress-bar-fill-brand" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        )}

        <div className="studio-voice-row">
            <button className="studio-voice-select" onClick={() => setShowVoiceSelect(true)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentVoiceName}
                    {!isEditable && <Lock size={14} style={{ opacity: 0.6, flexShrink: 0 }} />}
                </span>
                <ChevronDown size={20} style={{ flexShrink: 0 }} />
            </button>
            <div className="voice-actions-mini">
              <button className="nav-btn-brand action-btn" onClick={handleRenameVoice} disabled={!isEditable}><Edit2 size={20} /></button>
              <button className="nav-btn-brand action-btn theme-primary" onClick={handleAddVoice}><Plus size={24} /></button>
              <button className="nav-btn-brand action-btn" onClick={handleOpenAddWord} title="Add New Word" style={{ background: 'var(--color-accent)', color: 'white' }}><Type size={20} /></button>
              <button className="nav-btn-brand action-btn theme-danger" onClick={handleDeleteVoice} disabled={!isEditable}><Trash2 size={20} /></button>
            </div>
        </div>

        <div className="studio-search-row">
          <div className="studio-search-wrap-brand">
            <Search size={22} color="var(--color-primary)" strokeWidth={2.5} />
            <input type="text" placeholder="Search words..." value={searchQuery} onChange={handleSearchChange} />
          </div>
        </div>

        <div className="word-focal-point-brand">
          {currentWord ? (
            <>
              <div className="word-card-wrap" style={{ position: 'relative' }}>
                <WordCard item={currentWord} isFocused={false} onClick={() => {}} variant={1} className={isCurrentRecorded ? 'recorded-card' : ''} languageOverride={recordingLanguage} helperLanguageOverride={helperLanguage} forceDualMode={true} />
                <button onClick={() => { setIsNewWord(false); setEditingWord(currentWord); }} style={{ position: 'absolute', top: -10, right: -10, background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-soft)', cursor: 'pointer', zIndex: 10 }} title="Edit word metadata"><Edit2 size={20} /></button>
              </div>
              <div className="record-center-brand">
                {recordingState !== 'idle' && (
                  <div className="waveform-container-brand">
                    {recordingState === 'reviewing' ? (
                      <AudioTrimmer audioBuffer={audioBuffer} onTrimChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }} onDragStart={stopReviewAudio} onDragEnd={() => playReviewAudioRef.current?.()} playbackProgress={playbackProgress} color="var(--color-primary)" />
                    ) : (
                      <AudioWaveform analyser={analyser} isRecording={recordingState === 'recording'} color="var(--color-danger)" />
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  {recordingState === 'reviewing' ? (
                    <div className="review-actions-brand">
                      <button className="review-btn btn-redo" onClick={handleRedo} title="Redo"><RotateCcw size={32} strokeWidth={2.5} /></button>
                      <button className="review-btn btn-play" onClick={isPlaying ? stopReviewAudio : () => playReviewAudioRef.current?.()} style={{ background: '#f2f2f7', color: 'var(--color-primary)' }}><Play size={36} fill={isPlaying ? "var(--color-primary)" : "none"} /></button>
                      {isEditable && <button className="review-btn btn-tick" onClick={handleConfirm} title="Confirm"><Check size={40} strokeWidth={3} /></button>}
                    </div>
                  ) : (
                    <>
                      {isCurrentRecorded && (
                        <button className="record-btn-brand" onClick={async () => {
                          const voice = await universeDb.voices.where({ id: activeVoice }).first();
                          if (voice?.numericId) {
                            const record = await universeDb.audio.get([voice.numericId, currentWord.id]);
                            if (record?.blob) {
                              const url = URL.createObjectURL(record.blob);
                              const a = new Audio(url);
                              a.onended = () => URL.revokeObjectURL(url);
                              a.play();
                            }
                          }
                        }} style={{ background: '#f2f2f7', color: 'var(--color-primary)', border: 'none' }}>
                          <Play size={36} fill="var(--color-primary)" />
                          <span className="record-label">PLAY</span>
                        </button>
                      )}
                      {isEditable ? (
                        <button className={`record-btn-brand ${recordingState === 'recording' ? 'recording' : ''}`} onClick={toggleRecording}>
                          <span className="mic-emoji">🎙️</span>
                          <span className="record-label">{recordingState === 'recording' ? 'STOP' : (isCurrentRecorded ? 'RERECORD' : 'RECORD')}</span>
                        </button>
                      ) : (
                        <div className="record-btn-brand disabled-box">
                          <span className="mic-emoji" style={{ opacity: 0.3 }}>🎙️</span>
                          <span className="record-label">LOCKED</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="focal-nav-brand">
                <button className="nav-btn-brand" onClick={() => { setCurrentIndex(p => Math.max(0, p - 1)); handleRedo(); }} disabled={currentIndex === 0}><ChevronLeft size={36} strokeWidth={2.5} /></button>
                <div className="word-counter-brand">{currentIndex + 1} OF {filteredWords.length}</div>
                <button className="nav-btn-brand" onClick={handleNext} disabled={currentIndex === filteredWords.length - 1}><ChevronRight size={36} strokeWidth={2.5} /></button>
              </div>
            </>
          ) : <div className="no-results">No words found.</div>}
        </div>
      </main>

      <AlertDialog isOpen={!!alertInfo} onClose={() => setAlertInfo(null)} title={alertInfo?.title || ''} description={alertInfo?.desc || ''} />
      <ConfirmDialog isOpen={!!confirmInfo} onClose={() => setConfirmInfo(null)} title={confirmInfo?.title || ''} description={confirmInfo?.desc || ''} isDanger={confirmInfo?.isDanger} onConfirm={() => confirmInfo?.action()} />
      <PromptDialog isOpen={!!promptInfo} onClose={() => setPromptInfo(null)} title={promptInfo?.title || ''} placeholder={promptInfo?.placeholder} defaultValue={promptInfo?.defaultValue} onSubmit={(val) => promptInfo?.action(val)} />
      <SelectDialog isOpen={showVoiceSelect} onClose={() => setShowVoiceSelect(false)} title="Select Voice" options={voiceOptions} selectedValue={activeVoice} onSelect={(val) => { setActiveVoice(val); updateConfig({ ...config, active_voice: val }); handleRedo(); }} />
      <SelectDialog isOpen={showLanguageSelect} onClose={() => setShowLanguageSelect(false)} title="Recording Language" options={languageOptions} selectedValue={recordingLanguage} onSelect={(val) => { setRecordingLanguage(val); handleRedo(); }} />
      <SelectDialog isOpen={showHelperSelect} onClose={() => setShowHelperSelect(false)} title="Info Language (Display)" options={languageOptions} selectedValue={helperLanguage} onSelect={(val) => setHelperLanguage(val)} />
      <VoiceAddDialog isOpen={showVoiceAddDialog} onClose={() => setShowVoiceAddDialog(false)} title="New Voice" languages={languageOptions} initialLanguage={recordingLanguage} onSubmit={handleFinishAddVoice} />
      {editingWord && (
        <WordEditor item={editingWord} isNew={isNewWord} onClose={() => setEditingWord(null)} onSave={handleSaveWord} onDelete={handleDeleteWord} existingWords={allWords} />
      )}
    </div>
  );
};
