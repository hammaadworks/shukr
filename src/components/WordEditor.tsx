import { useState, useEffect } from 'react';
import { Trash2, Save, Mic, Square, Play } from 'lucide-react';
import { translator } from '../lib/translator';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { AudioWaveform } from './VoiceStudio/AudioWaveform';

interface WordEditorProps {
  item: any;
  onChange: (newItem: any) => void;
  onSave?: (item: any, blob?: Blob | null) => void;
  onDelete?: (id: string, en?: string) => void;
  isNew?: boolean;
}

export const WordEditor: React.FC<WordEditorProps> = ({ item, onChange, onSave, onDelete, isNew }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const { isRecording, startRecording, stopRecording, lastRecordedBlob, analyser, clearLastBlob } = useVoiceRecording();
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (lastRecordedBlob) {
      setTimeout(() => setRecordedBlob(lastRecordedBlob), 0);
    }
  }, [lastRecordedBlob]);

  const handleEnChange = async (en: string) => {
    onChange({ ...item, en });
    if (en.length > 2) {
      setIsTranslating(true);
      const res = await translator.translate(en);
      if (res) {
        onChange({ ...item, en, ur: res.ur, roman: res.roman });
      }
      setIsTranslating(false);
    }
  };

  const handlePlay = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="edit-form simple-form">
      <div className="form-group large-group">
        <label>English (انگریزی)</label>
        <input 
          type="text" className="massive-input ltr-input" 
          value={item.en} 
          onChange={e => handleEnChange(e.target.value)} 
          placeholder="Type here..."
          autoFocus
        />
      </div>

      <div className="form-group large-group">
        <label>Urdu (اردو)</label>
        <input 
          type="text" className="massive-input urdu-input" 
          value={item.ur} 
          onChange={e => onChange({...item, ur: e.target.value, icon: item.icon || 'list-plus'})} 
          dir="rtl"
        />
        {isTranslating && <div style={{ marginTop: 8 }}><small style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Translating...</small></div>}
      </div>

      <div className="form-group large-group">
        <label>Roman Urdu / Transliteration</label>
        <input 
          type="text" className="massive-input ltr-input" 
          value={item.roman || ''} 
          onChange={e => onChange({...item, roman: e.target.value})} 
          placeholder="e.g. As-salaam-alaikum"
        />
      </div>

      <div className="recording-section-mini" style={{ background: 'rgba(45, 90, 39, 0.03)', padding: 20, borderRadius: 24, border: '1px dashed rgba(45, 90, 39, 0.1)' }}>
        <label style={{ fontSize: '1rem', marginBottom: 12 }}>Voice Recording (اپنی آواز بھریں)</label>
        <div className="recording-controls-mini">
          {!recordedBlob && !isRecording && (
            <button className="btn-record-mini" onClick={startRecording} style={{ height: 60, borderRadius: 16 }}>
              <Mic size={24} /> Record Voice
            </button>
          )}
          {isRecording && (
            <button className="btn-stop-mini active" onClick={stopRecording} style={{ height: 60, borderRadius: 16 }}>
              <Square size={24} fill="currentColor" /> Stop Recording
            </button>
          )}
          {recordedBlob && !isRecording && (
            <div className="recorded-actions-mini">
              <button className="btn-play-mini" onClick={handlePlay} style={{ width: 50, height: 50 }}><Play size={24} fill="currentColor" /></button>
              <button className="btn-delete-mini" onClick={() => { setRecordedBlob(null); clearLastBlob(); }} style={{ width: 50, height: 50 }}><Trash2 size={24} /></button>
              <span className="recorded-label" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3D7A35' }}>Ready! ✓</span>
            </div>
          )}
        </div>
        {isRecording && (
          <div className="waveform-wrap-mini" style={{ marginTop: 15 }}>
            <AudioWaveform analyser={analyser} isRecording={isRecording} color="var(--color-accent)" />
          </div>
        )}
      </div>

      {onSave && (
        <div className="action-buttons-row" style={{ marginTop: 10 }}>
          {onDelete && !isNew && (
            <button className="btn-delete" onClick={() => onDelete(item.id, item.oldEn || item.en)} style={{ height: 70, borderRadius: 20 }}>
              <Trash2 size={32} />
            </button>
          )}
          <button className="btn-save" onClick={() => onSave(item, recordedBlob)} style={{ height: 70, borderRadius: 20, flex: 2, fontSize: '1.3rem', fontWeight: 800 }}>
            <Save size={32} /> Save Word
          </button>
        </div>
      )}
    </div>
  );
};
