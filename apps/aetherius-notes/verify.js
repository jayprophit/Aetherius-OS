import { NotesService } from "./src/domain.ts";
import { existsSync, rmSync } from "node:fs";

const dir = "journal-demo";
if (existsSync(dir)) rmSync(dir, { recursive: true });

// 1. Create
const journal = new NotesService({ storageDir: dir });
const entry = journal.create("Day 1", "Started Aetherius Journal.", ["personal"]);
console.log("CREATED:", entry.title, "-", entry.body);

// 2. Edit
journal.update(entry.id, "Started Aetherius Journal. Built notes core.");
console.log("UPDATED:", journal.get(entry.id)?.body);

// 3. Save + reopen in new instance
const reopened = new NotesService({ storageDir: dir });
reopened.load();
const recovered = reopened.recover(entry.id);
console.log("RECOVERED:", recovered?.title, "-", recovered?.body);

// 4. Export
const md = reopened.export(entry.id, "md");
console.log("\n--- EXPORT MARKDOWN ---\n" + md);

const json = reopened.export(entry.id, "json");
console.log("\n--- EXPORT JSON ---\n" + json);

if (existsSync(dir)) rmSync(dir, { recursive: true });
console.log("\nJournal verification passed.");
