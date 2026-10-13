import { useState, useRef } from 'react';
import { useStore } from '@/store/StoreContext';
import { ConfirmDialog } from '@/components/Modal';
import { exportToJSON, validateImportData } from '@/utils/storage';
import {
  Sun, Moon, Monitor, Download, Upload, Trash2, AlertCircle, Check,
} from 'lucide-react';
import type { ThemePreference, WeekStart } from '@/types';

export function Settings() {
  const { settings, updateSettings, habits, completions, importData, clearAll } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace' | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImportData = useRef<unknown>(null);

  function handleExport() {
    const state = {
      version: 1,
      data: { version: 1, habits, completions },
      settings,
    };
    const json = exportToJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitforge-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const validation = validateImportData(data);
        if (!validation.valid) {
          setImportResult({
            success: false,
            message: `Invalid data: ${validation.errors.slice(0, 3).join(', ')}${validation.errors.length > 3 ? '...' : ''}`,
          });
          return;
        }
        pendingImportData.current = data;
        setImportMode('merge');
      } catch {
        setImportResult({ success: false, message: 'Could not read the file. Make sure it is a valid JSON file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (!pendingImportData.current || !importMode) return;
    const result = importData(pendingImportData.current, importMode);
    setImportResult(
      result.success
        ? { success: true, message: `Data ${importMode === 'merge' ? 'merged' : 'replaced'} successfully.` }
        : { success: false, message: `Import failed: ${result.errors.join(', ')}` },
    );
    pendingImportData.current = null;
    setImportMode(null);
  }

  const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Customize your HabitForge experience.</p>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label mb-2">Theme</label>
            <div className="flex gap-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = settings.theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ theme: opt.value })}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <Icon size={16} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label mb-2">Week starts on</label>
            <div className="flex gap-2">
              {([
                { value: 'sunday' as WeekStart, label: 'Sunday' },
                { value: 'monday' as WeekStart, label: 'Monday' },
              ]).map((opt) => {
                const isSelected = settings.weekStart === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ weekStart: opt.value })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Data Management</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your data is stored locally in your browser. It is not synced to the cloud.
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Export data</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download all your habits and completions as JSON.</p>
            </div>
            <button onClick={handleExport} className="btn-secondary self-start sm:self-auto" disabled={habits.length === 0}>
              <Download size={16} /> Export JSON
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Import data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Import from a JSON file. Merge adds new records; Replace overwrites everything.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary self-start sm:self-auto">
                <Upload size={16} /> Import JSON
              </button>
            </div>
            {importResult && (
              <div
                className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  importResult.success
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                {importResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                {importResult.message}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Clear all data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanently delete all habits and completion history. This cannot be undone.
                </p>
              </div>
              <button onClick={() => setShowClearConfirm(true)} className="btn-danger self-start sm:self-auto" disabled={habits.length === 0 && completions.length === 0}>
                <Trash2 size={16} /> Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import mode selection */}
      <ConfirmDialog
        open={importMode !== null}
        onClose={() => { setImportMode(null); pendingImportData.current = null; }}
        onConfirm={confirmImport}
        title="Import Data"
        message="Merge will add new records without overwriting existing ones. Replace will delete all current data and use the imported data instead. Which would you prefer?"
        confirmLabel="Merge (add new)"
      />

      {/* Replace confirmation */}
      <ConfirmDialog
        open={importMode === 'replace'}
        onClose={() => { setImportMode(null); pendingImportData.current = null; }}
        onConfirm={confirmImport}
        title="Replace All Data?"
        message="This will permanently delete all your current habits and completions, replacing them with the imported data. Are you sure?"
        confirmLabel="Yes, replace everything"
        danger
      />

      {/* Clear confirmation */}
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearAll}
        title="Clear All Data"
        message="This will permanently delete all your habits and completion history. This action cannot be undone. Consider exporting your data first."
        confirmLabel="Delete everything"
        danger
      />
    </div>
  );
}
