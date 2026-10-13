import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import MatrixRain from './components/MatrixRain'
import { useAnimatedNumber } from './hooks/useAnimatedNumber'
import { isMuted, playClick, playGlug, playGoalFanfare, setMuted } from './lib/sound'

// ---------- types ----------
interface NotifyConfig {
  service: 'none' | 'pushover' | 'telegram' | 'discord'
  pushover?: { token: string; userKey: string }
  telegram?: { botToken: string; chatId: string }
  discord?: { webhookUrl: string }
}

// ---------- notification sound ----------
interface AppState {
  intake: number
  goal: number
  setIntake: (val: number) => void
  setGoal: (val: number) => void
}

const useStore = create<AppState>((set) => ({
  intake: 0,
  goal: 2000,
  setIntake: (val) => set({ intake: val }),
  setGoal: (val) => set({ goal: val })
}))

// ---------- mood themes ----------
interface Mood {
  id: string
  label: string
  sub: string
  accent: string
  accentSoft: string
  glow: string
  waterFrom: string
  waterTo: string
  bgWash: string
}

function moodFor(pct: number): Mood {
  if (pct < 30)
    return {
      id: 'DEHYDRATED',
      label: '// STATUS: DEHYDRATED',
      sub: 'initiate hydration protocol_',
      accent: '#ffb020',
      accentSoft: 'rgba(255,176,32,0.16)',
      glow: '0 0 18px rgba(255,176,32,0.55), 0 0 42px rgba(255,120,0,0.25)',
      waterFrom: '#ff8c00',
      waterTo: '#ffd678',
      bgWash: 'radial-gradient(120% 90% at 50% 0%, rgba(255,140,0,0.22) 0%, rgba(20,8,2,0) 60%)'
    }
  if (pct < 70)
    return {
      id: 'HYDRATED',
      label: '// STATUS: HYDRATED',
      sub: 'systems nominal. keep sipping_',
      accent: '#00e5ff',
      accentSoft: 'rgba(0,229,255,0.14)',
      glow: '0 0 18px rgba(0,229,255,0.55), 0 0 42px rgba(0,120,255,0.28)',
      waterFrom: '#0090ff',
      waterTo: '#7df9ff',
      bgWash: 'radial-gradient(120% 90% at 50% 0%, rgba(0,229,255,0.20) 0%, rgba(2,10,16,0) 60%)'
    }
  if (pct < 100)
    return {
      id: 'FLOW_STATE',
      label: '// STATUS: FLOW_STATE',
      sub: 'optimal saturation. elite hydration_',
      accent: '#34ff96',
      accentSoft: 'rgba(52,255,150,0.14)',
      glow: '0 0 18px rgba(52,255,150,0.55), 0 0 42px rgba(0,255,150,0.25)',
      waterFrom: '#00c47a',
      waterTo: '#beffdc',
      bgWash: 'radial-gradient(120% 90% at 50% 0%, rgba(52,255,150,0.18) 0%, rgba(2,12,8,0) 60%)'
    }
  return {
    id: 'OVER_HYDRATED',
    label: '// STATUS: OVER-HYDRATED',
    sub: 'entering deep calm. midnight mode_',
    accent: '#aa82ff',
    accentSoft: 'rgba(170,130,255,0.16)',
    glow: '0 0 18px rgba(170,130,255,0.6), 0 0 46px rgba(80,60,255,0.35)',
    waterFrom: '#3b2fd4',
    waterTo: '#c9bfff',
    bgWash: 'radial-gradient(120% 90% at 50% 0%, rgba(120,90,255,0.24) 0%, rgba(8,6,20,0) 62%)'
  }
}

const BOOT_LINES = [
  '> h20minder v2.0 -- boot sequence',
  '> mounting /dev/throat ... OK',
  '> hydration daemon listening...'
]

interface Ripple {
  id: number
  x: number // % from left
  big: boolean
}

let rippleId = 0

