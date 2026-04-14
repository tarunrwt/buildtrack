import { FONT, C } from "../constants/colors"

/** Labelled text/number/date input with optional leading icon and focus glow. */
export const Input = ({ label, type = "text", value, onChange, placeholder, required, icon: Icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}{required && <span style={{ color: C.danger }}> *</span>}
      </label>
    )}
    <div style={{ position: "relative" }}>
      {Icon && <Icon size={15} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="input-glow"
        style={{
          width: "100%", boxSizing: "border-box",
          padding: Icon ? "10px 12px 10px 36px" : "10px 14px",
          fontFamily: FONT, fontSize: 14, color: C.text,
          background: "#F8FAFC", border: `1px solid ${C.border}`,
          borderRadius: 8, outline: "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease"
        }}
      />
    </div>
  </div>
)
