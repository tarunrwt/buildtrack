import { useState } from "react"
import { Bell, X } from "lucide-react"
import { FONT, FONT_HEADING, C } from "../constants/colors"
import { Empty } from "../components"

/** Sticky page-level header with title, subtitle, action buttons, and notification bell. */
export const TopBar = ({ title, subtitle, actions, notifications, onMarkAllRead }) => {
  const [showNotif, setShowNotif] = useState(false)
  const unread = notifications.filter(n => !n.is_read).length
  return (
    <div style={{
      background: C.card, borderBottom: `1px solid ${C.border}`,
      padding: "16px 28px", display: "flex",
      justifyContent: "space-between", alignItems: "center",
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div>
        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontFamily: FONT, fontSize: 13, color: C.textMuted, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {actions}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowNotif(v => !v)} style={{
            position: "relative", background: "#F1F5F9",
            border: "none", borderRadius: 10, padding: 10,
            cursor: "pointer", display: "flex"
          }}>
            <Bell size={18} color={C.charcoal} />
            {unread > 0 && (
              <span className="dot-pulse" style={{
                position: "absolute", top: 6, right: 6,
                width: 8, height: 8, background: C.danger,
                borderRadius: "50%", border: "2px solid #fff"
              }} />
            )}
          </button>
          {showNotif && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 340, background: C.card, borderRadius: 12,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              border: `1px solid ${C.border}`, zIndex: 200
            }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.text }}>
                  Notifications{" "}
                  {unread > 0 && <span style={{ background: C.danger, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 11, marginLeft: 4 }}>{unread}</span>}
                </span>
                {unread > 0 && (
                  <button onClick={onMarkAllRead} style={{ fontFamily: FONT, fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifications.length === 0
                  ? <Empty message="No notifications" />
                  : notifications.map(n => (
                    <div key={n.id} style={{
                      padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
                      background: n.is_read ? "transparent" : "#FFF7ED",
                      display: "flex", gap: 10
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.is_read ? C.border : C.accent, marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 2px" }}>{n.title}</p>
                        <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>{n.message}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
