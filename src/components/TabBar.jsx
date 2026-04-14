import { FONT, C } from "../constants/colors"

/** Horizontal tab navigation bar. Renders inside a card header. */
export const TabBar = ({ tabs, active, onChange }) => (
  <div style={{
    display: "flex", borderBottom: `1px solid ${C.border}`,
    background: C.card, borderRadius: "12px 12px 0 0", padding: "0 24px"
  }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        fontFamily: FONT, fontSize: 13,
        fontWeight: active === t ? 700 : 500,
        color: active === t ? C.accent : C.textMuted,
        padding: "14px 20px", border: "none", background: "none",
        cursor: "pointer",
        borderBottom: active === t ? `2px solid ${C.accent}` : "2px solid transparent",
        marginBottom: -1, transition: "all 0.15s", whiteSpace: "nowrap"
      }}>{t}</button>
    ))}
  </div>
)
