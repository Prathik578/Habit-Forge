import type { Habit, Completion, Schedule, Weekday } from '@/types';
import {
  weekdayOf,
  isSameOrBefore,
  isAfter,
  isBefore,
  addDays,
} from '@/utils/dateUtils';

export function isScheduledOn(habit: Habit, dateStr: string): boolean {
  if (habit.archivedAt) {
    const archivedDateStr = habit.archivedAt.slice(0, 10);
    if (isAfter(dateStr, archivedDateStr) || dateStr === archivedDateStr) {
      return false;
    }
  }
  const createdDateStr = habit.createdAt.slice(0, 10);
  if (isBefore(dateStr, createdDateStr)) return false;
  const wd = weekdayOf(dateStr);
  return habit.schedule.days.includes(wd);
}

export function isScheduledOnIgnoringArchive(habit: Habit, dateStr: string): boolean {
  const createdDateStr = habit.createdAt.slice(0, 10);
  if (isBefore(dateStr, createdDateStr)) return false;
  const wd = weekdayOf(dateStr);
  return habit.schedule.days.includes(wd);
}

export function getCompletionsForHabitOnDate(
  completions: Completion[],
  habitId: string,
  dateStr: string,
): Completion[] {
  return completions.filter((c) => c.habitId === habitId && c.date === dateStr);
}

export function isCompletedOn(
  completions: Completion[],
  habitId: string,
  dateStr: string,
): boolean {
  return completions.some((c) => c.habitId === habitId && c.date === dateStr);
}

export function getCompletionDatesForHabit(
  completions: Completion[],
  habitId: string,
): Set<string> {
  const set = new Set<string>();
  for (const c of completions) {
    if (c.habitId === habitId) set.add(c.date);
  }
  return set;
}

export function getActiveHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => h.archivedAt === null);
}

export function getArchivedHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => h.archivedAt !== null);
}

export function getHabitsScheduledOn(
  habits: Habit[],
  completions: Completion[],
  dateStr: string,
): Habit[] {
  return getActiveHabits(habits).filter((h) => isScheduledOn(h, dateStr));
}

export function getCompletedHabitsOn(
  habits: Habit[],
  completions: Completion[],
  dateStr: string,
): Habit[] {
  const scheduled = getHabitsScheduledOn(habits, completions, dateStr);
  return scheduled.filter((h) => isCompletedOn(completions, h.id, dateStr));
}

export function getTodaysCompletionRate(
  habits: Habit[],
  completions: Completion[],
  today: string,
): number {
  const scheduled = getHabitsScheduledOn(habits, completions, today);
  if (scheduled.length === 0) return 0;
  const done = scheduled.filter((h) => isCompletedOn(completions, h.id, today)).length;
  return Math.round((done / scheduled.length) * 100);
}

function findLastScheduledDate(
  habit: Habit,
  upToAndIncluding: string,
  includeArchive = false,
): string | null {
  let current = upToAndIncluding;
  let guard = 0;
  while (guard < 366 * 5) {
    const scheduled = includeArchive
      ? isScheduledOnIgnoringArchive(habit, current)
      : isScheduledOn(habit, current);
    if (scheduled) return current;
    const createdDateStr = habit.createdAt.slice(0, 10);
    if (isBefore(current, createdDateStr)) return null;
    current = addDays(current, -1);
    guard++;
  }
  return null;
}

export function findNextScheduledDate(
  habit: Habit,
  fromDate: string,
): string | null {
  let current = fromDate;
  let guard = 0;
  while (guard < 366) {
    if (isScheduledOn(habit, current)) return current;
    current = addDays(current, 1);
    guard++;
  }
  return null;
}

export function calculateCurrentStreak(
  habit: Habit,
  completions: Completion[],
  today: string,
): number {
  const completionDates = getCompletionDatesForHabit(completions, habit.id);

  // Find the anchor date: the most recent scheduled occurrence that should have already happened
  let anchorDate: string | null;

  if (isScheduledOn(habit, today)) {
    // Today is scheduled — anchor at today
    anchorDate = today;
  } else {
    // Today not scheduled — find the last scheduled day up to today
    anchorDate = findLastScheduledDate(habit, today);
  }

  if (anchorDate === null) return 0;

  // If the anchor is today and today is not yet completed, don't break the streak yet
  // — count from the previous scheduled occurrence
  let countFrom = anchorDate;

  if (anchorDate === today && !completionDates.has(today)) {
    // Today is scheduled but incomplete — start counting from the previous scheduled day
    const prevScheduled = findLastScheduledDate(habit, addDays(today, -1));
    if (prevScheduled === null) return 0;
    countFrom = prevScheduled;
  }

  // Walk backward from countFrom through scheduled occurrences
  let streak = 0;
  let current = countFrom;
  let guard = 0;

  while (guard < 366 * 5) {
    if (isScheduledOn(habit, current)) {
      if (completionDates.has(current)) {
        streak++;
        const prev = findLastScheduledDate(habit, addDays(current, -1));
        if (prev === null) break;
        current = prev;
      } else {
        break;
      }
    } else {
      current = addDays(current, -1);
    }
    guard++;
  }

  return streak;
}

