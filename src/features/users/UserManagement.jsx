import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Input, Select, Btn, Modal, Empty, StatusBadge, TabBar, Spinner, KPICard, Badge } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { formatRole } from "../../utils/formatters"
import { Plus, Trash2, UserPlus, UserCheck, UserX, Shield, Key, ClipboardList, Edit3, Users, Eye, FolderOpen, Activity, Search, User } from "lucide-react"

export const UserManagement = ({ user, userRole, projects, notifications, onMarkAllRead }) => {
  const [assignments,   setAssignments]   = useState([])
  const [roles,         setRoles]         = useState([])
  const [allProfiles,   setAllProfiles]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState("")
  const [success,       setSuccess]       = useState("")
  const [assignForm,    setAssignForm]    = useState({ user_id: "", project_id: "", role_id: "" })
  const [activeTab,     setActiveTab]     = useState("directory")
  const [searchQuery,   setSearchQuery]   = useState("")
  const [revokeTarget,  setRevokeTarget]  = useState(null)

  const isAdmin = userRole === "admin"

  const ROLE_OPTIONS = [
    { value: "project_manager", label: "Project Manager" },
    { value: "accountant",      label: "Accountant" },
    { value: "site_engineer",   label: "Site Engineer" },
    { value: "viewer",          label: "Viewer" },
  ]

  const loadData = async () => {
    const queries = [
      supabase.from("user_project_assignments").select("*, projects(name), user_roles(name, description, permissions)").order("assigned_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]
    if (isAdmin) queries.push(supabase.from("profiles").select("id, full_name, role, created_at"))
    const results = await Promise.all(queries)
    setAssignments(results[0].data || [])
    setRoles(results[1].data || [])
    if (isAdmin && results[2]) setAllProfiles(results[2].data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [isAdmin])

  // ── Role Change with Notification ──────────────────────────────────────────
  const handleRoleChange = async (profileId, newRole) => {
    if (profileId === user.id) return // can't change own role
    const { error: e } = await supabase.from("profiles").update({ role: newRole }).eq("id", profileId)
    if (e) return
    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: profileId,
      title: "Role Updated",
      message: `Your role has been changed to ${formatRole(newRole)} by Admin.`,
      type: "role_change",
    })
    setAllProfiles(ps => ps.map(p => p.id === profileId ? { ...p, role: newRole } : p))
    setSuccess(`Role updated to ${formatRole(newRole)}`)
    setTimeout(() => setSuccess(""), 3000)
  }

  // ── Assign Project ─────────────────────────────────────────────────────────
  const handleAssign = async () => {
    setError("")
    if (!assignForm.user_id || !assignForm.project_id || !assignForm.role_id)
      return setError("Please select a user, project, and role.")
    setSaving(true)
    const { data, error: e } = await supabase.from("user_project_assignments").insert({
      user_id: assignForm.user_id, project_id: assignForm.project_id,
      role_id: assignForm.role_id, assigned_by: user.id,
    }).select("*, projects(name), user_roles(name, description, permissions)").single()
    if (e) { setError(e.message); setSaving(false); return }
    // Notify the assigned user
    const projName = projects.find(p => p.id === assignForm.project_id)?.name || "a project"
    await supabase.from("notifications").insert({
      user_id: assignForm.user_id,
      title: "Project Assigned",
      message: `You have been assigned to "${projName}" by Admin.`,
      type: "assignment",
    })
    setAssignments(a => [{ ...data, _userName: allProfiles.find(p => p.id === assignForm.user_id)?.full_name || assignForm.user_id.slice(0, 8) + "…" }, ...a])
    setSaving(false); setShowAssignModal(false)
    setAssignForm({ user_id: "", project_id: "", role_id: "" })
  }

  // ── Revoke Assignment ──────────────────────────────────────────────────────
  const handleRevoke = async () => {
    if (!revokeTarget) return
    setSaving(true)
    await supabase.from("user_project_assignments").delete().eq("id", revokeTarget.id)
    // Notify the user
    await supabase.from("notifications").insert({
      user_id: revokeTarget.user_id,
      title: "Assignment Removed",
      message: `You have been removed from "${revokeTarget.projects?.name || "a project"}" by Admin.`,
      type: "assignment",
    })
    setAssignments(a => a.filter(x => x.id !== revokeTarget.id))
    setSaving(false); setRevokeTarget(null)
  }

  const getUserName = a => a._userName || allProfiles.find(p => p.id === a.user_id)?.full_name || a.user_id?.slice(0, 8) + "…"
  const assignableRoles = roles.filter(r => r.name !== "Admin")
  const profileOptions = [{ value: "", label: "Select User" }, ...allProfiles.filter(p => p.role !== "admin").map(p => ({ value: p.id, label: p.full_name || p.id.slice(0, 8) }))]
  const projectOptions = [{ value: "", label: "Select Project" }, ...(projects || []).map(p => ({ value: p.id, label: p.name }))]
  const roleOptions = [{ value: "", label: "Select Role" }, ...assignableRoles.map(r => ({ value: r.id, label: r.name }))]

  // Filter profiles by search
  const filteredProfiles = allProfiles.filter(p =>
    (p.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getAssignmentCount = (profileId) => assignments.filter(a => a.user_id === profileId).length

  const USER_TABS = [
    { key: "directory", label: "Team Directory", icon: Users },
    { key: "assignments", label: "Project Assignments", icon: FolderOpen },
    { key: "roles", label: "Roles & Permissions", icon: Shield },
  ]

  return (
    <div style={{ padding: 28 }}>
      <TopBar title="User Management" subtitle="Team directory, roles & project assignments" notifications={notifications} onMarkAllRead={onMarkAllRead}
        actions={isAdmin ? (
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setShowAssignModal(true)} icon={UserPlus}>Assign Project</Btn>
          </div>
        ) : null} />

      {success && <p style={{ fontFamily: FONT, fontSize: 13, color: C.success, background: "#D1FAE5", padding: "10px 14px", borderRadius: 8, marginTop: 16 }}>{success}</p>}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 4, marginTop: 24, background: "#F1F5F9", borderRadius: 12, padding: 4 }}>
        {USER_TABS.map(t => {
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

      {loading ? <Spinner /> : (
        <>
          {/* ── Tab 1: Team Directory ──────────────────────────────────────── */}
          {activeTab === "directory" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                <KPICard label="Total Users" value={allProfiles.length} icon={Users} accent={C.info} />
                <KPICard label="Admins" value={allProfiles.filter(p => p.role === "admin").length} icon={Shield} accent={C.accent} />
                <KPICard label="Active Roles" value={new Set(allProfiles.map(p => p.role)).size} icon={Activity} accent={C.success} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Input placeholder="Search by name or role..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon={Search} />
              </div>

              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {filteredProfiles.length === 0 ? (
                  <div style={{ padding: 28 }}><Empty message="No users found" /></div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                      <thead><tr style={{ background: "#F8FAFC" }}>
                        {["User", "Current Role", "Projects Assigned", "Joined", "Actions"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{filteredProfiles.map(p => {
                        const isSelf = p.id === user.id
                        const assignCount = getAssignmentCount(p.id)
                        return (
                          <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.role === "admin" ? C.accent : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <User size={16} color={p.role === "admin" ? "#fff" : C.textMuted} />
                                </div>
                                <div>
                                  <p style={{ fontWeight: 600, color: C.text, margin: 0 }}>{p.full_name || "Unnamed User"}</p>
                                  {isSelf && <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>YOU</span>}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              {isAdmin && !isSelf ? (
                                <select value={p.role} onChange={e => handleRoleChange(p.id, e.target.value)}
                                  style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: FONT, fontWeight: 600, background: "#F8FAFC", cursor: "pointer" }}>
                                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                              ) : (
                                <StatusBadge status={formatRole(p.role)} />
                              )}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              {p.role === "admin"
                                ? <Badge label="All Projects" color="#6366F1" bg="#EDE9FE" />
                                : <Badge label={`${assignCount} project${assignCount !== 1 ? "s" : ""}`} color={assignCount > 0 ? C.info : C.textMuted} bg={assignCount > 0 ? "#DBEAFE" : "#F1F5F9"} />
                              }
                            </td>
                            <td style={{ padding: "10px 14px", color: C.textMuted }}>
                              {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              {isSelf ? <span style={{ fontSize: 11, color: C.textMuted }}>—</span> : (
                                <button onClick={() => { setAssignForm(f => ({ ...f, user_id: p.id })); setShowAssignModal(true); setActiveTab("directory") }}
                                  style={{ background: "none", border: "none", color: C.info, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                                  Assign Project
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab 2: Project Assignments ─────────────────────────────────── */}
          {activeTab === "assignments" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>All Project Assignments</h3>
                  <Badge label={`${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`} color={C.info} bg="#DBEAFE" />
                </div>
                <div style={{ padding: 24 }}>
                  {assignments.length === 0
                    ? <Empty message="No assignments yet" sub="Click Assign Project to assign a team member" />
                    : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
                          <thead><tr style={{ background: "#F8FAFC" }}>
                            {["User", "Project", "Role", "Assigned At", "Actions"].map(h => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.charcoal, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>{assignments.map(a => (
                            <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600 }}>{getUserName(a)}</td>
                              <td style={{ padding: "10px 14px" }}>{a.projects?.name || "—"}</td>
                              <td style={{ padding: "10px 14px" }}><StatusBadge status={a.user_roles?.name} /></td>
                              <td style={{ padding: "10px 14px", color: C.textMuted }}>{new Date(a.assigned_at).toLocaleDateString("en-IN")}</td>
                              <td style={{ padding: "10px 14px" }}>
                                {isAdmin && (
                                  <button onClick={() => setRevokeTarget(a)}
                                    style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: Roles & Permissions ─────────────────────────────────── */}
          {activeTab === "roles" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Roles & Permissions</h3>
                </div>
                <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {roles.map(r => {
                    const memberCount = allProfiles.filter(p => formatRole(p.role) === r.name).length
                    return (
                      <div key={r.id} style={{ background: "#F8FAFC", borderRadius: 12, padding: "18px 20px", border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <StatusBadge status={r.name} />
                          <Badge label={`${memberCount} user${memberCount !== 1 ? "s" : ""}`} color={C.textMuted} bg="#E2E8F0" />
                        </div>
                        <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: "0 0 12px" }}>{r.description}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || "[]")).map(perm => (
                            <span key={perm} style={{ fontFamily: FONT, fontSize: 11, background: C.accentLight, color: C.accent, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{perm}</span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Assign Modal */}
      {showAssignModal && isAdmin && (
        <Modal title="Assign Project" onClose={() => { setShowAssignModal(false); setError("") }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{error}</p>}
            <Select label="User"    value={assignForm.user_id}    onChange={e => setAssignForm(f => ({ ...f, user_id:    e.target.value }))} required options={profileOptions} />
            <Select label="Project" value={assignForm.project_id} onChange={e => setAssignForm(f => ({ ...f, project_id: e.target.value }))} required options={projectOptions} />
            <Select label="Role"    value={assignForm.role_id}    onChange={e => setAssignForm(f => ({ ...f, role_id:    e.target.value }))} required options={roleOptions} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Btn>
              <Btn onClick={handleAssign} disabled={saving} icon={UserPlus}>{saving ? "Assigning..." : "Assign"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeTarget && (
        <Modal title="Revoke Assignment" onClose={() => setRevokeTarget(null)} width={440}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: FONT, fontSize: 14, color: C.text, margin: "0 0 12px" }}>
              Remove <strong>{getUserName(revokeTarget)}</strong> from <strong>{revokeTarget.projects?.name || "this project"}</strong>?
            </p>
            <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: 12, fontSize: 13, fontFamily: FONT, color: C.warning }}>
              The user will lose access to this project and will be notified.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="secondary" onClick={() => setRevokeTarget(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleRevoke} disabled={saving} icon={Trash2}>{saving ? "Revoking..." : "Revoke Access"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Project Detail
// ─────────────────────────────────────────────────────────────────────────────
