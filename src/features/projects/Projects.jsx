import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Input, Select, Btn, Modal, Empty, StatusBadge, ProgressBar } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { LocationPicker } from "./maps/LocationPicker"
import { fmt } from "../../utils/formatters"
import { Plus, Edit3, Trash2, Calendar, Clock, MapPin } from "lucide-react"

export const Projects = ({ user, projects, setProjects, notifications, onMarkAllRead, onCardClick }) => {
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
