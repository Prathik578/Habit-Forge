import { useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { COLOR_MAP } from '@/constants';
import { getIconComponent } from '@/utils/iconMap';
import type { Habit } from '@/types';
import { scheduleLabel } from '@/utils/habitEngine';
import { calculateCurrentStreak } from '@/utils/habitEngine';
import { Flame } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  completions: import('@/types').Completion[];
  today: string;
  completed: boolean;
  onToggle: () => void;
  onClick?: () => void;
  showStreak?: boolean;
}

export function HabitCard({
  habit,
  completions,
  today,
  completed,
  onToggle,
  onClick,
  showStreak = true,
}: HabitCardProps) {
  const color = COLOR_MAP[habit.color] ?? COLOR_MAP.indigo;
  const Icon = getIconComponent(habit.icon);
  const streak = calculateCurrentStreak(habit, completions, today);
  const [toggling, setToggling] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(true);
    onToggle();
    setTimeout(() => setToggling(false), 300);
  };

  return (
    <div
      className={`card card-hover group cursor-pointer p-4 ${completed ? color.bgLight : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex-shrink-0 transition-transform active:scale-90"
          aria-label={completed ? `Mark ${habit.name} as incomplete` : `Mark ${habit.name} as complete`}
          aria-pressed={completed}
        >
          {toggling ? (
            <Loader2 size={28} className="text-slate-400 animate-spin" />
          ) : completed ? (
            <CheckCircle2
              size={28}
              className={`${color.text} animate-check-pop`}
              fill="currentColor"
              fillOpacity={0.1}
            />
          ) : (
            <Circle
              size={28}
              className="text-slate-300 transition-colors group-hover:text-slate-400 dark:text-slate-600 dark:group-hover:text-slate-500"
            />
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${color.bgLight} ${color.text}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-medium ${completed ? 'text-slate-500 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
              {habit.name}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {habit.target ? habit.target : scheduleLabel(habit)}
            </p>
          </div>
        </div>

        {showStreak && streak > 0 && (
          <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            <Flame size={12} />
            {streak}
          </div>
        )}
      </div>
    </div>
  );
}
