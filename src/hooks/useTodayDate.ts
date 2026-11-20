import { useEffect, useMemo, useState } from 'react';
import { getLocalDateString } from '../utils/todoLogic';

const HEADER_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getHeaderDateFormatter(intlLocale = 'tr-TR'): Intl.DateTimeFormat {
  let fmt = HEADER_FORMATTER_CACHE.get(intlLocale);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat(intlLocale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      fmt = new Intl.DateTimeFormat('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    HEADER_FORMATTER_CACHE.set(intlLocale, fmt);
  }
  return fmt;
}

export function useTodayDate(intlLocale = 'tr-TR') {
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
    return Number.isNaN(dt.getTime()) ? '' : getHeaderDateFormatter(intlLocale).format(dt);
  }, [todayStr, intlLocale]);

  return { todayStr, todayFormatted };
}
