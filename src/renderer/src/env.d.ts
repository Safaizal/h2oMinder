export interface IElectronAPI {
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
  addWater: (amount: number) => Promise<number>;
  getTodayIntake: () => Promise<number>;
  onReminder: (callback: () => void) => () => void;
  onDataUpdated?: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
