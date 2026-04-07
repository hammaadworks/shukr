import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import './styles/app.css';
import './hooks/useLanguage';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import { useAudio } from './hooks/useAudio';
import { useAppConfig } from './hooks/useAppConfig';
import { useCameraGestures } from './hooks/useCameraGestures';
import { type GestureAction } from './recognition/gestures/types';
import { useLogger } from './hooks/useLogger';
import { useFuzzySearch } from './hooks/useFuzzySearch';
import { wordNetwork } from './lib/wordNetwork';
import { translator } from './lib/translator';
import { universeDb } from './lib/universeDb';

// Lucide Icons
import {
  XCircle,
  Activity
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
  const { language, isUrdu, setLanguage } = useLanguage();
  const { speak, speakSequence, playClick } = useAudio();
  const { logEvent } = useLogger();
  const { config, updateConfig, isOfflineMode, isLoading: isConfigLoading } = useAppConfig();

  useEffect(() => {
    (window as any)._showSOS = () => setShowSOS(true);
  }, []);

  const actionHandlerRef = useRef<(action: any) => void>(() => {});

  const { isEnabled, isRecognitionActive, toggleTracking, videoRef, isModelLoaded } = useCameraGestures((action) => {
    actionHandlerRef.current(action);
  });

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
  const [dbWords, setDbWords] = useState<any[]>([]);
  const builderScrollRef = useRef<HTMLDivElement>(null); 

  // Fetch words with latest usage counts
  const refreshWords = useCallback(async () => {
    try {
      const words = await universeDb.words.toArray();
      setDbWords(words);
    } catch (err) {
      console.error('Failed to fetch words from DB:', err);
    }
  }, []);

  useEffect(() => {
    refreshWords();
  }, [config, refreshWords]);
  const [canAddWords, setCanAddWords] = useState(true); 
  const [flashSentenceBuilder, setFlashSentenceBuilder] = useState(false); 

  // Default Emergency Contacts & Favorites if none exist
  useEffect(() => {
    if (config) {
      const updates: any = {};
      let needsUpdate = false;

      if (!config.emergency_contacts || config.emergency_contacts.length < 3) {
        updates.emergency_contacts = [
          { name: 'مسعود (Masood)', phone: '9513631315' },
          { name: 'حماد (Hammaad)', phone: '9663527755' },
          { name: 'Emergency', phone: '112' }
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

  const quotes = useMemo(() => config?.quotes || [], [config]);
  const [randomQuote, setRandomQuote] = useState<any>(null);

  const navigate = useCallback((newRoute: string, tab?: string) => {
    if (tab) setInitialSettingsTab(tab);
    window.location.hash = newRoute;
  }, []);

  // Ambient Listener integration
  const { isListening, toggleListening } = useAmbientListener(language, (suggestedIds) => {
    // Check for direct actions
    if (suggestedIds.includes('doodle_action')) {
       navigate('#doodle');
       playClick();
    }
    
    // Auto-respond for basic affirmations if very strong match (e.g. they say "Yes")
    if (suggestedIds.includes('sys_salam')) {
       speak(isUrdu ? 'السلام علیکم' : 'Assalamualikum', 'sys_salam');
    }
    if (suggestedIds.includes('sys_yes')) {
       speak(isUrdu ? 'ہاں' : 'Yes', 'sys_yes');
    }

    // Direct navigation actions via voice
    if (suggestedIds.includes('next_action')) {
      actionHandlerRef.current('NEXT');
    }
    if (suggestedIds.includes('prev_action')) {
      actionHandlerRef.current('PREV');
    }
    if (suggestedIds.includes('select_action')) {
      actionHandlerRef.current('SELECT');
    }

    setContextualSuggestions(suggestedIds.filter(id => !id.endsWith('_action')));
    if ((window as any)._suggest_timer) clearTimeout((window as any)._suggest_timer);
    (window as any)._suggest_timer = setTimeout(() => setContextualSuggestions([]), 15000);
  });

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
    if (!config || !config.categories) return;
    const newConfig = { ...config, categories: [...config.categories] };
    let customCat = newConfig.categories.find((c: any) => c.id === 'cat_custom');
    if (!customCat) {
      customCat = { id: 'cat_custom', label_ur: 'میرے الفاظ', label_en: 'My Words', icon: 'star', items: [] };
      newConfig.categories.push(customCat);
    }
    customCat.items = [...(customCat.items || []), item];
    updateConfig(newConfig as any);
    setAddingWord(null);
  };

  const toggleFavorite = useCallback((itemId: string) => {
    if (!config) return;
    const newConfig = { ...config, favorites: [...(config.favorites || [])] };
    const idx = newConfig.favorites.indexOf(itemId);
    if (idx > -1) newConfig.favorites.splice(idx, 1);
    else newConfig.favorites.push(itemId);
    updateConfig(newConfig as any);
  }, [config, updateConfig]);

  const displayCategories = useMemo(() => {
    if (!config?.categories) return [];
    return [
      { id: 'cat_fav', label_ur: 'پسندیدہ', label_en: 'Favorite', icon: 'heart' },
      { id: 'khandan', label_ur: 'خاندان', label_en: 'Family', icon: 'users' }
    ];
  }, [config]);

  const searchResults = useFuzzySearch(allItems, searchQuery);

  const [displayLimit, setDisplayLimit] = useState(24);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!mainContentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainContentRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setDisplayLimit(prev => prev + 24);
    }
  }, []);

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
      // Home view: Show ALL words from all items, sorted by usageCount
      items = dbWords.length > 0 ? [...dbWords].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)) : allItems;
    } else if (currentCategory === 'cat_fav' || currentCategory === 'fav') {
      const favs = config?.favorites || [];
      items = (dbWords.length > 0 ? dbWords : allItems).filter((i: any) => favs.includes(i.id));
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
      const catIds = (cat?.items || []).map((i: any) => i.id);
      const catItems = (dbWords.length > 0 ? dbWords : allItems).filter((i: any) => catIds.includes(i.id));
      items = [backItem, ...catItems];
    }

    return items.map((item: any) => {
      if (item.onClick) return item; 
      return {
        ...item,
        onClick: async () => {
          speak(isUrdu ? item.ur : item.en, item.id);
          if (canAddWords) {
            setSentence(prev => [...prev, item]);
          } else {
            setSentence(prev => [...prev.slice(0, -1), item]);
            setFlashSentenceBuilder(true);
            setTimeout(() => setFlashSentenceBuilder(false), 500);
          }
          await wordNetwork.recordUsage(item.id);
          refreshWords(); // Dynamically re-sort after usage
          setFocusedIndex(-1);
        }
      };
    }).slice(0, displayLimit); 
  }, [currentCategory, config, isUrdu, speak, playClick, searchQuery, allItems, searchResults, displayLimit, dbWords, canAddWords, refreshWords]);

  const predictions = useMemo(() => {
    const lastWord = sentence.length > 0 ? sentence[sentence.length - 1] : null;
    const nextIds = lastWord?.next || [];
    
    const mergedIds = Array.from(new Set([...contextualSuggestions, ...nextIds]));
    
    let results = allItems
      .filter((i: any) => mergedIds.includes(i.id));

    // Fallback: If less than 5, add top words (usage sorted) that aren't already there
    if (results.length < 5) {
      const topWords = [...dbWords].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      for (const word of topWords) {
        if (results.length >= 10) break;
        if (!results.find(r => r.id === word.id)) {
          results.push(word);
        }
      }
    }

    return results
      .slice(0, 10) // Approx 5 per line, 2 lines max
      .map((i: any) => ({
        ...i, 
        onClick: async () => { 
          speak(isUrdu ? i.ur : i.en, i.id); 
          if (canAddWords) {
            setSentence(prev => [...prev, i]);
          } else {
            setSentence(prev => [...prev.slice(0, -1), i]);
            setFlashSentenceBuilder(true);
            setTimeout(() => setFlashSentenceBuilder(false), 500); 
          }
          await wordNetwork.recordUsage(i.id);
          refreshWords();
          setFocusedIndex(-1);
          setContextualSuggestions([]);
        }
      }));
  }, [sentence, allItems, isUrdu, speak, contextualSuggestions, dbWords, refreshWords, canAddWords]);

  const navigableActions = useMemo(() => {
    const actions: (() => void)[] = [];
    
    // --- Header Group ---
    // 0: Toggle Camera
    actions.push(toggleTracking);
    // 1: Toggle Listening
    actions.push(toggleListening);
    // 2: Shukr (Home)
    actions.push(() => {
      setSentence([]);
      setCurrentCategory(null);
      setFocusedIndex(-1);
      navigate('#');
      playClick();
    });
    // 3: Toggle Language
    actions.push(() => {
      setLanguage(language === 'ur' ? 'en' : 'ur');
      playClick();
    });
    // 4: Settings
    actions.push(() => {
      navigate('#settings');
      playClick();
    });

    if (route === '#') {
      // --- Builder Group ---
      // 5: Backspace
      actions.push(() => {
        setSentence(prev => prev.slice(0, -1));
        playClick();
      });
      // 6: Clear
      actions.push(() => {
        setSentence([]);
        playClick();
      });
      // 7: Play
      actions.push(() => {
        playSentence();
      });
      
      // Predictions
      predictions.forEach(p => actions.push(p.onClick));
      
      // Grid Items
      gridItems.forEach((g: any) => actions.push(g.onClick));
    }
    
    // --- Footer Group --- (Available on all pages)
    displayCategories.forEach((cat) => {
      actions.push(() => {
        playClick();
        if (route !== '#') navigate('#');
        setCurrentCategory(cat.id === currentCategory ? null : cat.id);
        setFocusedIndex(-1);
        setSearchQuery('');
      });
    });

    actions.push(() => {
      playClick();
      navigate('#doodle');
    }); // doodle
    actions.push(() => {
      speak(isUrdu ? 'ہاں' : 'Yes', 'sys_yes');
      setSentence(prev => [...prev, { id: 'sys_yes', en: 'Yes', ur: 'ہاں', isWord: true }]);
    }); // Yes
    actions.push(() => {
      speak(isUrdu ? 'نہیں' : 'No', 'sys_no');
      setSentence(prev => [...prev, { id: 'sys_no', en: 'No', ur: 'نہیں', isWord: true }]);
    }); // No

    if (route === '#') {
      // Quote
      actions.push(handleNextQuote);
    }
    
    return actions;
  }, [route, toggleTracking, toggleListening, setLanguage, language, navigate, playClick, sentence, playSentence, predictions, gridItems, displayCategories, currentCategory, isUrdu, handleNextQuote, setSentence, setCurrentCategory, setFocusedIndex, setSearchQuery, speak]);

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
      case 'HOME': 
      case 'CLEAR': 
        setSentence([]); setCurrentCategory(null); setFocusedIndex(-1); 
        playClick();
        break;
      case 'TOGGLE_RECOGNITION': playClick(); break;
      case 'NEXT': 
        setFocusedIndex(prev => (prev + 1) % navigableActions.length);
        playClick();
        break;
      case 'PREV':
        setFocusedIndex(prev => prev <= 0 ? navigableActions.length - 1 : prev - 1);
        playClick();
        break;
      case 'SELECT':
        setFocusedIndex(prev => {
          if (prev >= 0 && prev < navigableActions.length) {
            navigableActions[prev]();
          }
          return prev;
        });
        break;
    }
  }, [playClick, speak, isUrdu, playSentence, config, navigableActions]);
  useEffect(() => {
    actionHandlerRef.current = handleGestureAction;
  }, [handleGestureAction]);

  const appContent = (
    <div className="app-viewport" dir="rtl">
      <Header
        onOpenSettings={(tab) => navigate('#settings', tab)}
        isTrackingEnabled={isEnabled}
        isRecognitionActive={isRecognitionActive}        toggleTracking={toggleTracking} 
        hasUnsyncedChanges={hasUnsyncedChanges}
        isModelLoaded={isModelLoaded}
        onSOS={() => setShowSOS(true)}
        onHome={() => { setSentence([]); setCurrentCategory(null); navigate('#'); }}
        isListening={isListening}
        toggleListening={toggleListening}
        lastGesture={lastGesture}
        isUrdu={isUrdu}
        focusedIndex={focusedIndex}
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
            focusedIndex={focusedIndex}
            onRecognize={(item: any) => {              setSentence(prev => [...prev, item]); 
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
                offset={5} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery}
                canAddWords={canAddWords} 
                builderScrollRef={builderScrollRef} 
                flashBorder={flashSentenceBuilder} 
              />
              <PredictionScroller 
                predictions={predictions}
                focusedIndex={focusedIndex}
                offset={5 + 3}
              />
            </div>

            <div className="main-content-area" ref={mainContentRef} onScroll={handleScroll}>
              <WordGrid
                gridItems={gridItems}
                focusedIndex={focusedIndex}
                offset={5 + 3 + predictions.length}
                randomQuote={randomQuote}
                onNextQuote={handleNextQuote}
                quoteFocused={focusedIndex === 5 + 3 + predictions.length + gridItems.length + displayCategories.length + 3}
                onLongPressItem={(item) => toggleFavorite(item.id)}
                favorites={config?.favorites || []}
              />            </div>
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
          navigate('#doodle');
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
        offset={route === '#' ? (5 + 3 + predictions.length + gridItems.length) : 5}
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

  if (showSplash || isConfigLoading) {
    return <SplashScreen quote={randomQuote || { ur: 'شکراً', en: 'Shukr' }} isLoading={isConfigLoading} />;
  }

  return (
    <>
      {appContent}
      {isOfflineMode && (
        <div className="offline-badge">
          <Activity size={20} />
          <span>آف لائن موڈ (ڈیٹا محفوظ ہے) | Offline Mode</span>
        </div>
      )}
    </>
  );
};

export default function App() { return ( <LanguageProvider><AppContent /></LanguageProvider> ); }
