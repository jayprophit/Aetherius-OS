import type { EventLedger } from "./ledger.ts";
import { newId, nowIso } from "./ids.ts";
import type { Repository } from "./store.ts";

export interface Grant {
  id: string;
  accountId: string;
  entitlement: string;
  source: string;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

/**
 * Entitlements are grants, not flags on an account.
 *
 * Commerce sells a product and Learning enrols a learner, but both produce
 * the same kind of grant. One revocation path serves both, and a grant keeps
 * the source that produced it.
 */
export class EntitlementService {
  private readonly grants: Repository<Grant>;
  private readonly ledger?: EventLedger;
  private readonly clock: () => Date;

  constructor(grants: Repository<Grant>, options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    this.grants = grants;
    this.ledger = options.ledger;
    this.clock = options.clock ?? (() => new Date());
  }

  grant(input: {
    accountId: string;
    entitlement: string;
    source: string;
    expiresAt?: string | null;
  }): Grant {
    if (!input.accountId.trim()) throw new Error("a grant needs an account");
    if (!input.entitlement.trim()) throw new Error("a grant needs an entitlement");
    if (!input.source.trim()) throw new Error("a grant needs a source");
    if (input.expiresAt && Number.isNaN(Date.parse(input.expiresAt))) {
      throw new Error(`invalid expiry: ${input.expiresAt}`);
    }
    const grant: Grant = {
      id: newId("grt"),
      accountId: input.accountId,
      entitlement: input.entitlement,
      source: input.source,
      grantedAt: nowIso(this.clock),
      expiresAt: input.expiresAt ?? null,
      revokedAt: null,
    };
    this.grants.put(grant);
    this.ledger?.append({
      type: "entitlement.granted",
      actor: input.source,
      subject: input.accountId,
      data: { entitlement: grant.entitlement, grant: grant.id },
    });
    return structuredClone(grant);
  }

  has(accountId: string, entitlement: string, at: Date = this.clock()): boolean {
    return this.active(accountId, entitlement, at).length > 0;
  }

  active(accountId: string, entitlement: string, at: Date = this.clock()): Grant[] {
    return this.grants
      .all()
      .filter((grant) => grant.accountId === accountId)
      .filter((grant) => grant.entitlement === entitlement)
      .filter((grant) => grant.revokedAt === null)
      .filter((grant) => grant.expiresAt === null || Date.parse(grant.expiresAt) > at.getTime())
      .map((grant) => structuredClone(grant));
  }

  forAccount(accountId: string): Grant[] {
    return this.grants
      .all()
      .filter((grant) => grant.accountId === accountId)
      .map((grant) => structuredClone(grant));
  }

  revoke(grantId: string, actor: string, reason: string): Grant {
    const grant = this.grants.get(grantId);
    if (!grant) throw new Error(`no grant: ${grantId}`);
    if (!reason.trim()) throw new Error("a revocation needs a reason");
    if (grant.revokedAt) return structuredClone(grant);
    const revoked: Grant = { ...grant, revokedAt: nowIso(this.clock) };
    this.grants.put(revoked);
    this.ledger?.append({
      type: "entitlement.revoked",
      actor,
      subject: grant.accountId,
      data: { entitlement: grant.entitlement, grant: grant.id, reason },
    });
    return structuredClone(revoked);
  }
}

export interface Notification {
  id: string;
  accountId: string;
  title: string;
  body: string;
  kind: string;
  readAt: string | null;
  createdAt: string;
  data: Record<string, unknown>;
}

export class NotificationService {
  private readonly notifications: Repository<Notification>;
  private readonly clock: () => Date;

  constructor(notifications: Repository<Notification>, options: { clock?: () => Date } = {}) {
    this.notifications = notifications;
    this.clock = options.clock ?? (() => new Date());
  }

  notify(accountId: string, title: string, body: string, options: { kind?: string; data?: Record<string, unknown> } = {}): Notification {
    if (!accountId.trim()) throw new Error("a notification needs an account");
    if (!title.trim()) throw new Error("a notification needs a title");
    const notification: Notification = {
      id: newId("ntf"),
      accountId,
      title: title.trim(),
      body,
      kind: options.kind ?? "info",
      readAt: null,
      createdAt: nowIso(this.clock),
      data: structuredClone(options.data ?? {}),
    };
    this.notifications.put(notification);
    return structuredClone(notification);
  }

  list(accountId: string, options: { unreadOnly?: boolean } = {}): Notification[] {
    return this.notifications
      .all()
      .filter((notification) => notification.accountId === accountId)
      .filter((notification) => options.unreadOnly !== true || notification.readAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((notification) => structuredClone(notification));
  }

  markRead(accountId: string, notificationId: string): Notification {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.accountId !== accountId) {
      throw new Error(`no notification for this account: ${notificationId}`);
    }
    if (notification.readAt) return structuredClone(notification);
    const read: Notification = { ...notification, readAt: nowIso(this.clock) };
    this.notifications.put(read);
    return structuredClone(read);
  }

  unreadCount(accountId: string): number {
    return this.list(accountId, { unreadOnly: true }).length;
  }
}
