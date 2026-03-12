import { useState, useEffect } from "react"
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
  HardHat, Wrench, Truck
} from "lucide-react"

const FONT = "'Barlow', sans-serif"
const FONT_HEADING = "'Barlow Condensed', sans-serif"

const C = {
  sidebar: "#0D1B2A",
  sidebarHover: "#162435",
  accent: "#F97316",
  accentDark: "#EA6B0E",
  accentLight: "#FFF7ED",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  bg: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  navy: "#1E3A5F",
  charcoal: "#334155",
}

const MOCK_PROJECTS = [
  { id: "1", name: "Riverside Tower Block A", start_date: "2025-03-15", target_end_date: "2027-06-30", total_cost: 12500000, area_of_site: 4200, status: "active", latitude: 28.6139, longitude: 77.2090, spent: 3840000 },
  { id: "2", name: "Metro Commercial Complex", start_date: "2025-01-10", target_end_date: "2026-12-31", total_cost: 8750000, area_of_site: 2800, status: "active", latitude: 28.7041, longitude: 77.1025, spent: 5200000 },
  { id: "3", name: "Greenfield Residential Phase 2", start_date: "2024-10-28", target_end_date: "2026-04-15", total_cost: 5000000, area_of_site: 1800, status: "active", latitude: 28.4595, longitude: 77.0266, spent: 4750000 },
  { id: "4", name: "Highway Flyover Section 3", start_date: "2024-08-01", target_end_date: "2025-11-30", total_cost: 3200000, area_of_site: 900, status: "delayed", latitude: 28.5355, longitude: 77.3910, spent: 3180000 },
]

const MOCK_REPORTS = [
  { id: "r1", project: "Riverside Tower Block A", project_id: "1", stage: "Column Layout", floor: "Ground Floor", date: "2026-03-10", weather: "Sunny", manpower: 24, cost: 45200, labor: 22000, material: 18000, equipment: 4200, other: 1000, remarks: "Formwork for columns C12-C18 completed. Rebar cage placed." },
  { id: "r2", project: "Riverside Tower Block A", project_id: "1", stage: "Brickwork", floor: "Ground Floor", date: "2026-03-09", weather: "Cloudy", manpower: 18, cost: 32100, labor: 16000, material: 14000, equipment: 2100, other: 0, remarks: "External brickwork 40% complete on north elevation." },
  { id: "r3", project: "Metro Commercial Complex", project_id: "2", stage: "Floor Plan", floor: "First Floor", date: "2026-03-10", weather: "Sunny", manpower: 31, cost: 67800, labor: 32000, material: 28000, equipment: 7800, other: 0, remarks: "Slab casting complete for grid A1–D6." },
  { id: "r4", project: "Greenfield Residential Phase 2", project_id: "3", stage: "Site Preparation", floor: "Ground Floor", date: "2026-03-08", weather: "Rainy", manpower: 12, cost: 15600, labor: 8000, material: 5600, equipment: 2000, other: 0, remarks: "Excavation for plot 12-18 complete. Water table encountered at 3.2m." },
  { id: "r5", project: "Metro Commercial Complex", project_id: "2", stage: "Electrical", floor: "Ground Floor", date: "2026-03-07", weather: "Sunny", manpower: 8, cost: 28400, labor: 12000, material: 14400, equipment: 2000, other: 0, remarks: "Main conduit routing complete. Panel board installation in progress." },
]

const COST_TREND = [
  { date: "Oct '25", cost: 185000 }, { date: "Nov '25", cost: 320000 },
  { date: "Dec '25", cost: 410000 }, { date: "Jan '26", cost: 520000 },
  { date: "Feb '26", cost: 680000 }, { date: "Mar '26", cost: 440000 },
]

const MANPOWER_COST = [
  { date: "03/05", manpower: 18, daily_cost: 28000 },
  { date: "03/06", manpower: 22, daily_cost: 34000 },
  { date: "03/07", manpower: 8, daily_cost: 28400 },
  { date: "03/08", manpower: 12, daily_cost: 15600 },
  { date: "03/09", manpower: 18, daily_cost: 32100 },
  { date: "03/10", manpower: 31, daily_cost: 67800 },
]

const BUDGET_VS_ACTUAL = [
  { project: "Riverside", budget: 12500000, spent: 3840000 },
  { project: "Metro Complex", budget: 8750000, spent: 5200000 },
  { project: "Greenfield", budget: 5000000, spent: 4750000 },
  { project: "Highway", budget: 3200000, spent: 3180000 },
]

const COST_CATEGORIES = [
  { name: "Labor", value: 1580000, color: C.accent },
  { name: "Materials", value: 980000, color: C.info },
  { name: "Equipment", value: 320000, color: C.success },
  { name: "Subcontractor", value: 450000, color: C.warning },
  { name: "Other", value: 120000, color: C.charcoal },
]

const MATERIALS_DATA = [
  { id: "m1", name: "Portland Cement (OPC 53)", category: "Cement & Concrete", unit: "bag", cost_per_unit: 450, current_stock: 1240, min_stock: 500, supplier: "UltraTech Cement Ltd", total_value: 558000 },
  { id: "m2", name: "TMT Steel Bar 16mm", category: "Steel & Iron", unit: "kg", cost_per_unit: 68, current_stock: 8400, min_stock: 2000, supplier: "TATA Steel", total_value: 571200 },
  { id: "m3", name: "River Sand (M-Sand)", category: "Aggregates", unit: "cft", cost_per_unit: 55, current_stock: 2200, min_stock: 800, supplier: "Krishna Aggregates", total_value: 121000 },
  { id: "m4", name: "Coarse Aggregate 20mm", category: "Aggregates", unit: "cft", cost_per_unit: 48, current_stock: 320, min_stock: 600, supplier: "Krishna Aggregates", total_value: 15360 },
  { id: "m5", name: "AAC Blocks 600x200x150", category: "Masonry", unit: "piece", cost_per_unit: 62, current_stock: 4800, min_stock: 1000, supplier: "Siporex India", total_value: 297600 },
]

const USAGE_DATA = [
  { date: "2026-03-10", material: "Portland Cement", project: "Riverside Tower", qty: 120, unit: "bags", notes: "Slab casting column zone C" },
  { date: "2026-03-09", material: "TMT Steel Bar 16mm", project: "Metro Complex", qty: 850, unit: "kg", notes: "Floor slab reinforcement A1-D6" },
  { date: "2026-03-08", material: "River Sand", project: "Greenfield Residential", qty: 80, unit: "cft", notes: "Plaster work north block" },
  { date: "2026-03-07", material: "AAC Blocks", project: "Metro Complex", qty: 400, unit: "pieces", notes: "Internal partition walls" },
]

const PURCHASE_DATA = [
  { date: "2026-03-01", material: "Portland Cement", qty: 500, unit: "bags", unit_cost: 450, total: 225000, supplier: "UltraTech Cement Ltd", invoice: "INV-2026-0301" },
  { date: "2026-02-20", material: "TMT Steel Bar 16mm", qty: 5000, unit: "kg", unit_cost: 67, total: 335000, supplier: "TATA Steel", invoice: "INV-2026-0220" },
  { date: "2026-02-15", material: "AAC Blocks", qty: 3000, unit: "pieces", unit_cost: 61, total: 183000, supplier: "Siporex India", invoice: "INV-2026-0215" },
]

const STAGES_DATA = {
  "Layout / Plan / Drawings": [
    { name: "Site Plan", status: "Completed", progress: 100 },
    { name: "Footing Layout", status: "Completed", progress: 100 },
    { name: "Column Layout", status: "Completed", progress: 100 },
    { name: "Floor Plan - Ground Floor", status: "Completed", progress: 100 },
    { name: "Floor Plan - First Floor", status: "In Progress", progress: 65 },
    { name: "Floor Plan - Other Floors", status: "Not Started", progress: 0 },
  ],
  "Execution": [
    { name: "Site Preparation", status: "Completed", progress: 100 },
    { name: "Brick Work - Ground Floor", status: "Not Started", progress: 0 },
    { name: "Brick Work - First Floor", status: "Not Started", progress: 0 },
    { name: "Brick Work - Other Floors", status: "Not Started", progress: 0 },
    { name: "Door/Window Schedule - Ground Floor", status: "Not Started", progress: 0 },
    { name: "Door/Window Schedule - First Floor", status: "Not Started", progress: 0 },
    { name: "Door/Window Schedule - Other Floors", status: "Not Started", progress: 0 },
    { name: "Electrical Layout - Ground Floor", status: "Not Started", progress: 0 },
    { name: "Electrical Layout - First Floor", status: "Not Started", progress: 0 },
    { name: "Electrical Layout - Other Floors", status: "Not Started", progress: 0 },
    { name: "Plumbing Layout of Building", status: "Not Started", progress: 0 },
  ],
}

