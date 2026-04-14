import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Input, Btn, Modal, StatusBadge, Empty } from "../../components"
import { formatRole } from "../../utils/formatters"
import { User, Key, Shield, Database, FolderOpen, CheckCircle } from "lucide-react"

export const ProfileModal = ({ user, userRole, onClose }) => {
  const [profileData, setProfileData] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [passForm, setPassForm] = useState({ newPass: "", confirm: "" })
  const [passMsg, setPassMsg] = useState("")
  const [passSaving, setPassSaving] = useState(false)
  const [activeSection, setActiveSection] = useState("info")

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_project_assignments").select("*, projects(name), user_roles(name)").eq("user_id", user.id),
      ])
      if (p) { setProfileData(p); setEditName(p.full_name || ""); setEditPhone(p.phone || "") }
      setAssignments(a || [])
    }
    load()
  }, [user.id])

  const handleSaveProfile = async () => {
    setSaving(true)
    await supabase.from("profiles").update({ full_name: editName.trim(), phone: editPhone.trim() || null }).eq("id", user.id)
    setProfileData(d => ({ ...d, full_name: editName.trim(), phone: editPhone.trim() }))
    setSaving(false)
  }

  const handleChangePassword = async () => {
    setPassMsg("")
    if (!passForm.newPass || passForm.newPass.length < 6) return setPassMsg("Password must be at least 6 characters.")
    if (passForm.newPass !== passForm.confirm) return setPassMsg("Passwords do not match.")
    setPassSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passForm.newPass })
    if (error) setPassMsg(error.message)
    else { setPassMsg("Password updated successfully!"); setPassForm({ newPass: "", confirm: "" }) }
    setPassSaving(false)
  }

  const sections = [
    { key: "info", label: "Profile", icon: User },
    { key: "password", label: "Security", icon: Key },
    { key: "projects", label: "My Projects", icon: FolderOpen },
  ]

  return (
    <Modal title="My Profile" onClose={onClose} width={560}>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 3, marginBottom: 20 }}>
        {sections.map(s => {
          const active = activeSection === s.key
          const Icon = s.icon
          return (
            <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
              flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: active ? "#fff" : "transparent", color: active ? C.accent : C.textMuted,
              fontFamily: FONT, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, transition: "all 0.2s",
              boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              <Icon size={14} /> {s.label}
            </button>
          )
        })}
      </div>

      {/* Profile Info */}
      {activeSection === "info" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "#F8FAFC", borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{profileData?.full_name || "Loading..."}</p>
              <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: "2px 0 0" }}>{user.email}</p>
              <StatusBadge status={formatRole(userRole)} />
            </div>
          </div>
          <Input label="Full Name" value={editName} onChange={e => setEditName(e.target.value)} icon={User} />
          <Input label="Phone" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={handleSaveProfile} disabled={saving} icon={CheckCircle}>{saving ? "Saving..." : "Save Profile"}</Btn>
          </div>
        </div>
      )}

      {/* Security */}
      {activeSection === "password" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Key size={16} color={C.accent} />
              <span style={{ fontFamily: FONT_HEADING, fontSize: 14, fontWeight: 700, color: C.text }}>Change Password</span>
            </div>
            <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>Create a new password. Must be at least 6 characters.</p>
          </div>
          {passMsg && <p style={{ fontFamily: FONT, fontSize: 13, color: passMsg.includes("success") ? C.success : C.danger, background: passMsg.includes("success") ? "#D1FAE5" : "#FEE2E2", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{passMsg}</p>}
          <Input label="New Password" type="password" value={passForm.newPass} onChange={e => setPassForm(f => ({ ...f, newPass: e.target.value }))} placeholder="Enter new password" />
          <Input label="Confirm Password" type="password" value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Confirm new password" />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={handleChangePassword} disabled={passSaving} icon={Key}>{passSaving ? "Updating..." : "Update Password"}</Btn>
          </div>
        </div>
      )}

      {/* My Projects */}
      {activeSection === "projects" && (
        <div>
          {assignments.length === 0 ? <Empty message="No project assignments" sub="You have not been assigned to any projects yet." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {assignments.map(a => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div>
                    <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{a.projects?.name || "Unknown"}</p>
                    <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: "2px 0 0" }}>Assigned {new Date(a.assigned_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <StatusBadge status={a.user_roles?.name || "Member"} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
//
// Responsibilities:
//  - Auth state management via Supabase auth listener
//  - Global data loading (projects, reports, notifications) on sign-in
