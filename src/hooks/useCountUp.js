import { useState, useEffect, useRef } from "react"

/**
 * Count-up animation hook. Animates a number from 0 to `end`.
 * Triggers when the element becomes visible (IntersectionObserver).
 * Returns [displayValue, ref]. Attach ref to the DOM node.
 */
export const useCountUp = (end, { duration = 1200, prefix = "", suffix = "" } = {}) => {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const triggered = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !triggered.current) {
        triggered.current = true
        obs.unobserve(el)
        const numEnd = typeof end === "number" ? end : parseFloat(String(end).replace(/[^0-9.]/g, "")) || 0
        if (numEnd === 0) { setValue(end); return }
        const start = performance.now()
        const tick = (now) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          // easeOutQuart for natural deceleration
          const eased = 1 - Math.pow(1 - progress, 4)
          const current = Math.round(eased * numEnd)
          setValue(current)
          if (progress < 1) requestAnimationFrame(tick)
          else setValue(numEnd)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  const display = typeof end === "number"
    ? `${prefix}${value.toLocaleString("en-IN")}${suffix}`
    : typeof end === "string" && !isNaN(parseFloat(end.replace(/[^0-9.]/g, "")))
      ? `${prefix}${value.toLocaleString("en-IN")}${suffix}`
      : end
  return [display, ref]
}
