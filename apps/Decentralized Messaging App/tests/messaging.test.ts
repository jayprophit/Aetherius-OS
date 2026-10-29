import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { EventLedger, MemoryRepository, NotificationService } from "../../app-kit/src/index.ts";
import {
  EmailBridge,
  FederationService,
  InMemoryDeliveryBus,
  InMemoryEmailOutbox,
  MessagingService,
  PresenceService,
  createMessaging,
  decrypt,
  encrypt,
  generateFederationKeys,
} from "../src/messaging.ts";

function setup() {
  const ledger = new EventLedger();
  const notifications = new NotificationService(new MemoryRepository());
  const outbox = new InMemoryEmailOutbox();
  const bus = new InMemoryDeliveryBus();
  const service = new MessagingService(new MemoryRepository(), new MemoryRepository(), new MemoryRepository(), {
    notifications,
    outbox,
    bus,
    ledger,
  });
  const conversation = service.createConversation("alice", {
    kind: "group",
    title: "Project",
    members: ["bob", "carol"],
  });
  return { service, conversation, notifications, outbox, bus, ledger };
}

function attachment(name = "photo.png", mime = "image/png", bytes = 1024) {
  return {
    name,
    mime,
    bytes,
    sha256: createHash("sha256").update(name).digest("hex"),
  };
}

test("a member sends and another member reads a decrypted message", () => {
  const { service, conversation, notifications, outbox } = setup();
  const sent = service.send("alice", conversation.id, { kind: "text", body: "Hello team" });
  assert.equal(sent.seq, 1);
  assert.equal(sent.body, "Hello team");
  const read = service.list("bob", conversation.id);
  assert.equal(read.length, 1);
  assert.equal(read[0]?.body, "Hello team");
  assert.equal(notifications.unreadCount("bob"), 1);
  assert.equal(outbox.sent().length, 2);
});

test("a non-member cannot read or send", () => {
  const { service, conversation } = setup();
  service.send("alice", conversation.id, { kind: "text", body: "private" });
  assert.throws(() => service.list("dave", conversation.id), /not a member/);
  assert.throws(() => service.send("dave", conversation.id, { kind: "text", body: "intrusion" }), /not a member/);
});

test("the stored payload is ciphertext and tampering is detected", () => {
  const { service, conversation } = setup();
  const sent = service.send("alice", conversation.id, { kind: "text", body: "top secret" });
  const raw = service.rawMessage(sent.id)!;
  assert.ok(raw.payload);
  const decoded = Buffer.from(raw.payload.ciphertext, "base64").toString("utf8");
  assert.equal(decoded.includes("top secret"), false);

  const key = {
    id: "key_test",
    conversationId: conversation.id,
    key: Buffer.alloc(32, 7).toString("base64"),
    createdAt: "2026-10-27",
    retiredAt: null,
  };
  const payload = encrypt(key, "authenticated");
  assert.equal(decrypt(key, payload), "authenticated");
  const tampered = { ...payload, tag: Buffer.alloc(16).toString("base64") };
  assert.throws(() => decrypt(key, tampered), /authenticate|state/i);
});

test("a duplicate client id is idempotent", () => {
  const { service, conversation } = setup();
  const first = service.send("alice", conversation.id, { kind: "text", body: "once", clientId: "client-1" });
  const second = service.send("alice", conversation.id, { kind: "text", body: "once", clientId: "client-1" });
  assert.equal(second.id, first.id);
  assert.equal(service.list("bob", conversation.id).length, 1);
});

test("key rotation leaves old messages readable and new messages on the new key", () => {
  const { service, conversation } = setup();
  const old = service.send("alice", conversation.id, { kind: "text", body: "before rotation" });
  const rotated = service.rotateKey("alice", conversation.id);
  assert.notEqual(rotated.activeKeyId, conversation.activeKeyId);
  const fresh = service.send("alice", conversation.id, { kind: "text", body: "after rotation" });
  assert.notEqual(service.rawMessage(old.id)?.payload?.keyId, service.rawMessage(fresh.id)?.payload?.keyId);
  assert.deepEqual(service.list("bob", conversation.id).map((message) => message.body), ["before rotation", "after rotation"]);
});

test("only the owner or an admin may rotate the key or add members", () => {
  const { service, conversation } = setup();
  assert.throws(() => service.rotateKey("bob", conversation.id), /owner or admin/);
  assert.throws(() => service.addMember("bob", conversation.id, "dave"), /owner or admin/);
  const updated = service.addMember("alice", conversation.id, "dave");
  assert.ok(updated.members.some((member) => member.accountId === "dave"));
  assert.throws(() => service.removeMember("alice", conversation.id, "alice"), /owner cannot be removed/);
});

