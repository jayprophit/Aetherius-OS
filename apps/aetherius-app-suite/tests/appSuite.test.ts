import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger } from "../../app-kit/src/index.ts";
import { NotesApp } from "../src/notes.ts";
import { CalculatorSession, evaluate } from "../src/calculator.ts";
import { VirtualFiles, mimeFor, normalisePath } from "../src/files.ts";
import { CalendarApp } from "../src/calendar.ts";
import { PhotoLibrary, contentHashOf } from "../src/photos.ts";
import { BrowserSession } from "../src/browser.ts";

const CLOCK = () => new Date("2026-10-29T00:00:00.000Z");
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

/* --------------------------------------------------------------------- notes */

test("notes create, derive a title, tag, pin and search", () => {
  const ledger = new EventLedger([], CLOCK);
  const notes = new NotesApp({ ledger, clock: CLOCK });
  const first = notes.create({ body: "Shopping list\nmilk, bread", tags: ["Home", "home", " errand "] });
  assert.equal(first.title, "Shopping list");
  assert.deepEqual(first.tags, ["errand", "home"]);
  assert.equal(first.version, 1);

  const second = notes.create({ title: "Ideas", body: "A second note", pinned: true });
  assert.deepEqual(notes.list().map((note) => note.title), ["Ideas", "Shopping list"]);
  assert.deepEqual(notes.list({ tag: "home" }).map((note) => note.id), [first.id]);
  assert.deepEqual(notes.search("milk home").map((note) => note.id), [first.id]);
  assert.deepEqual(notes.search("nothing"), []);
  assert.equal(second.pinned, true);
  assert.equal(ledger.ofType("notes.created").length, 2);
});

test("notes keep every revision and can restore one", () => {
  const notes = new NotesApp({ clock: CLOCK });
  const note = notes.create({ title: "Draft", body: "one" });
  const updated = notes.update(note.id, { body: "two", tags: ["work"] });
  assert.equal(updated.version, 2);
  assert.equal(notes.history(note.id).length, 2);
  const restored = notes.restore(note.id, 1);
  assert.equal(restored.body, "one");
  assert.equal(restored.version, 3);
  assert.deepEqual(notes.history(note.id).map((revision) => revision.version), [1, 2, 3]);

  const archived = notes.update(note.id, { archived: true });
  assert.equal(archived.archived, true);
  assert.equal(notes.list().length, 0);
  assert.equal(notes.list({ includeArchived: true }).length, 1);
  assert.equal(notes.delete(note.id), true);
  assert.equal(notes.get(note.id), undefined);
  assert.throws(() => notes.update("missing", { body: "x" }), /no note/);
  assert.throws(() => notes.history("missing"), /no note/);
  assert.throws(() => notes.restore(note.id, 99), /no note/);
});

/* ---------------------------------------------------------------- calculator */

test("the calculator respects precedence, unary minus and right-associative powers", () => {
  assert.equal(evaluate("2 + 3 * 4"), 14);
  assert.equal(evaluate("(2 + 3) * 4"), 20);
  assert.equal(evaluate("2 ^ 3 ^ 2"), 512);
  assert.equal(evaluate("-2 ^ 2"), -4);
  assert.equal(evaluate("10 % 3"), 1);
  assert.equal(evaluate("sqrt(9) + min(2, 3, 1)"), 4);
  assert.equal(evaluate("max(1, 5, 2)"), 5);
  assert.equal(evaluate("round(2.6)"), 3);
  assert.ok(Math.abs(evaluate("sin(pi / 2)") - 1) < 1e-12);
  assert.ok(Math.abs(evaluate("2 * pi") - Math.PI * 2) < 1e-12);
});

test("the calculator refuses malformed and unsafe expressions", () => {
  assert.throws(() => evaluate(""), /empty/);
  assert.throws(() => evaluate("1 / 0"), /division by zero/);
  assert.throws(() => evaluate("0 % 0"), /division by zero/);
  assert.throws(() => evaluate("2 +"), /ends unexpectedly/);
  assert.throws(() => evaluate("(1 + 2"), /missing closing parenthesis/);
  assert.throws(() => evaluate("1 2"), /trailing input/);
  assert.throws(() => evaluate("foo(1)"), /unknown function/);
  assert.throws(() => evaluate("nope"), /unknown name/);
  assert.throws(() => evaluate("sqrt(1, 2)"), /expects between/);
  assert.throws(() => evaluate("1 $ 2"), /unexpected character/);
  assert.throws(() => evaluate("sqrt(-1)"), /not a finite number/);
});

