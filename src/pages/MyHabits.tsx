import { useState, useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { HabitForm } from '@/components/HabitForm';
import { HabitDetail } from '@/components/HabitDetail';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { Drawer } from '@/components/Drawer';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import {
  getActiveHabits,
  getArchivedHabits,
  calculateCurrentStreak,
  calculateLongestStreak,
  scheduleLabel,
  isScheduledOn,
  isCompletedOn,
} from '@/utils/habitEngine';
import { COLOR_MAP, CATEGORY_LABELS } from '@/constants';
import { getIconComponent } from '@/utils/iconMap';
import type { Habit } from '@/types';
import {
  Plus, Pencil, Archive, Trash2, RotateCcw,
  Flame, Trophy, ChevronRight, Sparkles,
} from 'lucide-react';

export function MyHabits() {
  const { habits, completions, today, settings, createHabit, updateHabit, archiveHabit, restoreHabit, deleteHabit, toggleCompletion } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Habit | null>(null);

  const activeHabits = getActiveHabits(habits);
  const archivedHabits = getArchivedHabits(habits);

  const sortedActive = useMemo(() => {
    return [...activeHabits].sort((a, b) => {
      const aScheduled = isScheduledOn(a, today);
      const bScheduled = isScheduledOn(b, today);
      if (aScheduled !== bScheduled) return aScheduled ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeHabits, today]);

  const displayHabits = showArchived ? archivedHabits : sortedActive;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Habits</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {activeHabits.length} active {activeHabits.length === 1 ? 'habit' : 'habits'}
            {archivedHabits.length > 0 && ` · ${archivedHabits.length} archived`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {archivedHabits.length > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="btn-secondary"
            >
              <Archive size={16} />
              {showArchived ? 'View Active' : `Archived (${archivedHabits.length})`}
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> New Habit
          </button>
        </div>
      </div>

      {displayHabits.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/40">
            <Sparkles size={32} className="text-brand-500" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {showArchived ? 'No archived habits' : 'No habits yet'}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {showArchived
              ? 'Archived habits will appear here. You can restore them at any time.'
              : 'Create your first habit to start building a routine.'}
          </p>
          {!showArchived && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">
              <Plus size={16} /> Create habit
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayHabits.map((habit) => (
            <HabitListCard
              key={habit.id}
              habit={habit}
              completions={completions}
              today={today}
              archived={!!habit.archivedAt}
              onClick={() => setSelectedHabit(habit)}
              onEdit={() => setEditingHabit(habit)}
              onArchive={() => setArchiveTarget(habit)}
              onRestore={() => restoreHabit(habit.id)}
              onDelete={() => setDeleteTarget(habit)}
              onToggleComplete={() => toggleCompletion(habit.id, today)}
              completedToday={isCompletedOn(completions, habit.id, today)}
              scheduledToday={isScheduledOn(habit, today)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Habit">
        <HabitForm
          onSubmit={(data) => { createHabit(data); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingHabit} onClose={() => setEditingHabit(null)} title="Edit Habit">
        {editingHabit && (
          <HabitForm
            initial={editingHabit}
            onSubmit={(data) => { updateHabit(editingHabit.id, data); setEditingHabit(null); }}
            onCancel={() => setEditingHabit(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Detail drawer */}
      <Drawer
        open={!!selectedHabit}
        onClose={() => setSelectedHabit(null)}
        title="Habit Details"
        footer={
          selectedHabit && (
            <div className="flex flex-wrap justify-end gap-2">
              {!selectedHabit.archivedAt && (
                <>
                  <button onClick={() => { setEditingHabit(selectedHabit); setSelectedHabit(null); }} className="btn-secondary">
                    <Pencil size={16} /> Edit
                  </button>
                  <button onClick={() => { setArchiveTarget(selectedHabit); }} className="btn-secondary">
                    <Archive size={16} /> Archive
                  </button>
                </>
              )}
              {selectedHabit.archivedAt && (
                <button onClick={() => { restoreHabit(selectedHabit.id); setSelectedHabit(null); }} className="btn-secondary">
                  <RotateCcw size={16} /> Restore
                </button>
              )}
              <button onClick={() => { setDeleteTarget(selectedHabit); }} className="btn-danger">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )
        }
      >
        {selectedHabit && (
          <div className="space-y-5">
            <HabitDetail habit={selectedHabit} completions={completions} today={today} />
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Activity History</h4>
              <CalendarHeatmap
                habits={habits}
                completions={completions}
                selectedHabitId={selectedHabit.id}
                weekStart={settings.weekStart}
                months={6}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Archive confirmation */}
      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => { if (archiveTarget) archiveHabit(archiveTarget.id); setSelectedHabit(null); }}
        title="Archive Habit"
        message={`Archive "${archiveTarget?.name}"? This will remove it from your daily checklist, but all completion history will be preserved. You can restore it anytime.`}
        confirmLabel="Archive"
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteHabit(deleteTarget.id); setSelectedHabit(null); }}
        title="Delete Habit"
        message={`Permanently delete "${deleteTarget?.name}"? This will remove the habit and ALL of its completion history. This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

interface HabitListCardProps {
  habit: Habit;
  completions: import('@/types').Completion[];
  today: string;
  archived: boolean;
  completedToday: boolean;
  scheduledToday: boolean;
  onClick: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}

function HabitListCard({
  habit, completions, today, archived, completedToday, scheduledToday,
  onClick, onEdit, onArchive, onRestore, onDelete, onToggleComplete,
}: HabitListCardProps) {
  const color = COLOR_MAP[habit.color] ?? COLOR_MAP.indigo;
  const Icon = getIconComponent(habit.icon);
  const currentStreak = calculateCurrentStreak(habit, completions, today);
  const longestStreak = calculateLongestStreak(habit, completions, today);

  return (
    <div
      className="card card-hover group p-4"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color.bgLight} ${color.text}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{habit.name}</h3>
            {scheduledToday && !archived && (
              <span className={`badge ${completedToday ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {completedToday ? 'Done' : 'Due'}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {CATEGORY_LABELS[habit.category]} · {scheduleLabel(habit)}
          </p>

          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs">
              <Flame size={14} className="text-orange-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{currentStreak}</span>
              <span className="text-slate-400">current</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Trophy size={14} className="text-amber-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{longestStreak}</span>
              <span className="text-slate-400">best</span>
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
      </div>

      {/* Action bar */}
      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
        {!archived && scheduledToday && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
            className={`badge px-2.5 py-1 transition-all ${
              completedToday
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {completedToday ? 'Completed' : 'Mark done'}
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          {!archived ? (
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(); }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Archive"
            >
              <Archive size={15} />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onRestore(); }}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Restore"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