const PHOTO_MOCK = [
  { id: "p1", title: "Column formwork C12-C18", date: "Mar 10, 2026", stage: "Column Layout", weather: "Sunny", color: "#CBD5E1" },
  { id: "p2", title: "North elevation brickwork", date: "Mar 09, 2026", stage: "Brickwork", weather: "Cloudy", color: "#B0C4DE" },
  { id: "p3", title: "Rebar cage placement", date: "Mar 10, 2026", stage: "Column Layout", weather: "Sunny", color: "#94A3B8" },
  { id: "p4", title: "Site drainage installation", date: "Mar 08, 2026", stage: "Site Preparation", weather: "Rainy", color: "#7B93A8" },
  { id: "p5", title: "Electrical conduit routing", date: "Mar 07, 2026", stage: "Electrical", weather: "Sunny", color: "#9DB4C0" },
  { id: "p6", title: "Slab casting grid A1-D6", date: "Mar 10, 2026", stage: "Floor Plan", weather: "Sunny", color: "#B0BEC5" },
]

const NOTIFICATIONS = [
  { id: "n1", title: "Low Stock Alert", message: "Coarse Aggregate 20mm below minimum stock level (320 < 600)", type: "warning", time: "2h ago", read: false },
  { id: "n2", title: "Project Delay Detected", message: "Highway Flyover Section 3 is past target end date", type: "danger", time: "1d ago", read: false },
  { id: "n3", title: "DPR Submitted", message: "Daily Progress Report submitted for Metro Commercial Complex", type: "success", time: "3h ago", read: true },
  { id: "n4", title: "Budget Alert", message: "Greenfield Residential Phase 2 at 95% of total budget", type: "warning", time: "2d ago", read: true },
]

const USERS_DATA = [
  { id: "u1", name: "Tarun Rawat", email: "rwttarun9@gmail.com", role: "Admin", projects: ["Riverside Tower Block A", "Metro Commercial Complex"], joined: "Oct 2025", status: "active" },
  { id: "u2", name: "Priya Sharma", email: "priya.sharma@buildtrack.in", role: "Project Manager", projects: ["Greenfield Residential Phase 2"], joined: "Nov 2025", status: "active" },
  { id: "u3", name: "Arjun Verma", email: "arjun.v@buildtrack.in", role: "Site Engineer", projects: ["Highway Flyover Section 3", "Riverside Tower Block A"], joined: "Jan 2026", status: "active" },
  { id: "u4", name: "Sneha Gupta", email: "sneha.g@buildtrack.in", role: "Accountant", projects: ["Metro Commercial Complex"], joined: "Dec 2025", status: "inactive" },
]

// ─── Shared Components ───────────────────────────────────────────────────────

const Badge = ({ label, color, bg }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: FONT, background: bg, color, letterSpacing: "0.03em" }}>
    {label}
  </span>
)

const StatusBadge = ({ status }) => {
  const map = {
    "Completed": { color: C.success, bg: "#D1FAE5" },
    "In Progress": { color: C.info, bg: "#DBEAFE" },
    "Not Started": { color: C.textMuted, bg: "#F1F5F9" },
    "active": { color: C.success, bg: "#D1FAE5" },
    "delayed": { color: C.danger, bg: "#FEE2E2" },
    "inactive": { color: C.textMuted, bg: "#F1F5F9" },
    "Admin": { color: C.accent, bg: "#FFF7ED" },
    "Project Manager": { color: C.info, bg: "#DBEAFE" },
    "Site Engineer": { color: C.success, bg: "#D1FAE5" },
    "Accountant": { color: C.warning, bg: "#FEF3C7" },
    "Cement & Concrete": { color: "#92400E", bg: "#FEF3C7" },
    "Steel & Iron": { color: "#1E3A5F", bg: "#DBEAFE" },
    "Aggregates": { color: "#065F46", bg: "#D1FAE5" },
    "Masonry": { color: "#6B21A8", bg: "#F3E8FF" },
    "Electrical": { color: "#B45309", bg: "#FEF3C7" },
    "Plumbing": { color: "#0369A1", bg: "#E0F2FE" },
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
    {trend && (
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
        <TrendingUp size={12} color={C.success} />
        <span style={{ fontFamily: FONT, fontSize: 11, color: C.success, fontWeight: 600 }}>{trend}</span>
      </div>
    )}
  </div>
)

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.card, borderRadius: "12px 12px 0 0", padding: "0 24px" }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        fontFamily: FONT, fontSize: 13, fontWeight: active === t ? 700 : 500,
        color: active === t ? C.accent : C.textMuted,
        padding: "14px 20px", border: "none", background: "none", cursor: "pointer",
        borderBottom: active === t ? `2px solid ${C.accent}` : "2px solid transparent",
        marginBottom: -1, transition: "all 0.15s", whiteSpace: "nowrap"
      }}>{t}</button>
    ))}
  </div>
)

const Input = ({ label, type = "text", value, onChange, placeholder, required, icon: Icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>}
    <div style={{ position: "relative" }}>
      {Icon && <Icon size={15} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
        width: "100%", boxSizing: "border-box", padding: Icon ? "10px 12px 10px 36px" : "10px 14px",
        fontFamily: FONT, fontSize: 14, color: C.text, background: "#F8FAFC",
        border: `1px solid ${C.border}`, borderRadius: 8, outline: "none",
        transition: "border-color 0.15s"
      }} onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border} />
    </div>
  </div>
)

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>}
    <select value={value} onChange={onChange} style={{
      padding: "10px 14px", fontFamily: FONT, fontSize: 14, color: C.text,
      background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, outline: "none", cursor: "pointer"
    }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
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
  const sizes = {
    sm: { padding: "6px 14px", fontSize: 12 },
    md: { padding: "9px 18px", fontSize: 13 },
    lg: { padding: "12px 24px", fontSize: 14 },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], ...sizes[size],
      fontFamily: FONT, fontWeight: 600, borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s",
      opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap",
      ...(extraStyle || {})
    }}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </button>
  )
}

