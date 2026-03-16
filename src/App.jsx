import { useState, useEffect, useRef } from "react"
import { supabase } from "./lib/supabase"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell
} from "recharts"
import {
  Building2, LayoutDashboard, FolderOpen, FileText,
  Package, BarChart2, Users, Bell, Search, Home,
  LogOut, Plus, Trash2, Eye, Download, ChevronDown,
  X, CheckCircle, AlertTriangle, Clock, TrendingUp,
  DollarSign, Calendar, MapPin, Camera, Filter,
  ArrowLeft, Edit3, MoreVertical, Sun, CloudRain,
  Cloud, User, ShoppingCart, Activity, Layers,
  ChevronRight, AlertCircle, RefreshCw, Upload,
  HardHat, Wrench, Truck, Loader, UserPlus
} from "lucide-react"

const FONT = "'Barlow', sans-serif"
const FONT_HEADING = "'Barlow Condensed', sans-serif"

const C = {
  sidebar: "#0D1B2A", sidebarHover: "#162435",
  accent: "#F97316", accentDark: "#EA6B0E", accentLight: "#FFF7ED",
  success: "#10B981", warning: "#F59E0B", danger: "#EF4444", info: "#3B82F6",
  bg: "#F1F5F9", card: "#FFFFFF", border: "#E2E8F0",
  text: "#0F172A", textMuted: "#64748B", textLight: "#94A3B8",
  navy: "#1E3A5F", charcoal: "#334155",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = n => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n || 0).toLocaleString("en-IN")}`

// Professional role label — applied only in Sidebar user card.
// Stored Supabase values are never changed, only the display text.
const formatRole = role => ({
  admin:           "Admin",
  project_manager: "Project Manager",
  site_engineer:   "Site Engineer",
  accountant:      "Accountant",
  viewer:          "Viewer",
}[role] || "Viewer")

const downloadCSV = (reports) => {
  const headers = ["Project", "Floor", "Stage", "Date", "Weather", "Manpower", "Labor Cost", "Material Cost", "Equipment Cost", "Subcontractor Cost", "Other Cost", "Total Cost", "Remarks"]
  const rows = reports.map(r => [
    r.projects?.name || "", r.floor, r.stage, r.report_date, r.weather,
    r.manpower_count, r.labor_cost, r.material_cost, r.equipment_cost,
    r.subcontractor_cost, r.other_cost, r.total_cost, `"${(r.remarks || "").replace(/"/g, "'")}"`
  ])
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "buildtrack-reports.csv"; a.click()
  URL.revokeObjectURL(url)
}

const downloadPDF = (reports, projects) => {
  const totalSpent = projects.reduce((s, p) => s + (p.total_spent || 0), 0)
  const totalBudget = projects.reduce((s, p) => s + (p.total_cost || 0), 0)
  const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
  const html = `<!DOCTYPE html><html><head><title>BuildTrack Report</title>
  <style>body{font-family:Arial,sans-serif;padding:40px;color:#0F172A}h1{color:#F97316;font-size:28px;margin-bottom:4px}
  .sub{color:#64748B;margin-bottom:30px}.kpi{display:flex;gap:20px;margin-bottom:30px}
  .kpi-box{flex:1;background:#F8FAFC;border-radius:8px;padding:16px;border-top:3px solid #F97316}
  .kpi-box h3{margin:0;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:.06em}
  .kpi-box p{margin:6px 0 0;font-size:22px;font-weight:700}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#0D1B2A;color:#fff;padding:10px 12px;text-align:left}
  td{padding:9px 12px;border-bottom:1px solid #E2E8F0}tr:nth-child(even){background:#F8FAFC}
  .footer{margin-top:30px;font-size:11px;color:#94A3B8;text-align:center}</style></head>
  <body><h1>BuildTrack — Site Progress Report</h1><p class="sub">Generated: ${now}</p>
  <div class="kpi"><div class="kpi-box"><h3>Total Budget</h3><p>${fmt(totalBudget)}</p></div>
  <div class="kpi-box"><h3>Total Spent</h3><p>${fmt(totalSpent)}</p></div>
  <div class="kpi-box"><h3>Total Reports</h3><p>${reports.length}</p></div>
  <div class="kpi-box"><h3>Projects</h3><p>${projects.length}</p></div></div>
  <h2 style="margin-bottom:12px">Daily Progress Reports</h2>
  <table><tr><th>Date</th><th>Project</th><th>Stage</th><th>Floor</th><th>Weather</th><th>Manpower</th><th>Total Cost</th></tr>
  ${reports.map(r => `<tr><td>${r.report_date}</td><td>${r.projects?.name || ""}</td><td>${r.stage}</td><td>${r.floor}</td><td>${r.weather || "-"}</td><td>${r.manpower_count}</td><td>${fmt(r.total_cost)}</td></tr>`).join("")}
  </table><p class="footer">BuildTrack Construction Management System</p></body></html>`
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, "_blank")
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

// ─── Project PDF export ────────────────────────────────────────────────────────
const downloadProjectPDF = (project, reports) => {
  const projReports = reports.filter(r => r.project_id === project.id)
  const pct = project.total_cost > 0 ? Math.round(((project.total_spent || 0) / project.total_cost) * 100) : 0
  const remaining = (project.total_cost || 0) - (project.total_spent || 0)
  const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
  const html = `<!DOCTYPE html><html><head><title>${project.name} — BuildTrack</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#0F172A;max-width:900px;margin:0 auto}
    h1{color:#F97316;font-size:26px;margin:0 0 4px}
    .sub{color:#64748B;font-size:13px;margin-bottom:24px}
    .badge{display:inline-block;background:#D1FAE5;color:#065F46;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize;margin-left:10px}
    .kpi{display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap}
    .kpi-box{flex:1;min-width:140px;background:#F8FAFC;border-radius:8px;padding:14px;border-top:3px solid #F97316}
    .kpi-box h3{margin:0;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:.06em}
    .kpi-box p{margin:6px 0 0;font-size:20px;font-weight:700;color:#0F172A}
    .section{margin-bottom:28px}
    h2{font-size:16px;color:#1E3A5F;border-bottom:2px solid #F97316;padding-bottom:6px;margin-bottom:14px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#0D1B2A;color:#fff;padding:9px 11px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
    td{padding:8px 11px;border-bottom:1px solid #E2E8F0}
    tr:nth-child(even){background:#F8FAFC}
    .meta{display:flex;gap:24px;flex-wrap:wrap;background:#F8FAFC;border-radius:8px;padding:14px;margin-bottom:24px;font-size:13px}
    .meta-item label{color:#64748B;display:block;font-size:11px;margin-bottom:2px}
    .meta-item span{font-weight:600;color:#0F172A}
    .footer{margin-top:30px;font-size:11px;color:#94A3B8;text-align:center;border-top:1px solid #E2E8F0;padding-top:12px}
  </style></head>
  <body>
    <h1>${project.name}<span class="badge">${project.status}</span></h1>
    <p class="sub">Project Report — Generated: ${now}</p>
    <div class="meta">
      ${project.start_date ? `<div class="meta-item"><label>Start Date</label><span>${project.start_date}</span></div>` : ""}
      ${project.target_end_date ? `<div class="meta-item"><label>Target End Date</label><span>${project.target_end_date}</span></div>` : ""}
      ${project.area_of_site ? `<div class="meta-item"><label>Site Area</label><span>${project.area_of_site.toLocaleString()} sqft</span></div>` : ""}
      ${project.latitude && project.longitude ? `<div class="meta-item"><label>Location</label><span>${Number(project.latitude).toFixed(4)}, ${Number(project.longitude).toFixed(4)}</span></div>` : ""}
    </div>
    <div class="kpi">
      <div class="kpi-box"><h3>Total Budget</h3><p>${fmt(project.total_cost)}</p></div>
      <div class="kpi-box"><h3>Amount Spent</h3><p>${fmt(project.total_spent || 0)}</p></div>
      <div class="kpi-box"><h3>Remaining</h3><p>${fmt(remaining)}</p></div>
      <div class="kpi-box"><h3>Budget Used</h3><p>${pct}%</p></div>
      <div class="kpi-box"><h3>Total DPRs</h3><p>${projReports.length}</p></div>
    </div>
    <div class="section">
      <h2>Daily Progress Reports (${projReports.length})</h2>
      ${projReports.length === 0 ? `<p style="color:#64748B;font-size:13px">No reports submitted yet.</p>` : `
      <table>
        <tr><th>Date</th><th>Floor</th><th>Stage</th><th>Weather</th><th>Manpower</th><th>Labour</th><th>Material</th><th>Total Cost</th></tr>
        ${projReports.map(r => `<tr>
          <td>${r.report_date}</td><td>${r.floor}</td><td>${r.stage}</td>
          <td>${r.weather || "—"}</td><td>${r.manpower_count || 0}</td>
          <td>${fmt(r.labor_cost)}</td><td>${fmt(r.material_cost)}</td>
          <td style="font-weight:700;color:#F97316">${fmt(r.total_cost)}</td>
        </tr>`).join("")}
      </table>`}
    </div>
    <p class="footer">BuildTrack Construction Management System — ${project.name}</p>
  </body></html>`
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, "_blank")
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

// ─── Leaflet CDN loader ────────────────────────────────────────────────────────
const loadLeaflet = () => new Promise(resolve => {
  if (window.L) { resolve(window.L); return }
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link")
    link.id = "leaflet-css"
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)
  }
  const script = document.createElement("script")
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  script.onload = () => resolve(window.L)
  document.head.appendChild(script)
})

// ─── UI Components ────────────────────────────────────────────────────────────

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

const Empty = ({ message = "No data yet", sub = "" }) => (
  <div style={{ textAlign: "center", padding: "60px 24px", color: C.textMuted }}>
    <AlertCircle size={36} color={C.border} style={{ marginBottom: 12 }} />
    <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.textLight, margin: "0 0 6px" }}>{message}</p>
    {sub && <p style={{ fontFamily: FONT, fontSize: 13, margin: 0 }}>{sub}</p>}
  </div>
)

const Badge = ({ label, color, bg }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: FONT, background: bg, color, letterSpacing: "0.03em" }}>{label}</span>
)

