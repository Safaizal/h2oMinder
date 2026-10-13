export interface NotifyConfig {
  service: 'none' | 'pushover' | 'telegram' | 'discord'
  pushover?: { token: string; userKey: string }
  telegram?: { botToken: string; chatId: string }
  discord?: { webhookUrl: string }
}

export interface AppSettings {
  dailyGoal: number
  reminderMinutes: number
}

export interface IElectronAPI {
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
  addWater: (amount: number) => Promise<number>
  getTodayIntake: () => Promise<number>
  getNotifyConfig: () => Promise<NotifyConfig>
  saveNotifyConfig: (cfg: NotifyConfig) => Promise<void>
  onReminder: (callback: () => void) => () => void
  onDataUpdated?: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
