import { useEffect, useMemo, useState } from 'react';
import { getLocalDateString } from '../utils/todoLogic';

const HEADER_DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function useTodayDate() {
  const [todayStr, setTodayStr] = useState<string>(() => getLocalDateString());

  useEffect(() => {
    let midnightTimer: number | null = null;

    const refreshIfChanged = () => {
      const current = getLocalDateString();
      setTodayStr((prev) => (prev === current ? prev : current));
    };

    const scheduleMidnightTick = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        2,
      );
      const delayMs = Math.max(1000, nextMidnight.getTime() - now.getTime());
      midnightTimer = window.setTimeout(() => {
        refreshIfChanged();
        scheduleMidnightTick();
      }, delayMs);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshIfChanged();
      }
    };

    scheduleMidnightTick();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (midnightTimer !== null) {
        window.clearTimeout(midnightTimer);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const todayFormatted = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? '' : HEADER_DATE_FORMATTER.format(dt);
  }, [todayStr]);

  return { todayStr, todayFormatted };
}
