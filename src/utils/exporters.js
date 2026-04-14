/**
 * CSV and PDF export utilities.
 */

import { fmt } from "./formatters"

/**
 * Generates and triggers a CSV download of all Daily Progress Reports.
 * @param {Array} reports - Array of DPR records with joined project name.
 */
export const downloadCSV = (reports) => {
  const headers = [
    "Project", "Floor", "Stage", "Date", "Weather", "Manpower",
    "Labor Cost", "Material Cost", "Equipment Cost",
    "Subcontractor Cost", "Other Cost", "Total Cost", "Remarks"
  ]
  const rows = reports.map(r => [
    r.projects?.name || "", r.floor, r.stage, r.report_date, r.weather,
    r.manpower_count, r.labor_cost, r.material_cost, r.equipment_cost,
    r.subcontractor_cost, r.other_cost, r.total_cost,
    `"${(r.remarks || "").replace(/"/g, "'")}"`,
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
export const downloadPDF = (reports, projects) => {
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
export const downloadProjectPDF = (project, reports) => {
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
