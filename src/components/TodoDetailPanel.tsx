import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Check, Pin, Plus, Star, Trash2, X } from 'lucide-react';
import type { Category, Priority, Todo, TodoPatch } from '../types';
import { addDaysToDateString } from '../utils/todoLogic';

interface TodoDetailPanelProps {
  todo: Todo;
  categories: Category[];
  todayStr: string;
  onClose: () => void;
  onUpdate: (
    id: string,
    patch: TodoPatch,
    options?: { keepalive?: boolean },
  ) => Promise<boolean>;
  onDelete: (id: string) => void;
  onAddSubtask: (todoId: string, title: string) => Promise<void>;
  onToggleSubtask: (todoId: string, subtaskId: string, completed: boolean) => Promise<void>;
  onDeleteSubtask: (todoId: string, subtaskId: string) => Promise<void>;
}

const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: 'low', label: 'Düşük' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Yüksek' },
];

const DETAIL_DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

function formatCreatedAt(iso: string): string {
  try {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '';
    return DETAIL_DATE_FORMATTER.format(dt);
  } catch {
    return '';
  }
}

export function TodoDetailPanel({
  todo,
  categories,
  todayStr,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TodoDetailPanelProps) {
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [saveHint, setSaveHint] = useState<'idle' | 'saved'>('idle');

  const timerRef = useRef<number | null>(null);
  const isAddingSubtaskRef = useRef(false);
  const skipUnmountFlushRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const lastSavedRef = useRef({ id: todo.id, title: todo.title, notes: todo.notes });
  const draftRef = useRef({ id: todo.id, title: todo.title, notes: todo.notes });

  const flushChangesFor = (
    targetId: string,
    nextTitle: string,
    nextNotes: string,
    keepalive = false,
  ) => {
    if (lastSavedRef.current.id !== targetId) return;

    const trimmedTitle = nextTitle.trim();
    const titleChanged = trimmedTitle.length > 0 && trimmedTitle !== lastSavedRef.current.title;
    const notesChanged = nextNotes !== lastSavedRef.current.notes;

    if (!titleChanged && !notesChanged) return;

    const patch: { title?: string; notes?: string } = {};
    if (titleChanged) patch.title = trimmedTitle;
    if (notesChanged) patch.notes = nextNotes;

    lastSavedRef.current = {
      id: targetId,
      title: titleChanged ? trimmedTitle : lastSavedRef.current.title,
      notes: notesChanged ? nextNotes : lastSavedRef.current.notes,
    };

    void onUpdateRef.current(targetId, patch, keepalive ? { keepalive: true } : undefined).then(
      (ok) => {
        if (ok && draftRef.current.id === targetId) {
          setSaveHint('saved');
        }
      },
    );
  };

  // Flush pending edits when switching todos, and resync if server rolls back/updates the active todo
  useEffect(() => {
    if (lastSavedRef.current.id !== todo.id) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      flushChangesFor(
        lastSavedRef.current.id,
        draftRef.current.title,
        draftRef.current.notes,
      );

      setTitle(todo.title);
      setNotes(todo.notes);
      setNewSubtaskTitle('');
      setSaveHint('idle');
      lastSavedRef.current = { id: todo.id, title: todo.title, notes: todo.notes };
      draftRef.current = { id: todo.id, title: todo.title, notes: todo.notes };
      return;
    }

    // If there is no pending user edit timer, reflect external/rollback updates cleanly
    if (timerRef.current === null) {
      if (todo.title !== lastSavedRef.current.title) {
        setTitle(todo.title);
        lastSavedRef.current.title = todo.title;
        draftRef.current.title = todo.title;
      }
      if (todo.notes !== lastSavedRef.current.notes) {
        setNotes(todo.notes);
        lastSavedRef.current.notes = todo.notes;
        draftRef.current.notes = todo.notes;
      }
    }
  }, [todo.id, todo.title, todo.notes]);

  const scheduleAutoSave = (nextTitle: string, nextNotes: string) => {
    draftRef.current = { id: todo.id, title: nextTitle, notes: nextNotes };
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    const targetId = todo.id;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      flushChangesFor(targetId, nextTitle, nextNotes);
    }, 320);
  };

  // Flush pending edits on tab close/reload (with keepalive) and on unmount unless actively deleting
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (skipUnmountFlushRef.current) return;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      flushChangesFor(
        lastSavedRef.current.id,
        draftRef.current.title,
        draftRef.current.notes,
        true,
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!skipUnmountFlushRef.current) {
        flushChangesFor(
          lastSavedRef.current.id,
          draftRef.current.title,
          draftRef.current.notes,
        );
      }
    };
  }, []);

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingSubtaskRef.current) return;
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    isAddingSubtaskRef.current = true;
    setIsAddingSubtask(true);
    setNewSubtaskTitle('');
    try {
      await onAddSubtask(todo.id, trimmed);
    } finally {
      isAddingSubtaskRef.current = false;
      setIsAddingSubtask(false);
    }
  };

  const tomorrowStr = useMemo(() => addDaysToDateString(todayStr, 1), [todayStr]);
  const createdFormatted = useMemo(() => formatCreatedAt(todo.createdAt), [todo.createdAt]);

  return (
    <aside
      aria-label="Görev detayları"
      className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[380px] flex-col border-l border-[var(--border)] bg-[var(--surface)] lg:static lg:z-auto lg:w-[368px] shrink-0"
    >
      {/* Top Bar with clean clearance below floating minimal top-right WindowControls */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 pt-11 pb-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void onUpdate(todo.id, { completed: !todo.completed })}
            aria-pressed={todo.completed}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors whitespace-nowrap"
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full border"
              style={
                todo.completed
                  ? {
                      backgroundColor: 'var(--accent)',
                      borderColor: 'var(--accent)',
                      color: 'var(--accent-fg)',
                    }
                  : { borderColor: 'var(--border-strong)' }
              }
            >
              {todo.completed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
            </span>
            <span>{todo.completed ? 'Tamamlandı' : 'Tamamla'}</span>
          </button>

          <button
            type="button"
            onClick={() => void onUpdate(todo.id, { pinned: !todo.pinned })}
            aria-label={todo.pinned ? 'Sabitlemeyi kaldır' : 'Görevi sabitle'}
            aria-pressed={todo.pinned}
            title={todo.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              todo.pinned
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Pin className={`h-3.5 w-3.5 ${todo.pinned ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => void onUpdate(todo.id, { important: !todo.important })}
            aria-label={todo.important ? 'Önemli işaretini kaldır' : 'Önemli olarak işaretle'}
            aria-pressed={todo.important}
            title={todo.important ? 'Önemli işaretini kaldır' : 'Önemli'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] transition-colors ${
              todo.important
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'bg-[var(--canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Star className={`h-4 w-4 ${todo.important ? 'fill-current' : ''}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (timerRef.current) {
              window.clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            flushChangesFor(todo.id, title, notes);
            onClose();
          }}
          aria-label="Detay panelini kapat"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Title & Notes (Instant Auto-Save) */}
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              const val = e.target.value;
              setTitle(val);
              scheduleAutoSave(val, notes);
            }}
            onBlur={() => flushChangesFor(todo.id, title, notes)}
            maxLength={300}
            aria-label="Görev başlığı"
            placeholder="Görev başlığı..."
            className={`w-full bg-transparent font-display text-lg font-semibold leading-snug text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none ${
              todo.completed ? 'line-through text-[var(--text-muted)]' : ''
            }`}
          />

          <textarea
            value={notes}
            onChange={(e) => {
              const val = e.target.value;
              setNotes(val);
              scheduleAutoSave(title, val);
            }}
            onBlur={() => flushChangesFor(todo.id, title, notes)}
            rows={4}
            maxLength={10000}
            aria-label="Görev notları"
            placeholder="Notlar veya ayrıntılar ekleyin (otomatik kaydedilir)..."
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--border-strong)] focus:outline-none"
          />
        </div>

        {/* Subtasks */}
        <section aria-label="Alt görevler" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xs font-semibold text-[var(--text-muted)]">
              Alt Görevler
            </h3>
            {todo.subtasks.length > 0 && (
              <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                {todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length}
              </span>
            )}
          </div>

          <div className="space-y-1">
            {todo.subtasks.map((sub) => (
              <div
                key={sub.id}
                className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-hover)] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => void onToggleSubtask(todo.id, sub.id, !sub.completed)}
                  aria-label={
                    sub.completed
                      ? `Alt görev işaretini kaldır: ${sub.title}`
                      : `Alt görevi tamamla: ${sub.title}`
                  }
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                  style={
                    sub.completed
                      ? {
                          backgroundColor: 'var(--accent)',
                          borderColor: 'var(--accent)',
                          color: 'var(--accent-fg)',
                        }
                      : { borderColor: 'var(--border-strong)' }
                  }
                >
                  {sub.completed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </button>
                <span
                  className={`flex-1 min-w-0 text-sm break-words ${
                    sub.completed
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {sub.title}
                </span>
                <button
                  type="button"
                  onClick={() => void onDeleteSubtask(todo.id, sub.id)}
                  aria-label={`Alt görevi sil: ${sub.title}`}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 text-[var(--text-muted)] hover:text-red-500 p-1 rounded transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              disabled={isAddingSubtask}
              maxLength={200}
              aria-label="Yeni alt görev ekle"
              placeholder="Alt görev ekle ve Enter'a bas..."
              className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--border-strong)] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim() || isAddingSubtask}
              aria-label="Alt görev ekle"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-35"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </section>

        <div className="h-px bg-[var(--border)]" />

        {/* Structured Properties */}
        <div className="space-y-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label
              htmlFor="detail-category-select"
              className="block font-display text-xs font-semibold text-[var(--text-muted)]"
            >
              Kategori
            </label>
            <select
              id="detail-category-select"
              value={todo.categoryId ?? ''}
              onChange={(e) => void onUpdate(todo.id, { categoryId: e.target.value || null })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-strong)] focus:outline-none"
            >
              <option value="" className="bg-[var(--surface)]">
                Kategorisiz
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[var(--surface)]">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <p className="font-display text-xs font-semibold text-[var(--text-muted)]">
              Öncelik
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-[var(--surface-subtle)] p-1 border border-[var(--border)]">
              {PRIORITIES.map(({ value, label }) => {
                const active = todo.priority === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => void onUpdate(todo.id, { priority: value })}
                    aria-pressed={active}
                    className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label
              htmlFor="detail-due-date"
              className="block font-display text-xs font-semibold text-[var(--text-muted)]"
            >
              Son Tarih
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void onUpdate(todo.id, { dueDate: todayStr })}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  todo.dueDate === todayStr
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border)] bg-[var(--canvas)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={() => void onUpdate(todo.id, { dueDate: tomorrowStr })}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  todo.dueDate === tomorrowStr
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border)] bg-[var(--canvas)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                Yarın
              </button>
              {todo.dueDate && (
                <button
                  type="button"
                  onClick={() => void onUpdate(todo.id, { dueDate: null })}
                  className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] whitespace-nowrap"
                >
                  Temizle
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--text-muted)]" />
              <input
                id="detail-due-date"
                type="date"
                value={todo.dueDate ?? ''}
                onChange={(e) => void onUpdate(todo.id, { dueDate: e.target.value || null })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-strong)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--text-muted)]">
        <span>
          {saveHint === 'saved'
            ? 'Otomatik kaydedildi'
            : createdFormatted
              ? `Oluşturuldu: ${createdFormatted}`
              : 'SQLite ile senkron'}
        </span>
        <button
          type="button"
          onClick={() => {
            skipUnmountFlushRef.current = true;
            if (timerRef.current) {
              window.clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            onDelete(todo.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Çöpe Taşı</span>
        </button>
      </div>
    </aside>
  );
}
