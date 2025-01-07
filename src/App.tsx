import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './styles/app.css';
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

const AppContent = () => {
  const { language, isUrdu, setLanguage } = useLanguage();
  const { speak, speakSequence, playClick, currentlyPlayingId } = useAudio();
  const { logEvent } = useLogger();
  const { config, updateConfig, isLoading: isConfigLoading } = useAppConfig();

  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [sentence, setSentence] = useState<any[]>([]);
  const [lastGesture, setLastGesture] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSplash, setShowSplash] = useState(true);
  const [addingWord, setAddingWord] = useState<any | null>(null);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [route, setRoute] = useState(window.location.hash || '#');
  const [showSOS, setShowSOS] = useState(false);
  const [initialEditingItem, setInitialEditingItem] = useState<any>(null);
  const [initialSettingsTab, setInitialSettingsTab] = useState<any>(null);
  const [dbWords, setDbWords] = useState<any[]>([]);
  const [isSentenceBuilderActive, setIsSentenceBuilderActive] = useState(false);
  const [canAddWords, setCanAddWords] = useState(true);
  const [flashSentenceBuilder, setFlashSentenceBuilder] = useState(false);
  const [showYesFlash, setShowYesFlash] = useState(false);
  const [showNoFlash, setShowNoFlash] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(24);
  const [randomQuote, setRandomQuote] = useState<any>(null);
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);

  const actionHandlerRef = useRef<(action: any) => void>(() => {});
  const builderScrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (window as any)._showSOS = () => setShowSOS(true);
  }, []);

  const { isEnabled, effectiveEnabled, isRecognitionActive, toggleTracking, videoRef, isModelLoaded } =
    useCameraGestures((action) => {
      actionHandlerRef.current(action);
    }, route === '#voices');

  const handlePreviewDragMove = useCallback((_pos: { x: number; y: number }) => {
    // We no longer kill on move, just keep the prop for potential future visual feedback
  }, []);

  const handlePreviewDrop = useCallback((pos: { x: number; y: number }) => {
    if (!cameraButtonRef.current) return;
    const dropRect = cameraButtonRef.current.getBoundingClientRect();
    
    // Check if the drop point (finger/mouse position) is within the target
    // OR if we want "any part of preview", we use the preview box at drop time.
    // Given the previous feedback "if any part touches", I'll use overlap logic but only on DROP.
    
    const previewWidth = window.innerWidth >= 768 ? 130 : 100;
    const previewHeight = window.innerWidth >= 768 ? 170 : 130;

    // Use a smaller 4px buffer instead of 10px
    const targetLeft = dropRect.left - 4;
    const targetRight = dropRect.right + 4;
    const targetTop = dropRect.top - 4;
    const targetBottom = dropRect.bottom + 4;

    // The 'pos' passed here is the top-left of the preview at the moment of drop
    const overlap = !(
      pos.x + previewWidth < targetLeft ||
      pos.x > targetRight ||
      pos.y + previewHeight < targetTop ||
      pos.y > targetBottom
    );

    if (overlap && isEnabled) {
      toggleTracking();
      playClick();
    }
  }, [isEnabled, toggleTracking, playClick]);

  const quotes = useMemo(() => config?.quotes || [], [config]);

  const refreshWords = useCallback(async () => {
    try {
      const words = await universeDb.words.toArray();
      setDbWords(words);
    } catch (err) {
      console.error('Failed to fetch words from DB:', err);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => refreshWords(), 0);
  }, [config, refreshWords]);

  const triggerYesFlash = useCallback(() => {
    setShowYesFlash(true);
    setTimeout(() => setShowYesFlash(false), 800);
  }, []);

  const triggerNoFlash = useCallback(() => {
    setShowNoFlash(true);
    setTimeout(() => setShowNoFlash(false), 800);
  }, []);

  useEffect(() => {
    if (config) {
      const updates: any = {};
      let needsUpdate = false;

      if (!config.emergency_contacts || config.emergency_contacts.length < 3) {
        updates.emergency_contacts = [
          { name: 'مسعود (Masood)', phone: '9513631315' },
          { name: 'حماد (Hammaad)', phone: '9663527755' },
          { name: 'Emergency', phone: '112' },
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

  useEffect(() => {
    const checkSyncStatus = () => {
      const lastSnapshot = parseInt(localStorage.getItem('shukr_last_snapshot_ts') || '0');
      const lastLocalMod = parseInt(localStorage.getItem('shukr_last_local_mod') || '0');

      setHasUnsyncedChanges(lastLocalMod > lastSnapshot);
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
  }, [sentence]);

  const navigate = useCallback((newRoute: string, tab?: string) => {
    if (tab) setInitialSettingsTab(tab);
    window.location.hash = newRoute;
  }, []);

  const toggleSentenceBuilder = useCallback(() => {
    setIsSentenceBuilderActive((prev) => !prev);
    setFocusedIndex(-1);
  }, []);

  const handleNextQuote = useCallback(() => {
    if (quotes.length === 0) return;

    const currentIndex = quotes.findIndex((q: any) => q.en === randomQuote?.en);
    const nextIndex = (currentIndex + 1) % quotes.length;

    setRandomQuote(quotes[nextIndex]);
    logEvent('quote_action', { type: 'next_quote', index: nextIndex });
  }, [quotes, randomQuote, logEvent]);

  useEffect(() => {
    if (quotes.length > 0 && !randomQuote) {
      setTimeout(() => setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]), 0);
    }
  }, [quotes, randomQuote]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const playSentence = useCallback(async () => {
    if (sentence.length === 0) return;

    await speakSequence(sentence);
    logEvent('speech_action', { type: 'sentence_builder' });

    setSentence([]);
    setCurrentCategory(null);
    setSearchQuery('');
  }, [sentence, speakSequence, logEvent]);

  const allItems = useMemo(() => {
    if (!config?.categories) return [];
    return config.categories.flatMap((c: any) => c.items || []);
  }, [config]);

  const handleAddCustomWord = async (item: any) => {
    if (!config) return;

    const newConfig: any = { ...config, categories: [...(config.categories || [])] };
    const targetCatId = item.categoryId || 'cat_custom';

    let targetCat = newConfig.categories.find((c: any) => c.id === targetCatId);

    if (!targetCat) {
      if (targetCatId === 'cat_custom') {
        targetCat = {
          id: 'cat_custom',
          label_ur: 'میرے الفاظ',
          label_en: 'My Words',
          icon: 'star',
          items: [],
        };
      } else if (targetCatId === 'khandan') {
        targetCat = {
          id: 'khandan',
          label_ur: 'خاندان',
          label_en: 'Family',
          icon: 'users',
          items: [],
        };
      }

      if (targetCat) newConfig.categories.push(targetCat);
    }

    if (targetCat) {
      targetCat.items = [...(targetCat.items || []), item];
    }

    updateConfig(newConfig);
    setAddingWord(null);
  };

  const toggleFavorite = useCallback(
    (itemId: string) => {
      if (!config) return;

      const newConfig = { ...config, favorites: [...(config.favorites || [])] };
      const idx = newConfig.favorites.indexOf(itemId);

      if (idx > -1) {
        newConfig.favorites.splice(idx, 1);
      } else {
        newConfig.favorites.push(itemId);
      }

      updateConfig(newConfig as any);
    },
    [config, updateConfig]
  );

  const displayCategories = useMemo(() => {
    if (!config?.categories) return [];

    return [
      { id: 'cat_fav', label_ur: 'پسندیدہ', label_en: 'Favorite', icon: 'heart' },
      { id: 'khandan', label_ur: 'خاندان', label_en: 'Family', icon: 'users' },
    ];
  }, [config]);

  const searchResults = useFuzzySearch(allItems, searchQuery);

  const handleScroll = useCallback(() => {
    if (!mainContentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = mainContentRef.current;

    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setDisplayLimit((prev) => prev + 24);
    }
  }, []);

  const createPromptItem = useCallback(
    (
      id: string,
      ur: string,
      en: string,
      icon: string,
      payload: Record<string, any>
    ) => ({
      id,
      ur,
      en,
      icon,
      isPrompt: true,
      onClick: () => {
        setAddingWord({
          id: `word_${crypto.randomUUID()}`,
          en: '',
          ur: '',
          roman: '',
          next: [],
          ...payload,
        });
      },
    }),
    []
  );

  const createSearchPrompt = useCallback(async () => {
    const res = await translator.translate(searchQuery);

    setAddingWord({
      id: `word_${crypto.randomUUID()}`,
      en: res?.en || searchQuery,
      ur: res?.ur || '',
      roman: res?.roman || '',
      icon: 'list-plus',
      next: [],
    });
  }, [searchQuery]);

  const getSearchItems = useCallback(() => {
    const results = [...searchResults];
    const exactMatch = results.some(
      (r: any) => r.en.toLowerCase() === searchQuery.toLowerCase() || r.ur === searchQuery
    );

    if (!exactMatch && searchQuery.length > 1) {
      results.push({
        id: 'add_new_prompt',
        ur: 'نیا لفظ؟',
        en: 'Add Word?',
        icon: 'list-plus',
        isPrompt: true,
        onClick: createSearchPrompt,
      });
    }

    return results;
  }, [searchResults, searchQuery, createSearchPrompt]);

  const getHomeItems = useCallback(() => {
    return dbWords.length > 0
      ? [...dbWords].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      : allItems;
  }, [dbWords, allItems]);

  const getFavoriteItems = useCallback(() => {
    const favs = config?.favorites || [];
    const favItems = (dbWords.length > 0 ? dbWords : allItems).filter((i: any) =>
      favs.includes(i.id)
    );

    const addWordItem = createPromptItem(
      'add_fav_prompt',
      'نیا لفظ؟',
      'Add Word?',
      'list-plus',
      {
        icon: 'star',
        categoryId: 'cat_custom',
      }
    );

    return [addWordItem, ...favItems];
  }, [config, dbWords, allItems, createPromptItem]);

  const getCategoryTarget = useCallback(() => {
    if (!currentCategory) return null;

    return currentCategory === 'family'
      ? 'khandan'
      : currentCategory.startsWith('cat_')
      ? currentCategory.substring(4)
      : currentCategory;
  }, [currentCategory]);

  const getCategoryItems = useCallback(() => {
    const targetId = getCategoryTarget();

    const cat = config?.categories?.find(
      (c: any) =>
        c.id === currentCategory ||
        c.id === targetId ||
        (targetId === 'fam' && (c.id === 'khandan' || c.id === 'family')) ||
        (targetId === 'khandan' && c.id === 'family')
    );

    const catIds = (cat?.items || []).map((i: any) => i.id);
    return (dbWords.length > 0 ? dbWords : allItems).filter((i: any) => catIds.includes(i.id));
  }, [config, currentCategory, getCategoryTarget, dbWords, allItems]);

  const getFamilyItems = useCallback(() => {
    const catItems = getCategoryItems();

    const addMemberItem = createPromptItem(
      'add_family_member',
      'نیا ممبر؟',
      'Add Member?',
      'user-plus',
      {
        icon: 'user',
        categoryId: 'khandan',
      }
    );

    return [addMemberItem, ...catItems];
  }, [getCategoryItems, createPromptItem]);

  const getRegularCategoryItems = useCallback(() => {
    const catItems = getCategoryItems();

    const backItem = {
      id: 'back',
      ur: 'واپس',
      en: 'Back',
      icon: 'arrow-left',
      isPrompt: true,
      onClick: () => {
        playClick();
        setCurrentCategory(null);
        setFocusedIndex(-1);
      },
    };

    return [backItem, ...catItems];
  }, [getCategoryItems, playClick]);

  const resolveBaseGridItems = useCallback(() => {
    if (searchQuery) return getSearchItems();
    if (!currentCategory) return getHomeItems();

    const isFavoritesCategory =
      currentCategory === 'cat_fav' ||
      currentCategory === 'fav' ||
      currentCategory === 'favorites';

    if (isFavoritesCategory) return getFavoriteItems();

    const targetId = getCategoryTarget();
    const isFamilyCategory = targetId === 'khandan' || targetId === 'family';

    return isFamilyCategory ? getFamilyItems() : getRegularCategoryItems();
  }, [
    searchQuery,
    currentCategory,
    getSearchItems,
    getHomeItems,
    getFavoriteItems,
    getCategoryTarget,
    getFamilyItems,
    getRegularCategoryItems,
  ]);

  const handleWordItemClick = useCallback(
    async (item: any) => {
      const speakPromise = speak(isUrdu ? item.ur : item.en, item.id);

      if (isSentenceBuilderActive) {
        if (canAddWords) {
          setSentence((prev) => [...prev, item]);
        } else {
          setSentence((prev) => [...prev.slice(0, -1), item]);
          setFlashSentenceBuilder(true);
          setTimeout(() => setFlashSentenceBuilder(false), 500);
        }
      }

      await speakPromise;
      await wordNetwork.recordUsage(item.id);
      refreshWords();
      setFocusedIndex(-1);
    },
    [speak, isUrdu, isSentenceBuilderActive, canAddWords, refreshWords]
  );

  const attachItemClickHandler = useCallback(
    (item: any) => {
      if (item.onClick) return item;
      return { ...item, onClick: () => handleWordItemClick(item) };
    },
    [handleWordItemClick]
  );

  const gridItems = useMemo(() => {
    return resolveBaseGridItems()
      .map(attachItemClickHandler)
      .slice(0, displayLimit);
  }, [resolveBaseGridItems, attachItemClickHandler, displayLimit]);

  const predictions = useMemo(() => {
    const lastWord = sentence.length > 0 ? sentence[sentence.length - 1] : null;
    const nextIds = lastWord?.next || [];

    const results = allItems.filter((i: any) => nextIds.includes(i.id));

    if (results.length < 5) {
      const topWords = [...dbWords].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

      for (const word of topWords) {
        if (results.length >= 10) break;
        if (!results.find((r) => r.id === word.id)) {
          results.push(word);
        }
      }
    }

    return results.slice(0, 10).map((i: any) => ({
      ...i,
      onClick: async () => {
        const speakPromise = speak(isUrdu ? i.ur : i.en, i.id);

        if (isSentenceBuilderActive) {
          if (canAddWords) {
            setSentence((prev) => [...prev, i]);
          } else {
            setSentence((prev) => [...prev.slice(0, -1), i]);
            setFlashSentenceBuilder(true);
            setTimeout(() => setFlashSentenceBuilder(false), 500);
          }
        }

        await speakPromise;
        await wordNetwork.recordUsage(i.id);
        refreshWords();
        setFocusedIndex(-1);
      },
    }));
  }, [sentence, allItems, isUrdu, speak, dbWords, refreshWords, canAddWords, isSentenceBuilderActive]);

  const navigableActions = useMemo(() => {
    const actions: (() => void)[] = [];

    actions.push(toggleTracking);
    actions.push(toggleSentenceBuilder);
    actions.push(() => {
      setSentence([]);
      setCurrentCategory(null);
      setFocusedIndex(-1);
      navigate('#');
      playClick();
    });
    actions.push(() => {
      setLanguage(language === 'ur' ? 'en' : 'ur');
      playClick();
    });
    actions.push(() => {
      navigate('#settings');
      playClick();
    });

    if (route === '#') {
      predictions.forEach((p) => actions.push(p.onClick));
      gridItems.forEach((g: any) => actions.push(g.onClick));

      if (isSentenceBuilderActive) {
        actions.push(() => {
          setSentence((prev) => prev.slice(0, -1));
          playClick();
        });
        actions.push(() => {
          setSentence([]);
          playClick();
        });
        actions.push(() => {
          playSentence();
        });
      }
    }

    actions.push(() => {
      speak(isUrdu ? 'ہاں' : 'Yes', 'sys_yes');
    });
    actions.push(() => {
      speak(isUrdu ? 'نہیں' : 'No', 'sys_no');
    });
    actions.push(() => {
      playClick();
      navigate('#doodle');
    });

    displayCategories.forEach((cat) => {
      actions.push(() => {
        playClick();
        if (route !== '#') navigate('#');
        setCurrentCategory(cat.id === currentCategory ? null : cat.id);
        setFocusedIndex(-1);
        setSearchQuery('');
      });
    });

    if (route === '#') {
      actions.push(handleNextQuote);
    }

    return actions;
  }, [
    route,
    toggleTracking,
    toggleSentenceBuilder,
    setLanguage,
    language,
    navigate,
    playClick,
    playSentence,
    predictions,
    gridItems,
    displayCategories,
    currentCategory,
    isUrdu,
    handleNextQuote,
    speak,
    isSentenceBuilderActive,
  ]);

  const handleGestureAction = useCallback(
    (action: GestureAction) => {
      setLastGesture(action);

      setTimeout(() => {
        setLastGesture('');
      }, 2000);

      switch (action) {
        case 'SPEAK':
          if (isSentenceBuilderActive) playSentence();
          break;
        case 'DOODLE':
          navigate('#doodle');
          playClick();
          break;
        case 'YES':
          speak(isUrdu ? 'ہاں' : 'Yes', 'ji_haan');
          break;
        case 'SALAM':
          speak(isUrdu ? 'السلام علیکم' : 'Assalamualikum', 'sys_salam');
          break;
        case 'CALL_CONTACT_1':
          if (config?.emergency_contacts?.[0]?.phone) {
            window.location.href = `tel:${config.emergency_contacts[0].phone}`;
          }
          break;
        case 'HOME':
        case 'CLEAR':
          setSentence([]);
          setCurrentCategory(null);
          setFocusedIndex(-1);
          playClick();
          break;
        case 'TOGGLE_RECOGNITION':
          playClick();
          break;
        case 'NEXT':
          setFocusedIndex((prev) => (prev + 1) % navigableActions.length);
          playClick();
          break;
        case 'PREV':
          setFocusedIndex((prev) => (prev <= 0 ? navigableActions.length - 1 : prev - 1));
          playClick();
          break;
        case 'SELECT':
          setFocusedIndex((prev) => {
            if (prev >= 0 && prev < navigableActions.length) {
              navigableActions[prev]();
            }
            return prev;
          });
          break;
      }
    },
    [
      playClick,
      speak,
      isUrdu,
      playSentence,
      config,
      navigableActions,
      isSentenceBuilderActive,
      navigate,
    ]
  );

  useEffect(() => {
    actionHandlerRef.current = handleGestureAction;
  }, [handleGestureAction]);

  if (showSplash || isConfigLoading) {
    return (
      <SplashScreen
        quote={randomQuote || { ur: 'شکراً', en: 'Shukr' }}
        isLoading={isConfigLoading}
      />
    );
  }

  return (
    <div className="app-viewport" dir="rtl">
      {isDraggingPreview && <div className="dragging-backdrop" />}
      <Header
        onOpenSettings={(tab) => navigate('#settings', tab)}
        isTrackingEnabled={effectiveEnabled}
        isRecognitionActive={isRecognitionActive}
        toggleTracking={toggleTracking}
        hasUnsyncedChanges={hasUnsyncedChanges}
        isModelLoaded={isModelLoaded}
        onSOS={() => setShowSOS(true)}
        onHome={() => {
          setSentence([]);
          setCurrentCategory(null);
          navigate('#');
        }}
        isSentenceBuilderActive={isSentenceBuilderActive}
        toggleSentenceBuilder={toggleSentenceBuilder}
        lastGesture={lastGesture}
        isUrdu={isUrdu}
        focusedIndex={focusedIndex}
        showCloseDropzone={isDraggingPreview}
        cameraButtonRef={cameraButtonRef}
      />

      <div
        className="main-content-wrapper"
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {route === '#voices' ? (
          <VoiceStudio config={config} updateConfig={updateConfig} onClose={() => navigate('#settings')} />
        ) : route === '#settings' ? (
          <SettingsPanel
            config={config}
            updateConfig={updateConfig}
            initialTab={initialSettingsTab}
            initialEditingItem={initialEditingItem}
            onOpenVoiceStudio={() => navigate('#voices')}
            onClose={() => {
              setInitialEditingItem(null);
              setInitialSettingsTab(null);
              navigate('#');
            }}
          />
        ) : route === '#doodle' ? (
          <>
            <CameraPreview isEnabled={effectiveEnabled} videoRef={videoRef} onDragChange={setIsDraggingPreview} onDragMove={handlePreviewDragMove} onDrop={handlePreviewDrop} />
            <DoodlePad
              config={config}
              focusedIndex={focusedIndex}
              onRecognize={(item: any) => {
                speak(isUrdu ? item.ur : item.en, item.id);
                if (isSentenceBuilderActive) {
                  setSentence((prev) => [...prev, item]);
                  navigate('#');
                }
                wordNetwork.recordUsage(item.id);
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
                offset={5}
              />
            </div>

            <div className="main-content-area" ref={mainContentRef} onScroll={handleScroll}>
              <WordGrid
                gridItems={gridItems}
                focusedIndex={focusedIndex}
                offset={5 + predictions.length}
                randomQuote={randomQuote}
                quotes={quotes}
                onNextQuote={handleNextQuote}
                updateConfig={updateConfig}
                config={config}
                currentlyPlayingId={currentlyPlayingId}
                quoteFocused={
                  focusedIndex ===
                  5 +
                    predictions.length +
                    gridItems.length +
                    (isSentenceBuilderActive ? 3 : 0) +
                    displayCategories.length +
                    3
                }
                onLongPressItem={(item) => toggleFavorite(item.id)}
                onDeleteItem={async (id) => {
                  if (!config) return;

                  const newConfig: any = {
                    ...config,
                    categories: (config.categories || []).map((cat: any) => ({
                      ...cat,
                      items: (cat.items || []).filter((i: any) => i.id !== id),
                    }))
                  };

                  // Clean up favorites if they exist
                  if (newConfig.favorites) {
                    newConfig.favorites = newConfig.favorites.filter((fid: string) => fid !== id);
                  }

                  updateConfig(newConfig);

                  // Deep deletion from database
                  await universeDb.words.delete(id);
                  await universeDb.sketchTemplates.where('wordId').equals(id).delete();

                  refreshWords();
                }}
                onEditItem={(item) => {
                  setInitialEditingItem({ ...item, type: 'word' });
                  navigate('#settings');
                }}
                favorites={config?.favorites || []}
              />
            </div>

            {isSentenceBuilderActive && (
              <div className="top-system-area" style={{ paddingTop: 0, paddingBottom: 8 }}>
                <SentenceBuilder
                  words={sentence}
                  onClear={() => setSentence([])}
                  onBackspace={() => setSentence((prev) => prev.slice(0, -1))}
                  onPlay={playSentence}
                  focusedIndex={focusedIndex}
                  offset={5 + predictions.length + gridItems.length}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  canAddWords={canAddWords}
                  builderScrollRef={builderScrollRef}
                  flashBorder={flashSentenceBuilder}
                  currentlyPlayingId={currentlyPlayingId}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Footer
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
          if (currentCategory) {
            setCurrentCategory(null);
            setFocusedIndex(-1);
            if (route !== '#') navigate('#');
            return;
          }
          if (route === '#doodle') {
            navigate('#');
          } else {
            navigate('#doodle');
          }
        }}
        onYesClick={() => {
          speak(isUrdu ? 'ہاں' : 'Yes', 'sys_yes');
          triggerYesFlash();
          if (route === '#doodle') navigate('#');
        }}
        onNoClick={() => {
          speak(isUrdu ? 'نہیں' : 'No', 'sys_no');
          triggerNoFlash();
          if (route === '#doodle') navigate('#');
        }}
        focusedIndex={focusedIndex}
        offset={
          route === '#'
            ? 5 + predictions.length + gridItems.length + (isSentenceBuilderActive ? 3 : 0)
            : 5
        }
      />

      <ScreenFlashes showYes={showYesFlash} showNo={showNoFlash} />

      {showSOS && (
        <SOSModal
          onClose={() => setShowSOS(false)}
          emergencyContacts={config?.emergency_contacts || []}
        />
      )}

      <WordAddModal
        addingWord={addingWord}
        setAddingWord={setAddingWord}
        onSave={handleAddCustomWord}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
