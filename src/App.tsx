import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './styles/app.css';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import { useAudio } from './hooks/useAudio';
import { ConfigProvider, useAppConfig } from './hooks/useAppConfig';
import { useCameraGestures } from './hooks/useCameraGestures';
import { GestureEditModal } from './components/modals/GestureEditModal';
import { type GestureDefinition } from './recognition/gestures/types';
import { useFuzzySearch } from './hooks/useFuzzySearch';
import { predictionsEngine } from './lib/predictionsEngine';
import { translator } from './lib/translator';
import { universeDb } from './lib/universeDb';
import { generateAudioStorageKey } from './lib/constants';

// Extracted Components
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { WordPredictions } from './components/WordPredictions';
import { WordGrid } from './components/WordGrid';
import { SentenceBuilder } from './components/SentenceBuilder';
import { Footer } from './components/Footer';
import { SOSModal } from './components/SOSModal';
import { SettingsPanel } from './components/SettingsPanel';
import { VoiceStudio } from './components/VoiceStudio/VoiceStudio';
import { DoodlePad } from './components/Doodle/DoodlePad';
import { CameraPreview } from './components/CameraPreview';
import { ScreenFlashes } from './components/ScreenFlashes';
import { WordAddModal } from './components/WordAddModal';
import { WordEditor } from './components/WordEditor';
import { WordManager } from './components/WordManager';
import { LandingPage } from './components/LandingPage';
import { PermissionDialog } from './components/modals/Dialogs';

