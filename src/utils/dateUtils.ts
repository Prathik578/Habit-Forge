import type { Weekday } from '@/types';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function todayString(clock?: () => Date): string {
  const d = clock ? clock() : new Date();
  return dateString(d);
}

export function dateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date | null {
  if (!s || typeof s !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function isValidDateString(s: string): boolean {
  return parseDate(s) !== null;
}

export function weekdayOf(s: string): Weekday {
  const d = parseDate(s);
  if (!d) throw new Error(`Invalid date string: ${s}`);
  return d.getDay() as Weekday;
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  if (!d) throw new Error(`Invalid date string: ${s}`);
  d.setDate(d.getDate() + n);
  return dateString(d);
}

export function daysBetween(a: string, b: string): number {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) throw new Error('Invalid date string');
  const ms = db.getTime() - da.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function isBefore(a: string, b: string): boolean {
  return daysBetween(a, b) > 0;
}

export function isAfter(a: string, b: string): boolean {
  return daysBetween(a, b) < 0;
}

export function isSameOrBefore(a: string, b: string): boolean {
  return daysBetween(a, b) >= 0;
}

export function isSameOrAfter(a: string, b: string): boolean {
  return daysBetween(a, b) <= 0;
}

export function maxDate(a: string, b: string): string {
  return isAfter(a, b) ? a : b;
}

export function minDate(a: string, b: string): string {
  return isBefore(a, b) ? a : b;
}

export function formatDateLong(s: string): string {
  const d = parseDate(s);
  if (!d) return s;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateMedium(s: string): string {
  const d = parseDate(s);
  if (!d) return s;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(s: string): string {
  const d = parseDate(s);
  if (!d) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getGreeting(clock?: () => Date): string {
  const d = clock ? clock() : new Date();
  const h = d.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export function startOfWeek(s: string, weekStart: 'sunday' | 'monday' = 'sunday'): string {
  const d = parseDate(s);
  if (!d) throw new Error(`Invalid date string: ${s}`);
  const day = d.getDay();
  const offset = weekStart === 'monday' ? (day === 0 ? 6 : day - 1) : day;
  d.setDate(d.getDate() - offset);
  return dateString(d);
}

export function endOfWeek(s: string, weekStart: 'sunday' | 'monday' = 'sunday'): string {
  const start = startOfWeek(s, weekStart);
  return addDays(start, 6);
}

export function startOfMonth(s: string): string {
  const d = parseDate(s);
  if (!d) throw new Error(`Invalid date string: ${s}`);
  d.setDate(1);
  return dateString(d);
}

export function endOfMonth(s: string): string {
  const d = parseDate(s);
  if (!d) throw new Error(`Invalid date string: ${s}`);
  d.setMonth(d.getMonth() + 1, 0);
  return dateString(d);
}

export function isSameMonth(a: string, b: string): boolean {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return false;
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
}

export function getMonthLabel(s: string): string {
  const d = parseDate(s);
  if (!d) return s;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getMonthLabelLong(s: string): string {
  const d = parseDate(s);
  if (!d) return s;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function enumerateDates(start: string, end: string): string[] {
  const result: string[] = [];
  let current = start;
  let guard = 0;
  while (isSameOrBefore(current, end) && guard < 4000) {
    result.push(current);
    current = addDays(current, 1);
    guard++;
  }
  return result;
}

export function relativeDayLabel(s: string, today: string): string {
  const diff = daysBetween(today, s);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff < 7) return `In ${diff} days`;
  if (diff < 0 && diff > -7) return `${Math.abs(diff)} days ago`;
  return formatDateMedium(s);
}

export function dateToTimestamp(): string {
  return new Date().toISOString();
}

export function timestampToDate(ts: string): string {
  const d = new Date(ts);
  return dateString(d);
}