const StatusBadge = ({ status }) => {
  const map = {
    "Completed": { color: C.success, bg: "#D1FAE5" }, "In Progress": { color: C.info, bg: "#DBEAFE" },
    "Not Started": { color: C.textMuted, bg: "#F1F5F9" }, "active": { color: C.success, bg: "#D1FAE5" },
    "delayed": { color: C.danger, bg: "#FEE2E2" }, "on_hold": { color: C.warning, bg: "#FEF3C7" },
    "completed": { color: C.info, bg: "#DBEAFE" }, "inactive": { color: C.textMuted, bg: "#F1F5F9" },
    "Admin": { color: C.accent, bg: "#FFF7ED" }, "Project Manager": { color: C.info, bg: "#DBEAFE" },
    "Site Engineer": { color: C.success, bg: "#D1FAE5" }, "Accountant": { color: C.warning, bg: "#FEF3C7" },
    "admin": { color: C.accent, bg: "#FFF7ED" }, "project_manager": { color: C.info, bg: "#DBEAFE" },
    "site_engineer": { color: C.success, bg: "#D1FAE5" }, "accountant": { color: C.warning, bg: "#FEF3C7" },
    "viewer": { color: C.textMuted, bg: "#F1F5F9" },
    "Cement & Concrete": { color: "#92400E", bg: "#FEF3C7" }, "Steel & Iron": { color: "#1E3A5F", bg: "#DBEAFE" },
    "Aggregates": { color: "#065F46", bg: "#D1FAE5" }, "Masonry": { color: "#6B21A8", bg: "#F3E8FF" },
    "Electrical": { color: "#B45309", bg: "#FEF3C7" }, "Plumbing": { color: "#0369A1", bg: "#E0F2FE" },
    "Finishing": { color: "#BE185D", bg: "#FCE7F3" },
  }
  const s = map[status] || { color: C.textMuted, bg: "#F1F5F9" }
  return <Badge label={status} color={s.color} bg={s.bg} />
}

const KPICard = ({ label, value, sub, icon: Icon, accent, trend }) => (
  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, flex: 1, minWidth: 160, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent || C.accent, borderRadius: "12px 12px 0 0" }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
        <p style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>{sub}</p>}
      </div>
      <div style={{ background: accent ? accent + "20" : C.accentLight, borderRadius: 10, padding: 10, display: "flex" }}>
        <Icon size={20} color={accent || C.accent} />
      </div>
    </div>
    {trend && <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={12} color={C.success} /><span style={{ fontFamily: FONT, fontSize: 11, color: C.success, fontWeight: 600 }}>{trend}</span></div>}
  </div>
)

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.card, borderRadius: "12px 12px 0 0", padding: "0 24px" }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ fontFamily: FONT, fontSize: 13, fontWeight: active === t ? 700 : 500, color: active === t ? C.accent : C.textMuted, padding: "14px 20px", border: "none", background: "none", cursor: "pointer", borderBottom: active === t ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: -1, transition: "all 0.15s", whiteSpace: "nowrap" }}>{t}</button>
    ))}
  </div>
)

const Input = ({ label, type = "text", value, onChange, placeholder, required, icon: Icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>}
    <div style={{ position: "relative" }}>
      {Icon && <Icon size={15} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", padding: Icon ? "10px 12px 10px 36px" : "10px 14px", fontFamily: FONT, fontSize: 14, color: C.text, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, outline: "none" }}
        onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
    </div>
  </div>
)

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>}
    <select value={value} onChange={onChange} style={{ padding: "10px 14px", fontFamily: FONT, fontSize: 14, color: C.text, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, outline: "none", cursor: "pointer" }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
)

const Btn = ({ children, onClick, variant = "primary", size = "md", icon: Icon, disabled, style: extraStyle }) => {
  const styles = {
    primary: { background: C.accent, color: "#fff", border: `1px solid ${C.accent}` },
    secondary: { background: C.card, color: C.text, border: `1px solid ${C.border}` },
    ghost: { background: "transparent", color: C.textMuted, border: "1px solid transparent" },
    danger: { background: C.danger, color: "#fff", border: `1px solid ${C.danger}` },
    outline: { background: "transparent", color: C.accent, border: `1px solid ${C.accent}` },
  }
  const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "9px 18px", fontSize: 13 }, lg: { padding: "12px 24px", fontSize: 14 } }
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], ...sizes[size], fontFamily: FONT, fontWeight: 600, borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", ...(extraStyle || {}) }}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}{children}
    </button>
  )
}

const Modal = ({ title, onClose, children, width = 560 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: C.card, borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.card, borderRadius: "16px 16px 0 0", zIndex: 1 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><X size={16} color={C.textMuted} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
)

const ProgressBar = ({ value, color = C.accent, height = 6 }) => (
  <div style={{ background: "#E2E8F0", borderRadius: height, height, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, value || 0)}%`, height: "100%", background: value >= 100 ? C.success : value >= 60 ? color : value > 0 ? C.warning : "#E2E8F0", borderRadius: height, transition: "width 0.4s ease" }} />
  </div>
)

const WeatherIcon = ({ w }) => {
  if (w?.toLowerCase().includes("rain")) return <CloudRain size={14} color={C.info} />
  if (w?.toLowerCase().includes("cloud")) return <Cloud size={14} color={C.textMuted} />
  return <Sun size={14} color={C.warning} />
}

// ─── Nav & Sidebar ────────────────────────────────────────────────────────────

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderOpen },
  { key: "submit-dpr", label: "Submit DPR", icon: FileText },
  { key: "reports", label: "Reports", icon: BarChart2 },
  { key: "materials", label: "Materials", icon: Package },
  { key: "financials", label: "Financials", icon: DollarSign },
  { key: "users", label: "User Management", icon: Users },
]

const Sidebar = ({ page, setPage, user, userRole, onSignOut }) => (
  <div style={{ width: 240, minWidth: 240, background: C.sidebar, height: "100vh", display: "flex", flexDirection: "column", position: "sticky", top: 0 }}>
    <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1E3A5F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: C.accent, borderRadius: 10, padding: 8, display: "flex" }}><HardHat size={20} color="#fff" /></div>
        <div>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>BuildTrack</p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#64748B", margin: 0 }}>Construction Management</p>
        </div>
      </div>
    </div>
    <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
      {NAV.map(({ key, label, icon: Icon }) => {
        const active = page === key
        return (
          <button key={key} onClick={() => setPage(key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 2, border: "none", cursor: "pointer", background: active ? C.accent : "transparent", transition: "all 0.15s", textAlign: "left" }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.sidebarHover }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}>
            <Icon size={17} color={active ? "#fff" : "#94A3B8"} />
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#fff" : "#94A3B8" }}>{label}</span>
          </button>
        )
      })}
    </nav>
    <div style={{ padding: "16px 12px", borderTop: "1px solid #1E3A5F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 4 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#E2E8F0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email?.split("@")[0] || "User"}</p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#64748B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {formatRole(userRole)}
          </p>
        </div>
      </div>
      <button onClick={onSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", transition: "all 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "#7F1D1D"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <LogOut size={16} color="#EF4444" />
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#EF4444" }}>Sign Out</span>
      </button>
    </div>
  </div>
)

const TopBar = ({ title, subtitle, actions, notifications, onMarkAllRead }) => {
  const [showNotif, setShowNotif] = useState(false)
  const unread = notifications.filter(n => !n.is_read).length
  return (
    <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
      <div>
        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {actions}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowNotif(v => !v)} style={{ position: "relative", background: "#F1F5F9", border: "none", borderRadius: 10, padding: 10, cursor: "pointer", display: "flex" }}>
            <Bell size={18} color={C.charcoal} />
            {unread > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: C.danger, borderRadius: "50%", border: "2px solid #fff" }} />}
          </button>
          {showNotif && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 340, background: C.card, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: `1px solid ${C.border}`, zIndex: 200 }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.text }}>Notifications {unread > 0 && <span style={{ background: C.danger, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 11, marginLeft: 4 }}>{unread}</span>}</span>
                {unread > 0 && <button onClick={onMarkAllRead} style={{ fontFamily: FONT, fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifications.length === 0 ? <Empty message="No notifications" /> : notifications.map(n => (
                  <div key={n.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: n.is_read ? "transparent" : "#FFF7ED", display: "flex", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.is_read ? C.border : C.accent, marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 2px" }}>{n.title}</p>
                      <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Landing ──────────────────────────────────────────────────────────────────

const Landing = ({ onLogin }) => (
  <div style={{ minHeight: "100vh", background: C.sidebar, display: "flex", flexDirection: "column" }}>
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #1E3A5F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: C.accent, borderRadius: 10, padding: 8 }}><HardHat size={20} color="#fff" /></div>
        <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>BuildTrack</span>
      </div>
      <Btn onClick={onLogin} variant="primary" size="md">Get Started</Btn>
    </nav>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ background: C.accent + "20", border: `1px solid ${C.accent}40`, borderRadius: 16, padding: "8px 20px", marginBottom: 28, display: "inline-block" }}>
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>Construction Progress Automation</span>
      </div>
      <h1 style={{ fontFamily: FONT_HEADING, fontSize: 64, fontWeight: 900, color: "#fff", margin: "0 0 20px", lineHeight: 1.05, letterSpacing: "-0.01em", maxWidth: 700 }}>
        Track Every Day.<br /><span style={{ color: C.accent }}>On Every Site.</span>
      </h1>
      <p style={{ fontFamily: FONT, fontSize: 18, color: "#94A3B8", maxWidth: 560, margin: "0 0 40px", lineHeight: 1.6 }}>
        Submit Daily Progress Reports, track costs, manage materials, and monitor project health — all in one platform built for construction teams.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <Btn onClick={onLogin} variant="primary" size="lg" icon={ArrowLeft} style={{ fontSize: 15 }}>Start Managing Projects</Btn>
        <Btn onClick={onLogin} variant="ghost" size="lg" style={{ color: "#94A3B8", fontSize: 15 }}>Sign In</Btn>
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 72, flexWrap: "wrap", justifyContent: "center" }}>
        {[["Daily Progress Reports", "Submit DPRs with cost breakdown, weather, manpower & photos"],
          ["Real-Time Cost Tracking", "Monitor budget vs actual across all projects and stages"],
          ["Materials & Inventory", "Track stock levels, usage logs and purchase history"]].map(([t, d]) => (
          <div key={t} style={{ maxWidth: 220, textAlign: "center" }}>
            <p style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: "#E2E8F0", margin: "0 0 8px" }}>{t}</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>{d}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ─── Auth ─────────────────────────────────────────────────────────────────────

const Auth = ({ onSuccess }) => {
  const [tab, setTab] = useState("signin")
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handle = async () => {
    setError("")
    if (!email || !pass) return setError("Please fill in all fields.")
    setLoading(true)
    try {
      if (tab === "signin") {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (e) throw e
        // Role is fetched from DB in App root — not from frontend selection
        onSuccess(data.user)
      } else {
        if (!name) return setError("Please enter your name.")
        // New signups always receive 'viewer' role — admin assigns roles later
        const { error: e } = await supabase.auth.signUp({ email, password: pass, options: { data: { full_name: name } } })
        if (e) throw e
        setSuccess(true)
      }
    } catch (e) {
      setError(e.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.card, borderRadius: 20, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ background: C.accent, borderRadius: 10, padding: 8 }}><HardHat size={20} color="#fff" /></div>
          <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "0.04em" }}>BuildTrack</span>
        </div>
        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={48} color={C.success} style={{ marginBottom: 16 }} />
            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Check your email</h2>
            <p style={{ fontFamily: FONT, fontSize: 14, color: C.textMuted, margin: "0 0 20px" }}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
            <Btn onClick={() => { setTab("signin"); setSuccess(false) }} variant="outline">Back to Sign In</Btn>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 28 }}>
              {["signin", "signup"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 700, background: tab === t ? C.card : "transparent", color: tab === t ? C.text : C.textMuted, boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tab === "signup" && <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required icon={User} />}
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required icon={User} />
              <Input label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
              {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, margin: 0, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}
              <Btn onClick={handle} disabled={loading} size="lg" style={{ marginTop: 4 }}>
                {loading ? "Please wait..." : tab === "signin" ? "Sign In" : "Create Account"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = ({ user, setPage, projects, reports }) => {
  const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  const totalBudget = projects.reduce((s, p) => s + (p.total_cost || 0), 0)
  const totalSpent = projects.reduce((s, p) => s + (p.total_spent || 0), 0)
  const delayed = projects.filter(p => p.status === "delayed").length

  const cards = [
    { label: "New Project", icon: FolderOpen, page: "projects", bg: C.info },
    { label: "Submit DPR", icon: FileText, page: "submit-dpr", bg: C.accent },
    { label: "View Reports", icon: BarChart2, page: "reports", bg: C.success },
    { label: "Materials", icon: Package, page: "materials", bg: "#8B5CF6" },
    { label: "Financials", icon: DollarSign, page: "financials", bg: C.warning },
    { label: "Team", icon: Users, page: "users", bg: C.charcoal },
  ]

  return (
    <div style={{ padding: 28 }}>
      <div style={{ background: `linear-gradient(135deg, ${C.sidebar} 0%, ${C.navy} 100%)`, borderRadius: 16, padding: "28px 32px", marginBottom: 28, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 160, height: 160, background: C.accent + "15", borderRadius: "50%" }} />
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#94A3B8", margin: "0 0 6px" }}>Welcome back</p>
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 800, margin: "0 0 6px", letterSpacing: "0.02em" }}>{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}</h2>
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#64748B", margin: 0 }}>Last sign in: {now}</p>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <KPICard label="Total Projects" value={projects.length} sub="in your account" icon={FolderOpen} accent={C.info} />
        <KPICard label="Total Budget" value={fmt(totalBudget)} sub="across all projects" icon={DollarSign} accent={C.success} />
        <KPICard label="Total Spent" value={fmt(totalSpent)} sub={`${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of budget`} icon={TrendingUp} accent={C.accent} />
        <KPICard label="Total Reports" value={reports.length} sub="DPRs submitted" icon={FileText} accent={C.warning} />
        <KPICard label="Delayed" value={delayed} sub="projects behind schedule" icon={AlertTriangle} accent={C.danger} />
      </div>
      <div>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.textMuted, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {cards.map(({ label, icon: Icon, page, bg }) => (
            <button key={label} onClick={() => setPage(page)} style={{ background: bg, borderRadius: 12, padding: "20px 16px", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none" }}>
              <Icon size={24} color="#fff" />
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#fff" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Satellite Map (Leaflet CDN, Esri World Imagery) ──────────────────────────
const SatelliteMap = ({ lat, lng, projectName, height = 340 }) => {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!lat || !lng) return
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return
      const map = L.map(containerRef.current).setView([parseFloat(lat), parseFloat(lng)], 17)
      mapRef.current = map
      // Satellite tiles — Esri World Imagery (free, no API key)
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri", maxZoom: 19
      }).addTo(map)
      // Custom orange pin
      const icon = L.divIcon({
        html: `<div style="width:20px;height:20px;background:#F97316;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 20], className: ""
      })
      L.marker([parseFloat(lat), parseFloat(lng)], { icon }).addTo(map)
        .bindPopup(`<b style="font-family:Arial">${projectName}</b><br><span style="font-size:11px;color:#64748B">${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}</span>`)
        .openPopup()
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [lat, lng, projectName])

  if (!lat || !lng) return (
    <div style={{ height, background: "#F1F5F9", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: `1px dashed ${C.border}` }}>
      <MapPin size={30} color={C.textLight} />
      <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: 0 }}>No location saved for this project</p>
      <p style={{ fontFamily: FONT, fontSize: 11, color: C.textLight, margin: 0 }}>Edit the project and click on the map to set a location</p>
    </div>
  )

  return <div ref={containerRef} style={{ width: "100%", height, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }} />
}

