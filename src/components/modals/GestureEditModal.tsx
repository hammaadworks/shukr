import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { X, Save, Mic, List, Activity, Play, Square, RotateCcw, Check, Search } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { type GestureDefinition, type GestureMappingType } from '../../recognition/gestures/types';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { AudioTrimmer } from '../VoiceStudio/AudioTrimmer';
import { AudioWaveform } from '../VoiceStudio/AudioWaveform';
import { decodeAudioData, trimAudioBuffer, audioBufferToWavBlob } from '../../lib/audioUtils';
import { universeDb } from '../../lib/universeDb';
import { PermissionDialog } from './Dialogs';

interface GestureEditModalProps {
  gesture: GestureDefinition;
  config: any;
  onClose: () => void;
  onSave: (updated: GestureDefinition, audioBlob?: Blob | null) => void;
}

type RecordingState = 'idle' | 'recording' | 'reviewing';

const SYSTEM_ACTIONS: { value: string; label_en: string; label_ur: string; icon?: string }[] = [
  { value: 'SELECT', label_en: 'Select / Speak', label_ur: 'منتخب / بولیں' },
  { value: 'NEXT', label_en: 'Next Item', label_ur: 'اگلا' },
  { value: 'CLEAR', label_en: 'Clear / Home', label_ur: 'صاف کریں' },
  { value: 'YES', label_en: 'Speak "Yes"', label_ur: 'ہاں بولیں' },
  { value: 'NAV_DOODLE', label_en: 'Open Doodle', label_ur: 'ڈرائنگ کھولیں' },
  { value: 'NAV_SETTINGS', label_en: 'Open Settings', label_ur: 'سیٹنگز کھولیں' },
  { value: 'TOGGLE_LANG', label_en: 'Switch Language', label_ur: 'زبان بدلیں' },
  { value: 'TOGGLE_BUILDER', label_en: 'Toggle Builder', label_ur: 'بلڈر کھولیں/بند کریں' },
];

