import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import './styles/app.css';
import './styles/settings.css';
import './styles/drawing.css';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import { useAudio } from './hooks/useAudio';
import { useRemoteConfig } from './hooks/useRemoteConfig';
import { useCameraGestures } from './hooks/useCameraGestures';
import { type GestureAction } from './recognition/gestures/types';
import { useLogger } from './hooks/useLogger';
import { useFuzzySearch } from './hooks/useFuzzySearch';
import { wordNetwork } from './lib/wordNetwork';
import { translator } from './lib/translator';

// Lucide Icons
import {
  XCircle
} from 'lucide-react';

// Extracted Components
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { PredictionScroller } from './components/PredictionScroller';
import { WordGrid } from './components/WordGrid';
import { SentenceBuilder } from './components/SentenceBuilder';
import { Footer } from './components/Footer';
import { SOSModal } from './components/SOSModal';
import { SettingsPanel } from './components/SettingsPanel';
import { VoiceStudio } from './components/VoiceStudio/VoiceStudio';
import { WordEditor } from './components/WordEditor';
import { DoodlePad } from './components/Doodle/DoodlePad';
import { useAmbientListener } from './hooks/useAmbientListener';

const AppContent = () => {
  const { language, isUrdu } = useLanguage();
  const { speak, speakSequence, playClick } = useAudio();
  const { logEvent } = useLogger();
  const { config, updateConfig } = useRemoteConfig();

  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [sentence, setSentence] = useState<any[]>([]);
  const [lastGesture, setLastGesture] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSplash, setShowSplash] = useState(true);
  const [addingWord, setAddingWord] = useState<any | null>(null);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [route, setRoute] = useState(window.location.hash || '#');
  const [showCameraPreview] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [initialEditingItem, setInitialEditingItem] = useState<any>(null);
  const [initialSettingsTab, setInitialSettingsTab] = useState<any>(null);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);
  const builderScrollRef = useRef<HTMLDivElement>(null); 
  const [canAddWords, setCanAddWords] = useState(true); 
  const [flashSentenceBuilder, setFlashSentenceBuilder] = useState(false); 

  // Ambient Listener integration
  const { isListening, toggleListening } = useAmbientListener(language, (suggestedIds) => {
    setContextualSuggestions(suggestedIds);
    if ((window as any)._suggest_timer) clearTimeout((window as any)._suggest_timer);
    (window as any)._suggest_timer = setTimeout(() => setContextualSuggestions([]), 15000);
  });

  // Default Emergency Contacts & Favorites if none exist
  useEffect(() => {
    if (config) {
      const updates: any = {};
      let needsUpdate = false;

      if (!config.emergency_contacts) {
        updates.emergency_contacts = [
          { name: 'Family', phone: '911' },
          { name: 'Doctor', phone: '112' }
        ];
        needsUpdate = true;
      }

      if (!config.favorites) {
        updates.favorites = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        updateConfig({ ...config, ...updates });
      }
    }
  }, [config, updateConfig]);

  // Sync Status Check
  useEffect(() => {
    const checkSyncStatus = () => {
      const lastSnapshot = parseInt(localStorage.getItem('shukr_last_snapshot_ts') || '0');
      const lastLocalMod = parseInt(localStorage.getItem('shukr_last_local_mod') || '0');
      
      if (lastLocalMod > lastSnapshot) {
        setHasUnsyncedChanges(true);
      } else {
        setHasUnsyncedChanges(false);
      }
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 30000); 
    return () => clearInterval(interval);
  }, []);

  // Hash Routing
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Manage sentence builder word adding limit
  useEffect(() => {
    const handleResize = () => {
      if (builderScrollRef.current) {
        const threeLineHeightThreshold = 130; 
        setCanAddWords(builderScrollRef.current.offsetHeight <= threeLineHeightThreshold);
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (builderScrollRef.current) {
      resizeObserver.observe(builderScrollRef.current);
    }

    return () => {
      if (builderScrollRef.current) {
        resizeObserver.unobserve(builderScrollRef.current);
      }
    };
  }, [sentence, builderScrollRef]); 

  const navigate = (newRoute: string, tab?: string) => {
    if (tab) setInitialSettingsTab(tab);
    window.location.hash = newRoute;
  };
  
  const quotes = useMemo(() => config?.quotes || [], [config]);
  const [randomQuote, setRandomQuote] = useState<any>(null);

  const handleNextQuote = useCallback(() => {
    if (quotes.length === 0) return;
    const currentIndex = quotes.findIndex((q: any) => q.en === randomQuote?.en);
    const nextIndex = (currentIndex + 1) % quotes.length;
    setRandomQuote(quotes[nextIndex]);
    logEvent('quote_action', { type: 'next_quote', index: nextIndex });
  }, [quotes, randomQuote, logEvent]);

  useEffect(() => {
    if (quotes.length > 0 && !randomQuote) setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [quotes, randomQuote]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const playSentence = useCallback(() => {
    if (sentence.length === 0) return;
    speakSequence(sentence);
    logEvent('speech_action', { type: 'sentence_builder' });
    setTimeout(() => { setSentence([]); setCurrentCategory(null); setSearchQuery(''); }, 3000);
  }, [sentence, speakSequence, logEvent]);

  const allItems = useMemo(() => {
    if (!config?.categories) return [];
    return config.categories.flatMap((c: any) => c.items || []);
  }, [config]);

  const handleAddCustomWord = async (item: any) => {
    const newConfig = { ...config };
    let customCat = newConfig.categories.find((c: any) => c.id === 'cat_custom');
    if (!customCat) {
      customCat = { id: 'cat_custom', label_ur: 'میرے الفاظ', label_en: 'My Words', icon: 'star', items: [] };
      newConfig.categories.push(customCat);
    }
    customCat.items.push(item);
    updateConfig(newConfig);
    setAddingWord(null);
  };

  const toggleFavorite = useCallback((itemId: string) => {
    const newConfig = { ...config };
    if (!newConfig.favorites) newConfig.favorites = [];
    const idx = newConfig.favorites.indexOf(itemId);
    if (idx > -1) newConfig.favorites.splice(idx, 1);
    else newConfig.favorites.push(itemId);
    updateConfig(newConfig);
  }, [config, updateConfig]);

  const displayCategories = useMemo(() => {
    if (!config?.categories) return [];
    return [
      { id: 'cat_fav', label_ur: 'پسندیدہ', label_en: 'Favorite', icon: 'heart' },
      { id: 'khandan', label_ur: 'خاندان', label_en: 'Family', icon: 'users' }
    ];
  }, [config]);

  const searchResults = useFuzzySearch(allItems, searchQuery);

  const gridItems = useMemo(() => {
    let items = [];
    if (searchQuery) {
      const results = [...searchResults];
      const exactMatch = results.some((r: any) => r.en.toLowerCase() === searchQuery.toLowerCase() || r.ur === searchQuery);
      
      if (!exactMatch && searchQuery.length > 1) {
        results.push({
          id: 'add_new_prompt',
          ur: 'نیا لفظ؟',
          en: 'Add Word?',
          icon: 'list-plus',
          isPrompt: true,
          onClick: async () => {
            const res = await translator.translate(searchQuery);
            setAddingWord({
              id: `word_${Date.now()}`,
              en: res?.en || searchQuery,
              ur: res?.ur || '',
              roman: res?.roman || '',
              icon: 'list-plus',
              next: []
            });
          }
        });
      }
      items = results;
    } else if (!currentCategory) {
      const coreCat = config?.categories?.find((c: any) => c.id === 'core' || c.id === 'cat_core' || c.label_en?.toLowerCase().includes('core'));
      items = coreCat?.items || [];
    } else if (currentCategory === 'cat_fav' || currentCategory === 'fav') {
      items = allItems.filter((i: any) => config?.favorites?.includes(i.id));
    } else {
      const targetId = currentCategory.startsWith('cat_') ? currentCategory.substring(4) : currentCategory;
      const cat = config?.categories?.find((c: any) => 
        c.id === currentCategory || 
        c.id === targetId || 
        (targetId === 'fam' && (c.id === 'khandan' || c.id === 'family'))
      );
      
      const backItem = { 
        id: 'back', ur: 'واپس', en: 'Back', icon: 'arrow-left', isPrompt: true, 
        onClick: () => { playClick(); setCurrentCategory(null); setFocusedIndex(-1); } 
      };
      const catItems = cat?.items || [];
      items = [backItem, ...catItems];
    }

    return items.map((item: any) => {
      if (item.onClick) return item; 
      return {
        ...item,
        onClick: () => {
          speak(isUrdu ? item.ur : item.en, item.id);
          if (canAddWords) {
            setSentence(prev => [...prev, item]);
          } else {
            setSentence(prev => [...prev.slice(0, -1), item]);
            setFlashSentenceBuilder(true);
            setTimeout(() => setFlashSentenceBuilder(false), 500);
          }
          wordNetwork.recordUsage(item.id);
          setFocusedIndex(-1);
        }
      };
    }).slice(0, 8); 
  }, [currentCategory, config, isUrdu, speak, playClick, searchQuery, allItems, searchResults]);

  const predictions = useMemo(() => {
    const lastWord = sentence.length > 0 ? sentence[sentence.length - 1] : null;
    const nextIds = lastWord?.next || [];
    
    const mergedIds = Array.from(new Set([...contextualSuggestions, ...nextIds]));
    
    return allItems
      .filter((i: any) => mergedIds.includes(i.id))
      .slice(0, 4)
      .map((i: any) => ({
        ...i, 
        onClick: () => { 
          speak(isUrdu ? i.ur : i.en, i.id); 
          if (canAddWords) {
            setSentence(prev => [...prev, i]);
          } else {
            setSentence(prev => [...prev.slice(0, -1), i]);
            setFlashSentenceBuilder(true);
            setTimeout(() => setFlashSentenceBuilder(false), 500); 
          }
          wordNetwork.recordUsage(i.id);
          setFocusedIndex(-1);
        }
      }));
  }, [sentence, allItems, isUrdu, speak, contextualSuggestions]);

  const actionHandlerRef = useRef<(action: GestureAction) => void>(undefined);
  const { isEnabled, isRecognitionActive, toggleTracking, videoRef, isModelLoaded } = useCameraGestures((action) => actionHandlerRef.current?.(action));

  const handleGestureAction = useCallback((action: GestureAction) => {
    setLastGesture(action);
    
    setTimeout(() => {
      setLastGesture('');
    }, 2000);

    switch (action) {
      case 'SPEAK': playSentence(); break;
      case 'DOODLE': navigate('#doodle'); playClick(); break;
      case 'YES': speak(isUrdu ? 'ہاں' : 'Yes', 'ji_haan'); break;
      case 'SALAM': speak(isUrdu ? 'السلام علیکم' : 'Assalamualikum', 'sys_salam'); break;
      case 'CALL_CONTACT_1':
        if (config?.emergency_contacts?.[0]?.phone) {
          window.location.href = `tel:${config.emergency_contacts[0].phone}`;
        }
        break;
      case 'HOME': setSentence([]); setCurrentCategory(null); setFocusedIndex(-1); break;
      case 'CLEAR': setSentence([]); setCurrentCategory(null); setFocusedIndex(-1); break;
      case 'TOGGLE_RECOGNITION': playClick(); break;
    }
  }, [playClick, speak, isUrdu, playSentence, config]);

  useEffect(() => {
    actionHandlerRef.current = handleGestureAction;
  }, [handleGestureAction]);

  const appContent = (
    <div className="app-viewport">
      <Header 
        onOpenSettings={(tab) => navigate('#settings', tab)} 
        isTrackingEnabled={isEnabled} 
        isRecognitionActive={isRecognitionActive}
        toggleTracking={toggleTracking} 
        hasUnsyncedChanges={hasUnsyncedChanges}
        isModelLoaded={isModelLoaded}
        onSOS={() => setShowSOS(true)}
        onHome={() => { setSentence([]); setCurrentCategory(null); navigate('#'); }}
        isListening={isListening}
        toggleListening={toggleListening}
        lastGesture={lastGesture}
        isUrdu={isUrdu}
      />


      <div className="main-content-wrapper" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {route === '#voices' ? (
          <VoiceStudio config={config} updateConfig={updateConfig} onClose={() => navigate('#settings')} />
        ) : route === '#settings' ? (
          <SettingsPanel 
            config={config} 
            updateConfig={updateConfig} 
            initialTab={initialSettingsTab}
            initialEditingItem={initialEditingItem} 
            onOpenVoiceStudio={() => navigate('#voices')} 
            onClose={() => { setInitialEditingItem(null); setInitialSettingsTab(null); navigate('#'); }} 
          />
        ) : route === '#doodle' ? (
          <DoodlePad 
            config={config} 
            onRecognize={(item: any) => { 
              setSentence(prev => [...prev, item]); 
              wordNetwork.recordUsage(item.id); 
              navigate('#'); 
            }} 
          />
        ) : (
          <>
            {isEnabled && (
              <div className={`apple-gesture-preview ${showCameraPreview ? '' : 'hidden'}`}>
                <video ref={videoRef} className="video-preview" playsInline muted />
              </div>
            )}
            
            <div className="top-system-area">
              <SentenceBuilder 
                words={sentence} 
                onClear={() => setSentence([])} 
                onBackspace={() => setSentence(prev => prev.slice(0, -1))} 
                onPlay={playSentence} 
                focusedIndex={focusedIndex} 
                offset={0} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery}
                canAddWords={canAddWords} 
                builderScrollRef={builderScrollRef} 
                flashBorder={flashSentenceBuilder} 
              />
            </div>

            <div className="main-content-area">
              <PredictionScroller 
                predictions={predictions}
                focusedIndex={focusedIndex}
                offset={3}
              />
              <WordGrid 
                gridItems={gridItems}
                focusedIndex={focusedIndex}
                offset={3 + predictions.length}
                randomQuote={randomQuote}
                onNextQuote={handleNextQuote}
                quoteFocused={focusedIndex === 3 + predictions.length + gridItems.length + displayCategories.length}
                onLongPressItem={(item) => toggleFavorite(item.id)}
                favorites={config?.favorites || []}
              />
            </div>
          </>
        )}
      </div>

      <Footer 
        categories={displayCategories}
        currentCategory={currentCategory}
        onCategoryClick={(catId) => {
          playClick();
          if (route !== '#') navigate('#');
          setCurrentCategory(catId === currentCategory ? null : catId);
          setFocusedIndex(-1);
          setSearchQuery('');
        }}
        onDoodleClick={() => {
          playClick();
          if (route === '#doodle') navigate('#');
          else navigate('#doodle');
        }}
        onYesClick={() => {
          speak(isUrdu ? 'ہاں' : 'Yes', 'sys_yes');
          setSentence(prev => [...prev, { id: 'sys_yes', en: 'Yes', ur: 'ہاں', isWord: true }]);
        }}
        onNoClick={() => {
          speak(isUrdu ? 'نہیں' : 'No', 'sys_no');
          setSentence(prev => [...prev, { id: 'sys_no', en: 'No', ur: 'نہیں', isWord: true }]);
        }}
        focusedIndex={focusedIndex}
        offset={3 + predictions.length + gridItems.length}
      />

      {showSOS && (
        <SOSModal 
          onClose={() => setShowSOS(false)} 
          emergencyContacts={config?.emergency_contacts || []} 
        />
      )}

      {addingWord && (
        <div className="studio-modal-overlay-brand">
          <div className="studio-modal-brand">
            <div className="modal-header-brand"><h3>Add Word</h3><button className="btn-icon-ios" onClick={() => setAddingWord(null)}><XCircle size={20} /></button></div>
            <div className="modal-body-brand">
              <WordEditor 
                item={addingWord} 
                isNew={true}
                onChange={setAddingWord} 
                onSave={handleAddCustomWord}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (showSplash) return <SplashScreen quote={randomQuote || { ur: 'Shukr', en: 'Shukr' }} />;

  return appContent;
};

export default function App() { return ( <LanguageProvider><AppContent /></LanguageProvider> ); }
