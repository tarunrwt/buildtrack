import { useState, useEffect, useMemo } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Input, Select, Btn, Modal, Empty, StatusBadge, TabBar, Spinner, KPICard, Badge } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { fmt } from "../../utils/formatters"
import { Plus, Trash2, UserPlus, Edit3, Users, Download, Calendar, CheckCircle, X, Eye, ClipboardList, DollarSign, FileText, Camera, UserCheck, UserX, User, Clock, AlertTriangle, Truck, Wrench, CloudRain, AlertCircle, MoreVertical, BarChart2 } from "lucide-react"

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

  // Edit state
  const [editWorker, setEditWorker] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editPhotoFile, setEditPhotoFile] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState(null)
  const [editSaving, setEditSaving] = useState(false)

  // Delete state
  const [deleteWorker, setDeleteWorker] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  const openEdit = (w) => {
    setEditWorker(w)
    setEditForm({
      name: w.name, phone: w.phone || "", category: w.category,
      trade: w.trade || "", daily_wage_rate: String(w.daily_wage_rate),
      aadhaar_last4: w.aadhaar_last4 || "", joined_date: w.joined_date || "",
    })
    setEditPhotoPreview(w.photo_url || null)
    setEditPhotoFile(null)
  }

  const ef = (key, val) => setEditForm(prev => {
    const next = { ...prev, [key]: val }
    if (key === "category") {
      const cat = CATEGORY_OPTIONS.find(c => c.value === val)
      next.daily_wage_rate = String(cat?.defaultWage || "")
      next.trade = ""
    }
    return next
  })

  const handleEditSave = async () => {
    setError("")
    if (!editForm.name.trim()) return setError("Worker name is required.")
    if (editForm.aadhaar_last4 && editForm.aadhaar_last4.length !== 4) return setError("Aadhaar must be exactly 4 digits.")
    setEditSaving(true)

    let photo_url = editWorker.photo_url
    if (editPhotoFile) {
      const ext = editPhotoFile.name.split(".").pop()
      const path = `${projectFilter}/${Date.now()}_${editForm.name.replace(/\s+/g, "_")}.${ext}`
      const { error: upErr } = await supabase.storage.from("labourer-photos").upload(path, editPhotoFile)
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("labourer-photos").getPublicUrl(path)
        photo_url = urlData?.publicUrl
      }
    }

    const { error: e } = await supabase.from("labourers").update({
      name: editForm.name.trim(), phone: editForm.phone || null,
      category: editForm.category, trade: editForm.trade || null,
      daily_wage_rate: parseFloat(editForm.daily_wage_rate),
      aadhaar_last4: editForm.aadhaar_last4 || null, photo_url,
      joined_date: editForm.joined_date, updated_at: new Date().toISOString(),
    }).eq("id", editWorker.id)

    if (e) { setError(e.message); setEditSaving(false); return }
    setEditSaving(false); setEditWorker(null); setEditPhotoFile(null); setEditPhotoPreview(null)
    loadWorkers()
  }

  const handleDelete = async () => {
    if (!deleteWorker) return
    setDeleting(true)
    await supabase.from("labourers").delete().eq("id", deleteWorker.id)
    setDeleting(false); setDeleteWorker(null)
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
                {["","Name","Category","Trade","Wage/Day","Aadhaar","Joined","Status","Actions"].map(h => (
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
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => openEdit(w)} style={{ background: "none", border: "none", color: C.info, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Edit</button>
                      <button onClick={() => toggleActive(w)} style={{ background: "none", border: "none", color: C.warning, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                        {w.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => setDeleteWorker(w)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Worker Modal */}
      {editWorker && (
        <Modal title="Edit Worker" onClose={() => setEditWorker(null)} width={620}>
          {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, marginBottom: 16 }}>{error}</p>}
          <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 100, height: 100, borderRadius: 12, background: "#F1F5F9", border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }}
                onClick={() => document.getElementById("edit-photo-input").click()}>
                {editPhotoPreview ? <img src={editPhotoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <Camera size={28} color={C.textMuted} />}
              </div>
              <input id="edit-photo-input" type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) { setEditPhotoFile(file); setEditPhotoPreview(URL.createObjectURL(file)) } }} style={{ display: "none" }} />
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT }}>Change Photo</span>
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Full Name" required value={editForm.name} onChange={e => ef("name", e.target.value)} />
              <Input label="Phone" value={editForm.phone} onChange={e => ef("phone", e.target.value)} />
              <Select label="Category" required value={editForm.category} onChange={e => ef("category", e.target.value)}
                options={CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label }))} />
              <Select label="Trade" value={editForm.trade} onChange={e => ef("trade", e.target.value)}
                options={[{ value: "", label: "Select Trade" }, ...(TRADE_BY_CATEGORY[editForm.category] || []).map(t => ({ value: t, label: t }))]} />
              <Input label="Daily Wage (₹)" type="number" required value={editForm.daily_wage_rate} onChange={e => ef("daily_wage_rate", e.target.value)} />
              <Input label="Aadhaar Last 4" value={editForm.aadhaar_last4} onChange={e => ef("aadhaar_last4", e.target.value)} />
              <Input label="Joined Date" type="date" value={editForm.joined_date} onChange={e => ef("joined_date", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="secondary" onClick={() => setEditWorker(null)}>Cancel</Btn>
            <Btn onClick={handleEditSave} disabled={editSaving} icon={CheckCircle}>{editSaving ? "Saving..." : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteWorker && (
        <Modal title="Delete Worker" onClose={() => setDeleteWorker(null)} width={440}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: FONT, fontSize: 14, color: C.text, margin: "0 0 12px" }}>
              Are you sure you want to permanently delete <strong>{deleteWorker.name}</strong>?
            </p>
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: 12, fontSize: 13, fontFamily: FONT, color: C.danger }}>
              ⚠ This will also remove all attendance records for this worker. This action cannot be undone.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="secondary" onClick={() => setDeleteWorker(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={deleting} icon={Trash2}>{deleting ? "Deleting..." : "Delete Permanently"}</Btn>
          </div>
        </Modal>
      )}
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

export const LabourRegister = ({ user, projects, notifications, onMarkAllRead }) => {
  const [activeTab, setActiveTab] = useState("bulk")

  const hasProjects = (projects || []).length > 0

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="Labour Register" subtitle="Attendance, worker management & wage tracking" notifications={notifications} onMarkAllRead={onMarkAllRead} />

      {!hasProjects ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Users size={32} color={C.textMuted} />
          </div>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>No Projects Found</p>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.textMuted, margin: "0 0 24px", maxWidth: 380, lineHeight: 1.6 }}>
            Labour attendance and wage tracking is organised by project. Create your first project to start managing your workforce.
          </p>
          <div style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={18} color={C.warning} />
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: 0 }}>Go to <strong>Projects</strong> and create a project first.</p>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
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

