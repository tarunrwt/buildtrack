import { C } from "../constants/colors"

/** Full-page centred loading spinner. */
export const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{
      width: 36, height: 36,
      border: `3px solid ${C.border}`,
      borderTopColor: C.accent,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
  </div>
)
