import { AlertCircle } from "lucide-react"
import { FONT, FONT_HEADING, C } from "../constants/colors"

/** Centred empty-state placeholder with optional sub-text. */
export const Empty = ({ message = "No data yet", sub = "" }) => (
  <div style={{ textAlign: "center", padding: "60px 24px", color: C.textMuted }}>
    <AlertCircle size={36} color={C.border} style={{ marginBottom: 12 }} />
    <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: C.textLight, margin: "0 0 6px" }}>{message}</p>
    {sub && <p style={{ fontFamily: FONT, fontSize: 13, margin: 0 }}>{sub}</p>}
  </div>
)