const AppContent = () => {
  const { language, setLanguage, primaryLanguage, secondaryLanguage, isPrimary } = useLanguage();
  const { speak, speakSequence, playClick, currentlyPlayingId } = useAudio();
  const { config, updateConfig, isLoading: isConfigLoading } = useAppConfig();

  const [editingWord, setEditingWord] = useState<any | null>(null);

  const isPWA = useMemo(() => {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  }, []);

  const [isAppStarted, setIsAppStarted] = useState(() => {
    return localStorage.getItem('shukr_app_started') === 'true' || isPWA;
  });
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [sentence, setSentence] = useState<any[]>([]);
  const [lastGesture, setLastGesture] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSplash, setShowSplash] = useState(isAppStarted); 
  const [addingWord, setAddingWord] = useState<any | null>(null);
  const [route, setRoute] = useState(window.location.hash || '#');
  const [showSOS, setShowSOS] = useState(false);
  const [initialEditingItem, setInitialEditingItem] = useState<any>(null);
  const [initialSettingsTab, setInitialSettingsTab] = useState<any>(null);
  const [voiceParams, setVoiceParams] = useState<{ wordId?: string, voiceId?: string, language?: string } | null>(null);
  const [dbWords, setDbWords] = useState<any[]>([]);
  const [isSentenceBuilderActive, setIsSentenceBuilderActive] = useState(false);
  const [flashSentenceBuilder, setFlashSentenceBuilder] = useState(false);
  const [showYesFlash, setShowYesFlash] = useState(false);
  const [showNoFlash, setShowNoFlash] = useState(false);
  const [randomQuote, setRandomQuote] = useState<any>(null);
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [editingGesture, setEditingGesture] = useState<GestureDefinition | null>(null);
  const [showPermissionExplanation, setShowPermissionExplanation] = useState(false);

  const actionHandlerRef = useRef<(gestureKey: string) => void>(() => {});
  const builderScrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (window as any)._showSOS = () => setShowSOS(true);
  }, []);

  const { effectiveEnabled, isRecognitionActive, toggleTracking, permissionStatus, requestPermission, videoRef, isModelLoaded, gestureHits } =
    useCameraGestures((action) => {
      actionHandlerRef.current(action);
    }, route === '#voices' || showSplash || !isAppStarted || isConfigLoading);

  const handleCameraToggle = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      setShowPermissionExplanation(true);
    } else {
      toggleTracking();
    }
  }, [permissionStatus, toggleTracking]);

  const handleConfirmPermission = useCallback(async () => {
    const success = await requestPermission();
    if (success) {
      setShowPermissionExplanation(false);
    }
  }, [requestPermission]);

  const handleSaveGesture = useCallback(async (updated: GestureDefinition, blob?: Blob | null) => {
    if (!config) return;
    const newConfig = { 
      ...config,
      gesture_mappings: {
        ...(config.gesture_mappings || {}),
        [updated.id]: updated
      }
    };
    updateConfig(newConfig);
    if (blob) {
      await universeDb.audio.put({ id: `gesture_${updated.id}`, blob });
    }
    setEditingGesture(null);
  }, [config, updateConfig]);

  const handlePreviewDragMove = useCallback((_pos: { x: number; y: number }) => {}, []);

  const handlePreviewDrop = useCallback((rect: DOMRect) => {
    if (!cameraButtonRef.current) return;
    const dropRect = cameraButtonRef.current.getBoundingClientRect();
    
    // Increased detection area (Magnetism)
    const padding = 25; 
    const target = {
      left: dropRect.left - padding,
      right: dropRect.right + padding,
      top: dropRect.top - padding,
      bottom: dropRect.bottom + padding
    };

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const isOverlapping = (
      centerX >= target.left && 
      centerX <= target.right && 
      centerY >= target.top && 
      centerY <= target.bottom
    );

    if (isOverlapping) {
      if (navigator.vibrate) navigator.vibrate([40, 30]); // Haptic feedback
      toggleTracking();
    }
  }, [toggleTracking]);

  const refreshWords = useCallback(async () => {
    const words = await universeDb.words.toArray();
    setDbWords(words);
  }, []);

  useEffect(() => {
    refreshWords();
  }, [refreshWords, config]);

  const [previousRoute, setPreviousRoute] = useState<string>('#');

  useEffect(() => {
    const handleHashChange = () => {
      setPreviousRoute(route);
      setRoute(window.location.hash || '#');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [route]);

  const navigate = useCallback((newRoute: string, tab?: string) => {
    if (tab) setInitialSettingsTab(tab);
    setPreviousRoute(route);
    window.location.hash = newRoute;
  }, [route]);

  const navigateVoiceStudio = useCallback((params: { wordId?: string, voiceId?: string, language?: string }) => {
    setVoiceParams(params);
    setPreviousRoute(route);
    window.location.hash = '#voices';
  }, [route]);

  const toggleSentenceBuilder = useCallback(() => {
    setIsSentenceBuilderActive((prev) => !prev);
    setFocusedIndex(-1);
  }, []);

  const handleNextQuote = useCallback(() => {
    if (!config?.quotes?.length) return;
    const quotes = config.quotes;
    const currentIndex = quotes.findIndex((q: any) => q.id === randomQuote?.id);
    const nextIndex = (currentIndex + 1) % quotes.length;
    setRandomQuote(quotes[nextIndex]);
  }, [config, randomQuote]);

  useEffect(() => {
    if (config?.quotes && config.quotes.length > 0 && !randomQuote) {
      setRandomQuote(config.quotes[Math.floor(Math.random() * config.quotes.length)]);
    }
  }, [config, randomQuote]);

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => setShowSplash(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const playSentence = useCallback(async () => {
    if (sentence.length === 0) return;
    await speakSequence(sentence);
    setSentence([]);
    setCurrentCategory(null);
    setSearchQuery('');
  }, [sentence, speakSequence]);

  const allItems = useMemo(() => {
    if (!config?.categories) return [];
    return config.categories.flatMap((c: any) => c.items || []);
  }, [config]);

  const toggleFavorite = useCallback(
    (itemId: string) => {
      if (!config) return;
      const favorites = [...(config.favorites || [])];
      const idx = favorites.indexOf(itemId);
      if (idx > -1) favorites.splice(idx, 1);
      else favorites.push(itemId);
      updateConfig({ ...config, favorites });
    },
    [config, updateConfig]
  );

  const handleDeleteWord = useCallback(async (id: string) => {
    if (!config) return;
    const newConfig: any = {
      ...config,
      categories: (config.categories || []).map((cat: any) => ({
        ...cat,
        items: (cat.items || []).filter((i: any) => i.id !== id),
      }))
    };
    if (newConfig.favorites) {
      newConfig.favorites = newConfig.favorites.filter((fid: string) => fid !== id);
    }
    if (newConfig.family) {
      newConfig.family = newConfig.family.filter((fid: string) => fid !== id);
    }
    updateConfig(newConfig);
    await universeDb.words.delete(id);
    await universeDb.doodles.where('wordId').equals(id).delete();
    refreshWords();
    setEditingWord(null);
  }, [config, updateConfig, refreshWords]);

  const handleSaveEdit = useCallback(async (item: any, blob?: Blob | null) => {
    if (!config) return;
    const newConfig: any = { ...config };
    
    // Handle isFamily toggle during edit
    const isActuallyInFamily = (newConfig.family || []).includes(item.id);
    
    if (item.isFamily && !isActuallyInFamily) {
        newConfig.family = [...(newConfig.family || []), item.id];
    } else if (!item.isFamily && isActuallyInFamily) {
        newConfig.family = (newConfig.family || []).filter((id: string) => id !== item.id);
    }

    newConfig.categories = newConfig.categories.map((cat: any) => ({
      ...cat,
      items: (cat.items || []).map((i: any) => i.id === item.id ? item : i)
    }));

    updateConfig(newConfig);
    await universeDb.words.put(item);
    if (blob) {
      const voiceId = config.active_voice || 'default';
      const audioKey = generateAudioStorageKey(item.id, voiceId);
      await universeDb.audio.put({ id: audioKey, blob });
    }
    refreshWords();
    setEditingWord(null);
  }, [config, updateConfig, refreshWords]);

  const displayCategories = useMemo(() => {
    if (!config?.categories) return [];
    return config.categories.map((cat: any) => ({
      id: cat.id,
      label_primary: cat.label_primary,
      label_secondary: cat.label_secondary,
      icon: cat.icon
    }));
  }, [config]);

  const searchResults = useFuzzySearch(allItems, searchQuery);

  const handleScroll = useCallback(() => {
    // Scroll limits omitted
  }, []);

  const handleAddCustomWord = async (item: any, blob?: Blob | null) => {
    if (!config) return;
    const newConfig: any = { ...config, categories: [...(config.categories || [])] };
    
    if (item.isFamily) {
        newConfig.family = [...(newConfig.family || []), item.id];
    } 

    newConfig.categories = newConfig.categories.map((cat: any) => {
      if (cat.id === 'general') {
        return { ...cat, items: [...(cat.items || []), item] };
      }
      return cat;
    });

    updateConfig(newConfig);
    
    await universeDb.words.put(item);
    if (blob) {
      const voiceId = config.active_voice || 'default';
      const audioKey = generateAudioStorageKey(item.id, voiceId);
      await universeDb.audio.put({ id: audioKey, blob });
    }
    refreshWords();
    setAddingWord(null);
  };

  const createSearchPrompt = useCallback(async () => {
    const res = await translator.translate(searchQuery);
    setAddingWord({
      id: 'pending_id',
      text_primary: res?.ur || searchQuery,
      text_secondary: res?.en || searchQuery,
      en: res?.en || searchQuery,
      ur: res?.ur || searchQuery,
      roman: res?.roman || searchQuery,
      icon: 'list-plus',
      next: []
    });
  }, [searchQuery]);

  const getSearchItems = useCallback(() => {
    const results = [...searchResults];
    const exactMatch = results.some((r: any) => 
      (r.text_primary || r.ur || '').toLowerCase() === searchQuery.toLowerCase() || 
      (r.text_secondary || r.en || '').toLowerCase() === searchQuery.toLowerCase()
    );
    if (!exactMatch && searchQuery.length > 1) {
      const addLabel = language === 'ur' ? 'نیا لفظ؟' : 'Add Word?';
      results.push({ id: 'add_new_prompt', ur: addLabel, en: 'Add Word?', icon: 'list-plus', isPrompt: true, onClick: createSearchPrompt });
    }
    return results;
  }, [searchResults, searchQuery, createSearchPrompt, language]);

  const getHomeItems = useCallback(() => {
    return dbWords.length > 0 ? [...dbWords].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)) : allItems;
  }, [dbWords, allItems]);

  const handleOpenAddWord = useCallback((_catId: string, initialValue?: string) => {
    setAddingWord({
      id: 'pending_id',
      text_primary: initialValue || '',
      text_secondary: initialValue || '',
      ur: initialValue || '',
      en: initialValue || '',
      roman: '',
      icon: 'list-plus',
      next: []
    });
  }, []);

  const getFavoriteItems = useCallback(() => {
    const favs = config?.favorites || [];
    const items = (dbWords.length > 0 ? dbWords : allItems).filter((i: any) => favs.includes(i.id));
    
    const addLabel = language === 'ur' ? 'نیا لفظ؟' : 'Add Word?';
    return [
      { id: 'add_fav_prompt', ur: addLabel, en: 'Add Word?', icon: 'list-plus', isPrompt: true, onClick: () => handleOpenAddWord('favorite') },
      ...items
    ];
  }, [dbWords, allItems, config, language, handleOpenAddWord]);

  const getFamilyItems = useCallback(() => {
    const fams = config?.family || [];
    const items = (dbWords.length > 0 ? dbWords : allItems).filter((i: any) => fams.includes(i.id));
    const addLabel = language === 'ur' ? 'نیا لفظ؟' : 'Add Word?';
    return [
      { id: 'add_family_prompt', ur: addLabel, en: 'Add Word?', icon: 'list-plus', isPrompt: true, onClick: () => handleOpenAddWord('family') },
      ...items
    ];
  }, [dbWords, allItems, config, language, handleOpenAddWord]);

  const gridItems = useMemo(() => {
    if (searchQuery) return getSearchItems();
    if (currentCategory === 'favorite') return getFavoriteItems();
    if (currentCategory === 'family') return getFamilyItems();
    
    const items = getHomeItems();
    if (currentCategory === 'general') {
        const addLabel = language === 'ur' ? 'نیا لفظ؟' : 'Add Word?';
        return [
          { id: 'add_general_prompt', ur: addLabel, en: 'Add Word?', icon: 'list-plus', isPrompt: true, onClick: () => handleOpenAddWord('general') },
          ...items
        ];
    }
    return items;
  }, [searchQuery, currentCategory, getSearchItems, getFavoriteItems, getFamilyItems, getHomeItems, language, handleOpenAddWord]);

  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    const updatePredictions = async () => {
      if (dbWords.length === 0) return;
      const ranked = await predictionsEngine.rankPredictions(dbWords, sentence);
      setPredictions(ranked.slice(0, 6));
    };
    updatePredictions();
  }, [sentence, dbWords]);

  const sentenceRef = useRef<any[]>([]);
  useEffect(() => {
    sentenceRef.current = sentence;
  }, [sentence]);

  const handleWordItemClick = useCallback(
    async (item: any) => {
      const text = isPrimary ? (item.text_primary || item.ur) : (item.text_secondary || item.en);
      speak(text, item.id);

      if (sentence.length < 8) {
        setSentence((prev) => {
          const newSentence = [...prev, item];
          if (prev.length > 0) {
            predictionsEngine.recordTransition(prev[prev.length - 1].id, item.id);
          }
          return newSentence;
        });
      } else {
        if (isSentenceBuilderActive) {
          setFlashSentenceBuilder(true);
          setTimeout(() => setFlashSentenceBuilder(false), 500);
        } else {
          setSentence((prev) => [...prev.slice(1), item]);
        }
      }
      
      predictionsEngine.recordUsage(item.id);
    },
    [speak, isPrimary, isSentenceBuilderActive, sentence.length]
  );

  const navigableActions = useMemo(() => {
    const actions: (() => void)[] = [];
    
    // 1. Header (0-4)
    actions.push(toggleTracking); // Camera
    actions.push(toggleSentenceBuilder); // Builder
    actions.push(() => { playClick(); navigate('#'); }); // Shukr/Home
    actions.push(() => { playClick(); setLanguage(language === primaryLanguage ? secondaryLanguage : primaryLanguage); }); // Lang
    actions.push(() => { playClick(); navigate('#settings'); }); // Settings

    // 2. Categories
    displayCategories.forEach(cat => actions.push(() => {
      playClick();
      setCurrentCategory(cat.id === currentCategory ? null : cat.id);
      setFocusedIndex(-1);
    }));

    // 3. Predictions
    predictions.forEach(item => actions.push(() => handleWordItemClick(item)));

    // 4. Grid Items
    gridItems.forEach(item => actions.push(() => handleWordItemClick(item)));

    // 5. Sentence Builder (if active)
    if (isSentenceBuilderActive) {
      actions.push(() => { setSentence([]); playClick(); }); // Clear
      actions.push(() => { setSentence(p => p.slice(0, -1)); playClick(); }); // Backspace
      actions.push(playSentence); // Play
    }

    // 6. Footer Actions (Yes, No, Doodle)
    actions.push(() => { 
      speak(isPrimary ? 'ہاں' : 'Yes', 'sys_yes'); 
      setShowYesFlash(true);
      setTimeout(() => setShowYesFlash(false), 1000);
    });
    actions.push(() => { 
      speak(isPrimary ? 'نہیں' : 'No', 'sys_no'); 
      setShowNoFlash(true);
      setTimeout(() => setShowNoFlash(false), 1000);
    });
    actions.push(() => { playClick(); navigate('#doodle'); });

    return actions;
  }, [toggleTracking, toggleSentenceBuilder, playClick, navigate, setLanguage, language, primaryLanguage, secondaryLanguage, displayCategories, currentCategory, predictions, gridItems, isSentenceBuilderActive, playSentence, handleWordItemClick, isPrimary, speak]);

  const handleGestureAction = useCallback(async (gestureKey: string) => {
    const mapping = config?.gesture_mappings?.[gestureKey];
    if (!mapping) return;
    
    setLastGesture(gestureKey);
    setTimeout(() => setLastGesture(''), 2000);

    // 1. Handle Audio Mapping
    if (mapping.type === 'audio') {
      const audioId = `gesture_${gestureKey}`;
      const record = await universeDb.audio.get(audioId);
      if (record?.blob) {
        const url = URL.createObjectURL(record.blob);
        const audio = new Audio(url);
        audio.play();
        return;
      }
    }

    // 2. Handle Words Sequence
    if (mapping.type === 'words' && Array.isArray(mapping.value)) {
      const wordsToSpeak = allItems.filter((i: any) => (mapping.value as string[]).includes(i.id));
      if (wordsToSpeak.length > 0) {
        speakSequence(wordsToSpeak);
        return;
      }
    }

    // 3. Handle Actions
    if (mapping.type === 'action') {
      const action = mapping.value as string;
      switch (action) {
        case 'YES':
          speak(isPrimary ? 'ہاں' : 'Yes', 'sys_yes');
          setShowYesFlash(true);
          setTimeout(() => setShowYesFlash(false), 1000);
          break;
        case 'CLEAR':
          setSentence([]); setCurrentCategory(null); setFocusedIndex(-1); playClick();
          break;
        case 'SELECT':
          if (focusedIndex >= 0 && focusedIndex < navigableActions.length) navigableActions[focusedIndex]();
          break;
        case 'NEXT':
          setFocusedIndex(p => (p + 1) % navigableActions.length);
          break;
        case 'NAV_DOODLE':
          playClick(); navigate('#doodle');
          break;
        case 'NAV_SETTINGS':
          playClick(); navigate('#settings');
          break;
        case 'TOGGLE_LANG':
          playClick(); setLanguage(language === primaryLanguage ? secondaryLanguage : primaryLanguage);
          break;
        case 'TOGGLE_BUILDER':
          playClick(); toggleSentenceBuilder();
          break;
      }
    }
  }, [config, isPrimary, speak, speakSequence, allItems, focusedIndex, navigableActions, playClick, navigate, setLanguage, language, primaryLanguage, secondaryLanguage, toggleSentenceBuilder]);

  useEffect(() => {
    actionHandlerRef.current = handleGestureAction;
  }, [handleGestureAction]);

  const handleStartApp = useCallback(() => {
    localStorage.setItem('shukr_app_started', 'true');
    setIsAppStarted(true);
    setShowSplash(true);
    navigate('#');
    playClick();
  }, [playClick, navigate]);

  if (showSplash || isConfigLoading) {
    return <SplashScreen quote={randomQuote || { ur: 'شکراً', en: 'Shukr' }} isLoading={isConfigLoading} />;
  }

  if ((!isAppStarted || route === '#landing') && (route === '#' || route === '' || route === '#landing')) {
    return <LandingPage onStart={handleStartApp} />;
  }

  return (
    <div className="app-viewport" dir={document.documentElement.dir}>
      {isDraggingPreview && <div className="dragging-backdrop" />}

      {route !== '#voices' && (
        <Header
          onOpenSettings={(tab) => navigate('#settings', tab)}
          isTrackingEnabled={effectiveEnabled}
          isRecognitionActive={isRecognitionActive}
          toggleTracking={handleCameraToggle}
          hasUnsyncedChanges={false}
          isModelLoaded={isModelLoaded}
          onSOS={() => setShowSOS(true)}
          onHome={() => { setSentence([]); setCurrentCategory(null); navigate('#'); }}
          isSentenceBuilderActive={isSentenceBuilderActive}
          toggleSentenceBuilder={toggleSentenceBuilder}
          lastGesture={lastGesture}
          isPrimary={isPrimary}
          focusedIndex={focusedIndex}
          showCloseDropzone={isDraggingPreview}
          cameraButtonRef={cameraButtonRef}
          gestureMappings={config?.gesture_mappings}
          onLongPressGesture={setEditingGesture}
          onTriggerGesture={handleGestureAction}
          gestureHits={gestureHits}
        />
      )}

      <div className="main-content-wrapper" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {route === '#voices' ? (
          <VoiceStudio
            config={config}
            updateConfig={updateConfig}
            onClose={() => { setVoiceParams(null); navigate(previousRoute !== '#voices' ? previousRoute : '#'); }}
            initialWordId={voiceParams?.wordId}
            initialVoiceId={voiceParams?.voiceId}
            initialLanguage={voiceParams?.language}
          />        ) : route === '#words' ? (
          <WordManager 
            onClose={() => navigate('#')} 
            onRecord={navigateVoiceStudio}
          />
        ) : route === '#settings' ? (
          <SettingsPanel
            config={config} updateConfig={updateConfig}
            initialTab={initialSettingsTab} initialEditingItem={initialEditingItem}
            onOpenVoiceStudio={(wordId?: string, language?: string) => navigateVoiceStudio({ wordId, language })}
            onShowLanding={() => { setIsAppStarted(false); navigate('#'); }}
            onClose={() => { setInitialEditingItem(null); setInitialSettingsTab(null); navigate('#'); }}
          />
        ) : route === '#doodle' ? (
          <>
            <CameraPreview isEnabled={effectiveEnabled} videoRef={videoRef} onDragChange={setIsDraggingPreview} onDragMove={handlePreviewDragMove} onDrop={handlePreviewDrop} />
            <DoodlePad
              config={config} focusedIndex={focusedIndex}
              onOpenAddWord={(initial) => handleOpenAddWord('cat_custom', initial)}
              sentence={sentence}
              onRecognize={(item: any) => {
                speak(isPrimary ? (item.text_primary || item.ur) : (item.text_secondary || item.en), item.id);
                if (sentence.length < 8) {
                  setSentence(p => [...p, item]);
                } else {
                  if (isSentenceBuilderActive) {
                    setFlashSentenceBuilder(true);
                    setTimeout(() => setFlashSentenceBuilder(false), 500);
                  } else {
                    setSentence(p => [...p.slice(1), item]);
                  }
                }
                predictionsEngine.recordUsage(item.id);
              }}
            />
          </>
        ) : (
          <>
            <CameraPreview isEnabled={effectiveEnabled} videoRef={videoRef} onDragChange={setIsDraggingPreview} onDragMove={handlePreviewDragMove} onDrop={handlePreviewDrop} />
            
            <div className="top-system-area">
              <WordPredictions 
                predictions={predictions} 
                focusedIndex={focusedIndex} 
                offset={displayCategories.length} 
                onSelect={handleWordItemClick}
              />
            </div>

            <div className="main-content-area" ref={mainContentRef} onScroll={handleScroll}>
              <WordGrid
                gridItems={gridItems}
                focusedIndex={focusedIndex}
                offset={5 + displayCategories.length + predictions.length}
                randomQuote={randomQuote}
                quotes={config?.quotes || []}
                onNextQuote={handleNextQuote}
                updateConfig={updateConfig}
                config={config}
                currentlyPlayingId={currentlyPlayingId}
                quoteFocused={false}
                onLongPressItem={(item) => toggleFavorite(item.id)}
                onDeleteItem={handleDeleteWord}
                onEditItem={(item) => setEditingWord(item)}
                onSelect={handleWordItemClick}
                favorites={config?.favorites || []}
              />
            </div>
            {isSentenceBuilderActive && (
              <div className="top-system-area" style={{ paddingTop: 0, paddingBottom: 8 }}>
                <SentenceBuilder
                  words={sentence} onClear={() => setSentence([])}
                  onBackspace={() => setSentence(p => p.slice(0, -1))}
                  onPlay={playSentence} focusedIndex={focusedIndex} 
                  offset={5 + displayCategories.length + predictions.length + gridItems.length}
                  canAddWords={sentence.length < 8}
                  builderScrollRef={builderScrollRef} 
                  flashBorder={flashSentenceBuilder}
                  currentlyPlayingId={currentlyPlayingId}
                />
              </div>
            )}
          </>
        )}
      </div>

      {route !== '#voices' && (
        <Footer
          currentCategory={currentCategory}
          onCategoryClick={(catId) => {
            playClick(); if (route !== '#') navigate('#');
            setCurrentCategory(catId === currentCategory ? null : catId);
            setFocusedIndex(-1); setSearchQuery('');
          }}
          onDoodleClick={() => {
            playClick(); 
            if (currentCategory) { 
              setCurrentCategory(null); 
              navigate('#'); 
              return; 
            }
            if (route === '#doodle') {
              navigate('#');
            } else {
              navigate('#doodle');
            }
          }}
          onYesClick={() => {
            const yesText = language === 'ur' ? 'ہاں' : 'Yes';
            speak(yesText, 'sys_yes');
            setShowYesFlash(true);
            setTimeout(() => setShowYesFlash(false), 1000);
            if (route === '#doodle') navigate('#');
          }}
          onNoClick={() => {
            const noText = language === 'ur' ? 'نہیں' : 'No';
            speak(noText, 'sys_no');
            setShowNoFlash(true);
            setTimeout(() => setShowNoFlash(false), 1000);
            if (route === '#doodle') navigate('#');
          }}
          focusedIndex={focusedIndex} 
          offset={5 + displayCategories.length + predictions.length + gridItems.length + (isSentenceBuilderActive ? 3 : 0)}
        />
      )}

      <ScreenFlashes showYes={showYesFlash} showNo={showNoFlash} />
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} emergencyContacts={config?.emergency_contacts || []} />}
      <WordAddModal 
        addingWord={addingWord} 
        setAddingWord={setAddingWord} 
        onSave={handleAddCustomWord} 
        existingWords={(config?.categories || []).flatMap((c: any) => c.items || [])} 
      />
      <WordEditor 
        item={editingWord} 
        onClose={() => setEditingWord(null)} 
        onSave={handleSaveEdit} 
        onDelete={handleDeleteWord} 
        existingWords={(config?.categories || []).flatMap((c: any) => c.items || [])}
      />
      {editingGesture && (
        <GestureEditModal
          gesture={editingGesture}
          config={config}
          onClose={() => setEditingGesture(null)}
          onSave={handleSaveGesture}
        />
      )}
      {showPermissionExplanation && (
        <PermissionDialog 
          type="camera"
          status={permissionStatus === 'granted' ? 'prompt' : (permissionStatus as any)} 
          onConfirm={handleConfirmPermission} 
          onCancel={() => setShowPermissionExplanation(false)} 
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ConfigProvider>
        <AppContent />
      </ConfigProvider>
    </LanguageProvider>
  );
}

