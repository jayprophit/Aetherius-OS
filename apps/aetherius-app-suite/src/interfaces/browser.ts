export class BrowserService {
  getState() { return { history: [], bookmarks: [], tabs: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  addHistory(h: any): string { return h.id || "b-" + Date.now(); }
}
export const browserService = new BrowserService();
