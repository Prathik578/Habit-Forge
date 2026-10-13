import { useState, useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import {
  getOverallStats,
  getWeeklyTrend,
  getHabitStats,
  getMostConsistentHabits,
  getScheduledVsCompleted,
} from '@/utils/analytics';
import {
  getActiveHabits,
} from '@/utils/habitEngine';
import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  formatDateMedium,
} from '@/utils/dateUtils';
import { COLOR_MAP } from '@/constants';
import { getIconComponent } from '@/utils/iconMap';
import {
  Percent, CheckCircle2, XCircle, Calendar, TrendingUp, Trophy, BarChart3,
} from 'lucide-react';

type PeriodType = 'week' | 'month' | 'quarter';

export function Analytics() {
  const { habits, completions, today, settings } = useStore();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [heatmapHabitId, setHeatmapHabitId] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => {
    if (period === 'week') {
      return { startDate: startOfWeek(today, settings.weekStart), endDate: endOfWeek(today, settings.weekStart) };
    }
    if (period === 'month') {
      return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
    }
    // quarter: last ~90 days
    return { startDate: addDays(today, -90), endDate: today };
  }, [period, today, settings.weekStart]);

  const activeHabits = getActiveHabits(habits);
  const overall = getOverallStats(habits, completions, startDate, endDate);
  const weeklyTrend = getWeeklyTrend(habits, completions, startDate, endDate, settings.weekStart);
  const habitStats = getHabitStats(habits, completions, startDate, endDate, today);
  const mostConsistent = getMostConsistentHabits(habits, completions, startDate, endDate, today, 5);
  const scheduledVsCompleted = getScheduledVsCompleted(habits, completions, startDate, endDate);

  const sortedHabitStats = [...habitStats].sort((a, b) => b.completionRate - a.completionRate);

  const periodLabels: Record<PeriodType, string> = {
    week: 'This Week',
    month: 'This Month',
    quarter: 'Last 90 Days',
  };

  if (activeHabits.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/40">
            <BarChart3 size={32} className="text-brand-500" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">No data to analyze yet</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Create some habits and track completions to see your analytics come to life.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {formatDateMedium(startDate)} — {formatDateMedium(endDate)}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(Object.keys(periodLabels) as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                period === p
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Completion Rate"
          value={overall.eligible === 0 ? '—' : `${overall.completionRate}%`}
          icon={Percent}
          color="text-brand-600 dark:text-brand-400"
          bg="bg-brand-50 dark:bg-brand-950/40"
        />
        <StatCard
          label="Completed"
          value={overall.completed}
          icon={CheckCircle2}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          label="Missed"
          value={scheduledVsCompleted.missed}
          icon={XCircle}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-50 dark:bg-rose-950/40"
        />
        <StatCard
          label="Scheduled"
          value={overall.eligible}
          icon={Calendar}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      {overall.eligible === 0 && (
        <div className="card flex items-center justify-center py-8 text-center">
          <div>
            <Calendar size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">No scheduled habits in this period</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Try selecting a different period or create new habits.</p>
          </div>
        </div>
      )}

      {/* Weekly trend chart */}
      {weeklyTrend.length > 0 && overall.eligible > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weekly Completion Trend</h2>
          </div>
          <div className="mt-5 flex items-end gap-2" style={{ height: '160px' }}>
            {weeklyTrend.map((point) => (
              <div key={point.weekStart} className="group relative flex flex-1 flex-col items-center">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-500 hover:opacity-80"
                    style={{
                      height: `${Math.max(point.rate, 2)}%`,
                      backgroundColor: point.rate >= 75 ? '#10b981' : point.rate >= 50 ? '#6366f1' : point.rate >= 25 ? '#a5b4fc' : '#e2e8f0',
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block dark:bg-slate-700 z-10">
                    {point.completed}/{point.eligible} ({point.rate}%)
                  </div>
                </div>
                <span className="mt-2 text-[10px] text-slate-400">
                  {new Date(point.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Activity Heatmap</h2>
          </div>
          <select
            value={heatmapHabitId ?? ''}
            onChange={(e) => setHeatmapHabitId(e.target.value || null)}
            className="input max-w-[200px] py-1.5 text-sm"
          >
            <option value="">All habits</option>
            {activeHabits.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <CalendarHeatmap
            habits={habits}
            completions={completions}
            selectedHabitId={heatmapHabitId}
            weekStart={settings.weekStart}
            months={12}
          />
        </div>
      </div>

      {/* Per-habit breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Per-Habit Completion</h2>
          <div className="mt-4 space-y-3">
            {sortedHabitStats.length === 0 ? (
              <p className="text-sm text-slate-400">No habits in this period.</p>
            ) : (
              sortedHabitStats.map((stat) => {
                const color = COLOR_MAP[stat.color] ?? COLOR_MAP.indigo;
                const Icon = getIconComponent(stat.icon);
                return (
                  <div key={stat.habitId} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${color.bgLight} ${color.text}`}>
                        <Icon size={14} />
                      </div>
                      <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">{stat.name}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {stat.eligible === 0 ? '—' : `${stat.completionRate}%`}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${color.bg}`}
                        style={{ width: `${stat.completionRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      {stat.completed} / {stat.eligible} completed
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Most Consistent</h2>
          </div>
          <div className="mt-4 space-y-2">
            {mostConsistent.length === 0 ? (
              <p className="text-sm text-slate-400">No data for this period yet.</p>
            ) : (
              mostConsistent.map((stat, index) => {
                const color = COLOR_MAP[stat.color] ?? COLOR_MAP.indigo;
                const Icon = getIconComponent(stat.icon);
                return (
                  <div key={stat.habitId} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {index + 1}
                    </span>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color.bgLight} ${color.text}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{stat.name}</p>
                      <p className="text-xs text-slate-400">{stat.completed}/{stat.eligible} completed · {stat.currentStreak} streak</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{stat.completionRate}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Scheduled vs Completed donut-like comparison */}
      {overall.eligible > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Scheduled vs Completed</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Visual bar */}
            <div className="flex-1">
              <div className="flex h-8 overflow-hidden rounded-lg">
                <div
                  className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all duration-500"
                  style={{ width: `${overall.eligible > 0 ? (scheduledVsCompleted.completed / overall.eligible) * 100 : 0}%` }}
                >
                  {scheduledVsCompleted.completed > 0 && `${scheduledVsCompleted.completed}`}
                </div>
                <div
                  className="flex items-center justify-center bg-rose-300 text-xs font-medium text-rose-900 transition-all duration-500 dark:bg-rose-900/60 dark:text-rose-200"
                  style={{ width: `${overall.eligible > 0 ? (scheduledVsCompleted.missed / overall.eligible) * 100 : 0}%` }}
                >
                  {scheduledVsCompleted.missed > 0 && `${scheduledVsCompleted.missed}`}
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Completed ({scheduledVsCompleted.completed})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-rose-300 dark:bg-rose-900/60" />
                <span className="text-slate-600 dark:text-slate-400">Missed ({scheduledVsCompleted.missed})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: import('lucide-react').LucideIcon;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon: IconC, color, bg }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
        <IconC size={20} className={color} />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
