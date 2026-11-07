import { describe, it } from "node:test";
import assert from "node:assert";
import { Messaging } from "../src/domain.ts";

describe("Messaging", () => {
  it("creates threads and sends messages", () => {
    const messaging = new Messaging();
    const thread = messaging.createThread(["alice", "bob"]);
    const msg = messaging.send(thread.id, "alice", "Hi bob", ["bob"]);
    assert.equal(thread.participants.length, 2);
    assert.equal(msg.body, "Hi bob");
    assert.equal(msg.read, false);
  });

  it("lists threads", () => {
    const messaging = new Messaging();
    messaging.createThread(["alice"]);
    messaging.createThread(["bob"]);
    assert.equal(messaging.listThreads().length, 2);
  });

  it("retrieves thread by id", () => {
    const messaging = new Messaging();
    const thread = messaging.createThread(["alice"]);
    const found = messaging.getThread(thread.id);
    assert.equal(found?.id, thread.id);
  });

  it("throws on missing thread", () => {
    const messaging = new Messaging();
    assert.throws(() => messaging.send("nonexistent", "alice", "hi", ["bob"]), /thread not found/);
  });
});
