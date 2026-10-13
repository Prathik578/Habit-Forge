import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from '@/store/StoreContext';
import { Dashboard } from '@/pages/Dashboard';
import { MyHabits } from '@/pages/MyHabits';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';
import type { View } from '@/types';
import {
  LayoutDashboard, ListChecks, BarChart3, Settings as SettingsIcon,
  Flame, Menu, X, AlertCircle,
} from 'lucide-react';

const NAV_ITEMS: { view: View; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'habits', label: 'My Habits', icon: ListChecks },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
  { view: 'settings', label: 'Settings', icon: SettingsIcon },
];

function AppShell() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { saveError } = useStore();

  // Close mobile nav when switching views
  useEffect(() => {
    setMobileNavOpen(false);
  }, [currentView]);

  function navigate(view: View) {
    setCurrentView(view);
  }

  const currentLabel = NAV_ITEMS.find((n) => n.view === currentView)?.label ?? '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
        <SidebarContent currentView={currentView} onNavigate={navigate} />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Flame size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">HabitForge</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle navigation"
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 animate-slide-up">
            <SidebarContent currentView={currentView} onNavigate={navigate} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Desktop page label */}
          <div className="mb-4 hidden lg:block">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{currentLabel}</span>
          </div>

          {saveError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle size={16} />
              Could not save your changes. Storage may be full or unavailable.
            </div>
          )}

          {currentView === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {currentView === 'habits' && <MyHabits />}
          {currentView === 'analytics' && <Analytics />}
          {currentView === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  currentView,
  onNavigate,
}: {
  currentView: View;
  onNavigate: (view: View) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
          <Flame size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">HabitForge</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Build better routines</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`sidebar-link w-full text-left ${
                isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
        <p className="text-xs text-slate-400">Your data stays on this device.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
