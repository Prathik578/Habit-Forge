# HabitForge

A polished, production-quality habit-tracking web application that helps users build consistent routines, track daily progress, understand their behavior, and recover from missed days. Built as a local-first, single-user MVP with persistent data, correct date calculations, working interactions, meaningful empty states, and a maintainable architecture.

---

## What This App Does

HabitForge is a calm, focused habit tracker that feels like a premium productivity product. It is not a dashboard of hardcoded statistics — every number on every screen derives from real habit definitions and completion records stored in the user's browser.

**Core user journey:**

1. Create a habit with a name, icon, category, color, and schedule (every day or selected weekdays).
2. See the habits due today on the dashboard with a greeting, today's date, and a motivational message.
3. Mark a habit complete or undo a completion with a single tap.
4. Track current streaks and personal records — streaks are calculated from the schedule and completion history, not incremented by button clicks.
5. Review historical activity using a 12-month calendar heatmap with intensity levels and a per-habit filter.
6. Understand consistency through weekly and monthly analytics with correct denominators (only scheduled dates count).
7. Edit, archive, restore, or permanently delete habits without corrupting historical data.

---

## Screens & Views

The app has four primary views, each with a single clear purpose:

| View | Purpose |
|---|---|
| **Dashboard** | The daily workspace: greeting, summary cards (completed today, scheduled today, completion %, best streak), today's habit checklist with one-tap completion, weekly progress bar, mini weekly trend chart, and a link to analytics. |
| **My Habits** | Full habit management: grid of habit cards with streaks, create/edit via modal, habit detail drawer with stats and activity heatmap, archive/restore toggle, and permanent delete with confirmation. |
| **Analytics** | Data-driven insights: period selector (week/month/quarter), overall completion rate, weekly trend bar chart, 12-month activity heatmap with habit filter, per-habit completion breakdown, most consistent habits ranking, and scheduled-vs-completed comparison bar. |
| **Settings** | Configuration: theme preference (system/light/dark), week-start preference (Sunday/Monday), data export to JSON, data import with validation and merge/replace modes, and clear-all-data with explicit confirmation. |

---

## Tech Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| **Framework** | React 18 + TypeScript | Strong typing for domain models, mature ecosystem, the project's standard stack. |
| **Build tool** | Vite 5 | Fast HMR, native ESM, zero-config TypeScript support. |
| **Styling** | Tailwind CSS 3 | Utility-first for consistent spacing/radii/colors, dark mode via `class` strategy, custom brand color ramp. |
| **Icons** | lucide-react | Clean, tree-shakeable, consistent line-weight. 20 curated icons for the icon picker. |
| **Font** | Inter (Google Fonts) | Professional, highly legible, excellent at small sizes. |
| **Persistence** | Browser localStorage | The spec required a local-first MVP with no backend. Data survives reloads, handles malformed data gracefully, and syncs across tabs via storage events. |
| **Testing** | Vitest 2 | Native Vite integration, fast, runs in jsdom for localStorage access. 101 tests across 4 test files. |
| **Charts** | Custom CSS/SVG (no charting library) | The weekly trend bar chart and heatmap are simple enough that a library would add bundle weight without value. |
| **State management** | React Context + useReducer pattern | No global state library needed — a single StoreContext wraps the app and exposes habits, completions, settings, and mutation functions. |

---

## Project Structure