// ─── Location Picker (interactive map in form) ────────────────────────────────
const LocationPicker = ({ lat, lng, onChange }) => {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return
      const hasCoords = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))
      const center = hasCoords ? [parseFloat(lat), parseFloat(lng)] : [20.5937, 78.9629]
      const zoom = hasCoords ? 15 : 5
      const map = L.map(containerRef.current).setView(center, zoom)
      mapRef.current = map
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri", maxZoom: 19
      }).addTo(map)
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#F97316;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], className: ""
      })
      const placeMarker = (lt, lg) => {
        if (markerRef.current) { markerRef.current.setLatLng([lt, lg]) }
        else {
          markerRef.current = L.marker([lt, lg], { icon, draggable: true }).addTo(map)
          markerRef.current.on("dragend", e => {
            const p = e.target.getLatLng()
            onChange(p.lat.toFixed(6), p.lng.toFixed(6))
          })
        }
        onChange(lt.toFixed(6), lg.toFixed(6))
      }
      if (hasCoords) placeMarker(parseFloat(lat), parseFloat(lng))
      map.on("click", e => placeMarker(e.latlng.lat, e.latlng.lng))
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null } }
  }, []) // mount only — changes handled by map events

  return (
    <div>
      <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
        Site Location <span style={{ color: C.textMuted, fontWeight: 400, textTransform: "none" }}>(click map to drop pin)</span>
      </label>
      <div ref={containerRef} style={{ width: "100%", height: 260, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }} />
      {lat && lng && !isNaN(parseFloat(lat)) && (
        <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "5px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} /> {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
        </p>
      )}
    </div>
  )
}

// ─── Projects ─────────────────────────────────────────────────────────────────

