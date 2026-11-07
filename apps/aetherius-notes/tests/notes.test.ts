import { describe, it } from "node:test";
import assert from "node:assert";
import { NotesService } from "../src/domain.ts";
import { existsSync, mkdirSync, rmSync } from "node:fs";

describe("NotesService", () => {
  const testDir = "test-notes-data";

  it("creates and updates notes", () => {
    const notes = new NotesService({ storageDir: testDir });
    const note = notes.create("Todo", "Buy milk", ["personal"]);
    assert.equal(note.title, "Todo");
    assert.equal(note.createdAt, note.updatedAt);
    notes.update(note.id, "Buy eggs");
    assert.equal(notes.list()[0].body, "Buy eggs");
  });

  it("throws on missing note update", () => {
    const notes = new NotesService({ storageDir: testDir });
    assert.throws(() => notes.update("nonexistent", "text"), /note not found/);
  });

  it("persists and reloads notes", () => {
    const notes1 = new NotesService({ storageDir: testDir });
    const note = notes1.create("Persistent", " survives restart", ["test"]);
    const id = note.id;

    const notes2 = new NotesService({ storageDir: testDir });
    notes2.load();
    const recovered = notes2.recover(id);
    assert.ok(recovered, "recovered note should exist");
    assert.equal(recovered?.title, "Persistent");
    assert.equal(recovered?.body, " survives restart");
  });

  it("exports note as markdown", () => {
    const notes = new NotesService({ storageDir: testDir });
    const note = notes.create("Export Me", "content here", ["work"]);
    const md = notes.export(note.id, "md");
    assert.ok(md.includes("# Export Me"));
    assert.ok(md.includes("content here"));
  });

  it("exports note as json", () => {
    const notes = new NotesService({ storageDir: testDir });
    const note = notes.create("JSON Export", "json body", ["dev"]);
    const json = notes.export(note.id, "json");
    const parsed = JSON.parse(json);
    assert.equal(parsed.title, "JSON Export");
    assert.equal(parsed.body, "json body");
  });

  it("returns empty list when storage is empty", () => {
    const emptyDir = "test-notes-empty";
    if (existsSync(emptyDir)) rmSync(emptyDir, { recursive: true });
    const notes = new NotesService({ storageDir: emptyDir });
    notes.load();
    assert.equal(notes.list().length, 0);
    if (existsSync(emptyDir)) rmSync(emptyDir, { recursive: true });
  });
});
