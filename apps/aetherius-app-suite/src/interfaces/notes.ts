export class NotesService {
  getState() { return { notes: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  index(n: any): string { return n.id || "n-" + Date.now(); }
}
export const notesService = new NotesService();
