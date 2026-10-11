import { useEffect, useRef, useState } from 'react'

/** Eased count-up so the number "rolls" like a slot machine instead of jumping. */
export function useAnimatedNumber(target: number, duration = 850): number {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutExpo: fast roll, soft landing
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      const val = Math.round(from + (target - from) * eased)
      setDisplay(val)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      fromRef.current = display
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return display
}
