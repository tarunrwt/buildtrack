import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Input, Select, Btn, Modal, Empty, KPICard, Spinner, Badge } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { Plus, AlertTriangle, CheckCircle, Clock, Eye, Camera, X, Bot, AlertCircle, Database, Truck, Users, Wrench, CloudRain, MoreVertical } from "lucide-react"

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

export const SiteIssues = ({ user, projects, notifications, onMarkAllRead }) => {
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
- critical: Work completely stopped, safety risk, or >Γé╣5L daily loss
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
