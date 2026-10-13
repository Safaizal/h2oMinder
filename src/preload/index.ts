import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process
// to use Node.js APIs without exposing them entirely.
contextBridge.exposeInMainWorld('electronAPI', {
  // Data operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('save-settings', settings),
  addWater: (amount: number) => ipcRenderer.invoke('add-water', amount),
  getTodayIntake: () => ipcRenderer.invoke('get-today-intake'),

  // Notification bridge config
  getNotifyConfig: () => ipcRenderer.invoke('get-notify-config'),
  saveNotifyConfig: (cfg: unknown) => ipcRenderer.invoke('save-notify-config', cfg),

  // Event listeners (Main -> Renderer). Each returns an unsubscribe fn.
  onReminder: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('trigger-reminder', handler)
    return () => ipcRenderer.removeListener('trigger-reminder', handler)
  },
  onDataUpdated: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('data-updated', handler)
    return () => ipcRenderer.removeListener('data-updated', handler)
  }
})
