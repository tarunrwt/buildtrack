import { useState, useEffect, useRef } from "react"

/**
 * Intersection Observer hook. Returns [isVisible, ref].
 * Once triggered, stays true (no re-trigger on scroll up).
 */
export const useInView = (threshold = 0.15) => {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [visible, ref]
}
