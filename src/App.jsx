/**
 * BuildTrack — Construction Progress Management
 * src/App.jsx
 *
 * Single-file React application. All pages, components, helpers, and
 * constants are colocated here for simplicity during the MVP phase.
 *
 * Architecture overview:
 *  ├── Constants        (FONT, C colour palette)
 *  ├── Helpers          (formatters, PDF/CSV exporters, Leaflet loader)
 *  ├── UI Primitives    (Spinner, Badge, KPICard, Input, Select, Btn, Modal …)
 *  ├── Layout           (Sidebar, TopBar)
 *  ├── Pages            (Landing, Auth, Dashboard, Projects, SubmitDPR,
 *  │                     Reports, Materials, Financials, LabourRegister,
 *  │                     AIAssistant, UserManagement, ProjectDetail)
 *  └── App Root         (auth state, data loading, routing)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  HardHat, Wrench, Truck, Loader, UserPlus, Bot, Send, Menu, Database,
  Image, UserCheck, UserX, ClipboardList
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

const FONT         = "'Barlow', sans-serif"
const FONT_HEADING = "'Barlow Condensed', sans-serif"

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR PALETTE
// All colours are centralised here. Never use raw hex values inside components.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  sidebar:     "#0D1B2A",
  sidebarHover:"#162435",
  accent:      "#F97316",
  accentDark:  "#EA6B0E",
  accentLight: "#FFF7ED",
  success:     "#10B981",
  warning:     "#F59E0B",
  danger:      "#EF4444",
  info:        "#3B82F6",
  bg:          "#F1F5F9",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  text:        "#0F172A",
  textMuted:   "#64748B",
  textLight:   "#94A3B8",
  navy:        "#1E3A5F",
  charcoal:    "#334155",
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count-up animation hook. Animates a number from 0 to `end`.
 * Triggers when the element becomes visible (IntersectionObserver).
 * Returns [displayValue, ref]. Attach ref to the DOM node.
 */
const useCountUp = (end, { duration = 1200, prefix = "", suffix = "" } = {}) => {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const triggered = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !triggered.current) {
        triggered.current = true
        obs.unobserve(el)
        const numEnd = typeof end === "number" ? end : parseFloat(String(end).replace(/[^0-9.]/g, "")) || 0
        if (numEnd === 0) { setValue(end); return }
        const start = performance.now()
        const tick = (now) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          // easeOutQuart for natural deceleration
          const eased = 1 - Math.pow(1 - progress, 4)
          const current = Math.round(eased * numEnd)
          setValue(current)
          if (progress < 1) requestAnimationFrame(tick)
          else setValue(numEnd)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  const display = typeof end === "number"
    ? `${prefix}${value.toLocaleString("en-IN")}${suffix}`
    : typeof end === "string" && !isNaN(parseFloat(end.replace(/[^0-9.]/g, "")))
      ? `${prefix}${value.toLocaleString("en-IN")}${suffix}`
      : end
  return [display, ref]
}

/**
 * Intersection Observer hook. Returns [isVisible, ref].
 * Once triggered, stays true (no re-trigger on scroll up).
 */
const useInView = (threshold = 0.15) => {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [visible, ref]
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ANIMATION CSS
// Injected once at module level. Uses only transform + opacity for perf.
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_ANIM_CSS = `
/* ── Skeleton shimmer ──────────────────────────────────────────────── */
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(90deg, #E2E8F0 25%, #F8FAFC 50%, #E2E8F0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}

/* ── Button micro-interactions ─────────────────────────────────────── */
.btn-interactive {
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.15s ease;
}
.btn-interactive:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(249,115,22,0.25);
}
.btn-interactive:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.btn-secondary-interactive:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* ── Card hover effects ────────────────────────────────────────────── */
.card-hover {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(249,115,22,0.12);
  border-color: rgba(249,115,22,0.3);
}

/* ── KPI card hover ────────────────────────────────────────────────── */
.kpi-hover {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.kpi-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.08);
}

/* ── Input focus glow ──────────────────────────────────────────────── */
.input-glow:focus {
  border-color: #F97316 !important;
  box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
  outline: none;
}

/* ── Table row hover ───────────────────────────────────────────────── */
.row-hover:hover {
  background: #FFF7ED !important;
}

/* ── Scroll progress bar ───────────────────────────────────────────── */
.scroll-progress {
  position: fixed; top: 0; left: 0; height: 2px; z-index: 10000;
  background: linear-gradient(90deg, #F97316, #FB923C);
  transition: width 0.1s linear;
  pointer-events: none;
}

/* ── Icon spring on hover (used inside cards) ──────────────────────── */
.icon-spring {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-hover:hover .icon-spring,
.kpi-hover:hover .icon-spring {
  transform: scale(1.15) rotate(5deg);
}

/* ── Orb drift for hero backgrounds ────────────────────────────────── */
@keyframes orbDrift {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(40px, -30px) scale(1.05); }
  66%  { transform: translate(-20px, 20px) scale(0.97); }
  100% { transform: translate(0, 0) scale(1); }
}
.orb-drift { animation: orbDrift 18s ease-in-out infinite; }

/* ── Word reveal mask ──────────────────────────────────────────────── */
@keyframes wordReveal {
  from { transform: translateY(110%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.word-reveal {
  display: inline-block; overflow: hidden; vertical-align: bottom;
}
.word-reveal > span {
  display: inline-block;
  animation: wordReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

/* ── Pulse badge (for low stock alerts) ────────────────────────────── */
@keyframes pulseBadge {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
.pulse-badge { animation: pulseBadge 2s ease-in-out infinite; }

/* ── Page transition fade-in ───────────────────────────────────────── */
@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-fade-in {
  animation: pageFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* ── Notification dot pulse ────────────────────────────────────────── */
@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.7; transform: scale(1.3); }
}
.dot-pulse { animation: dotPulse 2s ease-in-out infinite; }

/* ── Reduced motion ────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`

// Inject global animation CSS once
if (typeof document !== "undefined" && !document.getElementById("bt-anim-css")) {
  const s = document.createElement("style")
  s.id = "bt-anim-css"
  s.textContent = GLOBAL_ANIM_CSS
  document.head.appendChild(s)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Formatters and Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a rupee amount into a human-readable string.
 * Values ≥ 1 Cr are shown in Cr; values ≥ 1 L are shown in L; otherwise full.
 */
const fmt = n =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : `₹${(n || 0).toLocaleString("en-IN")}`

/** Maps a database role key to a human-readable label. */
const formatRole = role => ({
  admin:           "Admin",
  project_manager: "Project Manager",
  site_engineer:   "Site Engineer",
  accountant:      "Accountant",
  viewer:          "Viewer",
}[role] || "Viewer")

/**
 * Generates and triggers a CSV download of all Daily Progress Reports.
 * @param {Array} reports - Array of DPR records with joined project name.
 */
const downloadCSV = (reports) => {
  const headers = [
    "Project", "Floor", "Stage", "Date", "Weather", "Manpower",
    "Labor Cost", "Material Cost", "Equipment Cost",
    "Subcontractor Cost", "Other Cost", "Total Cost", "Remarks"
  ]
  const rows = reports.map(r => [
    r.projects?.name || "", r.floor, r.stage, r.report_date, r.weather,
    r.manpower_count, r.labor_cost, r.material_cost, r.equipment_cost,
    r.subcontractor_cost, r.other_cost, r.total_cost,
    `"${(r.remarks || "").replace(/"/g, "'")}"`
  ])
  const csv  = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = "buildtrack-reports.csv"; a.click()
  URL.revokeObjectURL(url)
}

/**
 * Generates a print-ready HTML summary and opens it in a new tab.
 * Covers all projects and reports at portfolio level.
 */
const downloadPDF = (reports, projects) => {
  const totalSpent  = projects.reduce((s, p) => s + (p.total_spent  || 0), 0)
  const totalBudget = projects.reduce((s, p) => s + (p.total_cost   || 0), 0)
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
  <div class="kpi">
    <div class="kpi-box"><h3>Total Budget</h3><p>${fmt(totalBudget)}</p></div>
    <div class="kpi-box"><h3>Total Spent</h3><p>${fmt(totalSpent)}</p></div>
    <div class="kpi-box"><h3>Total Reports</h3><p>${reports.length}</p></div>
    <div class="kpi-box"><h3>Projects</h3><p>${projects.length}</p></div>
  </div>
  <h2 style="margin-bottom:12px">Daily Progress Reports</h2>
  <table>
    <tr><th>Date</th><th>Project</th><th>Stage</th><th>Floor</th><th>Weather</th><th>Manpower</th><th>Total Cost</th></tr>
    ${reports.map(r => `<tr>
      <td>${r.report_date}</td><td>${r.projects?.name || ""}</td><td>${r.stage}</td>
      <td>${r.floor}</td><td>${r.weather || "-"}</td><td>${r.manpower_count}</td>
      <td>${fmt(r.total_cost)}</td>
    </tr>`).join("")}
  </table>
  <p class="footer">BuildTrack Construction Management System</p></body></html>`
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, "_blank")
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

/**
 * Generates a detailed project-level PDF report and opens it for printing.
 * Includes KPI summary, all DPRs, and project metadata.
 */
const downloadProjectPDF = (project, reports) => {
  const projReports = reports.filter(r => r.project_id === project.id)
  const pct       = project.total_cost > 0
    ? Math.round(((project.total_spent || 0) / project.total_cost) * 100) : 0
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
      ${project.start_date       ? `<div class="meta-item"><label>Start Date</label><span>${project.start_date}</span></div>` : ""}
      ${project.target_end_date  ? `<div class="meta-item"><label>Target End Date</label><span>${project.target_end_date}</span></div>` : ""}
      ${project.area_of_site     ? `<div class="meta-item"><label>Site Area</label><span>${project.area_of_site.toLocaleString()} sqft</span></div>` : ""}
      ${project.latitude && project.longitude
        ? `<div class="meta-item"><label>Location</label><span>${Number(project.latitude).toFixed(4)}, ${Number(project.longitude).toFixed(4)}</span></div>` : ""}
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
      ${projReports.length === 0
        ? `<p style="color:#64748B;font-size:13px">No reports submitted yet.</p>`
        : `<table>
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
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, "_blank")
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

/**
 * Lazily loads the Leaflet mapping library from CDN.
 * Resolves with the global L instance once the script is ready.
 * Safe to call multiple times — returns immediately if already loaded.
 */
const loadLeaflet = () => new Promise(resolve => {
  if (window.L) { resolve(window.L); return }
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link")
    link.id = "leaflet-css"; link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)
  }
  const script = document.createElement("script")
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  script.onload = () => resolve(window.L)
  document.head.appendChild(script)
})

// ─────────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES — Reusable design-system components
// ─────────────────────────────────────────────────────────────────────────────

/** Full-page centred loading spinner. */
const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{
      width: 36, height: 36,
      border: `3px solid ${C.border}`,
      borderTopColor: C.accent,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

/**
 * Skeleton loading placeholder.
 * Renders shimmer bars that mimic content layout before data loads.
 * @param {number} rows - Number of skeleton rows (default 3)
 * @param {string} type - "card" | "table" | "kpi" (affects layout)
 */
const Skeleton = ({ rows = 3, type = "card" }) => {
  const widths = [85, 60, 92, 55, 78, 68]
  if (type === "kpi") {
    return (
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ flex: 1, minWidth: 160, background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}` }}>
            <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 28, width: "40%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 10, width: "80%" }} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ background: C.card, borderRadius: 12, padding: "18px 22px", border: `1px solid ${C.border}` }}>
          <div className="skeleton" style={{ height: 14, width: `${widths[i % widths.length]}%`, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 10, width: `${widths[(i + 2) % widths.length]}%` }} />
        </div>
      ))}
    </div>
  )
}

/** Centred empty-state placeholder with optional sub-text. */
const Empty = ({ message = "No data yet", sub = "" }) => (
  <div style={{ textAlign: "center", padding: "60px 24px", color: C.textMuted }}>
    <AlertCircle size={36} color={C.border} style={{ marginBottom: 12 }} />
    <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.textLight, margin: "0 0 6px" }}>{message}</p>
    {sub && <p style={{ fontFamily: FONT, fontSize: 13, margin: 0 }}>{sub}</p>}
  </div>
)

/** Inline pill badge with configurable colour and background. */
const Badge = ({ label, color, bg }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, fontFamily: FONT,
    background: bg, color, letterSpacing: "0.03em"
  }}>{label}</span>
)

/**
 * Semantic status badge.
 * Maps status strings (project status, role names, material categories)
 * to consistent colour pairings defined in the palette.
 */
const StatusBadge = ({ status }) => {
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

/**
 * KPI summary card with accent colour stripe, icon, value, and optional trend.
 * Uses count-up animation when the card scrolls into view.
 * Hover: lifts 3px + shadow grows. Icon: spring scale on hover.
 */
const KPICard = ({ label, value, sub, icon: Icon, accent, trend }) => {
  // Parse numeric values for count-up; pass strings through
  const numericValue = typeof value === "number" ? value : null
  const [countDisplay, countRef] = useCountUp(numericValue ?? 0, { duration: 1200 })

  return (
    <div ref={countRef} className="kpi-hover" style={{
      background: C.card, borderRadius: 12, padding: "20px 24px",
      border: `1px solid ${C.border}`, flex: 1, minWidth: 160,
      position: "relative", overflow: "hidden", cursor: "default"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3, background: accent || C.accent,
        borderRadius: "12px 12px 0 0"
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", lineHeight: 1 }}>
            {numericValue !== null ? countDisplay : value}
          </p>
          {sub && <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>{sub}</p>}
        </div>
        <div className="icon-spring" style={{ background: accent ? accent + "20" : C.accentLight, borderRadius: 10, padding: 10, display: "flex" }}>
          <Icon size={20} color={accent || C.accent} />
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <TrendingUp size={12} color={C.success} />
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.success, fontWeight: 600 }}>{trend}</span>
        </div>
      )}
    </div>
  )
}

/** Horizontal tab navigation bar. Renders inside a card header. */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{
    display: "flex", borderBottom: `1px solid ${C.border}`,
    background: C.card, borderRadius: "12px 12px 0 0", padding: "0 24px"
  }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        fontFamily: FONT, fontSize: 13,
        fontWeight: active === t ? 700 : 500,
        color: active === t ? C.accent : C.textMuted,
        padding: "14px 20px", border: "none", background: "none",
        cursor: "pointer",
        borderBottom: active === t ? `2px solid ${C.accent}` : "2px solid transparent",
        marginBottom: -1, transition: "all 0.15s", whiteSpace: "nowrap"
      }}>{t}</button>
    ))}
  </div>
)

/** Labelled text/number/date input with optional leading icon and focus glow. */
const Input = ({ label, type = "text", value, onChange, placeholder, required, icon: Icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}{required && <span style={{ color: C.danger }}> *</span>}
      </label>
    )}
    <div style={{ position: "relative" }}>
      {Icon && <Icon size={15} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="input-glow"
        style={{
          width: "100%", boxSizing: "border-box",
          padding: Icon ? "10px 12px 10px 36px" : "10px 14px",
          fontFamily: FONT, fontSize: 14, color: C.text,
          background: "#F8FAFC", border: `1px solid ${C.border}`,
          borderRadius: 8, outline: "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease"
        }}
      />
    </div>
  </div>
)

/** Labelled dropdown select input. */
const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}{required && <span style={{ color: C.danger }}> *</span>}
      </label>
    )}
    <select value={value} onChange={onChange} style={{
      padding: "10px 14px", fontFamily: FONT, fontSize: 14,
      color: C.text, background: "#F8FAFC",
      border: `1px solid ${C.border}`, borderRadius: 8,
      outline: "none", cursor: "pointer"
    }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
)

/**
 * Polymorphic button component with micro-interactions.
 * Variants: primary | secondary | ghost | danger | outline
 * Sizes: sm | md | lg
 * Hover: lifts 1px + accent glow. Active: presses down 1px.
 */
const Btn = ({ children, onClick, variant = "primary", size = "md", icon: Icon, disabled, style: extraStyle }) => {
  const styles = {
    primary:   { background: C.accent,   color: "#fff",        border: `1px solid ${C.accent}` },
    secondary: { background: C.card,     color: C.text,        border: `1px solid ${C.border}` },
    ghost:     { background: "transparent", color: C.textMuted, border: "1px solid transparent" },
    danger:    { background: C.danger,   color: "#fff",        border: `1px solid ${C.danger}` },
    outline:   { background: "transparent", color: C.accent,   border: `1px solid ${C.accent}` },
  }
  const sizes = {
    sm: { padding: "6px 14px",  fontSize: 12 },
    md: { padding: "9px 18px",  fontSize: 13 },
    lg: { padding: "12px 24px", fontSize: 14 },
  }
  const interactiveClass = variant === "secondary" || variant === "ghost"
    ? "btn-secondary-interactive" : "btn-interactive"
  return (
    <button onClick={onClick} disabled={disabled}
      className={interactiveClass}
      style={{
        ...styles[variant], ...sizes[size],
        fontFamily: FONT, fontWeight: 600, borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap", ...(extraStyle || {})
      }}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}{children}
    </button>
  )
}

/** Centred modal overlay with sticky header and scrollable body. */
const Modal = ({ title, onClose, children, width = 560 }) => (
  <div className="modal-overlay" style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    zIndex: 1000, display: "flex", alignItems: "center",
    justifyContent: "center", padding: 20
  }}>
    <div className="modal-content" style={{
      background: C.card, borderRadius: 16,
      width: "100%", maxWidth: width,
      maxHeight: "90vh", overflowY: "auto",
      boxShadow: "0 25px 60px rgba(0,0,0,0.3)"
    }}>
      <div style={{
        padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, background: C.card,
        borderRadius: "16px 16px 0 0", zIndex: 1
      }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{
          background: "#F1F5F9", border: "none", borderRadius: 8,
          padding: 8, cursor: "pointer", display: "flex"
        }}><X size={16} color={C.textMuted} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
)

/**
 * Horizontal progress bar.
 * NOTE: The colour logic here mirrors the legacy pattern for DPR/project progress.
 * For budget-specific colour rules (danger red above 100%) see budgetBarColour
 * in src/lib/financialEngine.ts — that function is authoritative for financial bars.
 */
const ProgressBar = ({ value, color = C.accent, height = 6 }) => (
  <div style={{ background: "#E2E8F0", borderRadius: height, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, value || 0)}%`, height: "100%",
      background: value >= 100 ? C.success : value >= 60 ? color : value > 0 ? C.warning : "#E2E8F0",
      borderRadius: height, transition: "width 0.4s ease"
    }} />
  </div>
)

