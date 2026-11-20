import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown, Flag, Folder, Plus } from 'lucide-react';
import type { Category, Priority } from '../types';
import { createClientId } from '../utils/id';
import { addDaysToDateString, getPriorityLabel } from '../utils/todoLogic';
import { ColorDot } from './ColorDot';

interface QuickAddBarProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  categories: Category[];
  todayStr: string;
  defaultCategoryId: string | null;
  defaultImportant: boolean;
  defaultDueDate: string | null;
  onAdd: (payload: {
    id?: string;
    title: string;
    priority: Priority;
    dueDate: string | null;
    categoryId: string | null;
    important: boolean;
  }) => Promise<void>;
}

const PRIORITY_CYCLE: Priority[] = ['normal', 'high', 'low'];

export const QuickAddBar = React.memo(function QuickAddBar({
  inputRef,
  categories,
  todayStr,
  defaultCategoryId,
  defaultImportant,
  defaultDueDate,
  onAdd,
}: QuickAddBarProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDateOverride, setDueDateOverride] = useState<string | null | undefined>(undefined);
  const [categoryOverride, setCategoryOverride] = useState<string | null | undefined>(undefined);
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const catMenuRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const pendingTodoIdRef = useRef<string | null>(null);

  // Reset manual overrides when switching views so defaults match the newly opened list
  useEffect(() => {
    setCategoryOverride(undefined);
  }, [defaultCategoryId]);

  useEffect(() => {
    setDueDateOverride(undefined);
  }, [defaultDueDate]);

  const effectiveCategoryId =
    categoryOverride !== undefined ? categoryOverride : defaultCategoryId;
  const effectiveDueDate =
    dueDateOverride !== undefined ? dueDateOverride : defaultDueDate;

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === effectiveCategoryId) ?? null,
    [categories, effectiveCategoryId],
  );

  useEffect(() => {
    if (!isCatMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setIsCatMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsCatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isCatMenuOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const trimmed = title.trim();
    if (!trimmed) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    const id = pendingTodoIdRef.current ?? createClientId('todo');
    pendingTodoIdRef.current = id;

    try {
      await onAdd({
        id,
        title: trimmed,
        priority,
        dueDate: effectiveDueDate || null,
        categoryId: effectiveCategoryId,
        important: defaultImportant,
      });
      setTitle('');
      setPriority('normal');
      setDueDateOverride(undefined);
      setCategoryOverride(undefined);
      pendingTodoIdRef.current = null;
    } catch {
      // Keep title and pendingTodoIdRef for safe idempotent retry
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const cyclePriority = () => {
    const idx = PRIORITY_CYCLE.indexOf(priority);
    setPriority(PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length]);
  };

  const tomorrowStr = useMemo(() => addDaysToDateString(todayStr, 1), [todayStr]);

  const cycleQuickDate = () => {
    if (!effectiveDueDate) {
      setDueDateOverride(todayStr);
    } else if (effectiveDueDate === todayStr) {
      setDueDateOverride(tomorrowStr);
    } else {
      setDueDateOverride(null);
    }
  };

  const dateLabel =
    effectiveDueDate === todayStr
      ? 'Bugün'
      : effectiveDueDate === tomorrowStr
        ? 'Yarın'
        : effectiveDueDate
          ? effectiveDueDate
          : 'Tarih';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors duration-150 focus-within:border-[var(--border-strong)]"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Plus className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          placeholder="Yeni görev ekle..."
          aria-label="Yeni görev ekle"
          className="flex-1 min-w-0 bg-transparent text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="rounded-lg px-4 py-1.5 text-sm font-medium transition-opacity disabled:opacity-35 whitespace-nowrap shrink-0"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          Ekle
        </button>
      </div>

      {/* Subtle compact quick options bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] bg-[var(--surface-subtle)]/60 px-4 py-2 text-xs rounded-b-xl">
        {/* Quick Due Date */}
        <button
          type="button"
          onClick={cycleQuickDate}
          aria-label={`Son tarih seç: şu an ${dateLabel}`}
          className={`inline-flex items-center gap-1.5 py-0.5 font-medium transition-colors whitespace-nowrap ${
            effectiveDueDate
              ? 'text-[var(--accent)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{dateLabel}</span>
        </button>

        {/* Quick Priority */}
        <button
          type="button"
          onClick={cyclePriority}
          aria-label={`Öncelik değiştir: şu an ${getPriorityLabel(priority)}`}
          className={`inline-flex items-center gap-1.5 py-0.5 font-medium transition-colors whitespace-nowrap ${
            priority === 'high'
              ? 'text-red-600 dark:text-red-400'
              : priority === 'low'
                ? 'text-[var(--text-muted)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Flag className="h-3.5 w-3.5 shrink-0" />
          <span>Öncelik: {getPriorityLabel(priority)}</span>
        </button>

        {/* Clean Custom Category Dropdown */}
        {categories.length > 0 && (
          <div ref={catMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsCatMenuOpen((prev) => !prev)}
              aria-expanded={isCatMenuOpen}
              aria-haspopup="listbox"
              aria-label={`Yeni görev kategorisi: ${selectedCategory?.name ?? 'Kategorisiz'}`}
              className="inline-flex items-center gap-1.5 py-0.5 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
            >
              {selectedCategory ? (
                <ColorDot color={selectedCategory.color} size="xs" />
              ) : (
                <Folder className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
              )}
              <span className="max-w-[120px] truncate">
                {selectedCategory?.name ?? 'Kategorisiz'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
            </button>

            {isCatMenuOpen && (
              <div
                role="listbox"
                aria-label="Kategori listesi"
                className="absolute left-0 top-7 z-30 min-w-[176px] rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-1 shadow-lg"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={effectiveCategoryId === null}
                  onClick={() => {
                    setCategoryOverride(null);
                    setIsCatMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                    effectiveCategoryId === null
                      ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>Kategorisiz</span>
                  {effectiveCategoryId === null && (
                    <Check className="h-3 w-3 text-[var(--accent)]" />
                  )}
                </button>
                {categories.map((cat) => {
                  const selected = effectiveCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setCategoryOverride(cat.id);
                        setIsCatMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <ColorDot color={cat.color} size="xs" />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      {selected && (
                        <Check className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <span className="ml-auto hidden sm:inline text-[11px] text-[var(--text-muted)]">
          Anlık SQLite kaydı
        </span>
      </div>
    </form>
  );
});
