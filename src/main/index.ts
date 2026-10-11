import { app, BrowserWindow, Tray, Menu, Notification, ipcMain } from 'electron'
import path from 'path'
import Store from 'electron-store'

// 1. Setup Persistent Storage
const store = new Store({
  defaults: {
    dailyGoal: 2000,
    reminderMinutes: 45,
    todayIntake: 0,
    lastDate: new Date().toDateString()
  }
})

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let reminderTimer: NodeJS.Timeout | null = null

// Helper: Check if we need to reset daily counter
function checkDailyReset() {
  const today = new Date().toDateString()
  if (store.get('lastDate') !== today) {
    store.set('todayIntake', 0)
    store.set('lastDate', today)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 550,
    resizable: false,
    frame: false, // Frameless for a modern widget look
    transparent: true, // Allows rounded corners/shadows
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())
}

function createTray() {
  // Note: You need to add an icon.png to your resources folder
  tray = new Tray(path.join(__dirname, '../../resources/icon.png'))

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Widget', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quick Add 250ml', click: () => handleAddWater(250) },
    { label: 'Quick Add 500ml', click: () => handleAddWater(500) },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setToolTip('Hydro Reminder')
  tray.setContextMenu(contextMenu)

  // Double click tray to show window
  tray.on('double-click', () => mainWindow?.show())
}

function startReminders() {
  if (reminderTimer) clearInterval(reminderTimer)

  const minutes = store.get('reminderMinutes') as number
  checkDailyReset()

  reminderTimer = setInterval(() => {
    checkDailyReset()
    const intake = store.get('todayIntake') as number
    const goal = store.get('dailyGoal') as number

    // Only remind if they haven't met their goal
    if (intake < goal) {
      new Notification({
        title: 'Time to Hydrate! 💧',
        body: `You've had ${intake}ml. Goal is ${goal}ml. Drink a glass of water!`,
        silent: false
      }).show()

      // Optional: Send event to UI if it's open
      mainWindow?.webContents.send('trigger-reminder')
    }
  }, minutes * 60 * 1000)
}

// IPC Handlers (Connecting UI to Backend)
ipcMain.handle('get-today-intake', () => {
  checkDailyReset()
  return store.get('todayIntake')
})

ipcMain.handle('add-water', (_, amount: number) => {
  checkDailyReset()
  const current = store.get('todayIntake') as number
  const updated = current + amount
  store.set('todayIntake', updated)
  return updated
})

ipcMain.handle('get-settings', () => {
  return {
    dailyGoal: store.get('dailyGoal'),
    reminderMinutes: store.get('reminderMinutes')
  }
})

ipcMain.handle('save-settings', (_, settings) => {
  store.set('dailyGoal', settings.dailyGoal)
  store.set('reminderMinutes', settings.reminderMinutes)
  startReminders() // Restart timer with new settings
})

function handleAddWater(amount: number) {
  const current = store.get('todayIntake') as number
  store.set('todayIntake', current + amount)
  mainWindow?.webContents.send('data-updated') // Tell UI to refresh
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  startReminders()
})

app.on('window-all-closed', () => {
  // On macOS, keep app running in tray unless explicitly quit
  if (process.platform !== 'darwin') app.quit()
})
