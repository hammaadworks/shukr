import { useState, useRef, useCallback } from 'react';

export const useLongPress = (
  onLongPress: (e: any) => void,
  onClick: (e: any) => void,
  { delay = 500, shouldPreventDefault = true } = {}
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timerRef = useRef<any>(null);
  const targetRef = useRef<any>(null);

  const start = useCallback(
    (event: any) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, {
          passive: false
        });
        targetRef.current = event.target;
      }
      timerRef.current = setTimeout(() => {
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (event: any, shouldTriggerClick = true) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (shouldTriggerClick && !longPressTriggered) onClick(event);
      setLongPressTriggered(false);
      if (shouldPreventDefault && targetRef.current) {
        targetRef.current.removeEventListener('touchend', preventDefault);
      }
    },
    [shouldPreventDefault, onClick, longPressTriggered]
  );

  return {
    onMouseDown: (e: any) => start(e),
    onMouseUp: (e: any) => clear(e),
    onMouseLeave: (e: any) => clear(e, false),
    onTouchStart: (e: any) => start(e),
    onTouchEnd: (e: any) => clear(e)
  };
};

const preventDefault = (event: any) => {
  if (!event.cancelable) return;
  event.preventDefault();
};
