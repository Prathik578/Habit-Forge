import { useState, useMemo } from 'react';
import type { Habit, Completion } from '@/types';
import {
  addDays,
  enumerateDates,
  getMonthLabel,
  startOfWeek,
  todayString,
  formatDateMedium,
} from '@/utils/dateUtils';
import { isScheduledOn, isCompletedOn, getActiveHabits } from '@/utils/habitEngine';

interface CalendarHeatmapProps {
  habits: Habit[];
  completions: Completion[];
  selectedHabitId: string | null;
  weekStart: 'sunday' | 'monday';
  months?: number;
}

interface CellData {
  date: string;
  scheduled: number;
  completed: number;
  intensity: number;
  habitNames: string[];
}

export function CalendarHeatmap({
  habits,
  completions,
  selectedHabitId,
  weekStart,
  months = 12,
}: CalendarHeatmapProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const today = todayString();

  const { weeks, monthLabels } = useMemo(() => {
    const endDate = today;
    const startDate = addDays(endDate, -(months * 30 + 7));

    const activeHabits = getActiveHabits(habits);
    const relevantHabits = selectedHabitId
      ? activeHabits.filter((h) => h.id === selectedHabitId)
      : activeHabits;

    // Build cell data for each date
    const dates = enumerateDates(startDate, endDate);
    const cellMap = new Map<string, CellData>();
    for (const date of dates) {
      let scheduled = 0;
      let completed = 0;
      const habitNames: string[] = [];
      for (const habit of relevantHabits) {
        if (isScheduledOn(habit, date)) {
          scheduled++;
          if (isCompletedOn(completions, habit.id, date)) {
            completed++;
            habitNames.push(habit.name);
          }
        }
      }
      const intensity = scheduled === 0 ? -1 : completed / scheduled;
      cellMap.set(date, { date, scheduled, completed, intensity, habitNames });
    }

    // Group into weeks
    const firstWeekStart = startOfWeek(startDate, weekStart);
    const weekColumns: CellData[][] = [];
    let cursor = firstWeekStart;
    let guard = 0;
    while (cursor <= endDate && guard < 600) {
      const week: CellData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(cursor, i);
        const cell = cellMap.get(date);
        if (cell) {
          week.push(cell);
        } else {
          week.push({ date, scheduled: 0, completed: 0, intensity: -2, habitNames: [] });
        }
      }
      weekColumns.push(week);
      cursor = addDays(cursor, 7);
      guard++;
    }

    // Month labels
    const labels: { col: number; label: string }[] = [];
    let lastMonth = '';
    weekColumns.forEach((week, col) => {
      const firstValidCell = week.find((c) => c.intensity >= -1);
      if (firstValidCell) {
        const month = getMonthLabel(firstValidCell.date);
        if (month !== lastMonth) {
          labels.push({ col, label: month });
          lastMonth = month;
        }
      }
    });

    return { weeks: weekColumns, monthLabels: labels };
  }, [habits, completions, selectedHabitId, weekStart, months, today]);

  const hoveredCell = hoveredDate ? (() => {
    for (const week of weeks) {
      for (const cell of week) {
        if (cell.date === hoveredDate) return cell;
      }
    }
    return null;
  })() : null;

  function getCellClass(intensity: number): string {
    if (intensity === -2) return 'bg-transparent';
    if (intensity === -1) return 'bg-slate-100 dark:bg-slate-800/50';
    if (intensity <= 0) return 'bg-rose-100 dark:bg-rose-950/40';
    if (intensity <= 0.25) return 'bg-brand-200 dark:bg-brand-900/60';
    if (intensity <= 0.5) return 'bg-brand-400 dark:bg-brand-700';
    if (intensity <= 0.75) return 'bg-brand-500 dark:bg-brand-600';
    return 'bg-brand-600 dark:bg-brand-400';
  }

  return (
    <div className="space-y-3">
      {/* Desktop view: GitHub-style heatmap */}
      <div className="hidden overflow-x-auto scrollbar-thin sm:block">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="ml-7 flex gap-[3px]">
            {monthLabels.map((ml) => (
              <div
                key={`${ml.col}-${ml.label}`}
                className="text-[10px] text-slate-400"
                style={{ marginLeft: ml.col > 0 ? `calc(${ml.col * 15}px + ${ml.col * 3}px - ${monthLabels.find((m) => m.col === ml.col - 1)?.col !== undefined ? (monthLabels.find((m) => m.col === ml.col - 1)!.col * 15 + monthLabels.find((m) => m.col === ml.col - 1)!.col * 3) : 0}px)` : '0' }}
              >
                {ml.label}
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-[3px]">
            {/* Weekday labels */}
            <div className="flex flex-col gap-[3px] pr-1">
              {weekStart === 'sunday' ? ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'] : ['Mon', '', 'Wed', '', 'Fri', '', ''].map((d, i) => (
                <div key={i} className="h-[12px] text-[10px] leading-[12px] text-slate-400">{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      className={`h-[12px] w-[12px] rounded-sm transition-all hover:ring-1 hover:ring-slate-400 ${getCellClass(cell.intensity)} ${cell.date === today ? 'ring-1 ring-slate-500' : ''}`}
                      onMouseEnter={() => cell.intensity >= -1 && setHoveredDate(cell.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      title={cell.intensity >= -1 ? `${cell.date}: ${cell.completed}/${cell.scheduled} completed` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view: compact list */}
      <div className="sm:hidden">
        <p className="text-xs text-slate-400 mb-2">Showing recent 8 weeks</p>
        <div className="flex gap-[3px] overflow-x-auto scrollbar-thin pb-2">
          {weeks.slice(-8).map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  className={`h-[14px] w-[14px] rounded-sm transition-all ${getCellClass(cell.intensity)} ${cell.date === today ? 'ring-1 ring-slate-500' : ''}`}
                  onTouchStart={() => cell.intensity >= -1 && setHoveredDate(cell.date)}
                  onClick={() => cell.intensity >= -1 && setHoveredDate(hoveredDate === cell.date ? null : cell.date)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="h-[11px] w-[11px] rounded-sm bg-slate-100 dark:bg-slate-800/50" title="No habits scheduled" />
            <div className="h-[11px] w-[11px] rounded-sm bg-rose-100 dark:bg-rose-950/40" title="Scheduled but missed" />
            <div className="h-[11px] w-[11px] rounded-sm bg-brand-200 dark:bg-brand-900/60" />
            <div className="h-[11px] w-[11px] rounded-sm bg-brand-400 dark:bg-brand-700" />
            <div className="h-[11px] w-[11px] rounded-sm bg-brand-600 dark:bg-brand-400" />
          </div>
          <span>More</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <div className="h-[11px] w-[11px] rounded-sm bg-slate-100 dark:bg-slate-800/50" />
            <span>Nothing scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-[11px] w-[11px] rounded-sm bg-rose-100 dark:bg-rose-950/40" />
            <span>Missed</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && hoveredCell.intensity >= -1 && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800 animate-fade-in">
          <p className="font-medium text-slate-700 dark:text-slate-200">{formatDateMedium(hoveredCell.date)}</p>
          {hoveredCell.scheduled === 0 ? (
            <p className="text-slate-400">No habits scheduled</p>
          ) : (
            <>
              <p className="text-slate-500 dark:text-slate-400">
                {hoveredCell.completed} / {hoveredCell.scheduled} completed
              </p>
              {hoveredCell.habitNames.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {hoveredCell.habitNames.map((name, i) => (
                    <p key={i} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      {name}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
