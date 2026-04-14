import { useState, useMemo } from "react"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Select, Btn, Empty, WeatherIcon, KPICard, TabBar } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { fmt } from "../../utils/formatters"
import { downloadCSV, downloadPDF } from "../../utils/exporters"
import { PhotosTab } from "./PhotosTab"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, PieChart, Pie, Cell } from "recharts"
import { Download, Filter, Eye, DollarSign, FileText, Users, AlertTriangle } from "lucide-react"

export const Reports = ({ user, userRole, projects, reports, notifications, onMarkAllRead }) => {
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
