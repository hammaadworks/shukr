import { useState, useCallback, useRef, useEffect } from 'react';

export type MicPermissionStatus = 'prompt' | 'granted' | 'denied' | 'requesting';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [lastRecordedBlob, setLastRecordedBlob] = useState<Blob | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<MicPermissionStatus>('prompt');
  const [showPermissionExplanation, setShowPermissionExplanation] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Check initial permission status
  useEffect(() => {
    if (navigator.permissions && (navigator.permissions as any).query) {
      navigator.permissions.query({ name: 'microphone' as any }).then((result) => {
        setPermissionStatus(result.state as MicPermissionStatus);
        result.onchange = () => {
          setPermissionStatus(result.state as MicPermissionStatus);
        };
      }).catch(e => console.warn('[useVoiceRecording] Permissions API not supported or failed', e));
    }
  }, []);

  const requestPermission = async () => {
    setPermissionStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // Just a probe
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      console.error('[useVoiceRecording] Permission denied:', err);
      setPermissionStatus('denied');
      return false;
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = useCallback(async () => {
    try {
      // 1. Balanced Audio Constraints: Standardize for crystal clear voice without aggressive filtering distortion
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Remove strict sampleRate to let hardware decide the most stable path
        } 
      });
      
      streamRef.current = stream;

      // 2. Setup Analyser for Waveform (ensuring context is active)
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      // 3. Setup Recorder with high quality bitrate and supported MIME type
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // High quality 128kbps
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setLastRecordedBlob(blob);
        
        // Clean up immediately to release hardware
        stream.getTracks().forEach(track => track.stop());
        if (audioCtx.state !== 'closed') {
          audioCtx.close();
        }
      };

      mediaRecorder.start();
      setAnalyser(analyser);
      setIsRecording(true);
      setLastRecordedBlob(null);
    } catch (err) {
      console.error('[VoiceRecording] Failed to start recording:', err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Small delay before stopping can help prevent truncation on some mobile browsers
      setTimeout(() => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
        }
      }, 200);
    }
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    lastRecordedBlob,
    analyser,
    permissionStatus,
    requestPermission,
    showPermissionExplanation,
    setShowPermissionExplanation,
    clearLastBlob: () => setLastRecordedBlob(null)
  };
};
