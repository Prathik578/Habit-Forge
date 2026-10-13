import type { Habit, Completion } from '@/types';
import {
  isScheduledOn,
  isCompletedOn,
  calculateCurrentStreak,
  calculateLongestStreak,
  getActiveHabits,
} from '@/utils/habitEngine';
import { addDays, isSameOrBefore, enumerateDates, startOfWeek, endOfWeek } from '@/utils/dateUtils';

export interface OverallStats {
  completionRate: number;
  completed: number;
  eligible: number;
}

export interface WeeklyTrendPoint {
  weekStart: string;
  weekEnd: string;
  label: string;
  rate: number;
  completed: number;
  eligible: number;
}

export interface HabitStat {
  habitId: string;
  name: string;
  icon: string;
  color: string;
  completionRate: number;
  completed: number;
  eligible: number;
  currentStreak: number;
  longestStreak: number;
}

export function getOverallStats(
  habits: Habit[],
  completions: Completion[],
  startDate: string,
  endDate: string,
): OverallStats {
  let completed = 0;
  let eligible = 0;
  for (const habit of getActiveHabits(habits)) {
    let cursor = startDate;
    let guard = 0;
    while (isSameOrBefore(cursor, endDate) && guard < 366 * 2) {
      if (isScheduledOn(habit, cursor)) {
        eligible++;
        if (isCompletedOn(completions, habit.id, cursor)) completed++;
      }
      cursor = addDays(cursor, 1);
      guard++;
    }
  }
  const rate = eligible === 0 ? 0 : Math.round((completed / eligible) * 100);
  return { completionRate: rate, completed, eligible };
}

export function getWeeklyTrend(
  habits: Habit[],
  completions: Completion[],
  startDate: string,
  endDate: string,
  weekStart: 'sunday' | 'monday',
): WeeklyTrendPoint[] {
  const points: WeeklyTrendPoint[] = [];
  let cursor = startOfWeek(startDate, weekStart);
  let guard = 0;
  while (isSameOrBefore(cursor, endDate) && guard < 200) {
    const wEnd = endOfWeek(cursor, weekStart);
    const stats = getOverallStats(habits, completions, cursor, wEnd);
    points.push({
      weekStart: cursor,
      weekEnd: wEnd,
      label: cursor,
      rate: stats.completionRate,
      completed: stats.completed,
      eligible: stats.eligible,
    });
    cursor = addDays(wEnd, 1);
    guard++;
  }
  return points;
}

export function getHabitStats(
  habits: Habit[],
  completions: Completion[],
  startDate: string,
  endDate: string,
  today: string,
): HabitStat[] {
  const active = getActiveHabits(habits);
  return active.map((habit) => {
    let completed = 0;
    let eligible = 0;
    let cursor = startDate;
    let guard = 0;
    while (isSameOrBefore(cursor, endDate) && guard < 366 * 2) {
      if (isScheduledOn(habit, cursor)) {
        eligible++;
        if (isCompletedOn(completions, habit.id, cursor)) completed++;
      }
      cursor = addDays(cursor, 1);
      guard++;
    }
    const rate = eligible === 0 ? 0 : Math.round((completed / eligible) * 100);
    return {
      habitId: habit.id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      completionRate: rate,
      completed,
      eligible,
      currentStreak: calculateCurrentStreak(habit, completions, today),
      longestStreak: calculateLongestStreak(habit, completions, today),
    };
  });
}

export function getMostConsistentHabits(
  habits: Habit[],
  completions: Completion[],
  startDate: string,
  endDate: string,
  today: string,
  limit = 5,
): HabitStat[] {
  const stats = getHabitStats(habits, completions, startDate, endDate, today);
  return stats
    .filter((s) => s.eligible > 0)
    .sort((a, b) => b.completionRate - a.completionRate || b.completed - a.completed)
    .slice(0, limit);
}

export function getScheduledVsCompleted(
  habits: Habit[],
  completions: Completion[],
  startDate: string,
  endDate: string,
): { scheduled: number; completed: number; missed: number } {
  const stats = getOverallStats(habits, completions, startDate, endDate);
  return {
    scheduled: stats.eligible,
    completed: stats.completed,
    missed: stats.eligible - stats.completed,
  };
}

export interface DailyActivity {
  date: string;
  completed: number;
  scheduled: number;
  intensity: number;
}

export function getDailyActivity(
  habits: Habit[],
  completions: Completion[],
  startDate: string,
  endDate: string,
): Map<string, DailyActivity> {
  const map = new Map<string, DailyActivity>();
  const dates = enumerateDates(startDate, endDate);
  for (const date of dates) {
    let scheduled = 0;
    let completed = 0;
    for (const habit of getActiveHabits(habits)) {
      if (isScheduledOn(habit, date)) {
        scheduled++;
        if (isCompletedOn(completions, habit.id, date)) completed++;
      }
    }
    const intensity = scheduled === 0 ? 0 : completed / scheduled;
    map.set(date, { date, completed, scheduled, intensity });
  }
  return map;
}

export function getActivityIntensity(
  habits: Habit[],
  completions: Completion[],
  dateStr: string,
): { intensity: number; completed: number; scheduled: number } {
  let scheduled = 0;
  let completed = 0;
  for (const habit of getActiveHabits(habits)) {
    if (isScheduledOn(habit, dateStr)) {
      scheduled++;
      if (isCompletedOn(completions, habit.id, dateStr)) completed++;
    }
  }
  const intensity = scheduled === 0 ? 0 : completed / scheduled;
  return { intensity, completed, scheduled };
}

export function getHabitActivityIntensity(
  habit: Habit,
  completions: Completion[],
  dateStr: string,
): { intensity: number; completed: boolean; scheduled: boolean } {
  const scheduled = isScheduledOn(habit, dateStr);
  const completed = isCompletedOn(completions, habit.id, dateStr);
  return {
    intensity: completed ? 1 : scheduled ? 0 : -1,
    completed,
    scheduled,
  };
}

export function getCompletionRateColor(intensity: number): string {
  if (intensity <= 0) return 'bg-slate-100 dark:bg-slate-800';
  if (intensity <= 0.25) return 'bg-brand-100 dark:bg-brand-900/40';
  if (intensity <= 0.5) return 'bg-brand-300 dark:bg-brand-700/60';
  if (intensity <= 0.75) return 'bg-brand-400 dark:bg-brand-600';
  return 'bg-brand-600 dark:bg-brand-400';
}
