export class SettingsService {
  getState() { return { profiles: {} as Record<string, any>, prefs: {} as Record<string, any>, updatedAt: new Date().toISOString() }; }
  persist() {}
  setProfile(p: string, v: any) { this.getState().profiles[p] = v; this.persist(); }
}
export const settingsService = new SettingsService();