export const GestureEditModal: React.FC<GestureEditModalProps> = ({ gesture, config, onClose, onSave }) => {
  const { isPrimary, language, primaryLanguage, secondaryLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<GestureMappingType>(gesture.type);
  const [labelEn, setLabelEn] = useState(gesture.label_en || '');
  const [labelUr, setLabelUr] = useState(gesture.label_ur || '');
  const [selectedValue, setSelectedValue] = useState<string | string[]>(gesture.value);
  const [searchQuery, setSearchQuery] = useState('');

  const isDualLang = primaryLanguage !== secondaryLanguage;

  // Audio State & Logic (VoiceStudio Style)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const { 
    isRecording, startRecording, stopRecording, lastRecordedBlob, analyser, clearLastBlob,
    permissionStatus, requestPermission, showPermissionExplanation, setShowPermissionExplanation 
  } = useVoiceRecording();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const handleStartMic = async () => {
    if (permissionStatus !== 'granted') {
      setShowPermissionExplanation(true);
    } else {
      setRecordingState('recording');
      await startRecording();
    }
  };

  const handleConfirmMicPermission = async () => {
    const success = await requestPermission();
    if (success) {
      setShowPermissionExplanation(false);
      setRecordingState('recording');
      await startRecording();
    }
  };
  const [trimRange, setTrimRange] = useState({ start: 0, end: 1 });
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [hasExistingAudio, setHasExistingAudio] = useState(false);

  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  };

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(trimRange.start);
  }, [trimRange.start]);

  const playAudio = useCallback(() => {
    if (!audioBuffer) return;
    stopAudio();

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const duration = audioBuffer.duration;
    const startTime = trimRange.start * duration;
    const playDuration = (trimRange.end - trimRange.start) * duration;

    source.start(0, startTime, playDuration);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    const startSysTime = ctx.currentTime;
    
    const updateProgress = () => {
      const elapsed = ctx.currentTime - startSysTime;
      if (elapsed >= playDuration) {
        setIsPlaying(false);
        setPlaybackProgress(trimRange.start);
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
        setPlaybackProgress(trimRange.start);
      }
    };
  }, [audioBuffer, trimRange, stopAudio]);

  const handleRedo = useCallback(() => {
    stopAudio();
    clearLastBlob();
    setAudioBuffer(null);
    setRecordingState('idle');
  }, [stopAudio, clearLastBlob]);

  useEffect(() => {
    const checkAudio = async () => {
      const record = await universeDb.audio.get([0, `gesture_${gesture.id}`]);
      if (record?.blob) setHasExistingAudio(true);
    };
    if (activeTab === 'audio') checkAudio();
  }, [gesture.id, activeTab]);

  useEffect(() => {
    if (lastRecordedBlob && !isRecording && recordingState === 'recording') {
      const loadAudio = async () => {
        setIsProcessingAudio(true);
        try {
          const ctx = getAudioContext();
          const buffer = await decodeAudioData(lastRecordedBlob, ctx);
          setAudioBuffer(buffer);
          setTrimRange({ start: 0, end: 1 });
          setRecordingState('reviewing');
        } catch (e) {
          console.error("Audio processing failed", e);
          handleRedo();
        } finally {
          setIsProcessingAudio(false);
        }
      };
      loadAudio();
    }
  }, [lastRecordedBlob, isRecording, recordingState, handleRedo]);

  // Auto-play on review
  useEffect(() => {
    if (recordingState === 'reviewing' && audioBuffer && !isPlaying) {
      const timer = setTimeout(() => playAudio(), 800);
      return () => clearTimeout(timer);
    }
  }, [recordingState, audioBuffer, isPlaying, playAudio]);

  const allWords = useMemo(() => {
    return (config.categories || []).flatMap((c: any) => c.items || []);
  }, [config]);

  const searchResults = useFuzzySearch(allWords, searchQuery);

  const handleSave = async () => {
    let finalBlob: Blob | null = null;
    
    if (activeTab === 'audio' && audioBuffer) {
      const ctx = getAudioContext();
      const trimmed = trimAudioBuffer(audioBuffer, ctx, trimRange.start * audioBuffer.duration, trimRange.end * audioBuffer.duration);
      finalBlob = audioBufferToWavBlob(trimmed);
      
      const gestureId = `gesture_${gesture.id}`;
      await universeDb.audio.put({ voiceNumericId: 0, wordId: gestureId, blob: finalBlob });
    }

    onSave({
      ...gesture,
      type: activeTab,
      label_en: labelEn,
      label_ur: labelUr,
      value: activeTab === 'audio' ? `audio_gesture_${gesture.id}` : selectedValue
    }, finalBlob);
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
    <div className="gesture-edit-actions-grid naani-friendly">
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
          <div className="action-dot" />
          <div className="action-text-stack">
            <span className="action-label-ur">{action.label_ur}</span>
            <span className="action-label-en">{action.label_en}</span>
          </div>
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
            <div className="sequence-scroll">
              {selectedItems.map((w: any, idx: number) => (
                <div key={`${w.id}-${idx}`} className="sequence-item-pill">
                  <span className="ur">{w.translations?.['ur'] || w.ur}</span>
                  <span className="en">{w.translations?.['en'] || w.en}</span>
                  <button className="remove-btn" onClick={() => toggleWordSelection(w.id)}><X size={14}/></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-sequence-hint">
               <List size={28} opacity={0.3} />
               <p>{isPrimary ? 'الفاظ منتخب کریں' : 'Select words to speak'}</p>
            </div>
          )}
        </div>

        <div className="word-picker-search-compact">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={isPrimary ? "لفظ تلاش کریں..." : "Search words..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="word-picker-grid">
          {searchResults.slice(0, 15).map((item: any) => (
            <div 
              key={item.id} 
              className={`word-pick-card ${selectedWords.includes(item.id) ? 'selected' : ''}`}
              onClick={() => toggleWordSelection(item.id)}
            >
              <div className="pick-card-inner">
                 <span className="pick-ur">{item.translations?.['ur'] || item.ur}</span>
                 <span className="pick-en">{item.translations?.['en'] || item.en}</span>
              </div>
              {selectedWords.includes(item.id) && <div className="selected-check">✓</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAudioTab = () => (
    <div className="gesture-edit-audio-container naani-friendly">
       {recordingState !== 'reviewing' ? (
         <div className="audio-recording-zone-compact">
            <div className="waveform-box">
               <AudioWaveform 
                 analyser={analyser} 
                 isRecording={recordingState === 'recording'} 
                 color={recordingState === 'recording' ? 'var(--color-danger)' : 'var(--color-primary)'} 
               />
            </div>
            
            <div className="recording-status-compact">
               <h3>{recordingState === 'recording' ? (isPrimary ? 'ریکارڈنگ ہو رہی ہے...' : 'Recording...') : (isPrimary ? 'آڈیو ریکارڈ کریں' : 'Record Audio')}</h3>
            </div>

            <div className="record-center-compact">
               <button 
                 className={`record-btn-brand ${recordingState === 'recording' ? 'recording' : ''}`}
                 onClick={async () => {
                   if (recordingState === 'idle') {
                     await handleStartMic();
                   } else {
                     stopRecording();
                   }
                 }}
               >
                 <span className="mic-emoji">🎙️</span>
                 <span className="record-label">{recordingState === 'recording' ? 'STOP' : 'RECORD'}</span>
               </button>
            </div>

            {hasExistingAudio && recordingState === 'idle' && (
              <div className="existing-audio-badge">
                <Play size={14} fill="currentColor" /> {isPrimary ? 'پرانی ریکارڈنگ موجود ہے' : 'Existing recording found'}
              </div>
            )}
         </div>
       ) : (
         <div className="audio-review-zone-compact">
            <div className="trimmer-viewport-compact">
               <AudioTrimmer 
                 audioBuffer={audioBuffer} 
                 onTrimChange={(s, e) => setTrimRange({ start: s, end: e })} 
                 onDragStart={stopAudio}
                 color="var(--color-primary)"
                 playbackProgress={playbackProgress}
               />
            </div>

            <div className="review-actions-brand compact">
               <button className="review-btn btn-redo" onClick={handleRedo} title="Redo Recording">
                  <RotateCcw size={28} strokeWidth={2.5} />
               </button>
               <button className="review-btn btn-play" onClick={isPlaying ? stopAudio : playAudio} title={isPlaying ? "Stop" : "Play"}>
                  {isPlaying ? <Square size={28} fill="var(--color-primary)" /> : <Play size={28} strokeWidth={2.5} fill="var(--color-primary)" />}
               </button>
               <button className="review-btn btn-tick" onClick={handleSave} title="Save">
                  <Check size={36} strokeWidth={3} />
               </button>
            </div>
         </div>
       )}
    </div>
  );

  return (
    <div className="sos-modal-overlay gesture-edit-overlay">
      <div className="sos-modal-content gesture-edit-content">
        <button className="sos-close-btn-compact" onClick={onClose}><X size={20} /></button>
        
        <div className="gesture-edit-header-compact">
          <div className="gesture-badge-compact">
             <span className="gesture-emoji-tiny">{gesture.id === 'fist' ? '✊' : gesture.id === 'mouth_open' ? '😮' : gesture.id === 'one_finger' ? '☝️' : '🖐️'}</span>
             <h2>{isPrimary ? 'اشارہ تبدیل کریں' : 'Edit Gesture'}</h2>
          </div>
          <p className="gesture-id-text-compact">{gesture.id.replace('_', ' ')}</p>
        </div>

        <div className="gesture-edit-tabs-compact">
          <button className={activeTab === 'action' ? 'active' : ''} onClick={() => setActiveTab('action')}>
            <Activity size={18} />
            <div className="tab-labels">
               <span className="tab-ur">ایکشن</span>
               <span className="tab-en">Action</span>
            </div>
          </button>
          <button className={activeTab === 'words' ? 'active' : ''} onClick={() => {
            setActiveTab('words');
            if (!Array.isArray(selectedValue)) setSelectedValue([]);
          }}>
            <List size={18} />
            <div className="tab-labels">
               <span className="tab-ur">الفاظ</span>
               <span className="tab-en">Words</span>
            </div>
          </button>
          <button className={activeTab === 'audio' ? 'active' : ''} onClick={() => setActiveTab('audio')}>
            <Mic size={18} />
            <div className="tab-labels">
               <span className="tab-ur">آڈیو</span>
               <span className="tab-en">Audio</span>
            </div>
          </button>
        </div>

        <div className="gesture-edit-tab-content-compact">
          {activeTab === 'action' && renderActionTab()}
          {activeTab === 'words' && renderWordsTab()}
          {activeTab === 'audio' && renderAudioTab()}
        </div>

        <div className="gesture-edit-footer-compact">
          <div className="gesture-edit-labels-row">
            {(isDualLang || language === 'ur') && (
              <div className="label-input-wrapper-compact" dir="rtl">
                <label>اردو نام</label>
                <input value={labelUr} onChange={e => setLabelUr(e.target.value)} placeholder="مثلاً اگلا" />
              </div>
            )}
            {(isDualLang || language === 'en') && (
              <div className="label-input-wrapper-compact">
                <label>English Label</label>
                <input value={labelEn} onChange={e => setLabelEn(e.target.value)} placeholder="e.g. Next" />
              </div>
            )}
          </div>

          <button className="btn-save-gesture-compact" onClick={handleSave} disabled={isProcessingAudio}>
            <Save size={20} />
            <div className="btn-text-stack">
               <span className="ur">محفوظ کریں</span>
               <span className="en">Save Mapping</span>
            </div>
          </button>
        </div>
      </div>
      {showPermissionExplanation && (
        <PermissionDialog 
          type="microphone"
          status={permissionStatus === 'granted' ? 'prompt' : (permissionStatus as any)} 
          onConfirm={handleConfirmMicPermission} 
          onCancel={() => setShowPermissionExplanation(false)} 
        />
      )}
    </div>
  );
};
