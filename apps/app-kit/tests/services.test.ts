import { test } from "node:test";
import assert from "node:assert/strict";

import { AccountService } from "../src/accounts.ts";
import { ContentService } from "../src/content.ts";
import { EntitlementService } from "../src/entitlements.ts";
import { EventLedger } from "../src/ledger.ts";
import { PermissionEngine, basePolicies } from "../src/permissions.ts";
import { MemoryRepository } from "../src/store.ts";
import { WorkflowService } from "../src/workflow.ts";

function accounts() {
  const ledger = new EventLedger();
  const service = new AccountService(new MemoryRepository(), new MemoryRepository(), { ledger });
  const admin = service.create({ handle: "admin", displayName: "Admin", roles: ["admin"] });
  const member = service.create({ handle: "member", displayName: "Member" });
  return { service, ledger, admin, member };
}

test("accounts enforce unique handles and admin-only suspension", () => {
  const { service, ledger, admin, member } = accounts();
  assert.throws(() => service.create({ handle: "MEMBER", displayName: "Other" }), /already taken/);
  assert.throws(() => service.suspend(member.id, member.id, "no reason"), /admin/);
  const suspended = service.suspend(member.id, admin.id, "abuse");
  assert.equal(suspended.status, "suspended");
  assert.throws(() => service.requireActive(member.id), /no active account/);
  assert.equal(ledger.all().at(-1)?.type, "account.suspended");
});

test("permissions are default-deny and deny wins", () => {
  const { service, member } = accounts();
  const engine = new PermissionEngine([
    ...basePolicies(),
    { id: "allow-comment", resource: "comment", action: "write", effect: "allow", roles: ["member"] },
    { id: "block-member", resource: "comment", action: "write", effect: "deny", accountIds: [member.id] },
  ]);
  assert.equal(engine.can(service.get(member.id), "comment", "write"), false);
  assert.equal(engine.can(service.get(member.id), "elsewhere", "read"), false);
  assert.throws(() => engine.assert(service.get(member.id), "comment", "write"), /permission denied/);
});

test("content transitions through review and keeps revisions", () => {
  const { member } = accounts();
  const service = new ContentService(new MemoryRepository());
  const item = service.create(member.id, { title: "Hello World", body: "first", tags: ["Intro", "intro"] });
  assert.equal(item.slug, "hello-world");
  assert.deepEqual(item.tags, ["intro"]);
  assert.throws(() => service.publish(member.id, item.id, {}), /cannot publish/);

  service.submitForReview(member.id, item.id);
  const published = service.publish(member.id, item.id);
  assert.equal(published.state, "published");
  const edited = service.update(member.id, item.id, { body: "second" });
  assert.equal(edited.state, "draft");
  assert.equal(edited.revision, 2);
  assert.equal(edited.revisions.length, 2);
});

test("workflow refuses undeclared transitions and unapproved roles", () => {
  const service = new WorkflowService(
    [
      {
        name: "expense",
        initial: "draft",
        transitions: { draft: ["submitted"], submitted: ["approved", "rejected"], approved: [] },
        requiredRoles: { "submitted>approved": ["finance"] },
      },
    ],
    new MemoryRepository(),
  );
  const actor = { id: "u1", roles: ["member"] };
  const instance = service.start("expense", "claim-1", actor);
  assert.throws(() => service.transition(instance.id, "approved", actor), /cannot move/);
  service.transition(instance.id, "submitted", actor);
  assert.throws(() => service.transition(instance.id, "approved", actor), /requires one of/);
  const approved = service.transition(instance.id, "approved", { id: "u2", roles: ["finance"] });
  assert.equal(approved.state, "approved");
  assert.equal(approved.history.length, 2);
});

test("entitlements expire and can be revoked", () => {
  let now = new Date("2026-01-01T00:00:00Z");
  const service = new EntitlementService(new MemoryRepository(), { clock: () => now });
  const grant = service.grant({
    accountId: "acc_1",
    entitlement: "course:bread",
    source: "order:1",
    expiresAt: "2026-02-01T00:00:00Z",
  });
  assert.equal(service.has("acc_1", "course:bread"), true);
  now = new Date("2026-02-02T00:00:00Z");
  assert.equal(service.has("acc_1", "course:bread"), false);
  service.revoke(grant.id, "admin", "refunded");
  assert.equal(service.has("acc_1", "course:bread"), false);
  assert.throws(() => service.revoke(grant.id, "admin", ""), /reason/);
});
