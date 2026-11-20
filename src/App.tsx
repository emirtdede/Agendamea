import React, {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CheckCheck,
  Menu,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from './api/client';
import { ColorDot } from './components/ColorDot';
import { OfflineIndicator } from './components/OfflineIndicator';
import { QuickAddBar } from './components/QuickAddBar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { TodoDetailPanel } from './components/TodoDetailPanel';
import { TodoItem } from './components/TodoItem';
import { WindowControls } from './components/WindowControls';
import { useDelayedFocus } from './hooks/useDelayedFocus';
import { useToast } from './hooks/useToast';
import { useTodayDate } from './hooks/useTodayDate';
import type {
  ActiveView,
  Category,
  CategoryPatch,
  Priority,
  SortOption,
  StatusFilter,
  ThemeId,
  ThemeMode,
  Todo,
  TodoPatch,
} from './types';
import { applyThemeToDocument, isValidThemeId } from './utils/themes';
import {
  computeViewCounts,
  filterAndSortTodos,
  getVerticalDropPosition,
  moveIdRelative,
  sortCategoriesWithPin,
} from './utils/todoLogic';

const SettingsModal = React.lazy(() => import('./components/SettingsModal'));

const SMART_VIEW_TITLES: Record<string, string> = {
  all: 'Tüm Görevler',
  today: 'Bugün',
  important: 'Önemli',
  completed: 'Tamamlananlar',
};

function readInitialTheme(): {
  mode: ThemeMode;
  themeId: ThemeId;
  hasStoredPreference: boolean;
} {
  try {
    const savedMode = localStorage.getItem('agendamea-theme-mode');
    const savedId = localStorage.getItem('agendamea-theme-id');
    const hasMode = savedMode === 'light' || savedMode === 'dark';
    const hasId = Boolean(savedId && isValidThemeId(savedId));
    return {
      mode: savedMode === 'dark' ? 'dark' : 'light',
      themeId: hasId && savedId ? (savedId as ThemeId) : 'obsidian',
      hasStoredPreference: hasMode || hasId,
    };
  } catch {
    return { mode: 'light', themeId: 'obsidian', hasStoredPreference: false };
  }
}

function readInitialSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem('agendamea-sidebar-collapsed') === 'true';
  } catch {
    return false;
  }
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function App() {
  const initialTheme = useMemo(() => readInitialTheme(), []);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme.mode);
  const [themeId, setThemeId] = useState<ThemeId>(initialTheme.themeId);
  const [dragLocked, setDragLocked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    readInitialSidebarCollapsed(),
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [trashedCategories, setTrashedCategories] = useState<Category[]>([]);
  const [trashedTodos, setTrashedTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<ActiveView>({ type: 'smart', id: 'all' });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [todoDropTarget, setTodoDropTarget] = useState<{
    id: string;
    position: 'before' | 'after';
  } | null>(null);

  const {
    undoToast,
    infoToast,
    showUndoToast,
    clearUndoToast,
    showInfoToast,
    clearInfoToast,
  } = useToast();
  const { todayStr, todayFormatted } = useTodayDate();

  const quickAddRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scheduleFocus = useDelayedFocus();
  // Sequence counters per entity prevent out-of-order PATCH responses from overwriting newer edits
  const todoUpdateSeqRef = useRef<Map<string, number>>(new Map());
  const categoryUpdateSeqRef = useRef<Map<string, number>>(new Map());
  const subtaskUpdateSeqRef = useRef<Map<string, number>>(new Map());
  const reorderCatSeqRef = useRef(0);
  const reorderTodoSeqRef = useRef(0);
  // Tracks in-flight soft deletes so immediate Undo & Empty Trash await DELETE first (resolves true iff delete succeeded)
  const pendingDeletesRef = useRef<Map<string, Promise<boolean>>>(new Map());
  const pendingSubtaskDeletesRef = useRef<Set<string>>(new Set());
  const isEmptyingTrashRef = useRef(false);
  // Prevents duplicate concurrent restore/permanent-delete requests per trash item
  const pendingTrashOpsRef = useRef<Set<string>>(new Set());
  // Prevents an in-flight initial bootstrap from overwriting theme/sidebar preferences just changed by the user
  const themeDirtyRef = useRef(false);
  const sidebarDirtyRef = useRef(false);
  const todosRef = useRef(todos);
  todosRef.current = todos;
  const trashedCategoriesRef = useRef(trashedCategories);
  trashedCategoriesRef.current = trashedCategories;
  const sidebarCollapsedRef = useRef(sidebarCollapsed);
  sidebarCollapsedRef.current = sidebarCollapsed;

  // Single authoritative effect for applying theme tokens & syncing localStorage cache
  useEffect(() => {
    applyThemeToDocument(themeId, themeMode);
  }, [themeId, themeMode]);

  // Load SQLite state (silent=true avoids flashing loading skeleton on background error rollback)
  const loadData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setLoadError(null);
    }
    try {
      const data = await api.bootstrap();
      setCategories(sortCategoriesWithPin(data.categories));
      setTodos(data.todos);
      setTrashedCategories(data.trashedCategories);
      setTrashedTodos(data.trashedTodos);
      setDragLocked(Boolean(data.settings.dragLocked));

      if (!sidebarDirtyRef.current) {
        const dbCollapsed = Boolean(data.settings.sidebarCollapsed);
        setSidebarCollapsed(dbCollapsed);
        try {
          localStorage.setItem('agendamea-sidebar-collapsed', String(dbCollapsed));
        } catch {
          // Ignore storage errors
        }
      }

      if (!themeDirtyRef.current) {
        const storedTheme = readInitialTheme();
        if (!data.settings.themeCustomized && storedTheme.hasStoredPreference) {
          setThemeMode(storedTheme.mode);
          setThemeId(storedTheme.themeId);
          void api
            .updateSettings({ themeMode: storedTheme.mode, themeId: storedTheme.themeId })
            .catch(() => {});
        } else {
          setThemeMode(data.settings.themeMode);
          setThemeId(data.settings.themeId);
        }
      }
      setLoadError(null);
    } catch (err) {
      if (!silent) {
        setLoadError(errorMessage(err, 'Veriler yüklenemedi.'));
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  // Handle Windows Jump List / PWA shortcut launch query params (?view=... & ?action=new)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const actionParam = params.get('action');

      if (
        viewParam === 'today' ||
        viewParam === 'important' ||
        viewParam === 'completed' ||
        viewParam === 'all'
      ) {
        setActiveView({ type: 'smart', id: viewParam });
      }
      if (actionParam === 'new') {
        scheduleFocus(() => quickAddRef.current?.focus(), 120);
      }
      if (viewParam || actionParam) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {
      // Ignore invalid URL environments
    }
  }, [scheduleFocus]);

  const focusSidebarSearch = useCallback(() => {
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(true);
      scheduleFocus(() => searchInputRef.current?.focus(), 80);
      return;
    }
    if (sidebarCollapsedRef.current) {
      sidebarDirtyRef.current = true;
      sidebarCollapsedRef.current = false;
      setSidebarCollapsed(false);
      try {
        localStorage.setItem('agendamea-sidebar-collapsed', 'false');
      } catch {
        // Ignore storage errors
      }
      void api.updateSettings({ sidebarCollapsed: false }).catch(() => {});
      scheduleFocus(() => searchInputRef.current?.focus(), 80);
      return;
    }
    searchInputRef.current?.focus();
  }, [scheduleFocus]);

  // Global keyboard shortcuts (including Alt+ArrowUp/Down accessible task reordering)
  const keyboardReorderRef = useRef<((direction: 'up' | 'down') => void) | null>(null);
  const keyStateRef = useRef({
    isSettingsOpen,
    isMobileSidebarOpen,
    selectedTodoId,
    searchQuery,
    focusSidebarSearch,
  });
  keyStateRef.current = {
    isSettingsOpen,
    isMobileSidebarOpen,
    selectedTodoId,
    searchQuery,
    focusSidebarSearch,
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = keyStateRef.current;
      const target = e.target as HTMLElement | null;
      const isTypingField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        state.focusSidebarSearch();
        return;
      }

      if (e.key === 'Escape') {
        if (state.isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (state.isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
        } else if (state.selectedTodoId) {
          setSelectedTodoId(null);
        } else if (state.searchQuery) {
          setSearchQuery('');
        }
        return;
      }

      if (isTypingField || state.isSettingsOpen) return;

      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        keyboardReorderRef.current?.(e.key === 'ArrowUp' ? 'up' : 'down');
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        state.focusSidebarSearch();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        quickAddRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Theme handlers (instant state + keepalive SQLite save)
  const handleModeChange = useCallback(
    (nextMode: ThemeMode) => {
      themeDirtyRef.current = true;
      setThemeMode(nextMode);
      void api.updateSettings({ themeMode: nextMode }).catch((err) => {
        showInfoToast(errorMessage(err, 'Tema modu kaydedilemedi.'), 'error');
      });
    },
    [showInfoToast],
  );

  const handleThemeChange = useCallback(
    (nextId: ThemeId) => {
      themeDirtyRef.current = true;
      setThemeId(nextId);
      void api.updateSettings({ themeId: nextId }).catch((err) => {
        showInfoToast(errorMessage(err, 'Renk teması kaydedilemedi.'), 'error');
      });
    },
    [showInfoToast],
  );

  const handleToggleSidebarCollapse = useCallback(() => {
    sidebarDirtyRef.current = true;
    const next = !sidebarCollapsedRef.current;
    sidebarCollapsedRef.current = next;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem('agendamea-sidebar-collapsed', String(next));
    } catch {
      // Ignore storage errors
    }
    void api.updateSettings({ sidebarCollapsed: next }).catch(() => {});
  }, []);

  // Category CRUD (instant SQLite save with full error handling)
  const handleCreateCategory = useCallback(
    async (payload: { id: string; name: string; color: string }) => {
      try {
        const created = await api.createCategory(payload);
        setCategories((prev) =>
          sortCategoriesWithPin([...prev.filter((c) => c.id !== created.id), created]),
        );
        setActiveView({ type: 'category', id: created.id });
      } catch (err) {
        showInfoToast(errorMessage(err, 'Kategori oluşturulamadı.'), 'error');
        throw err;
      }
    },
    [showInfoToast],
  );

  const handleUpdateCategory = useCallback(
    async (id: string, patch: CategoryPatch) => {
      const seq = (categoryUpdateSeqRef.current.get(id) ?? 0) + 1;
      categoryUpdateSeqRef.current.set(id, seq);
      try {
        const updated = await api.updateCategory(id, patch);
        if (categoryUpdateSeqRef.current.get(id) === seq) {
          setCategories((prev) =>
            sortCategoriesWithPin(prev.map((c) => (c.id === id ? updated : c))),
          );
        }
      } catch (err) {
        showInfoToast(errorMessage(err, 'Kategori güncellenemedi.'), 'error');
        if (categoryUpdateSeqRef.current.get(id) === seq) {
          void loadData(true);
        }
        throw err;
      }
    },
    [showInfoToast, loadData],
  );

  const handleTogglePinCategory = useCallback(
    async (id: string, pinned: boolean) => {
      const seq = (categoryUpdateSeqRef.current.get(id) ?? 0) + 1;
      categoryUpdateSeqRef.current.set(id, seq);
      setCategories((prev) =>
        sortCategoriesWithPin(prev.map((c) => (c.id === id ? { ...c, pinned } : c))),
      );
      try {
        const updated = await api.updateCategory(id, { pinned });
        if (categoryUpdateSeqRef.current.get(id) === seq) {
          setCategories((prev) =>
            sortCategoriesWithPin(prev.map((c) => (c.id === id ? updated : c))),
          );
        }
      } catch (err) {
        showInfoToast(errorMessage(err, 'Kategori sabitlemesi güncellenemedi.'), 'error');
        if (categoryUpdateSeqRef.current.get(id) === seq) {
          void loadData(true);
        }
      }
    },
    [showInfoToast, loadData],
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      try {
        const trashed = await api.deleteCategory(id);
        categoryUpdateSeqRef.current.delete(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setTrashedCategories((prev) => [trashed, ...prev.filter((c) => c.id !== id)]);

        setActiveView((prev) =>
          prev.type === 'category' && prev.id === id ? { type: 'smart', id: 'all' } : prev,
        );
        showUndoToast('category', id, 'Kategori çöp kutusuna taşındı');
      } catch (err) {
        showInfoToast(errorMessage(err, 'Kategori silinemedi.'), 'error');
        void loadData(true);
        throw err;
      }
    },
    [showUndoToast, showInfoToast, loadData],
  );

  const handleRestoreCategory = useCallback(
    async (id: string) => {
      const opKey = `cat:${id}`;
      if (pendingTrashOpsRef.current.has(opKey)) return;
      pendingTrashOpsRef.current.add(opKey);
      try {
        const restored = await api.restoreCategory(id);
        setTrashedCategories((prev) => prev.filter((c) => c.id !== id));
        setCategories((prev) =>
          sortCategoriesWithPin([...prev.filter((c) => c.id !== id), restored]),
        );
      } catch (err) {
        showInfoToast(errorMessage(err, 'Kategori geri yüklenemedi.'), 'error');
        void loadData(true);
      } finally {
        pendingTrashOpsRef.current.delete(opKey);
      }
    },
    [showInfoToast, loadData],
  );

  const handlePermanentDeleteCategory = useCallback(
    async (id: string) => {
      const opKey = `cat:${id}`;
      if (pendingTrashOpsRef.current.has(opKey)) return;
      pendingTrashOpsRef.current.add(opKey);
      try {
        await api.permanentDeleteCategory(id);
        categoryUpdateSeqRef.current.delete(id);
        setTrashedCategories((prev) => prev.filter((c) => c.id !== id));
        setTodos((prev) =>
          prev.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
        );
        setTrashedTodos((prev) =>
          prev.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
        );
      } catch (err) {
        showInfoToast(errorMessage(err, 'Kategori kalıcı olarak silinemedi.'), 'error');
        void loadData(true);
      } finally {
        pendingTrashOpsRef.current.delete(opKey);
      }
    },
    [showInfoToast, loadData],
  );

  // Todo CRUD (optimistic + sequence-guarded + silent error rollback)
  const handleAddTodo = useCallback(
    async (payload: {
      id?: string;
      title: string;
      priority: Priority;
      dueDate: string | null;
      categoryId: string | null;
      important: boolean;
    }) => {
      try {
        const created = await api.createTodo(payload);
        setTodos((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      } catch (err) {
        showInfoToast(errorMessage(err, 'Görev eklenemedi.'), 'error');
        throw err;
      }
    },
    [showInfoToast],
  );

  const handleUpdateTodo = useCallback(
    async (
      id: string,
      patch: TodoPatch,
      options?: { keepalive?: boolean },
    ): Promise<boolean> => {
      // Ignore stale unmount-flush updates for todos that were just deleted or cleared
      if (
        pendingDeletesRef.current.has(id) ||
        !todosRef.current.some((t) => t.id === id)
      ) {
        return false;
      }

      const seq = (todoUpdateSeqRef.current.get(id) ?? 0) + 1;
      todoUpdateSeqRef.current.set(id, seq);

      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
      try {
        const updated = await api.updateTodo(id, patch, options);
        // Only apply server snapshot if no newer update for this todo was dispatched
        if (todoUpdateSeqRef.current.get(id) === seq) {
          setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
        }
        return true;
      } catch (err) {
        showInfoToast(errorMessage(err, 'Görev güncellenemedi.'), 'error');
        if (todoUpdateSeqRef.current.get(id) === seq) {
          void loadData(true);
        }
        return false;
      }
    },
    [showInfoToast, loadData],
  );

  // Soft delete todo -> moves to trash (tracked so fast Undo awaits DELETE first)
  const handleDeleteTodo = useCallback(
    (id: string) => {
      const target = todosRef.current.find((t) => t.id === id);
      if (!target) return;

      todoUpdateSeqRef.current.delete(id);
      const deletedAt = new Date().toISOString();
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setTrashedTodos((prev) => [
        { ...target, deletedAt },
        ...prev.filter((t) => t.id !== id),
      ]);
      setSelectedTodoId((prev) => (prev === id ? null : prev));

      showUndoToast('todo', id, 'Görev çöp kutusuna taşındı');

      const deletePromise = api
        .deleteTodo(id)
        .then((trashed) => {
          setTrashedTodos((prev) => prev.map((t) => (t.id === id ? trashed : t)));
          return true;
        })
        .catch((err) => {
          clearUndoToast();
          showInfoToast(errorMessage(err, 'Görev çöp kutusuna taşınamadı.'), 'error');
          void loadData(true);
          return false;
        })
        .finally(() => {
          pendingDeletesRef.current.delete(id);
        });

      pendingDeletesRef.current.set(id, deletePromise);
    },
    [showUndoToast, clearUndoToast, showInfoToast, loadData],
  );

  const handleRestoreTodo = useCallback(
    async (id: string) => {
      const opKey = `todo:${id}`;
      if (pendingTrashOpsRef.current.has(opKey)) return;
      pendingTrashOpsRef.current.add(opKey);
      try {
        // Wait for any in-flight soft delete of this todo to finish before restoring
        const inFlightDelete = pendingDeletesRef.current.get(id);
        if (inFlightDelete) {
          const deleteSucceeded = await inFlightDelete;
          if (!deleteSucceeded) return;
        }
        const restored = await api.restoreTodo(id);
        setTrashedTodos((prev) => prev.filter((t) => t.id !== id));
        setTodos((prev) => [restored, ...prev.filter((t) => t.id !== id)]);
      } catch (err) {
        showInfoToast(errorMessage(err, 'Görev geri yüklenemedi.'), 'error');
        void loadData(true);
      } finally {
        pendingTrashOpsRef.current.delete(opKey);
      }
    },
    [showInfoToast, loadData],
  );

  const handlePermanentDeleteTodo = useCallback(
    async (id: string) => {
      const opKey = `todo:${id}`;
      if (pendingTrashOpsRef.current.has(opKey)) return;
      pendingTrashOpsRef.current.add(opKey);
      try {
        const inFlightDelete = pendingDeletesRef.current.get(id);
        if (inFlightDelete) {
          const deleteSucceeded = await inFlightDelete;
          if (!deleteSucceeded) return;
        }
        await api.permanentDeleteTodo(id);
        todoUpdateSeqRef.current.delete(id);
        setTrashedTodos((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        showInfoToast(errorMessage(err, 'Görev kalıcı olarak silinemedi.'), 'error');
        void loadData(true);
      } finally {
        pendingTrashOpsRef.current.delete(opKey);
      }
    },
    [showInfoToast, loadData],
  );

  const handleUndoSoftDelete = useCallback(async () => {
    if (!undoToast) return;
    const { kind, id } = undoToast;
    clearUndoToast();

    if (kind === 'todo') {
      await handleRestoreTodo(id);
    } else {
      await handleRestoreCategory(id);
    }
  }, [undoToast, clearUndoToast, handleRestoreTodo, handleRestoreCategory]);

  const handleClearCompleted = useCallback(
    async (scopeCategoryId?: string | null) => {
      const scopeCatId =
        scopeCategoryId !== undefined
          ? scopeCategoryId
          : activeView.type === 'category'
            ? activeView.id
            : null;

      try {
        const { trashedTodos: newlyTrashed } = await api.clearCompleted(scopeCatId);
        if (newlyTrashed.length === 0) return;

        const trashedIds = new Set(newlyTrashed.map((t) => t.id));
        trashedIds.forEach((tid) => todoUpdateSeqRef.current.delete(tid));
        setTodos((prev) => prev.filter((t) => !trashedIds.has(t.id)));
        setTrashedTodos((prev) => [
          ...newlyTrashed,
          ...prev.filter((t) => !trashedIds.has(t.id)),
        ]);
        setSelectedTodoId((prev) => (prev && trashedIds.has(prev) ? null : prev));
      } catch (err) {
        showInfoToast(errorMessage(err, 'Tamamlananlar taşınamadı.'), 'error');
        void loadData(true);
      }
    },
    [activeView, showInfoToast, loadData],
  );

  const handleEmptyTrash = useCallback(async () => {
    if (isEmptyingTrashRef.current) return;
    isEmptyingTrashRef.current = true;
    try {
      // Await any in-flight soft deletes so a late DELETE never resurrects a ghost item in trash
      if (pendingDeletesRef.current.size > 0) {
        await Promise.allSettled(Array.from(pendingDeletesRef.current.values()));
      }
      const removedCatIds = new Set(trashedCategoriesRef.current.map((c) => c.id));
      await api.emptyTrash();
      clearUndoToast();
      setTrashedTodos([]);
      setTrashedCategories([]);
      if (removedCatIds.size > 0) {
        setTodos((prev) =>
          prev.map((t) =>
            t.categoryId && removedCatIds.has(t.categoryId)
              ? { ...t, categoryId: null }
              : t,
          ),
        );
      }
    } catch (err) {
      showInfoToast(errorMessage(err, 'Çöp kutusu boşaltılamadı.'), 'error');
      void loadData(true);
    } finally {
      isEmptyingTrashRef.current = false;
    }
  }, [clearUndoToast, showInfoToast, loadData]);

  const handleImportBackup = useCallback(
    async (payload: unknown) => {
      const restored = await api.importBackup(payload);
      clearUndoToast();
      todoUpdateSeqRef.current.clear();
      categoryUpdateSeqRef.current.clear();
      themeDirtyRef.current = false;
      sidebarDirtyRef.current = false;
      const nextCollapsed = Boolean(restored.settings.sidebarCollapsed);
      try {
        localStorage.setItem('agendamea-sidebar-collapsed', String(nextCollapsed));
      } catch {
        // Ignore storage errors
      }
      setCategories(sortCategoriesWithPin(restored.categories));
      setTodos(restored.todos);
      setTrashedCategories(restored.trashedCategories);
      setTrashedTodos(restored.trashedTodos);
      setThemeMode(restored.settings.themeMode);
      setThemeId(restored.settings.themeId);
      setDragLocked(Boolean(restored.settings.dragLocked));
      setSidebarCollapsed(nextCollapsed);
      setSelectedTodoId(null);
      setActiveView({ type: 'smart', id: 'all' });
      showInfoToast('Yedek başarıyla geri yüklendi.');
    },
    [clearUndoToast, showInfoToast],
  );

  // Subtask CRUD (sequence-guarded + full error rollback)
  const handleAddSubtask = useCallback(
    async (todoId: string, title: string): Promise<boolean> => {
      try {
        const created = await api.createSubtask(todoId, title);
        setTodos((prev) =>
          prev.map((t) =>
            t.id === todoId ? { ...t, subtasks: [...t.subtasks, created] } : t,
          ),
        );
        return true;
      } catch (err) {
        showInfoToast(errorMessage(err, 'Alt görev eklenemedi.'), 'error');
        return false;
      }
    },
    [showInfoToast],
  );

  const handleToggleSubtask = useCallback(
    async (todoId: string, subtaskId: string, completed: boolean) => {
      if (pendingSubtaskDeletesRef.current.has(subtaskId)) return;
      const seq = (subtaskUpdateSeqRef.current.get(subtaskId) ?? 0) + 1;
      subtaskUpdateSeqRef.current.set(subtaskId, seq);

      setTodos((prev) =>
        prev.map((t) =>
          t.id === todoId
            ? {
                ...t,
                subtasks: t.subtasks.map((s) =>
                  s.id === subtaskId ? { ...s, completed } : s,
                ),
              }
            : t,
        ),
      );
      try {
        await api.updateSubtask(subtaskId, { completed });
      } catch (err) {
        if (
          !pendingSubtaskDeletesRef.current.has(subtaskId) &&
          subtaskUpdateSeqRef.current.get(subtaskId) === seq
        ) {
          showInfoToast(errorMessage(err, 'Alt görev güncellenemedi.'), 'error');
          void loadData(true);
        }
      }
    },
    [showInfoToast, loadData],
  );

  const handleDeleteSubtask = useCallback(
    async (todoId: string, subtaskId: string) => {
      if (pendingSubtaskDeletesRef.current.has(subtaskId)) return;
      pendingSubtaskDeletesRef.current.add(subtaskId);
      subtaskUpdateSeqRef.current.delete(subtaskId);

      setTodos((prev) =>
        prev.map((t) =>
          t.id === todoId
            ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
            : t,
        ),
      );
      try {
        await api.deleteSubtask(subtaskId);
      } catch (err) {
        showInfoToast(errorMessage(err, 'Alt görev silinemedi.'), 'error');
        void loadData(true);
      } finally {
        pendingSubtaskDeletesRef.current.delete(subtaskId);
      }
    },
    [showInfoToast, loadData],
  );

  // Derived data
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const counts = useMemo(
    () => computeViewCounts(todos, categories, todayStr),
    [todos, categories, todayStr],
  );

  const visibleTodos = useMemo(
    () =>
      filterAndSortTodos({
        todos,
        activeView,
        statusFilter,
        searchQuery: deferredSearchQuery,
        sortBy,
        todayStr,
      }),
    [todos, activeView, statusFilter, deferredSearchQuery, sortBy, todayStr],
  );

  const { activeCountInView, completedCountInView } = useMemo(() => {
    let completed = 0;
    for (const t of visibleTodos) {
      if (t.completed) completed += 1;
    }
    return {
      activeCountInView: visibleTodos.length - completed,
      completedCountInView: completed,
    };
  }, [visibleTodos]);

  const selectedTodo = useMemo(
    () => todos.find((t) => t.id === selectedTodoId) ?? null,
    [todos, selectedTodoId],
  );

  const handleToggleDragLock = useCallback(
    (locked: boolean) => {
      setDragLocked(locked);
      if (locked) {
        setDraggedTodoId(null);
        setTodoDropTarget(null);
      }
      void api.updateSettings({ dragLocked: locked }).catch((err) => {
        showInfoToast(errorMessage(err, 'Sürükleme kilidi kaydedilemedi.'), 'error');
        void loadData(true);
      });
    },
    [showInfoToast, loadData],
  );

  const handleReorderCategories = useCallback(
    (orderedIds: string[]) => {
      const seq = reorderCatSeqRef.current + 1;
      reorderCatSeqRef.current = seq;
      const orderLookup = new Map(orderedIds.map((id, idx) => [id, idx]));
      setCategories((prev) =>
        sortCategoriesWithPin(
          prev.map((c) => ({ ...c, sortOrder: orderLookup.get(c.id) ?? c.sortOrder })),
        ),
      );
      void api.reorderCategories(orderedIds).catch((err) => {
        if (reorderCatSeqRef.current === seq) {
          showInfoToast(errorMessage(err, 'Kategori sıralaması kaydedilemedi.'), 'error');
          void loadData(true);
        }
      });
    },
    [showInfoToast, loadData],
  );

  const isCompletedView = activeView.type === 'smart' && activeView.id === 'completed';
  const canDragTodos = !dragLocked && !deferredSearchQuery.trim() && visibleTodos.length > 1;

  // Ref mirrors keep TodoItem drag callbacks referentially stable so React.memo prevents full-list re-renders
  const visibleTodosRef = useRef(visibleTodos);
  visibleTodosRef.current = visibleTodos;
  const draggedTodoIdRef = useRef(draggedTodoId);
  draggedTodoIdRef.current = draggedTodoId;
  const canDragTodosRef = useRef(canDragTodos);
  canDragTodosRef.current = canDragTodos;
  const dragLockedRef = useRef(dragLocked);
  dragLockedRef.current = dragLocked;
  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;

  // Drag-and-drop & keyboard reorder handler for todos (respecting pinned and completion status groups)
  const handleDropTodo = useCallback(
    (sourceId: string, targetId: string, position: 'before' | 'after') => {
      if (dragLockedRef.current || sourceId === targetId) return;

      const currentVisible = visibleTodosRef.current;
      const sourceTodo = currentVisible.find((t) => t.id === sourceId);
      const targetTodo = currentVisible.find((t) => t.id === targetId);
      if (!sourceTodo || !targetTodo) return;
      if (sourceTodo.pinned !== targetTodo.pinned || sourceTodo.completed !== targetTodo.completed) {
        return;
      }

      const visibleIds = currentVisible.map((t) => t.id);
      const reorderedVisible = moveIdRelative(visibleIds, sourceId, targetId, position);
      const visibleSet = new Set(reorderedVisible);

      const allSorted = [...todosRef.current].sort((a, b) => a.sortOrder - b.sortOrder);
      let cursor = 0;
      const nextOrderedIds = allSorted.map((t) => {
        if (visibleSet.has(t.id)) {
          const replacement = reorderedVisible[cursor];
          cursor += 1;
          return replacement;
        }
        return t.id;
      });

      const finalOrderMap = new Map(nextOrderedIds.map((tid, i) => [tid, i]));
      if (sortByRef.current !== 'manual') {
        setSortBy('manual');
      }
      setTodos((prev) =>
        prev.map((t) => ({
          ...t,
          sortOrder: finalOrderMap.get(t.id) ?? t.sortOrder,
        })),
      );
      const seq = reorderTodoSeqRef.current + 1;
      reorderTodoSeqRef.current = seq;
      void api.reorderTodos(nextOrderedIds).catch((err) => {
        if (reorderTodoSeqRef.current === seq) {
          showInfoToast(errorMessage(err, 'Görev sıralaması kaydedilemedi.'), 'error');
          void loadData(true);
        }
      });
    },
    [showInfoToast, loadData],
  );

  // Wire Alt+ArrowUp / Alt+ArrowDown accessible reorder for the currently selected todo
  keyboardReorderRef.current = (direction: 'up' | 'down') => {
    if (!canDragTodos || !selectedTodoId) return;
    const idx = visibleTodos.findIndex((t) => t.id === selectedTodoId);
    if (idx === -1) return;
    const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
    const neighbor = visibleTodos[neighborIdx];
    if (!neighbor) return;
    handleDropTodo(selectedTodoId, neighbor.id, direction === 'up' ? 'before' : 'after');
  };

  // Stable callbacks for memoized TodoItem & Sidebar components
  const handleSelectTodo = useCallback((id: string) => {
    setSelectedTodoId((prev) => (prev === id ? null : id));
  }, []);

  const handleToggleTodoComplete = useCallback(
    (id: string, completed: boolean) => {
      void handleUpdateTodo(id, { completed });
    },
    [handleUpdateTodo],
  );

  const handleToggleTodoImportant = useCallback(
    (id: string, important: boolean) => {
      void handleUpdateTodo(id, { important });
    },
    [handleUpdateTodo],
  );

  const handleToggleTodoPin = useCallback(
    (id: string, pinned: boolean) => {
      void handleUpdateTodo(id, { pinned });
    },
    [handleUpdateTodo],
  );

  const handleTodoDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      setDraggedTodoId(id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/agendamea-todo', id);
      e.dataTransfer.setData('text/plain', id);
    },
    [],
  );

  const handleTodoDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      const draggedId = draggedTodoIdRef.current;
      if (!canDragTodosRef.current || !draggedId || draggedId === id) return;
      const list = visibleTodosRef.current;
      const sourceTodo = list.find((t) => t.id === draggedId);
      const targetTodo = list.find((t) => t.id === id);
      if (
        !sourceTodo ||
        !targetTodo ||
        sourceTodo.pinned !== targetTodo.pinned ||
        sourceTodo.completed !== targetTodo.completed
      ) {
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const position = getVerticalDropPosition(
        e.clientY,
        e.currentTarget.getBoundingClientRect(),
      );
      setTodoDropTarget((prev) =>
        prev && prev.id === id && prev.position === position ? prev : { id, position },
      );
    },
    [],
  );

  const handleTodoDragLeave = useCallback((id: string) => {
    setTodoDropTarget((prev) => (prev && prev.id === id ? null : prev));
  }, []);

  const handleTodoDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
      if (!canDragTodosRef.current) return;
      e.preventDefault();
      const sourceId = draggedTodoIdRef.current ?? e.dataTransfer.getData('text/agendamea-todo');
      if (sourceId && sourceId !== targetId) {
        const position = getVerticalDropPosition(
          e.clientY,
          e.currentTarget.getBoundingClientRect(),
        );
        handleDropTodo(sourceId, targetId, position);
      }
      setDraggedTodoId(null);
      setTodoDropTarget(null);
    },
    [handleDropTodo],
  );

  const handleTodoDragEnd = useCallback(() => {
    setDraggedTodoId(null);
    setTodoDropTarget(null);
  }, []);

  const handleWindowNotify = useCallback(
    (msg: string) => showInfoToast(msg, 'info'),
    [showInfoToast],
  );

  const handleSelectView = useCallback((view: ActiveView) => {
    setActiveView(view);
    setStatusFilter('all');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleCloseMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTodoId(null);
  }, []);

  const handleClearAllCompleted = useCallback(
    () => handleClearCompleted(null),
    [handleClearCompleted],
  );

  const handleUndoClick = useCallback(() => {
    void handleUndoSoftDelete();
  }, [handleUndoSoftDelete]);

  // Current view title & metadata
  const activeCategory =
    activeView.type === 'category' ? categoryMap.get(activeView.id) : undefined;
  const viewTitle =
    activeView.type === 'smart'
      ? SMART_VIEW_TITLES[activeView.id]
      : activeCategory?.name ?? 'Kategori';

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[var(--canvas)] text-[var(--text-primary)]">
      {/* Sidebar Navigation (includes Search above Tüm Görevler & Minimal Mode) */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        categories={categories}
        counts={counts}
        dragLocked={dragLocked}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        onOpenSettings={handleOpenSettings}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onTogglePinCategory={handleTogglePinCategory}
        onDeleteCategory={handleDeleteCategory}
        onReorderCategories={handleReorderCategories}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={handleCloseMobileSidebar}
      />

      {/* Main Content Area (No Top Header Bar) */}
      <div className="relative flex flex-1 min-w-0 flex-col h-full overflow-hidden">
        {/* Subtle frameless drag strip for Windows Electron / PWA Window Controls Overlay (leaves top-right clear for WindowControls) */}
        <div
          aria-hidden="true"
          className="app-drag-region absolute left-0 right-36 top-0 z-10 h-9 select-none"
        />

        {/* Scrollable Workspace Viewport */}
        <main className="flex-1 overflow-y-auto px-4 pt-11 pb-8 sm:px-8 sm:pt-10">
          <div className="mx-auto w-full max-w-[820px] space-y-5">
            {/* Clean Workspace Title & Contextual Quiet Meta Line */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  aria-label="Menüyü aç"
                  className="app-no-drag flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] md:hidden shrink-0"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2.5 min-w-0">
                  {activeCategory && <ColorDot color={activeCategory.color} size="md" />}
                  <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] truncate">
                    {viewTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-[var(--text-muted)] capitalize">
                  {todayFormatted}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono-tabular whitespace-nowrap shrink-0">
                  <span>{activeCountInView} aktif</span>
                  {completedCountInView > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{completedCountInView} tamamlanan</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Add Bar */}
            {!isCompletedView && (
              <QuickAddBar
                inputRef={quickAddRef}
                categories={categories}
                todayStr={todayStr}
                defaultCategoryId={
                  activeView.type === 'category' ? activeView.id : null
                }
                defaultImportant={
                  activeView.type === 'smart' && activeView.id === 'important'
                }
                defaultDueDate={
                  activeView.type === 'smart' && activeView.id === 'today'
                    ? todayStr
                    : null
                }
                onAdd={handleAddTodo}
              />
            )}

            {/* Filter & Sort Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {!isCompletedView ? (
                <div
                  role="tablist"
                  aria-label="Durum filtresi"
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-1"
                >
                  {(
                    [
                      { id: 'all', label: 'Tümü' },
                      { id: 'active', label: 'Aktif' },
                      { id: 'completed', label: 'Tamamlanan' },
                    ] as const
                  ).map((tab) => {
                    const active = statusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3 ml-auto">
                {completedCountInView > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleClearCompleted()}
                    className="text-xs font-medium text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
                  >
                    Tamamlananları Temizle
                  </button>
                )}

                <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span className="sr-only">Sıralama</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Görev sıralaması"
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors focus:border-[var(--border-strong)] focus:outline-none cursor-pointer"
                  >
                    <option value="manual">Özel Sıra</option>
                    <option value="priority">Öncelik</option>
                    <option value="dueDate">Son Tarih</option>
                    <option value="newest">En Yeni</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Error State */}
            {loadError && (
              <div
                role="alert"
                className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
              >
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="rounded-md border border-current px-3 py-1 text-xs font-medium whitespace-nowrap"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading ? (
              <div
                aria-busy="true"
                aria-label="Görevler yükleniyor"
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)] last:border-b-0"
                  >
                    <div className="h-5 w-5 rounded-full bg-[var(--surface-hover)] animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-[var(--surface-hover)] animate-pulse" />
                      <div className="h-3 w-1/3 rounded bg-[var(--surface-subtle)] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleTodos.length === 0 ? (
              /* Clean Empty State */
              <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  <CheckCheck className="h-5 w-5" />
                </div>
                <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  {searchQuery.trim()
                    ? 'Eşleşen görev bulunamadı'
                    : isCompletedView
                      ? 'Henüz tamamlanan görev yok'
                      : 'Bu liste şu an boş'}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
                  {searchQuery.trim()
                    ? `"${searchQuery}" aramasına uygun kayıt bulunamadı.`
                    : isCompletedView
                      ? 'Tamamladığınız görevler burada listelenir.'
                      : 'Yukarıdaki alana yazıp Enter’a basarak ilk görevinizi anında ekleyebilirsiniz.'}
                </p>
                {searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Aramayı Temizle
                  </button>
                ) : !isCompletedView ? (
                  <button
                    type="button"
                    onClick={() => quickAddRef.current?.focus()}
                    className="mt-4 rounded-lg px-4 py-2 text-xs font-medium transition-opacity"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                  >
                    İlk Görevi Ekle
                  </button>
                ) : null}
              </div>
            ) : (
              /* Flat Single-Container Task List */
              <div
                data-testid="todo-list"
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              >
                {visibleTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    category={
                      todo.categoryId ? categoryMap.get(todo.categoryId) : undefined
                    }
                    todayStr={todayStr}
                    isSelected={selectedTodoId === todo.id}
                    canDrag={canDragTodos}
                    isDragging={draggedTodoId === todo.id}
                    dropIndicator={
                      todoDropTarget && todoDropTarget.id === todo.id
                        ? todoDropTarget.position
                        : null
                    }
                    onSelect={handleSelectTodo}
                    onToggleComplete={handleToggleTodoComplete}
                    onToggleImportant={handleToggleTodoImportant}
                    onTogglePin={handleToggleTodoPin}
                    onDelete={handleDeleteTodo}
                    onDragStart={handleTodoDragStart}
                    onDragOver={handleTodoDragOver}
                    onDragLeave={handleTodoDragLeave}
                    onDrop={handleTodoDrop}
                    onDragEnd={handleTodoDragEnd}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Right Detail Inspector Panel */}
      {selectedTodo && (
        <>
          <button
            type="button"
            aria-label="Detay paneli arka planını kapat"
            onClick={handleCloseDetail}
            className="fixed inset-0 z-20 bg-black/35 lg:hidden"
          />
          <TodoDetailPanel
            todo={selectedTodo}
            categories={categories}
            todayStr={todayStr}
            onClose={handleCloseDetail}
            onUpdate={handleUpdateTodo}
            onDelete={handleDeleteTodo}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
          />
        </>
      )}

      <ToastContainer
        undoToast={undoToast}
        infoToast={infoToast}
        onUndo={handleUndoClick}
        onClearUndo={clearUndoToast}
        onClearInfo={clearInfoToast}
      />

      {/* Lazy-Loaded Settings Modal (Theme, Mode, Drag Lock, SQLite Backup/Import, Trash & Shortcuts) */}
      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            onClose={handleCloseSettings}
            themeMode={themeMode}
            themeId={themeId}
            dragLocked={dragLocked}
            onChangeMode={handleModeChange}
            onChangeTheme={handleThemeChange}
            onToggleDragLock={handleToggleDragLock}
            totalTodoCount={todos.length}
            completedTodoCount={counts.smart.completed}
            onClearAllCompleted={handleClearAllCompleted}
            onImportBackup={handleImportBackup}
            trashedCategories={trashedCategories}
            trashedTodos={trashedTodos}
            onRestoreTodo={handleRestoreTodo}
            onPermanentDeleteTodo={handlePermanentDeleteTodo}
            onRestoreCategory={handleRestoreCategory}
            onPermanentDeleteCategory={handlePermanentDeleteCategory}
            onEmptyTrash={handleEmptyTrash}
          />
        </Suspense>
      )}

      <OfflineIndicator />

      {/* Ultra-minimal floating Windows 10/11 Window Controls at top-right (mounted last & above drag strips) */}
      <div className="app-no-drag fixed top-2 right-2.5 z-[60]">
        <WindowControls onNotify={handleWindowNotify} />
      </div>
    </div>
  );
}
