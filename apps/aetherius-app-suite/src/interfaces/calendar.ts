export class CalendarService {
  getState() { return { events: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  add(ev: any): string { return ev.id || "ev-" + Date.now(); }
}
export const calendarService = new CalendarService();
