import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAudio } from '../../hooks/useAudio';
import { recognitionEngine } from '../../recognition/engine';
import type { SketchRecognitionMode, Stroke, StrokePoint } from '../../recognition/db';

import { DoodleCanvas } from './DoodleCanvas';
import { DoodlePredictions } from './DoodlePredictions';
import { DoodleToolbar } from './DoodleToolbar';
import { TrainDoodleModal } from './modals/TrainDoodleModal';

interface DoodlePadProps {
  config: any;
  onRecognize: (item: any) => void;
}

export const DoodlePad: React.FC<DoodlePadProps> = ({ config, onRecognize }) => {
  const { isUrdu } = useLanguage();
  const { playClick, speak } = useAudio();
  
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showTrainModal, setShowTrainModal] = useState(false);

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
    // Check if isDrawing from state - this is fine as isDrawing is stable once drawing starts
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
        
        // Use a separate async block to handle recognition to not block state updates
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
        {/* Predictions */}
        <DoodlePredictions 
          predictions={predictions} 
          onSelect={onRecognize} 
          isUrdu={isUrdu} 
          speak={speak} 
        />

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
              speak(isUrdu ? "پہلے کچھ ڈرا کریں!" : "Draw something first!");
              return;
            }
            setShowTrainModal(true);
            playClick();
          }} 
          isUrdu={isUrdu} 
        />
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
