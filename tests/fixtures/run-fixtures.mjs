/**
 * Fixture runner — executes structural checks against generated fixtures.
 * Honest scope: these are structural fixtures, not the full acceptance fixtures.
 * Results do not earn 5-star scores; they record what was actually tested.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const gen = join(__dirname, "generated");

const cases = [
  { id: "fix-docx-structural", file: "golden_structural.docx", kind: "zip", mustContain: ["word/document.xml", "w:document"] },
  { id: "fix-xlsx-structural", file: "golden_structural.xlsx", kind: "zip", mustContain: ["xl/workbook.xml", "sheetData"] },
  { id: "fix-pptx-structural", file: "golden_structural.pptx", kind: "zip", mustContain: ["ppt/presentation.xml", "p:presentation"] },
  { id: "fix-pdf-structural", file: "golden_structural.pdf", kind: "pdf", mustContain: ["%PDF-1.4", "%%EOF"] },
];

const results = [];
for (const c of cases) {
  const path = join(gen, c.file);
  if (!existsSync(path)) {
    results.push({ ...c, passed: false, reason: "missing file" });
    continue;
  }
  const buf = readFileSync(path);
  const head = buf.subarray(0, 4).toString("latin1");
  const text = buf.toString("latin1");
  const signatureOk = c.kind === "zip" ? head.startsWith("PK\x03\x04") : head.startsWith("%PDF");
  const contentOk = c.mustContain.every((s) => text.includes(s));
  results.push({
    id: c.id,
    file: c.file,
    bytes: buf.length,
    signatureOk,
    contentOk,
    passed: signatureOk && contentOk,
    scope: "structural only; not full acceptance fixture",
  });
}

const report = {
  runAt: new Date().toISOString(),
  fixtureScope: "STRUCTURAL — not the full DOCX-200page / XLSX-1Mrow / media / CAD acceptance fixtures",
  passed: results.filter((r) => r.passed).length,
  total: results.length,
  results,
  note: "Passing structural checks does not earn any 5-star dimension score.",
};
writeFileSync(join(__dirname, "fixture-results.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
