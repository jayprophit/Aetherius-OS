/** Durable Calendar Implementation — connects interface to DurableStore. Added. */
import { DurableStore } from "./durable";
const store = new DurableStore("calendar");

export class DurableCalendarService {
  all() { return store.all(); }
  find(id: string) { return store.find(id); }
  save(ev: any) { return store.save({ ...ev, id: ev.id || "cal-" + Date.now() }); }
  remove(id: string) { return store.remove(id); }
}

export const durableCalendarService = new DurableCalendarService();
