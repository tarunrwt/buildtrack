import { HardHat, LogOut, User } from "lucide-react"
import { FONT, FONT_HEADING, C } from "../constants/colors"
import { NAV } from "../constants/navigation"
import { formatRole } from "../utils/formatters"

/** Fixed left-hand navigation sidebar. Renders the brand logo, nav links, and user footer. */
export const Sidebar = ({ page, setPage, user, userRole, onSignOut, onProfileClick }) => (
  <div style={{
    width: 240, minWidth: 240, background: C.sidebar,
    height: "100vh", display: "flex", flexDirection: "column",
    position: "sticky", top: 0
  }}>
    {/* Brand */}
    <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1E3A5F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: C.accent, borderRadius: 10, padding: 8, display: "flex" }}>
          <HardHat size={20} color="#fff" />
        </div>
        <div>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>BuildTrack</p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#64748B", margin: 0 }}>Construction Management</p>
        </div>
      </div>
    </div>

    {/* Navigation links */}
    <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
      {NAV.filter(n => n.roles.includes(userRole)).map(({ key, label, icon: Icon }) => {
        const active = page === key
        return (
          <button key={key} onClick={() => setPage(key)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 10, marginBottom: 2,
            border: "none", cursor: "pointer",
            background: active ? C.accent : "transparent",
            transition: "all 0.15s", textAlign: "left"
          }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.sidebarHover }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}>
            <Icon size={17} color={active ? "#fff" : "#94A3B8"} />
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#fff" : "#94A3B8" }}>{label}</span>
          </button>
        )
      })}
    </nav>

    {/* User footer */}
    <div style={{ padding: "16px 12px", borderTop: "1px solid #1E3A5F" }}>
      <div onClick={onProfileClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 4, cursor: "pointer", borderRadius: 10, transition: "all 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = C.sidebarHover}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#E2E8F0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email?.split("@")[0] || "User"}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#64748B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {formatRole(userRole)}
          </p>
        </div>
      </div>
      <button onClick={onSignOut} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 10, border: "none",
        cursor: "pointer", background: "transparent", transition: "all 0.15s"
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#7F1D1D"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <LogOut size={16} color="#EF4444" />
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#EF4444" }}>Sign Out</span>
      </button>
    </div>
  </div>
)
