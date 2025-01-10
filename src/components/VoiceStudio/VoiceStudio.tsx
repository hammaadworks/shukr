import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Check, RotateCcw, Search, ChevronLeft, ChevronRight, Plus, Trash2, Play, ChevronDown, Edit2
} from 'lucide-react';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { audioStorage } from '../../lib/audioStorage';
import { useLanguage, SUPPORTED_LANGS } from '../../hooks/useLanguage';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';
import { AudioWaveform } from './AudioWaveform';
import { AudioTrimmer } from './AudioTrimmer';
import { decodeAudioData, trimAudioBuffer, audioBufferToWavBlob } from '../../lib/audioUtils';
import { WordCard } from '../WordCard';
import { AlertDialog, ConfirmDialog, PromptDialog, SelectDialog } from '../modals/Dialogs';

interface VoiceStudioProps {
  config: any;
  updateConfig: (newConfig: any) => void;
  onClose: () => void;
}

type RecordingState = 'idle' | 'recording' | 'reviewing';

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ config, updateConfig }) => {
  const { language: globalLanguage } = useLanguage();
  const [recordingLanguage, setRecordingLanguage] = useState(globalLanguage);
  const [activeProfile, setActiveProfile] = useState(config.activeVoiceProfile || 'default');
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  
  // Modal States
  const [alertInfo, setAlertInfo] = useState<{title: string, desc: string} | null>(null);
  const [confirmInfo, setConfirmInfo] = useState<{title: string, desc: string, isDanger?: boolean, action: () => void} | null>(null);
  const [promptInfo, setPromptInfo] = useState<{title: string, placeholder?: string, defaultValue?: string, action: (val: string) => void} | null>(null);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);

  const voiceOptions = [
    { value: 'default', label: 'System Default' },
    ...(config.voiceProfiles || []).map((p: any) => ({ value: p.id, label: p.name }))
  ];
  const currentVoiceName = voiceOptions.find(o => o.value === activeProfile)?.label || 'System Default';

  const languageOptions = SUPPORTED_LANGS.map(l => ({ value: l.code, label: l.label }));

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(1);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { isRecording, startRecording, stopRecording, lastRecordedBlob, analyser, clearLastBlob } = useVoiceRecording();

  const stopReviewAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore errors from stopping a source that hasn't started or already stopped
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
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
    const keys = await audioStorage.getAllKeys();
    setRecordedKeys(keys);
    setIsLoaded(true);
  }, []);

  useEffect(() => { 
    setTimeout(() => refreshRecordedStatus(), 0);
    return () => stopReviewAudio();
  }, [refreshRecordedStatus, activeProfile, recordingLanguage, stopReviewAudio]);

  useEffect(() => {
    setTimeout(() => setHasAutoNavigated(false), 0);
  }, [activeProfile, recordingLanguage]);

  const allWords = useMemo(() => {
    const categories = config.categories || [];
    return categories.flatMap((cat: any) => 
      (cat.items || []).map((item: any) => ({ ...item, categoryLabel: cat.label_en, categoryId: cat.id }))
    );
  }, [config]);

  const filteredWords = useFuzzySearch(allWords, searchQuery) as any[];
  const currentWord = filteredWords[currentIndex] || null;

  useEffect(() => {
    if (isLoaded && !hasAutoNavigated && filteredWords.length > 0) {
      const firstUnrecorded = filteredWords.findIndex(w => !recordedKeys.some(k => k === `${activeProfile}_${w.id}_${recordingLanguage}`));
      if (firstUnrecorded !== -1) {
        // Use timeout to avoid synchronous setState in effect warning
        setTimeout(() => {
            setCurrentIndex(firstUnrecorded);
            setHasAutoNavigated(true);
        }, 0);
      } else {
        setTimeout(() => setHasAutoNavigated(true), 0);
      }
    }
  }, [isLoaded, hasAutoNavigated, filteredWords, recordedKeys, activeProfile, recordingLanguage]);

  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

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
      const elapsed = ctx.currentTime - startSysTime;
      if (elapsed >= playDuration) {
        setIsPlaying(false);
        setPlaybackProgress(trimStart);
        return;
      }
      const currentPos = startTime + elapsed;
      setPlaybackProgress(currentPos / duration);
      animationRef.current = requestAnimationFrame(updateProgress);
    };
    
    updateProgress();

    source.onended = () => {
      if (sourceNodeRef.current === source) {
        setIsPlaying(false);
        setPlaybackProgress(trimStart);
      }
    };
  }, [audioBuffer, trimStart, trimEnd, stopReviewAudio]);

  useEffect(() => {
    if (lastRecordedBlob && !isRecording && recordingState === 'recording') {
      const initBuffer = async () => {
        const ctx = getAudioContext();
        try {
          const buffer = await decodeAudioData(lastRecordedBlob, ctx);
          setAudioBuffer(buffer);
          setRecordingState('reviewing');
        } catch (e) {
          console.error("Failed to decode audio", e);
          handleRedo();
        }
      };
      initBuffer();
    }
  }, [lastRecordedBlob, isRecording, recordingState]);

  // Auto-play when buffer is ready (with 500ms loop delay)
  useEffect(() => {
    if (recordingState === 'reviewing' && audioBuffer && !isPlaying) {
      const timer = setTimeout(() => playReviewAudio(), 1000);
      return () => clearTimeout(timer);
    }
  }, [recordingState, audioBuffer, isPlaying, playReviewAudio]);

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
    if (!currentWord || !audioBuffer) return;
    
    const ctx = getAudioContext();
    const duration = audioBuffer.duration;
    const trimmedBuffer = trimAudioBuffer(audioBuffer, ctx, trimStart * duration, trimEnd * duration);
    const finalBlob = audioBufferToWavBlob(trimmedBuffer);

    const storageKey = `${activeProfile}_${currentWord.id}_${recordingLanguage}`;
    await audioStorage.set(storageKey, finalBlob);
    refreshRecordedStatus();
    handleNext();
  }, [currentWord, audioBuffer, trimStart, trimEnd, activeProfile, recordingLanguage, refreshRecordedStatus, handleNext]);

  const toggleRecording = useCallback(async () => {
    if (recordingState === 'idle') {
      setRecordingState('recording');
      await startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentIndex(0);
    handleRedo();
  };

  const handleAddProfile = () => {
    setPromptInfo({
        title: "New Voice Profile",
        placeholder: "e.g. My Voice",
        defaultValue: "My Voice",
        action: (name) => {
            const id = `voice_${Date.now()}`;
            const newProfiles = [...(config.voiceProfiles || []), { id, name }];
            updateConfig({ ...config, voiceProfiles: newProfiles, activeVoiceProfile: id });
            setActiveProfile(id);
        }
    });
  };

  const handleRenameProfile = () => {
    if (activeProfile === 'default') {
      setAlertInfo({ title: "Cannot Rename", desc: "You cannot rename the system default profile." });
      return;
    }
    const profile = (config.voiceProfiles || []).find((p: any) => p.id === activeProfile);
    if (!profile) return;

    setPromptInfo({
      title: "Rename Profile",
      placeholder: "e.g. New Name",
      defaultValue: profile.name,
      action: (newName) => {
        if (!newName.trim()) return;
        const newProfiles = config.voiceProfiles.map((p: any) => p.id === activeProfile ? { ...p, name: newName } : p);
        updateConfig({ ...config, voiceProfiles: newProfiles });
      }
    });
  };

  const handleDeleteProfile = async () => {
    if (activeProfile === 'default') {
      setAlertInfo({ title: "Cannot Delete", desc: "You cannot delete the system default profile." });
      return;
    }
    
    setConfirmInfo({
        title: "Delete Profile?",
        desc: "Are you sure you want to delete this voice profile and all its recordings? This cannot be undone.",
        isDanger: true,
        action: async () => {
            // 1. Delete all audio blobs for this profile
            const keys = await audioStorage.getAllKeys();
            const profileKeys = keys.filter(k => k.startsWith(`${activeProfile}_`));
            for (const k of profileKeys) {
              await audioStorage.delete(k);
            }
            
            // 2. Remove profile from config
            const newProfiles = (config.voiceProfiles || []).filter((p: any) => p.id !== activeProfile);
            updateConfig({ 
              ...config, 
              voiceProfiles: newProfiles, 
              activeVoiceProfile: 'default' 
            });
            setActiveProfile('default');
            refreshRecordedStatus();
        }
    });
  };

  const totalWords = allWords.length;
  const recordedCount = recordedKeys.filter(k => k.startsWith(`${activeProfile}_`)).length;
  const progressPercent = Math.round((recordedCount / totalWords) * 100) || 0;
  const isCurrentRecorded = currentWord && recordedKeys.some(k => k === `${activeProfile}_${currentWord.id}_${recordingLanguage}`);

  const handleTrimChange = useCallback((s: number, e: number) => {
    setTrimStart(s);
    setTrimEnd(e);
  }, []);

  return (
    <div className="voice-studio-fullscreen" dir="ltr">
      <main className="studio-main-brand">
        <div className="studio-profile-row" style={{ 
            display: 'grid', 
            gridTemplateColumns: '5fr 2fr 1fr 1fr 1fr', 
            gap: '8px', 
            width: '100%', 
            maxWidth: '520px',
            height: 'clamp(54px, 7vh, 64px)',
            marginBottom: 'clamp(8px, 2vh, 20px)'
        }}>
            <button 
                className="studio-profile-select"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', height: '100%', padding: '0 12px' }}
                onClick={() => setShowVoiceSelect(true)}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentVoiceName}</span>
                <ChevronDown size={18} color="var(--color-primary)" />
            </button>

            {/* Language Selection Button */}
            <button 
                className="studio-lang-select"
                onClick={() => setShowLanguageSelect(true)}
                style={{ 
                    background: 'var(--color-primary)', 
                    color: 'white', 
                    borderRadius: 12, 
                    fontSize: '0.9rem', 
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    border: 'none',
                    cursor: 'pointer',
                    height: '100%'
                }}
            >
                {recordingLanguage.toUpperCase()}
                <ChevronDown size={14} color="white" />
            </button>

            {/* Edit Profile Name */}
            <button 
                className="btn-icon" 
                style={{
                    background: '#f2f2f7', 
                    color: activeProfile === 'default' ? '#ccc' : 'var(--color-primary)', 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: activeProfile === 'default' ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleRenameProfile} 
                title="Rename Profile"
                disabled={activeProfile === 'default'}
            >
                <Edit2 size={18}/>
            </button>

            <button 
                className="btn-icon" 
                style={{
                    background: 'var(--color-primary)', 
                    color: 'white', 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                }} 
                onClick={handleAddProfile} 
                title="New Profile"
            >
                <Plus size={20}/>
            </button>
            
            <button 
                className="btn-icon" 
                style={{
                    background: activeProfile === 'default' ? '#f2f2f7' : '#ffefee', 
                    color: activeProfile === 'default' ? '#ccc' : 'var(--color-danger)', 
                    border: activeProfile === 'default' ? 'none' : '1px solid rgba(220, 38, 38, 0.1)', 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: activeProfile === 'default' ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleDeleteProfile} 
                title="Delete Profile"
                disabled={activeProfile === 'default'}
            >
                <Trash2 size={18}/>
            </button>
        </div>

        <div className="brand-progress-container" style={{ width: '100%', maxWidth: '480px' }}>
          <div className="progress-text-brand">{recordedCount} / {totalWords} ({progressPercent}%) COMPLETED</div>
          <div className="progress-bar-bg-brand">
            <div className="progress-bar-fill-brand" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="studio-search-row">
          <div className="studio-search-wrap-brand">
            <Search size={20} color="var(--color-primary)" strokeWidth={2.5} />
            <input 
                type="text" 
                placeholder="Find a word..." 
                value={searchQuery} 
                onChange={handleSearchChange} 
            />
          </div>
        </div>

        <div className="word-focal-point-brand">
          {currentWord ? (
            <>
              <div className="word-card-wrap">
                <WordCard 
                    item={currentWord} 
                    isFocused={false} 
                    onClick={() => {}} 
                    variant={1} 
                    className={isCurrentRecorded ? 'recorded-card' : ''}
                    languageOverride={recordingLanguage}
                />
              </div>
              
              <div className="record-center-brand">
                {recordingState !== 'idle' && (
                  <div className="waveform-container-brand" style={{ padding: recordingState === 'reviewing' ? '0 24px' : '0 16px' }}>
                    {recordingState === 'reviewing' ? (
                      <AudioTrimmer 
                          audioBuffer={audioBuffer}
                          onTrimChange={handleTrimChange}
                          onDragStart={stopReviewAudio}
                          color="var(--color-primary)"
                          playbackProgress={playbackProgress}
                      />
                    ) : (
                      <AudioWaveform 
                          analyser={analyser} 
                          isRecording={recordingState === 'recording'} 
                          color={recordingState === 'recording' ? 'var(--color-danger)' : 'var(--color-primary)'} 
                      />
                    )}
                  </div>
                )}

                {recordingState === 'reviewing' ? (
                  <div className="review-actions-brand">
                    <button className="review-btn btn-redo" onClick={handleRedo} title="Redo Recording">
                      <RotateCcw size={32} strokeWidth={2.5} />
                    </button>
                    <button className="review-btn btn-play" onClick={playReviewAudio} title="Play Audio" style={{ background: '#f2f2f7', color: 'var(--color-primary)', border: 'none' }}>
                      <Play size={36} strokeWidth={2.5} fill={isPlaying ? "var(--color-primary)" : "none"} />
                    </button>
                    <button className="review-btn btn-tick" onClick={handleConfirm} title="Confirm and Next">
                      <Check size={40} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    {isCurrentRecorded && recordingState === 'idle' && (
                      <button 
                        className="record-btn-brand"
                        onClick={async () => {
                          if (!currentWord) return;
                          const storageKey = `${activeProfile}_${currentWord.id}_${recordingLanguage}`;
                          const blob = await audioStorage.get(storageKey);
                          if (blob) {
                            const audioUrl = URL.createObjectURL(blob);
                            const audio = new Audio(audioUrl);
                            audio.play();
                          }
                        }}
                        style={{ background: '#f2f2f7', color: 'var(--color-primary)', borderColor: '#f2f2f7', width: 'clamp(90px, 15vh, 120px)', height: 'clamp(90px, 15vh, 120px)' }}
                        title="Play Current Recording"
                      >
                        <Play size={36} strokeWidth={2.5} fill="var(--color-primary)" />
                        <span className="record-label" style={{ marginTop: 4 }}>PLAY</span>
                      </button>
                    )}
                    <button 
                      className={`record-btn-brand ${recordingState === 'recording' ? 'recording' : ''} ${isCurrentRecorded ? 'recorded' : ''}`}
                      onClick={toggleRecording}
                      style={isCurrentRecorded && recordingState === 'idle' ? { width: 'clamp(90px, 15vh, 120px)', height: 'clamp(90px, 15vh, 120px)' } : {}}
                    >
                      <span className="mic-emoji" style={isCurrentRecorded && recordingState === 'idle' ? { fontSize: 'clamp(1.5rem, 4vh, 2.2rem)' } : {}}>🎙️</span>
                      <span className="record-label">{recordingState === 'recording' ? 'STOP' : (isCurrentRecorded ? 'RERECORD' : 'RECORD')}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="focal-nav-brand">
                <button 
                    className="nav-btn-brand" 
                    onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); handleRedo(); }} 
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft size={36} strokeWidth={2.5} />
                </button>
                <div className="word-counter-brand">{currentIndex + 1} OF {filteredWords.length}</div>
                <button 
                    className="nav-btn-brand" 
                    onClick={handleNext} 
                    disabled={currentIndex === filteredWords.length - 1}
                >
                    <ChevronRight size={36} strokeWidth={2.5} />
                </button>
              </div>
            </>
          ) : <div className="no-results">No words found.</div>}
        </div>
      </main>

      {/* Modals */}
      <AlertDialog 
          isOpen={!!alertInfo}
          onClose={() => setAlertInfo(null)}
          title={alertInfo?.title || ''}
          description={alertInfo?.desc || ''}
      />
      
      <ConfirmDialog
          isOpen={!!confirmInfo}
          onClose={() => setConfirmInfo(null)}
          title={confirmInfo?.title || ''}
          description={confirmInfo?.desc || ''}
          isDanger={confirmInfo?.isDanger}
          onConfirm={() => confirmInfo?.action()}
      />

      <PromptDialog
          isOpen={!!promptInfo}
          onClose={() => setPromptInfo(null)}
          title={promptInfo?.title || ''}
          placeholder={promptInfo?.placeholder}
          defaultValue={promptInfo?.defaultValue}
          onSubmit={(val) => promptInfo?.action(val)}
      />

      <SelectDialog
          isOpen={showVoiceSelect}
          onClose={() => setShowVoiceSelect(false)}
          title="Select Voice Profile"
          options={voiceOptions}
          selectedValue={activeProfile}
          onSelect={(val) => {
              setActiveProfile(val);
              updateConfig({ ...config, activeVoiceProfile: val });
              handleRedo();
          }}
      />

      <SelectDialog
          isOpen={showLanguageSelect}
          onClose={() => setShowLanguageSelect(false)}
          title="Select Language"
          options={languageOptions}
          selectedValue={recordingLanguage}
          onSelect={(val) => {
              setRecordingLanguage(val);
              handleRedo();
          }}
      />
    </div>
  );
};
