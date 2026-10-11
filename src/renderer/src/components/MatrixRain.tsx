import { useEffect, useRef } from 'react'

interface Props {
  tint: string
  opacity?: number
}

/** Subtle retro "matrix rain" canvas behind the glass widget. */
export default function MatrixRain({ tint, opacity = 0.16 }: Props): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)
  const tintRef = useRef(tint)

  useEffect(() => {
    tintRef.current = tint
  }, [tint])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let drops: number[] = []
    let raf = 0
    const glyphs = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈﾙﾀﾇﾍ0123456789H2O+<>*+#'.split('')
    const fontSize = 12

    const resize = (): void => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = Math.max(1, Math.floor(rect.width * dpr))
      h = Math.max(1, Math.floor(rect.height * dpr))
      canvas.width = w
      canvas.height = h
      const cols = Math.ceil(w / (fontSize * dpr))
      drops = Array.from({ length: cols }, () => Math.random() * (h / fontSize))
    }
    resize()
    window.addEventListener('resize', resize)

    let last = 0
    const frame = (now: number): void => {
      raf = requestAnimationFrame(frame)
      if (now - last < 66) return // ~15fps: calm, cheap
      last = now
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      ctx.fillStyle = 'rgba(2, 6, 8, 0.22)'
      ctx.fillRect(0, 0, w, h)
      ctx.font = `${fontSize * dpr}px ui-monospace, monospace`
      drops = drops.map((y, i) => {
        const ch = glyphs[(Math.random() * glyphs.length) | 0]
        ctx.fillStyle = tintRef.current
        ctx.globalAlpha = Math.random() < 0.06 ? 0.9 : 0.5
        ctx.fillText(ch, i * fontSize * dpr, y * fontSize * dpr * 0.55)
        ctx.globalAlpha = 1
        const next = y + 1
        return next * fontSize * dpr * 0.55 > h && Math.random() > 0.976 ? 0 : next
      })
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="matrix-rain" style={{ opacity }} aria-hidden="true" />
}
