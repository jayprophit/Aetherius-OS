import { test } from "node:test";
import assert from "node:assert/strict";
import { JournalApp } from "../src/journal.ts";

test("journal entries track date, mood, tags and can filter", () => {
  const journal = new JournalApp();
  const entry = journal.create({
    date: "2026-10-29",
    title: "Day one",
    body: "Today I started the project.",
    mood: "excited",
    tags: ["start", "project"],
  });
  assert.strictEqual(entry.date, "2026-10-29");
  assert.strictEqual(entry.mood, "excited");
  assert.deepStrictEqual(entry.tags, ["project", "start"]);

  const byDate = journal.byDate("2026-10-29");
  assert.strictEqual(byDate.length, 1);

  const byTag = journal.byTag("project");
  assert.strictEqual(byTag.length, 1);

  const updated = journal.update(entry.id, { mood: "happy" });
  assert.strictEqual(updated.mood, "happy");

  assert.strictEqual(journal.delete(entry.id), true);
});