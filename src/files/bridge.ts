import type { Provider, ProviderReport } from "../providers/types";
import { baseReport } from "../providers/types";

// Universal File Bridge seam (P10-APPREG). The browser shell has no direct
// filesystem access by design; file operations flow through Agent Bridge
// workspace-scoped sessions with permission control. Until that capability
// is wired, this provider reports UNAVAILABLE instead of pretending.
export interface FileEntry {
  name: string;
  kind: "file" | "directory";
  size: number | null;
}

export function createFilesProvider(): Provider & {
  list(): Promise<FileEntry[]>;
} {
  const unavailable = (detail: string): ProviderReport =>
    baseReport("files", "UNAVAILABLE", {
      state: "UNAVAILABLE",
      detail,
      errorCode: "NO_FILE_CAPABILITY",
      errorDetail: "file operations require an Agent Bridge workspace session (P12)",
    });
  return {
    id: "files",
    kind: "UNAVAILABLE",
    describe: () => "Universal File Bridge seam (Agent Bridge workspace sessions)",
    async check(): Promise<ProviderReport> {
      return unavailable("no file capability bound");
    },
    async list(): Promise<FileEntry[]> {
      throw new Error("file listing unavailable: no Agent Bridge workspace session bound");
    },
  };
}
