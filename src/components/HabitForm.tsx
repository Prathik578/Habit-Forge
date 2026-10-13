import { useState, useEffect } from 'react';
import type { Habit, CategoryId, Weekday } from '@/types';
import { CATEGORIES, COLORS, ICONS, ALL_WEEKDAYS, WEEKDAY_LABELS, COLOR_MAP } from '@/constants';
import { getIconComponent } from '@/utils/iconMap';
import { AlertCircle, Check } from 'lucide-react';

interface HabitFormProps {
  initial?: Habit | null;
  onSubmit: (data: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>) => void;
  onCancel: () => void;
  submitLabel?: string;
}

interface FormState {
  name: string;
  description: string;
  icon: string;
  category: CategoryId;
  color: string;
  scheduleType: 'daily' | 'weekdays';
  scheduleDays: Weekday[];
  target: string;
}

interface FormErrors {
  name?: string;
  scheduleDays?: string;
}

export function HabitForm({ initial, onSubmit, onCancel, submitLabel = 'Create Habit' }: HabitFormProps) {
  const [form, setForm] = useState<FormState>(() => ({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    icon: initial?.icon ?? 'BookOpen',
    category: initial?.category ?? 'study',
    color: initial?.color ?? 'indigo',
    scheduleType: initial?.schedule.type ?? 'daily',
    scheduleDays: initial?.schedule.days ?? [0, 1, 2, 3, 4, 5, 6],
    target: initial?.target ?? '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (form.scheduleType === 'daily') {
      setForm((f) => ({ ...f, scheduleDays: ALL_WEEKDAYS }));
    }
  }, [form.scheduleType]);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.name.trim()) {
      errs.name = 'Name is required';
    } else if (form.name.trim().length > 60) {
      errs.name = 'Name must be 60 characters or fewer';
    }
    if (form.scheduleType === 'weekdays' && form.scheduleDays.length === 0) {
      errs.scheduleDays = 'Select at least one day';
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      icon: form.icon,
      category: form.category,
      color: form.color,
      schedule: {
        type: form.scheduleType,
        days: form.scheduleType === 'daily' ? ALL_WEEKDAYS : form.scheduleDays,
      },
      target: form.target.trim() || undefined,
    });
  }

  function toggleDay(day: Weekday) {
    setForm((f) => {
      const days = f.scheduleDays.includes(day)
        ? f.scheduleDays.filter((d) => d !== day)
        : [...f.scheduleDays, day];
      return { ...f, scheduleDays: days.sort() as Weekday[] };
    });
  }

  const selectedColor = COLOR_MAP[form.color] ?? COLOR_MAP.indigo;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="habit-name" className="label mb-1.5">
          Habit name <span className="text-rose-500">*</span>
        </label>
        <input
          id="habit-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onBlur={() => touched && setErrors(validate())}
          placeholder="e.g. Read for 30 minutes"
          className="input"
          maxLength={60}
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
            <AlertCircle size={12} /> {errors.name}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="habit-desc" className="label mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          id="habit-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Add context or motivation"
          className="input min-h-[70px] resize-y"
          rows={2}
        />
      </div>

      {/* Target */}
      <div>
        <label htmlFor="habit-target" className="label mb-1.5">Target <span className="text-slate-400 font-normal">(optional)</span></label>
        <input
          id="habit-target"
          type="text"
          value={form.target}
          onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
          placeholder="e.g. Read 20 pages"
          className="input"
        />
      </div>

      {/* Icon picker */}
      <div>
        <span className="label mb-2">Icon</span>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {ICONS.map((icon) => {
            const IconComp = getIconComponent(icon.id);
            const isSelected = form.icon === icon.id;
            return (
              <button
                key={icon.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, icon: icon.id }))}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                  isSelected
                    ? `${selectedColor.bgLight} ${selectedColor.text} border-current`
                    : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
                aria-label={icon.label}
                aria-pressed={isSelected}
              >
                <IconComp size={18} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Category */}
      <div>
        <span className="label mb-2">Category</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = form.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
                className={`badge transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
                aria-pressed={isSelected}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div>
        <span className="label mb-2">Color</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => {
            const isSelected = form.color === color.id;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: color.id }))}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  isSelected ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
                } ${color.bg}`}
                style={isSelected ? { boxShadow: `0 0 0 2px ${color.value}` } : undefined}
                aria-label={color.label}
                aria-pressed={isSelected}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      <div>
        <span className="label mb-2">Schedule</span>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, scheduleType: 'daily' }))}
            className={`badge px-3 py-1.5 transition-all ${
              form.scheduleType === 'daily'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
            aria-pressed={form.scheduleType === 'daily'}
          >
            Every day
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, scheduleType: 'weekdays' }))}
            className={`badge px-3 py-1.5 transition-all ${
              form.scheduleType === 'weekdays'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
            aria-pressed={form.scheduleType === 'weekdays'}
          >
            Specific days
          </button>
        </div>
        {form.scheduleType === 'weekdays' && (
          <div className="flex flex-wrap gap-2">
            {ALL_WEEKDAYS.map((day) => {
              const isSelected = form.scheduleDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex h-10 w-12 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                    isSelected
                      ? `${selectedColor.bgLight} ${selectedColor.text} border-current`
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                  }`}
                  aria-pressed={isSelected}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        )}
        {errors.scheduleDays && (
          <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
            <AlertCircle size={12} /> {errors.scheduleDays}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