export default function App(): React.JSX.Element {
  const { intake, goal, setIntake, setGoal } = useStore()
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [wobbleKey, setWobbleKey] = useState(0)
  const [flash, setFlash] = useState(false)
  const [muted, setMuteUi] = useState(isMuted())
  const [booted, setBooted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifyCfg, setNotifyCfg] = useState<NotifyConfig | null>(null)
  const prevPctRef = useRef(0)

  const rawPct = goal > 0 ? (intake / goal) * 100 : 0
  const pct = Math.min(rawPct, 100)
  const over = rawPct >= 100
  const mood = useMemo(() => moodFor(rawPct), [rawPct])
  const rolled = useAnimatedNumber(intake)

  // boot
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 900)
    return () => clearTimeout(t)
  }, [])

  const handleSaveNotify = (cfg: NotifyConfig) => {
    setNotifyCfg(cfg)
    window.electronAPI.saveNotifyConfig(cfg)
  }

  // initial load + live updates (tray quick-add sends data-updated)
  useEffect(() => {
    window.electronAPI.getTodayIntake().then(setIntake)
    window.electronAPI.getSettings().then((s) => setGoal(s.dailyGoal))
    window.electronAPI.getNotifyConfig().then(setNotifyCfg)
    const offReminder = window.electronAPI.onReminder(() => {
      setFlash(true)
      playClick()
      setTimeout(() => setFlash(false), 1200)
    })
    const offUpdated = window.electronAPI.onDataUpdated?.(() => {
      window.electronAPI.getTodayIntake().then(setIntake)
    })
    return () => {
      offReminder?.()
      offUpdated?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const spawnRipples = useCallback((big: boolean) => {
    const count = big ? 5 : 3
    const fresh: Ripple[] = Array.from({ length: count }, (_, i) => ({
      id: ++rippleId,
      x: 18 + Math.random() * 64,
      big: big && i === 0
    }))
    setRipples((r) => [...r.slice(-8), ...fresh])
    setTimeout(() => {
      setRipples((r) => r.filter((x) => !fresh.some((f) => f.id === x.id)))
    }, 1400)
  }, [])

  const handleAddWater = async (amount: number): Promise<void> => {
    if (busy) return
    setBusy(true)
    playGlug(amount)
    spawnRipples(amount >= 500)
    setWobbleKey((k) => k + 1)
    try {
      const next = await window.electronAPI.addWater(amount)
      const wasOver = prevPctRef.current >= 100
      setIntake(next)
      if (!wasOver && goal > 0 && next >= goal) {
        setTimeout(() => playGoalFanfare(), 350)
        setFlash(true)
        setTimeout(() => setFlash(false), 1600)
      }
    } finally {
      setTimeout(() => setBusy(false), 250)
    }
  }

  const handleUndo = async (): Promise<void> => {
    playClick()
    const next = await window.electronAPI.addWater(-250)
    setIntake(Math.max(0, next))
  }

  useEffect(() => {
    prevPctRef.current = rawPct
  }, [rawPct])

  const toggleMute = (): void => {
    const next = !muted
    setMuteUi(next)
    setMuted(next)
    if (!next) playClick()
  }

  const changeGoal = async (delta: number): Promise<void> => {
    const next = Math.min(5000, Math.max(500, goal + delta))
    setGoal(next)
    playClick()
    await window.electronAPI.saveSettings({ dailyGoal: next, reminderMinutes: 45 })
  }

  // terminal progress bar: 24 blocks
  const blocks = 24
  const filled = Math.round((pct / 100) * blocks)

  return (
    <div
      className={`hacker-root glass ${flash ? 'screen-flash' : ''}`}
      style={
        {
          '--accent': mood.accent,
          '--accent-soft': mood.accentSoft,
          '--neon-glow': mood.glow,
          '--water-from': mood.waterFrom,
          '--water-to': mood.waterTo
        } as React.CSSProperties
      }
    >
      <MatrixRain tint={mood.accent} />
      <div className="wash" style={{ background: mood.bgWash }} />
      <div className="scanlines" />
      <div className="vignette" />

      {/* title bar (frameless drag) */}
      <div className="titlebar">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <span className="title-text">root@h20:~/hydration -- zsh</span>
        <button className="win-btn" onClick={() => window.close()} title="close">
          ✕
        </button>
      </div>

      <div className="panel">
        {/* boot / header */}
        <div className="boot" aria-live="polite">
          {BOOT_LINES.map((l) => (
            <div key={l} className="boot-line">
              {l}
            </div>
          ))}
          <div className="mood-line" style={{ color: mood.accent }}>
            {mood.label} <span className="caret">▊</span>
          </div>
          <div className="sub-line">{mood.sub}</div>
        </div>

        {/* bottle */}
        <div className="bottle-wrap">
          <div key={wobbleKey} className="bottle wobble">
            <div className="bottle-cap" />
            <div className="bottle-body">
              <div
                className="water-fill"
                style={{
                  height: `${over ? 100 : pct}%`,
                  background: `linear-gradient(to top, var(--water-from), var(--water-to))`
                }}
              >
                <svg className="wave-svg" viewBox="0 0 200 14" preserveAspectRatio="none">
                  <path
                    d="M0 7 Q 12.5 0 25 7 T 50 7 T 75 7 T 100 7 T 125 7 T 150 7 T 175 7 T 200 7 V14 H0 Z"
                    fill="rgba(255,255,255,0.35)"
                  />
                </svg>
              </div>
              {/* ripples */}
              {ripples.map((r) => (
                <span
                  key={r.id}
                  className={`ripple ${r.big ? 'big' : ''}`}
                  style={{ left: `${r.x}%` }}
                />
              ))}
              {/* measurement ticks */}
              <div className="ticks">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="tick" />
                ))}
              </div>
              <div className={`pct-chip ${over ? 'over' : ''}`}>
                {over ? '100%+' : `${Math.floor(rawPct)}%`}
              </div>
            </div>
          </div>

          {/* readouts */}
          <div className="readouts">
            <div className="intake-num" title={`${intake} ml`}>
              <span className={`roll ${busy ? 'rolling' : ''}`}>{rolled.toLocaleString()}</span>
              <span className="unit">ml</span>
            </div>
            <div className="goal-row">
              <span>
                TARGET: <b>{goal}</b> ml
              </span>
              <span className="stepper">
                <button onClick={() => changeGoal(-250)} title="lower goal">
                  −
                </button>
                <button onClick={() => changeGoal(250)} title="raise goal">
                  +
                </button>
              </span>
            </div>
            <div className="bar" aria-label={`hydration ${Math.floor(rawPct)} percent`}>
              <span className="bar-fill" style={{ width: `${over ? 100 : pct}%` }} />
              <span className="bar-text">
                {'▓'.repeat(filled)}
                {'░'.repeat(blocks - filled)}
              </span>
            </div>
            <div className="hexline">
              INTAKE {intake}/{goal} ML :: {Math.floor(rawPct)}%{over ? ' :: SATURATED' : ''}
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="actions">
          <button className="btn primary" onClick={() => handleAddWater(250)} disabled={busy}>
            <span className="btn-key">[1]</span> +250ml
          </button>
          <button className="btn secondary" onClick={() => handleAddWater(500)} disabled={busy}>
            <span className="btn-key">[2]</span> +500ml
          </button>
        </div>
        <div className="foot-row">
          <button className="link" onClick={handleUndo} title="remove last 250ml">
            ↩ undo −250
          </button>
          <span className="reminder">⏱ next ping in ~45 min</span>
          <button
            className="link settings-link"
            onClick={() => setSettingsOpen(true)}
            title="notification bridge settings"
          >
            📱 notify
          </button>
          <button
            className={`link ${muted ? 'off' : ''}`}
            onClick={toggleMute}
            title="toggle sound"
          >
            {muted ? '🔇 snd:off' : '🔊 snd:on'}
          </button>
        </div>
      </div>

      {!booted && <div className="boot-veil">booting…</div>}
      </div>

      {/* Settings modal — sibling of .panel, inside .hacker-root */}
      {settingsOpen && notifyCfg && (
        <div className="settings-modal" onPointerDown={(e) => e.target === e.currentTarget && setSettingsOpen(false)}>
          <div className="settings-panel">
            <h3>📱 Mobile Notifications</h3>

            <div className="field-group">
              <label>Service</label>
              <select
                value={notifyCfg.service}
                onChange={(e) => handleSaveNotify({ ...notifyCfg, service: e.target.value as NotifyConfig['service'] })}
              >
                <option value="none">Disabled (desktop only)</option>
                <option value="pushover">Pushover</option>
                <option value="telegram">Telegram Bot</option>
                <option value="discord">Discord Webhook</option>
              </select>
            </div>

            {notifyCfg.service === 'pushover' && (
              <div className="field-group-stack">
                <div className="field-group">
                  <label>Token</label>
                  <input type="password" placeholder="api.pushover.net" value={notifyCfg.pushover?.token || ''}
                    onChange={(e) => handleSaveNotify({ ...notifyCfg, pushover: { ...notifyCfg.pushover!, token: e.target.value } })} />
                </div>
                <div className="field-group">
                  <label>User Key</label>
                  <input type="password" placeholder="U-xxxxxxxx-xxxx-xxxx" value={notifyCfg.pushover?.userKey || ''}
                    onChange={(e) => handleSaveNotify({ ...notifyCfg, pushover: { ...notifyCfg.pushover!, userKey: e.target.value } })} />
                </div>
              </div>
            )}

            {notifyCfg.service === 'telegram' && (
              <div className="field-group-stack">
                <div className="field-group">
                  <label>Bot Token</label>
                  <input type="password" placeholder="123456:ABC-DEF..." value={notifyCfg.telegram?.botToken || ''}
                    onChange={(e) => handleSaveNotify({ ...notifyCfg, telegram: { ...notifyCfg.telegram!, botToken: e.target.value } })} />
                </div>
                <div className="field-group">
                  <label>Chat ID</label>
                  <input placeholder="-123456789" value={notifyCfg.telegram?.chatId || ''}
                    onChange={(e) => handleSaveNotify({ ...notifyCfg, telegram: { ...notifyCfg.telegram!, chatId: e.target.value } })} />
                </div>
              </div>
            )}

            {notifyCfg.service === 'discord' && (
              <div className="field-group">
                <label>Webhook URL</label>
                <input type="password" placeholder="https://discord.com/api/webhooks/..." value={notifyCfg.discord?.webhookUrl || ''}
                  onChange={(e) => handleSaveNotify({ ...notifyCfg, discord: { webhookUrl: e.target.value } })} />
              </div>
            )}

            <button className="btn primary" onClick={() => setSettingsOpen(false)}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
