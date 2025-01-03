import React from 'react';
import {Camera, Megaphone, ALargeSmall, Settings, X} from 'lucide-react';
import {ShukrButton} from './ShukrButton';
import {useAudio} from '../hooks/useAudio';
import {useLanguage} from '../hooks/useLanguage';
import {GestureLegend} from './GestureLegend';

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
    showCloseDropzone?: boolean;
    cameraButtonRef?: React.RefObject<HTMLButtonElement | null>;
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
                                                  focusedIndex,
                                                  showCloseDropzone = false,
                                                  cameraButtonRef
                                              }) => {
    const {playClick} = useAudio();
    const {setLanguage, language} = useLanguage();

    const toggleLang = () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(30);
        setLanguage(language === 'ur' ? 'en' : 'ur');
    };

    return (<header className="apple-header consistent-header" dir="ltr">
            <div className="header-grid-layout">
                {/* 1fr: Camera */}
                <div className="header-cell">
                    <button
                        ref={cameraButtonRef}
                        className={`btn-icon-ios ${isTrackingEnabled ? 'active' : 'inactive'} ${focusedIndex === 0 ? 'focused-item' : ''} ${showCloseDropzone ? 'drop-active' : ''}`}
                        onClick={() => {
                            playClick();
                            toggleTracking();
                        }}
                        aria-label="Camera"
                    >
                        {showCloseDropzone ? (
                            <X size={30} color="#DC2626" strokeWidth={3} className="animate-pulse" />
                        ) : (
                            <>
                                <Camera size={22} color={isTrackingEnabled ? "var(--color-primary)" : "#9CA3AF"}/>
                                {!isTrackingEnabled && <div className="inactive-slash"/>}
                                {isTrackingEnabled && !isModelLoaded && <div className="loading-dot-ios-mini"/>}
                            </>
                        )}
                    </button>
                </div>

                {/* 1fr: Sentence Builder Toggle */}
                <div className="header-cell">
                    <button
                        className={`btn-icon-ios ${isSentenceBuilderActive ? 'active' : 'inactive'} ${focusedIndex === 1 ? 'focused-item' : ''}`}
                        onClick={() => {
                            playClick();
                            toggleSentenceBuilder();
                        }}
                        aria-label={isSentenceBuilderActive ? "Hide Sentence Builder" : "Show Sentence Builder"}
                    >
                        <Megaphone size={20} color={isSentenceBuilderActive ? "var(--color-primary)" : "#9CA3AF"}/>
                        {!isSentenceBuilderActive && <div className="inactive-slash"/>}
                    </button>
                </div>

                {/* 2fr: Shukr (Branding) */}
                <div className="header-cell span-2">
                    <div className="shukr-button-wrapper">
                        <ShukrButton
                            onSOS={onSOS}
                            onHome={onHome}
                            playClick={playClick}
                            onOpenSettings={() => onOpenSettings('contact')}
                            hasUnsyncedChanges={hasUnsyncedChanges}
                            isFocused={focusedIndex === 2}
                        />
                    </div>
                </div>

                {/* 1fr: Language */}
                <div className="header-cell">
                    <button
                        className={`btn-icon-ios ${focusedIndex === 3 ? 'focused-item' : ''}`}
                        onClick={toggleLang}
                        aria-label="Switch Language"
                    >
                        <div className={`lang-toggle-container ${isUrdu ? 'is-ur' : 'is-en'}`}>
                            <ALargeSmall size={22} className="lang-icon-mini"/>
                        </div>
                    </button>
                </div>

                {/* 1fr: Settings */}
                <div className="header-cell">
                    <button
                        className={`btn-icon-ios ${focusedIndex === 4 ? 'focused-item' : ''}`}
                        onClick={() => {
                            playClick();
                            onOpenSettings();
                        }}
                        aria-label="Settings"
                    >
                        <Settings size={22}/>
                    </button>
                </div>
            </div>
            {isTrackingEnabled && (<GestureLegend lastGesture={lastGesture}/>)}
        </header>);
};
