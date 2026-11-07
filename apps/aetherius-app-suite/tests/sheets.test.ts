import { test } from "node:test";
import assert from "node:assert/strict";
import { SheetsApp } from "../src/sheets.ts";

test("sheets creates, evaluates formulas and exports CSV", () => {
  const sheets = new SheetsApp();
  const sheet = sheets.create({ title: "Budget" });
  const session = sheets.session(sheet.id);
  session.set("A1", 10);
  session.set("B1", 20);
  session.set("C1", "=A1+B1");
  assert.strictEqual(session.get("C1")?.value, 30);

  const committed = sheets.commit(sheet.id);
  assert.strictEqual(committed.version, 2);
  assert.strictEqual(committed.data.includes("30"), true);

  const csv = session.toCsv();
  assert.strictEqual(csv.includes("10"), true);
  assert.strictEqual(csv.includes("20"), true);

  assert.strictEqual(sheets.delete(sheet.id), true);
});