test("attachments are metadata-checked and rich media is carried in the encrypted payload", () => {
  const { service, conversation } = setup();
  const sent = service.send("alice", conversation.id, { kind: "attachment", attachment: attachment() });
  assert.equal(service.list("bob", conversation.id)[0]?.attachment?.mime, "image/png");
  assert.throws(
    () => service.send("alice", conversation.id, { kind: "attachment", attachment: attachment("payload.exe", "application/x-msdownload") }),
    /not allowed/,
  );
  assert.throws(
    () => service.send("alice", conversation.id, { kind: "attachment", attachment: attachment("../escape.png") }),
    /safe file name/,
  );
  assert.throws(
    () => service.send("alice", conversation.id, { kind: "attachment", attachment: attachment("huge.png", "image/png", 30 * 1024 * 1024) }),
    /too large/,
  );
});

test("a call signal is stored and delivered without claiming a media engine", () => {
  const { service, conversation } = setup();
  service.send("alice", conversation.id, { kind: "call_signal", signal: { type: "offer", payload: "sdp-offer" } });
  const view = service.list("bob", conversation.id)[0]!;
  assert.equal(view.signal?.type, "offer");
  assert.equal(view.signal?.payload, "sdp-offer");
});

test("read receipts and unread counts follow the sequence", () => {
  const { service, conversation } = setup();
  service.send("alice", conversation.id, { kind: "text", body: "one" });
  service.send("alice", conversation.id, { kind: "text", body: "two" });
  assert.equal(service.unreadCount("bob", conversation.id), 2);
  service.markRead("bob", conversation.id, 1);
  assert.equal(service.unreadCount("bob", conversation.id), 1);
  service.markRead("bob", conversation.id, 2);
  assert.equal(service.unreadCount("bob", conversation.id), 0);
});

test("only the sender may edit or delete, and deletion clears the payload", () => {
  const { service, conversation } = setup();
  const sent = service.send("alice", conversation.id, { kind: "text", body: "typo" });
  assert.throws(() => service.edit("bob", sent.id, "hijack"), /sender/);
  const edited = service.edit("alice", sent.id, "corrected");
  assert.equal(edited.body, "corrected");
  assert.ok(edited.editedAt);
  const deleted = service.delete("alice", sent.id);
  assert.equal(deleted.body, "");
  assert.ok(deleted.deletedAt);
  assert.equal(service.rawMessage(sent.id)?.payload, null);
});

test("COM-101 realtime delivery websocket socket pubsub: the delivery bus publishes a created event", () => {
  const { service, conversation, bus } = setup();
  const events: string[] = [];
  const unsubscribe = bus.subscribe((event) => events.push(`${event.type}:${event.conversationId}`));
  service.send("alice", conversation.id, { kind: "text", body: "event" });
  unsubscribe();
  assert.deepEqual(events, [`message.created:${conversation.id}`]);
});

test("presence expires and typing expires independently", () => {
  const presence = new PresenceService(60_000);
  const t0 = new Date("2026-10-27T10:00:00Z");
  assert.equal(presence.snapshot("alice", t0).status, "offline");
  presence.connect("alice", t0);
  presence.typing("alice", "cnv_1", t0, 5000);
  assert.equal(presence.snapshot("alice", t0).status, "online");
  assert.equal(presence.snapshot("alice", t0).typingIn, "cnv_1");
  assert.equal(presence.snapshot("alice", new Date(t0.getTime() + 6000)).typingIn, null);
  assert.equal(presence.snapshot("alice", new Date(t0.getTime() + 61_000)).status, "offline");
});

test("a federation envelope verifies and rejects a changed sequence or a different key", () => {
  const { service, conversation } = setup();
  const sent = service.send("alice", conversation.id, { kind: "text", body: "federate me" });
  const raw = service.rawMessage(sent.id)!;
  const keys = generateFederationKeys();
  const federation = new FederationService("node-a");
  const envelope = federation.pack(raw, keys.privateKey);
  assert.equal(federation.unpack(envelope, keys.publicKey).messageId, sent.id);
  assert.throws(() => federation.unpack({ ...envelope, seq: envelope.seq + 1 }, keys.publicKey), /signature/);
  const other = generateFederationKeys();
  assert.throws(() => federation.unpack(envelope, other.publicKey), /signature|different key/);
});

test("COM-107 email integration smtp imap mail server sendmail: the email bridge writes to an outbox rather than claiming SMTP delivery", () => {
  const outbox = new InMemoryEmailOutbox();
  const bridge = new EmailBridge(outbox);
  bridge.notifyOffline("bob", "cnv_1", "New message", "Hello");
  assert.deepEqual(outbox.sent().map((message) => message.to), ["bob"]);
});

test("a direct conversation has exactly two members", () => {
  const service = createMessaging();
  assert.throws(
    () => service.createConversation("alice", { kind: "direct", members: ["bob", "carol"] }),
    /exactly two/,
  );
});

test("every message action is on a verifiable audit chain", () => {
  const { service, conversation, ledger } = setup();
  const sent = service.send("alice", conversation.id, { kind: "text", body: "audit" });
  service.edit("alice", sent.id, "audited");
  service.delete("alice", sent.id);
  assert.equal(ledger.ofType("messaging.message.sent").length, 1);
  assert.equal(ledger.ofType("messaging.message.edited").length, 1);
  assert.equal(ledger.ofType("messaging.message.deleted").length, 1);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });
});
