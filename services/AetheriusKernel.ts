// AetheriusKernel proxy (P10). Honest unreachable-backend behavior: reads
// return empty, mutations and streaming input throw instead of faking data.
export interface MemoryEntry {
  id: string;
  text: string;
  type: string;
  timestamp: number;
}

function unreachable(action: string): Error {
  return new Error(`Aetherius backend unreachable: cannot ${action}.`);
}

export const Kernel = {
  getMemories(): MemoryEntry[] {
    return [];
  },
  getDynamicGreeting(_user: any): string {
    return "Local shell ready. Backend unreachable.";
  },
  addMemory(_text: string, _type: string): MemoryEntry {
    throw unreachable("store memory");
  },
  async *processInput(_input: string, _options?: any): AsyncGenerator<string> {
    throw unreachable("process input");
    // Unreachable: keeps the generator signature for for-await consumers.
    yield "";
  },
};