const Modal = ({ title, onClose, children, width = 560 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: C.card, borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.card, borderRadius: "16px 16px 0 0", zIndex: 1 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "0.02em" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><X size={16} color={C.textMuted} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
)

const ProgressBar = ({ value, color = C.accent, height = 6 }) => (
  <div style={{ background: "#E2E8F0", borderRadius: height, height, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, value)}%`, height: "100%", background: value >= 100 ? C.success : value >= 60 ? color : value > 0 ? C.warning : "#E2E8F0", borderRadius: height, transition: "width 0.4s ease" }} />
  </div>
)

const WeatherIcon = ({ w }) => {
  if (w?.toLowerCase().includes("rain")) return <CloudRain size={14} color={C.info} />
  if (w?.toLowerCase().includes("cloud")) return <Cloud size={14} color={C.textMuted} />
  return <Sun size={14} color={C.warning} />
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderOpen },
  { key: "submit-dpr", label: "Submit DPR", icon: FileText },
  { key: "reports", label: "Reports", icon: BarChart2 },
  { key: "materials", label: "Materials", icon: Package },
  { key: "financials", label: "Financials", icon: DollarSign },
  { key: "users", label: "User Management", icon: Users },
]

const Sidebar = ({ page, setPage, user, onSignOut }) => {
  return (
    <div style={{ width: 240, minWidth: 240, background: C.sidebar, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 100 }}>
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: C.accent, borderRadius: 10, padding: "7px 8px", display: "flex" }}>
            <HardHat size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: FONT_HEADING, fontSize: 17, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.03em" }}>BUILDTRACK</p>
            <p style={{ fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Construction OS</p>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = page === key
          return (
            <button key={key} onClick={() => setPage(key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px",
              borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left",
              background: active ? `${C.accent}25` : "transparent",
              color: active ? C.accent : "rgba(255,255,255,0.55)",
              transition: "all 0.15s", fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 400,
              borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent"
            }}>
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>
      <div style={{ padding: "14px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 6 }}>
          <div style={{ background: C.accent, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={15} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Tarun Rawat</p>
            <p style={{ fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user || "Admin"}</p>
          </div>
        </div>
        <button onClick={onSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.4)", fontFamily: FONT, fontSize: 12, fontWeight: 500, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#EF4444" }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)" }}>
          <LogOut size={14} />Sign Out
        </button>
      </div>
    </div>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

const TopBar = ({ title, subtitle, actions, notifications: notifsProp, setShowNotif, showNotif }) => {
  const [search, setSearch] = useState("")
  const [notifications, setNotifications] = useState(notifsProp)
  const unread = notifications.filter(n => !n.read).length
  return (
    <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, position: "sticky", top: 0, zIndex: 50 }}>
      <div>
        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, justifyContent: "flex-end" }}>
        <div style={{ position: "relative", maxWidth: 280, flex: 1 }}>
          <Search size={14} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects, reports..." style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px 8px 34px", fontFamily: FONT, fontSize: 13, color: C.text, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, outline: "none" }} />
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowNotif(!showNotif)} style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", position: "relative" }}>
            <Bell size={16} color={C.textMuted} />
            {unread > 0 && <span style={{ position: "absolute", top: 6, right: 6, background: C.danger, borderRadius: "50%", width: 8, height: 8 }} />}
          </button>
          {showNotif && (
            <div style={{ position: "absolute", right: 0, top: 44, width: 340, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", zIndex: 200 }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text }}>Notifications</span>
                <Badge label={`${unread} unread`} color={C.danger} bg="#FEE2E2" />
              </div>
              {notifications.map(n => (
                <div key={n.id} style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, background: n.read ? C.card : "#FAFBFF", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ marginTop: 2 }}>
                    {n.type === "warning" && <AlertTriangle size={14} color={C.warning} />}
                    {n.type === "danger" && <AlertCircle size={14} color={C.danger} />}
                    {n.type === "success" && <CheckCircle size={14} color={C.success} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 2px" }}>{n.title}</p>
                    <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "0 0 4px", lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontFamily: FONT, fontSize: 10, color: C.textLight, margin: 0 }}>{n.time}</p>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, marginTop: 4, flexShrink: 0 }} />}
                </div>
              ))}
              <div style={{ padding: "10px 18px" }}>
                <button onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))} style={{ fontFamily: FONT, fontSize: 12, color: C.accent, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Mark all as read</button>
              </div>
            </div>
          )}
        </div>
        {actions}
      </div>
    </div>
  )
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

const Landing = ({ onLogin }) => {
  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: FONT }}>
      <div style={{ position: "relative", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0D1B2A 0%, #1E3A5F 40%, #0D1B2A 100%)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${(i % 5) * 25}%`, top: `${Math.floor(i / 5) * 33}%`, width: 200, height: 200, border: "1px solid #F97316", borderRadius: "50%", transform: "scale(0.5)" }} />
          ))}
        </div>
        <nav style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 60px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: C.accent, borderRadius: 12, padding: "8px 10px", display: "flex" }}><HardHat size={22} color="#fff" /></div>
            <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>BUILDTRACK</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn onClick={() => onLogin("view")} variant="ghost" style={{ color: "#fff" }}>View Report</Btn>
            <Btn onClick={() => onLogin("login")} variant="primary">Admin Login</Btn>
          </div>
        </nav>
        <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 28 }}>
            <Building2 size={14} color={C.accent} />
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>Professional Construction Management</span>
          </div>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 64, fontWeight: 900, color: "#fff", margin: "0 0 18px", lineHeight: 1.05, letterSpacing: "-0.01em", maxWidth: 800 }}>
            Daily Progress Report<br />
            <span style={{ color: C.accent }}>Automation</span> of Construction
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 18, color: "rgba(255,255,255,0.6)", maxWidth: 560, margin: "0 0 40px", lineHeight: 1.6 }}>
            Real-time construction project tracking with intelligent delay analysis, cost monitoring, and team coordination.
          </p>
          <div style={{ display: "flex", gap: 14 }}>
            <button onClick={() => onLogin("view")} style={{ padding: "14px 32px", background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 10, fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer" }}>View Full Report</button>
            <button onClick={() => onLogin("login")} style={{ padding: "14px 32px", background: C.accent, border: `2px solid ${C.accent}`, borderRadius: 10, fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Admin Login →</button>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "center", gap: 48, padding: "24px 60px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {[["4", "Active Projects"], ["₹2.97Cr", "Total Budget"], ["93", "DPRs Submitted"], ["3", "Teams"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: FONT_HEADING, fontSize: 26, fontWeight: 800, color: C.accent, margin: 0 }}>{v}</p>
              <p style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────

const Auth = ({ onSuccess }) => {
  const [tab, setTab] = useState("signin")
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handle = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setSuccess(true); setTimeout(() => onSuccess(email), 600) }, 1200)
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0D1B2A 0%, #1E3A5F 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 20, width: "100%", maxWidth: 440, padding: 40, boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ background: C.accent, borderRadius: 10, padding: "7px 8px", display: "flex" }}><HardHat size={18} color="#fff" /></div>
          <span style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "0.03em" }}>BUILDTRACK</span>
        </div>
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {["signin", "signup"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", fontFamily: FONT, fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer", background: tab === t ? C.card : "transparent", color: tab === t ? C.text : C.textMuted, transition: "all 0.15s", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>{tab === "signin" ? "Welcome Back" : "Create Account"}</h2>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: "0 0 24px" }}>{tab === "signin" ? "Sign in to your account" : "Get started with BuildTrack"}</p>
        {success ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px 0" }}>
            <div style={{ background: "#D1FAE5", borderRadius: "50%", padding: 16 }}><CheckCircle size={28} color={C.success} /></div>
            <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.success }}>Signed in successfully!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {tab === "signup" && <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" icon={User} />}
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" icon={User} required />
            <Input label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter your password" required />
            <button onClick={handle} disabled={loading || !email || !pass} style={{ padding: "12px", background: loading ? C.textLight : C.accent, color: "#fff", border: "none", borderRadius: 8, fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 4, transition: "all 0.2s" }}>
              {loading ? "Signing in..." : tab === "signin" ? "Sign In" : "Create Account"}
            </button>
            {tab === "signin" && <button style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, background: "none", border: "none", cursor: "pointer" }}>Forgot your password?</button>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

const Dashboard = ({ user, setPage, notifications, setShowNotif, showNotif }) => {
  const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  const cards = [
    { key: "projects", icon: FolderOpen, label: "Create Project", desc: "Create and manage your construction projects", action: "Create Project", accent: C.accent },
    { key: "submit-dpr", icon: FileText, label: "Submit Daily Report", desc: "Submit your Daily Progress Report (DPR) for a construction project", action: "Submit DPR", accent: C.info },
    { key: "reports", icon: BarChart2, label: "View Reports", desc: "View all submitted DPRs and project analytics", action: "View Reports", accent: C.success },
    { key: "materials", icon: Package, label: "Materials & Inventory", desc: "Track materials, inventory levels, and usage", action: "Manage Materials", accent: C.warning },
    { key: "financials", icon: DollarSign, label: "Financial Dashboard", desc: "Advanced financial analysis and budgeting", action: "View Financials", accent: "#8B5CF6" },
    { key: "users", icon: Users, label: "User Management", desc: "Manage user roles and project assignments", action: "Manage Users", accent: C.charcoal },
  ]
  return (
    <div>
      <TopBar title="Admin Dashboard" subtitle="Manage your construction projects" notifications={notifications} setShowNotif={setShowNotif} showNotif={showNotif} />
      <div style={{ padding: 32 }}>
        <div style={{ background: C.card, borderRadius: 14, padding: 24, marginBottom: 28, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Welcome, {user?.split("@")[0] || "Admin"}</h2>
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: "0 0 12px" }}>Manage your construction projects</p>
            <div style={{ display: "flex", gap: 24 }}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}><strong style={{ color: C.text }}>Last Sign In:</strong> {now}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[["4", "Projects", C.accent], ["14", "Reports", C.info], ["3", "Alerts", C.danger]].map(([v, l, c]) => (
              <div key={l} style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", textAlign: "center" }}>
                <p style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: c, margin: 0 }}>{v}</p>
                <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {cards.map(({ key, icon: Icon, label, desc, action, accent }) => (
            <div key={key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 14, transition: "box-shadow 0.15s", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: accent + "20", borderRadius: 10, padding: 10, display: "flex" }}>
                  <Icon size={20} color={accent} />
                </div>
                <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "0.02em" }}>{label}</h3>
              </div>
              <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.5, flex: 1 }}>{desc}</p>
              <Btn onClick={() => setPage(key)} variant="primary" size="sm" icon={ChevronRight}
                style={{ background: accent, border: `1px solid ${accent}` }}>{action}</Btn>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

