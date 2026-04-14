import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { KPICard } from "../../components"
import { fmt } from "../../utils/formatters"
import { FolderOpen, FileText, BarChart2, Package, DollarSign, TrendingUp, AlertTriangle, Wrench } from "lucide-react"

export const Dashboard = ({ user, setPage, projects, reports }) => {
  const now         = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  const totalBudget = projects.reduce((s, p) => s + (p.total_cost  || 0), 0)
  const totalSpent  = projects.reduce((s, p) => s + (p.total_spent || 0), 0)
  const delayed     = projects.filter(p => p.status === "delayed").length
  const overrunProjects = projects.filter(p => p.total_cost > 0 && (p.total_spent || 0) > p.total_cost)

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
        <KPICard label="Total Spent"    value={fmt(totalSpent)}        sub={`${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of budget`} icon={TrendingUp} accent={totalSpent > totalBudget && totalBudget > 0 ? C.danger : C.accent} />
        <KPICard label="Total Reports"  value={reports.length}         sub="DPRs submitted"          icon={FileText}      accent={C.warning}  />
        <KPICard label="Delayed"        value={delayed}                sub="projects behind schedule" icon={AlertTriangle} accent={C.danger}   />
      </div>

      {/* Budget overrun alerts */}
      {overrunProjects.length > 0 && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12,
          padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12
        }}>
          <AlertTriangle size={20} color={C.danger} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: FONT_HEADING, fontSize: 14, fontWeight: 700, color: C.danger, margin: "0 0 6px" }}>
              Budget Overrun Detected
            </p>
            {overrunProjects.map(p => (
              <p key={p.id} style={{ fontFamily: FONT, fontSize: 12, color: C.text, margin: "4px 0", lineHeight: 1.5 }}>
                <strong>{p.name}</strong> — Spent {fmt(p.total_spent)} of {fmt(p.total_cost)} budget ({Math.round(((p.total_spent || 0) / p.total_cost) * 100)}%) · Over by <strong style={{ color: C.danger }}>{fmt((p.total_spent || 0) - p.total_cost)}</strong>
              </p>
            ))}
          </div>
        </div>
      )}

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
