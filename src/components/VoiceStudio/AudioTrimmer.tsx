import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getWaveformData } from '../../lib/audioUtils';

interface AudioTrimmerProps {
  audioBuffer: AudioBuffer | null;
  onTrimChange: (start: number, end: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  color?: string;
  playbackProgress?: number; // 0 to 1
}

export const AudioTrimmer: React.FC<AudioTrimmerProps> = ({ 
  audioBuffer, 
  onTrimChange,
  onDragStart,
  onDragEnd,
  color = '#ff3b30',
  playbackProgress = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveData, setWaveData] = useState<number[]>([]);
  
  // Use REFS for ALL drag logic to ensure 0ms latency and no stale closures
  const trimRef = useRef({ start: 0, end: 1 });
  const [displayTrim, setDisplayTrim] = useState({ start: 0, end: 1 });
  const draggingRef = useRef<'start' | 'end' | null>(null);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    if (audioBuffer) {
      const data = getWaveformData(audioBuffer, 100);
      setWaveData(data);
      trimRef.current = { start: 0, end: 1 };
      setDisplayTrim({ start: 0, end: 1 });
      onTrimChange(0, 1);
    }
  }, [audioBuffer, onTrimChange]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / waveData.length) * 0.8;
    const gap = (width / waveData.length) * 0.2;
    let x = 0;

    const { start, end } = trimRef.current;

    for (let i = 0; i < waveData.length; i++) {
      const barHeight = waveData[i] * height * 0.9;
      const yPos = (height - barHeight) / 2;
      const normalizedX = x / width;
      
      if (normalizedX >= start && normalizedX <= end) {
         ctx.fillStyle = color;
      } else {
         ctx.fillStyle = '#e5e5ea';
      }

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, yPos, barWidth, Math.max(2, barHeight), 4);
      } else {
        ctx.rect(x, yPos, barWidth, Math.max(2, barHeight));
      }
      ctx.fill();

      if (playbackProgress > 0 && normalizedX <= playbackProgress && normalizedX >= start && normalizedX <= end) {
         ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
         ctx.fill();
      }

      x += barWidth + gap;
    }
  }, [waveData, color, playbackProgress]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform, displayTrim]);

  // Use raw DOM listeners on window for the most robust dragging possible
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) - dragOffsetRef.current;
      const normalizedX = Math.max(0, Math.min(1, pos / rect.width));

      if (draggingRef.current === 'start') {
        const newStart = Math.min(normalizedX, trimRef.current.end - 0.05);
        trimRef.current.start = newStart;
        setDisplayTrim({ ...trimRef.current });
      } else {
        const newEnd = Math.max(normalizedX, trimRef.current.start + 0.05);
        trimRef.current.end = newEnd;
        setDisplayTrim({ ...trimRef.current });
      }
    };

    const handleUp = () => {
      if (draggingRef.current) {
        onTrimChange(trimRef.current.start, trimRef.current.end);
        draggingRef.current = null;
        onDragEnd?.();
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [onTrimChange, onDragEnd]);

  const handlePointerDown = (type: 'start' | 'end') => (e: React.PointerEvent) => {
    onDragStart?.();
    draggingRef.current = type;
    
    const rect = containerRef.current!.getBoundingClientRect();
    const currentPos = (type === 'start' ? trimRef.current.start : trimRef.current.end) * rect.width;
    const clickPos = e.clientX - rect.left;
    dragOffsetRef.current = clickPos - currentPos;
    
    e.stopPropagation();
    // We don't need setPointerCapture because we use window listeners
  };

  return (
    <div 
        ref={containerRef}
        className="audio-trimmer-container"
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%', 
          cursor: 'ew-resize',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          boxSizing: 'border-box'
        }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', touchAction: 'none', display: 'block' }}
          />
          
          {/* Start Handle */}
          <div 
            className="trim-handle start-handle"
            style={{ left: `${displayTrim.start * 100}%`, touchAction: 'none' }}
            onPointerDown={handlePointerDown('start')}
          >
            <div className="handle-line" />
          </div>

          {/* End Handle */}
          <div 
            className="trim-handle end-handle"
            style={{ left: `${displayTrim.end * 100}%`, touchAction: 'none' }}
            onPointerDown={handlePointerDown('end')}
          >
            <div className="handle-line" />
          </div>
      </div>
    </div>
  );
};
