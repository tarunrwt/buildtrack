import { X } from "lucide-react"
import { FONT_HEADING, C } from "../constants/colors"

/** Centred modal overlay with sticky header and scrollable body. */
export const Modal = ({ title, onClose, children, width = 560 }) => (
  <div className="modal-overlay" style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    zIndex: 1000, display: "flex", alignItems: "center",
    justifyContent: "center", padding: 20
  }}>
    <div className="modal-content" style={{
      background: C.card, borderRadius: 16,
      width: "100%", maxWidth: width,
      maxHeight: "90vh", overflowY: "auto",
      boxShadow: "0 25px 60px rgba(0,0,0,0.3)"
    }}>
      <div style={{
        padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, background: C.card,
        borderRadius: "16px 16px 0 0", zIndex: 1
      }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{
          background: "#F1F5F9", border: "none", borderRadius: 8,
          padding: 8, cursor: "pointer", display: "flex"
        }}><X size={16} color={C.textMuted} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
)
