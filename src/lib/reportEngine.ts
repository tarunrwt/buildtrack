/**
 * reportEngine.ts
 * BuildTrack — Single source of truth for all report-level aggregations.
 *
 * Dashboard, Reports module, and any future analytics screens
 * MUST read these values. Never compute them inline in components.
 */

import type { Project, DailyReport } from "./financialEngine"
import { totalBudget, totalSpent } from "./financialEngine"

export interface ReportSummary {
  totalProjects:     number
  activeProjects:    number
  delayedProjects:   number
  completedProjects: number
  onHoldProjects:    number
  totalReports:      number
  avgManpower:       number
  totalBudget:       number
  totalSpent:        number
  budgetUtilisationPct: number
}

// ─── Project-level aggregations ───────────────────────────────────────────

export const projectSummary = (projects: Project[], reports: DailyReport[]): ReportSummary => {
  const budget  = totalBudget(projects)
  const spent   = totalSpent(projects)
  const avgMp   = reports.length > 0
    ? Math.round(reports.reduce((s, r) => s + (Number(r.manpower_count) || 0), 0) / reports.length)
    : 0

  return {
    totalProjects:        projects.length,
    activeProjects:       projects.filter(p => p.status === "active").length,
    delayedProjects:      projects.filter(p => p.status === "delayed").length,
    completedProjects:    projects.filter(p => p.status === "completed").length,
    onHoldProjects:       projects.filter(p => p.status === "on_hold").length,
    totalReports:         reports.length,
    avgManpower:          avgMp,
    totalBudget:          budget,
    totalSpent:           spent,
    budgetUtilisationPct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
  }
}

// ─── Stage report counts ──────────────────────────────────────────────────

/** Returns a map of exact stage name → DPR count */
export const stageReportCounts = (reports: DailyReport[]): Record<string, number> =>
  reports.reduce<Record<string, number>>((acc, r) => {
    const key = r.stage as string
    if (key) acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

// ─── Manpower trend (last N reports) ─────────────────────────────────────

export const manpowerTrend = (reports: DailyReport[], count = 10) =>
  reports
    .slice(0, count)
    .reverse()
    .map(r => ({
      date:      (r.report_date as string)?.slice(5) ?? "",
      manpower:  Number(r.manpower_count) || 0,
      cost:      Number(r.total_cost) || 0,
    }))

// ─── Cost trend by month (used in Overview chart) ────────────────────────

export const costTrend = (reports: DailyReport[], months = 6) => {
  const grouped = reports.reduce<Record<string, number>>((acc, r) => {
    const key = (r.report_date as string)?.slice(0, 7)
    if (!key) return acc
    acc[key] = (acc[key] || 0) + (Number(r.total_cost) || 0)
    return acc
  }, {})

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([key, cost]) => ({
      date: new Date(key + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      cost,
    }))
}