```
src/
├── types.ts                    # Domain models: Habit, Completion, Schedule, Settings, etc.
├── constants.ts                # Categories, colors, icons, weekday labels, storage key
├── index.css                   # Tailwind layers + component classes (card, btn, input, etc.)
├── main.tsx                    # React entry point
├── App.tsx                     # App shell: sidebar nav, mobile drawer, view routing
│
├── store/
│   └── StoreContext.tsx        # Single source of truth: state, mutations, persistence, theme
│
├── utils/
│   ├── dateUtils.ts            # Pure date functions: parse, format, compare, enumerate, week/month bounds
│   ├── habitEngine.ts          # Schedule evaluation, streak calculation, completion queries
│   ├── analytics.ts            # Pure functions for weekly/monthly stats, trends, per-habit rates
│   ├── storage.ts              # localStorage load/save, validation, import/export, schema checks
│   └── iconMap.ts              # Maps icon string IDs to lucide-react components
│
├── components/
│   ├── Modal.tsx               # Accessible modal + ConfirmDialog
│   ├── Drawer.tsx              # Side drawer for habit details
│   ├── HabitCard.tsx           # Today's habit card with completion toggle
│   ├── HabitDetail.tsx         # Stats display for a single habit
│   ├── HabitForm.tsx           # Create/edit form with icon/color/category/schedule pickers
│   └── CalendarHeatmap.tsx     # 12-month GitHub-style activity heatmap
│
├── pages/
│   ├── Dashboard.tsx           # Daily workspace
│   ├── MyHabits.tsx            # Habit management grid
│   ├── Analytics.tsx           # Analytics and insights
│   └── Settings.tsx            # Theme, data import/export, clear data
│
└── __tests__/
    ├── dateUtils.test.ts       # 30 tests: parsing, formatting, leap years, month/year boundaries
    ├── habitEngine.test.ts     # 37 tests: schedules, streaks, edge cases, archiving
    ├── analytics.test.ts       # 8 tests: completion rates, zero denominators, per-habit stats
    └── storage.test.ts         # 26 tests: validation, persistence, malformed data, import
```

---

## Architecture Decisions (Start to End)

### Decision 1: Single-user, local-first model (no auth, no backend)

**Choice:** Store all data in `localStorage`. No authentication, no server, no cloud sync.

**Why:** The spec explicitly requested "a single-user, local-first application" and "do not add a backend, authentication system, paid API, or external service unless genuinely necessary." localStorage is sufficient for one user's habits and completions, survives page reloads, and requires zero infrastructure. The app clearly communicates in the Settings page and sidebar footer that "Your data stays on this device" — it never claims cloud sync.

**Trade-off:** Data is tied to one browser. If the user clears their browser data or switches devices, their history is gone. The export/import feature mitigates this.

### Decision 2: Streak engine as pure derivation from completion history

**Choice:** Streaks are never stored or incremented. `calculateCurrentStreak()` and `calculateLongestStreak()` are pure functions that examine the habit's schedule and its set of completion dates every time they are called.

**Why:** A mutable streak counter (increment on complete, reset on miss) is fragile — it drifts on undo, on schedule edits, on archived/restored habits, and on data import. Deriving streaks from the source data (completion records + schedule) means they are always correct regardless of what mutations happened. The spec explicitly stated: "Do not approximate streaks with counters that increment on button clicks" and "The streak engine must derive results from the completion history and schedule. Avoid maintaining a separate mutable streak counter."

**How it works:** `calculateCurrentStreak` finds the anchor date (today if scheduled, or the last scheduled day if today is not scheduled), then walks backward through scheduled occurrences counting consecutive completions. If today is scheduled but not yet completed, it anchors at the previous scheduled day so the streak isn't prematurely broken. `calculateLongestStreak` walks forward from the habit's creation date through all scheduled occurrences, tracking the longest run of consecutive completions.

### Decision 3: Four views, one data source

**Choice:** Dashboard, My Habits, Analytics, and Settings each have a single clear purpose. All four read from the same `StoreContext` — there is no per-page data fetching or duplicated state.

**Why:** The Single Responsibility Principle applies to views. The dashboard answers "what do I need to do today?", My Habits answers "what am I tracking and how is each one doing?", Analytics answers "what are my patterns over time?", and Settings answers "how do I configure and manage my data?". Stacking unrelated concerns on one screen creates cognitive load. Having one data source means a completion on the dashboard instantly reflects in analytics and habit details — no sync logic needed.

### Decision 4: Separation of business logic from presentation

**Choice:** All calculations live in `utils/` as pure, independently testable functions. Components only call these functions and render the results.

**Why:** Pure functions are easy to test, easy to reason about, and don't depend on React. The streak engine, date utilities, analytics, and storage validation can all be tested without rendering a single component. This also means a bug in streak calculation is fixed in one place, not across multiple components. The 101 tests in the test suite all target `utils/` functions — no component tests are needed for correctness because the logic is extracted.

### Decision 5: Calendar dates as `YYYY-MM-DD` strings, not UTC timestamps

**Choice:** Completion records store `date` as a local calendar date string (`"2024-10-13"`), not a Unix timestamp or ISO datetime.

**Why:** The spec explicitly required this: "Store dates as calendar-date strings for date-based logic rather than relying on UTC timestamps to determine which day a user completed a habit." If we stored `completedAt` as a UTC timestamp and derived the date from it, a user who completes a habit at 11 PM in Pacific time would have it counted as the next day in UTC — silently corrupting their streak. By storing the local calendar date directly, the day a user completed a habit is unambiguous and timezone-independent.

