import React, { useRef, useLayoutEffect, useEffect, useCallback, memo } from 'react';
import { getStroke } from 'perfect-freehand';
import type { Stroke, Point as StrokePoint } from '../../recognition/sketchTypes';

interface DoodleCanvasProps {
  strokes: Stroke[];
  activeStroke: StrokePoint[];
  onStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onEnd: () => void;
}

export const DoodleCanvas = memo(({
  strokes,
  activeStroke,
  onStart,
  onMove,
  onEnd,
}: DoodleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  const drawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set drawing style
    ctx.fillStyle = '#2D5A27'; 
    
    const allStrokes = [...strokes];
    if (activeStroke && activeStroke.length > 0) {
      allStrokes.push(activeStroke);
    }

    allStrokes.forEach(stroke => {
      if (stroke.length === 0) return;
      
      const points = stroke.map(p => [p.x * dpr, p.y * dpr]);
      const outlinePoints = getStroke(points as any, {
        size: 8 * dpr,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      });

      if (outlinePoints.length === 0) return;

      ctx.beginPath();
      const [firstX, firstY] = outlinePoints[0];
      ctx.moveTo(firstX, firstY);
      
      for (let i = 1; i < outlinePoints.length; i++) {
        const [x, y] = outlinePoints[i];
        ctx.lineTo(x, y);
      }
      
      ctx.closePath();
      ctx.fill();
    });
  }, [strokes, activeStroke]);

  // Resize canvas to fit container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        
        if (Math.abs(sizeRef.current.width - width) > 1 || Math.abs(sizeRef.current.height - height) > 1) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          sizeRef.current = { width, height };
          drawStrokes(); 
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [drawStrokes]);

  useLayoutEffect(() => {
    drawStrokes();
  }, [drawStrokes]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    onStart(e);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    onMove(e);
  };

  const handleEnd = () => {
    onEnd();
  };

  return (
    <div className="canvas-wrapper doodle-canvas-border" ref={containerRef}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseOut={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
    </div>
  );
});

DoodleCanvas.displayName = 'DoodleCanvas';
