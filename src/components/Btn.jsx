import { FONT, C } from "../constants/colors"

/**
 * Polymorphic button component with micro-interactions.
 * Variants: primary | secondary | ghost | danger | outline
 * Sizes: sm | md | lg
 */
export const Btn = ({ children, onClick, variant = "primary", size = "md", icon: Icon, disabled, style: extraStyle }) => {
  const styles = {
    primary:   { background: C.accent,   color: "#fff",        border: `1px solid ${C.accent}` },
    secondary: { background: C.card,     color: C.text,        border: `1px solid ${C.border}` },
    ghost:     { background: "transparent", color: C.textMuted, border: "1px solid transparent" },
    danger:    { background: C.danger,   color: "#fff",        border: `1px solid ${C.danger}` },
    outline:   { background: "transparent", color: C.accent,   border: `1px solid ${C.accent}` },
  }
  const sizes = {
    sm: { padding: "6px 14px",  fontSize: 12 },
    md: { padding: "9px 18px",  fontSize: 13 },
    lg: { padding: "12px 24px", fontSize: 14 },
  }
  const interactiveClass = variant === "secondary" || variant === "ghost"
    ? "btn-secondary-interactive" : "btn-interactive"
  return (
    <button onClick={onClick} disabled={disabled}
      className={interactiveClass}
      style={{
        ...styles[variant], ...sizes[size],
        fontFamily: FONT, fontWeight: 600, borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap", ...(extraStyle || {})
      }}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}{children}
    </button>
  )
}
