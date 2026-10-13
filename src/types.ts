export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ScheduleType = 'daily' | 'weekdays';

export interface Schedule {
  type: ScheduleType;
  days: Weekday[];
}

export type CategoryId =
  | 'study'
  | 'health'
  | 'fitness'
  | 'creativity'
  | 'productivity'
  | 'personal'
  | 'custom';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: CategoryId;
  color: string;
  schedule: Schedule;
  target?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string;
  completedAt: string;
}

export interface AppData {
  version: number;
  habits: Habit[];
  completions: Completion[];
}

export type ThemePreference = 'system' | 'light' | 'dark';

export type WeekStart = 'sunday' | 'monday';

export interface Settings {
  theme: ThemePreference;
  weekStart: WeekStart;
}

export interface PersistedState {
  version: number;
  data: AppData;
  settings: Settings;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type View = 'dashboard' | 'habits' | 'analytics' | 'settings';

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  scheduledToday: boolean;
  totalCompletions: number;
}
