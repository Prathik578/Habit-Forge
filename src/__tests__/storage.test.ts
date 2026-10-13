import { describe, it, expect, beforeEach } from 'vitest';
import type { Habit, Completion } from '@/types';
import {
  validateHabit,
  validateCompletion,
  validateAppData,
  validateImportData,
  validateSettings,
  createEmptyData,
  loadState,
  saveState,
  clearAllData,
  exportToJSON,
} from '@/utils/storage';
import { STORAGE_KEY } from '@/constants';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Test Habit',
    icon: 'BookOpen',
    category: 'study',
    color: 'indigo',
    schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    archivedAt: null,
    ...overrides,
  };
}

function makeCompletion(habitId: string, date: string): Completion {
  return {
    id: `${habitId}-${date}`,
    habitId,
    date,
    completedAt: `${date}T12:00:00.000Z`,
  };
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('validateHabit', () => {
    it('validates a correct habit', () => {
      expect(validateHabit(makeHabit())).toBe(true);
    });

    it('rejects empty name', () => {
      expect(validateHabit(makeHabit({ name: '' }))).toBe(false);
    });

    it('rejects name over 60 chars', () => {
      expect(validateHabit(makeHabit({ name: 'x'.repeat(61) }))).toBe(false);
    });

    it('rejects invalid icon', () => {
      expect(validateHabit(makeHabit({ icon: 'NotAnIcon' }))).toBe(false);
    });

    it('rejects invalid category', () => {
      expect(validateHabit(makeHabit({ category: 'invalid' as never }))).toBe(false);
    });

    it('rejects invalid color', () => {
      expect(validateHabit(makeHabit({ color: 'invalid' }))).toBe(false);
    });

    it('rejects empty schedule days', () => {
      expect(validateHabit(makeHabit({ schedule: { type: 'weekdays', days: [] } }))).toBe(false);
    });
  });

  describe('validateCompletion', () => {
    it('validates a correct completion', () => {
      expect(validateCompletion(makeCompletion('h1', '2024-01-15'))).toBe(true);
    });

    it('rejects invalid date format', () => {
      expect(validateCompletion({ ...makeCompletion('h1', '2024-01-15'), date: 'invalid' })).toBe(false);
    });

    it('rejects empty habitId', () => {
      expect(validateCompletion({ ...makeCompletion('h1', '2024-01-15'), habitId: '' })).toBe(false);
    });
  });

  describe('validateAppData', () => {
    it('validates correct data', () => {
      const data = {
        version: 1,
        habits: [makeHabit()],
        completions: [makeCompletion('h1', '2024-01-15')],
      };
      const result = validateAppData(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects duplicate completions', () => {
      const data = {
        version: 1,
        habits: [makeHabit()],
        completions: [
          makeCompletion('h1', '2024-01-15'),
          makeCompletion('h1', '2024-01-15'),
        ],
      };
      const result = validateAppData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
    });

    it('detects completions referencing unknown habits', () => {
      const data = {
        version: 1,
        habits: [makeHabit({ id: 'h1' })],
        completions: [makeCompletion('h2', '2024-01-15')],
      };
      const result = validateAppData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('unknown habit'))).toBe(true);
    });

    it('rejects non-object data', () => {
      const result = validateAppData('not an object');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateImportData', () => {
    it('validates correct import data', () => {
      const data = {
        version: 1,
        habits: [makeHabit()],
        completions: [makeCompletion('h1', '2024-01-15')],
      };
      const result = validateImportData(data);
      expect(result.valid).toBe(true);
    });

    it('rejects missing version', () => {
      const result = validateImportData({ habits: [], completions: [] });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateSettings', () => {
    it('validates correct settings', () => {
      expect(validateSettings({ theme: 'light', weekStart: 'monday' })).toBe(true);
      expect(validateSettings({ theme: 'system', weekStart: 'sunday' })).toBe(true);
      expect(validateSettings({ theme: 'dark', weekStart: 'monday' })).toBe(true);
    });

    it('rejects invalid theme', () => {
      expect(validateSettings({ theme: 'invalid', weekStart: 'sunday' })).toBe(false);
    });

    it('rejects invalid weekStart', () => {
      expect(validateSettings({ theme: 'light', weekStart: 'invalid' })).toBe(false);
    });
  });

  describe('createEmptyData', () => {
    it('creates empty data with the correct version', () => {
      const data = createEmptyData();
      expect(data.version).toBe(1);
      expect(data.habits).toEqual([]);
      expect(data.completions).toEqual([]);
    });
  });

  describe('loadState / saveState', () => {
    it('returns default state when localStorage is empty', () => {
      const state = loadState();
      expect(state.data.habits).toEqual([]);
      expect(state.data.completions).toEqual([]);
      expect(state.settings.theme).toBe('system');
    });

    it('saves and loads state correctly', () => {
      const state = {
        version: 1,
        data: {
          version: 1,
          habits: [makeHabit()],
          completions: [makeCompletion('h1', '2024-01-15')],
        },
        settings: { theme: 'dark' as const, weekStart: 'monday' as const },
      };
      expect(saveState(state)).toBe(true);
      const loaded = loadState();
      expect(loaded.data.habits).toHaveLength(1);
      expect(loaded.data.habits[0].id).toBe('h1');
      expect(loaded.data.completions).toHaveLength(1);
      expect(loaded.settings.theme).toBe('dark');
      expect(loaded.settings.weekStart).toBe('monday');
    });

    it('handles malformed localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json');
      const state = loadState();
      expect(state.data.habits).toEqual([]);
      expect(state.data.completions).toEqual([]);
    });

    it('salvages valid habits from partially corrupt data', () => {
      const data = {
        version: 1,
        habits: [makeHabit(), { ...makeHabit({ id: 'h2' }), icon: 'InvalidIcon' }],
        completions: [makeCompletion('h1', '2024-01-15')],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        data,
        settings: { theme: 'system', weekStart: 'sunday' },
      }));
      const state = loadState();
      // Should salvage the valid habit h1, discard h2
      expect(state.data.habits).toHaveLength(1);
      expect(state.data.habits[0].id).toBe('h1');
    });
  });

  describe('clearAllData', () => {
    it('removes the storage key', () => {
      saveState({
        version: 1,
        data: { version: 1, habits: [makeHabit()], completions: [] },
        settings: { theme: 'system', weekStart: 'sunday' },
      });
      expect(clearAllData()).toBe(true);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('exportToJSON', () => {
    it('exports state as JSON string', () => {
      const state = {
        version: 1,
        data: createEmptyData(),
        settings: { theme: 'system' as const, weekStart: 'sunday' as const },
      };
      const json = exportToJSON(state);
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe(1);
      expect(parsed.data.habits).toEqual([]);
    });
  });
});