const Projects = ({ user, projects, setProjects, notifications, onMarkAllRead, onCardClick }) => {
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", start_date: "", target_end_date: "", total_cost: "", area_of_site: "", latitude: "", longitude: "", status: "active" })

  const pct = p => p.total_cost > 0 ? Math.round(((p.total_spent || 0) / p.total_cost) * 100) : 0

  const openCreate = () => { setEditId(null); setForm({ name: "", start_date: "", target_end_date: "", total_cost: "", area_of_site: "", latitude: "", longitude: "", status: "active" }); setShowModal(true) }
  const openEdit = p => { setEditId(p.id); setForm({ name: p.name, start_date: p.start_date || "", target_end_date: p.target_end_date || "", total_cost: p.total_cost || "", area_of_site: p.area_of_site || "", latitude: p.latitude || "", longitude: p.longitude || "", status: p.status }); setShowModal(true) }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const payload = { name: form.name, start_date: form.start_date || null, target_end_date: form.target_end_date || null, total_cost: parseFloat(form.total_cost) || 0, area_of_site: parseFloat(form.area_of_site) || null, latitude: parseFloat(form.latitude) || null, longitude: parseFloat(form.longitude) || null, status: form.status, user_id: user.id }
    if (editId) {
      const { data } = await supabase.from("projects").update(payload).eq("id", editId).select().single()
      if (data) setProjects(ps => ps.map(p => p.id === editId ? data : p))
    } else {
      const { data } = await supabase.from("projects").insert(payload).select().single()
      if (data) setProjects(ps => [data, ...ps])
    }
    setSaving(false); setShowModal(false)
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this project? This will also delete all its reports.")) return
    await supabase.from("projects").delete().eq("id", id)
    setProjects(ps => ps.filter(p => p.id !== id))
  }

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Projects" subtitle={`${projects.length} total`} notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={<Btn onClick={openCreate} icon={Plus}>New Project</Btn>} />
      {projects.length === 0 ? <Empty message="No projects yet" sub="Click New Project to create your first one" /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18, marginTop: 24 }}>
          {projects.map(p => {
            const pctVal = pct(p)
            return (
              <div key={p.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer", transition: "box-shadow 0.18s, transform 0.18s" }}
                onClick={() => onCardClick && onCardClick(p.id)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(249,115,22,0.13)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)" }}>
                <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <p style={{ fontFamily: FONT_HEADING, fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{p.name}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <StatusBadge status={p.status} />
                        {p.area_of_site && <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>{p.area_of_site.toLocaleString()} sqft</span>}
                        {p.latitude && p.longitude && <span style={{ fontFamily: FONT, fontSize: 11, color: C.accent, display: "flex", alignItems: "center", gap: 2 }}><MapPin size={10} />Location set</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(p)} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><Edit3 size={14} color={C.textMuted} /></button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><Trash2 size={14} color={C.danger} /></button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {p.start_date && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} />{p.start_date}</span>}
                    {p.target_end_date && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />Due {p.target_end_date}</span>}
                  </div>
                </div>
                <div style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>Budget Used</span>
                    <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: pctVal > 90 ? C.danger : C.text }}>{pctVal}%</span>
                  </div>
                  <ProgressBar value={pctVal} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                    <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Total Budget</p><p style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{fmt(p.total_cost)}</p></div>
                    <div style={{ textAlign: "right" }}><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Spent</p><p style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.accent, margin: 0 }}>{fmt(p.total_spent || 0)}</p></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showModal && (
        <Modal title={editId ? "Edit Project" : "New Project"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Project Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Riverside Tower Block A" required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              <Input label="Target End Date" type="date" value={form.target_end_date} onChange={e => setForm(f => ({ ...f, target_end_date: e.target.value }))} />
              <Input label="Total Budget (₹)" type="number" value={form.total_cost} onChange={e => setForm(f => ({ ...f, total_cost: e.target.value }))} placeholder="0" />
              <Input label="Site Area (sqft)" type="number" value={form.area_of_site} onChange={e => setForm(f => ({ ...f, area_of_site: e.target.value }))} placeholder="0" />
            </div>
            <LocationPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lt, lg) => setForm(f => ({ ...f, latitude: lt, longitude: lg }))}
            />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={[{ value: "active", label: "Active" }, { value: "delayed", label: "Delayed" }, { value: "on_hold", label: "On Hold" }, { value: "completed", label: "Completed" }]} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Save Changes" : "Create Project"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Submit DPR ───────────────────────────────────────────────────────────────
// FIX: total_cost is a GENERATED ALWAYS column — never included in insert payload.
// The 5 cost components are sent; Supabase computes total_cost automatically.
// After successful insert, the returned row's DB-computed total_cost is displayed.

const WEATHER_OPTIONS = ["", "Sunny", "Cloudy", "Rainy", "Windy", "Foggy"]
const FLOORS = ["", "Ground Floor", "First Floor", "Other Floors"]
const STAGES_BY_FLOOR = {
  "Ground Floor": ["Site Preparation", "Foundation & Footing", "Column Construction", "Beam & Slab", "Brickwork / Masonry", "Electrical Works", "Plumbing", "Site Plan", "Footing Layout", "Column Layout", "Floor Plan"],
  "First Floor": ["Column Construction", "Beam & Slab", "Brickwork / Masonry", "Door Schedule", "Electrical Works", "Plumbing", "Floor Plan", "Brick Work", "Door/Window Schedule", "Electrical Layout", "Plumbing Layout"],
  "Other Floors": ["Column Construction", "Beam & Slab", "Brickwork / Masonry", "Door Schedule", "Electrical Works", "Plumbing", "Floor Plan", "Brick Work", "Door/Window Schedule", "Electrical Layout", "Plumbing Layout"],
}

const SubmitDPR = ({ user, projects, setReports, notifications, onMarkAllRead }) => {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({ project_id: "", report_date: today, weather: "", floor: "", stage: "", manpower_count: "", machinery_used: "", work_completed: "", materials_used: "", safety_incidents: "", remarks: "", labor_cost: "0", material_cost: "0", equipment_cost: "0", subcontractor_cost: "0", other_cost: "0" })
  const [submittedReport, setSubmittedReport] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Live total: computed in the UI from the 5 cost fields (for user visibility before submit)
  const liveTotal = ["labor_cost", "material_cost", "equipment_cost", "subcontractor_cost", "other_cost"]
    .reduce((s, k) => s + (parseFloat(form[k]) || 0), 0)

  const stages = form.floor ? STAGES_BY_FLOOR[form.floor] || [] : []

  const handleSubmit = async () => {
    setError("")
    if (!form.project_id || !form.report_date || !form.floor || !form.stage)
      return setError("Please fill in Project, Date, Floor and Stage.")
    setSaving(true)

    // CRITICAL: total_cost is intentionally excluded — it is a GENERATED ALWAYS column.
    // Supabase computes it from the 5 cost fields automatically on insert.
    const payload = {
      project_id: form.project_id,
      user_id: user.id,
      report_date: form.report_date,
      weather: form.weather || null,
      manpower_count: parseInt(form.manpower_count) || 0,
      stage: form.stage,
      floor: form.floor,
      work_completed: form.work_completed || null,
      machinery_used: form.machinery_used || null,
      materials_used: form.materials_used || null,
      safety_incidents: form.safety_incidents || null,
      remarks: form.remarks || null,
      labor_cost: parseFloat(form.labor_cost) || 0,
      material_cost: parseFloat(form.material_cost) || 0,
      equipment_cost: parseFloat(form.equipment_cost) || 0,
      subcontractor_cost: parseFloat(form.subcontractor_cost) || 0,
      other_cost: parseFloat(form.other_cost) || 0,
      // total_cost is NOT sent — GENERATED ALWAYS column
    }

    const { data, error: e } = await supabase
      .from("daily_reports")
      .insert(payload)
      .select("*, projects(name)")
      .single()

    if (e) { setError(e.message); setSaving(false); return }

    // Update reports state with DB-returned row (includes DB-computed total_cost)
    setReports(rs => [data, ...rs])
    setSubmittedReport(data)
    setSaving(false)
  }

  const handleReset = () => {
    setSubmittedReport(null)
    setForm({ project_id: "", report_date: today, weather: "", floor: "", stage: "", manpower_count: "", machinery_used: "", work_completed: "", materials_used: "", safety_incidents: "", remarks: "", labor_cost: "0", material_cost: "0", equipment_cost: "0", subcontractor_cost: "0", other_cost: "0" })
  }

  // Success screen shows the DB-returned total_cost as final truth
  if (submittedReport) return (
    <div style={{ padding: 28 }}>
      <TopBar title="Submit DPR" notifications={notifications} onMarkAllRead={onMarkAllRead} />
      <div style={{ background: C.card, borderRadius: 16, padding: 48, textAlign: "center", marginTop: 24 }}>
        <CheckCircle size={56} color={C.success} style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 26, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Report Submitted</h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.textMuted, margin: "0 0 24px" }}>
          Daily progress report for <strong>{submittedReport.projects?.name}</strong> saved successfully.
        </p>
        {/* DB-computed total_cost displayed as final confirmed value */}
        <div style={{ background: C.accentLight, border: `1px solid ${C.accent}40`, borderRadius: 12, padding: "16px 28px", display: "inline-block", marginBottom: 28 }}>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Total Cost Recorded</p>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 32, fontWeight: 800, color: C.accent, margin: 0 }}>{fmt(submittedReport.total_cost)}</p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "4px 0 0" }}>Confirmed by database · contributes to project financials</p>
        </div>
        <div>
          <Btn onClick={handleReset}>Submit Another Report</Btn>
        </div>
      </div>
    </div>
  )

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v, ...(k === "floor" ? { stage: "" } : {}) }))

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Submit Daily Progress Report" notifications={notifications} onMarkAllRead={onMarkAllRead} />
      <div style={{ background: C.card, borderRadius: 16, padding: 28, marginTop: 24, border: `1px solid ${C.border}` }}>
        {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, marginBottom: 20 }}>{error}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          <Select label="Project" value={form.project_id} onChange={e => f("project_id", e.target.value)} required
            options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
          <Input label="Date" type="date" value={form.report_date} onChange={e => f("report_date", e.target.value)} required />
          <Select label="Weather" value={form.weather} onChange={e => f("weather", e.target.value)}
            options={WEATHER_OPTIONS.map(w => ({ value: w, label: w || "Select Weather" }))} />
          <Input label="Manpower Count" type="number" value={form.manpower_count} onChange={e => f("manpower_count", e.target.value)} placeholder="0" />
          <Select label="Floor" value={form.floor} onChange={e => f("floor", e.target.value)} required
            options={FLOORS.map(fl => ({ value: fl, label: fl || "Select Floor" }))} />
          <Select label="Stage" value={form.stage} onChange={e => f("stage", e.target.value)} required
            options={[{ value: "", label: "Select Stage" }, ...stages.map(s => ({ value: s, label: s }))]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          <Input label="Work Completed" value={form.work_completed} onChange={e => f("work_completed", e.target.value)} placeholder="Describe work done today" />
          <Input label="Machinery Used" value={form.machinery_used} onChange={e => f("machinery_used", e.target.value)} placeholder="e.g. Excavator, Transit Mixer" />
          <Input label="Materials Used" value={form.materials_used} onChange={e => f("materials_used", e.target.value)} placeholder="e.g. 120 bags cement, 2T TMT" />
          <Input label="Safety Incidents" value={form.safety_incidents} onChange={e => f("safety_incidents", e.target.value)} placeholder="None / describe if any" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <Input label="Remarks" value={form.remarks} onChange={e => f("remarks", e.target.value)} placeholder="Any additional notes for today" />
        </div>
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, marginBottom: 24 }}>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost Breakdown</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
            {[["labor_cost", "Labor"], ["material_cost", "Material"], ["equipment_cost", "Equipment"], ["subcontractor_cost", "Subcontractor"], ["other_cost", "Other"]].map(([k, label]) => (
              <Input key={k} label={label} type="number" value={form[k]} onChange={e => f(k, e.target.value)} placeholder="0" />
            ))}
          </div>
          {/* Live total: shown before submit for user reference — Supabase will confirm final value */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: FONT, fontSize: 14, color: C.textMuted, fontWeight: 600 }}>Total Cost Today:</span>
            <span style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.accent }}>{fmt(liveTotal)}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn onClick={handleSubmit} disabled={saving} size="lg" icon={CheckCircle}>{saving ? "Submitting..." : "Submit Report"}</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Reports ──────────────────────────────────────────────────────────────────

