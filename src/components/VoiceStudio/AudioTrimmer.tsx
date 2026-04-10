import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getWaveformData } from '../../lib/audioUtils';

interface AudioTrimmerProps {
  audioBuffer: AudioBuffer | null;
  onTrimChange: (start: number, end: number) => void;
  color?: string;
  playbackProgress?: number; // 0 to 1
}

export const AudioTrimmer: React.FC<AudioTrimmerProps> = ({ 
  audioBuffer, 
  onTrimChange,
  color = '#ff3b30',
  playbackProgress = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveData, setWaveData] = useState<number[]>([]);
  const [trimStart, setTrimStart] = useState(0); // 0 to 1
  const [trimEnd, setTrimEnd] = useState(1); // 0 to 1
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (audioBuffer) {
      const data = getWaveformData(audioBuffer, 100);
      setWaveData(data);
      setTrimStart(0);
      setTrimEnd(1);
    }
  }, [audioBuffer]);

  useEffect(() => {
    onTrimChange(trimStart, trimEnd);
  }, [trimStart, trimEnd, onTrimChange]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / waveData.length) * 0.8;
    const gap = (width / waveData.length) * 0.2;
    let x = 0;

    for (let i = 0; i < waveData.length; i++) {
      const barHeight = waveData[i] * height * 0.9;
      const yPos = (height - barHeight) / 2;
      
      const normalizedX = x / width;
      
      // Determine if bar is within trim selection
      if (normalizedX >= trimStart && normalizedX <= trimEnd) {
         ctx.fillStyle = color;
      } else {
         ctx.fillStyle = '#e5e5ea'; // Disabled color
      }

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, yPos, barWidth, Math.max(2, barHeight), 4);
      } else {
        ctx.rect(x, yPos, barWidth, Math.max(2, barHeight));
      }
      ctx.fill();

      // Playback progress indicator
      if (playbackProgress > 0 && normalizedX <= playbackProgress && normalizedX >= trimStart && normalizedX <= trimEnd) {
         ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
         ctx.fill();
      }

      x += barWidth + gap;
    }
  }, [waveData, trimStart, trimEnd, color, playbackProgress]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Drag logic
  const handlePointerDown = (type: 'start' | 'end') => (e: React.PointerEvent) => {
    setIsDragging(type);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let normalizedX = (e.clientX - rect.left) / rect.width;
    normalizedX = Math.max(0, Math.min(1, normalizedX));

    if (isDragging === 'start') {
      setTrimStart(Math.min(normalizedX, trimEnd - 0.05)); // Minimum 5% gap
    } else {
      setTrimEnd(Math.max(normalizedX, trimStart + 0.05));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div 
        ref={containerRef}
        className="audio-trimmer-container"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ position: 'relative', width: '100%', height: '100px', cursor: isDragging ? 'ew-resize' : 'default' }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Start Handle */}
      <div 
        className="trim-handle start-handle"
        style={{ left: `${trimStart * 100}%` }}
        onPointerDown={handlePointerDown('start')}
      >
        <div className="handle-line" />
      </div>

      {/* End Handle */}
      <div 
        className="trim-handle end-handle"
        style={{ left: `${trimEnd * 100}%` }}
        onPointerDown={handlePointerDown('end')}
      >
        <div className="handle-line" />
      </div>
    </div>
  );
};
