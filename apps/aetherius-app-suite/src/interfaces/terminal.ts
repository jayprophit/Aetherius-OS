export class TerminalService {
  getState() { return { sessions: [], history: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  newSession(s: any): string { return s.id || "t-" + Date.now(); }
}
export const terminalService = new TerminalService();