const Reports = ({ projects, reports, notifications, onMarkAllRead }) => {
  const [tab, setTab] = useState("Overview")
  const [projFilter, setProjFilter] = useState("All Projects")

  const filteredReports = projFilter === "All Projects" ? reports : reports.filter(r => r.project_id === projFilter)
  const totalSpent = reports.reduce((s, r) => s + (r.total_cost || 0), 0)
  const totalBudget = projects.reduce((s, p) => s + (p.total_cost || 0), 0)
  const avgManpower = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + (r.manpower_count || 0), 0) / reports.length) : 0
  const delayed = projects.filter(p => p.status === "delayed").length

  const costTrend = Object.values(
    reports.reduce((acc, r) => {
      const key = r.report_date?.slice(0, 7)
      if (!key) return acc
      if (!acc[key]) acc[key] = { date: key, cost: 0 }
      acc[key].cost += r.total_cost || 0
      return acc
    }, {})
  ).sort((a, b) => a.date.localeCompare(b.date)).slice(-6).map(d => ({ ...d, date: new Date(d.date + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) }))

  const manpowerTrend = reports.slice(0, 10).reverse().map(r => ({ date: r.report_date?.slice(5), manpower: r.manpower_count || 0, cost: r.total_cost || 0 }))
  const budgetVsActual = projects.map(p => ({ project: p.name.split(" ").slice(0, 2).join(" "), budget: p.total_cost || 0, spent: p.total_spent || 0 }))

  const costCats = [
    { name: "Labor", value: reports.reduce((s, r) => s + (r.labor_cost || 0), 0), color: C.accent },
    { name: "Materials", value: reports.reduce((s, r) => s + (r.material_cost || 0), 0), color: C.info },
    { name: "Equipment", value: reports.reduce((s, r) => s + (r.equipment_cost || 0), 0), color: C.success },
    { name: "Subcontractor", value: reports.reduce((s, r) => s + (r.subcontractor_cost || 0), 0), color: C.warning },
    { name: "Other", value: reports.reduce((s, r) => s + (r.other_cost || 0), 0), color: C.charcoal },
  ]

  const STAGES_DATA = {
    "Layout / Plan / Drawings": ["Site Plan", "Footing Layout", "Column Layout", "Floor Plan (Ground)", "Floor Plan (First)", "Floor Plan (Other)"],
    "Execution": ["Site Preparation", "Brick Work (Ground)", "Brick Work (First)", "Brick Work (Other)", "Door/Window Schedule (Ground)", "Door/Window Schedule (First)", "Electrical Layout (Ground)", "Electrical Layout (First)", "Plumbing Layout"],
  }

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Reports" subtitle={`${reports.length} DPRs submitted`} notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={<div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" icon={Download} size="sm" onClick={() => downloadPDF(reports, projects)}>PDF</Btn>
          <Btn variant="secondary" icon={Download} size="sm" onClick={() => downloadCSV(reports)}>Excel</Btn>
        </div>} />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24, marginBottom: 24 }}>
        <KPICard label="Total Spent" value={fmt(totalSpent)} sub={`of ${fmt(totalBudget)} budget`} icon={DollarSign} accent={C.accent} />
        <KPICard label="Reports" value={reports.length} sub="daily reports" icon={FileText} accent={C.info} />
        <KPICard label="Avg Manpower" value={avgManpower} sub="per day" icon={Users} accent={C.success} />
        <KPICard label="Delayed" value={delayed} sub="projects" icon={AlertTriangle} accent={C.danger} />
      </div>
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <TabBar tabs={["Overview", "Analytics", "Reports", "Photos", "Stages"]} active={tab} onChange={setTab} />
        <div style={{ padding: 24 }}>
          {tab === "Overview" && (
            reports.length === 0 ? <Empty message="No reports yet" sub="Submit a DPR to see charts here" /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly Cost Trend</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={costTrend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 11 }} /><YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontFamily: FONT, fontSize: 11 }} /><Tooltip formatter={v => fmt(v)} /><Area type="monotone" dataKey="cost" stroke={C.accent} fill={C.accentLight} strokeWidth={2} /></AreaChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Daily Manpower & Cost</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={manpowerTrend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 11 }} /><YAxis yAxisId="left" tick={{ fontFamily: FONT, fontSize: 11 }} /><YAxis yAxisId="right" orientation="right" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontFamily: FONT, fontSize: 11 }} /><Tooltip /><Legend /><Bar yAxisId="left" dataKey="manpower" fill={C.info} name="Manpower" radius={[4, 4, 0, 0]} /><Line yAxisId="right" type="monotone" dataKey="cost" stroke={C.accent} strokeWidth={2} name="Daily Cost" /></ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          )}
          {tab === "Analytics" && (
            projects.length === 0 ? <Empty message="No data yet" /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Budget vs Actual by Project</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={budgetVsActual}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="project" tick={{ fontFamily: FONT, fontSize: 11 }} /><YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontFamily: FONT, fontSize: 11 }} /><Tooltip formatter={v => fmt(v)} /><Legend /><Bar dataKey="budget" fill={C.border} name="Budget" radius={[4, 4, 0, 0]} /><Bar dataKey="spent" fill={C.accent} name="Spent" radius={[4, 4, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost by Category</h3>
                  <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart><Pie data={costCats.filter(c => c.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">{costCats.map((c, i) => <Cell key={i} fill={c.color} />)}</Pie><Tooltip formatter={v => fmt(v)} /></PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {costCats.filter(c => c.value > 0).map(c => {
                        const total = costCats.reduce((s, x) => s + x.value, 0)
                        return (
                          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                            <span style={{ fontFamily: FONT, fontSize: 13, color: C.text, minWidth: 100 }}>{c.name}</span>
                            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(c.value)}</span>
                            <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>{total > 0 ? Math.round((c.value / total) * 100) : 0}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
          {tab === "Reports" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                <Select value={projFilter} onChange={e => setProjFilter(e.target.value)}
                  options={[{ value: "All Projects", label: "All Projects" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
              </div>
              {filteredReports.length === 0 ? <Empty message="No reports found" /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC" }}>{["Date", "Project", "Stage", "Floor", "Weather", "Manpower", "Total Cost", "Remarks"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredReports.map(r => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "10px 14px", color: C.text }}>{r.report_date}</td>
                          <td style={{ padding: "10px 14px", color: C.text, fontWeight: 600 }}>{r.projects?.name || "—"}</td>
                          <td style={{ padding: "10px 14px", color: C.text }}>{r.stage}</td>
                          <td style={{ padding: "10px 14px", color: C.text }}>{r.floor}</td>
                          <td style={{ padding: "10px 14px" }}><div style={{ display: "flex", alignItems: "center", gap: 4 }}><WeatherIcon w={r.weather} />{r.weather || "—"}</div></td>
                          <td style={{ padding: "10px 14px", color: C.text, textAlign: "center" }}>{r.manpower_count}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: C.accent }}>{fmt(r.total_cost)}</td>
                          <td style={{ padding: "10px 14px", color: C.textMuted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === "Photos" && (
            <Empty message="Photo uploads coming soon" sub="Use the DPR form to attach site photos once storage is configured" />
          )}
          {tab === "Stages" && (
            <div>
              {Object.entries(STAGES_DATA).map(([group, stages]) => (
                <div key={group} style={{ marginBottom: 28 }}>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.navy, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `2px solid ${C.accent}`, paddingBottom: 8 }}>{group}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                    {stages.map(stage => {
                      const count = reports.filter(r => r.stage === stage || r.stage?.includes(stage.split(" ")[0])).length
                      return (
                        <div key={stage} style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 16px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: FONT, fontSize: 13, color: C.text, fontWeight: 500 }}>{stage}</span>
                          {count > 0 ? <Badge label={`${count} report${count > 1 ? "s" : ""}`} color={C.success} bg="#D1FAE5" /> : <Badge label="No reports" color={C.textMuted} bg="#F1F5F9" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Materials ────────────────────────────────────────────────────────────────
// FIX: Contextual action button changes per active tab.
// Add Usage and Add Purchase modals are now fully functional.

const Materials = ({ user, projects, notifications, onMarkAllRead }) => {
  const [tab, setTab] = useState("Materials")
  const [materials, setMaterials] = useState([])
  const [usage, setUsage] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  // Separate form state per modal type
  const [matForm, setMatForm] = useState({ name: "", category: "", unit: "", cost_per_unit: "", current_stock: "", min_stock_level: "", supplier_name: "", supplier_contact: "" })
  const [usageForm, setUsageForm] = useState({ material_id: "", quantity_used: "", project_id: "", usage_date: new Date().toISOString().split("T")[0], notes: "" })
  const [purchaseForm, setPurchaseForm] = useState({ material_id: "", quantity_purchased: "", cost_per_unit: "", supplier_name: "", purchase_date: new Date().toISOString().split("T")[0], invoice_number: "" })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: m }, { data: u }, { data: p }] = await Promise.all([
        supabase.from("materials").select("*").order("created_at", { ascending: false }),
        supabase.from("material_usage").select("*, materials(name), projects(name)").order("usage_date", { ascending: false }),
        supabase.from("material_purchases").select("*, materials(name)").order("purchase_date", { ascending: false }),
      ])
      setMaterials(m || []); setUsage(u || []); setPurchases(p || [])
      setLoading(false)
    }
    load()
  }, [])

  // Add Material
  const handleAddMaterial = async () => {
    if (!matForm.name || !matForm.category || !matForm.unit) return
    setSaving(true)
    const { data } = await supabase.from("materials").insert({
      ...matForm,
      user_id: user.id,
      cost_per_unit: parseFloat(matForm.cost_per_unit) || 0,
      current_stock: parseFloat(matForm.current_stock) || 0,
      min_stock_level: parseFloat(matForm.min_stock_level) || 0,
    }).select().single()
    if (data) setMaterials(ms => [data, ...ms])
    setSaving(false); setShowModal(false)
    setMatForm({ name: "", category: "", unit: "", cost_per_unit: "", current_stock: "", min_stock_level: "", supplier_name: "", supplier_contact: "" })
  }

  // Add Usage — stock auto-decremented by DB trigger
  const handleAddUsage = async () => {
    if (!usageForm.material_id || !usageForm.quantity_used || !usageForm.usage_date) return
    setSaving(true)
    const { data, error } = await supabase.from("material_usage").insert({
      material_id: usageForm.material_id,
      project_id: usageForm.project_id || null,
      user_id: user.id,
      quantity_used: parseFloat(usageForm.quantity_used),
      usage_date: usageForm.usage_date,
      notes: usageForm.notes || null,
    }).select("*, materials(name), projects(name)").single()
    if (data) {
      setUsage(us => [data, ...us])
      // Refresh material stock after trigger has run
      const { data: updatedMat } = await supabase.from("materials").select("*").eq("id", usageForm.material_id).single()
      if (updatedMat) setMaterials(ms => ms.map(m => m.id === updatedMat.id ? updatedMat : m))
    }
    setSaving(false); setShowModal(false)
    setUsageForm({ material_id: "", quantity_used: "", project_id: "", usage_date: new Date().toISOString().split("T")[0], notes: "" })
  }

  // Add Purchase — stock auto-incremented by DB trigger
  const handleAddPurchase = async () => {
    if (!purchaseForm.material_id || !purchaseForm.quantity_purchased || !purchaseForm.purchase_date) return
    setSaving(true)
    const qty = parseFloat(purchaseForm.quantity_purchased)
    const cpu = parseFloat(purchaseForm.cost_per_unit) || 0
    const { data } = await supabase.from("material_purchases").insert({
      material_id: purchaseForm.material_id,
      user_id: user.id,
      quantity_purchased: qty,
      cost_per_unit: cpu,
      total_cost: qty * cpu,
      purchase_date: purchaseForm.purchase_date,
      supplier_name: purchaseForm.supplier_name || null,
      invoice_number: purchaseForm.invoice_number || null,
    }).select("*, materials(name)").single()
    if (data) {
      setPurchases(ps => [data, ...ps])
      // Refresh material stock after trigger has run
      const { data: updatedMat } = await supabase.from("materials").select("*").eq("id", purchaseForm.material_id).single()
      if (updatedMat) setMaterials(ms => ms.map(m => m.id === updatedMat.id ? updatedMat : m))
    }
    setSaving(false); setShowModal(false)
    setPurchaseForm({ material_id: "", quantity_purchased: "", cost_per_unit: "", supplier_name: "", purchase_date: new Date().toISOString().split("T")[0], invoice_number: "" })
  }

  // Contextual button: label and handler change based on active tab
  const ctxButton = {
    "Materials":  { label: "Add Material",  action: () => setShowModal(true) },
    "Usage Log":  { label: "Add Usage",     action: () => setShowModal(true) },
    "Purchases":  { label: "Add Purchase",  action: () => setShowModal(true) },
    "Analytics":  null,
  }[tab]

  const filtered = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()))
  const totalValue = materials.reduce((s, m) => s + ((m.current_stock || 0) * (m.cost_per_unit || 0)), 0)
  const lowStock = materials.filter(m => (m.current_stock || 0) < (m.min_stock_level || 0)).length

  const materialOptions = [{ value: "", label: "Select Material" }, ...materials.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))]
  const projectOptions = [{ value: "", label: "No Project" }, ...(projects || []).map(p => ({ value: p.id, label: p.name }))]

  return (
    <div style={{ padding: 28 }}>
      <TopBar
        title="Materials & Inventory"
        subtitle={`${materials.length} materials tracked`}
        notifications={notifications}
        onMarkAllRead={onMarkAllRead}
        actions={ctxButton ? <Btn onClick={ctxButton.action} icon={Plus}>{ctxButton.label}</Btn> : null}
      />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "24px 0" }}>
        <KPICard label="Total Items" value={materials.length} sub="in inventory" icon={Package} accent={C.info} />
        <KPICard label="Inventory Value" value={fmt(totalValue)} sub="current stock" icon={DollarSign} accent={C.success} />
        <KPICard label="Low Stock" value={lowStock} sub="need reorder" icon={AlertTriangle} accent={lowStock > 0 ? C.danger : C.success} />
      </div>
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <TabBar tabs={["Materials", "Usage Log", "Purchases", "Analytics"]} active={tab} onChange={t => { setTab(t); setShowModal(false) }} />
        <div style={{ padding: 24 }}>
          {loading ? <Spinner /> : (
            <>
              {tab === "Materials" && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} icon={Search} />
                  </div>
                  {filtered.length === 0 ? <Empty message="No materials found" sub="Add your first material using the button above" /> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                      {filtered.map(m => {
                        const isLow = (m.current_stock || 0) < (m.min_stock_level || 0)
                        return (
                          <div key={m.id} style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px 18px", border: `1px solid ${isLow ? C.danger + "40" : C.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                              <div>
                                <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{m.name}</p>
                                <StatusBadge status={m.category} />
                              </div>
                              {isLow && <Badge label="Low Stock" color={C.danger} bg="#FEE2E2" />}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                              <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Current Stock</p><p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: isLow ? C.danger : C.text, margin: 0 }}>{(m.current_stock || 0).toLocaleString()} {m.unit}</p></div>
                              <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Unit Cost</p><p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>₹{m.cost_per_unit}</p></div>
                              <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Min Level</p><p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.charcoal, margin: 0 }}>{(m.min_stock_level || 0).toLocaleString()} {m.unit}</p></div>
                              <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Total Value</p><p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.success, margin: 0 }}>{fmt((m.current_stock || 0) * (m.cost_per_unit || 0))}</p></div>
                            </div>
                            {m.supplier_name && <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: "10px 0 0" }}>Supplier: {m.supplier_name}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === "Usage Log" && (
                usage.length === 0 ? <Empty message="No usage records yet" sub="Click Add Usage to log material consumption" /> : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC" }}>{["Date", "Material", "Project", "Quantity", "Notes"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{usage.map(u => <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 14px" }}>{u.usage_date}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>{u.materials?.name}</td>
                      <td style={{ padding: "10px 14px" }}>{u.projects?.name || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>{u.quantity_used}</td>
                      <td style={{ padding: "10px 14px", color: C.textMuted }}>{u.notes || "—"}</td>
                    </tr>)}</tbody>
                  </table>
                )
              )}

              {tab === "Purchases" && (
                purchases.length === 0 ? <Empty message="No purchases recorded yet" sub="Click Add Purchase to record a procurement" /> : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC" }}>{["Date", "Material", "Qty", "Unit Cost", "Total", "Supplier", "Invoice"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{purchases.map(p => <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 14px" }}>{p.purchase_date}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.materials?.name}</td>
                      <td style={{ padding: "10px 14px" }}>{p.quantity_purchased}</td>
                      <td style={{ padding: "10px 14px" }}>₹{p.cost_per_unit}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: C.success }}>{fmt(p.total_cost)}</td>
                      <td style={{ padding: "10px 14px", color: C.textMuted }}>{p.supplier_name || "—"}</td>
                      <td style={{ padding: "10px 14px", color: C.textMuted }}>{p.invoice_number || "—"}</td>
                    </tr>)}</tbody>
                  </table>
                )
              )}

              {tab === "Analytics" && (
                materials.length === 0 ? <Empty message="Add materials to see analytics" /> : (
                  <div>
                    <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase" }}>Inventory Value by Category</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={Object.entries(materials.reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + (m.current_stock || 0) * (m.cost_per_unit || 0); return acc }, {})).map(([k, v]) => ({ category: k, value: v }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="category" tick={{ fontFamily: FONT, fontSize: 11 }} /><YAxis tickFormatter={v => fmt(v)} tick={{ fontFamily: FONT, fontSize: 11 }} /><Tooltip formatter={v => fmt(v)} /><Bar dataKey="value" fill={C.accent} radius={[4, 4, 0, 0]} name="Value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Material Modal */}
      {showModal && tab === "Materials" && (
        <Modal title="Add Material" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Material Name" value={matForm.name} onChange={e => setMatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Portland Cement OPC 53" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Category" value={matForm.category} onChange={e => setMatForm(f => ({ ...f, category: e.target.value }))} required placeholder="e.g. Cement & Concrete" />
              <Input label="Unit" value={matForm.unit} onChange={e => setMatForm(f => ({ ...f, unit: e.target.value }))} required placeholder="e.g. bag, kg, cft" />
              <Input label="Cost per Unit (₹)" type="number" value={matForm.cost_per_unit} onChange={e => setMatForm(f => ({ ...f, cost_per_unit: e.target.value }))} placeholder="0" />
              <Input label="Opening Stock" type="number" value={matForm.current_stock} onChange={e => setMatForm(f => ({ ...f, current_stock: e.target.value }))} placeholder="0" />
              <Input label="Min Stock Level" type="number" value={matForm.min_stock_level} onChange={e => setMatForm(f => ({ ...f, min_stock_level: e.target.value }))} placeholder="0" />
              <Input label="Supplier Name" value={matForm.supplier_name} onChange={e => setMatForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="Optional" />
            </div>
            <Input label="Supplier Contact" value={matForm.supplier_contact} onChange={e => setMatForm(f => ({ ...f, supplier_contact: e.target.value }))} placeholder="Phone or email" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleAddMaterial} disabled={saving}>{saving ? "Saving..." : "Add Material"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Usage Modal */}
      {showModal && tab === "Usage Log" && (
        <Modal title="Add Usage" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Select label="Material" value={usageForm.material_id} onChange={e => setUsageForm(f => ({ ...f, material_id: e.target.value }))} required options={materialOptions} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Quantity Used" type="number" value={usageForm.quantity_used} onChange={e => setUsageForm(f => ({ ...f, quantity_used: e.target.value }))} required placeholder="0" />
              <Input label="Date" type="date" value={usageForm.usage_date} onChange={e => setUsageForm(f => ({ ...f, usage_date: e.target.value }))} required />
            </div>
            <Select label="Project" value={usageForm.project_id} onChange={e => setUsageForm(f => ({ ...f, project_id: e.target.value }))} options={projectOptions} />
            <Input label="Remarks" value={usageForm.notes} onChange={e => setUsageForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleAddUsage} disabled={saving}>{saving ? "Saving..." : "Log Usage"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Purchase Modal */}
      {showModal && tab === "Purchases" && (
        <Modal title="Add Purchase" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Select label="Material" value={purchaseForm.material_id} onChange={e => setPurchaseForm(f => ({ ...f, material_id: e.target.value }))} required options={materialOptions} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Quantity Purchased" type="number" value={purchaseForm.quantity_purchased} onChange={e => setPurchaseForm(f => ({ ...f, quantity_purchased: e.target.value }))} required placeholder="0" />
              <Input label="Cost per Unit (₹)" type="number" value={purchaseForm.cost_per_unit} onChange={e => setPurchaseForm(f => ({ ...f, cost_per_unit: e.target.value }))} placeholder="0" />
              <Input label="Supplier" value={purchaseForm.supplier_name} onChange={e => setPurchaseForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="Supplier name" />
              <Input label="Invoice No." value={purchaseForm.invoice_number} onChange={e => setPurchaseForm(f => ({ ...f, invoice_number: e.target.value }))} placeholder="Optional" />
              <Input label="Purchase Date" type="date" value={purchaseForm.purchase_date} onChange={e => setPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))} required />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleAddPurchase} disabled={saving}>{saving ? "Saving..." : "Record Purchase"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Financials ───────────────────────────────────────────────────────────────

const Financials = ({ projects, reports, notifications, onMarkAllRead }) => {
  const [tab, setTab] = useState("Overview")
  const totalBudget = projects.reduce((s, p) => s + (p.total_cost || 0), 0)
  const totalSpent = projects.reduce((s, p) => s + (p.total_spent || 0), 0)
  const remaining = totalBudget - totalSpent

  const costCats = [
    { name: "Labor", value: reports.reduce((s, r) => s + (r.labor_cost || 0), 0), color: C.accent },
    { name: "Materials", value: reports.reduce((s, r) => s + (r.material_cost || 0), 0), color: C.info },
    { name: "Equipment", value: reports.reduce((s, r) => s + (r.equipment_cost || 0), 0), color: C.success },
    { name: "Subcontractor", value: reports.reduce((s, r) => s + (r.subcontractor_cost || 0), 0), color: C.warning },
    { name: "Other", value: reports.reduce((s, r) => s + (r.other_cost || 0), 0), color: C.charcoal },
  ]

  const monthlyTrend = Object.values(
    reports.reduce((acc, r) => {
      const key = r.report_date?.slice(0, 7)
      if (!key) return acc
      if (!acc[key]) acc[key] = { month: key, spend: 0 }
      acc[key].spend += r.total_cost || 0
      return acc
    }, {})
  ).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map(d => ({ ...d, month: new Date(d.month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) }))

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Financial Dashboard" subtitle="Budget tracking & cost analysis" notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={<Btn variant="secondary" icon={Download} size="sm" onClick={() => downloadCSV(reports)}>Export</Btn>} />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "24px 0" }}>
        <KPICard label="Total Budget" value={fmt(totalBudget)} sub="across all projects" icon={DollarSign} accent={C.info} />
        <KPICard label="Total Spent" value={fmt(totalSpent)} sub={`${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% utilised`} icon={TrendingUp} accent={C.accent} />
        <KPICard label="Remaining" value={fmt(remaining)} sub="available budget" icon={CheckCircle} accent={remaining < 0 ? C.danger : C.success} />
      </div>
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <TabBar tabs={["Overview", "By Category", "Monthly Trend", "By Project"]} active={tab} onChange={setTab} />
        <div style={{ padding: 24 }}>
          {reports.length === 0 && projects.length === 0 ? <Empty message="No financial data yet" sub="Create projects and submit DPRs to see analytics here" /> : (
            <>
              {tab === "Overview" && (
                projects.length === 0 ? <Empty message="No projects yet" /> : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projects.map(p => ({ name: p.name.split(" ").slice(0, 2).join(" "), budget: p.total_cost || 0, spent: p.total_spent || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={{ fontFamily: FONT, fontSize: 11 }} /><YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontFamily: FONT, fontSize: 11 }} /><Tooltip formatter={v => fmt(v)} /><Legend />
                      <Bar dataKey="budget" fill={C.border} name="Budget" radius={[4, 4, 0, 0]} /><Bar dataKey="spent" fill={C.accent} name="Spent" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
              {tab === "By Category" && (
                <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
                  <ResponsiveContainer width={240} height={240}>
                    <PieChart><Pie data={costCats.filter(c => c.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">{costCats.map((c, i) => <Cell key={i} fill={c.color} />)}</Pie><Tooltip formatter={v => fmt(v)} /></PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {costCats.filter(c => c.value > 0).map(c => {
                      const t = costCats.reduce((s, x) => s + x.value, 0)
                      return (
                        <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color }} />
                          <span style={{ fontFamily: FONT, fontSize: 13, color: C.text, minWidth: 110 }}>{c.name}</span>
                          <span style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text }}>{fmt(c.value)}</span>
                          <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, background: "#F1F5F9", padding: "2px 8px", borderRadius: 10 }}>{t > 0 ? Math.round((c.value / t) * 100) : 0}%</span>
                        </div>
                      )
                    })}
                    {costCats.every(c => c.value === 0) && <Empty message="No cost data yet" sub="Submit DPRs with cost entries to see breakdown" />}
                  </div>
                </div>
              )}
              {tab === "Monthly Trend" && (
                monthlyTrend.length === 0 ? <Empty message="No monthly data yet" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyTrend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="month" tick={{ fontFamily: FONT, fontSize: 11 }} /><YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontFamily: FONT, fontSize: 11 }} /><Tooltip formatter={v => fmt(v)} /><Area type="monotone" dataKey="spend" stroke={C.accent} fill={C.accentLight} strokeWidth={2} name="Monthly Spend" /></AreaChart>
                  </ResponsiveContainer>
                )
              )}
              {tab === "By Project" && (
                projects.length === 0 ? <Empty message="No projects yet" /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {projects.map(p => {
                      const pct = p.total_cost > 0 ? Math.round(((p.total_spent || 0) / p.total_cost) * 100) : 0
                      return (
                        <div key={p.id} style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px 20px", border: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</span>
                              <StatusBadge status={p.status} />
                            </div>
                            <span style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 800, color: pct > 90 ? C.danger : C.accent }}>{pct}%</span>
                          </div>
                          <ProgressBar value={pct} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                            <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>Budget: <strong style={{ color: C.text }}>{fmt(p.total_cost)}</strong></span>
                            <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>Spent: <strong style={{ color: C.accent }}>{fmt(p.total_spent || 0)}</strong></span>
                            <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>Remaining: <strong style={{ color: (p.total_cost - (p.total_spent || 0)) < 0 ? C.danger : C.success }}>{fmt(p.total_cost - (p.total_spent || 0))}</strong></span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── User Management ──────────────────────────────────────────────────────────
// FIX: Admin-only Assign Project button. Assignment modal stores to user_project_assignments.
// Table now shows assigned user, project, and role.

const UserManagement = ({ user, userRole, projects, notifications, onMarkAllRead }) => {
  const [assignments, setAssignments] = useState([])
  const [roles, setRoles] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [assignForm, setAssignForm] = useState({ user_id: "", project_id: "", role_id: "" })

  const isAdmin = userRole === "admin"

  useEffect(() => {
    const load = async () => {
      // NOTE: profiles is NOT joined here — user_project_assignments.user_id
      // references auth.users, not profiles, so Supabase cannot resolve that FK.
      // User names are resolved from allProfiles state instead.
      const queries = [
        supabase.from("user_project_assignments")
          .select("*, projects(name), user_roles(name, description, permissions)")
          .order("assigned_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]
      if (isAdmin) queries.push(supabase.from("profiles").select("id, full_name, role"))

      const results = await Promise.all(queries)
      setAssignments(results[0].data || [])
      setRoles(results[1].data || [])
      if (isAdmin && results[2]) setAllProfiles(results[2].data || [])
      setLoading(false)
    }
    load()
  }, [isAdmin])

  const handleAssign = async () => {
    setError("")
    if (!assignForm.user_id || !assignForm.project_id || !assignForm.role_id)
      return setError("Please select a user, project, and role.")
    setSaving(true)

    // FIX: profiles join removed — no FK from user_project_assignments to profiles.
    // The DB trigger sync_profile_role_on_assignment will update profiles.role automatically.
    const { data, error: e } = await supabase
      .from("user_project_assignments")
      .insert({
        user_id: assignForm.user_id,
        project_id: assignForm.project_id,
        role_id: assignForm.role_id,
        assigned_by: user.id,
      })
      .select("*, projects(name), user_roles(name, description, permissions)")
      .single()

    if (e) { setError(e.message); setSaving(false); return }

    // Enrich the new row with user name from allProfiles (already in state)
    const enriched = {
      ...data,
      _userName: allProfiles.find(p => p.id === assignForm.user_id)?.full_name || assignForm.user_id.slice(0, 8) + "…"
    }
    setAssignments(a => [enriched, ...a])
    setSaving(false)
    setShowAssignModal(false)
    setAssignForm({ user_id: "", project_id: "", role_id: "" })
  }

  // Resolve user name: first from enriched _userName, then from allProfiles lookup
  const getUserName = (a) =>
    a._userName || allProfiles.find(p => p.id === a.user_id)?.full_name || a.user_id?.slice(0, 8) + "…"

  // Only show the 3 assignable roles — exclude Admin from the dropdown
  const assignableRoles = roles.filter(r => r.name !== "Admin")

  const profileOptions = [{ value: "", label: "Select User" }, ...allProfiles.filter(p => p.role !== "admin").map(p => ({ value: p.id, label: p.full_name || p.id.slice(0, 8) }))]
  const projectOptions = [{ value: "", label: "Select Project" }, ...(projects || []).map(p => ({ value: p.id, label: p.name }))]
  const roleOptions = [{ value: "", label: "Select Role" }, ...assignableRoles.map(r => ({ value: r.id, label: r.name }))]

  return (
    <div style={{ padding: 28 }}>
      <TopBar
        title="User Management"
        subtitle="Roles and project assignments"
        notifications={notifications}
        onMarkAllRead={onMarkAllRead}
        // Assign Project button is visible to admin only
        actions={isAdmin ? <Btn onClick={() => setShowAssignModal(true)} icon={UserPlus}>Assign Project</Btn> : null}
      />
      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Project Assignments</h3>
              <Badge label={`${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`} color={C.info} bg="#DBEAFE" />
            </div>
            <div style={{ padding: 24 }}>
              {assignments.length === 0 ? (
                <Empty
                  message="No assignments yet"
                  sub={isAdmin ? "Click Assign Project to assign a team member" : "No project assignments have been created yet"}
                />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC" }}>
                        {["User", "Project", "Role", "Assigned At"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                            {getUserName(a)}
                          </td>
                          <td style={{ padding: "10px 14px" }}>{a.projects?.name || "—"}</td>
                          <td style={{ padding: "10px 14px" }}><StatusBadge status={a.user_roles?.name} /></td>
                          <td style={{ padding: "10px 14px", color: C.textMuted }}>{new Date(a.assigned_at).toLocaleDateString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Available Roles</h3>
            </div>
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {roles.map(r => (
                <div key={r.id} style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.border}` }}>
                  <div style={{ marginBottom: 8 }}><StatusBadge status={r.name} /></div>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: "0 0 10px" }}>{r.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || "[]")).map(perm => (
                      <span key={perm} style={{ fontFamily: FONT, fontSize: 11, background: C.accentLight, color: C.accent, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{perm}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign Project Modal — admin only */}
      {showAssignModal && isAdmin && (
        <Modal title="Assign Project" onClose={() => { setShowAssignModal(false); setError("") }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{error}</p>}
            <Select label="User" value={assignForm.user_id} onChange={e => setAssignForm(f => ({ ...f, user_id: e.target.value }))} required options={profileOptions} />
            <Select label="Project" value={assignForm.project_id} onChange={e => setAssignForm(f => ({ ...f, project_id: e.target.value }))} required options={projectOptions} />
            <Select label="Role" value={assignForm.role_id} onChange={e => setAssignForm(f => ({ ...f, role_id: e.target.value }))} required options={roleOptions} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Btn>
              <Btn onClick={handleAssign} disabled={saving} icon={UserPlus}>{saving ? "Assigning..." : "Assign"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Project Detail Page ──────────────────────────────────────────────────────
const STAGES_DETAIL = [
  "Site Plan","Footing Layout","Column Layout","Floor Plan (Ground)","Floor Plan (First)","Floor Plan (Other)",
  "Brick Work Layout","Door & Window Layout","Electrical Layout","Plumbing Layout",
  "Site Preparation","Excavation","Foundation Work","Plinth Work","Superstructure Work",
  "Roof Work","Flooring Work","Plastering","Door & Window Work","Electrical & Plumbing Work","Painting & Finishing Work",
]

const ProjectDetail = ({ projectId, user, userRole, projects, setProjects, reports, onBack, notifications, onMarkAllRead }) => {
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  const project = projects.find(p => p.id === projectId)
  if (!project) return <div style={{ padding: 28 }}><Btn variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Btn><Empty message="Project not found" /></div>

  const projReports = reports.filter(r => r.project_id === projectId)
  const pct = project.total_cost > 0 ? Math.round(((project.total_spent || 0) / project.total_cost) * 100) : 0
  const remaining = (project.total_cost || 0) - (project.total_spent || 0)
  const isAdmin = userRole === "admin"

  const openEdit = () => {
    setForm({ name: project.name, start_date: project.start_date || "", target_end_date: project.target_end_date || "", total_cost: project.total_cost || "", area_of_site: project.area_of_site || "", latitude: project.latitude || "", longitude: project.longitude || "", status: project.status })
    setShowEdit(true)
  }
  const handleSave = async () => {
    setSaving(true)
    const payload = { name: form.name, start_date: form.start_date || null, target_end_date: form.target_end_date || null, total_cost: parseFloat(form.total_cost) || 0, area_of_site: parseFloat(form.area_of_site) || null, latitude: parseFloat(form.latitude) || null, longitude: parseFloat(form.longitude) || null, status: form.status }
    const { data } = await supabase.from("projects").update(payload).eq("id", projectId).select().single()
    if (data) setProjects(ps => ps.map(p => p.id === projectId ? data : p))
    setSaving(false); setShowEdit(false)
  }
  const handleDelete = async () => {
    if (!confirm("Delete this project and all its reports?")) return
    await supabase.from("projects").delete().eq("id", projectId)
    setProjects(ps => ps.filter(p => p.id !== projectId))
    onBack()
  }

  // Stage progress for this project
  const stageCount = {}
  projReports.forEach(r => { if (r.stage) stageCount[r.stage] = (stageCount[r.stage] || 0) + 1 })
  const maxCount = Math.max(...Object.values(stageCount), 1)
  const activeStages = STAGES_DETAIL.filter(s => stageCount[s] > 0)

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "#F1F5F9", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>

      {/* Project title strip */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>{project.name}</h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <StatusBadge status={project.status} />
            {project.area_of_site && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{project.area_of_site.toLocaleString()} sqft</span>}
            {project.start_date && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} />{project.start_date}</span>}
            {project.target_end_date && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />Due {project.target_end_date}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" size="sm" icon={Download} onClick={() => downloadProjectPDF(project, reports)}>Download Report</Btn>
          {isAdmin && <Btn variant="secondary" size="sm" icon={Edit3} onClick={openEdit}>Edit</Btn>}
          {isAdmin && <button onClick={handleDelete} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13, color: C.danger, fontWeight: 600 }}><Trash2 size={14} />Delete</button>}
        </div>
      </div>

      {/* Financial KPIs */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <KPICard label="Total Budget" value={fmt(project.total_cost)} sub="project budget" icon={DollarSign} accent={C.info} />
        <KPICard label="Amount Spent" value={fmt(project.total_spent || 0)} sub={`${pct}% used`} icon={TrendingUp} accent={C.accent} />
        <KPICard label="Remaining" value={fmt(remaining)} sub="budget left" icon={Activity} accent={remaining < 0 ? C.danger : C.success} />
        <KPICard label="DPRs Filed" value={projReports.length} sub="daily reports" icon={FileText} accent={C.charcoal} />
      </div>

      {/* Satellite Map */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={15} color={C.accent} /> Site Location
        </h3>
        <SatelliteMap lat={project.latitude} lng={project.longitude} projectName={project.name} height={340} />
      </div>

      {/* Recent DPRs */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Daily Reports</h3>
        {projReports.length === 0 ? <Empty message="No reports yet" sub="Submit a DPR for this project to see it here" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Date", "Floor", "Stage", "Weather", "Manpower", "Total Cost"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projReports.slice(0, 8).map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px", color: C.text }}>{r.report_date}</td>
                    <td style={{ padding: "10px 12px", color: C.text }}>{r.floor}</td>
                    <td style={{ padding: "10px 12px", color: C.text }}>{r.stage}</td>
                    <td style={{ padding: "10px 12px", color: C.textMuted }}>{r.weather || "—"}</td>
                    <td style={{ padding: "10px 12px", color: C.text, textAlign: "center" }}>{r.manpower_count || 0}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: C.accent }}>{fmt(r.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stage Progress */}
      {activeStages.length > 0 && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Stage Progress</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STAGES_DETAIL.filter(s => stageCount[s] > 0).map(s => {
              const count = stageCount[s] || 0
              const barPct = Math.round((count / maxCount) * 100)
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: FONT, fontSize: 13, color: C.text, width: 200, flexShrink: 0 }}>{s}</span>
                  <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${barPct}%`, height: "100%", background: barPct >= 60 ? C.success : C.accent, borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, width: 60, textAlign: "right" }}>{count} DPR{count > 1 ? "s" : ""}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <Modal title="Edit Project" onClose={() => setShowEdit(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Project Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              <Input label="Target End Date" type="date" value={form.target_end_date} onChange={e => setForm(f => ({ ...f, target_end_date: e.target.value }))} />
              <Input label="Total Budget (₹)" type="number" value={form.total_cost} onChange={e => setForm(f => ({ ...f, total_cost: e.target.value }))} />
              <Input label="Site Area (sqft)" type="number" value={form.area_of_site} onChange={e => setForm(f => ({ ...f, area_of_site: e.target.value }))} />
            </div>
            <LocationPicker lat={form.latitude} lng={form.longitude} onChange={(lt, lg) => setForm(f => ({ ...f, latitude: lt, longitude: lg }))} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={[{ value: "active", label: "Active" }, { value: "delayed", label: "Delayed" }, { value: "on_hold", label: "On Hold" }, { value: "completed", label: "Completed" }]} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Btn>
              <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
// FIX: Role is fetched from profiles table in DB after login.
// Frontend-selected role is never trusted.

export default function App() {
  const [screen, setScreen] = useState("landing")
  const [page, setPage] = useState("dashboard")
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState("viewer")
  const [assignedProjectIds, setAssignedProjectIds] = useState([])
  const [projects, setProjects] = useState([])
  const [reports, setReports] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeProjectId, setActiveProjectId] = useState(null)

  useEffect(() => {
    const link = document.createElement("link")
    link.href = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)
  }, [])

  // Fetch role from profiles table — single source of truth for RBAC
  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("role").eq("id", uid).single()
    if (data?.role) setUserRole(data.role)
  }

  // Fetch project IDs this user is assigned to (non-admin only).
  // Uses the SECURITY DEFINER DB function to avoid RLS recursion.
  const fetchAssignedProjects = async (role) => {
    if (role === "admin") { setAssignedProjectIds([]); return }
    const { data } = await supabase.rpc("get_assigned_project_ids")
    setAssignedProjectIds(data || [])
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).then(() => fetchAssignedProjects(userRole))
        setScreen("app")
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
        setScreen("app")
      } else {
        setUser(null)
        setUserRole("viewer")
        setAssignedProjectIds([])
        setScreen("landing")
        setProjects([])
        setReports([])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // After role and assignments are loaded, fetch data scoped by RLS automatically.
  // visibleProjects filters the UI dropdowns for non-admin users.
  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      const [{ data: p }, { data: r }, { data: n }] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("daily_reports").select("*, projects(name)").order("report_date", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      ])
      setProjects(p || [])
      setReports(r || [])
      setNotifications(n || [])
    }
    loadData()
  }, [user])

  // Fetch assigned project IDs whenever role resolves (non-admin only)
  useEffect(() => {
    if (!user || !userRole || userRole === "viewer") return
    fetchAssignedProjects(userRole)
  }, [userRole])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleMarkAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id)
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ background: C.accent, borderRadius: 16, padding: 16, display: "inline-flex", marginBottom: 16 }}><HardHat size={32} color="#fff" /></div>
        <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Loading BuildTrack...</p>
      </div>
    </div>
  )

  if (screen === "landing") return <Landing onLogin={() => setScreen("auth")} />
  if (screen === "auth") return <Auth onSuccess={(u) => { setUser(u); fetchProfile(u.id); setScreen("app") }} />

  // Admin sees all projects. Non-admin sees only their assigned projects.
  // RLS enforces this at the DB level too — this is a UI-layer complement.
  const visibleProjects = userRole === "admin"
    ? projects
    : projects.filter(p => assignedProjectIds.includes(p.id))

  const handleCardClick = (projId) => {
    setActiveProjectId(projId)
    setPage("project-detail")
  }

  const sharedProps = { notifications, onMarkAllRead: handleMarkAllRead }

  const PAGES = {
    dashboard:        <Dashboard user={user} setPage={setPage} projects={visibleProjects} reports={reports} />,
    projects:         <Projects user={user} projects={visibleProjects} setProjects={setProjects} onCardClick={handleCardClick} {...sharedProps} />,
    "submit-dpr":     <SubmitDPR user={user} projects={visibleProjects} setReports={setReports} {...sharedProps} />,
    reports:          <Reports projects={visibleProjects} reports={reports} {...sharedProps} />,
    materials:        <Materials user={user} projects={visibleProjects} {...sharedProps} />,
    financials:       <Financials projects={visibleProjects} reports={reports} {...sharedProps} />,
    users:            <UserManagement user={user} userRole={userRole} projects={projects} {...sharedProps} />,
    "project-detail": <ProjectDetail
                        projectId={activeProjectId}
                        user={user}
                        userRole={userRole}
                        projects={visibleProjects}
                        setProjects={setProjects}
                        reports={reports}
                        onBack={() => setPage("projects")}
                        {...sharedProps}
                      />,
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FONT }}>
      <Sidebar page={page} setPage={setPage} user={user} userRole={userRole} onSignOut={handleSignOut} />
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {PAGES[page] || PAGES.dashboard}
      </main>
    </div>
  )
}
