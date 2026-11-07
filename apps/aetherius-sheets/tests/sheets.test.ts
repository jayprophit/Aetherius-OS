import { describe, it } from "node:test";
import assert from "node:assert";
import { Sheets } from "../src/domain.ts";
import { existsSync, rmSync } from "node:fs";

describe("Sheets", () => {
  const testDir = "test-sheets-data";

  it("creates workbook and sets cells", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Test");
    assert.equal(wb.name, "Test");
    sheets.setCell(wb.id, wb.sheets[0].id, "A1", "hello");
    assert.equal(sheets.getCell(wb.id, wb.sheets[0].id, "A1")?.value, "hello");
  });

  it("parses numbers", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Nums");
    sheets.setCell(wb.id, wb.sheets[0].id, "B2", "42");
    assert.equal(sheets.getCell(wb.id, wb.sheets[0].id, "B2")?.value, 42);
  });

  it("evaluates simple formulas", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Formulas");
    sheets.setCell(wb.id, wb.sheets[0].id, "A1", "10");
    sheets.setCell(wb.id, wb.sheets[0].id, "B1", "20");
    sheets.setCell(wb.id, wb.sheets[0].id, "C1", "=A1+B1");
    assert.equal(sheets.getCell(wb.id, wb.sheets[0].id, "C1")?.value, 30);
  });

  it("detects circular references", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Circular");
    sheets.setCell(wb.id, wb.sheets[0].id, "A1", "=B1");
    sheets.setCell(wb.id, wb.sheets[0].id, "B1", "=A1");
    const cell = sheets.getCell(wb.id, wb.sheets[0].id, "B1");
    assert.equal(cell?.error, "CIRCULAR_REF");
  });

  it("persists and reloads workbooks", () => {
    const sheets1 = new Sheets({ storageDir: testDir });
    const wb = sheets1.createWorkbook("Persistent");
    sheets1.setCell(wb.id, wb.sheets[0].id, "A1", "saved");
    const id = wb.id;

    const sheets2 = new Sheets({ storageDir: testDir });
    sheets2.load();
    const recovered = sheets2.getWorkbook(id);
    assert.ok(recovered, "recovered workbook should exist");
    assert.equal(recovered?.name, "Persistent");
    assert.equal(sheets2.getCell(id, recovered!.sheets[0].id, "A1")?.value, "saved");
  });

  it("exports CSV", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("CSV");
    const sid = wb.sheets[0].id;
    sheets.setCell(wb.id, sid, "A1", "Name");
    sheets.setCell(wb.id, sid, "B1", "Age");
    sheets.setCell(wb.id, sid, "A2", "Alice");
    sheets.setCell(wb.id, sid, "B2", "30");
    const csv = sheets.exportCsv(wb.id, sid);
    assert.ok(csv.includes("Name,Age"));
    assert.ok(csv.includes("Alice,30"));
  });

  it("rejects invalid operations", () => {
    const sheets = new Sheets({ storageDir: testDir });
    assert.throws(() => sheets.setCell("nonexistent", "sid", "A1", "x"), /workbook not found/);
    assert.throws(() => sheets.getCell("nonexistent", "sid", "A1"), /workbook not found/);
    
    const wb = sheets.createWorkbook("InvalidTest");
    const sid = wb.sheets[0].id;
    assert.throws(() => sheets.setCell(wb.id, sid, "1A", "x"), /invalid cell reference/);
    assert.throws(() => sheets.setCell(wb.id, sid, "", "x"), /invalid cell reference/);
  });

  it("evaluates formulas with parentheses and operator precedence", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Precedence");
    sheets.setCell(wb.id, wb.sheets[0].id, "A1", "10");
    sheets.setCell(wb.id, wb.sheets[0].id, "B1", "20");
    sheets.setCell(wb.id, wb.sheets[0].id, "C1", "=(A1+B1)*2");
    assert.equal(sheets.getCell(wb.id, wb.sheets[0].id, "C1")?.value, 60);
  });

  it("evaluates SUM, AVERAGE, MIN, MAX, COUNT functions", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Functions");
    const sid = wb.sheets[0].id;
    sheets.setCell(wb.id, sid, "A1", "10");
    sheets.setCell(wb.id, sid, "A2", "20");
    sheets.setCell(wb.id, sid, "A3", "30");
    sheets.setCell(wb.id, sid, "B1", "=SUM(A1:A3)");
    sheets.setCell(wb.id, sid, "B2", "=AVERAGE(A1:A3)");
    sheets.setCell(wb.id, sid, "B3", "=MIN(A1:A3)");
    sheets.setCell(wb.id, sid, "B4", "=MAX(A1:A3)");
    sheets.setCell(wb.id, sid, "B5", "=COUNT(A1:A3)");
    assert.equal(sheets.getCell(wb.id, sid, "B1")?.value, 60);
    assert.equal(sheets.getCell(wb.id, sid, "B2")?.value, 20);
    assert.equal(sheets.getCell(wb.id, sid, "B3")?.value, 10);
    assert.equal(sheets.getCell(wb.id, sid, "B4")?.value, 30);
    assert.equal(sheets.getCell(wb.id, sid, "B5")?.value, 3);
  });

  it("recalculates dependent cells on source change", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Recalc");
    const sid = wb.sheets[0].id;
    sheets.setCell(wb.id, sid, "A1", "5");
    sheets.setCell(wb.id, sid, "B1", "=A1*2");
    assert.equal(sheets.getCell(wb.id, sid, "B1")?.value, 10);

    sheets.setCell(wb.id, sid, "A1", "10");
    assert.equal(sheets.getCell(wb.id, sid, "B1")?.value, 20);
  });

  it("rejects division by zero", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("DivZero");
    sheets.setCell(wb.id, wb.sheets[0].id, "A1", "10");
    sheets.setCell(wb.id, wb.sheets[0].id, "B1", "=A1/0");
    assert.equal(sheets.getCell(wb.id, wb.sheets[0].id, "B1")?.error, "DIV_BY_ZERO");
  });

  it("rejects unsupported functions", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Unsupported");
    sheets.setCell(wb.id, wb.sheets[0].id, "A1", "=UNKNOWN(1,2)");
    assert.ok(sheets.getCell(wb.id, wb.sheets[0].id, "A1")?.error?.startsWith("UNKNOWN_FUNCTION"));
  });

  it("rejects formula injection in CSV export", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Injection");
    const sid = wb.sheets[0].id;
    // Literal strings that look like formulas should be neutralised in spreadsheet-safe profile
    sheets.setCell(wb.id, sid, "A1", "=1+1");
    sheets.setCell(wb.id, sid, "A2", "+2");
    sheets.setCell(wb.id, sid, "A3", "-3");
    sheets.setCell(wb.id, sid, "A4", "@4");
    // Data-exchange exports evaluated values for formula cells
    const csv = sheets.exportCsv(wb.id, sid);
    const lines = csv.split("\n");
    // Formula cells export their evaluated numeric results
    assert.equal(lines[0], "2"); // =1+1 evaluates to 2
    assert.equal(lines[1], "2"); // +2 evaluates to 2
    // Spreadsheet-safe profile neutralises dangerous prefixes
    const safeCsv = sheets.exportCsvProfile(wb.id, sid, "spreadsheet-safe");
    const safeLines = safeCsv.split("\n");
    assert.ok(safeLines[2].startsWith("\t"), "negative numbers should be neutralised in spreadsheet-safe");
    assert.ok(safeLines[3].startsWith("\t"), "@-prefixed values should be neutralised in spreadsheet-safe");
  });

  it("exports valid CSV with proper quoting", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("CSVQuote");
    const sid = wb.sheets[0].id;
    sheets.setCell(wb.id, sid, "A1", "Hello, World");
    sheets.setCell(wb.id, sid, "B1", "She said \"Hi\"");
    sheets.setCell(wb.id, sid, "C1", "Line1\nLine2");
    const csv = sheets.exportCsv(wb.id, sid);
    const lines = csv.split("\n");
    assert.ok(lines[0].includes('"Hello, World"'), "commas should trigger quoting");
    assert.ok(lines[0].includes('"She said ""Hi""'), "double quotes should be escaped");
    assert.ok(lines[0].includes('"Line1'), "embedded newlines should trigger quoting");
    assert.ok(lines[1] === 'Line2"', "quoted field should span multiple lines");
  });

  it("tracks dependency graph", () => {
    const sheets = new Sheets({ storageDir: testDir });
    const wb = sheets.createWorkbook("Deps");
    const sid = wb.sheets[0].id;
    sheets.setCell(wb.id, sid, "A1", "10");
    sheets.setCell(wb.id, sid, "B1", "=A1*2");
    sheets.setCell(wb.id, sid, "C1", "=B1+1");
    const graph = sheets.getDependencyGraph(wb.id, sid);
    assert.ok(graph["B1"]?.includes("A1"));
    assert.ok(graph["C1"]?.includes("B1"));
  });
});
