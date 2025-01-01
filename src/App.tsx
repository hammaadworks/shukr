import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import './styles/app.css';
import {LanguageProvider, useLanguage} from './hooks/useLanguage';
import {useAudio} from './hooks/useAudio';
import {useAppConfig} from './hooks/useAppConfig';
import {useCameraGestures} from './hooks/useCameraGestures';
import {type GestureAction} from './recognition/gestures/types';
import {useLogger} from './hooks/useLogger';
import {useFuzzySearch} from './hooks/useFuzzySearch';
import {wordNetwork} from './lib/wordNetwork';
import {translator} from './lib/translator';
import {universeDb} from './lib/universeDb';

// Lucide Icons

// Extracted Components
import {SplashScreen} from './components/SplashScreen';
import {Header} from './components/Header';
import {WordPredictions} from './components/WordPredictions';
import {WordGrid} from './components/WordGrid';
import {SentenceBuilder} from './components/SentenceBuilder';
import {Footer} from './components/Footer';
import {SOSModal} from './components/SOSModal';
import {SettingsPanel} from './components/SettingsPanel';
import {VoiceStudio} from './components/VoiceStudio/VoiceStudio';
import {DoodlePad} from './components/Doodle/DoodlePad';
import {CameraPreview} from './components/CameraPreview';
import {ScreenFlashes} from './components/ScreenFlashes';
import {WordAddModal} from './components/WordAddModal';

