import { describe, it } from "node:test";
import assert from "node:assert";
import { MailService } from "../src/domain.ts";

describe("MailService", () => {
  it("creates mailboxes and sends mail", () => {
    const mail = new MailService();
    const mailbox = mail.createMailbox("alice@example.com", "Alice");
    const email = mail.send(mailbox.id, "alice@example.com", ["bob@example.com"], "Hello", "Hi Bob");
    assert.equal(email.subject, "Hello");
    assert.equal(mail.listInbox(mailbox.id).length, 1);
  });

  it("throws on missing mailbox", () => {
    const mail = new MailService();
    assert.throws(() => mail.send("nonexistent", "a@b.com", ["c@d.com"], "Hi", "Body"), /mailbox not found/);
  });
});
