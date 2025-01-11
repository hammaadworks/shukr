import { useCallback, useRef, useState, useEffect } from 'react';
import { useLanguage } from './useLanguage';
import { useAppConfig } from './useAppConfig';
import { audioStorage } from '../lib/audioStorage';

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

  const activeVoiceProfile = config?.activeVoiceProfile || 'default';
  const sosOscillatorRef = useRef<OscillatorNode | null>(null);
  const sosGainRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClick = useCallback(() => {
    // ... existing playClick logic ...
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  }, []);

  const playSOS = useCallback(() => {
    // ... existing playSOS logic ...
    if (sosOscillatorRef.current) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    // ... existing stopSOS logic ...
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
    // ... existing toggleFlashlight logic ...
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

  const speak = useCallback((text: string, id?: string) => {
    return new Promise<void>((resolve) => {
      const executeSpeak = async () => {
        if (!text) return resolve();
        
        let audio: HTMLAudioElement | null = null;
        let objectUrl: string | null = null;

        try {
          if (id) {
            setGlobalPlayingId(id);
            const storageKey = `${activeVoiceProfile}_${id}_${language}`;
            const recordedBlob = await audioStorage.get(storageKey);
            
            if (recordedBlob) {
              objectUrl = URL.createObjectURL(recordedBlob);
              audio = new Audio(objectUrl);
            }
          }

          if (!audio) {
            const fallbackPath = `/audio/${language}/${id || text.toLowerCase()}.mp3`;
            audio = new Audio(fallbackPath);
          }

          audio.onended = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            if (id && globalPlayingId === id) setGlobalPlayingId(null);
            resolve();
          };

          audio.onerror = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            // Fallback to Browser TTS
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'ur' ? 'ur-PK' : (language === 'es' ? 'es-ES' : (language === 'ar' ? 'ar-SA' : 'en-US'));
            utterance.onend = () => {
              if (id && globalPlayingId === id) setGlobalPlayingId(null);
              resolve();
            };
            utterance.onerror = () => {
              if (id && globalPlayingId === id) setGlobalPlayingId(null);
              resolve();
            };
            window.speechSynthesis.speak(utterance);
          };

          await audio.play();
        } catch (e) {
          console.warn('[useAudio] Playback failed:', e);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          if (id && globalPlayingId === id) setGlobalPlayingId(null);
          resolve();
        }
      };
      
      executeSpeak();
    });
  }, [language, activeVoiceProfile]);

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
