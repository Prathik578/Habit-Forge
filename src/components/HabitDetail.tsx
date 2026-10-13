import { COLOR_MAP } from '@/constants';
import { getIconComponent } from '@/utils/iconMap';
import type { Habit } from '@/types';
import { scheduleLabel, calculateCurrentStreak, calculateLongestStreak } from '@/utils/habitEngine';
import type { Completion } from '@/types';
import { Calendar, Flame, Trophy, TrendingUp } from 'lucide-react';

interface HabitDetailProps {
  habit: Habit;
  completions: Completion[];
  today: string;
}

export function HabitDetail({ habit, completions, today }: HabitDetailProps) {
  const color = COLOR_MAP[habit.color] ?? COLOR_MAP.indigo;
  const Icon = getIconComponent(habit.icon);
  const currentStreak = calculateCurrentStreak(habit, completions, today);
  const longestStreak = calculateLongestStreak(habit, completions, today);
  const totalCompletions = completions.filter((c) => c.habitId === habit.id).length;

  const stats = [
    {
      label: 'Current Streak',
      value: currentStreak,
      icon: Flame,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
    },
    {
      label: 'Longest Streak',
      value: longestStreak,
      icon: Trophy,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Total Completions',
      value: totalCompletions,
      icon: TrendingUp,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-950/40',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${color.bgLight} ${color.text}`}>
          <Icon size={28} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-slate-900 dark:text-slate-100">{habit.name}</h3>
          {habit.description && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{habit.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Calendar size={16} />
        <span>{scheduleLabel(habit)}</span>
        {habit.target && <span className="text-slate-300 dark:text-slate-600">·</span>}
        {habit.target && <span>{habit.target}</span>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-xl p-3 ${stat.bg}`}>
              <div className="flex items-center gap-1.5">
                <StatIcon size={16} className={stat.color} />
              </div>
              <p className={`mt-1.5 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
