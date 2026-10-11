import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process
// to use Node.js APIs without exposing them entirely.
contextBridge.exposeInMainWorld('electronAPI', {
  // Data operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  addWater: (amount: number) => ipcRenderer.invoke('add-water', amount),
  getTodayIntake: () => ipcRenderer.invoke('get-today-intake'),

  // Event listeners (Main -> Renderer)
  onReminder: (callback: () => void) => {
    ipcRenderer.on('trigger-reminder', callback)
  }
})
