import React, { useRef, useState, useCallback } from 'react';

interface ShukrButtonProps {
  onSOS: () => void;
  onHome: () => void;
  playClick: () => void;
  onOpenSettings: () => void;
  hasUnsyncedChanges?: boolean;
  isFocused?: boolean;
}

/**
 * ShukrButton - The Pure Brand Pill
 * Single Tap: Home
 * Hold (1s): SOS
 * Hold (3s): Admin
 */
export const ShukrButton: React.FC<ShukrButtonProps> = ({ 
  onSOS, 
  onHome, 
  playClick, 
  onOpenSettings, 
  hasUnsyncedChanges,
  isFocused
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartedRef = useRef<number>(0);
  const sosTriggeredRef = useRef<boolean>(false);

  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;

    setIsPressing(true);
    pressStartedRef.current = Date.now();
    sosTriggeredRef.current = false;

    // Timer for SOS (1s)
    timerRef.current = setTimeout(() => {
      onSOS();
      sosTriggeredRef.current = true;
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }, 1000);

    // Timer for Hidden Admin (3s)
    adminTimerRef.current = setTimeout(() => {
      onOpenSettings();
      setIsPressing(false);
    }, 3000);
  }, [onSOS, onOpenSettings]);

  const handlePressEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (adminTimerRef.current) clearTimeout(adminTimerRef.current);
    
    timerRef.current = null;
    adminTimerRef.current = null;
    setIsPressing(false);
  }, []);

  const handleClick = useCallback((_e: React.MouseEvent) => {
    const pressDuration = Date.now() - pressStartedRef.current;
    if (sosTriggeredRef.current || pressDuration > 800) return;

    playClick();
    if (navigator.vibrate) navigator.vibrate(30);
    onHome();
  }, [onHome, playClick]);

  return (
    <button 
      className={`brand-badge-btn ${isPressing ? 'is-pressing' : ''} ${isFocused ? 'focused-item' : ''}`}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="brand-badge-inner">
        <span className="brand-badge">Shukr</span>
      </div>
      {isPressing && <div className="press-progress-bar" />}
      {hasUnsyncedChanges && !isPressing && <div className="shukr-sync-indicator" />}
    </button>
  );
};
