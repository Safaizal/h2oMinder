/* Synthesized ASMR-ish water feedback. No audio assets needed. */

let ctx: AudioContext | null = null
let muted = localStorage.getItem('h20-muted') === '1'

export function isMuted(): boolean {
  return muted
}

export function setMuted(m: boolean): void {
  muted = m
  localStorage.setItem('h20-muted', m ? '1' : '0')
}

function ac(): AudioContext {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Short "glug": a pitch-dropping sine blip with a splash of filtered noise. */
function glug(at: number, baseFreq: number, dur = 0.18, gainAmt = 0.5): void {
  const c = ac()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(baseFreq, at)
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, baseFreq * 0.45), at + dur)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gainAmt, at + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(g).connect(c.destination)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

/** Splash: burst of high-passed noise. */
function splash(at: number, dur = 0.25, gainAmt = 0.16): void {
  const c = ac()
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1800
  const g = c.createGain()
  g.gain.setValueAtTime(gainAmt, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(hp).connect(g).connect(c.destination)
  src.start(at)
}

/** Chime for hitting 100%+. */
function chime(at: number): void {
  const c = ac()
  ;[660, 880, 1320].forEach((f, i) => {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    const t = at + i * 0.09
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    osc.connect(g).connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}

export function playGlug(amount: number): void {
  if (muted) return
  try {
    const c = ac()
    const t = c.currentTime
    const big = amount >= 500
    // 3 descending glugs + splash = "pouring a glass"
    glug(t, big ? 420 : 520, 0.16)
    glug(t + 0.11, big ? 330 : 400, 0.16)
    glug(t + 0.22, big ? 250 : 300, 0.22, 0.6)
    splash(t + 0.05, big ? 0.35 : 0.25, big ? 0.2 : 0.14)
  } catch {
    /* audio unavailable — stay silent */
  }
}

export function playGoalFanfare(): void {
  if (muted) return
  try {
    chime(ac().currentTime + 0.05)
  } catch {
    /* ignore */
  }
}

export function playClick(): void {
  if (muted) return
  try {
    glug(ac().currentTime, 900, 0.07, 0.18)
  } catch {
    /* ignore */
  }
}
