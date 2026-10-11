import { useEffect, useState } from 'react'
import { create } from 'zustand'

// Zustand store for UI state
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
  setGoal: (val) => set({ goal: val }),
}))

export default function App() {
  const { intake, goal, setIntake, setGoal } = useStore()
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    // Load initial data from Main process
    window.electronAPI.getTodayIntake().then(setIntake)
    window.electronAPI.getSettings().then(settings => {
      setGoal(settings.dailyGoal)
    })

    // Listen for reminders
    window.electronAPI.onReminder(() => {
      // Play a sound or flash the UI here
      setIsAdding(true)
      setTimeout(() => setIsAdding(false), 1000)
    })
  }, [])

  const handleAddWater = async (amount: number) => {
    const newIntake = await window.electronAPI.addWater(amount)
    setIntake(newIntake)
  }

  const percentage = Math.min((intake / goal) * 100, 100)

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl overflow-hidden">

      {/* Custom Title Bar (since frame is false) */}
      <div className="absolute top-0 left-0 right-0 h-8 flex justify-end items-center px-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-t-2xl">
        <button onClick={() => window.close()} className="text-red-500 hover:text-red-700 font-bold">✕</button>
      </div>

      {/* Visual Water Bottle */}
      <div className={`relative w-32 h-48 border-4 border-cyan-400 rounded-b-3xl rounded-t-lg overflow-hidden mb-8 transition-transform ${isAdding ? 'scale-105' : 'scale-100'}`}>
        {/* Water Fill */}
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-700 ease-out"
          style={{ height: `${percentage}%` }}
        >
          {/* CSS Wave Effect */}
          <div className="absolute top-0 left-0 w-[200%] h-4 bg-white/20 animate-wave"></div>
        </div>
        {/* Measurement lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
          {[...Array(4)].map((_, i) => <div key={i} className="w-full h-px bg-white/30"></div>)}
        </div>
      </div>

      {/* Stats */}
      <h1 className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">{intake} ml</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Goal: {goal} ml</p>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => handleAddWater(250)}
          className="px-6 py-3 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 active:scale-95 transition shadow-lg shadow-cyan-500/30 font-semibold"
        >
          + 250ml
        </button>
        <button
          onClick={() => handleAddWater(500)}
          className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:scale-95 transition shadow-lg shadow-blue-500/30 font-semibold"
        >
          + 500ml
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-400">Next reminder in 45 mins</p>
    </div>
  )
}
