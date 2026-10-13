import { describe, it, expect } from 'vitest';
import type { Habit, Completion } from '@/types';
import {
  isScheduledOn,
  isCompletedOn,
  calculateCurrentStreak,
  calculateLongestStreak,
  getHabitsScheduledOn,
  getTodaysCompletionRate,
  scheduleLabel,
  getActiveHabits,
  getArchivedHabits,
} from '@/utils/habitEngine';

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

function makeCompletion(habitId: string, date: string, id?: string): Completion {
  return {
    id: id ?? `${habitId}-${date}`,
    habitId,
    date,
    completedAt: `${date}T12:00:00.000Z`,
  };
}

describe('habitEngine', () => {
  describe('isScheduledOn', () => {
    it('returns true for any day when schedule is daily', () => {
      const habit = makeHabit();
      for (let i = 0; i < 7; i++) {
        const date = addDaysStr('2024-01-14', i); // Sunday through Saturday
        expect(isScheduledOn(habit, date)).toBe(true);
      }
    });

    it('returns true only on selected weekdays', () => {
      const habit = makeHabit({
        schedule: { type: 'weekdays', days: [1, 3, 5] }, // Mon, Wed, Fri
      });
      expect(isScheduledOn(habit, '2024-01-15')).toBe(true); // Monday
      expect(isScheduledOn(habit, '2024-01-16')).toBe(false); // Tuesday
      expect(isScheduledOn(habit, '2024-01-17')).toBe(true); // Wednesday
      expect(isScheduledOn(habit, '2024-01-18')).toBe(false); // Thursday
      expect(isScheduledOn(habit, '2024-01-19')).toBe(true); // Friday
      expect(isScheduledOn(habit, '2024-01-20')).toBe(false); // Saturday
      expect(isScheduledOn(habit, '2024-01-21')).toBe(false); // Sunday
    });

    it('returns false for dates before the habit was created', () => {
      const habit = makeHabit({ createdAt: '2024-06-01T00:00:00.000Z' });
      expect(isScheduledOn(habit, '2024-05-31')).toBe(false);
      expect(isScheduledOn(habit, '2024-06-01')).toBe(true);
    });

    it('returns false for dates on or after the habit was archived', () => {
      const habit = makeHabit({ archivedAt: '2024-06-10T00:00:00.000Z' });
      expect(isScheduledOn(habit, '2024-06-09')).toBe(true);
      expect(isScheduledOn(habit, '2024-06-10')).toBe(false);
      expect(isScheduledOn(habit, '2024-06-11')).toBe(false);
    });
  });

  describe('isCompletedOn', () => {
    it('returns true when a completion exists', () => {
      const completions = [makeCompletion('h1', '2024-01-15')];
      expect(isCompletedOn(completions, 'h1', '2024-01-15')).toBe(true);
      expect(isCompletedOn(completions, 'h1', '2024-01-16')).toBe(false);
    });
  });

  describe('calculateCurrentStreak', () => {
    it('returns 0 when there are no completions', () => {
      const habit = makeHabit();
      expect(calculateCurrentStreak(habit, [], '2024-01-15')).toBe(0);
    });

    it('returns 0 when habit was created today and no completion', () => {
      const habit = makeHabit({ createdAt: '2024-01-15T08:00:00.000Z' });
      expect(calculateCurrentStreak(habit, [], '2024-01-15')).toBe(0);
    });

    it('counts a streak on a completed day (daily schedule)', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      const completions = [
        makeCompletion('h1', '2024-01-13'),
        makeCompletion('h1', '2024-01-14'),
        makeCompletion('h1', '2024-01-15'),
      ];
      expect(calculateCurrentStreak(habit, completions, '2024-01-15')).toBe(3);
    });

    it('does not break the streak when today is scheduled but not yet completed', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      const completions = [
        makeCompletion('h1', '2024-01-13'),
        makeCompletion('h1', '2024-01-14'),
      ];
      // Today (2024-01-15) is scheduled but not completed
      expect(calculateCurrentStreak(habit, completions, '2024-01-15')).toBe(2);
    });

    it('breaks the streak when a scheduled day was missed (yesterday)', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      const completions = [
        makeCompletion('h1', '2024-01-12'),
        makeCompletion('h1', '2024-01-13'),
        // Jan 14 missed
        makeCompletion('h1', '2024-01-15'),
      ];
      // Yesterday (Jan 14) was missed. Today (Jan 15) is completed.
      // The streak should be 1 (just today), since Jan 14 breaks it.
      expect(calculateCurrentStreak(habit, completions, '2024-01-15')).toBe(1);
    });

    it('counts streak across unscheduled days (MWF schedule)', () => {
      const habit = makeHabit({
        schedule: { type: 'weekdays', days: [1, 3, 5] }, // Mon, Wed, Fri
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      // 2024-01-15 = Mon, 2024-01-17 = Wed, 2024-01-19 = Fri
      const completions = [
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h1', '2024-01-17'),
        makeCompletion('h1', '2024-01-19'),
      ];
      expect(calculateCurrentStreak(habit, completions, '2024-01-19')).toBe(3);
    });

    it('counts streak across unscheduled days when today is not scheduled', () => {
      const habit = makeHabit({
        schedule: { type: 'weekdays', days: [1, 3, 5] }, // Mon, Wed, Fri
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      // 2024-01-15 = Mon, 2024-01-17 = Wed, 2024-01-19 = Fri
      // Today is Saturday (2024-01-20), not scheduled
      const completions = [
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h1', '2024-01-17'),
        makeCompletion('h1', '2024-01-19'),
      ];
      expect(calculateCurrentStreak(habit, completions, '2024-01-20')).toBe(3);
    });

    it('breaks the streak when a scheduled day is missed in a MWF schedule', () => {
      const habit = makeHabit({
        schedule: { type: 'weekdays', days: [1, 3, 5] },
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      // Mon Jan 15 completed, Wed Jan 17 missed, Fri Jan 19 completed
      const completions = [
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h1', '2024-01-19'),
      ];
      // Today is Fri Jan 19 — streak should be 1 since Wed was missed
      expect(calculateCurrentStreak(habit, completions, '2024-01-19')).toBe(1);
    });

    it('handles habit created partway through a week', () => {
      // Created on Wednesday Jan 17, scheduled MWF
      const habit = makeHabit({
        schedule: { type: 'weekdays', days: [1, 3, 5] },
        createdAt: '2024-01-17T08:00:00.000Z',
      });
      // Wed Jan 17 completed, Fri Jan 19 completed
      const completions = [
        makeCompletion('h1', '2024-01-17'),
        makeCompletion('h1', '2024-01-19'),
      ];
      expect(calculateCurrentStreak(habit, completions, '2024-01-19')).toBe(2);
    });

    it('does not count dates before the habit was created', () => {
      const habit = makeHabit({
        createdAt: '2024-01-15T00:00:00.000Z',
      });
      const completions = [
        makeCompletion('h1', '2024-01-14'), // before creation — shouldn't count
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h1', '2024-01-16'),
      ];
      expect(calculateCurrentStreak(habit, completions, '2024-01-16')).toBe(2);
    });

    it('handles undoing a completion in the middle of a streak', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      // Completed Jan 13, 14, 15, 16, then undo Jan 14
      const completions = [
        makeCompletion('h1', '2024-01-13'),
        // Jan 14 undone (not present)
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h1', '2024-01-16'),
      ];
      // Today is Jan 16. Streak should be 2 (Jan 15, 16) since Jan 14 breaks it
      expect(calculateCurrentStreak(habit, completions, '2024-01-16')).toBe(2);
    });

    it('handles month boundary in streak', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      const completions = [
        makeCompletion('h1', '2024-01-30'),
        makeCompletion('h1', '2024-01-31'),
        makeCompletion('h1', '2024-02-01'),
        makeCompletion('h1', '2024-02-02'),
      ];
      expect(calculateCurrentStreak(habit, completions, '2024-02-02')).toBe(4);
    });

    it('handles year boundary in streak', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      const completions = [
        makeCompletion('h1', '2024-12-30'),
        makeCompletion('h1', '2024-12-31'),
        makeCompletion('h1', '2025-01-01'),
        makeCompletion('h1', '2025-01-02'),
      ];
      expect(calculateCurrentStreak(habit, completions, '2025-01-02')).toBe(4);
    });

    it('handles leap day in streak', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      const completions = [
        makeCompletion('h1', '2024-02-28'),
        makeCompletion('h1', '2024-02-29'),
        makeCompletion('h1', '2024-03-01'),
      ];
      expect(calculateCurrentStreak(habit, completions, '2024-03-01')).toBe(3);
    });

    it('handles archived habit streak', () => {
      const habit = makeHabit({
        createdAt: '2024-01-01T00:00:00.000Z',
        archivedAt: '2024-01-20T00:00:00.000Z',
      });
      // Archived on Jan 20. Last completion Jan 19.
      const completions = [
        makeCompletion('h1', '2024-01-17'),
        makeCompletion('h1', '2024-01-18'),
        makeCompletion('h1', '2024-01-19'),
      ];
      // Today is after archival — the streak should still count the historical run
      expect(calculateCurrentStreak(habit, completions, '2024-01-25')).toBe(3);
    });

    it('handles today not scheduled with no prior completions', () => {
      const habit = makeHabit({
        schedule: { type: 'weekdays', days: [1, 3, 5] },
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      // Today is Saturday
      expect(calculateCurrentStreak(habit, [], '2024-01-20')).toBe(0);
    });

    it('handles long streak without溢出', () => {
      const habit = makeHabit({ createdAt: '2023-01-01T00:00:00.000Z' });
      const completions: Completion[] = [];
      for (let i = 0; i < 100; i++) {
        completions.push(makeCompletion('h1', addDaysStr('2024-01-01', i)));
      }
      expect(calculateCurrentStreak(habit, completions, '2024-04-09')).toBe(100);
    });
  });

  describe('calculateLongestStreak', () => {
    it('returns 0 for no completions', () => {
      const habit = makeHabit();
      expect(calculateLongestStreak(habit, [], '2024-01-15')).toBe(0);
    });

    it('returns the longest consecutive completed scheduled occurrences', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      // 5-day streak, miss, then 3-day streak
      const completions = [
        ...['2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13', '2024-01-14'].map((d) => makeCompletion('h1', d)),
        // Jan 15 missed
        ...['2024-01-16', '2024-01-17', '2024-01-18'].map((d) => makeCompletion('h1', d)),
      ];
      expect(calculateLongestStreak(habit, completions, '2024-01-18')).toBe(5);
    });

    it('counts longest streak across unscheduled days (MWF)', () => {
      const habit = makeHabit({
        schedule: { type: 'weekdays', days: [1, 3, 5] },
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      // Mon Jan 8, Wed Jan 10, Fri Jan 12 = 3 streak
      // Mon Jan 15 missed
      // Mon Jan 22, Wed Jan 24, Fri Jan 26, Mon Jan 29 = 4 streak
      const completions = [
        makeCompletion('h1', '2024-01-08'),
        makeCompletion('h1', '2024-01-10'),
        makeCompletion('h1', '2024-01-12'),
        // Jan 15 missed
        makeCompletion('h1', '2024-01-22'),
        makeCompletion('h1', '2024-01-24'),
        makeCompletion('h1', '2024-01-26'),
        makeCompletion('h1', '2024-01-29'),
      ];
      expect(calculateLongestStreak(habit, completions, '2024-01-29')).toBe(4);
    });

    it('does not count completions before habit creation', () => {
      const habit = makeHabit({ createdAt: '2024-01-10T00:00:00.000Z' });
      const completions = [
        makeCompletion('h1', '2024-01-08'),
        makeCompletion('h1', '2024-01-09'),
        makeCompletion('h1', '2024-01-10'),
        makeCompletion('h1', '2024-01-11'),
      ];
      // Jan 8 and 9 are before creation — only 10, 11 count
      expect(calculateLongestStreak(habit, completions, '2024-01-15')).toBe(2);
    });

    it('handles streak with current run being the longest', () => {
      const habit = makeHabit({ createdAt: '2024-01-01T00:00:00.000Z' });
      const completions = [
        makeCompletion('h1', '2024-01-10'),
        // Jan 11 missed
        makeCompletion('h1', '2024-01-12'),
        makeCompletion('h1', '2024-01-13'),
        makeCompletion('h1', '2024-01-14'),
        makeCompletion('h1', '2024-01-15'),
      ];
      expect(calculateLongestStreak(habit, completions, '2024-01-15')).toBe(4);
    });

    it('handles archived habit longest streak', () => {
      const habit = makeHabit({
        createdAt: '2024-01-01T00:00:00.000Z',
        archivedAt: '2024-01-20T00:00:00.000Z',
      });
      const completions = [
        makeCompletion('h1', '2024-01-10'),
        makeCompletion('h1', '2024-01-11'),
        makeCompletion('h1', '2024-01-12'),
        makeCompletion('h1', '2024-01-13'),
        makeCompletion('h1', '2024-01-14'),
      ];
      expect(calculateLongestStreak(habit, completions, '2024-06-01')).toBe(5);
    });
  });

  describe('getHabitsScheduledOn', () => {
    it('returns only active habits scheduled on the given date', () => {
      const habits = [
        makeHabit({ id: 'h1', schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] } }),
        makeHabit({ id: 'h2', schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] } }),
        makeHabit({ id: 'h3', archivedAt: '2024-01-10T00:00:00.000Z', schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] } }),
      ];
      // Jan 15 is Monday
      const scheduled = getHabitsScheduledOn(habits, [], '2024-01-15');
      expect(scheduled.map((h) => h.id).sort()).toEqual(['h1', 'h2']);
    });

    it('excludes habits not scheduled on a weekend', () => {
      const habits = [
        makeHabit({ id: 'h1', schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] } }),
      ];
      // Jan 20 is Saturday
      expect(getHabitsScheduledOn(habits, [], '2024-01-20')).toHaveLength(0);
    });
  });

  describe('getTodaysCompletionRate', () => {
    it('returns 0 when no habits are scheduled', () => {
      expect(getTodaysCompletionRate([], [], '2024-01-15')).toBe(0);
    });

    it('calculates the completion rate', () => {
      const habits = [
        makeHabit({ id: 'h1' }),
        makeHabit({ id: 'h2' }),
        makeHabit({ id: 'h3' }),
      ];
      const completions = [
        makeCompletion('h1', '2024-01-15'),
        makeCompletion('h2', '2024-01-15'),
      ];
      expect(getTodaysCompletionRate(habits, completions, '2024-01-15')).toBe(67);
    });
  });

  describe('scheduleLabel', () => {
    it('returns "Every day" for daily schedule', () => {
      expect(scheduleLabel(makeHabit())).toBe('Every day');
    });

    it('returns "Weekdays" for Mon-Fri', () => {
      expect(scheduleLabel(makeHabit({ schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] } }))).toBe('Weekdays');
    });

    it('returns "Weekends" for Sat-Sun', () => {
      expect(scheduleLabel(makeHabit({ schedule: { type: 'weekdays', days: [0, 6] } }))).toBe('Weekends');
    });

    it('returns custom day labels for other combinations', () => {
      expect(scheduleLabel(makeHabit({ schedule: { type: 'weekdays', days: [1, 3, 5] } }))).toBe('Mon, Wed, Fri');
    });
  });

  describe('getActiveHabits / getArchivedHabits', () => {
    it('separates active and archived habits', () => {
      const habits = [
        makeHabit({ id: 'h1' }),
        makeHabit({ id: 'h2', archivedAt: '2024-06-01T00:00:00.000Z' }),
      ];
      expect(getActiveHabits(habits)).toHaveLength(1);
      expect(getActiveHabits(habits)[0].id).toBe('h1');
      expect(getArchivedHabits(habits)).toHaveLength(1);
      expect(getArchivedHabits(habits)[0].id).toBe('h2');
    });
  });
});

function addDaysStr(s: string, n: number): string {
  const d = new Date(s);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