/** Renders a contextually appropriate weather icon. */
const WeatherIcon = ({ w }) => {
  if (w?.toLowerCase().includes("rain"))  return <CloudRain size={14} color={C.info} />
  if (w?.toLowerCase().includes("cloud")) return <Cloud     size={14} color={C.textMuted} />
  return <Sun size={14} color={C.warning} />
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION CONFIGURATION
// Add new top-level pages here. The Sidebar and PAGES router both consume NAV.
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { key: "dashboard",    label: "Dashboard",        icon: LayoutDashboard },
  { key: "projects",     label: "Projects",          icon: FolderOpen      },
  { key: "submit-dpr",   label: "Submit DPR",        icon: FileText        },
  { key: "site-issues",  label: "Site Issues",       icon: AlertTriangle   },
  { key: "labour",       label: "Labour Register",   icon: Wrench          },
  { key: "reports",      label: "Reports",           icon: BarChart2       },
  { key: "materials",    label: "Materials",         icon: Package         },
  { key: "financials",   label: "Financials",        icon: DollarSign      },
  { key: "ai-assistant", label: "AI Assistant",      icon: Bot             },
  { key: "users",        label: "User Management",   icon: Users           },
]

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT — Sidebar and TopBar
// ─────────────────────────────────────────────────────────────────────────────

/** Fixed left-hand navigation sidebar. Renders the brand logo, nav links, and user footer. */
const Sidebar = ({ page, setPage, user, userRole, onSignOut }) => (
  <div style={{
    width: 240, minWidth: 240, background: C.sidebar,
    height: "100vh", display: "flex", flexDirection: "column",
    position: "sticky", top: 0
  }}>
    {/* Brand */}
    <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1E3A5F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: C.accent, borderRadius: 10, padding: 8, display: "flex" }}>
          <HardHat size={20} color="#fff" />
        </div>
        <div>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>BuildTrack</p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#64748B", margin: 0 }}>Construction Management</p>
        </div>
      </div>
    </div>

    {/* Navigation links */}
    <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
      {NAV.map(({ key, label, icon: Icon }) => {
        const active = page === key
        return (
          <button key={key} onClick={() => setPage(key)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 10, marginBottom: 2,
            border: "none", cursor: "pointer",
            background: active ? C.accent : "transparent",
            transition: "all 0.15s", textAlign: "left"
          }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.sidebarHover }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}>
            <Icon size={17} color={active ? "#fff" : "#94A3B8"} />
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#fff" : "#94A3B8" }}>{label}</span>
          </button>
        )
      })}
    </nav>

    {/* User footer */}
    <div style={{ padding: "16px 12px", borderTop: "1px solid #1E3A5F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 4 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#E2E8F0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email?.split("@")[0] || "User"}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#64748B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {formatRole(userRole)}
          </p>
        </div>
      </div>
      <button onClick={onSignOut} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 10, border: "none",
        cursor: "pointer", background: "transparent", transition: "all 0.15s"
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#7F1D1D"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <LogOut size={16} color="#EF4444" />
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#EF4444" }}>Sign Out</span>
      </button>
    </div>
  </div>
)

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}

/** Bottom navigation bar for mobile devices, with a slide-in drawer for extra items. */
const MobileNav = ({ page, setPage, user, userRole, onSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const bottomNavItems = [
    { key: "dashboard", label: "Home", icon: LayoutDashboard },
    { key: "projects", label: "Projects", icon: FolderOpen },
    { key: "submit-dpr", label: "New DPR", icon: FileText },
    { key: "reports", label: "Reports", icon: BarChart2 },
  ];

  return (
    <>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 65,
        background: C.card, borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        zIndex: 900, paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        {bottomNavItems.map(({ key, label, icon: Icon }) => {
          const active = page === key;
          return (
            <button key={key} onClick={() => setPage(key)} style={{
              background: "none", border: "none", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, cursor: "pointer", flex: 1, padding: "8px 0"
            }}>
              <Icon size={20} color={active ? C.accent : C.textMuted} />
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.accent : C.textMuted }}>{label}</span>
            </button>
          )
        })}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: "none", border: "none", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4, cursor: "pointer", flex: 1, padding: "8px 0"
        }}>
          <Menu size={20} color={menuOpen ? C.accent : C.textMuted} />
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: menuOpen ? 700 : 500, color: menuOpen ? C.accent : C.textMuted }}>Menu</span>
        </button>
      </div>

      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 950 }} onClick={() => setMenuOpen(false)}>
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 260,
            background: C.card, display: "flex", flexDirection: "column",
            transform: menuOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s ease",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
              <div>
                <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 800, margin: 0, color: C.text }}>BuildTrack</p>
                <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>{user?.email?.split("@")[0]} · {formatRole(userRole)}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} color={C.textMuted} /></button>
            </div>
            <nav style={{ flex: 1, padding: 12, overflowY: "auto" }}>
              {NAV.map(({ key, label, icon: Icon }) => {
                const active = page === key;
                return (
                  <button key={key} onClick={() => { setPage(key); setMenuOpen(false); }} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 8, marginBottom: 4, border: "none",
                    background: active ? `${C.accent}12` : "transparent",
                    color: active ? C.accent : C.text, cursor: "pointer", textAlign: "left"
                  }}>
                    <Icon size={18} color={active ? C.accent : C.textMuted} />
                    <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: active ? 600 : 500 }}>{label}</span>
                  </button>
                )
              })}
            </nav>
            <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => { onSignOut(); setMenuOpen(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 8, border: "none", cursor: "pointer", background: "transparent"
              }}>
                <LogOut size={18} color={C.danger} />
                <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.danger }}>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Sticky page-level header with title, subtitle, action buttons, and notification bell. */
