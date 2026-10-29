import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { EventLedger } from "../../app-kit/src/index.ts";
import { MailApp } from "../src/mail.ts";
import { ContactsApp } from "../src/contacts.ts";
import { ClockApp } from "../src/clock.ts";
import { TasksApp } from "../src/tasks.ts";
import { MusicApp, VideoLibrary } from "../src/media.ts";
import { VirtualFiles } from "../src/files.ts";
import { TerminalSession } from "../src/terminal.ts";
import { PaintDocument } from "../src/paint.ts";
import { WriterDocument, Spreadsheet, SlideDeck } from "../src/office.ts";
import {
  APP_CATALOG,
  DEPLOYMENT_TARGETS,
  OS_FAMILIES,
  appsFor,
  coreApps,
  deploymentPlan,
  uniqueApps,
  validateCatalog,
} from "../src/catalog.ts";

const CLOCK = () => new Date("2026-10-29T00:00:00.000Z");

/* ----------------------------------------------------------------------- mail */

test("mail receives, threads, drafts, sends, moves and searches", () => {
  const ledger = new EventLedger([], CLOCK);
  const mail = new MailApp({ ledger, clock: CLOCK });
  const account = mail.addAccount({ name: "Owner", address: "owner@example.com" });
  const received = mail.receive(account.id, {
    from: { name: "Ada", address: "ada@example.com" },
    to: ["owner@example.com"],
    subject: "Re: Project",
    body: "The build is ready",
  });
  assert.equal(received.folder, "inbox");
  assert.equal(received.threadId, "project");
  assert.equal(mail.unreadCount(account.id), 1);

  const draft = mail.saveDraft(account.id, {
    to: ["ada@example.com"],
    subject: "Re: Project",
    body: "Thanks",
  });
  assert.equal(draft.folder, "drafts");
  const sent = mail.send(draft.id);
  assert.equal(sent.folder, "sent");
  assert.ok(sent.sentAt);

  const moved = mail.move(received.id, "archive");
  assert.equal(moved.folder, "archive");
  assert.equal(mail.list({ folder: "archive" }).length, 1);
  assert.equal(mail.search("build project").length, 1);
  assert.equal(mail.thread("project").length, 2);
  assert.equal(ledger.ofType("mail.sent").length, 1);
  assert.throws(() => mail.move(received.id, "nowhere" as never), /unknown mail folder/);
  assert.throws(() => mail.receive(account.id, {
    from: "bad",
    to: ["owner@example.com"],
    body: "x",
  }), /not an email/);
  assert.throws(() => mail.receive(account.id, {
    from: "ada@example.com",
    to: ["owner@example.com"],
    body: "x",
    attachments: [{ name: "big.bin", mime: "application/octet-stream", bytes: 26 * 1024 * 1024 }],
  }), /exceeds/);
});

/* ------------------------------------------------------------------- contacts */

test("contacts merge duplicates and export vCard", () => {
  const contacts = new ContactsApp({ clock: CLOCK });
  const first = contacts.create({
    givenName: "Ada",
    familyName: "Lovelace",
    emails: ["ADA@example.com", "ada@example.com"],
    phones: ["+44 20 0000 0000"],
    groups: ["Work"],
  });
  const second = contacts.create({
    givenName: "Ada",
    familyName: "L",
    emails: ["ada@example.com"],
    groups: ["Friends"],
  });
  assert.deepEqual(first.emails, ["ada@example.com"]);
  assert.equal(contacts.duplicates().length, 1);
  const merged = contacts.merge(first.id, second.id);
  assert.deepEqual(merged.groups, ["friends", "work"]);
  assert.equal(contacts.get(second.id), undefined);
  const card = contacts.toVCard(first.id);
  assert.match(card, /BEGIN:VCARD/);
  assert.match(card, /FN:Ada Lovelace/);
  assert.match(card, /CATEGORIES:friends/);
  assert.match(card, /END:VCARD/);
  assert.equal(contacts.list({ query: "lovelace" }).length, 1);
});

/* ---------------------------------------------------------------------- clock */

