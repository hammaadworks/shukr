import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraPreviewProps {
  isEnabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ isEnabled, videoRef }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number, clientY: number) => {
    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      offsetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
      setIsDragging(true);
    }
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (isDragging) {
      // We set the position relative to the initial fixed position (bottom/right)
      // or we can just use fixed top/left once dragging starts.
      // But simpler is to use transform from the origin.
      
      // Let's calculate new X and Y. 
      // To keep it simple across screen resizes, we'll just track raw X/Y after first drag.
      const newX = clientX - offsetRef.current.x;
      const newY = clientY - offsetRef.current.y;
      
      // Boundaries (stay within viewport)
      const maxX = window.innerWidth - (previewRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (previewRef.current?.offsetHeight || 0);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  }, [isDragging]);

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onMouseUp = handleEnd;
    const onTouchEnd = handleEnd;

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove]);

  if (!isEnabled) return null;

  // If x/y are 0, we let CSS handle default position (bottom/right)
  // Once dragging starts, we override with top/left
  const style: React.CSSProperties = isDragging || position.x !== 0 || position.y !== 0 ? {
    position: 'fixed',
    top: position.y,
    left: position.x,
    bottom: 'auto',
    right: 'auto',
    transition: isDragging ? 'none' : 'all 0.3s ease',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none'
  } : {
    cursor: 'grab',
    touchAction: 'none'
  };

  return (
    <div 
      ref={previewRef}
      className={`apple-gesture-preview ${isDragging ? 'dragging' : ''}`}
      style={style}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
    >
      <video ref={videoRef} className="video-preview" playsInline muted />
      <div className="pip-drag-handle">
        <div className="handle-bar" />
      </div>
    </div>
  );
};
