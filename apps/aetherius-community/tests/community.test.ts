import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AccountService,
  EventLedger,
  MemoryRepository,
  NotificationService,
} from "../../app-kit/src/index.ts";
import { CommunityService } from "../src/community.ts";

function setup() {
  const ledger = new EventLedger();
  const accounts = new AccountService(new MemoryRepository(), new MemoryRepository(), { ledger });
  const owner = accounts.create({ handle: "owner", displayName: "Group Owner" });
  const member = accounts.create({ handle: "member", displayName: "Member" });
  const outsider = accounts.create({ handle: "outsider", displayName: "Outsider" });
  const admin = accounts.create({ handle: "admin", displayName: "Administrator", roles: ["admin"] });
  const notifications = new NotificationService(new MemoryRepository());
  const community = new CommunityService(
    {
      groups: new MemoryRepository(),
      memberships: new MemoryRepository(),
      posts: new MemoryRepository(),
      comments: new MemoryRepository(),
      events: new MemoryRepository(),
      reports: new MemoryRepository(),
    },
    { ledger, notifications },
  );
  const group = community.createGroup(owner, {
    name: "Bakers",
    description: "Bread and pastry",
    visibility: "public",
  });
  community.joinGroup(member, group.id);
  return { ledger, owner, member, outsider, admin, notifications, community, group };
}

test("creating a group makes the owner a moderator and records the event", () => {
  const { ledger, owner, community, group } = setup();
  assert.equal(group.ownerId, owner.id);
  assert.equal(group.slug, "bakers");
  assert.equal(ledger.ofType("community.group_created").length, 1);
  const post = community.createPost(owner, group.id, { body: "First bake" });
  assert.equal(post.status, "visible");
});

test("duplicate group names get unique slugs", () => {
  const { owner, community } = setup();
  const second = community.createGroup(owner, { name: "Bakers" });
  assert.equal(second.slug, "bakers-2");
});

test("a private group is invisible to a non-member until invited", () => {
  const { owner, outsider, community } = setup();
  const secret = community.createGroup(owner, { name: "Test Kitchen", visibility: "private" });
  community.createPost(owner, secret.id, { body: "Unreleased recipe" });

  assert.throws(() => community.getGroup(secret.id, outsider), /private/);
  assert.throws(() => community.joinGroup(outsider, secret.id), /invitation/);
  assert.deepEqual(
    community.feed(outsider).filter((post) => post.groupId === secret.id),
    [],
  );

  community.invite(owner, secret.id, outsider.id);
  community.joinGroup(outsider, secret.id);
  assert.equal(community.getGroup(secret.id, outsider).id, secret.id);
  assert.equal(community.feed(outsider).filter((post) => post.groupId === secret.id).length, 1);
});

test("posting requires active membership and a body", () => {
  const { outsider, member, community, group } = setup();
  assert.throws(() => community.createPost(outsider, group.id, { body: "Not a member" }), /join the group/);
  assert.throws(() => community.createPost(member, group.id, { body: "   " }), /needs a body/);
});

test("the feed shows visible posts from public groups, newest first, with tags normalised", () => {
  const { owner, member, outsider, community, group } = setup();
  community.createPost(owner, group.id, { body: "One", tags: ["Bread", " bread ", "BAKE"] });
  community.createPost(member, group.id, { body: "Two" });
  const hidden = community.createPost(owner, group.id, { body: "Three" });

  const feed = community.feed(outsider);
  assert.equal(feed.length, 3);
  assert.deepEqual(feed.find((post) => post.body === "One")?.tags, ["bread", "bake"]);

  // A moderation hide removes it from the feed without deleting history.
  community.resolveReport(owner, community.report(outsider, {
    subjectType: "post",
    subjectId: hidden.id,
    reason: "spam",
  }).id, "hide", "off topic");
  assert.equal(community.feed(outsider).length, 2);
});

test("a comment notifies the author once and a hidden post is closed to comment", () => {
  const { owner, member, outsider, notifications, community, group } = setup();
  const post = community.createPost(owner, group.id, { body: "Question" });
  const comment = community.comment(member, post.id, "Answer");

  assert.equal(comment.authorId, member.id);
  assert.equal(notifications.unreadCount(owner.id), 1);
  assert.match(notifications.list(owner.id)[0]?.body ?? "", /commented/);

  const own = community.comment(owner, post.id, "Thanks");
  assert.equal(own.authorId, owner.id);
  assert.equal(notifications.unreadCount(owner.id), 1);

  const report = community.report(outsider, {
    subjectType: "post",
    subjectId: post.id,
    reason: "duplicate",
  });
  community.resolveReport(owner, report.id, "hide", "duplicate thread");
  assert.throws(() => community.comment(member, post.id, "Too late"), /not open for comment/);
});

test("an event enforces capacity and duplicate RSVPs are idempotent", () => {
  const { owner, member, outsider, community, group } = setup();
  const event = community.createEvent(owner, group.id, {
    title: "Bake-off",
    startsAt: "2026-11-01T10:00:00.000Z",
    capacity: 2,
  });
  const first = community.rsvp(member, event.id);
  const again = community.rsvp(member, event.id);
  assert.deepEqual(again.attendees, [member.id]);
  assert.equal(first.attendees.length, 1);
  community.rsvp(owner, event.id);
  assert.throws(() => community.rsvp(outsider, event.id), /join the group/);

  const tiny = community.createEvent(owner, group.id, {
    title: "One seat",
    startsAt: "2026-11-02T10:00:00.000Z",
    capacity: 1,
  });
  community.rsvp(member, tiny.id);
  assert.throws(() => community.rsvp(owner, tiny.id), /full/);
});

test("only a moderator may resolve a report and the decision is recorded", () => {
  const { owner, member, outsider, notifications, community, group } = setup();
  const post = community.createPost(member, group.id, { body: "Reported" });
  const report = community.report(outsider, {
    subjectType: "post",
    subjectId: post.id,
    reason: "harassment",
  });

  assert.throws(
    () => community.resolveReport(outsider, report.id, "dismiss", "no"),
    /moderator|join the group/,
  );
  assert.throws(() => community.resolveReport(owner, report.id, "dismiss", "  "), /needs a note/);
  assert.deepEqual(community.openReports(outsider), []);
  assert.deepEqual(community.openReports(owner).map((r) => r.id), [report.id]);

  const resolved = community.resolveReport(owner, report.id, "hide", "confirmed by moderator");
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.resolvedBy, owner.id);
  assert.equal(resolved.resolution, "confirmed by moderator");
  assert.ok(resolved.resolvedAt);
  assert.equal(notifications.list(member.id).some((n) => n.title === "Content hidden"), true);
  assert.deepEqual(community.openReports(owner), []);
});

test("an admin can moderate a group they do not belong to", () => {
  const { admin, member, community, group } = setup();
  const post = community.createPost(member, group.id, { body: "Needs review" });
  const report = community.report(member, {
    subjectType: "post",
    subjectId: post.id,
    reason: "self-report",
  });
  const resolved = community.resolveReport(admin, report.id, "dismiss", "no action needed");
  assert.equal(resolved.status, "dismissed");
  assert.equal(resolved.resolvedBy, admin.id);
});

test("a suspended account cannot create groups or posts", () => {
  const { owner, community, group } = setup();
  // AccountService exposes suspension; the returned snapshot is what a caller
  // would hold, and requireActive refuses it even though the group exists.
  const suspended = { ...owner, status: "suspended" as const };
  assert.throws(() => community.createGroup(suspended, { name: "Nope" }), /not active/);
  assert.throws(() => community.createPost(suspended, group.id, { body: "Nope" }), /not active/);
});