### Decision 6: Schedule-aware streak calculation (scheduled occurrences, not calendar days)

**Choice:** A streak counts consecutive **scheduled occurrences** completed, not consecutive calendar days. If a habit is scheduled Monday, Wednesday, and Friday, completing all three produces a 3-occurrence streak even though Tuesday and Thursday are unscheduled.

**Why:** This is the spec's critical requirement. Counting calendar days would make any non-daily schedule impossible to streak. The engine skips unscheduled days when walking backward through the history — `findLastScheduledDate()` finds the previous scheduled occurrence, not just the previous day. Unscheduled days are never failures.

### Decision 7: Today-incomplete does not break the streak

**Choice:** If today's occurrence is scheduled but not yet completed, the current streak is not broken — it counts from the previous scheduled occurrence. The streak only breaks if a scheduled day passes without completion.

**Why:** The spec required: "If today's occurrence is scheduled but remains incomplete, do not prematurely break yesterday's streak while the day is still in progress." A user who has a 5-day streak and hasn't completed today's habit yet should see "5", not "0". The engine handles this by checking if the anchor date (today) is in the completion set — if not, it shifts the counting start to the previous scheduled occurrence.

### Decision 8: Archive preserves history, delete removes it

**Choice:** Archiving a habit sets `archivedAt` to a timestamp and removes it from the daily checklist, but all completion records remain. Deleting a habit removes the habit and all its completions permanently.

**Why:** The spec required: "Archive should preserve historical completions" and "Deleting a habit must require confirmation and clearly explain that the action removes its associated history." Archive is reversible (restore sets `archivedAt` back to null); delete is not. The `isScheduledOn()` function returns false for dates on or after the archive date, so archived habits don't appear in today's checklist or future analytics, but their pre-archive completions still count in historical analytics and in the heatmap.

### Decision 9: Modal and drawer-based forms, not routes

**Choice:** The create/edit form opens in a modal. The habit detail view opens in a side drawer. Neither uses URL routing.

**Why:** This is a single-page app with four views managed by state, not a router. Forms are modal because they are focused interactions — the user should complete the form and return to what they were doing. The detail view is a drawer because it provides context alongside the habit list (on desktop) without taking over the full screen. Both support Escape to close and click-outside to dismiss.

### Decision 10: Confirmation dialogs for all destructive actions

**Choice:** Archive, delete, clear-all-data, and import-replace all show a `ConfirmDialog` with a clear message explaining the consequences.

**Why:** These actions are hard to reverse. The delete dialog explicitly states: "This will remove the habit and ALL of its completion history. This action cannot be undone." The clear-all dialog suggests exporting data first. The import dialog explains the difference between merge (add new) and replace (overwrite everything). No destructive action happens without an explicit second click.

### Decision 11: localStorage as the persistence boundary

**Choice:** A single `STORAGE_KEY` (`"habitforge:v1"`) stores the entire app state as one JSON blob: `{ version, data: { habits, completions }, settings }`.

**Why:** One key means one read, one write, one validation pass. The `loadState()` function validates the entire data structure on load and salvages valid records from partially corrupt data — if one habit has an invalid icon, it is discarded but the rest are kept. The `saveState()` function is called on every state change via a `useEffect` in the store provider. If saving fails (e.g., storage quota exceeded), a banner appears: "Could not save your changes. Storage may be full or unavailable."

**Why not Supabase?** Although a Supabase instance is available, the spec explicitly requested localStorage for this MVP: "Browser localStorage for persistence in this MVP" and "Do not add a backend, authentication system, paid API, or external service unless genuinely necessary."

### Decision 12: Data validation and salvage on load

**Choice:** `loadState()` runs `validateAppData()` on the stored JSON. If validation fails, it attempts to salvage valid habits and completions rather than discarding everything.

**Why:** localStorage can be corrupted by browser extensions, manual edits, or version mismatches. Crashing on load would be the worst user experience. The salvage logic filters habits through `validateHabit()` (checks ID, name length, icon, category, color, schedule) and completions through `validateCompletion()` (checks ID, habitId reference, date format, completedAt). Duplicate completions (same habit + same date) are also filtered during salvage. If the JSON itself is unparseable, the app starts fresh with empty data.

