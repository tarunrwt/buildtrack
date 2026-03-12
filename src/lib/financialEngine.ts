/**
 * financialEngine.ts
 * BuildTrack — Single source of truth for all financial calculations.
 *
 * Every module (Dashboard, Reports, Financials, Projects) MUST derive
 * financial figures from these functions. No duplicate formulas elsewhere.
 */

export interface Project {
  id: string
  name: string
  total_cost: number
  total_spent: number
  status: string
  [key: string]: unknown
}

export interface DailyReport {
  id: string
  project_id: string
  total_cost: number
  labor_cost: number
  material_cost: number
  equipment_cost: number
  subcontractor_cost: number
  other_cost: number
  report_date: string
  [key: string]: unknown
}

// ─── Project-level financials ──────────────────────────────────────────────

/** Total budget across all projects */
export const totalBudget = (projects: Project[]): number =>
  projects.reduce((sum, p) => sum + (Number(p.total_cost) || 0), 0)

/** Total spent — authoritative value from projects.total_spent (trigger-maintained) */
export const totalSpent = (projects: Project[]): number =>
  projects.reduce((sum, p) => sum + (Number(p.total_spent) || 0), 0)

/** Remaining budget (can be negative = over-budget) */
export const remainingBudget = (projects: Project[]): number =>
  totalBudget(projects) - totalSpent(projects)

/** Budget utilisation percentage for a single project */
export const projectBudgetPct = (project: Project): number =>
  project.total_cost > 0
    ? Math.round((Number(project.total_spent || 0) / Number(project.total_cost)) * 100)
    : 0

/** Remaining for a single project */
export const projectRemaining = (project: Project): number =>
  Number(project.total_cost || 0) - Number(project.total_spent || 0)

// ─── Cost category breakdowns (from DPR records) ─────────────────────────

export const laborCost = (reports: DailyReport[]): number =>
  reports.reduce((sum, r) => sum + (Number(r.labor_cost) || 0), 0)

export const materialCost = (reports: DailyReport[]): number =>
  reports.reduce((sum, r) => sum + (Number(r.material_cost) || 0), 0)

export const equipmentCost = (reports: DailyReport[]): number =>
  reports.reduce((sum, r) => sum + (Number(r.equipment_cost) || 0), 0)

export const subcontractorCost = (reports: DailyReport[]): number =>
  reports.reduce((sum, r) => sum + (Number(r.subcontractor_cost) || 0), 0)

export const otherCost = (reports: DailyReport[]): number =>
  reports.reduce((sum, r) => sum + (Number(r.other_cost) || 0), 0)

/** Full cost category breakdown — used by pie charts and tables */
export const costCategoryBreakdown = (reports: DailyReport[]) => [
  { name: "Labor",          value: laborCost(reports),          color: "#F97316" },
  { name: "Materials",      value: materialCost(reports),       color: "#3B82F6" },
  { name: "Equipment",      value: equipmentCost(reports),      color: "#10B981" },
  { name: "Subcontractor",  value: subcontractorCost(reports),  color: "#F59E0B" },
  { name: "Other",          value: otherCost(reports),          color: "#334155" },
]

// ─── DPR insert total ─────────────────────────────────────────────────────

/**
 * Computes total_cost for a single DPR form submission.
 * This MUST be included in every daily_reports INSERT payload.
 */
export const computeDPRTotal = (fields: {
  labor_cost: string | number
  material_cost: string | number
  equipment_cost: string | number
  subcontractor_cost: string | number
  other_cost: string | number
}): number =>
  (parseFloat(String(fields.labor_cost)) || 0) +
  (parseFloat(String(fields.material_cost)) || 0) +
  (parseFloat(String(fields.equipment_cost)) || 0) +
  (parseFloat(String(fields.subcontractor_cost)) || 0) +
  (parseFloat(String(fields.other_cost)) || 0)

// ─── Monthly trend (used by both Reports and Financials) ──────────────────

export const monthlySpendTrend = (reports: DailyReport[], months = 6) => {
  const grouped = reports.reduce<Record<string, number>>((acc, r) => {
    const key = r.report_date?.slice(0, 7)
    if (!key) return acc
    acc[key] = (acc[key] || 0) + (Number(r.total_cost) || 0)
    return acc
  }, {})

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([key, spend]) => ({
      month: new Date(key + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      spend,
    }))
}

// ─── Budget vs actual per project (chart data) ───────────────────────────

export const budgetVsActualData = (projects: Project[]) =>
  projects.map(p => ({
    project: p.name.split(" ").slice(0, 2).join(" "),
    budget:  Number(p.total_cost) || 0,
    spent:   Number(p.total_spent) || 0,
  }))

// ─── Progress bar colour logic ────────────────────────────────────────────

/** CRITICAL FIX: over-budget (>= 100%) must show danger red, NOT success green */
export const budgetBarColour = (pct: number): string => {
  if (pct >= 100) return "#EF4444"  // danger — over budget
  if (pct >= 80)  return "#F59E0B"  // warning — approaching limit
  if (pct >= 40)  return "#F97316"  // accent — healthy spend
  return "#E2E8F0"                   // empty
}
