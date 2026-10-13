import { useState, useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import { Modal } from '@/components/Modal';
import {
  getActiveHabits,
  getHabitsScheduledOn,
  getCompletedHabitsOn,
  getTodaysCompletionRate,
  getBestStreak,
} from '@/utils/habitEngine';
import {
  getOverallStats,
  getWeeklyTrend,
} from '@/utils/analytics';
import {
  getGreeting,
  formatDateLong,
  startOfWeek,
  endOfWeek,
  addDays,
} from '@/utils/dateUtils';
import {
  Plus, CheckCircle2, Calendar, Percent, Flame, ArrowRight, TrendingUp, Sparkles,
} from 'lucide-react';
import type { View } from '@/types';
import type { LucideIcon } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: View) => void;
}

const MOTIVATIONAL_MESSAGES = [
  'Small steps, lasting change.',
  'Consistency beats intensity.',
  'Every checkmark is progress.',
  'Build the habit, trust the process.',
  'Show up for yourself today.',
  'Progress, not perfection.',
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const { habits, completions, today, toggleCompletion, createHabit } = useStore();
  const [showCreate, setShowCreate] = useState(false);

  const activeHabits = getActiveHabits(habits);
  const scheduledToday = getHabitsScheduledOn(habits, completions, today);
  const completedToday = getCompletedHabitsOn(habits, completions, today);
  const completionRate = getTodaysCompletionRate(habits, completions, today);
  const bestStreak = getBestStreak(habits, completions, today);

  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weekStats = getOverallStats(habits, completions, weekStart, weekEnd);
  const weeklyTrend = getWeeklyTrend(habits, completions, addDays(today, -28), today, 'sunday').slice(-4);

  const messageIndex = useMemo(() => {
    const d = new Date(today);
    return d.getDate() % MOTIVATIONAL_MESSAGES.length;
  }, [today]);

  const greeting = getGreeting();

  interface SummaryCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    bgColor: string;
  }

  const SummaryCard = ({ label, value, icon: IconC, color, bgColor }: SummaryCardProps) => (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
          <IconC size={20} className={color} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );

  if (activeHabits.length === 0) {
    return (
      <div className="space-y-6">
        <Header greeting={greeting} today={today} message={MOTIVATIONAL_MESSAGES[messageIndex]} onCreate={() => setShowCreate(true)} />
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/40">
            <Sparkles size={32} className="text-brand-500" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Start your first habit</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Create a habit to track your daily progress, build streaks, and see your consistency over time.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">
            <Plus size={16} /> Create your first habit
          </button>
        </div>
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Habit">
          <HabitForm
            onSubmit={(data) => { createHabit(data); setShowCreate(false); }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header greeting={greeting} today={today} message={MOTIVATIONAL_MESSAGES[messageIndex]} onCreate={() => setShowCreate(true)} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Completed today"
          value={completedToday.length}
          icon={CheckCircle2}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <SummaryCard
          label="Scheduled today"
          value={scheduledToday.length}
          icon={Calendar}
          color="text-brand-600 dark:text-brand-400"
          bgColor="bg-brand-50 dark:bg-brand-950/40"
        />
        <SummaryCard
          label="Today's completion"
          value={`${completionRate}%`}
          icon={Percent}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-950/40"
        />
        <SummaryCard
          label={bestStreak ? `Best streak (${bestStreak.habit.name})` : 'Best streak'}
          value={bestStreak ? bestStreak.streak : 0}
          icon={Flame}
          color="text-orange-600 dark:text-orange-400"
          bgColor="bg-orange-50 dark:bg-orange-950/40"
        />
      </div>

      {/* Today's habits + Weekly progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Today's Habits</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {completedToday.length} / {scheduledToday.length} done
            </span>
          </div>
          {scheduledToday.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Calendar size={24} className="text-slate-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">Nothing scheduled for today</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enjoy your rest day or create a new habit.</p>
              <button onClick={() => setShowCreate(true)} className="btn-secondary mt-4">
                <Plus size={16} /> New Habit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledToday
                .sort((a, b) => {
                  const aDone = completions.some((c) => c.habitId === a.id && c.date === today);
                  const bDone = completions.some((c) => c.habitId === b.id && c.date === today);
                  if (aDone === bDone) return a.name.localeCompare(b.name);
                  return aDone ? 1 : -1;
                })
                .map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completions={completions}
                    today={today}
                    completed={completions.some((c) => c.habitId === habit.id && c.date === today)}
                    onToggle={() => toggleCompletion(habit.id, today)}
                    onClick={() => onNavigate('habits')}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Weekly progress sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">This Week</h3>
              <TrendingUp size={16} className="text-slate-400" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{weekStats.completed}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">of {weekStats.eligible} scheduled</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${weekStats.eligible === 0 ? 0 : (weekStats.completed / weekStats.eligible) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{weekStats.completionRate}% completion rate</p>
            </div>
          </div>

          {/* Mini weekly trend */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weekly Trend</h3>
            <div className="mt-3 flex items-end justify-between gap-2 h-20">
              {weeklyTrend.map((point) => (
                <div key={point.weekStart} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        point.rate > 0 ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      style={{ height: `${Math.max(point.rate, 4)}%` }}
                      title={`${point.completed}/${point.eligible} (${point.rate}%)`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(point.weekStart).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('analytics')}
            className="card card-hover flex w-full items-center justify-between p-4 text-sm font-medium text-brand-600 dark:text-brand-400"
          >
            View Analytics
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Habit">
        <HabitForm
          onSubmit={(data) => { createHabit(data); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}

function Header({ greeting, today, message, onCreate }: { greeting: string; today: string; message: string; onCreate: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{greeting}</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{formatDateLong(today)}</p>
        <p className="mt-1 text-sm text-brand-600 dark:text-brand-400">{message}</p>
      </div>
      <button onClick={onCreate} className="btn-primary self-start sm:self-auto">
        <Plus size={16} /> New Habit
      </button>
    </div>
  );
}
