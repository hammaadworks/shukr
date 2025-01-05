import { useEffect, useRef, useState, useCallback } from 'react';
import { type GestureAction, FIXED_GESTURE_MAP } from '../recognition/gestures/types';
import { GestureModelLoader } from '../recognition/gestures/modelLoader';
import { HandGestureRecognizer } from '../recognition/gestures/HandGestureRecognizer';
import { FaceGestureRecognizer } from '../recognition/gestures/FaceGestureRecognizer';

/**
 * High-Performance, Memory-Safe Camera Gesture Hook
 * Optimized for Mobile Browsers:
 * 1. Background Pausing (Visibility API)
 * 2. CPU Throttling (20 FPS)
 * 3. WASM Memory Isolation
 */
export const useCameraGestures = (onAction: (action: GestureAction) => void, forceDisabled: boolean = false) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isRecognitionActive, setIsRecognitionActive] = useState(true);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  const effectiveEnabled = isEnabled && !forceDisabled;
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>(0);
  const lastProcessingTimeRef = useRef<number>(0);
  const lastActionTimeRef = useRef<Record<string, number>>({});
  const isComponentMounted = useRef<boolean>(true);
  
  // Stabilization Buffer
  const gestureBufferRef = useRef<string[]>([]);
  const STABILIZATION_THRESHOLD = 4; // Frames needed to confirm a gesture

  // Configuration - Targeted for mobile performance
  const FRAME_THROTTLE = 1000 / 20; // 20 FPS is the "sweet spot"
  const ACTION_COOLDOWN = 1200; 
  const TOGGLE_COOLDOWN = 2000;

  // Stable reference for the prediction function
  const predictRef = useRef<() => void>(() => {});

  // 1. Initial Model Setup
  useEffect(() => {
    isComponentMounted.current = true;
    const loader = GestureModelLoader.getInstance();
    
    loader.loadModels()
      .then(() => {
        if (isComponentMounted.current) setIsModelLoaded(true);
      })
      .catch(err => console.error('[useCameraGestures] Model load failed:', err));

    return () => { isComponentMounted.current = false; };
  }, []);

  // 2. Gesture Dispatcher - Stabilized with useCallback
  const handleDetectedGesture = useCallback((gestureKey: string | null) => {
    // Fill buffer
    const buffer = gestureBufferRef.current;
    buffer.push(gestureKey || 'none');
    if (buffer.length > STABILIZATION_THRESHOLD) buffer.shift();

    // Check for stability
    const mostFrequent = buffer.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stableGesture = Object.keys(mostFrequent).find(k => mostFrequent[k] >= STABILIZATION_THRESHOLD);
    
    if (!stableGesture || stableGesture === 'none') return;

    const action = FIXED_GESTURE_MAP[stableGesture];
    if (!action) return;

    const now = Date.now();
    if (action === 'TOGGLE_RECOGNITION') {
      if (now - (lastActionTimeRef.current[action] || 0) > TOGGLE_COOLDOWN) {
        lastActionTimeRef.current[action] = now;
        setIsRecognitionActive(prev => !prev);
        onAction(action);
      }
      return;
    }

    if (!isRecognitionActive) return;

    if (now - (lastActionTimeRef.current[action] || 0) > ACTION_COOLDOWN) {
      lastActionTimeRef.current[action] = now;
      onAction(action);
    }
  }, [isRecognitionActive, onAction]);

  // 3. Optimized Prediction Loop - Stable loop assignment
  useEffect(() => {
    predictRef.current = () => {
      if (!effectiveEnabled || !isModelLoaded || !videoRef.current || !isComponentMounted.current) return;

      // Save battery when tab is hidden
      if (document.visibilityState === 'hidden') {
        requestRef.current = requestAnimationFrame(() => predictRef.current());
        return;
      }

      // Defensive check for video playback state
      if (videoRef.current.readyState < 2 || videoRef.current.paused) {
        requestRef.current = requestAnimationFrame(() => predictRef.current());
        return;
      }

      // CPU Throttling
      const now = performance.now();
      if (now - lastProcessingTimeRef.current < FRAME_THROTTLE) {
        requestRef.current = requestAnimationFrame(() => predictRef.current());
        return;
      }
      lastProcessingTimeRef.current = now;

      try {
        const { face, hand, isLoaded } = GestureModelLoader.getInstance().getModels();
        if (!isLoaded || !face || !hand) {
           requestRef.current = requestAnimationFrame(() => predictRef.current());
           return;
        }

        const timestamp = performance.now();

        // Detection
        const handResults = hand.detectForVideo(videoRef.current, timestamp);
        const handGestureKey = HandGestureRecognizer.detectGesture(handResults);
        
        // Pass to stabilization handler (even if null to clear buffer)
        handleDetectedGesture(handGestureKey);

        // Only run face detection if recognition is active (Saves CPU)
        if (isRecognitionActive) {
          const faceResults = face.detectForVideo(videoRef.current, timestamp);
          const faceGestureKey = FaceGestureRecognizer.detectGesture(faceResults);
          if (faceGestureKey) handleDetectedGesture(faceGestureKey);
        }
      } catch (error) {
        // Catch transient MediaPipe errors without breaking the entire loop
        console.warn('[useCameraGestures] Loop recovery:', error);
      }
      
      requestRef.current = requestAnimationFrame(() => predictRef.current());
    };
  }, [effectiveEnabled, isModelLoaded, isRecognitionActive, handleDetectedGesture]);

  // 4. Camera Stream Lifecycle (Robust & Cleanup-safe)
  useEffect(() => {
    if (!effectiveEnabled || !isModelLoaded) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const startCamera = async () => {
      try {
        // Constraints optimized for mobile (Lower res = higher speed/lower heat)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            frameRate: { ideal: 30 } 
          } 
        });
        
        if (!isComponentMounted.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          
          const handleMetadata = async () => {
            try {
              if (videoRef.current && isComponentMounted.current) {
                await videoRef.current.play();
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
                requestRef.current = requestAnimationFrame(() => predictRef.current());
              }
            } catch (err) {
              console.error('[useCameraGestures] Video play failed:', err);
            }
          };

          videoRef.current.addEventListener('loadedmetadata', handleMetadata, { once: true });
        }
      } catch (err) {
        console.error('[useCameraGestures] Camera stream failed:', err);
        if (isComponentMounted.current) setIsEnabled(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
      }
    };
  }, [effectiveEnabled, isModelLoaded, handleDetectedGesture]);

  return { 
    isEnabled, 
    effectiveEnabled,
    isRecognitionActive,
    toggleTracking: () => setIsEnabled(!isEnabled), 
    videoRef, 
    isModelLoaded 
  };
};
