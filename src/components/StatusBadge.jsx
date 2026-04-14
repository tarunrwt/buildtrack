import { C } from "../constants/colors"
import { Badge } from "./Badge"

/**
 * Semantic status badge.
 * Maps status strings (project status, role names, material categories)
 * to consistent colour pairings defined in the palette.
 */
export const StatusBadge = ({ status }) => {
  const map = {
    "Completed":          { color: C.success,   bg: "#D1FAE5" },
    "In Progress":        { color: C.info,       bg: "#DBEAFE" },
    "Not Started":        { color: C.textMuted,  bg: "#F1F5F9" },
    "active":             { color: C.success,    bg: "#D1FAE5" },
    "delayed":            { color: C.danger,     bg: "#FEE2E2" },
    "on_hold":            { color: C.warning,    bg: "#FEF3C7" },
    "completed":          { color: C.info,       bg: "#DBEAFE" },
    "inactive":           { color: C.textMuted,  bg: "#F1F5F9" },
    "Admin":              { color: C.accent,     bg: "#FFF7ED" },
    "Project Manager":    { color: C.info,       bg: "#DBEAFE" },
    "Site Engineer":      { color: C.success,    bg: "#D1FAE5" },
    "Accountant":         { color: C.warning,    bg: "#FEF3C7" },
    "admin":              { color: C.accent,     bg: "#FFF7ED" },
    "project_manager":    { color: C.info,       bg: "#DBEAFE" },
    "site_engineer":      { color: C.success,    bg: "#D1FAE5" },
    "accountant":         { color: C.warning,    bg: "#FEF3C7" },
    "viewer":             { color: C.textMuted,  bg: "#F1F5F9" },
    "Cement & Concrete":  { color: "#92400E",    bg: "#FEF3C7" },
    "Steel & Iron":       { color: "#1E3A5F",    bg: "#DBEAFE" },
    "Aggregates":         { color: "#065F46",    bg: "#D1FAE5" },
    "Masonry":            { color: "#6B21A8",    bg: "#F3E8FF" },
    "Electrical":         { color: "#B45309",    bg: "#FEF3C7" },
    "Plumbing":           { color: "#0369A1",    bg: "#E0F2FE" },
    "Finishing":          { color: "#BE185D",    bg: "#FCE7F3" },
    // Labour category badges
    "Unskilled Labour":           { color: C.textMuted, bg: "#F1F5F9" },
    "Semi-Skilled Labour":        { color: C.info,      bg: "#DBEAFE" },
    "Skilled Labour (Mistri)":    { color: C.success,   bg: "#D1FAE5" },
    "Highly Skilled / Supervisor":{ color: C.accent,    bg: "#FFF7ED" },
  }
  const s = map[status] || { color: C.textMuted, bg: "#F1F5F9" }
  return <Badge label={status} color={s.color} bg={s.bg} />
}
