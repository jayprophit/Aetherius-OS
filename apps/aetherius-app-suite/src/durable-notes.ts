/** Durable Notes Implementation — connects interface to DurableStore. Added. */
import { DurableStore } from "./durable";
const store = new DurableStore("notes");

export class DurableNotesService {
  all() { return store.all(); }
  find(id: string) { return store.find(id); }
  save(note: any) { return store.save({ ...note, id: note.id || "note-" + Date.now() }); }
  remove(id: string) { return store.remove(id); }
}

export const durableNotesService = new DurableNotesService();
