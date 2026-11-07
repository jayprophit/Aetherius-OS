export class SecurityService {
  getState() { return { rules: [], audit: [], updatedAt: new Date().toISOString() }; }
  persist() {}
  addRule(r: any): string { return r.id || "sec-" + Date.now(); }
}
export const securityService = new SecurityService();
