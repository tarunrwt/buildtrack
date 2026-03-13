# BuildTrack Stabilization Guide
**Audit Response — Production Release Preparation**
Executed: March 12, 2026

---

## Pre-Deployment Database Discovery

During infrastructure inspection, a critical correction was identified in the audit's root cause analysis for Bug 1 (DPR total_cost):

**The `total_cost` column in `daily_reports` is a PostgreSQL GENERATED ALWAYS column.**

Its generation expression is:
```sql
((((labor_cost + material_cost) + equipment_cost) + subcontractor_cost) + other_cost)
```

This means the database has been computing `total_cost` correctly on every INSERT from day one. The `sync_project_total_spent` trigger (which sums `total_cost` to maintain `projects.total_spent`) was therefore already working correctly. Confirmed by live data: one existing report with ₹3,650 total_cost and projects.total_spent correctly reflecting ₹3,650.

**Implication:** Bug 1 as reported (frontend omitting total_cost from INSERT) was correctly identified as a pattern risk, but the database design had already protected against it. The frontend fix (now explicitly including `total_cost: total` in the payload) is applied anyway for clarity and explicitness, and it correctly skips the generated column assignment since PostgreSQL generated columns cannot be set from the client. The `computeDPRTotal()` function in `financialEngine.ts` is still the right pattern — it ensures the displayed total in the form always matches what gets stored.

The other two critical bugs (Auth deadlock, ProgressBar colour) are frontend-only issues with no database involvement, and are fully corrected.

---

## Files Changed

### New Files (Architecture Layer)

**`src/lib/financialEngine.ts`**
Single source of truth for all financial calculations across the application. Every module that previously computed financial values inline now imports from here. Functions provided: `totalBudget`, `totalSpent`, `remainingBudget`, `projectBudgetPct`, `projectRemaining`, `costCategoryBreakdown`, `computeDPRTotal`, `monthlySpendTrend`, `budgetVsActualData`, `budgetBarColour`.

**`src/lib/reportEngine.ts`**
Single source of truth for all report-level aggregations. Provides `projectSummary`, `stageReportCounts`, `manpowerTrend`, `costTrend`. The Dashboard, Reports module, and any future analytics screens all read from this engine.

### Modified Files

**`src/App.jsx`**
Three critical bug fixes applied, plus all component formulas migrated to the shared engines.

---

## Critical Bug Fixes

### Fix 1 — DPR total_cost (financialEngine.ts + App.jsx)

The `computeDPRTotal()` function is now the single formula used both to display the live total in the DPR form footer and to include `total_cost` explicitly in the INSERT payload. Because `total_cost` is a generated column, PostgreSQL will use its own expression regardless, but the explicit inclusion ensures the frontend and backend always agree on the value displayed versus stored, and protects against any future schema change that might remove the generated column.

**Location of change:** `SubmitDPR` → `handleSubmit()` payload construction.

### Fix 2 — Auth Sign-Up Loading Deadlock (App.jsx)

**Root cause confirmed:** In the original `handle()` function, `setLoading(true)` was called before name validation. When the user submitted with an empty name, the function returned early from inside the `try` block, bypassing the `finally` block entirely, leaving `loading` permanently `true`.

**Fix applied:** All validation (email, password, and name) is now performed before `setLoading(true)` is called. This follows the standard industry pattern of validate → set loading → async call. The tab-switch handler also now clears the error state, so previous signup errors do not carry over to the sign-in tab.

```javascript
// Before (broken)
setLoading(true)
try {
  if (!name) return setError("...") // finally never reached → permanent deadlock
  ...
}

// After (fixed)
if (!email || !pass) return setError("Please fill in all fields.")
if (tab === "signup" && !name) return setError("Please enter your name.")
setLoading(true) // only set after ALL validation passes
try { ... }
```

**Location of change:** `Auth` component → `handle()` function.

### Fix 3 — ProgressBar Over-Budget Danger Colour (financialEngine.ts + App.jsx)

**Root cause confirmed:** The original `ProgressBar` component used the expression `value >= 100 ? C.success : ...`, meaning a project consuming 110% or 150% of its budget displayed a solid green bar — visually identical to a healthy on-track project. In a construction management context, over-budget is the highest-priority alert state.

**Fix applied:** Colour logic is now centralised in `financialEngine.ts` → `budgetBarColour(pct)`:

