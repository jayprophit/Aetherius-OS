import type { Account } from "./accounts.ts";

export interface PolicyRule {
  id: string;
  resource: string;
  action: string;
  effect: "allow" | "deny";
  roles?: string[];
  accountIds?: string[];
}

function matches(rule: PolicyRule, action: string, resource: string): boolean {
  return (rule.action === "*" || rule.action === action) && (rule.resource === "*" || rule.resource === resource);
}

/**
 * Default-deny policy evaluation.
 *
 * An action is allowed only when at least one allow rule matches and no deny
 * rule matches. Deny wins, which is the property that matters: adding a
 * permission can never silently override a prohibition.
 */
export class PermissionEngine {
  private readonly rules: PolicyRule[] = [];

  constructor(rules: readonly PolicyRule[] = []) {
    for (const rule of rules) this.add(rule);
  }

  add(rule: PolicyRule): void {
    if (!rule.id.trim()) throw new Error("policy rule has no id");
    if (!rule.resource.trim() || !rule.action.trim()) throw new Error(`policy ${rule.id} has an empty resource or action`);
    if (this.rules.some((candidate) => candidate.id === rule.id)) {
      throw new Error(`duplicate policy rule: ${rule.id}`);
    }
    this.rules.push(structuredClone(rule));
  }

  can(account: Account | undefined, action: string, resource: string): boolean {
    if (!account || account.status !== "active") return false;
    const matching = this.rules.filter((rule) => matches(rule, action, resource));
    const applies = (rule: PolicyRule): boolean => {
      const byRole = rule.roles === undefined || rule.roles.some((role) => account.roles.includes(role));
      const byAccount = rule.accountIds === undefined || rule.accountIds.includes(account.id);
      return byRole && byAccount;
    };
    if (matching.some((rule) => rule.effect === "deny" && applies(rule))) return false;
    return matching.some((rule) => rule.effect === "allow" && applies(rule));
  }

  assert(account: Account | undefined, action: string, resource: string): void {
    if (!this.can(account, action, resource)) {
      throw new Error(`permission denied: ${action} ${resource}`);
    }
  }

  list(): PolicyRule[] {
    return this.rules.map((rule) => structuredClone(rule));
  }
}

/** The policy set the application slices share. A domain may add to it. */
export function basePolicies(): PolicyRule[] {
  return [
    { id: "member-own-account", resource: "account", action: "read", effect: "allow", roles: ["member"] },
    { id: "member-own-profile", resource: "profile", action: "write", effect: "allow", roles: ["member"] },
    { id: "admin-any-account", resource: "account", action: "*", effect: "allow", roles: ["admin"] },
    { id: "admin-any-profile", resource: "profile", action: "*", effect: "allow", roles: ["admin"] },
    { id: "suspended-nothing", resource: "*", action: "*", effect: "deny", roles: ["suspended"] },
  ];
}
