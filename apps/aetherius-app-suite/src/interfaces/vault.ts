export class VaultService {
  getState() { return { vaults: [], credentials: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  addVault(v: any): string { return v.id || "v-" + Date.now(); }
}
export const vaultService = new VaultService();
