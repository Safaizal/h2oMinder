// src/main/main.ts (Conceptual)
import { app, BrowserWindow, Tray, Menu, Notification } from 'electron'
import path from 'path'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let reminderInterval: NodeJS.Timeout | null = null

app.whenReady().then(() => {
  // 1. Create hidden main window (or small widget window)
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false, // Start hidden
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  })

  // 2. Create System Tray
  tray = new Tray(path.join(__dirname, 'icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow?.show() },
    { label: 'Add 250ml', click: () => { /* trigger add water logic */ } },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setToolTip('Water Reminder')
  tray.setContextMenu(contextMenu)

  // 3. Setup Reminders
  startReminders(45) // Remind every 45 mins
})

function startReminders(minutes: number) {
  if (reminderInterval) clearInterval(reminderInterval)

  reminderInterval = setInterval(() => {
    new Notification({
      title: 'Time to hydrate! 💧',
      body: 'You haven\'t drank water in a while. Click to log a glass.',
      // Note: Add action buttons via native OS APIs if needed
    }).show()
  }, minutes * 60 * 1000)
}