test("the calculator session records history and memory", () => {
  const ledger = new EventLedger([], CLOCK);
  const session = new CalculatorSession({ ledger, clock: CLOCK });
  assert.equal(session.evaluate("6 * 7"), 42);
  assert.equal(session.history().length, 1);
  assert.equal(session.memoryAdd(10), 10);
  assert.equal(session.memorySubtract(3), 7);
  assert.equal(session.memory(), 7);
  session.memoryClear();
  assert.equal(session.memory(), 0);
  session.clearHistory();
  assert.deepEqual(session.history(), []);
  assert.equal(ledger.ofType("calculator.evaluated").length, 1);
});

/* --------------------------------------------------------------------- files */

test("the virtual filesystem creates, writes, reads and lists", () => {
  const files = new VirtualFiles({ clock: CLOCK });
  files.mkdir("/docs");
  const file = files.write("/docs/readme.md", "# Hello");
  assert.equal(file.mime, "text/markdown");
  assert.equal(file.bytes, 7);
  assert.equal(files.read("/docs/readme.md"), "# Hello");
  assert.deepEqual(files.list("/docs").map((node) => node.path), ["/docs/readme.md"]);
  assert.equal(mimeFor("/a/b/photo.JPG"), "image/jpeg");
  assert.equal(mimeFor("/a/file.unknown"), "application/octet-stream");
  assert.equal(files.usageBytes(), 7);
  assert.equal(files.quota(), 64 * 1024 * 1024);
  assert.throws(() => files.read("/docs"), /not a file/);
  assert.throws(() => files.write("/missing/file.txt", "x"), /no such path/);
  assert.throws(() => files.mkdir("/docs"), /already exists/);
  assert.throws(() => files.read("/nope"), /no such path/);
});

test("paths are normalised and traversal is refused", () => {
  assert.equal(normalisePath("/a//b/"), "/a/b");
  assert.equal(normalisePath("/"), "/");
  assert.throws(() => normalisePath("relative"), /absolute/);
  assert.throws(() => normalisePath("/a/../b"), /may not contain/);
  assert.throws(() => normalisePath("/a/./b"), /may not contain/);
});

test("the filesystem enforces a quota and supports move, copy and remove", () => {
  const files = new VirtualFiles({ clock: CLOCK, quotaBytes: 10 });
  files.mkdir("/docs");
  files.write("/docs/a.txt", "hello");
  assert.throws(() => files.write("/docs/b.txt", "world!"), /quota exceeded/);
  files.write("/docs/a.txt", "hi");
  assert.equal(files.usageBytes(), 2);

  files.mkdir("/archive");
  files.move("/docs", "/archive/docs");
  assert.equal(files.read("/archive/docs/a.txt"), "hi");
  assert.equal(files.stat("/docs"), undefined);
  assert.throws(() => files.move("/archive", "/archive/inside"), /into itself/);

  files.copy("/archive/docs", "/archive/copy");
  assert.equal(files.read("/archive/copy/a.txt"), "hi");
  assert.notEqual(files.stat("/archive/docs/a.txt")!.id, files.stat("/archive/copy/a.txt")!.id);
  assert.throws(() => files.copy("/archive/docs", "/archive/copy"), /already exists/);

  assert.throws(() => files.remove("/archive"), /not empty/);
  files.remove("/archive", { recursive: true });
  assert.equal(files.stat("/archive"), undefined);
  assert.equal(files.list("/").length, 0);
  assert.throws(() => files.remove("/"), /root/);
});

