export class BackupService {
  getState() { return { destinations: [], logs: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  addLog(l: any): string { return l.id || "bk-" + Date.now(); }
}
export const backupService = new BackupService();
