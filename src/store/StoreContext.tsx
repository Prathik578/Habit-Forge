import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type { Habit, Completion, Settings, PersistedState, AppData } from '@/types';
import { loadState, saveState, createEmptyData, validateImportData } from '@/utils/storage';
import { DATA_VERSION, STORAGE_KEY } from '@/constants';
import { generateId, todayString, dateToTimestamp } from '@/utils/dateUtils';
import { isCompletedOn } from '@/utils/habitEngine';

interface StoreContextValue {
  habits: Habit[];
  completions: Completion[];
  settings: Settings;
  today: string;
  saveError: boolean;

  createHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>) => Habit;
  updateHabit: (id: string, data: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  archiveHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
  deleteHabit: (id: string) => void;

  toggleCompletion: (habitId: string, dateStr: string) => void;
  isCompleted: (habitId: string, dateStr: string) => boolean;

  updateSettings: (partial: Partial<Settings>) => void;
  importData: (data: unknown, mode: 'merge' | 'replace') => { success: boolean; errors: string[] };
  clearAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [today] = useState(() => todayString());
  const [saveError, setSaveError] = useState(false);
  const isFirstRender = useRef(true);

  // Persist on every state change (but not initial load)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const ok = saveState(state);
    setSaveError(!ok);
  }, [state]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as PersistedState;
          setState(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: 'light' | 'dark') => {
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    };
    if (state.settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    } else {
      applyTheme(state.settings.theme);
    }
  }, [state.settings.theme]);

  const updateState = useCallback((updater: (prev: PersistedState) => PersistedState) => {
    setState((prev) => updater(prev));
  }, []);

  const createHabit = useCallback((data: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>): Habit => {
    const now = dateToTimestamp();
    const habit: Habit = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    updateState((prev) => ({
      ...prev,
      data: { ...prev.data, habits: [...prev.data.habits, habit] },
    }));
    return habit;
  }, [updateState]);

  const updateHabit = useCallback((id: string, data: Partial<Omit<Habit, 'id' | 'createdAt'>>): void => {
    updateState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        habits: prev.data.habits.map((h) =>
          h.id === id ? { ...h, ...data, updatedAt: dateToTimestamp() } : h,
        ),
      },
    }));
  }, [updateState]);

  const archiveHabit = useCallback((id: string): void => {
    updateState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        habits: prev.data.habits.map((h) =>
          h.id === id ? { ...h, archivedAt: dateToTimestamp(), updatedAt: dateToTimestamp() } : h,
        ),
      },
    }));
  }, [updateState]);

  const restoreHabit = useCallback((id: string): void => {
    updateState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        habits: prev.data.habits.map((h) =>
          h.id === id ? { ...h, archivedAt: null, updatedAt: dateToTimestamp() } : h,
        ),
      },
    }));
  }, [updateState]);

  const deleteHabit = useCallback((id: string): void => {
    updateState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        habits: prev.data.habits.filter((h) => h.id !== id),
        completions: prev.data.completions.filter((c) => c.habitId !== id),
      },
    }));
  }, [updateState]);

  const toggleCompletion = useCallback((habitId: string, dateStr: string): void => {
    updateState((prev) => {
      const exists = prev.data.completions.some(
        (c) => c.habitId === habitId && c.date === dateStr,
      );
      if (exists) {
        return {
          ...prev,
          data: {
            ...prev.data,
            completions: prev.data.completions.filter(
              (c) => !(c.habitId === habitId && c.date === dateStr),
            ),
          },
        };
      }
      const completion: Completion = {
        id: generateId(),
        habitId,
        date: dateStr,
        completedAt: dateToTimestamp(),
      };
      return {
        ...prev,
        data: {
          ...prev.data,
          completions: [...prev.data.completions, completion],
        },
      };
    });
  }, [updateState]);

  const isCompleted = useCallback((habitId: string, dateStr: string): boolean => {
    return isCompletedOn(state.data.completions, habitId, dateStr);
  }, [state.data.completions]);

  const updateSettings = useCallback((partial: Partial<Settings>): void => {
    updateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  }, [updateState]);

  const importData = useCallback((data: unknown, mode: 'merge' | 'replace'): { success: boolean; errors: string[] } => {
    const result = validateImportData(data);
    if (!result.valid) return { success: false, errors: result.errors };
    const imported = data as AppData;

    updateState((prev) => {
      if (mode === 'replace') {
        return {
          ...prev,
          data: {
            version: DATA_VERSION,
            habits: imported.habits,
            completions: imported.completions,
          },
        };
      }
      // Merge: combine habits and completions, dedup by ID
      const habitIds = new Set(prev.data.habits.map((h) => h.id));
      const newHabits = imported.habits.filter((h) => !habitIds.has(h.id));
      const compKeys = new Set(prev.data.completions.map((c) => `${c.habitId}:${c.date}`));
      const newCompletions = imported.completions.filter((c) => {
        const key = `${c.habitId}:${c.date}`;
        if (compKeys.has(key)) return false;
        compKeys.add(key);
        return true;
      });
      return {
        ...prev,
        data: {
          version: DATA_VERSION,
          habits: [...prev.data.habits, ...newHabits],
          completions: [...prev.data.completions, ...newCompletions],
        },
      };
    });
    return { success: true, errors: [] };
  }, [updateState]);

  const clearAll = useCallback((): void => {
    updateState((prev) => ({
      ...prev,
      data: createEmptyData(),
    }));
  }, [updateState]);

  const value: StoreContextValue = {
    habits: state.data.habits,
    completions: state.data.completions,
    settings: state.settings,
    today,
    saveError,
    createHabit,
    updateHabit,
    archiveHabit,
    restoreHabit,
    deleteHabit,
    toggleCompletion,
    isCompleted,
    updateSettings,
    importData,
    clearAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
