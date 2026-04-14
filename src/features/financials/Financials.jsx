import { useMemo, useState } from "react"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { KPICard, ProgressBar, Btn, TabBar, Empty, StatusBadge } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { fmt } from "../../utils/formatters"
import { downloadCSV } from "../../utils/exporters"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { DollarSign, TrendingUp, AlertTriangle, Download, CheckCircle } from "lucide-react"

export const Financials = ({ projects, reports, notifications, onMarkAllRead }) => {
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
