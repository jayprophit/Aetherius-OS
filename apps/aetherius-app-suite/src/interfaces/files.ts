/** Aetherius Files interface — durable file index + audit | Added */
import { loadState, saveState } from "../../../sovereign-financial-os/src/persistence.ts";
import { nowIso, newId } from "../../../app-kit/src/index.ts";
export interface FileRecord { id: string; path: string; type: string; size: number; updatedAt: string; }
export class FilesService {
  private state = loadState();
  list(): FileRecord[] { return (this.state as any).files || []; }
  index(file: FileRecord): string { file.id ||= newId("file"); file.updatedAt = nowIso(); (this.state as any).files = (this.state as any).files || []; (this.state as any).files.push(file); saveState(this.state); return file.id; }
}
export const filesService = new FilesService();