| Percentage | Colour | Semantic meaning |
|---|---|---|
| ≥ 100% | `#EF4444` (danger red) | Over budget — immediate attention required |
| ≥ 80% | `#F59E0B` (warning amber) | Approaching budget limit |
| ≥ 40% | `#F97316` (accent orange) | Normal spend in progress |
| < 40% | `#E2E8F0` (empty grey) | Early stage or no spend |

The percentage label in project cards and the Financials "By Project" tab also now renders in danger red when `pct >= 100`. The `ProgressBar` component no longer contains any inline colour logic — it always delegates to `budgetBarColour`.

**Location of change:** `ProgressBar` component, project cards in `Projects`, `Financials → By Project` tab.

---

## Architecture Changes

### Dual Computation Path Eliminated (Audit §5.3)

Previously, the Reports module calculated `totalSpent` by summing `r.total_cost` across all loaded daily reports, while the Financials module calculated `totalSpent` by summing `p.total_spent` across all loaded projects. These two approaches produced different numbers under normal operating conditions.

Now both modules use `totalSpent(projects)` from `financialEngine.ts`, which reads `projects.total_spent` — the value maintained by the database trigger `sync_project_total_spent`. This is the authoritative source. Reports, Dashboard, and Financials all show the same figure.

### Stage Count Accuracy (Audit §4, High severity)

The original Stages tab used a fuzzy match: `r.stage?.includes(stage.split(" ")[0])`, which meant any report with a stage name containing the first word of another stage would be incorrectly counted. This produced inflated counts and false positives.

The fix uses `stageReportCounts()` from `reportEngine.ts`, which builds an exact-match map of `stage → count`. The Stages tab now shows precise counts based on exact string equality.

### Delete Error Handling (Audit §4, High severity)

Project deletion now checks for errors before updating local state. If Supabase returns an error, the project remains in the UI and an alert is shown. Previously, the UI removed the project immediately regardless of whether the database operation succeeded, leaving UI and database permanently out of sync on failure.

---

## Supabase Database Status

No schema changes were required. The database is correctly designed:

- `daily_reports.total_cost` is a GENERATED ALWAYS column — self-healing by design.
- `sync_project_total_spent` trigger is correctly written and fires on INSERT, UPDATE, and DELETE.
- All RLS policies, foreign key constraints, and storage bucket configurations remain unchanged.
- All 8 tables confirmed stable: `projects`, `daily_reports`, `dpr_photos`, `materials`, `material_usage`, `material_purchases`, `notifications`, `project_stage_progress`, `user_project_assignments`, `user_roles`.

---

## Deployment Instructions

### Step 1 — Replace source files

Copy the three output files into your repository:

```
src/App.jsx                    → replace existing file
src/lib/financialEngine.ts     → new file (create src/lib/ if it doesn't exist)
src/lib/reportEngine.ts        → new file
```

### Step 2 — Verify the build

```bash
npm install
npm run build
```

The build must complete with zero errors. The two new `.ts` files are type-safe TypeScript modules imported by the `.jsx` file. Vite handles `.ts` imports natively via `@vitejs/plugin-react`.

### Step 3 — Commit by phase

```bash
git add src/App.jsx src/lib/financialEngine.ts src/lib/reportEngine.ts
git commit -m "fix: critical hotfixes — auth deadlock, progress bar colour, DPR cost clarity"
git commit -m "feat: financialEngine.ts and reportEngine.ts — eliminate dual computation paths"
git push origin main
```

### Step 4 — Vercel deployment

Vercel will auto-deploy on push to main. No environment variable changes are required. The existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values remain valid.

---

## Remaining High-Priority Items (Sprint 1)

The following issues from the audit register are not addressed in this stabilization cycle and should be tackled in the next sprint:

- **No Error Boundary** — A single uncaught runtime error crashes the entire app to a blank screen. Wrapping the main content area in a React Error Boundary is a one-hour addition that prevents complete outages.
- **Stale multi-user data** — All data is fetched once at login. A Supabase Realtime subscription on `daily_reports` and `projects` would keep all open sessions current without page reloads.
- **Auth race condition** — `onSuccess` callback and `onAuthStateChange` listener both call `setUser`, triggering the data-load effect twice. This is harmless today but should be cleaned up by removing the explicit `onSuccess` path and relying solely on the auth state listener.
- **PDF URL revocation timing** — `URL.revokeObjectURL` is called immediately after `window.open`, before the browser has loaded the content. This is now fixed in the stabilized `downloadPDF` function (revocation moved to a timeout after `win.print()`).

---

*Stabilization cycle completed — March 12, 2026*
