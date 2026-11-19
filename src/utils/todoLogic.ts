import type {
  ActiveView,
  Category,
  Priority,
  SmartView,
  SortOption,
  StatusFilter,
  Todo,
} from '../types';

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  normal: 2,
  low: 1,
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Cached singleton formatter to avoid expensive Intl instantiation on every render
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
});

export function isValidIsoDateString(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    !Number.isNaN(dt.getTime()) &&
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDateString(baseDateStr: string, days: number): string {
  if (!isValidIsoDateString(baseDateStr)) {
    return getLocalDateString();
  }
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return getLocalDateString(dt);
}

let cachedRelativeBase = '';
let cachedTomorrowStr = '';
let cachedYesterdayStr = '';

function getRelativeDayBounds(todayStr: string): {
  tomorrowStr: string;
  yesterdayStr: string;
} {
  if (cachedRelativeBase !== todayStr) {
    cachedRelativeBase = todayStr;
    cachedTomorrowStr = addDaysToDateString(todayStr, 1);
    cachedYesterdayStr = addDaysToDateString(todayStr, -1);
  }
  return {
    tomorrowStr: cachedTomorrowStr,
    yesterdayStr: cachedYesterdayStr,
  };
}

export function formatDueDateLabel(
  dueDate: string | null,
  todayStr: string = getLocalDateString(),
): { label: string; isOverdue: boolean; isToday: boolean } | null {
  if (!dueDate || !isValidIsoDateString(dueDate)) return null;
  const { tomorrowStr, yesterdayStr } = getRelativeDayBounds(todayStr);

  if (dueDate === todayStr) {
    return { label: 'Bugün', isOverdue: false, isToday: true };
  }
  if (dueDate === tomorrowStr) {
    return { label: 'Yarın', isOverdue: false, isToday: false };
  }
  if (dueDate === yesterdayStr) {
    return { label: 'Dün', isOverdue: true, isToday: false };
  }

  const [y, m, d] = dueDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;

  return {
    label: SHORT_DATE_FORMATTER.format(dt),
    isOverdue: dueDate < todayStr,
    isToday: false,
  };
}

export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'Yüksek';
    case 'low':
      return 'Düşük';
    default:
      return 'Normal';
  }
}

export function normalizeTurkish(text: string): string {
  return text.toLocaleLowerCase('tr-TR').trim();
}

export function filterAndSortTodos(params: {
  todos: Todo[];
  activeView: ActiveView;
  statusFilter: StatusFilter;
  searchQuery: string;
  sortBy: SortOption;
  todayStr?: string;
}): Todo[] {
  const {
    todos,
    activeView,
    statusFilter,
    searchQuery,
    sortBy,
    todayStr = getLocalDateString(),
  } = params;

  const q = normalizeTurkish(searchQuery);

  const filtered = todos.filter((todo) => {
    // View scoping
    if (activeView.type === 'smart') {
      if (activeView.id === 'today') {
        const dueForToday = todo.dueDate !== null && todo.dueDate <= todayStr;
        if (!dueForToday) return false;
      } else if (activeView.id === 'important') {
        if (!todo.important) return false;
      } else if (activeView.id === 'completed') {
        if (!todo.completed) return false;
      }
    } else {
      if (todo.categoryId !== activeView.id) return false;
    }

    // Status filter (when not already in dedicated 'completed' smart view)
    if (!(activeView.type === 'smart' && activeView.id === 'completed')) {
      if (statusFilter === 'active' && todo.completed) return false;
      if (statusFilter === 'completed' && !todo.completed) return false;
    }

    // Search query matching title, notes, or subtasks
    if (q.length > 0) {
      const inTitle = normalizeTurkish(todo.title).includes(q);
      const inNotes = normalizeTurkish(todo.notes).includes(q);
      const inSubtasks = todo.subtasks.some((s) => normalizeTurkish(s.title).includes(q));
      if (!inTitle && !inNotes && !inSubtasks) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    // Always float active tasks above completed tasks in mixed views
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Keep pinned tasks at the top within their status group
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    if (sortBy === 'priority') {
      const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (diff !== 0) return diff;
    } else if (sortBy === 'dueDate') {
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
    } else if (sortBy === 'newest') {
      const diff = b.createdAt.localeCompare(a.createdAt);
      if (diff !== 0) return diff;
    }

    // Default / tie-breaker: manual sortOrder ascending, then newest first
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function computeViewCounts(
  todos: Todo[],
  categories: Category[],
  todayStr: string = getLocalDateString(),
): {
  smart: Record<SmartView, number>;
  categories: Record<string, number>;
} {
  const smart: Record<SmartView, number> = {
    all: 0,
    today: 0,
    important: 0,
    completed: 0,
  };

  const catCounts: Record<string, number> = {};
  for (const cat of categories) {
    catCounts[cat.id] = 0;
  }

  for (const todo of todos) {
    if (todo.completed) {
      smart.completed += 1;
    } else {
      smart.all += 1;
      if (todo.dueDate !== null && todo.dueDate <= todayStr) {
        smart.today += 1;
      }
      if (todo.important) {
        smart.important += 1;
      }
      if (todo.categoryId && catCounts[todo.categoryId] !== undefined) {
        catCounts[todo.categoryId] += 1;
      }
    }
  }

  return { smart, categories: catCounts };
}

export function moveIdRelative(
  ids: string[],
  draggedId: string,
  targetId: string,
  position: 'before' | 'after',
): string[] {
  if (draggedId === targetId) return [...ids];
  if (!ids.includes(draggedId) || !ids.includes(targetId)) return [...ids];

  const remaining = ids.filter((id) => id !== draggedId);
  const targetIdx = remaining.indexOf(targetId);
  if (targetIdx === -1) return [...ids];

  const insertIdx = position === 'after' ? targetIdx + 1 : targetIdx;
  remaining.splice(insertIdx, 0, draggedId);
  return remaining;
}

export function sortCategoriesWithPin(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function getVerticalDropPosition(
  clientY: number,
  rect: DOMRect,
): 'before' | 'after' {
  return clientY - rect.top < rect.height / 2 ? 'before' : 'after';
}
