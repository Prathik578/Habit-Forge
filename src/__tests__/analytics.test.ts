import { describe, it, expect } from 'vitest';
import type { Habit, Completion } from '@/types';
import {
  getOverallStats,
  getHabitStats,
  getMostConsistentHabits,
  getScheduledVsCompleted,
  getDailyActivity,
} from '@/utils/analytics';

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

describe('analytics', () => {
  describe('getOverallStats', () => {
    it('returns 0 rate when no habits are scheduled', () => {
      const stats = getOverallStats([], [], '2024-01-01', '2024-01-07');
      expect(stats.completionRate).toBe(0);
      expect(stats.eligible).toBe(0);
      expect(stats.completed).toBe(0);
    });

    it('calculates the overall completion rate correctly', () => {
      const habits = [makeHabit({ id: 'h1' })];
      const completions = [
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h1', '2024-01-16'),
        // Jan 17 missed
      ];
      const stats = getOverallStats(habits, completions, '2024-01-15', '2024-01-17');
      expect(stats.eligible).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.completionRate).toBe(67);
    });

    it('excludes unscheduled dates from the denominator', () => {
      const habits = [
        makeHabit({ id: 'h1', schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] } }),
      ];
      // Jan 13-14 is Sat-Sun, not scheduled
      // Jan 15-17 is Mon-Wed, scheduled
      const completions = [
        makeCompletion('h1', '2024-01-15'),
      ];
      const stats = getOverallStats(habits, completions, '2024-01-13', '2024-01-17');
      // Only 3 eligible (Mon, Tue, Wed), 1 completed
      expect(stats.eligible).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.completionRate).toBe(33);
    });

    it('handles zero eligible occurrences', () => {
      const habits = [
        makeHabit({ id: 'h1', schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] } }),
      ];
      // Jan 13-14 is Sat-Sun, not scheduled
      const stats = getOverallStats(habits, [], '2024-01-13', '2024-01-14');
      expect(stats.eligible).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe('getHabitStats', () => {
    it('calculates per-habit stats', () => {
      const habits = [
        makeHabit({ id: 'h1' }),
        makeHabit({ id: 'h2', schedule: { type: 'weekdays', days: [1, 3, 5] } }),
      ];
      const completions = [
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h1', '2024-01-16'),
        makeCompletion('h2', '2024-01-15'),
        makeCompletion('h2', '2024-01-17'),
      ];
      const stats = getHabitStats(habits, completions, '2024-01-15', '2024-01-19', '2024-01-19');
      const h1 = stats.find((s) => s.habitId === 'h1');
      const h2 = stats.find((s) => s.habitId === 'h2');
      expect(h1).toBeDefined();
      expect(h1!.eligible).toBe(5); // Mon-Fri, daily
      expect(h1!.completed).toBe(2);
      expect(h2).toBeDefined();
      expect(h2!.eligible).toBe(3); // Mon, Wed, Fri
      expect(h2!.completed).toBe(2);
    });
  });

  describe('getMostConsistentHabits', () => {
    it('returns the habits with the highest completion rates', () => {
      const habits = [
        makeHabit({ id: 'h1' }),
        makeHabit({ id: 'h2' }),
      ];
      const completions = [
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h1', '2024-01-16'),
        makeCompletion('h2', '2024-01-15'),
      ];
      const result = getMostConsistentHabits(habits, completions, '2024-01-15', '2024-01-17', '2024-01-17');
      expect(result[0].habitId).toBe('h1');
    });
  });

  describe('getScheduledVsCompleted', () => {
    it('compares scheduled vs completed', () => {
      const habits = [makeHabit({ id: 'h1' })];
      const completions = [
        makeCompletion('h1', '2024-01-15'),
      ];
      const result = getScheduledVsCompleted(habits, completions, '2024-01-15', '2024-01-17');
      expect(result.scheduled).toBe(3);
      expect(result.completed).toBe(1);
      expect(result.missed).toBe(2);
    });
  });

  describe('getDailyActivity', () => {
    it('returns activity for each day in the range', () => {
      const habits = [makeHabit({ id: 'h1' })];
      const completions = [makeCompletion('h1', '2024-01-15')];
      const activity = getDailyActivity(habits, completions, '2024-01-15', '2024-01-17');
      expect(activity.size).toBe(3);
      expect(activity.get('2024-01-15')?.completed).toBe(1);
      expect(activity.get('2024-01-15')?.scheduled).toBe(1);
      expect(activity.get('2024-01-16')?.completed).toBe(0);
      expect(activity.get('2024-01-16')?.scheduled).toBe(1);
    });
  });
});