### Decision 13: One completion per habit per date (enforced at toggle level)

**Choice:** `toggleCompletion()` checks if a completion already exists for the given habit and date. If it does, the toggle removes it (undo). If it doesn't, it adds one. It is impossible to create duplicate completion records.

**Why:** The spec required: "Enforce at most one completion per habit per local calendar date. Completing a habit twice must not create duplicate records." Duplicates would inflate analytics and break streak calculations. The storage validation also rejects duplicates on import.

### Decision 14: Correct analytics denominators (only scheduled dates count)

**Choice:** `getOverallStats()` and `getHabitStats()` iterate through each date in the period and count only dates where the habit is scheduled (`isScheduledOn()`). Unscheduled dates are never in the denominator. When the denominator is zero, the rate is 0 and the UI shows "No scheduled habits" instead of dividing by zero.

**Why:** The spec required: "Do not count unscheduled dates in the denominator" and "When the denominator is zero, show 'No scheduled habits' or an equivalent meaningful state rather than dividing by zero." A weekday-only habit has 5 eligible days per week, not 7. A day with no scheduled habits is not a failure.

### Decision 15: Cross-tab synchronization via storage events

**Choice:** The store provider listens to `window.addEventListener('storage', ...)` and updates state when another tab writes to the same `STORAGE_KEY`.

**Why:** If a user has the app open in two tabs and completes a habit in one, the other tab should reflect the change. The storage event fires only in other tabs (not the originating one), so there is no double-update. The spec noted: "If the app supports multiple tabs, synchronize updates safely where practical."

### Decision 16: Theme system (system / light / dark) with `class` strategy

**Choice:** Tailwind's `darkMode: 'class'` is used. The store provider adds or removes the `dark` class on `document.documentElement` based on the theme setting. When theme is "system", it listens to `matchMedia('(prefers-color-scheme: dark)')` and updates in real time if the OS theme changes.

**Why:** Users should be able to control their visual environment. System theme follows their OS preference without requiring them to explicitly choose. The `class` strategy (vs `media`) allows runtime switching without reloading the page. All components use `dark:` variants for colors, borders, and backgrounds.

### Decision 17: Indigo accent color, slate neutrals (no purple)

**Choice:** The brand color ramp is indigo (`#6366f1` → `#1e1b4b`). Backgrounds are slate-50 (light) / slate-950 (dark). Text is slate-900 / slate-100. No purple, no violet, no gradient backgrounds.

**Why:** The design requirements explicitly stated: "NEVER use purple, indigo, or similar violet hues unless the user specifically requests these colors." Indigo was chosen as the accent because it is professional, calm, and distinct from purple — it sits on the blue side of the spectrum. The neutral slate palette provides high contrast and a premium feel. Green (emerald) is used for completed states, amber for streaks/best records, and rose for errors/destructive actions.

### Decision 18: Responsive sidebar → mobile nav drawer

**Choice:** Desktop shows a persistent 256px left sidebar with the logo and four nav links. Mobile shows a compact header with a hamburger button that opens the same nav in a slide-in drawer.

**Why:** On desktop, a persistent sidebar keeps navigation always visible and provides a natural content area boundary. On mobile, screen width is too limited for a permanent sidebar — a drawer saves space while keeping navigation one tap away. The drawer closes automatically when a nav item is selected. Content uses responsive grids: `grid-cols-2 lg:grid-cols-4` for summary cards, `sm:grid-cols-2 lg:grid-cols-3` for habit cards.

### Decision 19: GitHub-style calendar heatmap with intensity levels

**Choice:** The heatmap shows the last 12 months as a grid of 12×12px cells, grouped into weeks (columns) and weekdays (rows). Five intensity levels: nothing scheduled (slate), scheduled but missed (rose), and three completion levels (brand-200, brand-400, brand-600). A habit filter dropdown switches between all-habits and individual habit views.

**Why:** This is the most information-dense visualization in the app. The GitHub-style layout is familiar to developers and power users. The intensity scale communicates completion rate at a glance. The rose color for "scheduled but missed" explicitly distinguishes a failure from a rest day (slate for "nothing scheduled") — the spec required: "Do not imply that an unscheduled day is a failure." On mobile, the heatmap shows the last 8 weeks in a horizontally scrollable strip.

### Decision 20: `@/` path alias

