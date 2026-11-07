/** Durable Photos Implementation — connects interface to DurableStore. Added. */
import { DurableStore } from "./durable";
const store = new DurableStore("photos");

export class DurablePhotosService {
  all() { return store.all(); }
  find(id: string) { return store.find(id); }
  save(img: any) { return store.save({ ...img, id: img.id || "photo-" + Date.now() }); }
  remove(id: string) { return store.remove(id); }
}

export const durablePhotosService = new DurablePhotosService();
