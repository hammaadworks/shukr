import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAudio } from '../../hooks/useAudio';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';
import { recognitionEngine } from '../../recognition/engine';
import { predictionsEngine } from '../../lib/predictionsEngine';
import type { Stroke, Point as StrokePoint } from '../../recognition/sketchTypes';

import { DoodleCanvas } from './DoodleCanvas';
import { WordPredictions } from '../WordPredictions';
import { DoodleToolbar } from './DoodleToolbar';
import { TrainDoodleModal } from './modals/TrainDoodleModal';
import { CustomKeyboard } from './CustomKeyboard';

interface DoodlePadProps {
  config: any;
  onRecognize: (item: any) => void;
  focusedIndex: number;
  onOpenAddWord?: (initial?: string) => void;
  sentence: any[];
}

export const DoodlePad: React.FC<DoodlePadProps> = ({ config, onRecognize, focusedIndex, onOpenAddWord, sentence }) => {
  const { isPrimary, language } = useLanguage();
  const { playClick, speak } = useAudio();
  
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [contextPredictions, setContextPredictions] = useState<any[]>([]);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const allWords = useMemo(() => {
    if (!config?.categories) return [];
    // Flatten all items from all categories
    return config.categories.flatMap((c: any) => c.items || []);
  }, [config]);

  useEffect(() => {
    const updateContextPredictions = async () => {
      if (allWords.length === 0) return;
      const ranked = await predictionsEngine.rankPredictions(allWords, sentence);
      setContextPredictions(ranked.slice(0, 10));
    };
    updateContextPredictions();
  }, [sentence, allWords]);

  const searchResults = useFuzzySearch(allWords, searchQuery);

  // Ensure predictions are always populated
  const displayedPredictions = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      if (searchResults.length === 0) {
        const labels: Record<string, string> = {
          ur: 'نیا لفظ؟',
          en: 'Add Word?',
          es: '¿Añadir palabra?',
          ar: 'إضافة كلمة؟'
        };
        const addLabel = labels[language] || labels['en'];
        return [{ 
          id: 'doodle_add_prompt', 
          ur: addLabel, 
          en: 'Add Word?', 
          translations: labels,
          icon: 'plus', 
          isPrompt: true, 
          onClick: () => onOpenAddWord?.(searchQuery)
        }];
      }
      return (searchResults as any[]).slice(0, 10);
    }

    const results = [...predictions];
    
    // Add contextually ranked predictions
    for (const word of contextPredictions) {
      if (results.length >= 10) break;
      if (!results.find(r => r.id === word.id)) {
        results.push(word);
      }
    }

    // fallback to all words if still empty
    if (results.length < 5) {
        const remaining = allWords.filter((w: any) => !results.find(r => r.id === w.id));
        results.push(...remaining.slice(0, 10 - results.length));
    }

    return results.slice(0, 10);
  }, [predictions, searchQuery, searchResults, allWords, language, onOpenAddWord, contextPredictions]);

  useEffect(() => {
    recognitionEngine.init(config);
  }, [config]);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLCanvasElement;
    const rect = target.getBoundingClientRect();
    
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPoints([{ x, y, t: Date.now() }]);
  }, []);

  const moveDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const target = e.currentTarget as HTMLCanvasElement;
    const rect = target.getBoundingClientRect();
    
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    setCurrentPoints(prev => [...prev, { x, y, t: Date.now() }]);
  }, [isDrawing]);

  const stopDrawing = useCallback(async () => {
    setIsDrawing(false);
    
    setCurrentPoints(prevPoints => {
      if (prevPoints.length === 0) return [];
      
      setCurrentStrokes(prevStrokes => {
        const newStrokes = [...prevStrokes, prevPoints];
        
        (async () => {
          const results = await recognitionEngine.recognize(newStrokes, 'auto', config);
          setPredictions(results);
        })();
        
        return newStrokes;
      });
      
      return [];
    });
  }, [config]);

  const clearCanvas = useCallback(() => {
    setCurrentStrokes([]);
    setCurrentPoints([]);
    setPredictions([]);
    setSearchQuery('');
    playClick();
  }, [playClick]);

  const handleTrainSave = async (label: string, en: string, ur: string) => {
    if (currentStrokes.length === 0) return;
    await recognitionEngine.train(label, en, ur, currentStrokes, 'auto');
    setShowTrainModal(false);
    clearCanvas();
  };

  return (
    <div className="doodle-page-container">
      <div className="mobile-drawing-container">
        {/* Predictions Area */}
        <div className="doodle-predictions-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px 4px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', opacity: 0.6 }}>
             <span>{isPrimary ? 'تجاویز' : 'Suggestions'}</span>
             <span>{searchQuery ? (isPrimary ? 'تلاش' : 'Searching') : (predictions.length > 0 ? (isPrimary ? 'ڈرائنگ' : 'Drawing') : (isPrimary ? 'مشہور' : 'Popular'))}</span>
          </div>
          <WordPredictions 
            predictions={displayedPredictions} 
            onSelect={(item) => {
              if (item.isPrompt && item.onClick) {
                item.onClick();
                return;
              }
              onRecognize(item);
              if (searchQuery) setSearchQuery('');
              clearCanvas();
            }} 
            focusedIndex={focusedIndex}
            offset={0}
            className="doodle-predictions-bar"
          />
        </div>

        {/* Search Bar */}
        <div className="doodle-search-wrap">
          <div className="doodle-search-inner" onClick={() => setIsKeyboardVisible(true)}>
            <button className="doodle-search-icon-btn" onClick={(e) => { e.stopPropagation(); setIsKeyboardVisible(!isKeyboardVisible); }} title="Search">
              <Search size={18} />
            </button>
            <input 
              type="text" 
              placeholder={isPrimary ? "لفظ تلاش کریں..." : "Search for a word..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => { e.target.blur(); setIsKeyboardVisible(true); }}
              inputMode="none"
              readOnly
              className="doodle-search-input"
            />
            <div className="doodle-search-actions">
              {searchQuery && (
                <button className="doodle-search-clear" onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}>
                  <X size={16} />
                </button>
              )}
              <button 
                className="doodle-search-add" 
                onClick={(e) => { e.stopPropagation(); onOpenAddWord?.(searchQuery); }}
                title={isPrimary ? "نیا لفظ شامل کریں" : "Add New Word"}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Area: Keyboard or Canvas */}
        {isKeyboardVisible ? (
          <CustomKeyboard 
            onKeyPress={(key) => setSearchQuery(prev => prev + key)}
            onBackspace={() => setSearchQuery(prev => prev.slice(0, -1))}
            onClose={() => setIsKeyboardVisible(false)}
          />
        ) : (
          <>
            {/* Canvas */}
            <DoodleCanvas 
              strokes={currentStrokes} 
              activeStroke={currentPoints} 
              onStart={startDrawing} 
              onMove={moveDrawing} 
              onEnd={stopDrawing} 
            />

            {/* Toolbar */}
            <DoodleToolbar 
              onClear={clearCanvas} 
              onTrain={() => {
                if (currentStrokes.length === 0) {
                  speak(isPrimary ? "پہلے کچھ ڈرا کریں!" : "Draw something first!");
                  return;
                }
                setShowTrainModal(true);
                playClick();
              }} 
              isPrimary={isPrimary} 
            />
          </>
        )}
      </div>

      {showTrainModal && (
        <TrainDoodleModal 
          config={config}
          onSave={handleTrainSave}
          onCancel={() => setShowTrainModal(false)}
        />
      )}
    </div>
  );
};
