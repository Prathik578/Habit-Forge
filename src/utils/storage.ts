import type {
  Habit,
  Completion,
  AppData,
  Settings,
  PersistedState,
  ValidationResult,
} from '@/types';
import {
  STORAGE_KEY,
  DATA_VERSION,
  ICON_IDS,
  COLORS,
  CATEGORIES,
  VALID_WEEKDAYS,
} from '@/constants';
import { isValidDateString } from '@/utils/dateUtils';

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateHabit(h: unknown): h is Habit {
  if (!isObject(h)) return false;
  if (typeof h.id !== 'string' || h.id.length === 0) return false;
  if (typeof h.name !== 'string' || h.name.length === 0 || h.name.length > 60) return false;
  if (h.description !== undefined && h.description !== null && typeof h.description !== 'string') return false;
  if (typeof h.icon !== 'string' || !ICON_IDS.includes(h.icon)) return false;
  if (typeof h.category !== 'string' || !CATEGORIES.some((c) => c.id === h.category)) return false;
  if (typeof h.color !== 'string' || !COLORS.some((c) => c.id === h.color)) return false;
  if (!isObject(h.schedule)) return false;
  if (h.schedule.type !== 'daily' && h.schedule.type !== 'weekdays') return false;
  if (!Array.isArray(h.schedule.days)) return false;
  if (!h.schedule.days.every((d: unknown) => typeof d === 'number' && VALID_WEEKDAYS.has(d))) return false;
  if (h.schedule.days.length === 0) return false;
  if (typeof h.createdAt !== 'string') return false;
  if (typeof h.updatedAt !== 'string') return false;
  if (h.archivedAt !== null && h.archivedAt !== undefined && typeof h.archivedAt !== 'string') return false;
  if (h.target !== undefined && h.target !== null && typeof h.target !== 'string') return false;
  return true;
}

export function validateCompletion(c: unknown): c is Completion {
  if (!isObject(c)) return false;
  if (typeof c.id !== 'string' || c.id.length === 0) return false;
  if (typeof c.habitId !== 'string' || c.habitId.length === 0) return false;
  if (typeof c.date !== 'string' || !isValidDateString(c.date)) return false;
  if (typeof c.completedAt !== 'string') return false;
  return true;
}

export function validateAppData(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(data)) {
    return { valid: false, errors: ['Data is not an object'] };
  }
  if (typeof data.version !== 'number') errors.push('Missing or invalid version');
  if (!Array.isArray(data.habits)) {
    errors.push('Missing or invalid habits array');
    return { valid: false, errors };
  }
  if (!Array.isArray(data.completions)) {
    errors.push('Missing or invalid completions array');
    return { valid: false, errors };
  }

  const habitIds = new Set<string>();
  for (let i = 0; i < data.habits.length; i++) {
    if (!validateHabit(data.habits[i])) {
      errors.push(`Invalid habit at index ${i}`);
    } else {
      habitIds.add((data.habits[i] as Habit).id);
    }
  }

  const seen = new Set<string>();
  for (let i = 0; i < data.completions.length; i++) {
    const c = data.completions[i];
    if (!validateCompletion(c)) {
      errors.push(`Invalid completion at index ${i}`);
    } else {
      const comp = c as Completion;
      if (!habitIds.has(comp.habitId)) {
        errors.push(`Completion at index ${i} references unknown habit ${comp.habitId}`);
      }
      const key = `${comp.habitId}:${comp.date}`;
      if (seen.has(key)) {
        errors.push(`Duplicate completion for habit ${comp.habitId} on ${comp.date}`);
      }
      seen.add(key);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateImportData(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return { valid: false, errors: ['Imported data is not an object'] };
  }
  if (typeof data.version !== 'number') {
    return { valid: false, errors: ['Missing or invalid version field'] };
  }
  return validateAppData(data);
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  weekStart: 'sunday',
};

export function validateSettings(s: unknown): s is Settings {
  if (!isObject(s)) return false;
  if (s.theme !== 'system' && s.theme !== 'light' && s.theme !== 'dark') return false;
  if (s.weekStart !== 'sunday' && s.weekStart !== 'monday') return false;
  return true;
}

export function createEmptyData(): AppData {
  return { version: DATA_VERSION, habits: [], completions: [] };
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        version: DATA_VERSION,
        data: createEmptyData(),
        settings: { ...DEFAULT_SETTINGS },
      };
    }
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) throw new Error('Invalid persisted state');
    const data = isObject(parsed.data) ? parsed.data : createEmptyData();
    const result = validateAppData(data);
    if (!result.valid) {
      // Try to salvage valid habits and completions
      const validHabits = Array.isArray(data.habits) ? (data.habits as unknown[]).filter(validateHabit) : [];
      const habitIds = new Set(validHabits.map((h) => h.id));
      const seen = new Set<string>();
      const validCompletions: Completion[] = Array.isArray(data.completions)
        ? (data.completions as unknown[]).filter((c): c is Completion => {
            if (!validateCompletion(c)) return false;
            const comp = c;
            if (!habitIds.has(comp.habitId)) return false;
            const key = `${comp.habitId}:${comp.date}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
        : [];
      return {
        version: DATA_VERSION,
        data: { version: DATA_VERSION, habits: validHabits, completions: validCompletions },
        settings: validateSettings(parsed.settings) ? parsed.settings : { ...DEFAULT_SETTINGS },
      };
    }
    const settings = validateSettings(parsed.settings) ? parsed.settings : { ...DEFAULT_SETTINGS };
    return {
      version: DATA_VERSION,
      data: data as unknown as AppData,
      settings,
    };
  } catch {
    return {
      version: DATA_VERSION,
      data: createEmptyData(),
      settings: { ...DEFAULT_SETTINGS },
    };
  }
}

export function saveState(state: PersistedState): boolean {
  try {
    const raw = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

export function clearAllData(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function exportToJSON(state: PersistedState): string {
  return JSON.stringify(state, null, 2);
}
