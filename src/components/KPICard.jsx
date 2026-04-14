import { TrendingUp } from "lucide-react"
import { FONT, FONT_HEADING, C } from "../constants/colors"
import { useCountUp } from "../hooks/useCountUp"

/**
 * KPI summary card with accent colour stripe, icon, value, and optional trend.
 * Uses count-up animation when the card scrolls into view.
 */
export const KPICard = ({ label, value, sub, icon: Icon, accent, trend }) => {
  const numericValue = typeof value === "number" ? value : null
  const [countDisplay, countRef] = useCountUp(numericValue ?? 0, { duration: 1200 })

  return (
    <div ref={countRef} className="kpi-hover" style={{
      background: C.card, borderRadius: 12, padding: "20px 24px",
      border: `1px solid ${C.border}`, flex: 1, minWidth: 160,
      position: "relative", overflow: "hidden", cursor: "default"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3, background: accent || C.accent,
        borderRadius: "12px 12px 0 0"
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", lineHeight: 1 }}>
            {numericValue !== null ? countDisplay : value}
          </p>
          {sub && <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>{sub}</p>}
        </div>
        <div className="icon-spring" style={{ background: accent ? accent + "20" : C.accentLight, borderRadius: 10, padding: 10, display: "flex" }}>
          <Icon size={20} color={accent || C.accent} />
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <TrendingUp size={12} color={C.success} />
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.success, fontWeight: 600 }}>{trend}</span>
        </div>
      )}
    </div>
  )
}
