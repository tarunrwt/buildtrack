import { C } from "../constants/colors"

/**
 * Skeleton loading placeholder.
 * Renders shimmer bars that mimic content layout before data loads.
 * @param {number} rows - Number of skeleton rows (default 3)
 * @param {string} type - "card" | "table" | "kpi" (affects layout)
 */
export const Skeleton = ({ rows = 3, type = "card" }) => {
  const widths = [85, 60, 92, 55, 78, 68]
  if (type === "kpi") {
    return (
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ flex: 1, minWidth: 160, background: C.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}` }}>
            <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 28, width: "40%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 10, width: "80%" }} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ background: C.card, borderRadius: 12, padding: "18px 22px", border: `1px solid ${C.border}` }}>
          <div className="skeleton" style={{ height: 14, width: `${widths[i % widths.length]}%`, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 10, width: `${widths[(i + 2) % widths.length]}%` }} />
        </div>
      ))}
    </div>
  )
}