test("clock schedules alarms, runs timers and records stopwatch laps", () => {
  const clock = new ClockApp({ clock: CLOCK });
  const alarm = clock.addAlarm({ label: "Stand-up", hour: 9, minute: 0 });
  const next = clock.nextAlarmTime(alarm.id, new Date("2026-10-29T08:00:00.000Z"));
  assert.equal(next?.toISOString(), "2026-10-29T09:00:00.000Z");
  assert.equal(clock.triggerDue(new Date("2026-10-29T09:00:00.000Z")).length, 1);
  assert.equal(clock.triggerDue(new Date("2026-10-29T09:00:00.000Z")).length, 0);
  clock.setAlarmEnabled(alarm.id, false);
  assert.equal(clock.nextAlarmTime(alarm.id), undefined);

  const timer = clock.startTimer("Tea", 60_000);
  const half = clock.tickTimer(timer.id, new Date("2026-10-29T00:00:30.000Z"));
  assert.equal(half.remainingMs, 30_000);
  const done = clock.tickTimer(timer.id, new Date("2026-10-29T00:01:00.000Z"));
  assert.equal(done.remainingMs, 0);
  assert.equal(done.running, false);

  clock.startStopwatch();
  assert.equal(clock.lap(new Date("2026-10-29T00:00:01.000Z")).splitMs, 1_000);
  assert.equal(clock.lap(new Date("2026-10-29T00:00:02.500Z")).splitMs, 1_500);
  assert.equal(clock.stopStopwatch(new Date("2026-10-29T00:00:03.000Z")).elapsedMs, 3_000);
  assert.match(clock.worldTime("UTC", new Date("2026-10-29T09:05:00.000Z")), /09:05/);
  assert.throws(() => clock.worldTime("Mars/Olympus"), /unknown time zone/);
});

/* ---------------------------------------------------------------------- tasks */

test("tasks recur, sort, search and report overdue work", () => {
  const tasks = new TasksApp({ clock: CLOCK });
  const list = tasks.createList("Work");
  const task = tasks.create({
    listId: list.id,
    title: "Weekly review",
    dueAt: "2026-10-29T09:00:00.000Z",
    priority: 2,
    tags: ["Review", "weekly"],
    recurrence: { every: "week", interval: 1 },
  });
  assert.equal(tasks.overdue(new Date("2026-10-29T10:00:00.000Z")).length, 1);
  const result = tasks.complete(task.id);
  assert.equal(result.completed.completed, true);
  assert.equal(result.next?.dueAt, "2026-11-05T09:00:00.000Z");
  assert.equal(tasks.list({ tag: "weekly" }).length, 2);
  assert.equal(tasks.list({ tag: "weekly", completed: false }).length, 1);
  assert.equal(tasks.list({ query: "review" }).length, 2);
  assert.throws(() => tasks.complete(task.id), /already complete/);
});

/* ---------------------------------------------------------------------- media */

test("music queues, seeks and shuffles deterministically; video trims and subtitles", () => {
  const music = new MusicApp({ clock: CLOCK });
  const first = music.addTrack({ title: "First", artist: "A", album: "One", durationMs: 180_000, genre: "pop" });
  const second = music.addTrack({ title: "Second", artist: "B", album: "Two", durationMs: 200_000, genre: "rock" });
  const playlist = music.createPlaylist("Mix");
  music.addToPlaylist(playlist.id, first.id);
  music.addToPlaylist(playlist.id, second.id);
  assert.equal(music.playlist(playlist.id)?.trackIds.length, 2);
  music.queueTracks([first.id, second.id]);
  assert.equal(music.play()?.id, first.id);
  music.seek(90_000);
  assert.equal(music.state().positionMs, 90_000);
  assert.equal(music.next()?.id, second.id);
  assert.equal(music.previous()?.id, first.id);
  assert.throws(() => music.seek(999_999), /outside the track/);
  music.queueTracks([first.id, second.id]);
  const shuffled = music.shuffle(7);
  music.queueTracks([first.id, second.id]);
  assert.deepEqual(music.shuffle(7), shuffled);

  const videos = new VideoLibrary();
  const video = videos.add({
    title: "Demo",
    durationMs: 60_000,
    subtitles: [{ lang: "EN", cues: [{ startMs: 0, endMs: 2_000, text: "Hello" }] }],
  });
  assert.deepEqual(videos.subtitlesAt(video.id, 1_000), ["Hello"]);
  assert.equal(videos.setTrim(video.id, 5_000, 15_000).trim?.endMs, 15_000);
  assert.throws(() => videos.setTrim(video.id, 20_000, 10_000), /positive length/);
});

/* ------------------------------------------------------------------- terminal */

test("the terminal runs allowlisted commands and refuses shell escapes", () => {
  const files = new VirtualFiles({ clock: CLOCK });
  files.mkdir("/docs");
  files.write("/docs/readme.md", "alpha\nbeta\n");
  const terminal = new TerminalSession({ files, clock: CLOCK });
  assert.equal(terminal.run("pwd").stdout, "/\n");
  assert.equal(terminal.run("cd docs").exitCode, 0);
  assert.equal(terminal.run("pwd").stdout, "/docs\n");
  assert.equal(terminal.run("cat readme.md").stdout, "alpha\nbeta\n");
  assert.match(terminal.run("ls").stdout, /readme\.md/);
  assert.equal(terminal.run("grep beta readme.md").stdout, "/docs/readme.md:2:beta\n");
  assert.equal(terminal.run("wc readme.md").stdout, "2 11 /docs/readme.md\n");
  assert.equal(terminal.run("echo hello").stdout, "hello\n");
  assert.equal(terminal.run("echo hi | cat").exitCode, 2);
  assert.equal(terminal.run("nope").exitCode, 127);
  assert.equal(terminal.run("cd missing").exitCode, 1);
  assert.equal(terminal.run("rm -r /docs").exitCode, 0);
  assert.equal(files.stat("/docs"), undefined);
});

