/** Security Audit Module — threat review, least privilege, audit/consent. Added. */
export interface AuditRecord { event: string; resource: string; user?: string; consent?: boolean; at: string; }
export interface SecurityRule { id: string; resourcePattern: string; allowedActions: string[]; requiresConsent: boolean; requiresAudit: boolean; }

export class SecurityAudit {
  private auditLog: AuditRecord[] = [];
  private rules: SecurityRule[] = [];
  addRule(r: SecurityRule) { this.rules.push(r); }
  log(rec: AuditRecord) { this.auditLog.push({ ...rec, at: rec.at || new Date().toISOString() }); }
  review(resource: string): { passed: boolean; violations: string[]; recommendations: string[] } {
    const violations: string[] = [];
    const recommendations: string[] = [];
    for (const r of this.rules) {
      if (resource.includes(r.resourcePattern) && !r.requiresConsent) recommendations.push(`Add consent gate for ${r.resourcePattern}`);
    }
    return { passed: violations.length === 0, violations, recommendations };
  }
  getAudit() { return this.auditLog; }
}

export const securityAudit = new SecurityAudit();
