/**
 * BuildTrack — Construction Progress Management
 * src/App.jsx
 *
 * Root component. Handles:
 *  - Auth state (session restore, sign-in / sign-out)
 *  - Data loading (projects, reports, issues, notifications)
 *  - Client-side page routing
 *  - Layout shell (sidebar / mobile nav)
 */

import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"
import { FONT, C } from "./constants/colors"
import { useMediaQuery } from "./hooks/useMediaQuery"
import { Sidebar } from "./layout/Sidebar"
import { MobileNav } from "./layout/MobileNav"
import { HardHat } from "lucide-react"

// ── Landing & Auth ──────────────────────────────────────────────────────────
import Landing from "./landing/Landing.jsx"
import { Auth } from "./features/auth/AuthPage"

// ── Feature Pages ───────────────────────────────────────────────────────────
import { Dashboard }      from "./features/dashboard/Dashboard"
import { Projects }       from "./features/projects/Projects"
import { ProjectDetail }  from "./features/projects/ProjectDetail"
import { SubmitDPR }      from "./features/dpr/SubmitDPR"
import { Reports }        from "./features/reports/Reports"
import { Materials }      from "./features/materials/Materials"
import { Financials }     from "./features/financials/Financials"
import { LabourRegister } from "./features/labour/LabourRegister"
import { SiteIssues }     from "./features/issues/SiteIssues"
import { AIAssistant }    from "./features/ai-assistant/AIAssistant"
import { UserManagement } from "./features/users/UserManagement"
import { ProfileModal }   from "./features/users/ProfileModal"

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const [screen,             setScreen]             = useState("landing")
  const [page,               setPage]               = useState("dashboard")
  const [user,               setUser]               = useState(null)
  const [userRole,           setUserRole]           = useState("viewer")
  const [assignedProjectIds, setAssignedProjectIds] = useState([])
  const [projects,           setProjects]           = useState([])
  const [reports,            setReports]            = useState([])
  const [issues,             setIssues]             = useState([])
  const [notifications,      setNotifications]      = useState([])
  const [loading,            setLoading]            = useState(true)
  const [activeProjectId,    setActiveProjectId]    = useState(null)
  const [scrollProgress,     setScrollProgress]     = useState(0)
  const [showProfile,        setShowProfile]        = useState(false)

  // Load Google Fonts once on mount
  useEffect(() => {
    const link = document.createElement("link")
    link.href = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap"
    link.rel  = "stylesheet"
    document.head.appendChild(link)
  }, [])

  /** Fetches the authenticated user's role from the profiles table. */
  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("role").eq("id", uid).single()
    if (data?.role) setUserRole(data.role)
  }

  /**
   * Fetches the project IDs the current user is explicitly assigned to.
   * Admin users bypass this filter and see all projects.
   */
  const fetchAssignedProjects = async (role) => {
    if (role === "admin") { setAssignedProjectIds([]); return }
    const { data } = await supabase.rpc("get_assigned_project_ids")
    setAssignedProjectIds(data || [])
  }

  // Restore session on mount and listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).then(() => fetchAssignedProjects(userRole))
        setScreen("app")
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
        setScreen("app")
      } else {
        setUser(null); setUserRole("viewer"); setAssignedProjectIds([])
        setScreen("landing"); setProjects([]); setReports([]); setIssues([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load all data once the user is authenticated
  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      const [{ data: p }, { data: r }, { data: i }, { data: n }] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("daily_reports").select("*, projects(name)").order("report_date", { ascending: false }),
        supabase.from("site_issues").select("*, projects(name)").order("reported_date", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      ])
      setProjects(p || []); setReports(r || []); setIssues(i || []); setNotifications(n || [])
    }
    loadData()
  }, [user])

  // Re-fetch project assignments whenever the role resolves
  useEffect(() => {
    if (!user || !userRole || userRole === "viewer") return
    fetchAssignedProjects(userRole)
  }, [userRole])

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const handleMarkAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id)
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ background: C.accent, borderRadius: 16, padding: 16, display: "inline-flex", marginBottom: 16 }}><HardHat size={32} color="#fff" /></div>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Loading BuildTrack...</p>
      </div>
    </div>
  )

  if (screen === "landing") return <Landing onLogin={() => setScreen("auth")} />
  if (screen === "auth")    return <Auth onSuccess={(u) => { setUser(u); fetchProfile(u.id); setScreen("app") }} />

  /** Admin sees every project; all other roles see only assigned projects. */
  const visibleProjects = userRole === "admin"
    ? projects
    : projects.filter(p => assignedProjectIds.includes(p.id))

  const handleCardClick = (projId) => { setActiveProjectId(projId); setPage("project-detail") }

  /** Props shared by every page that renders a TopBar. */
  const sharedProps = { notifications, onMarkAllRead: handleMarkAllRead }

  // ── Client-side page router ─────────────────────────────────────────────────
  const PAGES = {
    dashboard:        <Dashboard     user={user} setPage={setPage} projects={visibleProjects} reports={reports} />,
    projects:         <Projects      user={user} projects={visibleProjects} setProjects={setProjects} onCardClick={handleCardClick} {...sharedProps} />,
    "submit-dpr":     <SubmitDPR     user={user} projects={visibleProjects} setReports={setReports} setProjects={setProjects} {...sharedProps} />,
    labour:           <LabourRegister user={user} userRole={userRole} projects={visibleProjects} {...sharedProps} />,
    reports:          <Reports       user={user} userRole={userRole} projects={visibleProjects} reports={reports} {...sharedProps} />,
    materials:        <Materials     user={user} projects={visibleProjects} {...sharedProps} />,
    financials:       <Financials    projects={visibleProjects} reports={reports} {...sharedProps} />,
    "site-issues":    <SiteIssues    user={user} projects={visibleProjects} {...sharedProps} />,
    "ai-assistant":   <AIAssistant   projects={visibleProjects} reports={reports} materials={[]} issues={issues} {...sharedProps} />,
    users:            <UserManagement user={user} userRole={userRole} projects={projects} {...sharedProps} />,
    "project-detail": <ProjectDetail
                        projectId={activeProjectId}
                        user={user} userRole={userRole}
                        projects={visibleProjects} setProjects={setProjects}
                        reports={reports}
                        onBack={() => setPage("projects")}
                        {...sharedProps}
                      />,
  }

  return (
    <>
      <style>{`
        @media (max-width: 1024px) {
          .modal-overlay { align-items: flex-end !important; padding: 0 !important; }
          .modal-content { border-radius: 20px 20px 0 0 !important; margin-top: auto !important; max-height: 85vh !important; }
          .responsive-table { border: 0 !important; display: block; }
          .responsive-table thead { display: none; }
          .responsive-table tbody { display: block; width: 100%; }
          .responsive-table tr { display: block; margin-bottom: 20px; border: 1px solid ${C.border}; border-radius: 12px; padding: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
          .responsive-table td { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${C.border}; padding: 10px 4px; text-align: right; }
          .responsive-table td:last-child { border-bottom: none; }
          .responsive-table td::before { content: attr(data-label); font-weight: 600; color: ${C.textMuted}; text-transform: uppercase; font-size: 11px; margin-right: 16px; text-align: left; }
          .chart-col { height: 250px !important; }
        }
      `}</style>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: FONT }}>
        {!isMobile && <Sidebar page={page} setPage={setPage} user={user} userRole={userRole} onSignOut={handleSignOut} onProfileClick={() => setShowProfile(true)} />}
      <main
        onScroll={e => {
          const main = e.currentTarget
          const scroll = main.scrollTop
          const max = main.scrollHeight - main.clientHeight
          setScrollProgress(max > 0 ? (scroll / max) * 100 : 0)
        }}
        style={{ flex: 1, overflowY: "auto", minWidth: 0, paddingBottom: isMobile ? 65 : 0 }}
      >
        <div key={page} className="page-fade-in">
          {PAGES[page] || PAGES.dashboard}
        </div>
      </main>
      {isMobile && <MobileNav page={page} setPage={setPage} user={user} userRole={userRole} onSignOut={handleSignOut} />}
      </div>
      {showProfile && user && <ProfileModal user={user} userRole={userRole} onClose={() => setShowProfile(false)} />}
    </>
  )
}