/* ---------------------------------------------------------------------- paint */

test("paint layers, shapes, undo/redo and SVG export", () => {
  const paint = new PaintDocument({ clock: CLOCK, width: 800, height: 600 });
  const background = paint.layersList()[0]!;
  const rect = paint.addShape(background.id, {
    kind: "rect",
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    fill: "#ff0000",
    stroke: "#000000",
    strokeWidth: 2,
  });
  const layer = paint.addLayer("Text");
  paint.addShape(layer.id, {
    kind: "text",
    x: 10,
    y: 100,
    width: 200,
    height: 30,
    fill: "#000000",
    stroke: "none",
    strokeWidth: 0,
    text: "Hello & <world>",
  });
  const svg = paint.toSvg();
  assert.match(svg, /<rect x="10" y="20"/);
  assert.match(svg, /Hello &amp; &lt;world&gt;/);
  assert.equal(paint.undo(), true);
  assert.doesNotMatch(paint.toSvg(), /Hello/);
  assert.equal(paint.redo(), true);
  assert.match(paint.toSvg(), /Hello/);
  assert.equal(paint.removeShape(background.id, rect.id), true);
  assert.throws(() => paint.setLayerOpacity(layer.id, 2), /between 0 and 1/);
});

/* --------------------------------------------------------------------- office */

test("writer, spreadsheet and slides produce deterministic exports", () => {
  const writer = new WriterDocument({ clock: CLOCK });
  writer.append("heading", "Title", 1);
  writer.append("paragraph", "Two words");
  writer.append("bullet", "A point");
  assert.equal(writer.wordCount(), 5);
  assert.match(writer.toMarkdown(), /^# Title/);
  assert.match(writer.toMarkdown(), /- A point/);

  const sheet = new Spreadsheet({ clock: CLOCK });
  sheet.set("A1", 2);
  sheet.set("B1", 3);
  const formula = sheet.set("C1", "=A1+B1");
  assert.equal(formula.value, 5);
  sheet.set("A1", 10);
  assert.equal(sheet.get("C1")?.value, 13);
  assert.equal(sheet.range("A1", "C1").length, 3);
  assert.equal(sheet.toCsv(), "10,3,13");
  sheet.set("D1", "=D1+1");
  assert.equal(sheet.get("D1")?.error, "circular reference");

  const deck = new SlideDeck({ clock: CLOCK });
  const slide = deck.addSlide("Intro");
  deck.addElement(slide.id, { kind: "title", text: "Hello", x: 10, y: 10, width: 400, height: 80 });
  deck.setNotes(slide.id, "Speak clearly");
  assert.match(deck.toOutline(), /1\. Intro/);
  assert.match(deck.toOutline(), /title: Hello/);
});

/* -------------------------------------------------------------------- catalog */

test("the app catalogue covers every OS, every core module exists and deployment plans are honest", () => {
  assert.deepEqual(validateCatalog(), []);
  assert.ok(coreApps().length >= 20);
  assert.ok(APP_CATALOG.length >= 40);
  for (const os of OS_FAMILIES) {
    assert.ok(appsFor(os).length > 0, `${os} has no apps`);
  }
  assert.ok(uniqueApps("aetherius").some((app) => app.id === "genesis-console"));
  assert.ok(uniqueApps("microsoft").some((app) => app.id === "system-console"));
  assert.ok(uniqueApps("apple").some((app) => app.id === "spotlight-search"));
  assert.ok(uniqueApps("ios").some((app) => app.id === "wallet"));
  assert.ok(uniqueApps("android").some((app) => app.id === "android-keyboard"));
  assert.ok(uniqueApps("linux").some((app) => app.id === "linux-package-manager"));
  assert.ok(uniqueApps("google").some((app) => app.id === "chromeos-linux"));

  for (const app of APP_CATALOG.filter((entry) => entry.maturity === "CORE")) {
    const path = fileURLToPath(new URL(`../${app.coreModule}`, import.meta.url));
    assert.ok(existsSync(path), `${app.id} core module is missing: ${path}`);
  }

  const signed = deploymentPlan("notes", "microsoft", { signed: true });
  assert.deepEqual(signed.formats, ["msix"]);
  assert.ok(DEPLOYMENT_TARGETS.microsoft.formats.includes("exe"));
  assert.deepEqual(signed.blockers, []);
  const unsigned = deploymentPlan("notes", "apple", { signed: false });
  assert.match(unsigned.blockers.join(" "), /notarisation/);
  const planned = deploymentPlan("camera", "android", { signed: true });
  assert.match(planned.blockers.join(" "), /PLANNED/);
  assert.throws(() => deploymentPlan("genesis-console", "microsoft"), /not available/);
});
