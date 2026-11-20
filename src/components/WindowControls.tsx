import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

interface NativeWindowBridge {
  minimize?: () => void | Promise<void>;
  toggleMaximize?: () => void | Promise<boolean | void>;
  close?: () => void | Promise<void>;
  isMaximized?: () => Promise<boolean> | boolean;
  onMaximizedChange?: (cb: (isMaximized: boolean) => void) => (() => void) | void;
  checkForUpdates?: () => Promise<import('../types').UpdateCheckResult>;
  downloadAndInstallUpdate?: (
    url: string,
  ) => Promise<{ ok: boolean; launchedInstaller?: boolean; launchedExternal?: boolean }>;
  onUpdateProgress?: (cb: (percent: number) => void) => (() => void) | void;
}

declare global {
  interface Window {
    agendameaWindow?: NativeWindowBridge;
  }
}

interface WindowControlsProps {
  onNotify?: (message: string) => void;
}

function getNativeBridge(): NativeWindowBridge | null {
  if (typeof window === 'undefined') return null;
  return window.agendameaWindow ?? null;
}

export function WindowControls({ onNotify }: WindowControlsProps) {
  const [isFullscreenOrMaximized, setIsFullscreenOrMaximized] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const bridge = getNativeBridge();

    // Sync with Electron / WebView2 native maximized state if present
    let unsubNative: (() => void) | void;
    if (bridge?.isMaximized) {
      Promise.resolve(bridge.isMaximized())
        .then((val) => {
          if (active) setIsFullscreenOrMaximized(Boolean(val));
        })
        .catch(() => {});
    }
    if (bridge?.onMaximizedChange) {
      unsubNative = bridge.onMaximizedChange((val) => {
        if (active) setIsFullscreenOrMaximized(Boolean(val));
      });
    }

    // Sync with browser Fullscreen API (Windows 10/11 Edge/Chrome & F11)
    const syncFullscreen = () => {
      if (!bridge?.toggleMaximize) {
        setIsFullscreenOrMaximized(Boolean(document.fullscreenElement));
      }
    };

    document.addEventListener('fullscreenchange', syncFullscreen);
    syncFullscreen();

    return () => {
      active = false;
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      document.removeEventListener('fullscreenchange', syncFullscreen);
      if (typeof unsubNative === 'function') unsubNative();
    };
  }, []);

  const handleMinimize = useCallback(async () => {
    const bridge = getNativeBridge();
    if (bridge?.minimize) {
      await bridge.minimize();
      return;
    }

    // Exit fullscreen first if active so minimize behaves naturally on Windows 10/11
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen().catch(() => {});
    }

    try {
      const res = await api.minimizeWindow();
      window.blur();
      if (!res.supported) {
        onNotify?.('Pencere arka plana gönderildi.');
      }
    } catch {
      window.blur();
    }
  }, [onNotify]);

  const handleToggleFullscreen = useCallback(async () => {
    const bridge = getNativeBridge();
    if (bridge?.toggleMaximize) {
      const result = await bridge.toggleMaximize();
      if (typeof result === 'boolean') {
        setIsFullscreenOrMaximized(result);
      } else {
        setIsFullscreenOrMaximized((prev) => !prev);
      }
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreenOrMaximized(false);
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreenOrMaximized(true);
      }
    } catch {
      onNotify?.('Tam ekran modu tarayıcı tarafından engellendi (F11 kullanabilirsiniz).');
    }
  }, [onNotify]);

  const handleClose = useCallback(async () => {
    const bridge = getNativeBridge();
    if (bridge?.close) {
      await bridge.close();
      return;
    }

    // Works natively in Edge --app mode & installed Windows PWA windows
    window.close();

    // If standard browser tab blocked window.close(), inform quietly without window.alert
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      if (!window.closed) {
        onNotify?.('Tarayıcı sekmesini kapatmak için Ctrl+W veya sekme kapatma düğmesini kullanın.');
      }
    }, 180);
  }, [onNotify]);

  return (
    <div
      role="group"
      aria-label="Pencere kontrolleri"
      className="app-no-drag flex items-center gap-0.5 rounded-lg bg-[var(--canvas)]/75 p-0.5 backdrop-blur-sm"
    >
      {/* Arka Plana Gönder (Minimize) */}
      <button
        type="button"
        onClick={() => void handleMinimize()}
        aria-label="Arka plana gönder"
        title="Arka plana gönder"
        className="app-no-drag flex h-7 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:bg-[var(--border)]"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 6.5H10"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Tam Ekran Yap / Tam Ekrandan Çık (Maximize / Restore) */}
      <button
        type="button"
        onClick={() => void handleToggleFullscreen()}
        aria-label={isFullscreenOrMaximized ? 'Tam ekrandan çık' : 'Tam ekran yap'}
        title={isFullscreenOrMaximized ? 'Tam ekrandan çık' : 'Tam ekran yap'}
        aria-pressed={isFullscreenOrMaximized}
        className="app-no-drag flex h-7 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:bg-[var(--border)]"
      >
        {isFullscreenOrMaximized ? (
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3.75 3.75V2.5C3.75 2.08579 4.08579 1.75 4.5 1.75H9.5C9.91421 1.75 10.25 2.08579 10.25 2.5V7.5C10.25 7.91421 9.91421 8.25 9.5 8.25H8.25"
              stroke="currentColor"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
            <rect
              x="1.75"
              y="3.75"
              width="6.5"
              height="6.5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.15"
            />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="2"
              y="2"
              width="8"
              height="8"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.15"
            />
          </svg>
        )}
      </button>

      {/* Uygulamayı Kapat (Close) */}
      <button
        type="button"
        onClick={() => void handleClose()}
        aria-label="Uygulamayı kapat"
        title="Uygulamayı kapat"
        className="app-no-drag flex h-7 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[#c42b1c] hover:text-white active:bg-[#a62216]"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