test("files can be searched by name and content", () => {
  const files = new VirtualFiles({ clock: CLOCK });
  files.mkdir("/notes");
  files.write("/notes/todo.md", "buy milk and bread");
  files.write("/notes/plan.md", "write the report");
  assert.deepEqual(files.search("milk").map((node) => node.path), ["/notes/todo.md"]);
  assert.deepEqual(files.search("notes").map((node) => node.path), ["/notes/plan.md", "/notes/todo.md"]);
  assert.deepEqual(files.search("report").map((node) => node.path), ["/notes/plan.md"]);
  assert.deepEqual(files.search(""), []);
  assert.throws(() => files.search("x", 0), /limit is out of range/);
});

/* ------------------------------------------------------------------ calendar */

test("calendar events validate and expand recurrences deterministically", () => {
  const ledger = new EventLedger([], CLOCK);
  const calendar = new CalendarApp({ ledger, clock: CLOCK });
  const daily = calendar.add({
    title: "Stand-up",
    start: "2026-11-01T09:00:00Z",
    end: "2026-11-01T09:30:00Z",
    recurrence: "daily",
    recurrenceUntil: "2026-11-05T00:00:00Z",
    reminderMinutes: [10, 10, 0],
  });
  assert.deepEqual(daily.reminderMinutes, [0, 10]);
  const occurrences = calendar.range("2026-11-01T00:00:00Z", "2026-11-05T00:00:00Z");
  assert.deepEqual(
    occurrences.map((occurrence) => occurrence.start.slice(0, 10)),
    ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"],
  );
  assert.equal(ledger.ofType("calendar.event.added").length, 1);

  const monthly = calendar.add({
    title: "Rent",
    start: "2026-01-31T10:00:00Z",
    end: "2026-01-31T11:00:00Z",
    recurrence: "monthly",
  });
  const monthlyStarts = calendar
    .range("2026-01-01T00:00:00Z", "2026-05-01T00:00:00Z")
    .filter((occurrence) => occurrence.event.id === monthly.id)
    .map((occurrence) => occurrence.start);
  assert.deepEqual(monthlyStarts, [
    "2026-01-31T10:00:00.000Z",
    "2026-02-28T10:00:00.000Z",
    "2026-03-31T10:00:00.000Z",
    "2026-04-30T10:00:00.000Z",
  ]);
});

test("calendar refuses invalid events and reports conflicts", () => {
  const calendar = new CalendarApp({ clock: CLOCK });
  assert.throws(() => calendar.add({ title: "", start: "2026-11-01T09:00:00Z", end: "2026-11-01T10:00:00Z" }), /title/);
  assert.throws(() => calendar.add({ title: "X", start: "2026-11-01T10:00:00Z", end: "2026-11-01T09:00:00Z" }), /end after/);
  assert.throws(() => calendar.add({ title: "X", start: "not a date", end: "2026-11-01T10:00:00Z" }), /not an ISO date/);
  assert.throws(
    () => calendar.add({ title: "X", start: "2026-11-01T09:00:00Z", end: "2026-11-01T10:00:00Z", reminderMinutes: [-1] }),
    /reminder is out of range/,
  );
  assert.throws(
    () =>
      calendar.add({
        title: "X",
        start: "2026-11-01T09:00:00Z",
        end: "2026-11-01T10:00:00Z",
        recurrence: "daily",
        recurrenceUntil: "2026-10-01T00:00:00Z",
      }),
    /cannot be before/,
  );

  const first = calendar.add({ title: "A", start: "2026-11-01T09:00:00Z", end: "2026-11-01T10:00:00Z" });
  calendar.add({ title: "B", start: "2026-11-01T09:30:00Z", end: "2026-11-01T10:30:00Z" });
  assert.equal(calendar.conflicts("2026-11-01T09:45:00Z", "2026-11-01T10:15:00Z").length, 2);
  assert.deepEqual(
    calendar.conflicts("2026-11-01T09:45:00Z", "2026-11-01T10:15:00Z", first.id).map((occurrence) => occurrence.event.title),
    ["B"],
  );
  const updated = calendar.update(first.id, { title: "A2", location: "Room 1" });
  assert.equal(updated.id, first.id);
  assert.equal(updated.title, "A2");
  assert.equal(calendar.get(first.id)?.location, "Room 1");
  assert.equal(calendar.remove(first.id), true);
  assert.equal(calendar.get(first.id), undefined);
});

