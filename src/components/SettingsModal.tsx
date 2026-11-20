import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  Keyboard,
  Lock,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Unlock,
  Upload,
  X,
} from 'lucide-react';
import type { Category, ThemeId, ThemeMode, Todo } from '../types';
import { COLOR_THEMES } from '../utils/themes';
import { ColorDot } from './ColorDot';

interface SettingsModalProps {
  onClose: () => void;
  themeMode: ThemeMode;
  themeId: ThemeId;
  dragLocked: boolean;
  onChangeMode: (mode: ThemeMode) => void;
  onChangeTheme: (id: ThemeId) => void;
  onToggleDragLock: (locked: boolean) => void;
  totalTodoCount: number;
  completedTodoCount: number;
  onClearAllCompleted: () => Promise<void>;
  onImportBackup: (payload: unknown) => Promise<void>;
  trashedCategories: Category[];
  trashedTodos: Todo[];
  onRestoreTodo: (id: string) => Promise<void>;
  onPermanentDeleteTodo: (id: string) => Promise<void>;
  onRestoreCategory: (id: string) => Promise<void>;
  onPermanentDeleteCategory: (id: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
}

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

const SHORTCUTS = [
  { keys: 'N', label: 'Yeni görev girişine odaklan' },
  { keys: '/ veya Ctrl+K', label: 'Görevlerde ara' },
  { keys: 'Alt + ↑ / ↓', label: 'Seçili görevin sırasını taşı' },
  { keys: 'Esc', label: 'Açık paneli veya pencereyi kapat' },
];

const TRASH_DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDeletedAt(iso: string | null): string {
  if (!iso) return '';
  try {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '';
    return TRASH_DATE_FORMATTER.format(dt);
  } catch {
    return '';
  }
}

export function SettingsModal({
  onClose,
  themeMode,
  themeId,
  dragLocked,
  onChangeMode,
  onChangeTheme,
  onToggleDragLock,
  totalTodoCount,
  completedTodoCount,
  onClearAllCompleted,
  onImportBackup,
  trashedCategories,
  trashedTodos,
  onRestoreTodo,
  onPermanentDeleteTodo,
  onRestoreCategory,
  onPermanentDeleteCategory,
  onEmptyTrash,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'trash'>('general');
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearingCompleted, setIsClearingCompleted] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [busyTrashIds, setBusyTrashIds] = useState<Set<string>>(() => new Set());
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    payload: unknown;
    summary: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const trashCount = trashedCategories.length + trashedTodos.length;

  const runTrashItemOp = useCallback(
    async (key: string, op: () => Promise<void>) => {
      setBusyTrashIds((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      try {
        await op();
      } finally {
        if (isMountedRef.current) {
          setBusyTrashIds((prev) => {
            if (!prev.has(key)) return prev;
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }
      }
    },
    [],
  );

  const safeClose = useCallback(() => {
    if (isImporting) return;
    onClose();
  }, [isImporting, onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      if (isImporting) return;
      if (pendingImport) {
        setPendingImport(null);
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isImporting, pendingImport, onClose]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError(null);
    setPendingImport(null);

    if (file.size > MAX_IMPORT_BYTES) {
      setImportError('Seçilen yedek dosyası 5 MB sınırını aşıyor.');
      return;
    }

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setImportError('Seçilen dosya geçerli bir Agendamea yedeği değil.');
        return;
      }
      const record = parsed as Record<string, unknown>;
      const todoCount = Array.isArray(record.todos) ? record.todos.length : 0;
      const catCount = Array.isArray(record.categories) ? record.categories.length : 0;
      const trashCountInFile =
        (Array.isArray(record.trashedTodos) ? record.trashedTodos.length : 0) +
        (Array.isArray(record.trashedCategories) ? record.trashedCategories.length : 0);
      const summaryParts = [`${todoCount} görev`, `${catCount} kategori`];
      if (trashCountInFile > 0) {
        summaryParts.push(`${trashCountInFile} çöp kutusu`);
      }
      setPendingImport({
        fileName: file.name,
        payload: parsed,
        summary: summaryParts.join(' · '),
      });
    } catch {
      setImportError('Seçilen dosya geçerli bir JSON yedeği değil.');
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport || isImporting) return;
    setImportError(null);
    setIsImporting(true);
    try {
      await onImportBackup(pendingImport.payload);
      setPendingImport(null);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Yedek geri yüklenemedi.',
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Ayarlar penceresini kapat"
        disabled={isImporting}
        onClick={safeClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      {/* Dialog Surface */}
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="border-b border-[var(--border)] px-5 pt-4 pb-3 sm:px-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id="settings-modal-title"
                className="font-display text-base font-bold tracking-tight text-[var(--text-primary)]"
              >
                Ayarlar
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Tüm değişiklikler bilgisayarınıza anında kaydedilir.
              </p>
            </div>
            <button
              type="button"
              disabled={isImporting}
              onClick={safeClose}
              aria-label="Kapat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Ayar sekmeleri"
            className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'general'}
              onClick={() => {
                setActiveTab('general');
                setConfirmEmptyTrash(false);
              }}
              className={`rounded-lg py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Genel ve Tema
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'trash'}
              onClick={() => setActiveTab('trash')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'trash'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Çöp Kutusu</span>
              {trashCount > 0 && (
                <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                  ({trashCount})
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
          {activeTab === 'general' ? (
            <>
              {/* Appearance Mode */}
              <section aria-label="Görünüm modu" className="space-y-2.5">
                <h3 className="font-display text-xs font-semibold text-[var(--text-muted)]">
                  Görünüm Modu
                </h3>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-1">
                  <button
                    type="button"
                    onClick={() => onChangeMode('light')}
                    aria-pressed={themeMode === 'light'}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      themeMode === 'light'
                        ? 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    <span>Açık</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMode('dark')}
                    aria-pressed={themeMode === 'dark'}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      themeMode === 'dark'
                        ? 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    <span>Koyu</span>
                  </button>
                </div>
              </section>

              {/* 14 Color Themes */}
              <section aria-label="Renk teması" className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xs font-semibold text-[var(--text-muted)]">
                    Renk Teması
                  </h3>
                  <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                    {COLOR_THEMES.length} tema
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = theme.id === themeId;
                    const swatch = themeMode === 'dark' ? theme.swatchDark : theme.swatch;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => onChangeTheme(theme.id)}
                        aria-pressed={isSelected}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                            : 'border-[var(--border)] bg-[var(--canvas)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                            style={{ backgroundColor: swatch }}
                          />
                          <span className="truncate whitespace-nowrap">{theme.name}</span>
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="h-px bg-[var(--border)]" />

              {/* Data & Backup (SQLite) */}
              <section aria-label="Veri ve yedekleme" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xs font-semibold text-[var(--text-muted)]">
                    Veri ve Yedekleme
                  </h3>
                  <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                    {totalTodoCount} kayıt · Yerel kayıt
                  </span>
                </div>

                {importError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
                  >
                    {importError}
                  </div>
                )}

                {pendingImport && (
                  <div
                    role="alertdialog"
                    aria-label="Yedek geri yükleme onayı"
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-3 space-y-2.5"
                  >
                    <p className="text-xs leading-relaxed text-[var(--text-primary)]">
                      <strong>{pendingImport.fileName}</strong> ({pendingImport.summary}) geri
                      yüklensin mi? Mevcut tüm veriler bu yedekle değiştirilir.
                    </p>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={() => setPendingImport(null)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={() => void handleConfirmImport()}
                        className="rounded-lg px-3 py-1 text-xs font-medium transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                      >
                        {isImporting ? 'Geri Yükleniyor...' : 'Üzerine Yaz ve Yükle'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--canvas)]">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Sürükleyerek Sıralama
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {dragLocked
                          ? 'Kilitli — kategori ve görevlerin konumu sürüklenerek değiştirilemez.'
                          : 'Açık — kategori ve görevleri tutup sürükleyerek yeniden sıralayabilirsiniz.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!dragLocked}
                      aria-label="Sürükleyerek sıralama kilidi"
                      onClick={() => onToggleDragLock(!dragLocked)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        dragLocked
                          ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                          : 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      }`}
                    >
                      {dragLocked ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span>Kilitli</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5 text-[var(--accent)]" />
                          <span>Açık</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Yedek İndir / Geri Yükle
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Tüm görev, kategori, alt görev ve çöp kutusunu JSON olarak yedekleyin veya geri yükleyin.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={(e) => void handleFileChange(e)}
                        aria-label="JSON yedek dosyası seç"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors whitespace-nowrap"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{isImporting ? 'Yükleniyor...' : 'Geri Yükle'}</span>
                      </button>
                      <a
                        href="/api/export"
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors whitespace-nowrap"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>İndir</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Tamamlananları Çöp Kutusuna Taşı
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {completedTodoCount > 0
                          ? `${completedTodoCount} tamamlanmış görev çöp kutusuna taşınır.`
                          : 'Taşınacak tamamlanmış görev bulunmuyor.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={completedTodoCount === 0 || isClearingCompleted}
                      onClick={async () => {
                        if (isClearingCompleted) return;
                        setIsClearingCompleted(true);
                        try {
                          await onClearAllCompleted();
                        } finally {
                          setIsClearingCompleted(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{isClearingCompleted ? 'Taşınıyor...' : 'Taşı'}</span>
                    </button>
                  </div>
                </div>
              </section>

              <div className="h-px bg-[var(--border)]" />

              {/* Keyboard Shortcuts */}
              <section aria-label="Klavye kısayolları" className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <h3 className="font-display text-xs font-semibold text-[var(--text-muted)]">
                    Klavye Kısayolları
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {SHORTCUTS.map((item) => (
                    <div
                      key={item.keys}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-[var(--text-secondary)]">{item.label}</span>
                      <span className="font-mono-tabular text-[var(--text-muted)] whitespace-nowrap">
                        {item.keys}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="h-px bg-[var(--border)]" />

              {/* About & Publisher */}
              <section aria-label="Uygulama hakkında" className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-semibold text-[var(--text-primary)]">
                    Agendamea
                  </span>
                  <span className="font-mono-tabular">v1.0.0</span>
                  <span>·</span>
                  <span>Vellium</span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://vellium.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors"
                  >
                    vellium.dev
                  </a>
                  <a
                    href="mailto:support@vellium.dev"
                    className="hover:text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors"
                  >
                    support@vellium.dev
                  </a>
                </div>
              </section>
            </>
          ) : (
            /* Trash Tab */
            <div className="space-y-5">
              {/* Trash Header / Empty All Action */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Silinen görev ve kategoriler buradan geri yüklenebilir veya kalıcı olarak silinebilir.
                </p>

                {trashCount > 0 && (
                  confirmEmptyTrash ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isEmptyingTrash}
                        onClick={() => setConfirmEmptyTrash(false)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 whitespace-nowrap"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        disabled={isEmptyingTrash}
                        onClick={async () => {
                          if (isEmptyingTrash) return;
                          setIsEmptyingTrash(true);
                          try {
                            await onEmptyTrash();
                            setConfirmEmptyTrash(false);
                          } finally {
                            setIsEmptyingTrash(false);
                          }
                        }}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                      >
                        {isEmptyingTrash ? 'Siliniyor...' : 'Tümünü Kalıcı Sil'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmEmptyTrash(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Çöp Kutusunu Boşalt</span>
                    </button>
                  )
                )}
              </div>

              {trashCount === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--canvas)] px-6 py-12 text-center">
                  <Trash2 className="mb-2.5 h-6 w-6 text-[var(--text-muted)]" />
                  <p className="font-display text-sm font-semibold text-[var(--text-primary)]">
                    Çöp kutusu boş
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Sildiğiniz görevler ve kategoriler burada güvenle saklanır.
                  </p>
                </div>
              ) : (
                <>
                  {/* Trashed Categories */}
                  {trashedCategories.length > 0 && (
                    <section aria-label="Silinen kategoriler" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-xs font-semibold text-[var(--text-muted)]">
                          Kategoriler
                        </h3>
                        <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                          {trashedCategories.length}
                        </span>
                      </div>
                      <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--canvas)]">
                        {trashedCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <ColorDot color={cat.color} size="sm" />
                                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                  {cat.name}
                                </p>
                              </div>
                              <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono-tabular">
                                Silindi: {formatDeletedAt(cat.deletedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={isEmptyingTrash || busyTrashIds.has(`cat:${cat.id}`)}
                                onClick={() =>
                                  void runTrashItemOp(`cat:${cat.id}`, () =>
                                    onRestoreCategory(cat.id),
                                  )
                                }
                                aria-label={`Kategoriyi geri yükle: ${cat.name}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors whitespace-nowrap"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Geri Yükle</span>
                              </button>
                              <button
                                type="button"
                                disabled={isEmptyingTrash || busyTrashIds.has(`cat:${cat.id}`)}
                                onClick={() =>
                                  void runTrashItemOp(`cat:${cat.id}`, () =>
                                    onPermanentDeleteCategory(cat.id),
                                  )
                                }
                                aria-label={`Kategoriyi kalıcı sil: ${cat.name}`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                                title="Kalıcı Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Trashed Todos */}
                  {trashedTodos.length > 0 && (
                    <section aria-label="Silinen görevler" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-xs font-semibold text-[var(--text-muted)]">
                          Görevler
                        </h3>
                        <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                          {trashedTodos.length}
                        </span>
                      </div>
                      <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--canvas)]">
                        {trashedTodos.map((todo) => (
                          <div
                            key={todo.id}
                            className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                          >
                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm font-medium ${
                                  todo.completed
                                    ? 'line-through text-[var(--text-muted)]'
                                    : 'text-[var(--text-primary)]'
                                }`}
                              >
                                {todo.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono-tabular">
                                Silindi: {formatDeletedAt(todo.deletedAt)}
                                {todo.subtasks.length > 0
                                  ? ` · ${todo.subtasks.length} alt görev`
                                  : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={isEmptyingTrash || busyTrashIds.has(`todo:${todo.id}`)}
                                onClick={() =>
                                  void runTrashItemOp(`todo:${todo.id}`, () =>
                                    onRestoreTodo(todo.id),
                                  )
                                }
                                aria-label={`Görevi geri yükle: ${todo.title}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors whitespace-nowrap"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Geri Yükle</span>
                              </button>
                              <button
                                type="button"
                                disabled={isEmptyingTrash || busyTrashIds.has(`todo:${todo.id}`)}
                                onClick={() =>
                                  void runTrashItemOp(`todo:${todo.id}`, () =>
                                    onPermanentDeleteTodo(todo.id),
                                  )
                                }
                                aria-label={`Görevi kalıcı sil: ${todo.title}`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                                title="Kalıcı Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
