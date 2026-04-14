import { useState } from "react"
import {
  LayoutDashboard, FolderOpen, FileText, BarChart2,
  Menu, X, LogOut
} from "lucide-react"
import { FONT, FONT_HEADING, C } from "../constants/colors"
import { NAV } from "../constants/navigation"
import { formatRole } from "../utils/formatters"

/** Bottom navigation bar for mobile devices, with a slide-in drawer for extra items. */
export const MobileNav = ({ page, setPage, user, userRole, onSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const bottomNavItems = [
    { key: "dashboard", label: "Home", icon: LayoutDashboard },
    { key: "projects", label: "Projects", icon: FolderOpen },
    { key: "submit-dpr", label: "New DPR", icon: FileText },
    { key: "reports", label: "Reports", icon: BarChart2 },
  ];

  return (
    <>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 65,
        background: C.card, borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        zIndex: 900, paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        {bottomNavItems.map(({ key, label, icon: Icon }) => {
          const active = page === key;
          return (
            <button key={key} onClick={() => setPage(key)} style={{
              background: "none", border: "none", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, cursor: "pointer", flex: 1, padding: "8px 0"
            }}>
              <Icon size={20} color={active ? C.accent : C.textMuted} />
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.accent : C.textMuted }}>{label}</span>
            </button>
          )
        })}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: "none", border: "none", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 4, cursor: "pointer", flex: 1, padding: "8px 0"
        }}>
          <Menu size={20} color={menuOpen ? C.accent : C.textMuted} />
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: menuOpen ? 700 : 500, color: menuOpen ? C.accent : C.textMuted }}>Menu</span>
        </button>
      </div>

      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 950 }} onClick={() => setMenuOpen(false)}>
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 260,
            background: C.card, display: "flex", flexDirection: "column",
            transform: menuOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s ease",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
              <div>
                <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 800, margin: 0, color: C.text }}>BuildTrack</p>
                <p style={{ fontFamily: FONT, fontSize: 11, color: C.textMuted, margin: 0 }}>{user?.email?.split("@")[0]} · {formatRole(userRole)}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} color={C.textMuted} /></button>
            </div>
            <nav style={{ flex: 1, padding: 12, overflowY: "auto" }}>
              {NAV.filter(n => n.roles.includes(userRole)).map(({ key, label, icon: Icon }) => {
                const active = page === key;
                return (
                  <button key={key} onClick={() => { setPage(key); setMenuOpen(false); }} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 8, marginBottom: 4, border: "none",
                    background: active ? `${C.accent}12` : "transparent",
                    color: active ? C.accent : C.text, cursor: "pointer", textAlign: "left"
                  }}>
                    <Icon size={18} color={active ? C.accent : C.textMuted} />
                    <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: active ? 600 : 500 }}>{label}</span>
                  </button>
                )
              })}
            </nav>
            <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => { onSignOut(); setMenuOpen(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 8, border: "none", cursor: "pointer", background: "transparent"
              }}>
                <LogOut size={18} color={C.danger} />
                <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.danger }}>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