test("calendar exports a real ICS document", () => {
  const calendar = new CalendarApp({ clock: CLOCK });
  calendar.add({
    title: "Planning, review; Q4",
    start: "2026-11-01T09:00:00Z",
    end: "2026-11-01T10:00:00Z",
    location: "Room 1",
    notes: "Line one\nLine two",
    reminderMinutes: [15],
    recurrence: "weekly",
    recurrenceUntil: "2026-12-01T00:00:00Z",
  });
  const ics = calendar.ics();
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /VERSION:2\.0\r\n/);
  assert.match(ics, /BEGIN:VEVENT\r\n/);
  assert.match(ics, /DTSTART:20261101T090000Z/);
  assert.match(ics, /DTEND:20261101T100000Z/);
  assert.match(ics, /SUMMARY:Planning\\, review\\; Q4/);
  assert.match(ics, /LOCATION:Room 1/);
  assert.match(ics, /DESCRIPTION:Line one\\nLine two/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;UNTIL=20261201T000000Z/);
  assert.match(ics, /BEGIN:VALARM/);
  assert.match(ics, /TRIGGER:-PT15M/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});

/* -------------------------------------------------------------------- photos */

test("photos organise albums, tags, favourites and duplicates", () => {
  const ledger = new EventLedger([], CLOCK);
  const photos = new PhotoLibrary({ ledger, clock: CLOCK });
  const album = photos.createAlbum("Holiday");
  assert.throws(() => photos.createAlbum("holiday"), /already exists/);
  assert.deepEqual(photos.listAlbums().map((entry) => entry.name), ["Holiday"]);

  const one = photos.add({
    filename: "beach.jpg",
    mime: "image/jpeg",
    bytes: 1000,
    width: 1920,
    height: 1080,
    takenAt: "2026-07-01T12:00:00Z",
    albumId: album.id,
    tags: ["Sea", "sun"],
    favorite: true,
    caption: "Beach at noon",
    contentHash: HASH_A,
  });
  photos.add({
    filename: "beach-copy.jpg",
    mime: "image/jpeg",
    bytes: 1000,
    width: 1920,
    height: 1080,
    takenAt: "2026-07-01T12:00:01Z",
    albumId: album.id,
    contentHash: HASH_A,
  });
  photos.add({
    filename: "city.png",
    mime: "image/png",
    bytes: 2000,
    width: 800,
    height: 600,
    takenAt: "2026-08-01T12:00:00Z",
    tags: ["urban"],
    contentHash: HASH_B,
  });

  assert.equal(photos.list().length, 3);
  assert.equal(photos.list({ albumId: album.id }).length, 2);
  assert.equal(photos.list({ tag: "sea" }).length, 1);
  assert.equal(photos.list({ favorite: true }).length, 1);
  assert.deepEqual(photos.search("beach noon").map((photo) => photo.id), [one.id]);
  assert.deepEqual(photos.duplicates().map((group) => group.map((photo) => photo.filename)), [
    ["beach-copy.jpg", "beach.jpg"],
  ]);
  assert.equal(photos.setFavorite(one.id, false).favorite, false);
  assert.equal(photos.remove(one.id), true);
  assert.equal(photos.get(one.id), undefined);
  assert.throws(() => photos.remove(one.id), /no photo/);
  assert.equal(ledger.ofType("photos.added").length, 3);
});

test("photos validate metadata rather than pretending to decode pixels", () => {
  const photos = new PhotoLibrary({ clock: CLOCK });
  const base = {
    filename: "a.jpg",
    mime: "image/jpeg",
    bytes: 10,
    width: 10,
    height: 10,
    takenAt: "2026-07-01T12:00:00Z",
    contentHash: HASH_A,
  };
  assert.throws(() => photos.add({ ...base, mime: "text/plain" }), /not an image/);
  assert.throws(() => photos.add({ ...base, bytes: 0 }), /size is invalid/);
  assert.throws(() => photos.add({ ...base, width: 0 }), /width is invalid/);
  assert.throws(() => photos.add({ ...base, takenAt: "nope" }), /not a date/);
  assert.throws(() => photos.add({ ...base, contentHash: "short" }), /SHA-256/);
  assert.throws(() => photos.add({ ...base, albumId: "missing" }), /no album/);
  assert.equal(contentHashOf(Buffer.from("abc")).length, 64);
});

