import { C } from "../constants/colors"

/**
 * Horizontal progress bar.
 * NOTE: The colour logic here mirrors the legacy pattern for DPR/project progress.
 * For budget-specific colour rules (danger red above 100%) see budgetBarColour
 * in src/lib/financialEngine.ts — that function is authoritative for financial bars.
 */
export const ProgressBar = ({ value, color = C.accent, height = 6 }) => (
  <div style={{ background: "#E2E8F0", borderRadius: height, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, value || 0)}%`, height: "100%",
      background: value >= 100 ? C.success : value >= 60 ? color : value > 0 ? C.warning : "#E2E8F0",
      borderRadius: height, transition: "width 0.4s ease"
    }} />
  </div>
)