const AppContent = () => {
    const {language, isUrdu, setLanguage} = useLanguage();
    const {speak, speakSequence, playClick} = useAudio();
    const {logEvent} = useLogger();
    const {config, updateConfig, isLoading: isConfigLoading} = useAppConfig();

    useEffect(() => {
        (window as any)._showSOS = () => setShowSOS(true);
    }, []);

    const actionHandlerRef = useRef<(action: any) => void>(() => {
    });

    const {isEnabled, isRecognitionActive, toggleTracking, videoRef, isModelLoaded} = useCameraGestures((action) => {
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
    const [showCameraPreview, setShowCameraPreview] = useState(true);
    const [showSOS, setShowSOS] = useState(false);
    const [initialEditingItem, setInitialEditingItem] = useState<any>(null);
    const [initialSettingsTab, setInitialSettingsTab] = useState<any>(null);
    const [dbWords, setDbWords] = useState<any[]>([]);
    const [isSentenceBuilderActive, setIsSentenceBuilderActive] = useState(false);
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
    const [showYesFlash, setShowYesFlash] = useState(false);
    const [showNoFlash, setShowNoFlash] = useState(false);

    const triggerYesFlash = useCallback(() => {
        setShowYesFlash(true);
        setTimeout(() => setShowYesFlash(false), 800);
    }, []);

    const triggerNoFlash = useCallback(() => {
        setShowNoFlash(true);
        setTimeout(() => setShowNoFlash(false), 800);
    }, []);

    // Default Emergency Contacts & Favorites if none exist
    useEffect(() => {
        if (config) {
            const updates: any = {};
            let needsUpdate = false;

            if (!config.emergency_contacts || config.emergency_contacts.length < 3) {
                updates.emergency_contacts = [{name: 'مسعود (Masood)', phone: '9513631315'}, {
                    name: 'حماد (Hammaad)',
                    phone: '9663527755'
                }, {name: 'Emergency', phone: '112'}];
                needsUpdate = true;
            }

            if (!config.favorites) {
                updates.favorites = [];
                needsUpdate = true;
            }

            if (needsUpdate) {
                updateConfig({...config, ...updates});
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

    const toggleSentenceBuilder = useCallback(() => {
        setIsSentenceBuilderActive(prev => !prev);
        setFocusedIndex(-1);
    }, []);

    const handleNextQuote = useCallback(() => {
        if (quotes.length === 0) return;
        const currentIndex = quotes.findIndex((q: any) => q.en === randomQuote?.en);
        const nextIndex = (currentIndex + 1) % quotes.length;
        setRandomQuote(quotes[nextIndex]);
        logEvent('quote_action', {type: 'next_quote', index: nextIndex});
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
        logEvent('speech_action', {type: 'sentence_builder'});
        setTimeout(() => {
            setSentence([]);
            setCurrentCategory(null);
            setSearchQuery('');
        }, 3000);
    }, [sentence, speakSequence, logEvent]);

    const allItems = useMemo(() => {
        if (!config?.categories) return [];
        return config.categories.flatMap((c: any) => c.items || []);
    }, [config]);

    const handleAddCustomWord = async (item: any) => {
        if (!config || !config.categories) return;
        const newConfig = {...config, categories: [...config.categories]};
        const targetCatId = item.categoryId || 'cat_custom';

        let targetCat = newConfig.categories.find((c: any) => c.id === targetCatId);
        if (!targetCat) {
            if (targetCatId === 'cat_custom') {
                targetCat = {id: 'cat_custom', label_ur: 'میرے الفاظ', label_en: 'My Words', icon: 'star', items: []};
            } else if (targetCatId === 'khandan') {
                targetCat = {id: 'khandan', label_ur: 'خاندان', label_en: 'Family', icon: 'users', items: []};
            }
            if (targetCat) newConfig.categories.push(targetCat);
        }

        if (targetCat) {
            targetCat.items = [...(targetCat.items || []), item];
        }

        updateConfig(newConfig as any);
        setAddingWord(null);
    };

    const toggleFavorite = useCallback((itemId: string) => {
        if (!config) return;
        const newConfig = {...config, favorites: [...(config.favorites || [])]};
        const idx = newConfig.favorites.indexOf(itemId);
        if (idx > -1) newConfig.favorites.splice(idx, 1); else newConfig.favorites.push(itemId);
        updateConfig(newConfig as any);
    }, [config, updateConfig]);

    const displayCategories = useMemo(() => {
        if (!config?.categories) return [];
        return [{id: 'cat_fav', label_ur: 'پسندیدہ', label_en: 'Favorite', icon: 'heart'}, {
            id: 'khandan',
            label_ur: 'خاندان',
            label_en: 'Family',
            icon: 'users'
        }];
    }, [config]);

    const searchResults = useFuzzySearch(allItems, searchQuery);

    const [displayLimit, setDisplayLimit] = useState(24);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        if (!mainContentRef.current) return;
        const {scrollTop, scrollHeight, clientHeight} = mainContentRef.current;
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
        } else if (currentCategory === 'cat_fav' || currentCategory === 'fav' || currentCategory === 'favorites') {
            const favs = config?.favorites || [];
            const favItems = (dbWords.length > 0 ? dbWords : allItems).filter((i: any) => favs.includes(i.id));
            
            const addWordItem = {
                id: 'add_fav_prompt',
                ur: 'نیا لفظ؟',
                en: 'Add Word?',
                icon: 'list-plus',
                isPrompt: true,
                onClick: () => {
                    setAddingWord({
                        id: `word_${Date.now()}`,
                        en: '',
                        ur: '',
                        roman: '',
                        icon: 'star',
                        next: [],
                        categoryId: 'cat_custom'
                    });
                }
            };
            items = [addWordItem, ...favItems];
        } else {
            const targetId = currentCategory === 'family' ? 'khandan' : currentCategory.startsWith('cat_') ? currentCategory.substring(4) : currentCategory;
            const cat = config?.categories?.find((c: any) => c.id === currentCategory || c.id === targetId || (targetId === 'fam' && (c.id === 'khandan' || c.id === 'family')) || (targetId === 'khandan' && c.id === 'family'));

            const catIds = (cat?.items || []).map((i: any) => i.id);
            const catItems = (dbWords.length > 0 ? dbWords : allItems).filter((i: any) => catIds.includes(i.id));
            
            if (targetId === 'khandan' || targetId === 'family') {
                const addMemberItem = {
                    id: 'add_family_member',
                    ur: 'نیا ممبر؟',
                    en: 'Add Member?',
                    icon: 'user-plus',
                    isPrompt: true,
                    onClick: () => {
                        setAddingWord({
                            id: `word_${Date.now()}`,
                            en: '',
                            ur: '',
                            roman: '',
                            icon: 'user',
                            next: [],
                            categoryId: 'khandan'
                        });
                    }
                };
                items = [addMemberItem, ...catItems];
            } else {
                const backItem = {
                    id: 'back', ur: 'واپس', en: 'Back', icon: 'arrow-left', isPrompt: true, onClick: () => {
                        playClick();
                        setCurrentCategory(null);
                        setFocusedIndex(-1);
                    }
                };
                items = [backItem, ...catItems];
            }
        }

        return items.map((item: any) => {
            if (item.onClick) return item;
            return {
                ...item, onClick: async () => {
                    speak(isUrdu ? item.ur : item.en, item.id);
                    if (isSentenceBuilderActive) {
                        if (canAddWords) {
                            setSentence(prev => [...prev, item]);
                        } else {
                            setSentence(prev => [...prev.slice(0, -1), item]);
                            setFlashSentenceBuilder(true);
                            setTimeout(() => setFlashSentenceBuilder(false), 500);
                        }
                    }
                    await wordNetwork.recordUsage(item.id);
                    refreshWords(); // Dynamically re-sort after usage
                    setFocusedIndex(-1);
                }
            };
        }).slice(0, displayLimit);
    }, [currentCategory, config, isUrdu, speak, playClick, searchQuery, allItems, searchResults, displayLimit, dbWords, canAddWords, refreshWords, isSentenceBuilderActive]);

    const predictions = useMemo(() => {
        const lastWord = sentence.length > 0 ? sentence[sentence.length - 1] : null;
        const nextIds = lastWord?.next || [];

        let results = allItems
            .filter((i: any) => nextIds.includes(i.id));

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
                ...i, onClick: async () => {
                    speak(isUrdu ? i.ur : i.en, i.id);
                    if (isSentenceBuilderActive) {
                        if (canAddWords) {
                            setSentence(prev => [...prev, i]);
                        } else {
                            setSentence(prev => [...prev.slice(0, -1), i]);
                            setFlashSentenceBuilder(true);
                            setTimeout(() => setFlashSentenceBuilder(false), 500);
                        }
                    }
                    await wordNetwork.recordUsage(i.id);
                    refreshWords();
                    setFocusedIndex(-1);
                }
            }));
    }, [sentence, allItems, isUrdu, speak, dbWords, refreshWords, canAddWords, isSentenceBuilderActive]);

    const navigableActions = useMemo(() => {
        const actions: (() => void)[] = [];

        // --- Header Group ---
        // 0: Toggle Camera
        actions.push(toggleTracking);
        // 1: Toggle Sentence Builder
        actions.push(toggleSentenceBuilder);
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
            // Predictions
            predictions.forEach(p => actions.push(p.onClick));

            // Grid Items
            gridItems.forEach((g: any) => actions.push(g.onClick));

            if (isSentenceBuilderActive) {
                // --- Builder Group ---
                // Backspace
                actions.push(() => {
                    setSentence(prev => prev.slice(0, -1));
                    playClick();
                });
                // Clear
                actions.push(() => {
                    setSentence([]);
                    playClick();
                });
                // Play
                actions.push(() => {
                    playSentence();
                });
            }
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
        }); // Yes
        actions.push(() => {
            speak(isUrdu ? 'نہیں' : 'No', 'sys_no');
        }); // No

        if (route === '#') {
            // Quote
            actions.push(handleNextQuote);
        }

        return actions;
    }, [route, toggleTracking, toggleSentenceBuilder, setLanguage, language, navigate, playClick, sentence, playSentence, predictions, gridItems, displayCategories, currentCategory, isUrdu, handleNextQuote, setSentence, setCurrentCategory, setFocusedIndex, setSearchQuery, speak, isSentenceBuilderActive]);

    const handleGestureAction = useCallback((action: GestureAction) => {
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
    }, [playClick, speak, isUrdu, playSentence, config, navigableActions, isSentenceBuilderActive]);
    useEffect(() => {
        actionHandlerRef.current = handleGestureAction;
    }, [handleGestureAction]);

    if (showSplash || isConfigLoading) {
        return <SplashScreen quote={randomQuote || {ur: 'شکراً', en: 'Shukr'}} isLoading={isConfigLoading}/>;
    }

    return (<div className="app-viewport" dir="rtl">
            <Header
                onOpenSettings={(tab) => navigate('#settings', tab)}
                isTrackingEnabled={isEnabled}
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
            />

            <div className="main-content-wrapper"
                 style={{flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                {route === '#voices' ? (<VoiceStudio config={config} updateConfig={updateConfig}
                                                     onClose={() => navigate('#settings')}/>) : route === '#settings' ? (
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
                    />) : route === '#doodle' ? (<>
                        <CameraPreview isEnabled={isEnabled} videoRef={videoRef}/>
                        <DoodlePad
                            config={config}
                            focusedIndex={focusedIndex}
                            onRecognize={(item: any) => {
                                speak(isUrdu ? item.ur : item.en, item.id);
                                if (isSentenceBuilderActive) {
                                    setSentence(prev => [...prev, item]);
                                    navigate('#');
                                }
                                wordNetwork.recordUsage(item.id);
                            }}
                        />
                    </>) : (<>
                        <CameraPreview isEnabled={isEnabled} videoRef={videoRef}/>

                        <div className="top-system-area" style={{ paddingBottom: 0 }}>
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
                                onNextQuote={handleNextQuote}
                                quoteFocused={focusedIndex === 5 + predictions.length + gridItems.length + (isSentenceBuilderActive ? 3 : 0) + displayCategories.length + 3}
                                onLongPressItem={(item) => toggleFavorite(item.id)}
                                onEditItem={(item) => {
                                    setEditMode('edit');
                                    setInitialEditingItem({...item, type: 'word'});
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
                                    onBackspace={() => setSentence(prev => prev.slice(0, -1))}
                                    onPlay={playSentence}
                                    focusedIndex={focusedIndex}
                                    offset={5 + predictions.length + gridItems.length}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    canAddWords={canAddWords}
                                    builderScrollRef={builderScrollRef}
                                    flashBorder={flashSentenceBuilder}
                                />
                            </div>
                        )}
                    </>)}
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
                offset={route === '#' ? (5 + predictions.length + gridItems.length + (isSentenceBuilderActive ? 3 : 0)) : 5}
            />

            <ScreenFlashes showYes={showYesFlash} showNo={showNoFlash}/>

            {showSOS && (<SOSModal
                    onClose={() => setShowSOS(false)}
                    emergencyContacts={config?.emergency_contacts || []}
                />)}

            <WordAddModal
                addingWord={addingWord}
                setAddingWord={setAddingWord}
                onSave={handleAddCustomWord}
            />
        </div>);
};

export default function App() {
    return (<LanguageProvider><AppContent/></LanguageProvider>);
}