export function calculateLongestStreak(
  habit: Habit,
  completions: Completion[],
  today: string,
): number {
  const completionDates = getCompletionDatesForHabit(completions, habit.id);
  if (completionDates.size === 0) return 0;

  const createdDateStr = habit.createdAt.slice(0, 10);

  // Determine the end boundary: today or the archived date
  let endDate = today;
  if (habit.archivedAt) {
    const archivedDateStr = habit.archivedAt.slice(0, 10);
    endDate = isBefore(archivedDateStr, today) ? archivedDateStr : today;
  }

  // Walk from createdAt to endDate through all scheduled occurrences
  let longest = 0;
  let current = 0;
  let cursor = createdDateStr;
  let guard = 0;

  while (isSameOrBefore(cursor, endDate) && guard < 366 * 10) {
    if (isScheduledOnIgnoringArchive(habit, cursor)) {
      if (completionDates.has(cursor)) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 0;
      }
    }
    cursor = addDays(cursor, 1);
    guard++;
  }

  return longest;
}

export function getBestStreak(
  habits: Habit[],
  completions: Completion[],
  today: string,
): { habit: Habit; streak: number } | null {
  let best: { habit: Habit; streak: number } | null = null;
  for (const habit of getActiveHabits(habits)) {
    const longest = calculateLongestStreak(habit, completions, today);
    const current = calculateCurrentStreak(habit, completions, today);
    const streak = Math.max(longest, current);
    if (best === null || streak > best.streak) {
      best = { habit, streak };
    }
  }
  return best;
}

export function getEligibleScheduledDates(
  habit: Habit,
  startDate: string,
  endDate: string,
): string[] {
  const result: string[] = [];
  let cursor = startDate;
  let guard = 0;

  while (isSameOrBefore(cursor, endDate) && guard < 366 * 2) {
    if (isScheduledOn(habit, cursor)) {
      result.push(cursor);
    }
    cursor = addDays(cursor, 1);
    guard++;
  }

  return result;
}

export function getCompletedScheduledDates(
  habit: Habit,
  completions: Completion[],
  startDate: string,
  endDate: string,
): string[] {
  const eligible = getEligibleScheduledDates(habit, startDate, endDate);
  const completionDates = getCompletionDatesForHabit(completions, habit.id);
  return eligible.filter((d) => completionDates.has(d));
}

export function getHabitCompletionRate(
  habit: Habit,
  completions: Completion[],
  startDate: string,
  endDate: string,
): { rate: number; completed: number; eligible: number } {
  const eligible = getEligibleScheduledDates(habit, startDate, endDate);
  const completionDates = getCompletionDatesForHabit(completions, habit.id);
  const completed = eligible.filter((d) => completionDates.has(d)).length;
  const rate = eligible.length === 0 ? 0 : Math.round((completed / eligible.length) * 100);
  return { rate, completed, eligible: eligible.length };
}

export function createSchedule(type: 'daily' | 'weekdays', days?: Weekday[]): Schedule {
  if (type === 'daily') {
    return { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] };
  }
  return { type: 'weekdays', days: days ?? [1, 2, 3, 4, 5] };
}

export function scheduleLabel(habit: Habit): string {
  if (habit.schedule.type === 'daily') return 'Every day';
  const days = habit.schedule.days;
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && days.includes(1) && days.includes(2) && days.includes(3) && days.includes(4) && days.includes(5) && !days.includes(0) && !days.includes(6)) {
    return 'Weekdays';
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends';
  }
  if (days.length === 0) return 'No days selected';
  const labels: Record<Weekday, string> = {
    0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
  };
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map((d) => labels[d]).join(', ');
}

export function getTotalCompletions(
  completions: Completion[],
  habitId: string,
): number {
  return completions.filter((c) => c.habitId === habitId).length;
}
