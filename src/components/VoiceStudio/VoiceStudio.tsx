import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  X, Mic, Square, Download, 
  ChevronLeft, ChevronRight, Plus, Search
} from 'lucide-react';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { audioStorage } from '../../lib/audioStorage';
import { useLanguage } from '../../hooks/useLanguage';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';
import { AudioWaveform } from './AudioWaveform';
import { WordCard } from '../WordCard';

interface VoiceStudioProps {
  config: any;
  updateConfig: (newConfig: any) => void;
  onClose: () => void;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ config, onClose }) => {
  const { language } = useLanguage();
  const [activeProfile] = useState(config.activeVoiceProfile || 'voice_1');
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const processedBlobRef = useRef<Blob | null>(null);

  const { isRecording, startRecording, stopRecording, lastRecordedBlob, analyser, clearLastBlob } = useVoiceRecording();

  const refreshRecordedStatus = useCallback(async () => {
    const keys = await audioStorage.getAllKeys();
    setRecordedKeys(keys);
  }, []);

  useEffect(() => { 
    const timer = setTimeout(() => refreshRecordedStatus(), 0); 
    return () => clearTimeout(timer);
  }, [refreshRecordedStatus]);

  const allWords = useMemo(() => {
    const categories = config.categories || [];
    return categories.flatMap((cat: any) => 
      (cat.items || []).map((item: any) => ({ ...item, categoryLabel: cat.label_en, categoryId: cat.id }))
    );
  }, [config]);

  const filteredWords = useFuzzySearch(allWords, searchQuery) as any[];
  const currentWord = filteredWords[currentIndex] || null;

  const handleNext = useCallback(() => {
    if (currentIndex < filteredWords.length - 1) {
      clearLastBlob();
      processedBlobRef.current = null;
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, filteredWords.length, clearLastBlob]);

  const handleSave = useCallback(async (blob: Blob) => {
    if (!currentWord || processedBlobRef.current === blob) return;
    processedBlobRef.current = blob;
    const storageKey = `${activeProfile}_${currentWord.id}_${language}`;
    await audioStorage.set(storageKey, blob);
    setTimeout(() => {
      refreshRecordedStatus();
    }, 0);
  }, [currentWord, activeProfile, language, refreshRecordedStatus]);

  useEffect(() => {
    if (lastRecordedBlob && !isRecording && lastRecordedBlob !== processedBlobRef.current) {
      handleSave(lastRecordedBlob);
    }
  }, [lastRecordedBlob, isRecording, handleSave]);

  const totalWords = allWords.length;
  const recordedCount = recordedKeys.filter(k => k.startsWith(`${activeProfile}_`)).length;
  const progressPercent = Math.round((recordedCount / totalWords) * 100) || 0;
  const isCurrentRecorded = currentWord && recordedKeys.some(k => k.includes(currentWord.id));

  return (
    <div className="voice-studio-fullscreen brand-layout" dir="ltr">
      <header className="apple-header studio-header-brand">
        <button className="btn-icon-ios" onClick={onClose}><X size={24} /></button>
        <div className="brand-progress-container">
          <div className="progress-text-brand">{recordedCount} / {totalWords} ({progressPercent}%)</div>
          <div className="progress-bar-bg-brand">
            <div className="progress-bar-fill-brand" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <button className="btn-icon-ios accent-gold" onClick={() => {}}><Download size={22} /></button>
      </header>

      <main className="studio-main-brand">
        <div className="studio-search-row">
          <div className="studio-search-wrap-brand">
            <Search size={20} />
            <input type="text" placeholder="Search / تلاش کریں..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className="btn-icon-ios" onClick={() => {}}><Plus size={24} /></button>
        </div>

        <div className="word-focal-point-brand">
          {currentWord ? (
            <>
              <WordCard 
                item={currentWord} 
                isFocused={false} 
                onClick={() => {}} 
                variant={1} 
                className={isCurrentRecorded ? 'recorded-card' : ''}
              />
              
              <div className="record-center-brand">
                {isRecording && <div className="waveform-container-brand"><AudioWaveform analyser={analyser} isRecording={isRecording} color="var(--color-primary)" /></div>}
                <button 
                  className={`record-btn-brand ${isRecording ? 'active' : ''} ${isCurrentRecorded ? 'recorded' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
                  <span>{isRecording ? 'STOP' : 'RECORD'}</span>
                </button>
              </div>

              <div className="focal-nav-brand">
                <button className="nav-btn-brand" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}><ChevronLeft size={32} /></button>
                <div className="word-counter-brand">WORD {currentIndex + 1} OF {filteredWords.length}</div>
                <button className="nav-btn-brand" onClick={handleNext} disabled={currentIndex === filteredWords.length - 1}><ChevronRight size={32} /></button>
              </div>
            </>
          ) : <div className="no-results">No words found.</div>}
        </div>
      </main>
    </div>
  );
};
