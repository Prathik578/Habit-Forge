import type { CategoryId, Weekday } from '@/types';

export const STORAGE_KEY = 'habitforge:v1';
export const DATA_VERSION = 1;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export const WEEKDAY_LABELS_LONG: Record<Weekday, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export interface CategoryDef {
  id: CategoryId;
  label: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'study', label: 'Study' },
  { id: 'health', label: 'Health' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'creativity', label: 'Creativity' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'personal', label: 'Personal' },
  { id: 'custom', label: 'Custom' },
];

export const CATEGORY_LABELS: Record<CategoryId, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>;

export interface ColorDef {
  id: string;
  label: string;
  value: string;
  bg: string;
  bgLight: string;
  text: string;
  border: string;
}

export const COLORS: ColorDef[] = [
  { id: 'indigo', label: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500', bgLight: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  { id: 'emerald', label: 'Emerald', value: '#10b981', bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  { id: 'blue', label: 'Blue', value: '#3b82f6', bg: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { id: 'amber', label: 'Amber', value: '#f59e0b', bg: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  { id: 'rose', label: 'Rose', value: '#f43f5e', bg: 'bg-rose-500', bgLight: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  { id: 'teal', label: 'Teal', value: '#14b8a6', bg: 'bg-teal-500', bgLight: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  { id: 'orange', label: 'Orange', value: '#f97316', bg: 'bg-orange-500', bgLight: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  { id: 'cyan', label: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500', bgLight: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
];

export const COLOR_MAP: Record<string, ColorDef> = Object.fromEntries(
  COLORS.map((c) => [c.id, c]),
);

export interface IconDef {
  id: string;
  label: string;
}

export const ICONS: IconDef[] = [
  { id: 'BookOpen', label: 'Reading' },
  { id: 'Dumbbell', label: 'Exercise' },
  { id: 'Brain', label: 'Mind' },
  { id: 'PenTool', label: 'Writing' },
  { id: 'Code', label: 'Coding' },
  { id: 'Footprints', label: 'Walking' },
  { id: 'Apple', label: 'Nutrition' },
  { id: 'Droplets', label: 'Hydration' },
  { id: 'Moon', label: 'Sleep' },
  { id: 'Sunrise', label: 'Morning' },
  { id: 'Music', label: 'Music' },
  { id: 'Palette', label: 'Art' },
  { id: 'Leaf', label: 'Nature' },
  { id: 'Heart', label: 'Wellness' },
  { id: 'Timer', label: 'Focus' },
  { id: 'Languages', label: 'Language' },
  { id: 'Calculator', label: 'Finance' },
  { id: 'Sprout', label: 'Growth' },
  { id: 'Coffee', label: 'Coffee' },
  { id: 'Bike', label: 'Cycling' },
];

export const ICON_IDS = ICONS.map((i) => i.id);

export const ICON_LABELS: Record<string, string> = Object.fromEntries(
  ICONS.map((i) => [i.id, i.label]),
);

export const VALID_WEEKDAYS = new Set([0, 1, 2, 3, 4, 5, 6]);