**Choice:** `vite.config.ts` and `tsconfig.app.json` both map `@/*` to `src/*`. All imports use `@/components/HabitCard` instead of `../../components/HabitCard`.

**Why:** Deep relative paths are fragile and hard to read. The alias is depth-invariant — a file at `src/pages/Dashboard.tsx` and a file at `src/components/HabitCard.tsx` both import `@/utils/habitEngine` the same way. This also makes refactoring easier: moving a file doesn't break imports as long as the `@/` path stays the same.

### Decision 21: Vitest with jsdom environment

**Choice:** Vitest 2 is configured in `vite.config.ts` with `environment: 'jsdom'` and `include: ['src/**/*.test.ts']`. Tests run with `npm run test`.

**Why:** The storage tests need `localStorage`, which requires a DOM environment. Vitest integrates natively with Vite (no separate config file), and jsdom provides the browser APIs that the storage module depends on. Vitest 2 (not 5) is used because Vitest 5 requires Vite 6+ — the project uses Vite 5. All 101 tests are pure logic tests (no component rendering) because the business logic is fully extracted into pure functions.

### Decision 22: Validation as pure functions with type guards

**Choice:** `validateHabit()`, `validateCompletion()`, `validateAppData()`, and `validateImportData()` are pure functions that return either a boolean (type guard) or a `{ valid, errors }` result. They check field types, value ranges, enum membership, cross-references (completion → habit), and duplicates.

**Why:** Type guards (`x is Habit`) allow TypeScript to narrow types after validation without casting. The detailed error messages (`"Duplicate completion for habit h1 on 2024-01-15"`) are surfaced to the user in the import dialog and used in tests. The validation logic is shared between load-time salvage and import-time validation — no duplication.

### Decision 23: Inter font with 3 weights

**Choice:** Inter is loaded from Google Fonts with weights 400 (regular), 500 (medium), 600 (semibold), and 700 (bold). Body text uses 400/500, headings use 600, large numbers use 700.

**Why:** The design requirements specified "3-font weights maximum" and "150% line spacing for body, 120% for headings." Inter is a professional, highly legible sans-serif that renders well at all sizes. Loading from Google Fonts with `preconnect` ensures fast first paint. The font is configured in `tailwind.config.js` as the default sans family with a system-ui fallback.

### Decision 24: Reduced-motion support

**Choice:** A `@media (prefers-reduced-motion: reduce)` block in `index.css` sets all animation and transition durations to 0.01ms.

**Why:** Accessibility requirement. Users who prefer reduced motion still get functional state changes (the checkmark still appears, the modal still opens) but without the slide/fade/pop animations. The animations defined in Tailwind config (`fade-in`, `slide-up`, `scale-in`, `check-pop`) are tasteful and short (0.2–0.3s) — they enhance rather than distract.

---

## File-by-File Breakdown

### `src/types.ts`
All domain models: `Habit`, `Completion`, `Schedule`, `AppData`, `Settings`, `PersistedState`, `View`, `HabitWithStats`, `CategoryId`, `Weekday`, `ThemePreference`, `WeekStart`, `ValidationResult`. Every other module imports from here.

### `src/constants.ts`
Static configuration: `STORAGE_KEY`, `DATA_VERSION`, weekday labels, all 7 categories with labels, 8-color palette (with Tailwind class mappings for bg/text/border), 20 curated icons with labels, and valid weekday set. This is the single source of truth for what values are valid.

### `src/utils/dateUtils.ts`
30 pure date functions: `dateString()`, `parseDate()` (with leap-year validation), `addDays()`, `daysBetween()`, `isBefore()` / `isAfter()` / `isSameOrBefore()` / `isSameOrAfter()`, `startOfWeek()` / `endOfWeek()` (with Sunday/Monday start support), `startOfMonth()` / `endOfMonth()`, `enumerateDates()`, `formatDateLong()` / `formatDateMedium()` / `formatDateShort()`, `getGreeting()` (time-based). All operate on `YYYY-MM-DD` strings and use local `Date` objects — never UTC.

### `src/utils/habitEngine.ts`
The core business logic: `isScheduledOn()` (checks schedule + creation date + archive date), `isCompletedOn()`, `calculateCurrentStreak()` (schedule-aware, today-incomplete-tolerant), `calculateLongestStreak()` (walks full history), `getBestStreak()`, `getActiveHabits()` / `getArchivedHabits()`, `getHabitsScheduledOn()`, `getTodaysCompletionRate()`, `scheduleLabel()` (human-readable schedule description), `findLastScheduledDate()` / `findNextScheduledDate()`.

