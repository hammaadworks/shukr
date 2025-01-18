import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Save, Mic, List, Activity, Play, Square, Scissors, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { type GestureDefinition, type GestureAction, type GestureMappingType } from '../../recognition/gestures/types';
import { WordCard } from '../WordCard';
import type { WordCardItem } from '../WordCard';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { AudioTrimmer } from '../VoiceStudio/AudioTrimmer';
import { AudioWaveform } from '../VoiceStudio/AudioWaveform';
import { decodeAudioData, trimAudioBuffer, audioBufferToWavBlob } from '../../lib/audioUtils';
import { audioStorage } from '../../lib/audioStorage';

interface GestureEditModalProps {
  gesture: GestureDefinition;
  config: any;
  onClose: () => void;
  onSave: (updated: GestureDefinition, audioBlob?: Blob | null) => void;
}

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
  const { isPrimary, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<GestureMappingType>(gesture.type);
  const [labelEn, setLabelEn] = useState(gesture.label_en);
  const [labelUr, setLabelUr] = useState(gesture.label_ur);
  const [selectedValue, setSelectedValue] = useState<string | string[]>(gesture.value);
  const [searchQuery, setSearchQuery] = useState('');

  // Audio State
  const { isRecording, startRecording, stopRecording, lastRecordedBlob, analyser, clearLastBlob } = useVoiceRecording();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 1 });
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<AudioBufferSourceNode | null>(null);
  const [hasExistingAudio, setHasExistingAudio] = useState(false);

  const allWords = useMemo(() => {
    return (config.categories || []).flatMap((c: any) => c.items || []);
  }, [config]);

  const searchResults = useFuzzySearch(allWords, searchQuery);

  useEffect(() => {
    const checkAudio = async () => {
      const existing = await audioStorage.get(`gesture_${gesture.id}`);
      if (existing) setHasExistingAudio(true);
    };
    if (activeTab === 'audio') checkAudio();
  }, [gesture.id, activeTab]);

  useEffect(() => {
    if (lastRecordedBlob) {
      const loadAudio = async () => {
        setIsProcessingAudio(true);
        try {
          const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
          const ctx = new AudioContextClass();
          const buffer = await decodeAudioData(lastRecordedBlob, ctx);
          setAudioBuffer(buffer);
          setTrimRange({ start: 0, end: 1 });
        } catch (e) {
          console.error("Audio processing failed", e);
        } finally {
          setIsProcessingAudio(false);
        }
      };
      loadAudio();
    }
  }, [lastRecordedBlob]);

  const handlePreviewPlay = () => {
    if (!audioBuffer || isPlaying) return;
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new AudioContextClass();
    const source = ctx.createBufferSource();
    
    const duration = audioBuffer.duration;
    const start = trimRange.start * duration;
    const end = trimRange.end * duration;
    
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0, start, end - start);
    
    playbackRef.current = source;
    setIsPlaying(true);
    source.onended = () => setIsPlaying(false);
  };

  const stopPreview = () => {
    if (playbackRef.current) {
      playbackRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleSave = async () => {
    let finalBlob: Blob | null = null;
    
    if (activeTab === 'audio' && audioBuffer) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass();
      const trimmed = trimAudioBuffer(audioBuffer, ctx, trimRange.start * audioBuffer.duration, trimRange.end * audioBuffer.duration);
      finalBlob = audioBufferToWavBlob(trimmed);
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
                  <span className="ur">{w.ur}</span>
                  <span className="en">{w.en}</span>
                  <button className="remove-btn" onClick={() => toggleWordSelection(w.id)}><X size={14}/></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-sequence-hint">
               <List size={32} opacity={0.3} />
               <p>{isPrimary ? 'الفاظ منتخب کریں' : 'Select words to speak'}</p>
            </div>
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
          {searchResults.slice(0, 15).map((item: any) => (
            <div 
              key={item.id} 
              className={`word-pick-card ${selectedWords.includes(item.id) ? 'selected' : ''}`}
              onClick={() => toggleWordSelection(item.id)}
            >
              <div className="pick-card-inner">
                 <span className="pick-ur">{item.ur}</span>
                 <span className="pick-en">{item.en}</span>
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
       {!audioBuffer ? (
         <div className="audio-recording-zone">
            <div className={`record-button-large ${isRecording ? 'recording' : ''}`} 
                 onClick={isRecording ? stopRecording : startRecording}>
               {isRecording ? <Square size={48} fill="white" /> : <Mic size={48} />}
               <div className="record-ring" />
            </div>
            
            <div className="recording-status">
               <h3>{isRecording ? (isPrimary ? 'ریکارڈنگ ہو رہی ہے...' : 'Recording...') : (isPrimary ? 'آڈیو ریکارڈ کریں' : 'Record Audio')}</h3>
               <p>{isRecording ? (isPrimary ? 'بولنا جاری رکھیں' : 'Keep speaking') : (isPrimary ? 'بٹن دبا کر ریکارڈ کریں' : 'Tap to start recording')}</p>
            </div>

            {isRecording && analyser && (
              <div className="live-viz-container">
                <AudioWaveform analyser={analyser} isRecording={true} color="var(--color-primary)" />
              </div>
            )}

            {hasExistingAudio && !isRecording && (
              <div className="existing-audio-badge">
                <Play size={14} /> {isPrimary ? 'پرانی ریکارڈنگ موجود ہے' : 'Existing recording found'}
              </div>
            )}
         </div>
       ) : (
         <div className="audio-trim-zone">
            <div className="trimmer-header">
               <button className="btn-secondary" onClick={() => { setAudioBuffer(null); clearLastBlob(); }}>
                  <RotateCcw size={18} /> {isPrimary ? 'دوبارہ ریکارڈ کریں' : 'Re-record'}
               </button>
               <div className="trim-label">
                  <Scissors size={18} /> {isPrimary ? 'آڈیو تراشیں' : 'Trim Audio'}
               </div>
            </div>

            <div className="trimmer-viewport">
               <AudioTrimmer 
                 audioBuffer={audioBuffer} 
                 onTrimChange={(s, e) => setTrimRange({ start: s, end: e })} 
                 color="var(--color-primary)"
               />
            </div>

            <div className="trimmer-actions">
               <button className={`btn-preview ${isPlaying ? 'playing' : ''}`} onClick={isPlaying ? stopPreview : handlePreviewPlay}>
                  {isPlaying ? <Square size={24} fill="white" /> : <Play size={24} fill="white" />}
                  <span>{isPlaying ? (isPrimary ? 'روکیں' : 'Stop') : (isPrimary ? 'سنیں' : 'Preview')}</span>
               </button>
            </div>
         </div>
       )}
    </div>
  );

  return (
    <div className="sos-modal-overlay gesture-edit-overlay">
      <div className="sos-modal-content gesture-edit-content">
        <button className="sos-close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="gesture-edit-header">
          <div className="gesture-badge">
             <span className="gesture-emoji-mini">{gesture.id === 'fist' ? '✊' : gesture.id === 'mouth_open' ? '😮' : gesture.id === 'one_finger' ? '☝️' : '🖐️'}</span>
             <h2>{isPrimary ? 'اشارہ تبدیل کریں' : 'Edit Gesture'}</h2>
          </div>
          <p className="gesture-id-text">{gesture.id.replace('_', ' ').toUpperCase()}</p>
        </div>

        <div className="gesture-edit-tabs">
          <button className={activeTab === 'action' ? 'active' : ''} onClick={() => setActiveTab('action')}>
            <Activity size={20} />
            <div className="tab-labels">
               <span className="tab-ur">ایکشن</span>
               <span className="tab-en">Action</span>
            </div>
          </button>
          <button className={activeTab === 'words' ? 'active' : ''} onClick={() => {
            setActiveTab('words');
            if (!Array.isArray(selectedValue)) setSelectedValue([]);
          }}>
            <List size={20} />
            <div className="tab-labels">
               <span className="tab-ur">الفاظ</span>
               <span className="tab-en">Words</span>
            </div>
          </button>
          <button className={activeTab === 'audio' ? 'active' : ''} onClick={() => setActiveTab('audio')}>
            <Mic size={20} />
            <div className="tab-labels">
               <span className="tab-ur">آڈیو</span>
               <span className="tab-en">Audio</span>
            </div>
          </button>
        </div>

        <div className="gesture-edit-tab-content">
          {activeTab === 'action' && renderActionTab()}
          {activeTab === 'words' && renderWordsTab()}
          {activeTab === 'audio' && renderAudioTab()}
        </div>

        <div className="gesture-edit-labels-grid">
           <div className="label-input-wrapper" dir="rtl">
              <label>اردو نام</label>
              <input value={labelUr} onChange={e => setLabelUr(e.target.value)} placeholder="مثلاً اگلا" />
           </div>
           <div className="label-input-wrapper">
              <label>English Label</label>
              <input value={labelEn} onChange={e => setLabelEn(e.target.value)} placeholder="e.g. Next" />
           </div>
        </div>

        <div className="gesture-edit-footer">
          <button className="btn-save-gesture" onClick={handleSave} disabled={isProcessingAudio}>
            <Save size={22} />
            <div className="btn-text-stack">
               <span className="ur">محفوظ کریں</span>
               <span className="en">Save Mapping</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