const TopBar = ({ title, subtitle, actions, notifications, onMarkAllRead }) => {
  const [showNotif, setShowNotif] = useState(false)
  const unread = notifications.filter(n => !n.is_read).length
  return (
    <div style={{
      background: C.card, borderBottom: `1px solid ${C.border}`,
      padding: "16px 28px", display: "flex",
      justifyContent: "space-between", alignItems: "center",
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div>
        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {actions}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowNotif(v => !v)} style={{
            position: "relative", background: "#F1F5F9",
            border: "none", borderRadius: 10, padding: 10,
            cursor: "pointer", display: "flex"
          }}>
            <Bell size={18} color={C.charcoal} />
            {unread > 0 && (
              <span className="dot-pulse" style={{
                position: "absolute", top: 6, right: 6,
                width: 8, height: 8, background: C.danger,
                borderRadius: "50%", border: "2px solid #fff"
              }} />
            )}
          </button>
          {showNotif && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 340, background: C.card, borderRadius: 12,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              border: `1px solid ${C.border}`, zIndex: 200
            }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.text }}>
                  Notifications{" "}
                  {unread > 0 && <span style={{ background: C.danger, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 11, marginLeft: 4 }}>{unread}</span>}
                </span>
                {unread > 0 && (
                  <button onClick={onMarkAllRead} style={{ fontFamily: FONT, fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifications.length === 0
                  ? <Empty message="No notifications" />
                  : notifications.map(n => (
                    <div key={n.id} style={{
                      padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
                      background: n.is_read ? "transparent" : "#FFF7ED",
                      display: "flex", gap: 10
                    }}>
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Landing (Full Marketing Page)
// 8 sections: Navbar · Hero · Social Proof · Pain Points · Features ·
//             How It Works · Role Cards · Final CTA · Footer
// ─────────────────────────────────────────────────────────────────────────────

/** Scroll-triggered fade-in wrapper using Intersection Observer */
const FadeIn = ({ children, delay = 0, style = {} }) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      ...style
    }}>{children}</div>
  )
}

const Landing = ({ onLogin }) => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // ── Shared section wrapper ────────────────────────────────────────────────
  const Section = ({ children, bg = "transparent", id, style: sx = {} }) => (
    <section id={id} style={{ padding: "100px 24px", background: bg, ...sx }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>{children}</div>
    </section>
  )

  const SectionTag = ({ text }) => (
    <div style={{ display: "inline-block", background: C.accent + "18", border: `1px solid ${C.accent}30`, borderRadius: 20, padding: "6px 18px", marginBottom: 16 }}>
      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>{text}</span>
    </div>
  )

  const SectionTitle = ({ children, light = false }) => (
    <h2 style={{ fontFamily: FONT_HEADING, fontSize: 42, fontWeight: 900, color: light ? "#fff" : C.text, margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-0.01em" }}>{children}</h2>
  )

  const SectionSub = ({ children, light = false }) => (
    <p style={{ fontFamily: FONT, fontSize: 17, color: light ? "#94A3B8" : C.textMuted, margin: "0 0 48px", lineHeight: 1.65, maxWidth: 600 }}>{children}</p>
  )

  // ── Feature cards data ────────────────────────────────────────────────────
  const features = [
    {
      icon: FileText, title: "Daily Progress Reports",
      desc: "Submit DPRs in under 2 minutes — weather, manpower, cost breakdown, remarks, and site photos. All timestamped and searchable.",
      highlights: ["One-tap weather selector", "Auto-calculated total cost", "Photo upload from site camera", "PDF & CSV export"]
    },
    {
      icon: DollarSign, title: "Real-Time Financial Dashboard",
      desc: "See budget vs actual spend across every project. Donut breakdowns by cost category. Monthly trend lines. Never be surprised by a cost blowout again.",
      highlights: ["Budget utilisation bars", "Category-wise cost split", "Per-project financial drill-down", "One-click report generation"]
    },
    {
      icon: Package, title: "Materials & Inventory",
      desc: "Track every bag of cement, every rod of steel. Automatic stock adjustments on usage and purchase. Low-stock alerts before you run out.",
      highlights: ["Trigger-maintained stock balances", "Low-stock threshold alerts", "Purchase & usage log", "Category analytics"]
    },
  ]

  const painPoints = [
    { icon: FileText, title: "Paper-Based DPRs", problem: "Handwritten daily reports get lost, are unreadable, and impossible to search.", solution: "Digital DPRs with auto-totals, photos, and instant PDF export." },
    { icon: DollarSign, title: "Invisible Cost Bleed", problem: "You discover you're over budget only after the damage is done.", solution: "Real-time budget vs actual tracking with stage-level granularity." },
    { icon: Package, title: "Material Stock Gaps", problem: "Cement runs out mid-pour. Steel arrives late. Nobody tracked usage.", solution: "Auto-decremented stock with low-threshold alerts and purchase logs." },
  ]

  const steps = [
    { num: "01", title: "Create Your Project", desc: "Set up your site with budget, timeline, GPS coordinates, and team assignments in under a minute." },
    { num: "02", title: "Submit Daily Reports", desc: "Site engineers log weather, manpower, costs, and photos from the field — on any device." },
    { num: "03", title: "Review & Act", desc: "Project managers and owners see real-time dashboards, financial analytics, and stage progress." },
  ]

  const roles = [
    { icon: HardHat, title: "Site Engineer", desc: "Submit DPRs from the field in under 2 minutes. Log manpower, costs, and photos on the go.", color: C.success },
    { icon: FolderOpen, title: "Project Manager", desc: "Monitor multiple sites at once. Spot delayed stages, review DPRs, and manage team assignments.", color: C.info },
    { icon: DollarSign, title: "Accountant", desc: "Access financial dashboards, export cost reports, and reconcile weekly expenditure against budget.", color: C.warning },
    { icon: Building2, title: "Project Owner", desc: "Get a portfolio-level view. Budget utilisation, site progress, and project health — all at a glance.", color: C.accent },
  ]

  const stats = [
    { value: "10,000+", label: "DPRs Submitted" },
    { value: "50+", label: "Active Teams" },
    { value: "₹200Cr+", label: "Budgets Tracked" },
    { value: "99.9%", label: "Uptime" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: C.sidebar, fontFamily: FONT }}>

      {/* ── CSS Animations ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes heroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes gradientMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .landing-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(249,115,22,0.35) !important; }
        .landing-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 50px rgba(0,0,0,0.25) !important; }
        .feature-card:hover { border-color: #F97316 !important; }
        .role-card:hover { transform: translateY(-4px) !important; }
        .step-num { background: linear-gradient(135deg, #F97316, #EA6B0E); background-size: 200% 200%; animation: gradientMove 3s ease infinite; }
      `}</style>

      {/* ── 1. NAVBAR (sticky, transparent → solid on scroll) ─────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: scrolled ? "14px 48px" : "20px 48px",
        background: scrolled ? "rgba(13,27,42,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "all 0.35s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: C.accent, borderRadius: 10, padding: 8, display: "flex" }}><HardHat size={20} color="#fff" /></div>
          <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>BuildTrack</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {["Features", "How It Works", "Roles"].map(t => (
            <a key={t} href={`#${t.toLowerCase().replace(/\s+/g, "-")}`}
              style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#94A3B8", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "#94A3B8"}
            >{t}</a>
          ))}
          <button onClick={onLogin} style={{
            fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#fff",
            background: C.accent, border: "none", borderRadius: 10,
            padding: "10px 24px", cursor: "pointer", transition: "all 0.2s"
          }} className="landing-cta">Get Started</button>
        </div>
      </nav>

      {/* ── 2. HERO SECTION ──────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "140px 24px 80px", textAlign: "center", position: "relative",
        overflow: "hidden"
      }}>
        {/* Background gradient orbs — CSS-only animation, no JS overhead */}
        <div className="orb-drift" style={{
          position: "absolute", top: "10%", left: "15%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", opacity: 0.6
        }} />
        <div className="orb-drift" style={{
          position: "absolute", bottom: "15%", right: "10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", opacity: 0.5,
          animationDelay: "-6s"
        }} />
        <div className="orb-drift" style={{
          position: "absolute", top: "50%", left: "60%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
          filter: "blur(50px)", pointerEvents: "none", opacity: 0.4,
          animationDelay: "-12s"
        }} />

        <FadeIn>
          <div style={{ background: C.accent + "18", border: `1px solid ${C.accent}30`, borderRadius: 24, padding: "8px 22px", marginBottom: 32, display: "inline-block" }}>
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              ⚡ Construction Progress Automation
            </span>
          </div>
        </FadeIn>

        {/* Word-by-word headline reveal */}
        <FadeIn delay={0.1}>
          <h1 style={{
            fontFamily: FONT_HEADING, fontSize: 72, fontWeight: 900,
            color: "#fff", margin: "0 0 24px", lineHeight: 1.02,
            letterSpacing: "-0.02em", maxWidth: 800
          }}>
            {"Track Every Day.".split(" ").map((word, i) => (
              <span key={i} className="word-reveal" style={{ marginRight: "0.3em" }}>
                <span style={{ animationDelay: `${0.5 + i * 0.08}s` }}>{word}</span>
              </span>
            ))}
            <br />
            {"On Every Site.".split(" ").map((word, i) => (
              <span key={`b${i}`} className="word-reveal" style={{ marginRight: "0.3em" }}>
                <span style={{
                  animationDelay: `${0.8 + i * 0.08}s`,
                  background: "linear-gradient(135deg, #F97316, #FB923C, #F59E0B)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>{word}</span>
              </span>
            ))}
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p style={{ fontFamily: FONT, fontSize: 19, color: "#94A3B8", maxWidth: 580, margin: "0 0 44px", lineHeight: 1.7 }}>
            Submit Daily Progress Reports, track costs, manage materials, and monitor project health — all in one platform built for construction teams.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={onLogin} className="landing-cta" style={{
              fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#fff",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
              border: "none", borderRadius: 12, padding: "16px 36px",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(249,115,22,0.3)", transition: "all 0.25s"
            }}>
              Start Managing Projects <ChevronRight size={18} />
            </button>
            <button onClick={onLogin} style={{
              fontFamily: FONT, fontSize: 15, fontWeight: 600,
              color: "#94A3B8", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
              padding: "16px 32px", cursor: "pointer", transition: "all 0.2s"
            }}
              onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.1)"; e.target.style.color = "#fff" }}
              onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.05)"; e.target.style.color = "#94A3B8" }}
            >Sign In</button>
          </div>
        </FadeIn>

        {/* Hero feature pills */}
        <FadeIn delay={0.45} style={{ marginTop: 64 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              [FileText, "Daily Progress Reports"],
              [BarChart2, "Real-Time Analytics"],
              [Package, "Inventory Tracking"],
              [Users, "Team Management"],
            ].map(([Icon, label]) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 30, padding: "10px 20px",
              }}>
                <Icon size={14} color={C.accent} />
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#CBD5E1" }}>{label}</span>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: "heroFloat 2.5s ease-in-out infinite"
        }}>
          <span style={{ fontFamily: FONT, fontSize: 11, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll to explore</span>
          <ChevronDown size={16} color="#475569" />
        </div>
      </section>

      {/* ── 3. SOCIAL PROOF BAR ──────────────────────────────────────────── */}
      <section style={{ padding: "48px 24px", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 48 }}>
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div style={{ textAlign: "center", minWidth: 140 }}>
                <p style={{ fontFamily: FONT_HEADING, fontSize: 36, fontWeight: 900, color: C.accent, margin: "0 0 4px" }}>{s.value}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#64748B", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── 4. PAIN POINTS ───────────────────────────────────────────────── */}
      <Section bg="#0A1628">
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <FadeIn>
            <SectionTag text="The Problem" />
            <SectionTitle light>Why Construction Teams <span style={{ color: C.accent }}>Struggle</span></SectionTitle>
            <SectionSub light>Every site faces the same three challenges. BuildTrack was built to solve all of them.</SectionSub>
          </FadeIn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
          {painPoints.map((p, i) => {
            const PIcon = p.icon
            return (
            <FadeIn key={p.title} delay={i * 0.15}>
              <div className="landing-card" style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: 36,
                backdropFilter: "blur(8px)", transition: "all 0.35s ease", cursor: "default"
              }}>
                <div style={{ background: "rgba(249,115,22,0.1)", borderRadius: 14, padding: 14, display: "inline-flex", marginBottom: 20 }}>
                  <PIcon size={24} color={C.accent} />
                </div>
                <h3 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>{p.title}</h3>
                <p style={{ fontFamily: FONT, fontSize: 14, color: "#EF4444", margin: "0 0 16px", lineHeight: 1.6, fontWeight: 500 }}>
                  ✕ {p.problem}
                </p>
                <p style={{ fontFamily: FONT, fontSize: 14, color: C.success, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                  ✓ {p.solution}
                </p>
              </div>
            </FadeIn>
            )
          })}
        </div>
      </Section>

      {/* ── 5. FEATURE SHOWCASE (alternating layout) ─────────────────────── */}
      <Section bg={C.sidebar} id="features">
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <FadeIn>
            <SectionTag text="Core Features" />
            <SectionTitle light>Everything You Need to <span style={{ color: C.accent }}>Run a Site</span></SectionTitle>
            <SectionSub light>From daily reports to financial analytics — every module designed for real-world construction workflows.</SectionSub>
          </FadeIn>
        </div>
        {features.map((f, i) => {
          const FIcon = f.icon
          return (
          <FadeIn key={f.title} delay={0.1}>
            <div style={{
              display: "flex", gap: 60, alignItems: "center",
              marginBottom: i < features.length - 1 ? 80 : 0,
              flexDirection: i % 2 === 1 ? "row-reverse" : "row",
              flexWrap: "wrap"
            }}>
              {/* Text side */}
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ display: "inline-flex", background: C.accent + "18", borderRadius: 12, padding: 12, marginBottom: 20 }}>
                  <FIcon size={24} color={C.accent} />
                </div>
                <h3 style={{ fontFamily: FONT_HEADING, fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>{f.title}</h3>
                <p style={{ fontFamily: FONT, fontSize: 16, color: "#94A3B8", margin: "0 0 28px", lineHeight: 1.7 }}>{f.desc}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {f.highlights.map(h => (
                    <div key={h} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle size={14} color={C.success} />
                      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#CBD5E1" }}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Visual side — glass card mockup */}
              <div style={{ flex: 1, minWidth: 300, display: "flex", justifyContent: "center" }}>
                <div className="feature-card" style={{
                  width: "100%", maxWidth: 440,
                  background: "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24,
                  padding: 32, backdropFilter: "blur(12px)", transition: "all 0.35s"
                }}>
                  {/* Mini mockup UI */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: "#E2E8F0" }}>{f.title}</span>
                      <FIcon size={16} color={C.accent} />
                    </div>
                    {[1,2,3].map(j => (
                      <div key={j} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: j < 3 ? 10 : 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: j === 1 ? C.accent : j === 2 ? C.success : C.info }} />
                        <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4 }}>
                          <div style={{ width: `${90 - j * 20}%`, height: "100%", background: `linear-gradient(90deg, ${C.accent}60, ${C.accent}20)`, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: FONT, fontSize: 11, color: "#64748B", fontWeight: 600, minWidth: 36, textAlign: "right" }}>{`${90 - j * 20}%`}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { l: i === 0 ? "Today" : i === 1 ? "Budget" : "In Stock", v: i === 0 ? "12 DPRs" : i === 1 ? "₹2.4Cr" : "847 units" },
                      { l: i === 0 ? "Photos" : i === 1 ? "Spent" : "Low Stock", v: i === 0 ? "36 new" : i === 1 ? "₹1.8Cr" : "3 items" },
                    ].map(kpi => (
                      <div key={kpi.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ fontFamily: FONT, fontSize: 10, color: "#64748B", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.l}</p>
                        <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>{kpi.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          )
        })}
      </Section>

      {/* ── 6. HOW IT WORKS ──────────────────────────────────────────────── */}
      <Section bg="#0A1628" id="how-it-works">
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <FadeIn>
            <SectionTag text="How It Works" />
            <SectionTitle light>Up and Running in <span style={{ color: C.accent }}>3 Steps</span></SectionTitle>
            <SectionSub light>No complex setup. No training manuals. Just create, submit, and review.</SectionSub>
          </FadeIn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, position: "relative" }}>
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.15}>
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 24, padding: "44px 36px", textAlign: "center",
                position: "relative", overflow: "hidden"
              }}>
                <div style={{
                  position: "absolute", top: -20, right: -20,
                  width: 100, height: 100, borderRadius: "50%",
                  background: `radial-gradient(circle, ${C.accent}10 0%, transparent 70%)`,
                  pointerEvents: "none"
                }} />
                <div className="step-num" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 56, height: 56, borderRadius: 16, marginBottom: 24,
                  fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 900, color: "#fff"
                }}>{s.num}</div>
                <h3 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>{s.title}</h3>
                <p style={{ fontFamily: FONT, fontSize: 14, color: "#94A3B8", margin: 0, lineHeight: 1.7 }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div style={{
                    position: "absolute", top: "50%", right: -16, transform: "translateY(-50%)",
                    display: "none" /* visible on desktop via media query future enhancement */
                  }}>
                    <ChevronRight size={24} color={C.accent} />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── 7. ROLE CARDS ────────────────────────────────────────────────── */}
      <Section bg={C.sidebar} id="roles">
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <FadeIn>
            <SectionTag text="Built For Everyone" />
            <SectionTitle light>One Platform, <span style={{ color: C.accent }}>Every Role</span></SectionTitle>
            <SectionSub light>Whether you are on scaffolding or in the boardroom, BuildTrack shows you exactly what you need.</SectionSub>
          </FadeIn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {roles.map((r, i) => {
            const RIcon = r.icon
            return (
            <FadeIn key={r.title} delay={i * 0.1}>
              <div className="role-card" style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: "36px 28px", textAlign: "center",
                transition: "all 0.3s ease", cursor: "default",
                borderTop: `3px solid ${r.color}`
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 56, height: 56, borderRadius: 16,
                  background: r.color + "18", marginBottom: 20
                }}>
                  <RIcon size={26} color={r.color} />
                </div>
                <h3 style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>{r.title}</h3>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#94A3B8", margin: 0, lineHeight: 1.65 }}>{r.desc}</p>
              </div>
            </FadeIn>
            )
          })}
        </div>
      </Section>

      {/* ── 8. FINAL CTA ─────────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 24px", textAlign: "center", position: "relative", overflow: "hidden",
        background: "linear-gradient(180deg, #0A1628 0%, #0D1B2A 100%)"
      }}>
        {/* Gradient orb */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent}12 0%, transparent 65%)`,
          filter: "blur(60px)", pointerEvents: "none"
        }} />
        <FadeIn>
          <div style={{ position: "relative", zIndex: 1 }}>
            <SectionTag text="Get Started Today" />
            <h2 style={{
              fontFamily: FONT_HEADING, fontSize: 48, fontWeight: 900, color: "#fff",
              margin: "0 0 20px", lineHeight: 1.1, letterSpacing: "-0.01em"
            }}>
              Ready to Digitise<br /><span style={{ color: C.accent }}>Your Sites?</span>
            </h2>
            <p style={{ fontFamily: FONT, fontSize: 17, color: "#94A3B8", margin: "0 auto 40px", maxWidth: 500, lineHeight: 1.7 }}>
              Join construction teams already using BuildTrack to eliminate paperwork, prevent cost overruns, and keep every project on track.
            </p>
            <button onClick={onLogin} className="landing-cta" style={{
              fontFamily: FONT, fontSize: 16, fontWeight: 700, color: "#fff",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
              border: "none", borderRadius: 14, padding: "18px 48px",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10,
              boxShadow: "0 4px 30px rgba(249,115,22,0.35)", transition: "all 0.25s"
            }}>
              Start for Free <ChevronRight size={20} />
            </button>
            <p style={{ fontFamily: FONT, fontSize: 12, color: "#475569", marginTop: 16 }}>No credit card required · Set up in under 5 minutes</p>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: "48px 24px 36px", borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.15)"
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 40, marginBottom: 40 }}>
            {/* Brand */}
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ background: C.accent, borderRadius: 10, padding: 8, display: "flex" }}><HardHat size={18} color="#fff" /></div>
                <span style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>BuildTrack</span>
              </div>
              <p style={{ fontFamily: FONT, fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.65 }}>
                Construction progress management platform. Digitise daily reports, track costs, manage materials.
              </p>
            </div>
            {/* Links */}
            <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
              {[
                { title: "Product", links: ["Features", "Analytics", "Reports", "Materials"] },
                { title: "Company", links: ["About", "GitHub", "Contact", "Blog"] },
              ].map(col => (
                <div key={col.title}>
                  <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#94A3B8", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{col.title}</p>
                  {col.links.map(l => (
                    <p key={l} style={{ margin: "0 0 8px" }}>
                      <a href="#" style={{ fontFamily: FONT, fontSize: 13, color: "#64748B", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => e.target.style.color = "#fff"}
                        onMouseLeave={e => e.target.style.color = "#64748B"}
                      >{l}</a>
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
          }}>
            <p style={{ fontFamily: FONT, fontSize: 12, color: "#475569", margin: 0 }}>© 2026 BuildTrack — Built by Tarun Rawat</p>
            <p style={{ fontFamily: FONT, fontSize: 12, color: "#475569", margin: 0 }}>React · Vite · Supabase</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Authentication
// FIX (March 2026): Validation now runs BEFORE setLoading(true) to prevent
// the permanent loading deadlock that occurred when early returns bypassed
// the finally block. Pattern: validate → setLoading → async call.
// ─────────────────────────────────────────────────────────────────────────────

const Auth = ({ onSuccess }) => {
  const [tab,     setTab]     = useState("signin")
  const [email,   setEmail]   = useState("")
  const [pass,    setPass]    = useState("")
  const [name,    setName]    = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState(false)

  const handle = async () => {
    setError("")
    // Validate all fields before setting loading state (prevents deadlock)
    if (!email || !pass) return setError("Please fill in all fields.")
    if (tab === "signup" && !name) return setError("Please enter your name.")
    setLoading(true)
    try {
      if (tab === "signin") {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (e) throw e
        onSuccess(data.user)
      } else {
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
                <button key={t} onClick={() => { setTab(t); setError("") }} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                  cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 700,
                  background: tab === t ? C.card : "transparent",
                  color: tab === t ? C.text : C.textMuted,
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s"
                }}>
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Dashboard
// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = ({ user, setPage, projects, reports }) => {
  const now         = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  const totalBudget = projects.reduce((s, p) => s + (p.total_cost  || 0), 0)
  const totalSpent  = projects.reduce((s, p) => s + (p.total_spent || 0), 0)
  const delayed     = projects.filter(p => p.status === "delayed").length

  const quickActions = [
    { label: "New Project",   icon: FolderOpen, page: "projects",     bg: C.info    },
    { label: "Submit DPR",    icon: FileText,   page: "submit-dpr",   bg: C.accent  },
    { label: "Labour Register", icon: Wrench,   page: "labour",       bg: "#8B5CF6" },
    { label: "View Reports",  icon: BarChart2,  page: "reports",      bg: C.success },
    { label: "Materials",     icon: Package,    page: "materials",    bg: "#0369A1" },
    { label: "Financials",    icon: DollarSign, page: "financials",   bg: C.warning },
  ]

  return (
    <div style={{ padding: 28 }}>
      {/* Welcome banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.sidebar} 0%, ${C.navy} 100%)`,
        borderRadius: 16, padding: "28px 32px", marginBottom: 28,
        color: "#fff", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 160, height: 160, background: C.accent + "15", borderRadius: "50%" }} />
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#94A3B8", margin: "0 0 6px" }}>Welcome back</p>
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 800, margin: "0 0 6px", letterSpacing: "0.02em" }}>
          {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
        </h2>
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#64748B", margin: 0 }}>Last sign in: {now}</p>
      </div>

      {/* KPI summary row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <KPICard label="Total Projects" value={projects.length}       sub="in your account"         icon={FolderOpen}    accent={C.info}    />
        <KPICard label="Total Budget"   value={fmt(totalBudget)}      sub="across all projects"     icon={DollarSign}    accent={C.success}  />
        <KPICard label="Total Spent"    value={fmt(totalSpent)}        sub={`${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of budget`} icon={TrendingUp} accent={C.accent} />
        <KPICard label="Total Reports"  value={reports.length}         sub="DPRs submitted"          icon={FileText}      accent={C.warning}  />
        <KPICard label="Delayed"        value={delayed}                sub="projects behind schedule" icon={AlertTriangle} accent={C.danger}   />
      </div>

      {/* Quick actions */}
      <div>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.textMuted, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {quickActions.map(({ label, icon: Icon, page, bg }) => (
            <button key={label} onClick={() => setPage(page)} style={{
              background: bg, borderRadius: 12, padding: "20px 16px",
              border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              transition: "transform 0.15s, box-shadow 0.15s"
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none";             e.currentTarget.style.boxShadow = "none" }}>
              <Icon size={24} color="#fff" />
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#fff" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — Satellite Map (Leaflet + Esri World Imagery)
// Renders a read-only map pin for a saved project location.
// ─────────────────────────────────────────────────────────────────────────────

const SatelliteMap = ({ lat, lng, projectName, height = 340 }) => {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)

  useEffect(() => {
    if (!lat || !lng) return
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return
      const map = L.map(containerRef.current).setView([parseFloat(lat), parseFloat(lng)], 17)
      mapRef.current = map
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri", maxZoom: 19
      }).addTo(map)
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — Location Picker (interactive map for project forms)
// Supports text search via Nominatim and drag-to-reposition.
// ─────────────────────────────────────────────────────────────────────────────

const LocationPicker = ({ lat, lng, onChange }) => {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markerRef    = useRef(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching,   setSearching]   = useState(false)
  const [searchError, setSearchError] = useState("")

  useEffect(() => {
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return
      const hasCoords = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))
      const center    = hasCoords ? [parseFloat(lat), parseFloat(lng)] : [20.5937, 78.9629]
      const zoom      = hasCoords ? 15 : 5
      const map       = L.map(containerRef.current).setView(center, zoom)
      mapRef.current  = map
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
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true); setSearchError("")
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "BuildTrack/1.0" } }
      )
      const data = await res.json()
      if (!data.length) { setSearchError("Location not found. Try a more specific name."); setSearching(false); return }
      const { lat: lt, lon: lg } = data[0]
      if (mapRef.current) {
        mapRef.current.setView([parseFloat(lt), parseFloat(lg)], 16)
        const L    = window.L
        const icon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#F97316;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
          iconSize: [18, 18], iconAnchor: [9, 9], className: ""
        })
        if (markerRef.current) {
          markerRef.current.setLatLng([parseFloat(lt), parseFloat(lg)])
        } else {
          markerRef.current = L.marker([parseFloat(lt), parseFloat(lg)], { icon, draggable: true }).addTo(mapRef.current)
          markerRef.current.on("dragend", e => {
            const p = e.target.getLatLng()
            onChange(p.lat.toFixed(6), p.lng.toFixed(6))
          })
        }
        onChange(parseFloat(lt).toFixed(6), parseFloat(lg).toFixed(6))
      }
    } catch { setSearchError("Search failed. Check your connection and try again.") }
    setSearching(false)
  }

  return (
    <div>
      <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
        Site Location
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input type="text" value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSearchError("") }}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Search location e.g. Srinagar Garhwal, Uttarakhand"
          style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: C.text, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", outline: "none" }}
        />
        <button onClick={handleSearch} disabled={searching} style={{
          background: C.accent, color: "#fff", border: "none", borderRadius: 8,
          padding: "9px 16px", fontFamily: FONT, fontSize: 13, fontWeight: 600,
          cursor: "pointer", whiteSpace: "nowrap", opacity: searching ? 0.7 : 1
        }}>
          {searching ? "Searching..." : "Search"}
        </button>
      </div>
      {searchError && <p style={{ fontFamily: FONT, fontSize: 12, color: C.danger, margin: "0 0 6px" }}>{searchError}</p>}
      <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "0 0 6px" }}>Or click directly on the map to drop a pin</p>
      <div ref={containerRef} style={{ width: "100%", height: 260, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }} />
      {lat && lng && !isNaN(parseFloat(lat)) && (
        <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "5px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} /> {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Projects
// ─────────────────────────────────────────────────────────────────────────────

const Projects = ({ user, projects, setProjects, notifications, onMarkAllRead, onCardClick }) => {
  const [showModal, setShowModal] = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({ name: "", start_date: "", target_end_date: "", total_cost: "", area_of_site: "", latitude: "", longitude: "", status: "active" })

  const pct      = p => p.total_cost > 0 ? Math.round(((p.total_spent || 0) / p.total_cost) * 100) : 0
  const openCreate = () => { setEditId(null); setForm({ name: "", start_date: "", target_end_date: "", total_cost: "", area_of_site: "", latitude: "", longitude: "", status: "active" }); setShowModal(true) }
  const openEdit   = p  => { setEditId(p.id); setForm({ name: p.name, start_date: p.start_date || "", target_end_date: p.target_end_date || "", total_cost: p.total_cost || "", area_of_site: p.area_of_site || "", latitude: p.latitude || "", longitude: p.longitude || "", status: p.status }); setShowModal(true) }

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
    const { error } = await supabase.from("projects").delete().eq("id", id)
    if (!error) setProjects(ps => ps.filter(p => p.id !== id))
    else alert("Delete failed: " + error.message)
  }

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Projects" subtitle={`${projects.length} total`} notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={<Btn onClick={openCreate} icon={Plus}>New Project</Btn>} />
      {projects.length === 0
        ? <Empty message="No projects yet" sub="Click New Project to create your first one" />
        : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18, marginTop: 24 }}>
            {projects.map(p => {
              const pctVal = pct(p)
              return (
                <div key={p.id}
                  className="card-hover"
                  style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer" }}
                  onClick={() => onCardClick && onCardClick(p.id)}>
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
                      {p.start_date      && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} />{p.start_date}</span>}
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
                      <div><p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Total Budget</p><p style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text,   margin: 0 }}>{fmt(p.total_cost)}</p></div>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              <Input label="Start Date"      type="date"   value={form.start_date}      onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              <Input label="Target End Date" type="date"   value={form.target_end_date} onChange={e => setForm(f => ({ ...f, target_end_date: e.target.value }))} />
              <Input label="Total Budget (₹)" type="number" value={form.total_cost}     onChange={e => setForm(f => ({ ...f, total_cost: e.target.value }))}    placeholder="0" />
              <Input label="Site Area (sqft)" type="number" value={form.area_of_site}   onChange={e => setForm(f => ({ ...f, area_of_site: e.target.value }))}  placeholder="0" />
            </div>
            <LocationPicker lat={form.latitude} lng={form.longitude} onChange={(lt, lg) => setForm(f => ({ ...f, latitude: lt, longitude: lg }))} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[{ value: "active", label: "Active" }, { value: "delayed", label: "Delayed" }, { value: "on_hold", label: "On Hold" }, { value: "completed", label: "Completed" }]} />
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Submit DPR (Daily Progress Report)
//
// IMPORTANT: total_cost is a PostgreSQL GENERATED ALWAYS column.
// It must NOT be included in the INSERT payload. The database computes it
// automatically from the five cost component columns. The live total
// displayed in the form footer is for UX purposes only.
// ─────────────────────────────────────────────────────────────────────────────

const WEATHER_OPTIONS = ["", "Sunny", "Cloudy", "Rainy", "Windy", "Foggy"]

/** Floor options for the DPR cascading dropdown. */
const FLOORS = ["", "Layout / Drawings", "Ground Floor", "First Floor", "Other Floors"]

/** Stage options keyed by selected floor value. */
const STAGES_BY_FLOOR = {
  "Layout / Drawings": [
    "Site Plan", "Footing Layout", "Column Layout",
    "Floor Plan (Ground)", "Floor Plan (First)", "Floor Plan (Other)",
    "Brick Work Layout", "Door & Window Layout", "Electrical Layout", "Plumbing Layout",
  ],
  "Ground Floor": [
    "Site Preparation", "Excavation", "Foundation Work", "Plinth Work",
    "Superstructure Work", "Roof Work", "Flooring Work", "Plastering",
    "Door & Window Work", "Electrical & Plumbing Work", "Painting & Finishing Work",
  ],
  "First Floor": [
    "Plinth Work", "Superstructure Work", "Roof Work", "Flooring Work",
    "Plastering", "Door & Window Work", "Electrical & Plumbing Work", "Painting & Finishing Work",
  ],
  "Other Floors": [
    "Plinth Work", "Superstructure Work", "Roof Work", "Flooring Work",
    "Plastering", "Door & Window Work", "Electrical & Plumbing Work", "Painting & Finishing Work",
  ],
}

const SubmitDPR = ({ user, projects, setReports, notifications, onMarkAllRead }) => {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({
    project_id: "", report_date: today, weather: "", floor: "", stage: "",
    manpower_count: "", machinery_used: "", work_completed: "", materials_used: "",
    safety_incidents: "", remarks: "",
    labor_cost: "0", material_cost: "0", equipment_cost: "0", subcontractor_cost: "0", other_cost: "0"
  })
  const [submittedReport, setSubmittedReport] = useState(null)
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState("")
  const [photoFiles,      setPhotoFiles]      = useState([])
  const [photoUploading,  setPhotoUploading]  = useState(false)

  /** Live cost total — mirrors what the DB generated column will compute. */
  const liveTotal = ["labor_cost", "material_cost", "equipment_cost", "subcontractor_cost", "other_cost"]
    .reduce((s, k) => s + (parseFloat(form[k]) || 0), 0)

  const stages = form.floor ? STAGES_BY_FLOOR[form.floor] || [] : []

  const handleSubmit = async () => {
    setError("")
    if (!form.project_id || !form.report_date || !form.floor || !form.stage)
      return setError("Please fill in Project, Date, Floor and Stage.")
    setSaving(true)

    const payload = {
      project_id:        form.project_id,
      user_id:           user.id,
      report_date:       form.report_date,
      weather:           form.weather || null,
      manpower_count:    parseInt(form.manpower_count) || 0,
      stage:             form.stage,
      floor:             form.floor,
      work_completed:    form.work_completed    || null,
      machinery_used:    form.machinery_used    || null,
      materials_used:    form.materials_used    || null,
      safety_incidents:  form.safety_incidents  || null,
      remarks:           form.remarks           || null,
      labor_cost:        parseFloat(form.labor_cost)        || 0,
      material_cost:     parseFloat(form.material_cost)     || 0,
      equipment_cost:    parseFloat(form.equipment_cost)    || 0,
      subcontractor_cost:parseFloat(form.subcontractor_cost)|| 0,
      other_cost:        parseFloat(form.other_cost)        || 0,
      // total_cost deliberately omitted — GENERATED ALWAYS column
    }

    const { data, error: e } = await supabase
      .from("daily_reports").insert(payload).select("*, projects(name)").single()
    if (e) { setError(e.message); setSaving(false); return }

    // Upload site photos if provided
    if (photoFiles.length > 0) {
      setPhotoUploading(true)
      for (const file of photoFiles) {
        const ext        = file.name.split(".").pop()
        const uniqueName = `${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`
        const filePath   = `${form.project_id}/${data.id}/${uniqueName}`
        const { error: upErr } = await supabase.storage.from("dpr-photos").upload(filePath, file)
        if (!upErr) {
          const { data: urlData } = await supabase.storage.from("dpr-photos").createSignedUrl(filePath, 86400)
          await supabase.from("dpr_photos").insert({
            daily_report_id: data.id, project_id: form.project_id, user_id: user.id,
            file_name: file.name, file_path: filePath,
            public_url: urlData?.signedUrl || null, file_size: file.size, mime_type: file.type,
          })
        }
      }
      setPhotoUploading(false)
    }

    setReports(rs => [data, ...rs])
    setSubmittedReport(data)
    setSaving(false)
  }

  const handleReset = () => {
    setSubmittedReport(null); setPhotoFiles([])
    setForm({ project_id: "", report_date: today, weather: "", floor: "", stage: "", manpower_count: "", machinery_used: "", work_completed: "", materials_used: "", safety_incidents: "", remarks: "", labor_cost: "0", material_cost: "0", equipment_cost: "0", subcontractor_cost: "0", other_cost: "0" })
  }

  if (submittedReport) return (
    <div style={{ padding: 28 }}>
      <TopBar title="Submit DPR" notifications={notifications} onMarkAllRead={onMarkAllRead} />
      <div style={{ background: C.card, borderRadius: 16, padding: 48, textAlign: "center", marginTop: 24 }}>
        <CheckCircle size={56} color={C.success} style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 26, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Report Submitted</h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.textMuted, margin: "0 0 24px" }}>
          Daily progress report for <strong>{submittedReport.projects?.name}</strong> saved successfully.
        </p>
        <div style={{ background: C.accentLight, border: `1px solid ${C.accent}40`, borderRadius: 12, padding: "16px 28px", display: "inline-block", marginBottom: 28 }}>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Total Cost Recorded</p>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 32, fontWeight: 800, color: C.accent, margin: 0 }}>{fmt(submittedReport.total_cost)}</p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "4px 0 0" }}>Confirmed by database · contributes to project financials</p>
        </div>
        <div><Btn onClick={handleReset}>Submit Another Report</Btn></div>
      </div>
    </div>
  )

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v, ...(k === "floor" ? { stage: "" } : {}) }))

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Submit Daily Progress Report" notifications={notifications} onMarkAllRead={onMarkAllRead} />
      <div style={{ background: C.card, borderRadius: 16, padding: 28, marginTop: 24, border: `1px solid ${C.border}` }}>
        {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, marginBottom: 20 }}>{error}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 18 }}>
          <Select label="Project" value={form.project_id} onChange={e => f("project_id", e.target.value)} required options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
          <Input  label="Date"    type="date" value={form.report_date} onChange={e => f("report_date", e.target.value)} required />
          <Select label="Weather" value={form.weather} onChange={e => f("weather", e.target.value)} options={WEATHER_OPTIONS.map(w => ({ value: w, label: w || "Select Weather" }))} />
          <Input  label="Manpower Count" type="number" value={form.manpower_count} onChange={e => f("manpower_count", e.target.value)} placeholder="0" />
          <Select label="Floor"   value={form.floor} onChange={e => f("floor", e.target.value)} required options={FLOORS.map(fl => ({ value: fl, label: fl || "Select Floor" }))} />
          <Select label="Stage"   value={form.stage} onChange={e => f("stage", e.target.value)} required options={[{ value: "", label: "Select Stage" }, ...stages.map(s => ({ value: s, label: s }))]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 18 }}>
          <Input label="Work Completed"  value={form.work_completed}  onChange={e => f("work_completed",  e.target.value)} placeholder="Describe work done today" />
          <Input label="Machinery Used"  value={form.machinery_used}  onChange={e => f("machinery_used",  e.target.value)} placeholder="e.g. Excavator, Transit Mixer" />
          <Input label="Materials Used"  value={form.materials_used}  onChange={e => f("materials_used",  e.target.value)} placeholder="e.g. 120 bags cement, 2T TMT" />
          <Input label="Safety Incidents" value={form.safety_incidents} onChange={e => f("safety_incidents", e.target.value)} placeholder="None / describe if any" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <Input label="Remarks" value={form.remarks} onChange={e => f("remarks", e.target.value)} placeholder="Any additional notes for today" />
        </div>

        {/* Cost breakdown */}
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, marginBottom: 24 }}>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost Breakdown</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14 }}>
            {[["labor_cost","Labor"],["material_cost","Material"],["equipment_cost","Equipment"],["subcontractor_cost","Subcontractor"],["other_cost","Other"]].map(([k, label]) => (
              <Input key={k} label={label} type="number" value={form[k]} onChange={e => f(k, e.target.value)} placeholder="0" />
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: FONT, fontSize: 14, color: C.textMuted, fontWeight: 600 }}>Total Cost Today:</span>
            <span style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.accent }}>{fmt(liveTotal)}</span>
          </div>
        </div>

        {/* Site photos */}
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, marginBottom: 24 }}>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Site Photos</h3>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: "0 0 16px" }}>Optional · up to 5 images · JPEG, PNG, WebP or HEIC · max 5MB each</p>
          {photoFiles.length === 0 ? (
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: `2px dashed ${C.border}`, borderRadius: 10, padding: "28px 20px", cursor: "pointer", background: "#fff" }}>
              <Camera size={28} color={C.textLight} />
              <span style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, fontWeight: 500 }}>Click to select photos</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple style={{ display: "none" }}
                onChange={e => setPhotoFiles(Array.from(e.target.files).slice(0, 5))} />
            </label>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                {photoFiles.map((pf, i) => (
                  <div key={i} style={{ position: "relative", width: 90, height: 90, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <img src={URL.createObjectURL(pf)} alt={pf.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => setPhotoFiles(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <X size={11} color="#fff" />
                    </button>
                  </div>
                ))}
                {photoFiles.length < 5 && (
                  <label style={{ width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.border}`, borderRadius: 8, cursor: "pointer", flexShrink: 0, background: "#fff" }}>
                    <Plus size={20} color={C.textLight} />
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple style={{ display: "none" }}
                      onChange={e => setPhotoFiles(prev => [...prev, ...Array.from(e.target.files)].slice(0, 5))} />
                  </label>
                )}
              </div>
              <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{photoFiles.length} photo{photoFiles.length !== 1 ? "s" : ""} selected</span>
            </div>
          )}
        </div>

        {/* ── Sticky submit bar ─────────────────────────────────────── */}
        <div style={{
          position: "sticky", bottom: 0, zIndex: 50,
          background: C.card, borderTop: `1px solid ${C.border}`,
          padding: "16px 0 env(safe-area-inset-bottom, 16px)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 8
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Total:</span>
            <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 800, color: C.accent }}>{fmt(liveTotal)}</span>
          </div>
          <Btn onClick={handleSubmit} disabled={saving || photoUploading} size="lg" icon={CheckCircle}>
            {photoUploading ? "Uploading..." : saving ? "Submitting..." : "Submit Report"}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT — Photos Tab (used inside Reports page)
// Renders DPR-linked photos and the standalone project gallery.
// Only site engineers see the standalone upload button.
// ─────────────────────────────────────────────────────────────────────────────

const PhotosTab = ({ user, userRole, projects, projFilter }) => {
  const [dprPhotos,     setDprPhotos]     = useState([])
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [galleryFiles,  setGalleryFiles]  = useState([])
  const [galleryProject,setGalleryProject]= useState("")
  const [galleryCaption,setGalleryCaption]= useState("")
  const [uploading,     setUploading]     = useState(false)
  const [lightbox,      setLightbox]      = useState(null)

  const isSiteEngineer = userRole === "site_engineer"

  /** Refreshes signed URLs for all photo records in a given storage bucket. */
  const signUrls = async (bucket, rows) =>
    Promise.all(rows.map(async row => {
      if (!row.file_path) return row
      const { data } = await supabase.storage.from(bucket).createSignedUrl(row.file_path, 3600)
      return { ...row, signed_url: data?.signedUrl || null }
    }))

  const load = async () => {
    setLoading(true)
    const projectIds = projFilter === "All Projects" ? projects.map(p => p.id) : [projFilter]
    if (projectIds.length === 0) { setLoading(false); return }
    const [{ data: dp }, { data: gp }] = await Promise.all([
      supabase.from("dpr_photos").select("*, daily_reports(report_date)").in("project_id", projectIds).order("created_at", { ascending: false }),
      supabase.from("project_photos").select("*, profiles(full_name)").in("project_id", projectIds).order("created_at", { ascending: false }),
    ])
    const [signedDpr, signedGallery] = await Promise.all([signUrls("dpr-photos", dp || []), signUrls("project-gallery", gp || [])])
    setDprPhotos(signedDpr); setGalleryPhotos(signedGallery)
    setLoading(false)
  }

  useEffect(() => { load() }, [projFilter])

  const handleGalleryUpload = async () => {
    if (!galleryProject || galleryFiles.length === 0) return
    setUploading(true)
    for (const file of galleryFiles) {
      const ext        = file.name.split(".").pop()
      const uniqueName = `${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`
      const filePath   = `${galleryProject}/${uniqueName}`
      const { error: upErr } = await supabase.storage.from("project-gallery").upload(filePath, file)
      if (!upErr) {
        const { data: urlData } = await supabase.storage.from("project-gallery").createSignedUrl(filePath, 3600)
        await supabase.from("project_photos").insert({ project_id: galleryProject, user_id: user.id, file_name: file.name, file_path: filePath, public_url: urlData?.signedUrl || null, caption: galleryCaption || null, file_size: file.size, mime_type: file.type })
      }
    }
    setUploading(false); setShowUploadModal(false)
    setGalleryFiles([]); setGalleryProject(""); setGalleryCaption("")
    load()
  }

  const PhotoGrid = ({ photos, emptyMsg }) => {
    if (photos.length === 0) return <Empty message={emptyMsg} />
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {photos.map(ph => (
          <div key={ph.id} onClick={() => setLightbox({ url: ph.signed_url, caption: ph.caption || ph.file_name })}
            style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", background: "#F8FAFC" }}>
            {ph.signed_url
              ? <img src={ph.signed_url} alt={ph.file_name} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              : <div style={{ width: "100%", height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={24} color={C.textLight} /></div>}
            <div style={{ padding: "8px 10px" }}>
              <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ph.caption || ph.daily_reports?.report_date || ph.file_name}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>DPR Photos</h3>
        <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: "0 0 16px" }}>Photos attached to Daily Progress Reports</p>
        <PhotoGrid photos={dprPhotos} emptyMsg="No DPR photos yet" />
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Project Gallery</h3>
            <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>Standalone site photos not tied to a specific DPR</p>
          </div>
          {isSiteEngineer && <Btn icon={Camera} size="sm" onClick={() => setShowUploadModal(true)}>Upload Photos</Btn>}
        </div>
        <PhotoGrid photos={galleryPhotos} emptyMsg="No gallery photos yet" />
      </div>

      {/* Full-screen lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: 860, width: "100%" }}>
            <img src={lightbox.url} alt={lightbox.caption} style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12 }} />
            {lightbox.caption && <p style={{ fontFamily: FONT, fontSize: 13, color: "#E2E8F0", textAlign: "center", marginTop: 12 }}>{lightbox.caption}</p>}
            <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: -12, right: -12, background: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              <X size={16} color={C.text} />
            </button>
          </div>
        </div>
      )}

      {/* Gallery upload modal */}
      {showUploadModal && (
        <Modal title="Upload Site Photos" onClose={() => { setShowUploadModal(false); setGalleryFiles([]) }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Select label="Project" required value={galleryProject} onChange={e => setGalleryProject(e.target.value)}
              options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            <div>
              <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                Photos <span style={{ color: C.danger }}>*</span>
              </label>
              {galleryFiles.length === 0 ? (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: `2px dashed ${C.border}`, borderRadius: 10, padding: "24px 20px", cursor: "pointer", background: "#F8FAFC" }}>
                  <Upload size={24} color={C.textLight} />
                  <span style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted }}>Click to select up to 5 photos</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple style={{ display: "none" }}
                    onChange={e => setGalleryFiles(Array.from(e.target.files).slice(0, 5))} />
                </label>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {galleryFiles.map((f, i) => (
                      <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => setGalleryFiles(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <X size={10} color="#fff" />
                        </button>
                      </div>
                    ))}
                    {galleryFiles.length < 5 && (
                      <label style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.border}`, borderRadius: 8, cursor: "pointer", background: "#F8FAFC" }}>
                        <Plus size={18} color={C.textLight} />
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple style={{ display: "none" }}
                          onChange={e => setGalleryFiles(prev => [...prev, ...Array.from(e.target.files)].slice(0, 5))} />
                      </label>
                    )}
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{galleryFiles.length} photo{galleryFiles.length !== 1 ? "s" : ""} selected</span>
                </div>
              )}
            </div>
            <Input label="Caption (optional)" value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} placeholder="e.g. Foundation work completed" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => { setShowUploadModal(false); setGalleryFiles([]) }}>Cancel</Btn>
              <Btn icon={Upload} disabled={uploading || !galleryProject || galleryFiles.length === 0} onClick={handleGalleryUpload}>{uploading ? "Uploading..." : "Upload"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Reports
// ─────────────────────────────────────────────────────────────────────────────

const Reports = ({ user, userRole, projects, reports, notifications, onMarkAllRead }) => {
  const [tab,        setTab]        = useState("Overview")
  const [projFilter, setProjFilter] = useState("All Projects")

  const filteredReports = projFilter === "All Projects" ? reports : reports.filter(r => r.project_id === projFilter)
  const totalSpent   = reports.reduce((s, r) => s + (r.total_cost    || 0), 0)
  const totalBudget  = projects.reduce((s, p) => s + (p.total_cost   || 0), 0)
  const avgManpower  = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + (r.manpower_count || 0), 0) / reports.length) : 0
  const delayed      = projects.filter(p => p.status === "delayed").length

  const costTrend = Object.values(
    reports.reduce((acc, r) => {
      const key = r.report_date?.slice(0, 7)
      if (!key) return acc
      if (!acc[key]) acc[key] = { date: key, cost: 0 }
      acc[key].cost += r.total_cost || 0
      return acc
    }, {})
  ).sort((a, b) => a.date.localeCompare(b.date)).slice(-6)
   .map(d => ({ ...d, date: new Date(d.date + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) }))

  const manpowerTrend = reports.slice(0, 10).reverse().map(r => ({ date: r.report_date?.slice(5), manpower: r.manpower_count || 0, cost: r.total_cost || 0 }))
  const budgetVsActual = projects.map(p => ({ project: p.name.split(" ").slice(0, 2).join(" "), budget: p.total_cost || 0, spent: p.total_spent || 0 }))

  const costCats = [
    { name: "Labor",         value: reports.reduce((s, r) => s + (r.labor_cost        || 0), 0), color: C.accent  },
    { name: "Materials",     value: reports.reduce((s, r) => s + (r.material_cost     || 0), 0), color: C.info    },
    { name: "Equipment",     value: reports.reduce((s, r) => s + (r.equipment_cost    || 0), 0), color: C.success },
    { name: "Subcontractor", value: reports.reduce((s, r) => s + (r.subcontractor_cost|| 0), 0), color: C.warning },
    { name: "Other",         value: reports.reduce((s, r) => s + (r.other_cost        || 0), 0), color: C.charcoal},
  ]

  /**
   * Stage tracker data — three groups matching the DPR floor/stage taxonomy.
   * Each stage's progress bar is proportional to its DPR count vs the
   * maximum count across all stages (relative activity metric).
   */
  const STAGES_DATA = {
    "Layout / Plan / Drawings": [
      "Site Plan", "Footing Layout", "Column Layout",
      "Floor Plan (Ground)", "Floor Plan (First)", "Floor Plan (Other)",
      "Brick Work Layout", "Door & Window Layout", "Electrical Layout", "Plumbing Layout",
    ],
    "Execution — Ground Floor": [
      "Site Preparation", "Excavation", "Foundation Work", "Plinth Work",
      "Superstructure Work", "Roof Work", "Flooring Work", "Plastering",
      "Door & Window Work", "Electrical & Plumbing Work", "Painting & Finishing Work",
    ],
    "Execution — First / Other Floors": [
      "Plinth Work", "Superstructure Work", "Roof Work", "Flooring Work",
      "Plastering", "Door & Window Work", "Electrical & Plumbing Work", "Painting & Finishing Work",
    ],
  }

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Reports" subtitle={`${reports.length} DPRs submitted`} notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" icon={Download} size="sm" onClick={() => downloadPDF(reports, projects)}>PDF</Btn>
            <Btn variant="secondary" icon={Download} size="sm" onClick={() => downloadCSV(reports)}>Excel</Btn>
          </div>
        } />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24, marginBottom: 24 }}>
        <KPICard label="Total Spent"  value={fmt(totalSpent)} sub={`of ${fmt(totalBudget)} budget`} icon={DollarSign}    accent={C.accent}  />
        <KPICard label="Reports"      value={reports.length}  sub="daily reports"                   icon={FileText}      accent={C.info}    />
        <KPICard label="Avg Manpower" value={avgManpower}     sub="per day"                         icon={Users}         accent={C.success} />
        <KPICard label="Delayed"      value={delayed}         sub="projects"                        icon={AlertTriangle} accent={C.danger}  />
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
                  <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC" }}>{["Date","Project","Stage","Floor","Weather","Manpower","Total Cost","Remarks"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredReports.map(r => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td data-label="Date" style={{ padding: "10px 14px", color: C.text }}>{r.report_date}</td>
                          <td data-label="Project" style={{ padding: "10px 14px", color: C.text, fontWeight: 600 }}>{r.projects?.name || "—"}</td>
                          <td data-label="Stage" style={{ padding: "10px 14px", color: C.text }}>{r.stage}</td>
                          <td data-label="Floor" style={{ padding: "10px 14px", color: C.text }}>{r.floor}</td>
                          <td data-label="Weather" style={{ padding: "10px 14px" }}><div style={{ display: "flex", alignItems: "center", gap: 4 }}><WeatherIcon w={r.weather} />{r.weather || "—"}</div></td>
                          <td data-label="Manpower" style={{ padding: "10px 14px", color: C.text, textAlign: "center" }}>{r.manpower_count}</td>
                          <td data-label="Total Cost" style={{ padding: "10px 14px", fontWeight: 700, color: C.accent }}>{fmt(r.total_cost)}</td>
                          <td data-label="Remarks" style={{ padding: "10px 14px", color: C.textMuted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === "Photos" && (
            <PhotosTab user={user} userRole={userRole} projects={projects} projFilter={projFilter} />
          )}
          {tab === "Stages" && (() => {
            const allStages = Object.values(STAGES_DATA).flat()
            const countMap  = Object.fromEntries(allStages.map(s => [s, reports.filter(r => r.stage === s).length]))
            const maxCount  = Math.max(1, ...Object.values(countMap))
            return (
              <div>
                {Object.entries(STAGES_DATA).map(([group, stages]) => (
                  <div key={group} style={{ marginBottom: 36 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${C.accent}` }}>
                      <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.navy, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{group}</h3>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{stages.filter(s => countMap[s] > 0).length}/{stages.length} stages active</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                      {stages.map(stage => {
                        const count    = countMap[stage] || 0
                        const pct      = Math.round((count / maxCount) * 100)
                        const barColor = count === 0 ? C.border : pct >= 60 ? C.success : C.accent
                        return (
                          <div key={stage} style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: `1px solid ${count > 0 ? C.accent + "40" : C.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                              <span style={{ fontFamily: FONT, fontSize: 13, color: C.text, fontWeight: 600 }}>{stage}</span>
                              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: count > 0 ? C.success : C.textLight }}>
                                {count > 0 ? `${count} DPR${count > 1 ? "s" : ""}` : "0 DPRs"}
                              </span>
                            </div>
                            <div style={{ background: "#E2E8F0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width 0.4s ease" }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Materials & Inventory
// ─────────────────────────────────────────────────────────────────────────────

const Materials = ({ user, projects, notifications, onMarkAllRead }) => {
  const [tab,       setTab]       = useState("Materials")
  const [materials, setMaterials] = useState([])
  const [usage,     setUsage]     = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState("")

  const [matForm,      setMatForm]      = useState({ name: "", category: "", unit: "", cost_per_unit: "", current_stock: "", min_stock_level: "", supplier_name: "", supplier_contact: "" })
  const [usageForm,    setUsageForm]    = useState({ material_id: "", quantity_used: "", project_id: "", usage_date: new Date().toISOString().split("T")[0], notes: "" })
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

  const handleAddMaterial = async () => {
    if (!matForm.name || !matForm.category || !matForm.unit) return
    setSaving(true)
    const { data } = await supabase.from("materials").insert({ ...matForm, user_id: user.id, cost_per_unit: parseFloat(matForm.cost_per_unit) || 0, current_stock: parseFloat(matForm.current_stock) || 0, min_stock_level: parseFloat(matForm.min_stock_level) || 0 }).select().single()
    if (data) setMaterials(ms => [data, ...ms])
    setSaving(false); setShowModal(false)
    setMatForm({ name: "", category: "", unit: "", cost_per_unit: "", current_stock: "", min_stock_level: "", supplier_name: "", supplier_contact: "" })
  }

  const handleAddUsage = async () => {
    if (!usageForm.material_id || !usageForm.quantity_used || !usageForm.usage_date) return
    setSaving(true)
    const { data } = await supabase.from("material_usage").insert({ material_id: usageForm.material_id, project_id: usageForm.project_id || null, user_id: user.id, quantity_used: parseFloat(usageForm.quantity_used), usage_date: usageForm.usage_date, notes: usageForm.notes || null }).select("*, materials(name), projects(name)").single()
    if (data) {
      setUsage(us => [data, ...us])
      const { data: updatedMat } = await supabase.from("materials").select("*").eq("id", usageForm.material_id).single()
      if (updatedMat) setMaterials(ms => ms.map(m => m.id === updatedMat.id ? updatedMat : m))
    }
    setSaving(false); setShowModal(false)
    setUsageForm({ material_id: "", quantity_used: "", project_id: "", usage_date: new Date().toISOString().split("T")[0], notes: "" })
  }

  const handleAddPurchase = async () => {
    if (!purchaseForm.material_id || !purchaseForm.quantity_purchased || !purchaseForm.purchase_date) return
    setSaving(true)
    const qty = parseFloat(purchaseForm.quantity_purchased)
    const cpu = parseFloat(purchaseForm.cost_per_unit) || 0
    const { data } = await supabase.from("material_purchases").insert({ material_id: purchaseForm.material_id, user_id: user.id, quantity_purchased: qty, cost_per_unit: cpu, total_cost: qty * cpu, purchase_date: purchaseForm.purchase_date, supplier_name: purchaseForm.supplier_name || null, invoice_number: purchaseForm.invoice_number || null }).select("*, materials(name)").single()
    if (data) {
      setPurchases(ps => [data, ...ps])
      const { data: updatedMat } = await supabase.from("materials").select("*").eq("id", purchaseForm.material_id).single()
      if (updatedMat) setMaterials(ms => ms.map(m => m.id === updatedMat.id ? updatedMat : m))
    }
    setSaving(false); setShowModal(false)
    setPurchaseForm({ material_id: "", quantity_purchased: "", cost_per_unit: "", supplier_name: "", purchase_date: new Date().toISOString().split("T")[0], invoice_number: "" })
  }

  const ctxButton = { "Materials": { label: "Add Material", action: () => setShowModal(true) }, "Usage Log": { label: "Add Usage", action: () => setShowModal(true) }, "Purchases": { label: "Add Purchase", action: () => setShowModal(true) }, "Analytics": null }[tab]
  const filtered   = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()))
  const totalValue = materials.reduce((s, m) => s + ((m.current_stock || 0) * (m.cost_per_unit || 0)), 0)
  const lowStock   = materials.filter(m => (m.current_stock || 0) < (m.min_stock_level || 0)).length

  const materialOptions = [{ value: "", label: "Select Material" }, ...materials.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))]
  const projectOptions  = [{ value: "", label: "No Project" }, ...(projects || []).map(p => ({ value: p.id, label: p.name }))]

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Materials & Inventory" subtitle={`${materials.length} materials tracked`} notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={ctxButton ? <Btn onClick={ctxButton.action} icon={Plus}>{ctxButton.label}</Btn> : null} />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "24px 0" }}>
        <KPICard label="Total Items"      value={materials.length} sub="in inventory"    icon={Package}       accent={C.info}   />
        <KPICard label="Inventory Value"  value={fmt(totalValue)}  sub="current stock"   icon={DollarSign}    accent={C.success}/>
        <KPICard label="Low Stock"        value={lowStock}         sub="need reorder"    icon={AlertTriangle} accent={lowStock > 0 ? C.danger : C.success} />
      </div>
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <TabBar tabs={["Materials","Usage Log","Purchases","Analytics"]} active={tab} onChange={t => { setTab(t); setShowModal(false) }} />
        <div style={{ padding: 24 }}>
          {loading ? <Spinner /> : (
            <>
              {tab === "Materials" && (
                <div>
                  <div style={{ marginBottom: 16 }}><Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} icon={Search} /></div>
                  {filtered.length === 0 ? <Empty message="No materials found" sub="Add your first material using the button above" /> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                      {filtered.map(m => {
                        const isLow = (m.current_stock || 0) < (m.min_stock_level || 0)
                        return (
                          <div key={m.id} style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px 18px", border: `1px solid ${isLow ? C.danger + "40" : C.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                              <div><p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{m.name}</p><StatusBadge status={m.category} /></div>
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
                  <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC" }}>{["Date","Material","Project","Quantity","Notes"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{usage.map(u => <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}><td data-label="Date" style={{ padding: "10px 14px" }}>{u.usage_date}</td><td data-label="Material" style={{ padding: "10px 14px", fontWeight: 600 }}>{u.materials?.name}</td><td data-label="Project" style={{ padding: "10px 14px" }}>{u.projects?.name || "—"}</td><td data-label="Quantity" style={{ padding: "10px 14px" }}>{u.quantity_used}</td><td data-label="Notes" style={{ padding: "10px 14px", color: C.textMuted }}>{u.notes || "—"}</td></tr>)}</tbody>
                  </table>
                )
              )}
              {tab === "Purchases" && (
                purchases.length === 0 ? <Empty message="No purchases recorded yet" sub="Click Add Purchase to record a procurement" /> : (
                  <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC" }}>{["Date","Material","Qty","Unit Cost","Total","Supplier","Invoice"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{purchases.map(p => <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}><td data-label="Date" style={{ padding: "10px 14px" }}>{p.purchase_date}</td><td data-label="Material" style={{ padding: "10px 14px", fontWeight: 600 }}>{p.materials?.name}</td><td data-label="Qty" style={{ padding: "10px 14px" }}>{p.quantity_purchased}</td><td data-label="Unit Cost" style={{ padding: "10px 14px" }}>₹{p.cost_per_unit}</td><td data-label="Total" style={{ padding: "10px 14px", fontWeight: 700, color: C.success }}>{fmt(p.total_cost)}</td><td data-label="Supplier" style={{ padding: "10px 14px", color: C.textMuted }}>{p.supplier_name || "—"}</td><td data-label="Invoice" style={{ padding: "10px 14px", color: C.textMuted }}>{p.invoice_number || "—"}</td></tr>)}</tbody>
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
      {showModal && tab === "Materials" && (
        <Modal title="Add Material" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Material Name" value={matForm.name} onChange={e => setMatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Portland Cement OPC 53" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Category"       value={matForm.category}      onChange={e => setMatForm(f => ({ ...f, category: e.target.value }))}      required placeholder="e.g. Cement & Concrete" />
              <Input label="Unit"           value={matForm.unit}           onChange={e => setMatForm(f => ({ ...f, unit: e.target.value }))}           required placeholder="e.g. bag, kg, cft" />
              <Input label="Cost per Unit (₹)" type="number" value={matForm.cost_per_unit}   onChange={e => setMatForm(f => ({ ...f, cost_per_unit: e.target.value }))}   placeholder="0" />
              <Input label="Opening Stock"     type="number" value={matForm.current_stock}   onChange={e => setMatForm(f => ({ ...f, current_stock: e.target.value }))}   placeholder="0" />
              <Input label="Min Stock Level"   type="number" value={matForm.min_stock_level} onChange={e => setMatForm(f => ({ ...f, min_stock_level: e.target.value }))} placeholder="0" />
              <Input label="Supplier Name"  value={matForm.supplier_name}  onChange={e => setMatForm(f => ({ ...f, supplier_name: e.target.value }))}  placeholder="Optional" />
            </div>
            <Input label="Supplier Contact" value={matForm.supplier_contact} onChange={e => setMatForm(f => ({ ...f, supplier_contact: e.target.value }))} placeholder="Phone or email" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn onClick={handleAddMaterial} disabled={saving}>{saving ? "Saving..." : "Add Material"}</Btn>
            </div>
          </div>
        </Modal>
      )}
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
      {showModal && tab === "Purchases" && (
        <Modal title="Add Purchase" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Select label="Material" value={purchaseForm.material_id} onChange={e => setPurchaseForm(f => ({ ...f, material_id: e.target.value }))} required options={materialOptions} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Quantity Purchased" type="number" value={purchaseForm.quantity_purchased} onChange={e => setPurchaseForm(f => ({ ...f, quantity_purchased: e.target.value }))} required placeholder="0" />
              <Input label="Cost per Unit (₹)"  type="number" value={purchaseForm.cost_per_unit}      onChange={e => setPurchaseForm(f => ({ ...f, cost_per_unit: e.target.value }))}      placeholder="0" />
              <Input label="Supplier"            value={purchaseForm.supplier_name}   onChange={e => setPurchaseForm(f => ({ ...f, supplier_name: e.target.value }))}   placeholder="Supplier name" />
              <Input label="Invoice No."         value={purchaseForm.invoice_number}  onChange={e => setPurchaseForm(f => ({ ...f, invoice_number: e.target.value }))}  placeholder="Optional" />
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Financial Dashboard
// ─────────────────────────────────────────────────────────────────────────────

const Financials = ({ projects, reports, notifications, onMarkAllRead }) => {
  const [tab, setTab] = useState("Overview")
  const totalBudget = projects.reduce((s, p) => s + (p.total_cost  || 0), 0)
  const totalSpent  = projects.reduce((s, p) => s + (p.total_spent || 0), 0)
  const remaining   = totalBudget - totalSpent

  const costCats = [
    { name: "Labor",         value: reports.reduce((s, r) => s + (r.labor_cost        || 0), 0), color: C.accent   },
    { name: "Materials",     value: reports.reduce((s, r) => s + (r.material_cost     || 0), 0), color: C.info     },
    { name: "Equipment",     value: reports.reduce((s, r) => s + (r.equipment_cost    || 0), 0), color: C.success  },
    { name: "Subcontractor", value: reports.reduce((s, r) => s + (r.subcontractor_cost|| 0), 0), color: C.warning  },
    { name: "Other",         value: reports.reduce((s, r) => s + (r.other_cost        || 0), 0), color: C.charcoal },
  ]

  const monthlyTrend = Object.values(
    reports.reduce((acc, r) => {
      const key = r.report_date?.slice(0, 7)
      if (!key) return acc
      if (!acc[key]) acc[key] = { month: key, spend: 0 }
      acc[key].spend += r.total_cost || 0
      return acc
    }, {})
  ).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
   .map(d => ({ ...d, month: new Date(d.month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) }))

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Financial Dashboard" subtitle="Budget tracking & cost analysis" notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={<Btn variant="secondary" icon={Download} size="sm" onClick={() => downloadCSV(reports)}>Export</Btn>} />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "24px 0" }}>
        <KPICard label="Total Budget" value={fmt(totalBudget)} sub="across all projects"                                                                        icon={DollarSign} accent={C.info}   />
        <KPICard label="Total Spent"  value={fmt(totalSpent)}  sub={`${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% utilised`}          icon={TrendingUp} accent={C.accent} />
        <KPICard label="Remaining"    value={fmt(remaining)}   sub="available budget"                                                                            icon={CheckCircle} accent={remaining < 0 ? C.danger : C.success} />
      </div>
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <TabBar tabs={["Overview","By Category","Monthly Trend","By Project"]} active={tab} onChange={setTab} />
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — User Management
// ─────────────────────────────────────────────────────────────────────────────

const UserManagement = ({ user, userRole, projects, notifications, onMarkAllRead }) => {
  const [assignments,   setAssignments]   = useState([])
  const [roles,         setRoles]         = useState([])
  const [allProfiles,   setAllProfiles]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState("")
  const [assignForm,    setAssignForm]    = useState({ user_id: "", project_id: "", role_id: "" })

  const isAdmin = userRole === "admin"

  useEffect(() => {
    const load = async () => {
      const queries = [
        supabase.from("user_project_assignments").select("*, projects(name), user_roles(name, description, permissions)").order("assigned_at", { ascending: false }),
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
    const { data, error: e } = await supabase.from("user_project_assignments").insert({ user_id: assignForm.user_id, project_id: assignForm.project_id, role_id: assignForm.role_id, assigned_by: user.id }).select("*, projects(name), user_roles(name, description, permissions)").single()
    if (e) { setError(e.message); setSaving(false); return }
    setAssignments(a => [{ ...data, _userName: allProfiles.find(p => p.id === assignForm.user_id)?.full_name || assignForm.user_id.slice(0, 8) + "…" }, ...a])
    setSaving(false); setShowAssignModal(false)
    setAssignForm({ user_id: "", project_id: "", role_id: "" })
  }

  const getUserName    = a => a._userName || allProfiles.find(p => p.id === a.user_id)?.full_name || a.user_id?.slice(0, 8) + "…"
  const assignableRoles = roles.filter(r => r.name !== "Admin")
  const profileOptions  = [{ value: "", label: "Select User" }, ...allProfiles.filter(p => p.role !== "admin").map(p => ({ value: p.id, label: p.full_name || p.id.slice(0, 8) }))]
  const projectOptions  = [{ value: "", label: "Select Project" }, ...(projects || []).map(p => ({ value: p.id, label: p.name }))]
  const roleOptions     = [{ value: "", label: "Select Role" }, ...assignableRoles.map(r => ({ value: r.id, label: r.name }))]

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="User Management" subtitle="Roles and project assignments" notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={isAdmin ? <Btn onClick={() => setShowAssignModal(true)} icon={UserPlus}>Assign Project</Btn> : null} />
      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Project Assignments</h3>
              <Badge label={`${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`} color={C.info} bg="#DBEAFE" />
            </div>
            <div style={{ padding: 24 }}>
              {assignments.length === 0
                ? <Empty message="No assignments yet" sub={isAdmin ? "Click Assign Project to assign a team member" : "No project assignments have been created yet"} />
                : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                      <thead><tr style={{ background: "#F8FAFC" }}>{["User","Project","Role","Assigned At"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                      <tbody>{assignments.map(a => (<tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "10px 14px", fontWeight: 600 }}>{getUserName(a)}</td><td style={{ padding: "10px 14px" }}>{a.projects?.name || "—"}</td><td style={{ padding: "10px 14px" }}><StatusBadge status={a.user_roles?.name} /></td><td style={{ padding: "10px 14px", color: C.textMuted }}>{new Date(a.assigned_at).toLocaleDateString("en-IN")}</td></tr>))}</tbody>
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
      {showAssignModal && isAdmin && (
        <Modal title="Assign Project" onClose={() => { setShowAssignModal(false); setError("") }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{error}</p>}
            <Select label="User"    value={assignForm.user_id}    onChange={e => setAssignForm(f => ({ ...f, user_id:    e.target.value }))} required options={profileOptions} />
            <Select label="Project" value={assignForm.project_id} onChange={e => setAssignForm(f => ({ ...f, project_id: e.target.value }))} required options={projectOptions} />
            <Select label="Role"    value={assignForm.role_id}    onChange={e => setAssignForm(f => ({ ...f, role_id:    e.target.value }))} required options={roleOptions}   />
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Project Detail
// ─────────────────────────────────────────────────────────────────────────────

const STAGES_DETAIL = [
  "Site Plan","Footing Layout","Column Layout","Floor Plan (Ground)","Floor Plan (First)","Floor Plan (Other)",
  "Brick Work Layout","Door & Window Layout","Electrical Layout","Plumbing Layout",
  "Site Preparation","Excavation","Foundation Work","Plinth Work","Superstructure Work",
  "Roof Work","Flooring Work","Plastering","Door & Window Work","Electrical & Plumbing Work","Painting & Finishing Work",
]

const ProjectDetail = ({ projectId, user, userRole, projects, setProjects, reports, onBack, notifications, onMarkAllRead }) => {
  const [showEdit, setShowEdit] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({})

  const project = projects.find(p => p.id === projectId)
  if (!project) return (
    <div style={{ padding: 28 }}>
      <Btn variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Btn>
      <Empty message="Project not found" />
    </div>
  )

  const projReports = reports.filter(r => r.project_id === projectId)
  const pct         = project.total_cost > 0 ? Math.round(((project.total_spent || 0) / project.total_cost) * 100) : 0
  const remaining   = (project.total_cost || 0) - (project.total_spent || 0)
  const isAdmin     = userRole === "admin"

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

  const stageCount = {}
  projReports.forEach(r => { if (r.stage) stageCount[r.stage] = (stageCount[r.stage] || 0) + 1 })
  const maxCount     = Math.max(...Object.values(stageCount), 1)
  const activeStages = STAGES_DETAIL.filter(s => stageCount[s] > 0)

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "#F1F5F9", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>{project.name}</h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <StatusBadge status={project.status} />
            {project.area_of_site     && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{project.area_of_site.toLocaleString()} sqft</span>}
            {project.start_date       && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} />{project.start_date}</span>}
            {project.target_end_date  && <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />Due {project.target_end_date}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" size="sm" icon={Download} onClick={() => downloadProjectPDF(project, reports)}>Download Report</Btn>
          {isAdmin && <Btn variant="secondary" size="sm" icon={Edit3} onClick={openEdit}>Edit</Btn>}
          {isAdmin && <button onClick={handleDelete} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13, color: C.danger, fontWeight: 600 }}><Trash2 size={14} />Delete</button>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <KPICard label="Total Budget"  value={fmt(project.total_cost)}       sub="project budget" icon={DollarSign}  accent={C.info}    />
        <KPICard label="Amount Spent"  value={fmt(project.total_spent || 0)} sub={`${pct}% used`} icon={TrendingUp}  accent={C.accent}  />
        <KPICard label="Remaining"     value={fmt(remaining)}                 sub="budget left"    icon={Activity}    accent={remaining < 0 ? C.danger : C.success} />
        <KPICard label="DPRs Filed"    value={projReports.length}             sub="daily reports"  icon={FileText}    accent={C.charcoal}/>
      </div>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={15} color={C.accent} /> Site Location
        </h3>
        <SatelliteMap lat={project.latitude} lng={project.longitude} projectName={project.name} height={340} />
      </div>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Daily Reports</h3>
        {projReports.length === 0 ? <Empty message="No reports yet" sub="Submit a DPR for this project to see it here" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
              <thead><tr style={{ borderBottom: `2px solid ${C.border}` }}>{["Date","Floor","Stage","Weather","Manpower","Total Cost"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>)}</tr></thead>
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
      {activeStages.length > 0 && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Stage Progress</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STAGES_DETAIL.filter(s => stageCount[s] > 0).map(s => {
              const count  = stageCount[s] || 0
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
      {showEdit && (
        <Modal title="Edit Project" onClose={() => setShowEdit(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Project Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Start Date"       type="date"   value={form.start_date}      onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              <Input label="Target End Date"  type="date"   value={form.target_end_date} onChange={e => setForm(f => ({ ...f, target_end_date: e.target.value }))} />
              <Input label="Total Budget (₹)" type="number" value={form.total_cost}      onChange={e => setForm(f => ({ ...f, total_cost: e.target.value }))} />
              <Input label="Site Area (sqft)" type="number" value={form.area_of_site}    onChange={e => setForm(f => ({ ...f, area_of_site: e.target.value }))} />
            </div>
            <LocationPicker lat={form.latitude} lng={form.longitude} onChange={(lt, lg) => setForm(f => ({ ...f, latitude: lt, longitude: lg }))} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[{ value: "active", label: "Active" }, { value: "delayed", label: "Delayed" }, { value: "on_hold", label: "On Hold" }, { value: "completed", label: "Completed" }]} />
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Labour Register
//
// Tabbed interface:
//   Tab 1: Bulk Entry (existing category-based attendance)
//   Tab 2: Manage Workers (individual labourer CRUD with photos)
//   Tab 3: Mark Attendance (per-person daily checklist)
//   Tab 4: Attendance Report (calendar matrix)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "unskilled",      label: "Unskilled Labour",             defaultWage: 380 },
  { value: "semi_skilled",   label: "Semi-Skilled Labour",          defaultWage: 500 },
  { value: "skilled",        label: "Skilled Labour (Mistri)",      defaultWage: 700 },
  { value: "highly_skilled", label: "Highly Skilled / Supervisor",  defaultWage: 950 },
]

const TRADE_BY_CATEGORY = {
  unskilled:      ["General Helper", "Material Carrier", "Site Cleaner", "Excavation Worker", "Mixer Helper"],
  semi_skilled:   ["Bar Bender", "Scaffolder", "Tile Helper", "Painting Helper", "Formwork Helper"],
  skilled:        ["Raj Mistri", "Carpenter", "Plumber", "Electrician", "Steel Fixer", "Shuttering Carpenter", "Painter"],
  highly_skilled: ["Head Mistri", "Fitter Foreman", "Pump Operator", "Site Supervisor", "Crane Operator"],
}

const ATTENDANCE_TABS = [
  { key: "bulk",    label: "Bulk Entry",        icon: Users },
  { key: "manage",  label: "Manage Workers",    icon: UserPlus },
  { key: "mark",    label: "Mark Attendance",   icon: ClipboardList },
  { key: "report",  label: "Attendance Report", icon: BarChart2 },
]

const getYesterday = () => {
  const d = new Date(); d.setDate(d.getDate() - 1)
  return d.toISOString().split("T")[0]
}

const isDateAllowed = (dateStr) => {
  const today = new Date().toISOString().split("T")[0]
  const yesterday = getYesterday()
  return dateStr === today || dateStr === yesterday
}

// ── Sub-tab: Bulk Entry (original) ───────────────────────────────────────────

const BulkEntryTab = ({ user, projects }) => {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({
    project_id: "", attendance_date: today, category: "unskilled",
    trade: "", worker_count: "1", hours_worked: "8", daily_wage_rate: "380", remarks: "",
  })
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [dateFilter, setDateFilter] = useState(today)
  const [projectFilter, setProjectFilter] = useState("")

  const liveTotal = (parseInt(form.worker_count) || 0) * (parseFloat(form.daily_wage_rate) || 0)

  const f = (key, val) => setForm(prev => {
    const next = { ...prev, [key]: val }
    if (key === "category") {
      const cat = CATEGORY_OPTIONS.find(c => c.value === val)
      next.daily_wage_rate = String(cat?.defaultWage || "")
      next.trade = ""
    }
    return next
  })

  const loadRecords = async () => {
    if (!projectFilter) { setRecords([]); return }
    setLoading(true)
    const { data } = await supabase.from("labour_attendance")
      .select("*, projects(name)").eq("project_id", projectFilter)
      .eq("attendance_date", dateFilter).order("created_at", { ascending: false })
    setRecords(data || []); setLoading(false)
  }

  useEffect(() => { loadRecords() }, [projectFilter, dateFilter])

  const handleSubmit = async () => {
    setError("")
    if (!form.project_id || !form.category || !form.worker_count || !form.daily_wage_rate)
      return setError("Please fill in Project, Category, Worker Count, and Daily Wage Rate.")
    setSaving(true)
    const { error: e } = await supabase.from("labour_attendance").insert({
      project_id: form.project_id, user_id: user.id, attendance_date: form.attendance_date,
      category: form.category, trade: form.trade || null,
      worker_count: parseInt(form.worker_count), hours_worked: parseFloat(form.hours_worked),
      daily_wage_rate: parseFloat(form.daily_wage_rate), remarks: form.remarks || null,
    })
    if (e) { setError(e.message); setSaving(false); return }
    setSaving(false)
    if (form.project_id === projectFilter && form.attendance_date === dateFilter) loadRecords()
    setForm(prev => ({ ...prev, trade: "", worker_count: "1", remarks: "" }))
  }

  const totalDayWage = records.reduce((s, r) => s + (parseFloat(r.total_wage) || 0), 0)
  const totalWorkers = records.reduce((s, r) => s + (r.worker_count || 0), 0)
  const categoryLabel = val => CATEGORY_OPTIONS.find(c => c.value === val)?.label || val

  return (
    <>
      <div style={{ background: C.card, borderRadius: 16, padding: 28, marginTop: 20, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Log Attendance (Bulk)</h3>
        {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, marginBottom: 16 }}>{error}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Select label="Project" required value={form.project_id} onChange={e => f("project_id", e.target.value)}
            options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
          <Input label="Date" type="date" required value={form.attendance_date} onChange={e => f("attendance_date", e.target.value)} />
          <Select label="Labour Category" required value={form.category} onChange={e => f("category", e.target.value)}
            options={CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label }))} />
          <Select label="Trade / Specialisation" value={form.trade} onChange={e => f("trade", e.target.value)}
            options={[{ value: "", label: "Select Trade" }, ...(TRADE_BY_CATEGORY[form.category] || []).map(t => ({ value: t, label: t }))]} />
          <Input label="Number of Workers" type="number" required value={form.worker_count} onChange={e => f("worker_count", e.target.value)} />
          <Input label="Hours Worked" type="number" required value={form.hours_worked} onChange={e => f("hours_worked", e.target.value)} />
          <Input label="Daily Wage Rate (₹)" type="number" required value={form.daily_wage_rate} onChange={e => f("daily_wage_rate", e.target.value)} />
          <Input label="Remarks" value={form.remarks} onChange={e => f("remarks", e.target.value)} placeholder="Optional notes" />
        </div>
        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 18px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Total Wage for This Entry</span>
          <span style={{ fontFamily: FONT_HEADING, fontSize: 26, fontWeight: 800, color: C.accent }}>{fmt(liveTotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn onClick={handleSubmit} disabled={saving} size="lg" icon={CheckCircle}>{saving ? "Saving..." : "Log Attendance"}</Btn>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 16, padding: 28, marginTop: 20, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Daily Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <Select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            options={[{ value: "", label: "Select Project to View" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
        {!projectFilter ? <Empty message="Select a project to view attendance" /> : loading ? <Spinner /> : records.length === 0 ? <Empty message="No attendance logged for this date" /> : (
          <>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <KPICard label="Total Workers" value={totalWorkers} icon={Users} accent={C.info} />
              <KPICard label="Total Wage Bill" value={fmt(totalDayWage)} icon={DollarSign} accent={C.success} />
              <KPICard label="Entries Logged" value={records.length} icon={FileText} accent={C.accent} />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                <thead><tr style={{ background: "#F8FAFC" }}>
                  {["Category","Trade","Workers","Hours","Rate / Day","Total Wage","Remarks"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{records.map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={categoryLabel(r.category)} /></td>
                    <td style={{ padding: "10px 14px", color: C.text, fontWeight: 600 }}>{r.trade || "—"}</td>
                    <td style={{ padding: "10px 14px", color: C.text, textAlign: "center" }}>{r.worker_count}</td>
                    <td style={{ padding: "10px 14px", color: C.text, textAlign: "center" }}>{r.hours_worked}h</td>
                    <td style={{ padding: "10px 14px", color: C.text }}>₹{parseFloat(r.daily_wage_rate).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: C.accent }}>{fmt(parseFloat(r.total_wage))}</td>
                    <td style={{ padding: "10px 14px", color: C.textMuted }}>{r.remarks || "—"}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{ background: "#F8FAFC", borderTop: `2px solid ${C.border}` }}>
                  <td colSpan={2} style={{ padding: "12px 14px", fontFamily: FONT_HEADING, fontWeight: 700, color: C.charcoal }}>TOTAL</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, textAlign: "center", color: C.text }}>{totalWorkers}</td>
                  <td colSpan={2} />
                  <td style={{ padding: "12px 14px", fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 800, color: C.accent }}>{fmt(totalDayWage)}</td>
                  <td />
                </tr></tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Sub-tab: Manage Workers ──────────────────────────────────────────────────

const ManageWorkersTab = ({ user, projects }) => {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [form, setForm] = useState({
    name: "", phone: "", category: "unskilled", trade: "",
    daily_wage_rate: "380", aadhaar_last4: "", joined_date: new Date().toISOString().split("T")[0],
  })

  const f = (key, val) => setForm(prev => {
    const next = { ...prev, [key]: val }
    if (key === "category") {
      const cat = CATEGORY_OPTIONS.find(c => c.value === val)
      next.daily_wage_rate = String(cat?.defaultWage || "")
      next.trade = ""
    }
    return next
  })

  const loadWorkers = async () => {
    if (!projectFilter) { setWorkers([]); return }
    setLoading(true)
    const { data } = await supabase.from("labourers")
      .select("*").eq("project_id", projectFilter).order("name")
    setWorkers(data || []); setLoading(false)
  }

  useEffect(() => { loadWorkers() }, [projectFilter])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleAdd = async () => {
    setError("")
    if (!projectFilter || !form.name.trim()) return setError("Select a project and enter worker name.")
    if (form.aadhaar_last4 && form.aadhaar_last4.length !== 4) return setError("Aadhaar must be exactly 4 digits.")
    setSaving(true)

    let photo_url = null
    if (photoFile) {
      const ext = photoFile.name.split(".").pop()
      const path = `${projectFilter}/${Date.now()}_${form.name.replace(/\s+/g, "_")}.${ext}`
      const { error: upErr } = await supabase.storage.from("labourer-photos").upload(path, photoFile)
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("labourer-photos").getPublicUrl(path)
        photo_url = urlData?.publicUrl
      }
    }

    const { error: e } = await supabase.from("labourers").insert({
      project_id: projectFilter, name: form.name.trim(), phone: form.phone || null,
      category: form.category, trade: form.trade || null,
      daily_wage_rate: parseFloat(form.daily_wage_rate),
      aadhaar_last4: form.aadhaar_last4 || null, photo_url,
      joined_date: form.joined_date,
    })
    if (e) { setError(e.message); setSaving(false); return }
    setSaving(false); setShowForm(false); setPhotoFile(null); setPhotoPreview(null)
    setForm({ name: "", phone: "", category: "unskilled", trade: "", daily_wage_rate: "380", aadhaar_last4: "", joined_date: new Date().toISOString().split("T")[0] })
    loadWorkers()
  }

  const toggleActive = async (w) => {
    await supabase.from("labourers").update({ is_active: !w.is_active }).eq("id", w.id)
    loadWorkers()
  }

  const activeCount = workers.filter(w => w.is_active).length
  const catLabel = val => CATEGORY_OPTIONS.find(c => c.value === val)?.label || val

  return (
    <>
      <div style={{ display: "flex", gap: 14, marginTop: 20, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <Select label="Project" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
        </div>
        {projectFilter && <Btn onClick={() => setShowForm(!showForm)} icon={UserPlus} size="lg">{showForm ? "Cancel" : "Add Worker"}</Btn>}
      </div>

      {showForm && projectFilter && (
        <div style={{ background: C.card, borderRadius: 16, padding: 28, marginTop: 16, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 16px" }}>Register New Worker</h3>
          {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, marginBottom: 16 }}>{error}</p>}

          <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 100, height: 100, borderRadius: 12, background: "#F1F5F9", border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", position: "relative" }}
                onClick={() => document.getElementById("photo-input").click()}>
                {photoPreview ? <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <Camera size={28} color={C.textMuted} />}
              </div>
              <input id="photo-input" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT }}>Upload Photo</span>
            </div>

            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Full Name" required value={form.name} onChange={e => f("name", e.target.value)} placeholder="e.g. Ramesh Kumar" />
              <Input label="Phone" value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="Optional" />
              <Select label="Category" required value={form.category} onChange={e => f("category", e.target.value)}
                options={CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label }))} />
              <Select label="Trade" value={form.trade} onChange={e => f("trade", e.target.value)}
                options={[{ value: "", label: "Select Trade" }, ...(TRADE_BY_CATEGORY[form.category] || []).map(t => ({ value: t, label: t }))]} />
              <Input label="Daily Wage (₹)" type="number" required value={form.daily_wage_rate} onChange={e => f("daily_wage_rate", e.target.value)} />
              <Input label="Aadhaar Last 4" value={form.aadhaar_last4} onChange={e => f("aadhaar_last4", e.target.value)} placeholder="e.g. 1234" />
              <Input label="Joined Date" type="date" value={form.joined_date} onChange={e => f("joined_date", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={handleAdd} disabled={saving} icon={UserPlus}>{saving ? "Saving..." : "Register Worker"}</Btn>
          </div>
        </div>
      )}

      {projectFilter && (
        <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
          <KPICard label="Active Workers" value={activeCount} icon={UserCheck} accent={C.success} />
          <KPICard label="Inactive" value={workers.length - activeCount} icon={UserX} accent={C.textMuted} />
          <KPICard label="Total Registered" value={workers.length} icon={Users} accent={C.info} />
        </div>
      )}

      <div style={{ background: C.card, borderRadius: 16, marginTop: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {!projectFilter ? <div style={{ padding: 28 }}><Empty message="Select a project to view workers" /></div> : loading ? <Spinner /> : workers.length === 0 ? <div style={{ padding: 28 }}><Empty message="No workers registered yet" /></div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
              <thead><tr style={{ background: "#F8FAFC" }}>
                {["","Name","Category","Trade","Wage/Day","Aadhaar","Joined","Status",""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{workers.map(w => (
                <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: w.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F5F9", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {w.photo_url ? <img src={w.photo_url} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={C.textMuted} />}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: C.text }}>{w.name}{w.phone && <div style={{ fontSize: 11, color: C.textMuted }}>{w.phone}</div>}</td>
                  <td style={{ padding: "10px 14px" }}><StatusBadge status={catLabel(w.category)} /></td>
                  <td style={{ padding: "10px 14px", color: C.text }}>{w.trade || "—"}</td>
                  <td style={{ padding: "10px 14px", color: C.accent, fontWeight: 700 }}>₹{parseFloat(w.daily_wage_rate).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "10px 14px", color: C.textMuted }}>{w.aadhaar_last4 ? `••••${w.aadhaar_last4}` : "—"}</td>
                  <td style={{ padding: "10px 14px", color: C.text }}>{w.joined_date}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge label={w.is_active ? "Active" : "Inactive"} bg={w.is_active ? "#D1FAE5" : "#F1F5F9"} color={w.is_active ? C.success : C.textMuted} />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <button onClick={() => toggleActive(w)} style={{ background: "none", border: "none", color: C.info, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                      {w.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ── Sub-tab: Mark Attendance ─────────────────────────────────────────────────

const MarkAttendanceTab = ({ user, projects }) => {
  const today = new Date().toISOString().split("T")[0]
  const [projectId, setProjectId] = useState("")
  const [attDate, setAttDate] = useState(today)
  const [workers, setWorkers] = useState([])
  const [attMap, setAttMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [existing, setExisting] = useState({})

  const dateAllowed = isDateAllowed(attDate)

  const loadWorkers = async () => {
    if (!projectId) { setWorkers([]); return }
    setLoading(true)
    const { data: w } = await supabase.from("labourers")
      .select("*").eq("project_id", projectId).eq("is_active", true).order("name")

    const { data: att } = await supabase.from("labourer_attendance")
      .select("*").eq("project_id", projectId).eq("attendance_date", attDate)

    const existingMap = {}
    const map = {};
    (w || []).forEach(worker => {
      const found = (att || []).find(a => a.labourer_id === worker.id)
      if (found) {
        existingMap[worker.id] = found.id
        map[worker.id] = { status: found.status, hours: found.hours_worked, remarks: found.remarks || "" }
      } else {
        map[worker.id] = { status: "present", hours: 8, remarks: "" }
      }
    })
    setWorkers(w || []); setAttMap(map); setExisting(existingMap); setLoading(false)
  }

  useEffect(() => { loadWorkers() }, [projectId, attDate])

  const updateAtt = (wId, key, val) => setAttMap(prev => ({ ...prev, [wId]: { ...prev[wId], [key]: val } }))

  const markAllPresent = () => {
    const map = {}
    workers.forEach(w => { map[w.id] = { status: "present", hours: 8, remarks: attMap[w.id]?.remarks || "" } })
    setAttMap(map)
  }

  const handleSave = async () => {
    setError(""); setSuccess(""); setSaving(true)
    if (!dateAllowed) { setError("Attendance can only be marked for today or yesterday."); setSaving(false); return }

    const upserts = workers.map(w => {
      const a = attMap[w.id] || { status: "present", hours: 8, remarks: "" }
      const wage = a.status === "present" ? w.daily_wage_rate : a.status === "half_day" ? w.daily_wage_rate / 2 : 0
      return {
        ...(existing[w.id] ? { id: existing[w.id] } : {}),
        labourer_id: w.id, project_id: projectId, attendance_date: attDate,
        status: a.status, hours_worked: a.status === "absent" ? 0 : a.status === "half_day" ? 4 : parseFloat(a.hours) || 8,
        wage_earned: wage, marked_by: user.id, remarks: a.remarks || null,
      }
    })

    const { error: e } = await supabase.from("labourer_attendance").upsert(upserts, { onConflict: "labourer_id,attendance_date" })
    if (e) { setError(e.message); setSaving(false); return }
    setSuccess(`Attendance saved for ${workers.length} workers!`); setSaving(false)
    loadWorkers()
  }

  const presentCount = workers.filter(w => attMap[w.id]?.status === "present").length
  const absentCount = workers.filter(w => attMap[w.id]?.status === "absent").length
  const halfDayCount = workers.filter(w => attMap[w.id]?.status === "half_day").length
  const totalWage = workers.reduce((s, w) => {
    const a = attMap[w.id]
    if (!a) return s
    return s + (a.status === "present" ? w.daily_wage_rate : a.status === "half_day" ? w.daily_wage_rate / 2 : 0)
  }, 0)

  const catLabel = val => CATEGORY_OPTIONS.find(c => c.value === val)?.label || val
  const statusColors = { present: { bg: "#D1FAE5", color: C.success }, absent: { bg: "#FEE2E2", color: C.danger }, half_day: { bg: "#FEF3C7", color: C.warning } }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
        <Select label="Project" value={projectId} onChange={e => setProjectId(e.target.value)}
          options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
        <div>
          <Input label="Attendance Date" type="date" value={attDate} onChange={e => setAttDate(e.target.value)} />
          {!dateAllowed && <p style={{ fontSize: 11, color: C.danger, margin: "4px 0 0", fontFamily: FONT }}>⚠ Only today or yesterday allowed</p>}
        </div>
      </div>

      {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, marginTop: 12 }}>{error}</p>}
      {success && <p style={{ fontFamily: FONT, fontSize: 13, color: C.success, background: "#D1FAE5", padding: "10px 14px", borderRadius: 8, marginTop: 12 }}>{success}</p>}

      {projectId && workers.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
            <KPICard label="Present" value={presentCount} icon={UserCheck} accent={C.success} />
            <KPICard label="Absent" value={absentCount} icon={UserX} accent={C.danger} />
            <KPICard label="Half Day" value={halfDayCount} icon={Clock} accent={C.warning} />
            <KPICard label="Wage Bill" value={fmt(totalWage)} icon={DollarSign} accent={C.accent} />
          </div>

          <div style={{ background: C.card, borderRadius: 16, marginTop: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: 0 }}>Mark Individual Attendance</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="outline" size="sm" onClick={markAllPresent} icon={CheckCircle}>Mark All Present</Btn>
                <Btn size="sm" onClick={handleSave} disabled={saving || !dateAllowed} icon={CheckCircle}>{saving ? "Saving..." : "Save Attendance"}</Btn>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                <thead><tr style={{ background: "#F8FAFC" }}>
                  {["","Name","Trade","Wage/Day","Status","Hours","Remarks"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{workers.map(w => {
                  const a = attMap[w.id] || { status: "present", hours: 8, remarks: "" }
                  const sc = statusColors[a.status] || statusColors.present
                  return (
                    <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}`, background: a.status === "absent" ? "#FEF2F2" : "transparent" }}>
                      <td style={{ padding: "8px 14px" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F1F5F9", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {w.photo_url ? <img src={w.photo_url} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={14} color={C.textMuted} />}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: C.text }}>{w.name}</td>
                      <td style={{ padding: "10px 14px", color: C.textMuted }}>{w.trade || catLabel(w.category)}</td>
                      <td style={{ padding: "10px 14px", color: C.accent, fontWeight: 600 }}>₹{parseFloat(w.daily_wage_rate).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <select value={a.status} onChange={e => updateAtt(w.id, "status", e.target.value)}
                          style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: FONT, fontWeight: 600, background: sc.bg, color: sc.color }}>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="half_day">Half Day</option>
                        </select>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <input type="number" value={a.hours} onChange={e => updateAtt(w.id, "hours", e.target.value)}
                          style={{ width: 50, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: FONT, textAlign: "center" }}
                          disabled={a.status === "absent"} />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <input value={a.remarks} onChange={e => updateAtt(w.id, "remarks", e.target.value)} placeholder="—"
                          style={{ width: 120, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: FONT }} />
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {projectId && !loading && workers.length === 0 && <div style={{ marginTop: 20 }}><Empty message="No active workers found" sub="Register workers in the 'Manage Workers' tab first" /></div>}
      {!projectId && <div style={{ marginTop: 20 }}><Empty message="Select a project to mark attendance" /></div>}
    </>
  )
}

// ── Sub-tab: Attendance Report ───────────────────────────────────────────────

const AttendanceReportTab = ({ projects }) => {
  const today = new Date().toISOString().split("T")[0]
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split("T")[0] })()
  const [projectId, setProjectId] = useState("")
  const [startDate, setStartDate] = useState(weekAgo)
  const [endDate, setEndDate] = useState(today)
  const [workers, setWorkers] = useState([])
  const [attData, setAttData] = useState([])
  const [loading, setLoading] = useState(false)

  const loadReport = async () => {
    if (!projectId) return
    setLoading(true)
    const { data: w } = await supabase.from("labourers")
      .select("*").eq("project_id", projectId).order("name")
    const { data: att } = await supabase.from("labourer_attendance")
      .select("*").eq("project_id", projectId)
      .gte("attendance_date", startDate).lte("attendance_date", endDate)
    setWorkers(w || []); setAttData(att || []); setLoading(false)
  }

  useEffect(() => { loadReport() }, [projectId, startDate, endDate])

  const dates = []
  if (startDate && endDate) {
    const d = new Date(startDate)
    const end = new Date(endDate)
    while (d <= end) { dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate() + 1) }
  }

  const getStatus = (wId, date) => {
    const found = attData.find(a => a.labourer_id === wId && a.attendance_date === date)
    return found?.status || null
  }

  const statusIcon = (s) => {
    if (s === "present") return <span style={{ color: C.success, fontWeight: 700 }}>✓</span>
    if (s === "absent") return <span style={{ color: C.danger, fontWeight: 700 }}>✗</span>
    if (s === "half_day") return <span style={{ color: C.warning, fontWeight: 700 }}>½</span>
    return <span style={{ color: "#CBD5E1" }}>—</span>
  }

  const getWorkerStats = (wId) => {
    const recs = attData.filter(a => a.labourer_id === wId)
    const present = recs.filter(a => a.status === "present").length
    const halfDay = recs.filter(a => a.status === "half_day").length
    const totalDays = dates.length
    const attendPct = totalDays > 0 ? Math.round(((present + halfDay * 0.5) / totalDays) * 100) : 0
    const totalWage = recs.reduce((s, a) => s + (parseFloat(a.wage_earned) || 0), 0)
    return { present, halfDay, attendPct, totalWage }
  }

  const formatDateShort = (d) => {
    const dt = new Date(d)
    return `${dt.getDate()}/${dt.getMonth() + 1}`
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 20 }}>
        <Select label="Project" value={projectId} onChange={e => setProjectId(e.target.value)}
          options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
        <Input label="From" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="To" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {!projectId ? <div style={{ marginTop: 20 }}><Empty message="Select a project to view report" /></div> : loading ? <Spinner /> : workers.length === 0 ? <div style={{ marginTop: 20 }}><Empty message="No workers registered for this project" /></div> : (
        <div style={{ background: C.card, borderRadius: 16, marginTop: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 700, color: C.charcoal, margin: 0 }}>
              Attendance Matrix — {dates.length} days
            </h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 12 }}>
              <thead><tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}`, position: "sticky", left: 0, background: "#F8FAFC", zIndex: 1, minWidth: 140 }}>Worker</th>
                {dates.map(d => (
                  <th key={d} style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, color: C.textMuted, borderBottom: `2px solid ${C.border}`, minWidth: 40 }}>{formatDateShort(d)}</th>
                ))}
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}`, minWidth: 50 }}>%</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}`, minWidth: 80 }}>Total ₹</th>
              </tr></thead>
              <tbody>{workers.map(w => {
                const stats = getWorkerStats(w.id)
                const pctColor = stats.attendPct >= 80 ? C.success : stats.attendPct >= 50 ? C.warning : C.danger
                return (
                  <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 14px", fontWeight: 600, color: C.text, position: "sticky", left: 0, background: C.card, zIndex: 1, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "#F1F5F9", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {w.photo_url ? <img src={w.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={12} color={C.textMuted} />}
                        </div>
                        {w.name}
                      </div>
                    </td>
                    {dates.map(d => (
                      <td key={d} style={{ padding: "8px 6px", textAlign: "center" }}>{statusIcon(getStatus(w.id, d))}</td>
                    ))}
                    <td style={{ padding: "8px 14px", textAlign: "center", fontWeight: 700, color: pctColor }}>{stats.attendPct}%</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontWeight: 700, color: C.accent }}>{fmt(stats.totalWage)}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
          <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 20, fontSize: 12, fontFamily: FONT, color: C.textMuted }}>
            <span><span style={{ color: C.success, fontWeight: 700 }}>✓</span> Present</span>
            <span><span style={{ color: C.danger, fontWeight: 700 }}>✗</span> Absent</span>
            <span><span style={{ color: C.warning, fontWeight: 700 }}>½</span> Half Day</span>
            <span><span style={{ color: "#CBD5E1" }}>—</span> No Record</span>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main LabourRegister with Tabs ────────────────────────────────────────────

const LabourRegister = ({ user, projects, notifications, onMarkAllRead }) => {
  const [activeTab, setActiveTab] = useState("bulk")

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Labour Register" subtitle="Attendance, worker management & wage tracking" notifications={notifications} onMarkAllRead={onMarkAllRead} />

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 4, marginTop: 24, background: "#F1F5F9", borderRadius: 12, padding: 4 }}>
        {ATTENDANCE_TABS.map(t => {
          const active = activeTab === t.key
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              flex: 1, padding: "12px 16px", borderRadius: 10, border: "none", cursor: "pointer",
              background: active ? C.card : "transparent", color: active ? C.accent : C.textMuted,
              fontFamily: FONT, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, transition: "all 0.2s ease",
              boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}>
              <Icon size={16} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "bulk"   && <BulkEntryTab user={user} projects={projects} />}
      {activeTab === "manage" && <ManageWorkersTab user={user} projects={projects} />}
      {activeTab === "mark"   && <MarkAttendanceTab user={user} projects={projects} />}
      {activeTab === "report" && <AttendanceReportTab projects={projects} />}
    </div>
  )
}



// ─────────────────────────────────────────────────────────────────────────────
// AI ASSISTANT — Context Assembler
//
// Builds a structured plain-text context string from live app state.
// This is injected into every AI assistant request so the LLM has
// accurate, up-to-date data rather than relying on its training weights.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Site Issues (AI Delay Logger)
//
// Tracks site delays and issues with AI-powered NLP classification.
// ─────────────────────────────────────────────────────────────────────────────

const ISSUE_CATEGORIES = {
  material_delay:     { label: "Material Delay",      color: C.warning, bg: "#FEF3C7", icon: Truck },
  labour_shortage:    { label: "Labour Shortage",     color: C.info,    bg: "#DBEAFE", icon: Users },
  equipment_failure:  { label: "Equipment Failure",   color: C.danger,  bg: "#FEE2E2", icon: Wrench },
  approval_pending:   { label: "Approval Pending",    color: "#6B21A8", bg: "#F3E8FF", icon: Clock },
  weather_disruption: { label: "Weather Disruption",  color: "#0369A1", bg: "#E0F2FE", icon: CloudRain },
  safety_incident:    { label: "Safety Incident",     color: C.danger,  bg: "#FEE2E2", icon: AlertTriangle },
  quality_issue:      { label: "Quality Issue",       color: "#B45309", bg: "#FEF3C7", icon: AlertCircle },
  other:              { label: "Other",               color: C.textMuted, bg: "#F1F5F9", icon: MoreVertical },
  uncategorized:      { label: "Uncategorized",       color: C.textMuted, bg: "#F1F5F9", icon: MoreVertical },
}

const ISSUE_PRIORITIES = {
  critical: { label: "Critical", color: C.danger,  bg: "#FEE2E2" },
  high:     { label: "High",     color: C.warning, bg: "#FEF3C7" },
  medium:   { label: "Medium",   color: C.info,    bg: "#DBEAFE" },
  low:      { label: "Low",      color: C.textMuted, bg: "#F1F5F9" },
}

const ISSUE_STATUSES = {
  open:         { label: "Open",        color: C.danger,  bg: "#FEE2E2" },
  in_progress:  { label: "In Progress", color: C.info,    bg: "#DBEAFE" },
  resolved:     { label: "Resolved",    color: C.success, bg: "#D1FAE5" },
  closed:       { label: "Closed",      color: C.textMuted, bg: "#F1F5F9" },
}

const SiteIssues = ({ user, projects, notifications, onMarkAllRead }) => {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [projectId, setProjectId] = useState("")
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  // UI State
  const [filterStatus, setFilterStatus] = useState("open") // open, all, resolved
  const [activeIssue, setActiveIssue] = useState(null)
  const [updStatus, setUpdStatus] = useState("")
  const [updNotes, setUpdNotes] = useState("")
  const [updating, setUpdating] = useState(false)

  const loadIssues = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("site_issues")
      .select("*, projects(name)")
      .order("created_at", { ascending: false })
    setIssues(data || [])
    setLoading(false)
  }

  useEffect(() => { loadIssues() }, [])

  const handleLogIssue = async () => {
    setError("")
    if (!projectId || !description.trim()) {
      return setError("Please select a project and describe the issue.")
    }
    setSubmitting(true)
    
    try {
      // 1. Insert initially as uncategorized
      const { data: newIssue, error: insErr } = await supabase
        .from("site_issues")
        .insert({
          project_id: projectId,
          user_id: user.id,
          reported_date: reportedDate,
          description: description.trim(),
        })
        .select()
        .single()
        
      if (insErr) throw insErr

      // Refresh UI instantly with the pending issue
      setIssues(prev => [newIssue, ...prev])

      // 2. Classify via AI using the existing endpoint
      const prompt = `You are a construction project issue classifier. Analyze the following site issue description and respond with ONLY a JSON object (no markdown, no explanation, just the raw JSON structure).
      
{
  "category": "<one of: material_delay, labour_shortage, equipment_failure, approval_pending, weather_disruption, safety_incident, quality_issue, other>",
  "priority": "<one of: critical, high, medium, low>",
  "confidence": "<one of: high, medium, low>"
}

Rules:
- material_delay: Supply chain, delivery, procurement issues
- labour_shortage: Worker unavailability, strikes, insufficient manpower
- equipment_failure: Machinery breakdown, tool issues, crane/pump failure  
- approval_pending: Regulatory, permit, inspection, or client approval delays
- weather_disruption: Rain, storms, extreme heat/cold halting work
- safety_incident: Accidents, near-misses, safety violations
- quality_issue: Defective work, rework needed, material quality problems
- other: Doesn't fit above categories

Priority rules:
- critical: Work completely stopped, safety risk, or >₹5L daily loss
- high: Major delay (>1 day), significant cost impact
- medium: Partial delay, workaround available
- low: Minor issue, no immediate work stoppage

Issue description: "${description}"
Project: "${projects.find(p => p.id === projectId)?.name}"`

      const res = await fetch("https://zdcuroihwhtixolkxgbj.supabase.co/functions/v1/ai-agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], context: "" }),
      })
      
      const aiData = await res.json()
      
      let classification = { category: "other", priority: "medium", confidence: "low" }
      try {
        // Try parsing the AI reply. Handle potential markdown wrapping.
        const cleanJson = aiData.reply.replace(/```json/g, "").replace(/```/g, "").trim()
        classification = JSON.parse(cleanJson)
      } catch (e) {
        console.warn("Could not parse AI classification", e)
      }

      // Validate parsed data
      const finalCategory = ISSUE_CATEGORIES[classification.category] ? classification.category : "other"
      const finalPriority = ISSUE_PRIORITIES[classification.priority] ? classification.priority : "medium"

      // 3. Update issue with AI results
      const { error: updErr } = await supabase
        .from("site_issues")
        .update({
          ai_category: finalCategory,
          priority: finalPriority,
          ai_confidence: classification.confidence || 'low',
        })
        .eq("id", newIssue.id)
        
      if (updErr) throw updErr
      
      // Clear form & reload
      setDescription("")
      setProjectId("")
      loadIssues()
      
    } catch (err) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!activeIssue || !updStatus) return
    setUpdating(true)
    
    const updates = { 
      status: updStatus,
      resolution_notes: updNotes,
      updated_at: new Date().toISOString()
    }
    
    if (updStatus === 'resolved' || updStatus === 'closed') {
      updates.resolution_date = new Date().toISOString().split("T")[0]
    }
    
    await supabase.from("site_issues").update(updates).eq("id", activeIssue.id)
    
    setActiveIssue(null)
    setUpdating(false)
    loadIssues()
  }

  const filteredIssues = issues.filter(i => {
    if (filterStatus === "open") return i.status === "open" || i.status === "in_progress"
    if (filterStatus === "resolved") return i.status === "resolved" || i.status === "closed"
    return true
  })

  const openIssuesCount = issues.filter(i => i.status === "open" || i.status === "in_progress").length
  const criticalCount = issues.filter(i => (i.status === "open" || i.status === "in_progress") && i.priority === "critical").length
  
  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Site Issues" subtitle="AI-powered delay & issue tracking" notifications={notifications} onMarkAllRead={onMarkAllRead} />

      {/* Form Card */}
      <div style={{ background: C.card, borderRadius: 16, padding: 28, marginTop: 24, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: C.charcoal }}>Log a New Issue</h3>
        {error && <div style={{ padding: 12, background: "#FEE2E2", color: C.danger, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Select label="Project" value={projectId} onChange={e => setProjectId(e.target.value)} required
            options={[{ value: "", label: "Select Project" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
          <Input label="Date of Issue" type="date" value={reportedDate} onChange={e => setReportedDate(e.target.value)} required />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
            Issue Description <span style={{color: C.danger}}>*</span>
          </label>
          <textarea 
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe what happened e.g. 'Cement delivery didn't arrive, foundation work stopped for 3 hours.'"
            style={{ width: "100%", padding: 14, borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: FONT, fontSize: 14, minHeight: 100, boxSizing: "border-box", background: "#F8FAFC", resize: "vertical", outline: "none" }}
            className="input-glow"
          />
        </div>
        
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn onClick={handleLogIssue} disabled={submitting} icon={Bot} size="lg">
            {submitting ? "Analyzing & Saving..." : "Log Issue & Classify"}
          </Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
        <KPICard label="Active Issues" value={openIssuesCount} icon={AlertCircle} accent={C.warning} />
        <KPICard label="Critical Priority" value={criticalCount} icon={AlertTriangle} accent={C.danger} />
        <KPICard label="Total Logged" value={issues.length} icon={Database} accent={C.info} />
      </div>

      {/* Issues List */}
      <div style={{ background: C.card, borderRadius: 16, marginTop: 24, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, margin: 0, color: C.charcoal }}>Issue Log</h3>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: FONT }}>
            <option value="open">Active Issues</option>
            <option value="resolved">Resolved</option>
            <option value="all">All Issues</option>
          </select>
        </div>
        
        {loading ? <Spinner /> : filteredIssues.length === 0 ? <Empty message="No issues found" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "12px 24px", textAlign: "left", color: C.charcoal }}>Date</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", color: C.charcoal }}>Project</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", color: C.charcoal }}>AI Category</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", color: C.charcoal }}>Priority</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", color: C.charcoal }}>Status</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", color: C.charcoal }}>Description</th>
                  <th style={{ padding: "12px 24px", textAlign: "center", color: C.charcoal }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(i => {
                  const cat = ISSUE_CATEGORIES[i.ai_category] || ISSUE_CATEGORIES.uncategorized
                  const prio = ISSUE_PRIORITIES[i.priority] || ISSUE_PRIORITIES.medium
                  const stat = ISSUE_STATUSES[i.status] || ISSUE_STATUSES.open
                  const CatIcon = cat.icon
                  
                  return (
                    <tr key={i.id} style={{ borderBottom: `1px solid ${C.border}` }} className="row-hover">
                      <td style={{ padding: "12px 24px", whiteSpace: "nowrap", color: C.text }}>{i.reported_date}</td>
                      <td style={{ padding: "12px 24px", fontWeight: 600, color: C.text }}>{i.projects?.name}</td>
                      <td style={{ padding: "12px 24px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cat.bg, color: cat.color, padding: "4px 10px", borderRadius: 20, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>
                          <CatIcon size={12} /> {cat.label}
                        </div>
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        <Badge label={prio.label} bg={prio.bg} color={prio.color} />
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        <Badge label={stat.label} bg={stat.bg} color={stat.color} />
                      </td>
                      <td style={{ padding: "12px 24px", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.text }} title={i.description}>
                        {i.description}
                      </td>
                      <td style={{ padding: "12px 24px", textAlign: "center" }}>
                        <button onClick={() => {
                          setActiveIssue(i)
                          setUpdStatus(i.status)
                          setUpdNotes(i.resolution_notes || "")
                        }} style={{ background: "none", border: "none", color: C.info, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                          Update
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeIssue && (
        <Modal title="Update Issue Status" onClose={() => setActiveIssue(null)}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: C.textMuted }}><strong>Project:</strong> {activeIssue.projects?.name}</p>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: C.textMuted }}><strong>Reported:</strong> {activeIssue.reported_date}</p>
            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 8, fontSize: 14, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              {activeIssue.description}
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Select label="Status" value={updStatus} onChange={e => setUpdStatus(e.target.value)} required
              options={[
                { value: "open", label: "Open" },
                { value: "in_progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" }
              ]} />
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>Resolution Notes</label>
              <textarea 
                value={updNotes} onChange={e => setUpdNotes(e.target.value)}
                placeholder="How was this resolved? What's the current status?"
                style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: FONT, fontSize: 14, minHeight: 80, boxSizing: "border-box", outline: "none" }}
                className="input-glow"
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Btn variant="secondary" onClick={() => setActiveIssue(null)}>Cancel</Btn>
              <Btn onClick={handleUpdateStatus} disabled={updating}>{updating ? "Saving..." : "Save Update"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

const buildAgentContext = (projects, reports, materials = [], issues = []) => {
  if (!projects?.length) return "No project data available."
  const lines = []

  lines.push("=== PROJECTS ===")
  projects.forEach(p => {
    const pct       = p.total_cost > 0 ? Math.round(((p.total_spent || 0) / p.total_cost) * 100) : 0
    const remaining = (p.total_cost || 0) - (p.total_spent || 0)
    lines.push(`Project: ${p.name}`)
    lines.push(`  Status: ${p.status} | Start: ${p.start_date || "N/A"} | Due: ${p.target_end_date || "N/A"}`)
    lines.push(`  Budget: ₹${(p.total_cost || 0).toLocaleString("en-IN")} | Spent: ₹${(p.total_spent || 0).toLocaleString("en-IN")} | Remaining: ₹${remaining.toLocaleString("en-IN")} (${pct}% used)`)
    if (p.area_of_site) lines.push(`  Site Area: ${p.area_of_site} sqft`)
    lines.push("")
  })

  if (reports?.length) {
    lines.push("=== RECENT DAILY PROGRESS REPORTS (last 30) ===")
    reports.slice(0, 30).forEach(r => {
      lines.push(`${r.report_date} | ${r.projects?.name || "Unknown Project"} | Floor: ${r.floor} | Stage: ${r.stage} | Manpower: ${r.manpower_count || 0} | Cost: ₹${(r.total_cost || 0).toLocaleString("en-IN")}`)
    })
    lines.push("")
    lines.push("=== REPORTING ACTIVITY (last 7 days) ===")
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    projects.forEach(p => {
      const recentCount = reports.filter(r => r.project_id === p.id && new Date(r.report_date) >= sevenDaysAgo).length
      lines.push(`${p.name}: ${recentCount} DPR(s) in last 7 days${recentCount === 0 ? " ⚠ NO RECENT REPORTS" : ""}`)
    })
    lines.push("")
  }

  if (materials?.length) {
    lines.push("=== MATERIAL STOCK ===")
    materials.forEach(m => {
      const alert = m.current_stock <= m.min_stock_level ? " ⚠ LOW STOCK" : ""
      lines.push(`${m.name} (${m.category}): ${m.current_stock} ${m.unit} remaining | Min threshold: ${m.min_stock_level}${alert}`)
    })
    lines.push("")
  }

  lines.push("=== RISK FLAGS ===")
  const risks = []
  projects.forEach(p => {
    const pct = p.total_cost > 0 ? Math.round(((p.total_spent || 0) / p.total_cost) * 100) : 0
    if (pct >= 90)  risks.push(`BUDGET RISK: ${p.name} has used ${pct}% of budget (₹${(p.total_spent || 0).toLocaleString("en-IN")} of ₹${(p.total_cost || 0).toLocaleString("en-IN")})`)
    if (pct > 100)  risks.push(`BUDGET OVERRUN: ${p.name} has exceeded budget by ₹${((p.total_spent || 0) - (p.total_cost || 0)).toLocaleString("en-IN")}`)
  })
  materials?.forEach(m => {
    if (m.current_stock <= m.min_stock_level)
      risks.push(`LOW STOCK: ${m.name} — only ${m.current_stock} ${m.unit} left (min: ${m.min_stock_level})`)
  })
  if (risks.length === 0) risks.push("No critical risks detected at this time.")
  risks.forEach(r => lines.push(r))

  if (issues?.length) {
    lines.push("")
    lines.push("=== ACTIVE SITE ISSUES ===")
    const activeIssues = issues.filter(i => i.status === "open" || i.status === "in_progress")
    activeIssues.forEach(i => {
      lines.push(`${i.reported_date} | Project: ${i.projects?.name} | Priority: ${i.priority} | AI Category: ${i.ai_category}`)
      lines.push(`  Description: ${i.description}`)
    })
    if (activeIssues.length === 0) lines.push("No active site issues.")
    lines.push("")
  }

  return lines.join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — AI Assistant
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "📊 Summarise all projects",       prompt: "Give me a concise summary of all my projects — current status, budget health, and key progress points." },
  { label: "⚠️ Flag risks",                   prompt: "Scan all my project data and flag any risks — budget overruns, low material stock, projects with no recent DPRs, or anything else that needs attention." },
  { label: "📅 What needs attention this week?", prompt: "Based on my current project data, what are the top 3–5 things I should focus on this week?" },
]

const AIAssistant = ({ projects, reports, materials, issues, notifications, onMarkAllRead }) => {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `👷 **BuildTrack AI Assistant** is ready.\n\nI have access to all your project data — budgets, daily reports, materials, and stage progress. Ask me anything about your projects, or use the quick actions below.\n\nYou can write in English or Hindi — I'll respond in the same language.`
  }])
  const [input,   setInput]   = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput(""); setError("")
    const newMessages = [...messages, { role: "user", content: userText }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const context     = buildAgentContext(projects, reports, materials, issues)
      const apiMessages = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res  = await fetch("https://zdcuroihwhtixolkxgbj.supabase.co/functions/v1/ai-agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, context }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.")
        setMessages(prev => prev.slice(0, -1))
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
      }
    } catch {
      setError("Could not reach the AI service. Check your internet connection and try again.")
      setMessages(prev => prev.slice(0, -1))
    }
    setLoading(false)
  }

  /** Converts minimal markdown (bold) and newlines to safe HTML for dangerouslySetInnerHTML. */
  const renderContent = text =>
    text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>")

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: 0 }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 16px", borderBottom: `1px solid ${C.border}`, background: C.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: C.accent, borderRadius: 10, padding: 8, display: "flex" }}><Bot size={20} color="#fff" /></div>
          <div>
            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>AI Assistant</h2>
            <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>Powered by Llama 3.3 via Groq · {projects?.length || 0} projects in context</p>
          </div>
        </div>
        <button onClick={() => setMessages([{ role: "assistant", content: "👷 **BuildTrack AI Assistant** is ready.\n\nI have access to all your project data. Ask me anything or use the quick actions below.\n\nYou can write in English or Hindi." }])}
          style={{ background: "#F1F5F9", border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: FONT, fontSize: 12, color: C.textMuted, cursor: "pointer", fontWeight: 600 }}>
          Clear chat
        </button>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "14px 28px", borderBottom: `1px solid ${C.border}`, background: C.card, display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} onClick={() => sendMessage(a.prompt)} disabled={loading}
            style={{ background: C.accentLight, border: `1px solid ${C.accent}40`, borderRadius: 20, padding: "6px 14px", fontFamily: FONT, fontSize: 12, color: C.accent, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.5 : 1, transition: "all 0.15s" }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Message thread */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16, background: C.bg }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                <Bot size={14} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: "72%",
              background: m.role === "user" ? C.accent : C.card,
              color: m.role === "user" ? "#fff" : C.text,
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "12px 16px", fontFamily: FONT, fontSize: 13, lineHeight: 1.6,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
            }} dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={14} color="#fff" /></div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px 16px 16px 4px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, background: C.accent, borderRadius: "50%", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />)}
              <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
            </div>
          </div>
        )}
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 16px", fontFamily: FONT, fontSize: 13, color: C.danger, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask about your projects, request a summary, or flag risks… (Enter to send, Shift+Enter for new line)"
            rows={2} disabled={loading}
            style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: C.text, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", resize: "none", outline: "none", lineHeight: 1.5, opacity: loading ? 0.6 : 1 }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            style={{ background: input.trim() && !loading ? C.accent : C.border, border: "none", borderRadius: 12, padding: "10px 16px", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", flexShrink: 0, height: 44 }}>
            <Send size={16} color="#fff" />
          </button>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 11, color: C.textLight, margin: "6px 0 0" }}>
          Press Enter to send · Shift+Enter for new line · Responds in English or Hindi
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
//
// Responsibilities:
//  - Auth state management via Supabase auth listener
//  - Global data loading (projects, reports, notifications) on sign-in
//  - Role-based project visibility (admin sees all; others see assigned only)
//  - Client-side routing via the `page` state variable
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const [screen,             setScreen]             = useState("landing")
  const [page,               setPage]               = useState("dashboard")
  const [user,               setUser]               = useState(null)
  const [userRole,           setUserRole]           = useState("viewer")
  const [assignedProjectIds, setAssignedProjectIds] = useState([])
  const [projects,           setProjects]           = useState([])
  const [reports,            setReports]            = useState([])
  const [issues,             setIssues]             = useState([])
  const [notifications,      setNotifications]      = useState([])
  const [loading,            setLoading]            = useState(true)
  const [activeProjectId,    setActiveProjectId]    = useState(null)
  const [scrollProgress,     setScrollProgress]     = useState(0)

  // Load Google Fonts once on mount
  useEffect(() => {
    const link = document.createElement("link")
    link.href = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap"
    link.rel  = "stylesheet"
    document.head.appendChild(link)
  }, [])

  /** Fetches the authenticated user's role from the profiles table. */
  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("role").eq("id", uid).single()
    if (data?.role) setUserRole(data.role)
  }

  /**
   * Fetches the project IDs the current user is explicitly assigned to.
   * Admin users bypass this filter and see all projects.
   */
  const fetchAssignedProjects = async (role) => {
    if (role === "admin") { setAssignedProjectIds([]); return }
    const { data } = await supabase.rpc("get_assigned_project_ids")
    setAssignedProjectIds(data || [])
  }

  // Restore session on mount and listen for auth state changes
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
        setUser(null); setUserRole("viewer"); setAssignedProjectIds([])
        setScreen("landing"); setProjects([]); setReports([]); setIssues([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load all data once the user is authenticated
  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      const [{ data: p }, { data: r }, { data: i }, { data: n }] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("daily_reports").select("*, projects(name)").order("report_date", { ascending: false }),
        supabase.from("site_issues").select("*, projects(name)").order("reported_date", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      ])
      setProjects(p || []); setReports(r || []); setIssues(i || []); setNotifications(n || [])
    }
    loadData()
  }, [user])

  // Re-fetch project assignments whenever the role resolves
  useEffect(() => {
    if (!user || !userRole || userRole === "viewer") return
    fetchAssignedProjects(userRole)
  }, [userRole])

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const handleMarkAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id)
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ background: C.accent, borderRadius: 16, padding: 16, display: "inline-flex", marginBottom: 16 }}><HardHat size={32} color="#fff" /></div>
        <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Loading BuildTrack...</p>
      </div>
    </div>
  )

  if (screen === "landing") return <Landing onLogin={() => setScreen("auth")} />
  if (screen === "auth")    return <Auth onSuccess={(u) => { setUser(u); fetchProfile(u.id); setScreen("app") }} />

  /** Admin sees every project; all other roles see only assigned projects. */
  const visibleProjects = userRole === "admin"
    ? projects
    : projects.filter(p => assignedProjectIds.includes(p.id))

  const handleCardClick = (projId) => { setActiveProjectId(projId); setPage("project-detail") }

  /** Props shared by every page that renders a TopBar. */
  const sharedProps = { notifications, onMarkAllRead: handleMarkAllRead }

  // ── Client-side page router ─────────────────────────────────────────────────
  const PAGES = {
    dashboard:        <Dashboard     user={user} setPage={setPage} projects={visibleProjects} reports={reports} />,
    projects:         <Projects      user={user} projects={visibleProjects} setProjects={setProjects} onCardClick={handleCardClick} {...sharedProps} />,
    "submit-dpr":     <SubmitDPR     user={user} projects={visibleProjects} setReports={setReports} {...sharedProps} />,
    labour:           <LabourRegister user={user} projects={visibleProjects} {...sharedProps} />,
    reports:          <Reports       user={user} userRole={userRole} projects={visibleProjects} reports={reports} {...sharedProps} />,
    materials:        <Materials     user={user} projects={visibleProjects} {...sharedProps} />,
    financials:       <Financials    projects={visibleProjects} reports={reports} {...sharedProps} />,
    "site-issues":    <SiteIssues    user={user} projects={visibleProjects} {...sharedProps} />,
    "ai-assistant":   <AIAssistant   projects={visibleProjects} reports={reports} materials={[]} issues={issues} {...sharedProps} />,
    users:            <UserManagement user={user} userRole={userRole} projects={projects} {...sharedProps} />,
    "project-detail": <ProjectDetail
                        projectId={activeProjectId}
                        user={user} userRole={userRole}
                        projects={visibleProjects} setProjects={setProjects}
                        reports={reports}
                        onBack={() => setPage("projects")}
                        {...sharedProps}
                      />,
  }



  return (
    <>
      <style>{`
        @media (max-width: 1024px) {
          .modal-overlay { align-items: flex-end !important; padding: 0 !important; }
          .modal-content { border-radius: 20px 20px 0 0 !important; margin-top: auto !important; max-height: 85vh !important; }
          .responsive-table { border: 0 !important; display: block; }
          .responsive-table thead { display: none; }
          .responsive-table tbody { display: block; width: 100%; }
          .responsive-table tr { display: block; margin-bottom: 20px; border: 1px solid ${C.border}; border-radius: 12px; padding: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
          .responsive-table td { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${C.border}; padding: 10px 4px; text-align: right; }
          .responsive-table td:last-child { border-bottom: none; }
          .responsive-table td::before { content: attr(data-label); font-weight: 600; color: ${C.textMuted}; text-transform: uppercase; font-size: 11px; margin-right: 16px; text-align: left; }
          .chart-col { height: 250px !important; }
        }
      `}</style>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FONT }}>
        {!isMobile && <Sidebar page={page} setPage={setPage} user={user} userRole={userRole} onSignOut={handleSignOut} />}
      <main
        onScroll={e => {
          const main = e.currentTarget
          const scroll = main.scrollTop
          const max = main.scrollHeight - main.clientHeight
          setScrollProgress(max > 0 ? (scroll / max) * 100 : 0)
        }}
        style={{ flex: 1, overflowY: "auto", minWidth: 0, paddingBottom: isMobile ? 65 : 0 }}
      >
        <div key={page} className="page-fade-in">
          {PAGES[page] || PAGES.dashboard}
        </div>
      </main>
      {isMobile && <MobileNav page={page} setPage={setPage} user={user} userRole={userRole} onSignOut={handleSignOut} />}
      </div>
    </>
  )
}
