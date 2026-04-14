import { FONT, C } from "../constants/colors"

/** Labelled dropdown select input. */
export const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}{required && <span style={{ color: C.danger }}> *</span>}
      </label>
    )}
    <select value={value} onChange={onChange} style={{
      padding: "10px 14px", fontFamily: FONT, fontSize: 14,
      color: C.text, background: "#F8FAFC",
      border: `1px solid ${C.border}`, borderRadius: 8,
      outline: "none", cursor: "pointer"
    }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
)