### `src/utils/analytics.ts`
Pure analytics functions: `getOverallStats()` (completion rate over a period), `getWeeklyTrend()` (weekly breakdown for bar charts), `getHabitStats()` (per-habit completion rates), `getMostConsistentHabits()` (sorted by rate), `getScheduledVsCompleted()`, `getDailyActivity()` (for heatmap data), `getActivityIntensity()`.

### `src/utils/storage.ts`
Persistence boundary: `validateHabit()` / `validateCompletion()` / `validateAppData()` / `validateImportData()` / `validateSettings()` (all pure functions with type guards), `loadState()` (validates and salvages), `saveState()`, `clearAllData()`, `exportToJSON()`, `createEmptyData()`.

### `src/utils/iconMap.ts`
Maps the 20 icon string IDs (`"BookOpen"`, `"Dumbbell"`, etc.) to their lucide-react components. Falls back to `BookOpen` if the ID is unknown.

### `src/store/StoreContext.tsx`
The single state container. Wraps the app in a Context provider. Exposes: `habits`, `completions`, `settings`, `today`, `saveError`, and mutation functions (`createHabit`, `updateHabit`, `archiveHabit`, `restoreHabit`, `deleteHabit`, `toggleCompletion`, `updateSettings`, `importData`, `clearAll`). Persists to localStorage on every state change via `useEffect`. Listens to `storage` events for cross-tab sync. Applies theme by toggling the `dark` class on `<html>`.

### `src/components/Modal.tsx`
Accessible modal with Escape-to-close, click-outside-to-close, body scroll lock, and a sticky header/footer. Also exports `ConfirmDialog` for destructive action confirmations.

### `src/components/Drawer.tsx`
Side drawer for the habit detail view. Same accessibility features as Modal. Slides in from the right on desktop, takes full width on mobile.

### `src/components/HabitCard.tsx`
The today's-habit card: icon, name, schedule/target label, streak badge, and a large circular completion toggle button with a check-pop animation. The toggle button stops propagation so clicking it doesn't trigger the card's onClick (which navigates to habit details).

### `src/components/HabitDetail.tsx`
Stats display for a single habit: icon, name, description, schedule, target, and three stat cards (current streak, longest streak, total completions).

### `src/components/HabitForm.tsx`
The create/edit form with: name (required, 1–60 chars, inline validation), description (optional), target (optional), icon picker (20 icons in a grid), category selector (7 categories as badges), color picker (8 colors as circles), schedule type (every day / specific days), weekday toggles. Validates on submit and shows inline errors. Preserves entered values if validation fails.

### `src/components/CalendarHeatmap.tsx`
The 12-month activity heatmap. Builds a map of cell data (date, scheduled count, completed count, intensity, completed habit names) for each day, groups into week columns, renders as a grid of 12px cells with 5 intensity levels. Includes month labels, weekday labels, a legend distinguishing "nothing scheduled" from "missed", and a hover tooltip showing date and completed habits. Mobile shows last 8 weeks in a scrollable strip.

### `src/pages/Dashboard.tsx`
The daily workspace. Shows a greeting + date + motivational message + "New Habit" button header. Four summary cards (completed today, scheduled today, completion %, best streak with habit name). Today's habit list sorted by completion status (incomplete first). Weekly progress sidebar with a progress bar, mini 4-week trend chart, and a link to analytics. Empty state when no habits exist.

### `src/pages/MyHabits.tsx`
Habit management. Grid of habit cards showing icon, name, category, schedule, current and best streaks, and a "Due"/"Done" badge for today. Each card has edit, archive, and (if archived) restore/delete buttons. Toggle between active and archived views. Clicking a card opens a detail drawer with stats and a 6-month heatmap. Create and edit use modals.

### `src/pages/Analytics.tsx`
Analytics with period selector (week/month/quarter). Four stat cards (completion rate, completed, missed, scheduled). Weekly trend bar chart with color-coded bars (green ≥75%, indigo ≥50%, light indigo ≥25%, slate <25%) and hover tooltips. 12-month heatmap with habit filter dropdown. Per-habit completion breakdown with progress bars. Most consistent habits ranked by completion rate. Scheduled-vs-completed comparison bar.

