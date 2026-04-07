import { useCallback, useRef } from 'react';
import { useLanguage } from './useLanguage';
import { useAppConfig } from './useAppConfig';
import { audioStorage } from '../lib/audioStorage';

export const useAudio = () => {
  const { language } = useLanguage();
  const { config } = useAppConfig();
  const activeVoiceProfile = config?.activeVoiceProfile || 'default';
  const sosOscillatorRef = useRef<OscillatorNode | null>(null);
  const sosGainRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClick = useCallback(() => {
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
    if (sosOscillatorRef.current) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Very gentle, spiritual pulsing tone (Warm resonant frequencies)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4 - Warm tone
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    const now = audioCtx.currentTime;
    for (let i = 0; i < 100; i++) {
      // Gentle fade in/out pulses every 1.5 seconds
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

  const speak = useCallback(async (text: string, id?: string) => {
    if (!text) return;
    if (id) {
      const recordedBlob = await audioStorage.get(`${activeVoiceProfile}_${id}`);
      if (recordedBlob) {
        const url = URL.createObjectURL(recordedBlob);
        const audio = new Audio(url);
        audio.play();
        return;
      }
    }
    const audio = new Audio(`/audio/${language}/${id || text.toLowerCase()}.mp3`);
    audio.play().catch(() => {});
  }, [language, activeVoiceProfile]);

  const speakSequence = useCallback(async (words: any[]) => {
    for (const word of words) {
      await speak(word.en, word.id);
      await new Promise(r => setTimeout(r, 100));
    }
  }, [speak]);

  return { speak, speakSequence, playClick, toggleFlashlight, playSOS, stopSOS };
};