/* ------------------------------------------------------------------- browser */

test("browser tabs keep a back/forward history", () => {
  const ledger = new EventLedger([], CLOCK);
  const browser = new BrowserSession({ ledger, clock: CLOCK });
  const tab = browser.open("https://example.test/one", "One");
  assert.equal(tab.title, "One");
  browser.navigate(tab.id, "https://example.test/two", "Two");
  browser.navigate(tab.id, "https://example.test/three", "Three");
  assert.equal(browser.back(tab.id).url, "https://example.test/two");
  assert.equal(browser.back(tab.id).url, "https://example.test/one");
  assert.equal(browser.back(tab.id).url, "https://example.test/one");
  assert.equal(browser.forward(tab.id).url, "https://example.test/two");
  browser.navigate(tab.id, "https://example.test/four", "Four");
  const state = browser.tabsList()[0]!;
  assert.deepEqual(state.history, ["https://example.test/one", "https://example.test/two", "https://example.test/four"]);
  assert.equal(state.index, 2);
  assert.equal(browser.close(tab.id), true);
  assert.equal(browser.tabsList().length, 0);
  assert.throws(() => browser.close(tab.id), /no tab/);
  assert.throws(() => browser.open("ftp://example.test"), /only http and https/);
  assert.equal(ledger.ofType("browser.tab.navigated").length, 3);
});

test("browser bookmarks, downloads and a host blocklist are real state", () => {
  const browser = new BrowserSession({ clock: CLOCK });
  const tab = browser.open("https://example.test/one", "One");
  const bookmark = browser.bookmark(tab.id, ["Read", "read"]);
  assert.deepEqual(bookmark.tags, ["read"]);
  assert.throws(() => browser.bookmark(tab.id), /already bookmarked/);
  assert.equal(browser.listBookmarks("read").length, 1);
  assert.equal(browser.listBookmarks("missing").length, 0);
  assert.equal(browser.removeBookmark(bookmark.id), true);

  const download = browser.recordDownload({ url: "https://example.test/file.pdf", filename: "file.pdf", bytes: 100, status: "completed" });
  assert.equal(browser.downloadsList()[0]?.id, download.id);
  assert.throws(() => browser.recordDownload({ url: "https://example.test/x", filename: "", bytes: 1, status: "completed" }), /filename/);

  browser.blockHost("ads.example");
  assert.deepEqual(browser.blockedHostsList(), ["ads.example"]);
  assert.equal(browser.isBlocked("https://ads.example/x"), true);
  assert.equal(browser.isBlocked("https://sub.ads.example/x"), true);
  assert.equal(browser.isBlocked("https://example.test/x"), false);
  assert.throws(() => browser.open("https://ads.example/x"), /blocked/);
  browser.unblockHost("ads.example");
  assert.equal(browser.open("https://ads.example/x").url, "https://ads.example/x");
});

test("pagination links are extracted without pretending to parse a DOM", () => {
  const browser = new BrowserSession({ clock: CLOCK });
  const html = `
    <nav>
      <a href="?page=1" rel="prev">Previous</a>
      <a href="/items?page=1">1</a>
      <a href="/items?page=3">3</a>
      <a href="/items?page=4" rel="next">Next</a>
      <a href="javascript:void(0)">2</a>
    </nav>`;
  const links = browser.paginationLinks(html, "https://example.test/items?page=2");
  assert.equal(links.previous, "https://example.test/items?page=1");
  assert.equal(links.next, "https://example.test/items?page=4");
  assert.deepEqual(links.numbered.map((link) => link.label), ["1", "3"]);
  assert.equal(browser.paginationLinks("<a href='/x'>Next page</a>", "https://example.test/").next, "https://example.test/x");
  assert.equal(browser.paginationLinks("<p>no links</p>", "https://example.test/").next, null);
});