const Projects = ({ setPage, notifications, setShowNotif, showNotif }) => {
  const [projects, setProjects] = useState(MOCK_PROJECTS)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: "", start_date: "", target_end_date: "", total_cost: "", area_of_site: "", latitude: "", longitude: "" })

  const pct = p => Math.round((p.spent / p.total_cost) * 100)

  const openCreate = () => {
    setEditId(null)
    setForm({ name: "", start_date: "", target_end_date: "", total_cost: "", area_of_site: "", latitude: "", longitude: "" })
    setShowModal(true)
  }
  const openEdit = p => {
    setEditId(p.id)
    setForm({ name: p.name, start_date: p.start_date, target_end_date: p.target_end_date, total_cost: p.total_cost, area_of_site: p.area_of_site, latitude: p.latitude, longitude: p.longitude })
    setShowModal(true)
  }
  const handleSave = () => {
    if (editId) {
      setProjects(projects.map(x => x.id === editId ? { ...x, ...form, total_cost: parseFloat(form.total_cost) || x.total_cost, area_of_site: parseFloat(form.area_of_site) || x.area_of_site } : x))
    } else {
      setProjects([...projects, { id: Date.now().toString(), ...form, total_cost: parseFloat(form.total_cost) || 0, area_of_site: parseFloat(form.area_of_site) || 0, spent: 0, status: "active" }])
    }
    setShowModal(false)
    setEditId(null)
    setForm({ name: "", start_date: "", target_end_date: "", total_cost: "", area_of_site: "", latitude: "", longitude: "" })
  }

  return (
    <div>
      <TopBar title="Your Projects" subtitle={`${projects.length} projects total`}
        actions={<Btn onClick={openCreate} variant="primary" icon={Plus}>New Project</Btn>}
        notifications={notifications} setShowNotif={setShowNotif} showNotif={showNotif} />
      <div style={{ padding: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, transition: "box-shadow 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 17, fontWeight: 800, color: C.text, margin: "0 0 6px", letterSpacing: "0.01em" }}>{p.name}</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusBadge status={p.status} />
                    {p.status === "delayed" && <Badge label="⚠ Past Due" color={C.danger} bg="#FEE2E2" />}
                  </div>
                </div>
                <button style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", display: "flex" }}><MoreVertical size={14} color={C.textMuted} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  [Calendar, `Started: ${p.start_date}`],
                  [Calendar, `Target: ${p.target_end_date}`],
                  [DollarSign, `Budget: ₹${(p.total_cost / 100000).toFixed(1)}L`],
                  [MapPin, `Area: ${p.area_of_site} sq.m`],
                ].map(([Icon, text], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={12} color={C.textMuted} />
                    <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Budget Utilized</span>
                  <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: pct(p) > 90 ? C.danger : C.text }}>{pct(p)}%</span>
                </div>
                <ProgressBar value={pct(p)} color={pct(p) > 90 ? C.danger : C.accent} height={8} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>Spent: ₹{(p.spent / 100000).toFixed(1)}L</span>
                  <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>Total: ₹{(p.total_cost / 100000).toFixed(1)}L</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={() => setPage("reports")} variant="secondary" size="sm" icon={Eye}>View Details</Btn>
                <Btn onClick={() => openEdit(p)} variant="secondary" size="sm" icon={Edit3}>Edit</Btn>
                <Btn onClick={() => setProjects(projects.filter(x => x.id !== p.id))} variant="ghost" size="sm" icon={Trash2}><span style={{ color: C.danger }}>Delete</span></Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <Modal title={editId ? "Edit Project" : "Create New Project"} onClose={() => { setShowModal(false); setEditId(null) }} width={600}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Project Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Riverside Tower Block B" required />
            </div>
            <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
            <Input label="Target End Date" type="date" value={form.target_end_date} onChange={e => setForm({ ...form, target_end_date: e.target.value })} />
            <Input label="Total Budget (₹)" type="number" value={form.total_cost} onChange={e => setForm({ ...form, total_cost: e.target.value })} placeholder="e.g., 5000000" />
            <Input label="Area of Site (sq.m)" type="number" value={form.area_of_site} onChange={e => setForm({ ...form, area_of_site: e.target.value })} placeholder="e.g., 1200" />
            <Input label="Latitude" type="number" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="e.g., 28.6139" icon={MapPin} />
            <Input label="Longitude" type="number" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="e.g., 77.2090" icon={MapPin} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <Btn onClick={() => { setShowModal(false); setEditId(null) }} variant="secondary">Cancel</Btn>
            <Btn onClick={handleSave} variant="primary" icon={editId ? CheckCircle : Plus}>{editId ? "Save Changes" : "Create Project"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── SUBMIT DPR ───────────────────────────────────────────────────────────────

const floors = ["Ground Floor", "First Floor", "Other Floors"]
const stagesByFloor = {
  "Ground Floor": ["Site Preparation", "Foundation & Footing", "Column Construction", "Beam & Slab", "Brickwork / Masonry", "Door Schedule", "Electrical Works", "Plumbing"],
  "First Floor": ["Column Construction", "Beam & Slab", "Brickwork / Masonry", "Door Schedule", "Electrical Works", "Plumbing"],
  "Other Floors": ["Column Construction", "Beam & Slab", "Brickwork / Masonry", "Door Schedule", "Electrical Works", "Plumbing"],
}

const SubmitDPR = ({ notifications, setShowNotif, showNotif }) => {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({ project: "", date: today, weather: "", floor: "", stage: "", manpower: "", machinery: "", work_completed: "", materials_used: "", safety: "", remarks: "", labor: "0", material: "0", equipment: "0", subcontractor: "0", other: "0" })
  const [submitted, setSubmitted] = useState(false)

  const total = ["labor", "material", "equipment", "subcontractor", "other"].reduce((s, k) => s + (parseFloat(form[k]) || 0), 0)

  if (submitted) return (
    <div>
      <TopBar title="Submit Daily Progress Report" notifications={notifications} setShowNotif={setShowNotif} showNotif={showNotif} />
      <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
        <div style={{ background: "#D1FAE5", borderRadius: "50%", padding: 20 }}><CheckCircle size={40} color={C.success} /></div>
        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>DPR Submitted Successfully</h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.textMuted }}>Your daily progress report has been recorded.</p>
        <Btn onClick={() => setSubmitted(false)} variant="primary">Submit Another DPR</Btn>
      </div>
    </div>
  )

  return (
    <div>
      <TopBar title="Submit Daily Progress Report" notifications={notifications} setShowNotif={setShowNotif} showNotif={showNotif} />
      <div style={{ padding: 32 }}>
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, maxWidth: 760, margin: "0 auto" }}>
          <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Project Details</h3>
          </div>
          <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Select label="Project Name" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required
                options={[{ value: "", label: "Select a project..." }, ...MOCK_PROJECTS.map(p => ({ value: p.id, label: p.name }))]} />
            </div>
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            <div>
              <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Weather</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["Sunny", Sun, C.warning], ["Cloudy", Cloud, C.textMuted], ["Rainy", CloudRain, C.info]].map(([w, Icon, c]) => (
                  <button key={w} onClick={() => setForm({ ...form, weather: w })} style={{ flex: 1, padding: "9px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, border: `1px solid ${form.weather === w ? c : C.border}`, background: form.weather === w ? c + "15" : "#F8FAFC", cursor: "pointer", fontFamily: FONT, fontSize: 12, fontWeight: form.weather === w ? 700 : 400, color: form.weather === w ? c : C.textMuted }}>
                    <Icon size={14} color={c} />{w}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Manpower Count" type="number" value={form.manpower} onChange={e => setForm({ ...form, manpower: e.target.value })} placeholder="e.g., 24" required />
            <Select label="Floor" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value, stage: "" })} required
              options={[{ value: "", label: "Select a floor..." }, ...floors.map(f => ({ value: f, label: f }))]} />
            <Select label="Project Stage" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} required
              options={form.floor ? [{ value: "", label: "Select a stage..." }, ...(stagesByFloor[form.floor] || []).map(s => ({ value: s, label: s }))] : [{ value: "", label: "First, select a floor..." }]} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Work Completed <span style={{ color: C.danger }}>*</span></label>
              <textarea value={form.work_completed} onChange={e => setForm({ ...form, work_completed: e.target.value })} placeholder="Describe the work completed today..." rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", fontFamily: FONT, fontSize: 14, color: C.text, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, resize: "vertical", outline: "none" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Machinery Used" value={form.machinery} onChange={e => setForm({ ...form, machinery: e.target.value })} placeholder="e.g., Tower Crane, Concrete Pump, Transit Mixer" icon={Truck} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Materials Used" value={form.materials_used} onChange={e => setForm({ ...form, materials_used: e.target.value })} placeholder="e.g., Cement: 120 bags, TMT bars: 850 kg" icon={Package} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Safety Incidents" value={form.safety} onChange={e => setForm({ ...form, safety: e.target.value })} placeholder="Any near-misses or incidents (leave blank if none)" icon={AlertTriangle} />
            </div>
          </div>
          <div style={{ padding: "0 28px 28px" }}>
            <div style={{ background: "#FAFBFF", border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <DollarSign size={16} color={C.accent} />
                <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>Cost Breakdown</h4>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[["labor", "Labor Cost"], ["material", "Material Cost"], ["equipment", "Equipment Cost"], ["subcontractor", "Subcontractor Cost"], ["other", "Other Costs"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>{l} (₹)</label>
                    <input type="number" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", fontFamily: FONT, fontSize: 14, color: C.text, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, outline: "none" }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Total Cost (₹)</label>
                  <div style={{ padding: "8px 12px", background: C.accent + "15", border: `1px solid ${C.accent}40`, borderRadius: 8, fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 800, color: C.accent }}>₹{total.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "0 28px 28px" }}>
            <Input label="Remarks & Notes" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Any additional notes or observations for today's report" />
          </div>
          <div style={{ padding: "20px 28px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="secondary">Save as Draft</Btn>
            <Btn onClick={() => { if (form.project && form.date && form.floor && form.stage) setSubmitted(true) }} variant="primary" icon={CheckCircle}>Submit DPR</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Download Utilities ───────────────────────────────────────────────────────

const downloadCSV = (reports) => {
  const headers = ["Project", "Floor", "Stage", "Date", "Weather", "Manpower", "Labor Cost", "Material Cost", "Equipment Cost", "Other Cost", "Total Cost", "Remarks"]
  const rows = reports.map(r => [
    r.project, r.floor, r.stage, r.date, r.weather, r.manpower,
    r.labor, r.material, r.equipment, r.other, r.cost, `"${r.remarks}"`
  ])
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `BuildTrack_Report_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

const downloadPDF = (reports, projects) => {
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0)
  const totalBudget = projects.reduce((s, p) => s + p.total_cost, 0)
  const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })

  const html = `<!DOCTYPE html><html><head><title>BuildTrack Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #0F172A; }
    h1 { color: #F97316; border-bottom: 3px solid #F97316; padding-bottom: 10px; }
    h2 { color: #1E3A5F; margin-top: 28px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; }
    .kpi-row { display: flex; gap: 20px; margin: 16px 0; }
    .kpi { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 20px; flex: 1; }
    .kpi-val { font-size: 22px; font-weight: 700; color: #F97316; }
    .kpi-label { font-size: 11px; color: #64748B; text-transform: uppercase; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th { background: #0D1B2A; color: #fff; padding: 8px 10px; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #E2E8F0; }
    tr:nth-child(even) td { background: #F8FAFC; }
    .footer { margin-top: 40px; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 12px; }
    @media print { body { margin: 20px; } }
  </style></head><body>
  <h1>&#127959; BUILDTRACK — Construction Progress Report</h1>
  <p style="color:#64748B;font-size:13px;">Generated on ${now} &nbsp;|&nbsp; Total Projects: ${projects.length} &nbsp;|&nbsp; Total DPRs: ${reports.length}</p>
  <h2>Project Summary</h2>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-val">&#8377;${(totalBudget/10000000).toFixed(2)}Cr</div><div class="kpi-label">Total Budget</div></div>
    <div class="kpi"><div class="kpi-val">&#8377;${(totalSpent/10000000).toFixed(2)}Cr</div><div class="kpi-label">Total Spent</div></div>
    <div class="kpi"><div class="kpi-val">${Math.round((totalSpent/totalBudget)*100)}%</div><div class="kpi-label">Budget Utilized</div></div>
    <div class="kpi"><div class="kpi-val">${projects.filter(p=>p.status==="delayed").length}</div><div class="kpi-label">Delayed Projects</div></div>
  </div>
  <h2>Projects</h2>
  <table><thead><tr><th>Project Name</th><th>Status</th><th>Budget (&#8377;)</th><th>Spent (&#8377;)</th><th>Utilized %</th><th>Area (sq.m)</th></tr></thead><tbody>
  ${projects.map(p=>`<tr><td>${p.name}</td><td>${p.status.toUpperCase()}</td><td>${p.total_cost.toLocaleString("en-IN")}</td><td>${p.spent.toLocaleString("en-IN")}</td><td>${Math.round((p.spent/p.total_cost)*100)}%</td><td>${p.area_of_site}</td></tr>`).join("")}
  </tbody></table>
  <h2>Daily Progress Reports</h2>
  <table><thead><tr><th>Date</th><th>Project</th><th>Stage</th><th>Floor</th><th>Weather</th><th>Workers</th><th>Total Cost (&#8377;)</th></tr></thead><tbody>
  ${reports.map(r=>`<tr><td>${r.date}</td><td>${r.project}</td><td>${r.stage}</td><td>${r.floor}</td><td>${r.weather}</td><td>${r.manpower}</td><td>${r.cost.toLocaleString("en-IN")}</td></tr>`).join("")}
  </tbody></table>
  <div class="footer">BuildTrack — Daily Progress Report Automation of Construction Work &nbsp;|&nbsp; Confidential</div>
  </body></html>`

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, "_blank")
  if (win) { win.onload = () => { win.print() } }
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

const Reports = ({ notifications, setShowNotif, showNotif }) => {
  const [tab, setTab] = useState("Overview")
  const [floorFilter, setFloorFilter] = useState("All Floors")
  const [projFilter, setProjFilter] = useState("All Projects")

  const filteredReports = MOCK_REPORTS.filter(r => projFilter === "All Projects" || r.project === projFilter)

  const totalSpent = MOCK_REPORTS.reduce((s, r) => s + r.cost, 0)
  const totalBudget = MOCK_PROJECTS.reduce((s, p) => s + p.total_cost, 0)
  const totalManpower = MOCK_REPORTS.reduce((s, r) => s + r.manpower, 0)
  const avgManpower = Math.round(totalManpower / MOCK_REPORTS.length)
  const delayedCount = MOCK_PROJECTS.filter(p => p.status === "delayed").length

  return (
    <div>
      <TopBar title="Project Reports" subtitle="Analytics, DPR history, and stage tracking"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => downloadPDF(MOCK_REPORTS, MOCK_PROJECTS)} variant="secondary" size="sm" icon={Download}>PDF Report</Btn>
            <Btn onClick={() => downloadCSV(MOCK_REPORTS)} variant="secondary" size="sm" icon={Download}>Excel Report</Btn>
          </div>
        }
        notifications={notifications} setShowNotif={setShowNotif} showNotif={showNotif} />
      <div style={{ padding: "20px 32px 0" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <KPICard label="Total Spent" value={`₹${(totalSpent / 100000).toFixed(1)}L`} icon={DollarSign} accent={C.accent} />
          <KPICard label="Total Budget" value={`₹${(totalBudget / 100000).toFixed(0)}L`} icon={BarChart2} accent={C.navy} />
          <KPICard label="Manpower" value={totalManpower} sub={`Avg ${avgManpower} per day`} icon={Users} accent={C.success} />
          <KPICard label="Reports" value={MOCK_REPORTS.length} icon={FileText} accent={C.info} />
          <KPICard label="Delayed Projects" value={delayedCount} icon={AlertTriangle} accent={C.danger} />
        </div>
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <TabBar tabs={["Overview", "Analytics", "Reports", "Photos", "Stages"]} active={tab} onChange={setTab} />
          <div style={{ padding: 24 }}>
            {tab === "Overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Cost Trend</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={COST_TREND} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 11, fill: C.textMuted }} />
                      <YAxis tick={{ fontFamily: FONT, fontSize: 11, fill: C.textMuted }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Cost"]} contentStyle={{ fontFamily: FONT, borderRadius: 8, border: `1px solid ${C.border}` }} />
                      <Area type="monotone" dataKey="cost" stroke={C.accent} fill="url(#costGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Manpower & Daily Costs</h4>
                  <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "0 0 12px" }}>Daily manpower vs expenses</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={MANPOWER_COST} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 11, fill: C.textMuted }} />
                      <YAxis yAxisId="left" tick={{ fontFamily: FONT, fontSize: 11, fill: C.textMuted }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontFamily: FONT, fontSize: 11, fill: C.textMuted }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ fontFamily: FONT, borderRadius: 8, border: `1px solid ${C.border}` }} />
                      <Legend iconType="circle" wrapperStyle={{ fontFamily: FONT, fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="manpower" fill={C.navy} name="Manpower" radius={[3, 3, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="daily_cost" stroke={C.success} strokeWidth={2} dot={{ r: 3 }} name="Daily Cost (₹)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {tab === "Analytics" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Cost by Category</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={COST_CATEGORIES} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                        {COST_CATEGORIES.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, ""]} contentStyle={{ fontFamily: FONT, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                    {COST_CATEGORIES.map(c => (
                      <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
                        <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>{c.name}: ₹{(c.value / 100000).toFixed(1)}L</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Project Progress</h4>
                  {MOCK_PROJECTS.map(p => (
                    <div key={p.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.text }}>{p.name.split(" ").slice(0, 2).join(" ")}</span>
                        <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{Math.round((p.spent / p.total_cost) * 100)}%</span>
                      </div>
                      <ProgressBar value={Math.round((p.spent / p.total_cost) * 100)} height={8} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === "Reports" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>All Reports</h4>
                  <select value={projFilter} onChange={e => setProjFilter(e.target.value)} style={{ padding: "7px 12px", fontFamily: FONT, fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", background: "#F8FAFC" }}>
                    <option>All Projects</option>
                    {MOCK_PROJECTS.map(p => <option key={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 90px 80px 90px", padding: "10px 16px", background: "#F8FAFC", borderBottom: `1px solid ${C.border}` }}>
                    {["Project", "Stage", "Date", "Weather", "Workers", "Cost"].map(h => (
                      <span key={h} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
                    ))}
                  </div>
                  {filteredReports.map((r, i) => (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 90px 80px 90px", padding: "12px 16px", borderBottom: i < filteredReports.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                      <div>
                        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>{r.project.split(" ").slice(0, 2).join(" ")}</p>
                        <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>{r.floor}</p>
                      </div>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.charcoal }}>{r.stage}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{r.date.split("-").reverse().join("/")}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}><WeatherIcon w={r.weather} /><span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{r.weather}</span></div>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.text, fontWeight: 600 }}>{r.manpower}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.text, fontWeight: 600 }}>₹{r.cost.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === "Photos" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 2px" }}>Site Photos</h4>
                    <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>{PHOTO_MOCK.length} photos uploaded</p>
                  </div>
                  <Btn variant="primary" size="sm" icon={Upload}>Upload Photos</Btn>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {PHOTO_MOCK.map((p, idx) => {
                    const gradients = [
                      "linear-gradient(135deg, #334155 0%, #475569 50%, #64748B 100%)",
                      "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
                      "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
                      "linear-gradient(135deg, #44403C 0%, #78716C 100%)",
                      "linear-gradient(135deg, #1C1917 0%, #57534E 100%)",
                      "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
                    ]
                    const icons = ["🏗️", "🧱", "⚙️", "🔩", "💡", "🏢"]
                    return (
                      <div key={p.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)" }}>
                        <div style={{ height: 140, background: gradients[idx % gradients.length], display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", gap: 8 }}>
                          <span style={{ fontSize: 36 }}>{icons[idx % icons.length]}</span>
                          <span style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Site Documentation</span>
                          <div style={{ position: "absolute", top: 8, left: 8 }}>
                            <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.5)", borderRadius: 4, padding: "2px 7px" }}>#{idx + 1}</span>
                          </div>
                          <div style={{ position: "absolute", top: 8, right: 8 }}>
                            <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "#fff", background: C.accent + "CC", borderRadius: 4, padding: "2px 7px" }}>{p.stage}</span>
                          </div>
                          <div style={{ position: "absolute", bottom: 8, right: 8 }}>
                            <Camera size={14} color="rgba(255,255,255,0.5)" />
                          </div>
                        </div>
                        <div style={{ padding: "10px 14px", background: C.card }}>
                          <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>{p.date}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <WeatherIcon w={p.weather} />
                              <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>{p.weather}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {tab === "Stages" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>Project Stages</h4>
                  <select value={floorFilter} onChange={e => setFloorFilter(e.target.value)} style={{ padding: "7px 12px", fontFamily: FONT, fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", background: "#F8FAFC" }}>
                    <option>All Floors</option>
                    <option>Ground Floor</option>
                    <option>First Floor</option>
                    <option>Other Floors</option>
                  </select>
                </div>
                {Object.entries(STAGES_DATA).map(([group, stages]) => (
                  <div key={group} style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ height: 1, background: C.border, flex: 1 }} />
                      <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{group}</span>
                      <div style={{ height: 1, background: C.border, flex: 1 }} />
                    </div>
                    {stages.map(s => (
                      <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10, padding: "10px 14px", background: "#FAFBFF", borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <div style={{ width: 180, flexShrink: 0 }}>
                          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <ProgressBar value={s.progress} color={s.progress === 100 ? C.success : C.accent} height={8} />
                        </div>
                        <div style={{ width: 40, textAlign: "right", flexShrink: 0 }}>
                          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.text }}>{s.progress}%</span>
                        </div>
                        <div style={{ width: 100, flexShrink: 0 }}>
                          <StatusBadge status={s.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: 32 }} />
    </div>
  )
}

// ─── MATERIALS ────────────────────────────────────────────────────────────────

const Materials = ({ notifications, setShowNotif, showNotif }) => {
  const [tab, setTab] = useState("Materials")
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ name: "", category: "", unit: "", cost_per_unit: "", current_stock: "", supplier_name: "", supplier_contact: "", min_stock_level: "" })

  const filtered = MATERIALS_DATA.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <TopBar title="Materials & Inventory" subtitle="Manage materials, usage, and procurement"
        notifications={notifications} setShowNotif={setShowNotif} showNotif={showNotif} />
      <div style={{ padding: "20px 32px" }}>
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <TabBar tabs={["Materials", "Usage", "Purchases", "Analytics"]} active={tab} onChange={setTab} />
          <div style={{ padding: 24 }}>
            {tab === "Materials" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ position: "relative", maxWidth: 280 }}>
                    <Search size={14} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..." style={{ padding: "8px 12px 8px 34px", fontFamily: FONT, fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 8, outline: "none", background: "#F8FAFC" }} />
                  </div>
                  <Btn onClick={() => setShowModal(true)} variant="primary" icon={Plus}>Add Material</Btn>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                  {filtered.map(m => {
                    const lowStock = m.current_stock < m.min_stock
                    return (
                      <div key={m.id} style={{ border: `1px solid ${lowStock ? C.danger + "50" : C.border}`, borderRadius: 10, padding: 18, background: lowStock ? "#FFF5F5" : C.card }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{m.name}</p>
                            <StatusBadge status={m.category} />
                          </div>
                          {lowStock && <Badge label="⚠ Low Stock" color={C.danger} bg="#FEE2E2" />}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          {[["Cost/Unit", `₹${m.cost_per_unit}`], ["Stock", `${m.current_stock} ${m.unit}s`], ["Total Value", `₹${m.total_value.toLocaleString("en-IN")}`], ["Min Stock", `${m.min_stock} ${m.unit}s`]].map(([l, v]) => (
                            <div key={l}>
                              <p style={{ fontFamily: FONT, fontSize: 10, color: C.textMuted, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{l}</p>
                              <p style={{ fontFamily: FONT, fontSize: 13, color: C.text, fontWeight: 600, margin: 0 }}>{v}</p>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: FONT, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Stock Level</span>
                            <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: lowStock ? C.danger : C.text }}>{Math.min(100, Math.round((m.current_stock / (m.min_stock * 2)) * 100))}%</span>
                          </div>
                          <ProgressBar value={Math.min(100, Math.round((m.current_stock / (m.min_stock * 2)) * 100))} color={lowStock ? C.danger : C.success} height={6} />
                        </div>
                        <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>Supplier: {m.supplier}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {tab === "Usage" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>Material Usage</h4>
                  <Btn variant="primary" icon={Plus} size="sm">Record Usage</Btn>
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 100px 1fr", padding: "10px 16px", background: "#F8FAFC", borderBottom: `1px solid ${C.border}` }}>
                    {["Date", "Material", "Project", "Quantity", "Notes"].map(h => <span key={h} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>)}
                  </div>
                  {USAGE_DATA.map((u, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 100px 1fr", padding: "12px 16px", borderBottom: i < USAGE_DATA.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{u.date.split("-").reverse().join("/")}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.text }}>{u.material}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.charcoal }}>{u.project}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.accent }}>{u.qty} {u.unit}</span>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>{u.notes}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === "Purchases" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>Purchase History</h4>
                  <Btn variant="primary" icon={Plus} size="sm">Record Purchase</Btn>
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 80px 90px 120px 130px", padding: "10px 16px", background: "#F8FAFC", borderBottom: `1px solid ${C.border}` }}>
                    {["Date", "Material", "Qty", "Unit Cost", "Total Cost", "Invoice"].map(h => <span key={h} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>)}
                  </div>
                  {PURCHASE_DATA.map((p, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr 80px 90px 120px 130px", padding: "12px 16px", borderBottom: i < PURCHASE_DATA.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{p.date.split("-").reverse().join("/")}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.text }}>{p.material}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.charcoal }}>{p.qty} {p.unit}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.charcoal }}>₹{p.unit_cost}</span>
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.success }}>₹{p.total.toLocaleString("en-IN")}</span>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted }}>{p.invoice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === "Analytics" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                    <KPICard label="Total Materials" value="5" icon={Package} accent={C.accent} />
                    <KPICard label="Inventory Value" value="₹15.6L" icon={DollarSign} accent={C.success} />
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <KPICard label="Low Stock Items" value="1" icon={AlertTriangle} accent={C.danger} />
                    <KPICard label="Purchases (YTD)" value="₹7.4L" icon={ShoppingCart} accent={C.info} />
                  </div>
                </div>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 14, fontWeight: 800, color: C.text, margin: "0 0 14px" }}>Materials by Category</h4>
                  {[["Cement & Concrete", 1], ["Steel & Iron", 1], ["Aggregates", 2], ["Masonry", 1]].map(([cat, count]) => (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 8, border: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: FONT, fontSize: 13, color: C.text }}>{cat}</span>
                      <Badge label={`${count} item${count > 1 ? "s" : ""}`} color={C.accent} bg={C.accentLight} />
                    </div>
                  ))}
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ fontFamily: FONT_HEADING, fontSize: 14, fontWeight: 800, color: C.text, margin: "0 0 10px" }}>Recent Usage</h4>
                    {USAGE_DATA.slice(0, 3).map((u, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 8 }}>
                        <span style={{ fontFamily: FONT, fontSize: 12, color: C.text, fontWeight: 600 }}>{u.material}</span>
                        <span style={{ fontFamily: FONT, fontSize: 12, color: C.accent, fontWeight: 700 }}>{u.qty} {u.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showModal && (
        <Modal title="Add New Material" onClose={() => setShowModal(false)} width={600}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Material Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required
              options={[{ value: "", label: "Select category" }, "Cement & Concrete", "Steel & Iron", "Aggregates", "Masonry", "Electrical", "Plumbing", "Finishing"]} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", fontFamily: FONT, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 8, background: "#F8FAFC", resize: "vertical", outline: "none" }} />
            </div>
            <Select label="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required
              options={[{ value: "", label: "Select unit" }, "bag", "kg", "ton", "cft", "sft", "piece", "metre", "litre"]} />
            <Input label="Cost per Unit (₹)" type="number" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} required />
            <Input label="Current Stock" type="number" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: e.target.value })} required />
            <Input label="Minimum Stock Level" type="number" value={form.min_stock_level} onChange={e => setForm({ ...form, min_stock_level: e.target.value })} />
            <Input label="Supplier Name" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} />
            <Input label="Supplier Contact" value={form.supplier_contact} onChange={e => setForm({ ...form, supplier_contact: e.target.value })} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <Btn onClick={() => setShowModal(false)} variant="secondary">Cancel</Btn>
            <Btn onClick={() => setShowModal(false)} variant="primary" icon={Plus}>Add Material</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── FINANCIALS ───────────────────────────────────────────────────────────────

const Financials = ({ notifications, setShowNotif, showNotif }) => {
  const [tab, setTab] = useState("Overview")
  const totalBudget = MOCK_PROJECTS.reduce((s, p) => s + p.total_cost, 0)
  const totalSpent = MOCK_PROJECTS.reduce((s, p) => s + p.spent, 0)

  return (
    <div>
      <TopBar title="Financial Dashboard" subtitle="Budget tracking, cost analysis, and financial reporting"
        actions={<Btn onClick={() => downloadCSV(MOCK_REPORTS)} variant="secondary" size="sm" icon={Download}>Export Report</Btn>}
        notifications={notifications} setShowNotif={setShowNotif} showNotif={showNotif} />
      <div style={{ padding: "20px 32px" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <KPICard label="Total Budget" value={`₹${(totalBudget / 10000000).toFixed(1)}Cr`} icon={DollarSign} accent={C.navy} />
          <KPICard label="Total Spent" value={`₹${(totalSpent / 10000000).toFixed(1)}Cr`} icon={TrendingUp} accent={C.accent} trend="+12% vs last month" />
          <KPICard label="Remaining" value={`₹${((totalBudget - totalSpent) / 10000000).toFixed(1)}Cr`} icon={Activity} accent={C.success} />
          <KPICard label="Budget Utilization" value={`${Math.round((totalSpent / totalBudget) * 100)}%`} icon={BarChart2} accent={C.info} />
        </div>
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <TabBar tabs={["Overview", "Trends", "Projects", "Categories"]} active={tab} onChange={setTab} />
          <div style={{ padding: 24 }}>
            {tab === "Overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Budget vs Actual Spending</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={BUDGET_VS_ACTUAL} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="project" tick={{ fontFamily: FONT, fontSize: 11, fill: C.textMuted }} />
                      <YAxis tick={{ fontFamily: FONT, fontSize: 11, fill: C.textMuted }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={v => [`₹${(v / 100000).toFixed(1)}L`, ""]} contentStyle={{ fontFamily: FONT, borderRadius: 8, border: `1px solid ${C.border}` }} />
                      <Legend iconType="circle" wrapperStyle={{ fontFamily: FONT, fontSize: 12 }} />
                      <Bar dataKey="budget" name="Budget" fill={C.navy} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spent" name="Spent" fill={C.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Cost Categories</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={COST_CATEGORIES} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                        {COST_CATEGORIES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={v => [`₹${(v / 100000).toFixed(1)}L`, ""]} contentStyle={{ fontFamily: FONT, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {COST_CATEGORIES.map(c => (
                      <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                          <span style={{ fontFamily: FONT, fontSize: 12, color: C.text }}>{c.name}</span>
                        </div>
                        <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal }}>₹{(c.value / 100000).toFixed(1)}L</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === "Trends" && (
              <div>
                <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Monthly Cost Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={COST_TREND} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.accent} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 12, fill: C.textMuted }} />
                    <YAxis tick={{ fontFamily: FONT, fontSize: 12, fill: C.textMuted }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Expenditure"]} contentStyle={{ fontFamily: FONT, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="cost" stroke={C.accent} fill="url(#finGrad)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {tab === "Projects" && (
              <div>
                <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Per-Project Financial Summary</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {MOCK_PROJECTS.map(p => {
                    const pct = Math.round((p.spent / p.total_cost) * 100)
                    return (
                      <div key={p.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{p.name}</p>
                            <StatusBadge status={p.status} />
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 800, color: pct > 90 ? C.danger : C.accent, margin: 0 }}>{pct}%</p>
                            <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>utilized</p>
                          </div>
                        </div>
                        <ProgressBar value={pct} color={pct > 90 ? C.danger : C.accent} height={8} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                          <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>Spent: <strong style={{ color: C.text }}>₹{(p.spent / 100000).toFixed(1)}L</strong></span>
                          <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>Remaining: <strong style={{ color: C.text }}>₹{((p.total_cost - p.spent) / 100000).toFixed(1)}L</strong></span>
                          <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>Budget: <strong style={{ color: C.text }}>₹{(p.total_cost / 100000).toFixed(1)}L</strong></span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {tab === "Categories" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Cost by Category (Donut)</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={COST_CATEGORIES} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                        {COST_CATEGORIES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={v => [`₹${(v / 100000).toFixed(1)}L`, ""]} contentStyle={{ fontFamily: FONT, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text, margin: "0 0 16px" }}>Category Breakdown</h4>
                  {COST_CATEGORIES.map(c => {
                    const totalC = COST_CATEGORIES.reduce((s, x) => s + x.value, 0)
                    const pct = Math.round((c.value / totalC) * 100)
                    return (
                      <div key={c.name} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
                            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</span>
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{pct}%</span>
                            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.text }}>₹{(c.value / 100000).toFixed(1)}L</span>
                          </div>
                        </div>
                        <ProgressBar value={pct} color={c.color} height={6} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────

const UserManagement = ({ notifications, setShowNotif, showNotif }) => {
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState(USERS_DATA)

  return (
    <div>
      <TopBar title="User Management" subtitle="Manage team members, roles, and project assignments"
        actions={<Btn onClick={() => setShowModal(true)} variant="primary" icon={Plus}>Invite User</Btn>}
        notifications={notifications} setShowNotif={setShowNotif} showNotif={showNotif} />
      <div style={{ padding: 32 }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <KPICard label="Total Users" value={users.length} icon={Users} accent={C.accent} />
          <KPICard label="Active Users" value={users.filter(u => u.status === "active").length} icon={Activity} accent={C.success} />
          <KPICard label="Roles Defined" value="4" icon={Layers} accent={C.info} />
          <KPICard label="Projects Assigned" value="7" icon={FolderOpen} accent={C.navy} />
        </div>
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Team Members</h3>
          </div>
          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 1fr 80px 80px", padding: "8px 24px 12px", borderBottom: `1px solid ${C.border}` }}>
              {["Name", "Email", "Role", "Projects", "Joined", "Status"].map(h => (
                <span key={h} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
              ))}
            </div>
            {users.map((u, i) => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 1fr 80px 80px", padding: "14px 24px", borderBottom: i < users.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ background: C.accent, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_HEADING, fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {u.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text }}>{u.name}</span>
                </div>
                <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{u.email}</span>
                <StatusBadge status={u.role} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {u.projects.slice(0, 2).map(p => (
                    <Badge key={p} label={p.split(" ").slice(0, 2).join(" ")} color={C.charcoal} bg="#F1F5F9" />
                  ))}
                  {u.projects.length > 2 && <Badge label={`+${u.projects.length - 2}`} color={C.textMuted} bg="#F1F5F9" />}
                </div>
                <span style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted }}>{u.joined}</span>
                <StatusBadge status={u.status} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 24, background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Roles & Permissions</h3>
          </div>
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {[
              { role: "Admin", color: C.accent, perms: ["All permissions", "User management", "Financial access", "System config"] },
              { role: "Project Manager", color: C.info, perms: ["Create/edit projects", "Submit DPR", "View reports", "Manage team"] },
              { role: "Site Engineer", color: C.success, perms: ["Submit DPR", "View own reports", "Upload photos", "Log materials"] },
              { role: "Accountant", color: C.warning, perms: ["View financials", "Export reports", "Purchase records", "Budget tracking"] },
            ].map(r => (
              <div key={r.role} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: r.color + "20", borderRadius: 8, padding: 8, display: "flex" }}><Users size={16} color={r.color} /></div>
                  <span style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 800, color: C.text }}>{r.role}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {r.perms.map(p => (
                    <div key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle size={12} color={r.color} />
                      <span style={{ fontFamily: FONT, fontSize: 12, color: C.charcoal }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showModal && (
        <Modal title="Invite New User" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Full Name" placeholder="e.g., Ravi Kumar" icon={User} required />
            <Input label="Email Address" type="email" placeholder="ravi@company.com" required />
            <Select label="Role" options={[{ value: "", label: "Select role" }, "Admin", "Project Manager", "Site Engineer", "Accountant"]} required />
            <div>
              <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Assign to Projects</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {MOCK_PROJECTS.map(p => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" style={{ accentColor: C.accent }} />
                    <span style={{ fontFamily: FONT, fontSize: 13, color: C.text }}>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <Btn onClick={() => setShowModal(false)} variant="secondary">Cancel</Btn>
              <Btn onClick={() => setShowModal(false)} variant="primary" icon={Plus}>Send Invite</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("landing") // landing | auth | app
  const [page, setPage] = useState("dashboard")
  const [user, setUser] = useState(null)
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    const link = document.createElement("link")
    link.href = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)
  }, [])

  if (screen === "landing") return <Landing onLogin={t => { if (t === "login") setScreen("auth"); else { setUser("guest@buildtrack.in"); setScreen("app") } }} />
  if (screen === "auth") return <Auth onSuccess={email => { setUser(email); setScreen("app") }} />

  const PAGES = {
    dashboard: <Dashboard user={user} setPage={setPage} notifications={notifs} setShowNotif={setShowNotif} showNotif={showNotif} />,
    projects: <Projects setPage={setPage} notifications={notifs} setShowNotif={setShowNotif} showNotif={showNotif} />,
    "submit-dpr": <SubmitDPR notifications={notifs} setShowNotif={setShowNotif} showNotif={showNotif} />,
    reports: <Reports notifications={notifs} setShowNotif={setShowNotif} showNotif={showNotif} />,
    materials: <Materials notifications={notifs} setShowNotif={setShowNotif} showNotif={showNotif} />,
    financials: <Financials notifications={notifs} setShowNotif={setShowNotif} showNotif={showNotif} />,
    users: <UserManagement notifications={notifs} setShowNotif={setShowNotif} showNotif={showNotif} />,
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FONT }} onClick={e => { if (showNotif && !e.target.closest("[data-notif]")) setShowNotif(false) }}>
      <Sidebar page={page} setPage={p => { setPage(p); setShowNotif(false) }} user={user} onSignOut={() => { setScreen("landing"); setUser(null); setPage("dashboard") }} />
      <div style={{ flex: 1, marginLeft: 240, minHeight: "100vh", overflowX: "hidden" }}>
        {PAGES[page] || PAGES.dashboard}
      </div>
    </div>
  )
}
