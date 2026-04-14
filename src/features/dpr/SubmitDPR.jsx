import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { WEATHER_OPTIONS, FLOORS, STAGES_BY_FLOOR } from "../../constants/dropdownOptions"
import { Input, Select, Btn } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { fmt } from "../../utils/formatters"
import { CheckCircle, Camera, Plus, X } from "lucide-react"

export const SubmitDPR = ({ user, projects, setReports, notifications, onMarkAllRead }) => {
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
