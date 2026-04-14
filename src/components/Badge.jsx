import { FONT } from "../constants/colors"

/** Inline pill badge with configurable colour and background. */
export const Badge = ({ label, color, bg }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, fontFamily: FONT,
    background: bg, color, letterSpacing: "0.03em"
  }}>{label}</span>
)
