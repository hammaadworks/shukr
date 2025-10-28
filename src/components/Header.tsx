import React from 'react';
import { 
  Camera, CameraOff, 
  Type,
  Settings
} from 'lucide-react';
import { ShukrButton } from './ShukrButton';
import { useAudio } from '../hooks/useAudio';
import { useLanguage } from '../hooks/useLanguage';
import { GestureLegend } from './GestureLegend';

interface HeaderProps {
  onOpenSettings: (tab?: string) => void;
  isTrackingEnabled: boolean;
  isRecognitionActive: boolean;
  toggleTracking: () => void;
  hasUnsyncedChanges: boolean;
  isModelLoaded: boolean;
  onSOS: () => void;
  onHome: () => void;
  isSentenceBuilderActive: boolean;
  toggleSentenceBuilder: () => void;
  lastGesture: string;
  isUrdu: boolean;
  focusedIndex: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  isTrackingEnabled,
  toggleTracking,
  hasUnsyncedChanges,
  isModelLoaded,
  onSOS,
  onHome,
  isSentenceBuilderActive,
  toggleSentenceBuilder,
  lastGesture,
  isUrdu,
  focusedIndex
}) => {
  const { playClick } = useAudio();
  const { setLanguage, language } = useLanguage();

  const toggleLang = () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(30);
    setLanguage(language === 'ur' ? 'en' : 'ur');
  };

  return (
    <header className="apple-header consistent-header" dir="ltr">
      <div className="header-grid-layout">
        {/* 1fr: Camera */}
        <div className="header-cell">
          <button 
            className={`btn-icon-ios ${isTrackingEnabled ? 'active' : ''} ${focusedIndex === 0 ? 'focused-item' : ''}`}
            onClick={() => { playClick(); toggleTracking(); }}
            aria-label="Camera"
          >
            {isTrackingEnabled ? <Camera size={22} /> : <CameraOff size={22} />}
            {isTrackingEnabled && !isModelLoaded && <div className="loading-dot-ios-mini" />}
          </button>
        </div>

        {/* 1fr: Sentence Builder Toggle */}
        <div className="header-cell">
          <button 
            className={`btn-icon-ios ${isSentenceBuilderActive ? 'active' : ''} ${focusedIndex === 1 ? 'focused-item' : ''}`}
            onClick={() => { playClick(); toggleSentenceBuilder(); }}
            aria-label={isSentenceBuilderActive ? "Hide Sentence Builder" : "Show Sentence Builder"}
          >
            <Type size={22} color={isSentenceBuilderActive ? "#007AFF" : "#6B7280"} />
          </button>
        </div>

        {/* 2fr: Shukr (Branding) */}
        <div className="header-cell span-2">
          <ShukrButton 
            onSOS={onSOS} 
            onHome={onHome}
            playClick={playClick} 
            onOpenSettings={() => onOpenSettings('general')}
            hasUnsyncedChanges={hasUnsyncedChanges}
            isFocused={focusedIndex === 2}
          />
        </div>

        {/* 1fr: Language */}
        <div className="header-cell">
          <button 
            className={`btn-icon-ios lang-switcher-pill ${focusedIndex === 3 ? 'focused-item' : ''}`}
            onClick={toggleLang}
            aria-label="Switch Language"
          >
            <div className={`lang-toggle-state ${isUrdu ? 'is-ur' : 'is-en'}`}>
              <span className="lang-label ur">اردو</span>
              <span className="lang-label en">EN</span>
            </div>
          </button>
        </div>

        {/* 1fr: Settings */}
        <div className="header-cell">
          <button 
            className={`btn-icon-ios ${focusedIndex === 4 ? 'focused-item' : ''}`}
            onClick={() => { playClick(); onOpenSettings(); }}
            aria-label="Settings"
          >
            <Settings size={22} />
          </button>
        </div>
      </div>
      {isTrackingEnabled && (
        <GestureLegend lastGesture={lastGesture} />
      )}
    </header>
  );
};
