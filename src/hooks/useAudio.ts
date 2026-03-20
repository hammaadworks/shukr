import { useCallback, useRef, useState, useEffect } from 'react';
import { useLanguage } from './useLanguage';
import { useAppConfig } from './useAppConfig';
import { universeDb } from '../lib/universeDb';
import { generateAudioStorageKey } from '../lib/constants';

// Singleton-like state to track what's playing across the whole app
let globalPlayingId: string | null = null;
const listeners = new Set<(id: string | null) => void>();

const setGlobalPlayingId = (id: string | null) => {
  globalPlayingId = id;
  listeners.forEach(l => l(id));
};

export const useAudio = () => {
  const { language, primaryLanguage } = useLanguage();
  const { config } = useAppConfig();
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(globalPlayingId);

  useEffect(() => {
    const handler = (id: string | null) => setCurrentlyPlayingId(id);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const activeVoice = config?.active_voice || 'default';
  const sosOscillatorRef = useRef<OscillatorNode | null>(null);
  const sosGainRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClick = useCallback(() => {
    if (!config?.preferences?.enable_click_sound) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error('Audio click error:', e);
    }
  }, [config?.preferences?.enable_click_sound]);

  const playSOS = useCallback(() => {
    if (sosOscillatorRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    audioCtxRef.current = audioCtx;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4 - Warm tone
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    const now = audioCtx.currentTime;
    for (let i = 0; i < 100; i++) {
      gainNode.gain.linearRampToValueAtTime(0.2, now + i * 1.5 + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, now + i * 1.5 + 1.2);
    }

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    sosOscillatorRef.current = oscillator;
    sosGainRef.current = gainNode;
  }, []);

  const stopSOS = useCallback(() => {
    if (sosOscillatorRef.current) {
      try {
        sosOscillatorRef.current.stop();
      } catch(e) {
        // ignore
      }
      sosOscillatorRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const toggleFlashlight = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: true } as any] });
        setTimeout(() => track.stop(), 5000); 
      }
    } catch (e) {
      console.warn('Flashlight not supported');
    }
  }, []);

  const speak = useCallback((text: string, wordId?: string) => {
    return new Promise<void>((resolve) => {
      const executeSpeak = async () => {
        if (!text) return resolve();
        
        let audioInstance: HTMLAudioElement | null = null;
        let objectUrl: string | null = null;

        const handleAudioEnd = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          if (wordId && globalPlayingId === wordId) setGlobalPlayingId(null);
          resolve();
        };

        const tryFallbackTTS = () => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language === 'ur' ? 'ur-PK' : (language === 'es' ? 'es-ES' : (language === 'ar' ? 'ar-SA' : 'en-US'));
          utterance.onend = handleAudioEnd;
          utterance.onerror = handleAudioEnd;
          window.speechSynthesis.speak(utterance);
        };

        try {
          if (wordId) {
            setGlobalPlayingId(wordId);
            
            let vNumericId: number | undefined;
            
            if (wordId.startsWith('gesture_')) {
              vNumericId = 0; // System reserved
            } else {
              // Resolve slug to numericId
              const voice = await universeDb.voices.where({ id: activeVoice }).first();
              vNumericId = voice?.numericId;
            }
            
            let recordedBlob: Blob | undefined;
            if (vNumericId !== undefined) {
                // Search by native compound primary key [voiceNumericId, wordId]
                const record = await universeDb.audio.get([vNumericId, wordId]);
                recordedBlob = record?.blob;
            }
            
            if (recordedBlob) {
              objectUrl = URL.createObjectURL(recordedBlob);
              audioInstance = new Audio(objectUrl);
            } else {
              // Try to find in ingested audio (src/lib/data/audio)
              try {
                const audioRecordCacheKey = generateAudioStorageKey(wordId, activeVoice);
                const ingestedModules = import.meta.glob('../lib/data/audio/*.wav', { eager: false });
                const matchingPath = `../lib/data/audio/${audioRecordCacheKey}.wav`;
                
                if (ingestedModules[matchingPath]) {
                  const mod = await ingestedModules[matchingPath]() as any;
                  audioInstance = new Audio(mod.default);
                }
              } catch (err) {
                // Silently fail and proceed to public fallback
              }
            }
          }

          if (!audioInstance) {
            // Check public folder fallback
            const fallbackPath = `/audio/${language}/${wordId || text.toLowerCase()}.mp3`;
            audioInstance = new Audio(fallbackPath);
          }

          audioInstance.onended = handleAudioEnd;
          audioInstance.onerror = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            tryFallbackTTS();
          };

          await audioInstance.play();
        } catch (e) {
          console.warn('[useAudio] Playback failed:', e);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          tryFallbackTTS();
        }
      };
      
      executeSpeak();
    });
  }, [language, activeVoice]);

  const speakSequence = useCallback(async (words: any[]) => {
    for (const word of words) {
      const isPrimary = language === primaryLanguage;
      const text = isPrimary ? (word.text_primary || word.ur) : (word.text_secondary || word.en);
      await speak(text, word.id);
      await new Promise(r => setTimeout(r, 150));
    }
  }, [speak, language, primaryLanguage]);

  return { speak, speakSequence, playClick, toggleFlashlight, playSOS, stopSOS, currentlyPlayingId };
};