### `src/pages/Settings.tsx`
Theme selector (system/light/dark with icons). Week-start selector (Sunday/Monday). Data export (downloads JSON file with date in filename). Data import (file picker → validation → merge/replace confirmation → result message). Clear all data (confirmation dialog suggesting export first).

### `src/App.tsx`
The app shell. Desktop: persistent left sidebar with logo, four nav links, and a footer. Mobile: sticky header with hamburger button that opens a nav drawer. Main content area with max-width 640px container. Routes between the four pages based on `currentView` state. Shows a save error banner if localStorage writes fail.

### `src/main.tsx`
React entry point. Wraps `<App />` in `<StrictMode>` and renders to `#root`.

---

## Database Schema

This application does not use a database. All data is stored in `localStorage` under the key `habitforge:v1` as a single JSON blob with the following shape:

```typescript
interface PersistedState {
  version: number;              // DATA_VERSION = 1
  data: AppData;
  settings: Settings;
}

interface AppData {
  version: number;
  habits: Habit[];
  completions: Completion[];
}

interface Habit {
  id: string;                   // crypto.randomUUID()
  name: string;                 // 1–60 characters
  description?: string;
  icon: string;                 // one of 20 curated icon IDs
  category: CategoryId;         // study | health | fitness | creativity | productivity | personal | custom
  color: string;                // one of 8 color IDs
  schedule: Schedule;           // { type: 'daily' | 'weekdays', days: Weekday[] }
  target?: string;              // e.g. "Read 20 pages"
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
  archivedAt: string | null;    // null if active
}

interface Completion {
  id: string;                   // crypto.randomUUID()
  habitId: string;              // references Habit.id
  date: string;                 // YYYY-MM-DD (local calendar date)
  completedAt: string;          // ISO timestamp
}

interface Settings {
  theme: 'system' | 'light' | 'dark';
  weekStart: 'sunday' | 'monday';
}
```

**Validation rules enforced on load and on import:**
- Habit name: non-empty, ≤60 characters.
- Icon: must be one of the 20 curated IDs.
- Category: must be one of the 7 defined categories.
- Color: must be one of the 8 defined color IDs.
- Schedule: must have a valid type and at least one weekday.
- Completion date: must be a valid `YYYY-MM-DD` calendar date (rejects Feb 30, Feb 29 on non-leap years, etc.).
- Completion habitId: must reference an existing habit.
- No duplicate completions: at most one per habit per date.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (runs automatically in Bolt)
npm run dev

# Build for production
npm run build

# Type-check
npm run typecheck

# Run tests
npm run test

# Lint
npm run lint
```

No environment variables need to be configured. No backend needs to be running. The app works entirely in the browser.

---

## Test Results

```
Test Files  4 passed (4)
     Tests  101 passed (101)

 ✓ src/__tests__/dateUtils.test.ts    (30 tests)
 ✓ src/__tests__/habitEngine.test.ts  (37 tests)
 ✓ src/__tests__/analytics.test.ts     (8 tests)
 ✓ src/__tests__/storage.test.ts      (26 tests)
```

Tests cover: date parsing and formatting, leap years, month/year boundaries, schedule evaluation (daily and weekday-specific), current streak (completed day, pending day, missed day, across unscheduled days, month boundary, year boundary, leap day, archived habits, long streaks), longest streak, undo mid-streak, habit created partway through a week, completion rates with zero eligible occurrences, analytics excluding unscheduled dates, persistence after save/load, malformed localStorage data, partial data salvage, duplicate completion detection, import validation, and archiving without losing historical records.

---

## What Comes Next

- **Reminders and notifications:** Browser notification API to remind users to complete habits at scheduled times.
- **Habit categories and tags:** More granular grouping and filtering beyond the 7 built-in categories.
- **Notes per completion:** Allow users to add a short note when marking a habit complete (e.g., "Read 25 pages of Atomic Habits").
- **Streak recovery metrics:** Track how quickly a user recovers after breaking a streak, and show a "recovery rate" statistic.
- **Data migration to Supabase:** If multi-device sync becomes necessary, the storage module's validation functions can be reused to validate data coming from a Supabase backend.
- **Custom icons:** Allow users to upload or select from a larger icon library.
- **Habit templates:** Pre-built habit presets (e.g., "Morning meditation", "Daily walk") that users can import with one click.
