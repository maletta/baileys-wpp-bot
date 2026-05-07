'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Contagem regressiva em segundos (sincronizada com `nextRequestAfterSec` / `retryAfterSec` da API).
 */
export function useSecondsCountdown() {
  const [remainingSec, setRemainingSec] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clearTimer();
      const s = Math.max(0, Math.floor(seconds));
      setRemainingSec(s);
      if (s <= 0) {
        return;
      }
      intervalRef.current = setInterval(() => {
        setRemainingSec(prev => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer]
  );

  const reset = useCallback(() => {
    clearTimer();
    setRemainingSec(0);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    remainingSec,
    isRunning: remainingSec > 0,
    start,
    reset
  };
}
