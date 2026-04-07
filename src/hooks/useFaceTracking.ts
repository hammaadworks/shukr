import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export const useFaceTracking = (onBlink: () => void, onMouthOpen: () => void) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastBlinkTimeRef = useRef<number>(0);
  const lastMouthOpenTimeRef = useRef<number>(0);

  useEffect(() => {
    const initModel = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1
        });
        setIsModelLoaded(true);
      } catch (err) {
        console.error('[FaceTracking] Error loading model:', err);
      }
    };
    initModel();
  }, []);

  useEffect(() => {
    if (!isEnabled || !isModelLoaded) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error('[FaceTracking] Error accessing camera:', err);
        setIsEnabled(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isEnabled, isModelLoaded]);

  const toggleTracking = () => {
    setIsEnabled(prev => !prev);
  };

  const predictWebcam = () => {
    if (!videoRef.current || !faceLandmarkerRef.current) return;
    
    const startTimeMs = performance.now();
    if (videoRef.current.currentTime !== 0) {
      const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const blendshapes = results.faceBlendshapes[0].categories;
        
        // Find blendshapes for blink and mouth open
        const eyeBlinkLeft = blendshapes.find(b => b.categoryName === 'eyeBlinkLeft')?.score || 0;
        const eyeBlinkRight = blendshapes.find(b => b.categoryName === 'eyeBlinkRight')?.score || 0;
        const jawOpen = blendshapes.find(b => b.categoryName === 'jawOpen')?.score || 0;

        const BLINK_THRESHOLD = 0.5;
        const MOUTH_OPEN_THRESHOLD = 0.5;
        const COOLDOWN_MS = 1000;

        const now = Date.now();

        // Detect blink (both eyes closed)
        if (eyeBlinkLeft > BLINK_THRESHOLD && eyeBlinkRight > BLINK_THRESHOLD) {
          if (now - lastBlinkTimeRef.current > COOLDOWN_MS) {
            lastBlinkTimeRef.current = now;
            onBlink();
          }
        }

        // Detect mouth open
        if (jawOpen > MOUTH_OPEN_THRESHOLD) {
          if (now - lastMouthOpenTimeRef.current > COOLDOWN_MS) {
            lastMouthOpenTimeRef.current = now;
            onMouthOpen();
          }
        }
      }
    }
    
    if (isEnabled) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  useEffect(() => {
    if (isEnabled && isModelLoaded && videoRef.current) {
      videoRef.current.addEventListener('loadeddata', predictWebcam);
      return () => {
        videoRef.current?.removeEventListener('loadeddata', predictWebcam);
      };
    }
  }, [isEnabled, isModelLoaded]);

  return { isEnabled, toggleTracking, videoRef, isModelLoaded };
};
