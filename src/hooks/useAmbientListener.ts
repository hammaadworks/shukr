import { useState, useEffect, useCallback, useRef } from 'react';
import { findMatchingTrigger } from '../lib/contextualTriggers';

/**
 * Hook for Ambient Contextual Listening
 * Uses Web Speech API to listen for prompts and suggest responses.
 */
export const useAmbientListener = (
  appLanguage: 'ur' | 'en',
  onSuggestionsFound: (wordIds: string[]) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  /**
   * Process recognized text to find contextual triggers.
   */
  const processTranscript = useCallback((transcript: string) => {
    console.log('[AmbientListener] Heard:', transcript);
    const trigger = findMatchingTrigger(transcript);
    
    if (trigger) {
      console.log('[AmbientListener] Trigger Match Found:', trigger.suggest);
      onSuggestionsFound(trigger.suggest);
    }
  }, [onSuggestionsFound]);

  /**
   * Initializes the SpeechRecognition object.
   */
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setTimeout(() => setError('Speech Recognition not supported in this browser.'), 0);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    
    // Set language dynamically
    recognition.lang = appLanguage === 'ur' ? 'ur-PK' : 'en-US'; 

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      processTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('[AmbientListener] Error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied.');
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we're still supposed to be listening
      if (isListening && recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    return recognition;
  }, [isListening]);

  /**
   * Toggles the listening state.
   */
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError(null);
      if (!recognitionRef.current) {
        recognitionRef.current = initSpeechRecognition();
      }
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Restart when language changes
  useEffect(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = initSpeechRecognition();
      recognitionRef.current?.start();
    }
  }, [appLanguage, isListening, initSpeechRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    error,
    toggleListening
  };
};
