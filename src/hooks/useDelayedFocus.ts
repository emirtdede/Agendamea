import { useCallback, useEffect, useRef } from 'react';

export function useDelayedFocus() {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback((fn: () => void, delayMs = 80) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      fn();
    }, delayMs);
  }, []);
}
