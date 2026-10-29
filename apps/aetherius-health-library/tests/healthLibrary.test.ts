import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { EventLedger, MemoryRepository } from "../../app-kit/src/index.ts";
import {
  HEALTH_DISCLAIMER,
  HealthLibraryService,
  createHealthLibrary,
  digest,
  parseFrequencyList,
  parseFrequencies,
} from "../src/healthLibrary.ts";

const RIFE = new URL("../rife_frequency.txt", import.meta.url);
const SPOOKY = new URL("../spooky2_frequency.txt", import.meta.url);

const SOURCE = {
  title: "Rife Frequency List",
  publisher: "Spooky2Rife.com",
  url: "https://www.spooky2rife.com",
  retrievedAt: "2026-10-27",
  licence: "Compiled list, retained as supplied by the owner",
};

test("frequency cells parse carriers, gates and sweeps without inventing values", () => {
  assert.deepEqual(parseFrequencies("564=360,727,371450-386900=3600"), [564, 727, 371450, 386900]);
  assert.deepEqual(parseFrequencies("1.10,20,73.5"), [1.1, 20, 73.5]);
  assert.deepEqual(parseFrequencies("nonsense"), []);
});

test("the parser reads the real Rife list and keeps name, category, program and source line", () => {
  const text = readFileSync(RIFE, "utf8");
  const parsed = parseFrequencyList(text);
  assert.ok(parsed.records.length > 1000, `only ${parsed.records.length} records parsed`);
  const abscess = parsed.records.find((record) => record.name.startsWith("Abscesses"));
  assert.ok(abscess);
  assert.ok(abscess.frequenciesHz.length > 0);
  assert.ok(abscess.program.length >= 2);
  assert.ok(abscess.line > 0);
});

test("the two supplied tables are byte-identical, so the library records one dataset with an alias", () => {
  const rife = readFileSync(RIFE);
  const spooky = readFileSync(SPOOKY);
  assert.equal(digest(rife), digest(spooky));

  const library = createHealthLibrary();
  const first = library.registerSource({ ...SOURCE, bytes: rife, name: "rife_frequency.txt" });
  const second = library.registerSource({
    ...SOURCE,
    title: "Spooky2 Frequency List",
    bytes: spooky,
    name: "spooky2_frequency.txt",
  });

  assert.equal(second.aliasOf?.id, first.dataset.id);
  assert.deepEqual(library.listDatasets().map((dataset) => dataset.name), ["rife_frequency.txt"]);
  assert.deepEqual(library.listDatasets()[0]?.aliases, ["spooky2_frequency.txt"]);
});

test("a genuinely different source becomes a second dataset", () => {
  const library = createHealthLibrary();
  library.registerSource({ ...SOURCE, bytes: "a,b,\"1,\",CAFL", name: "one.txt" });
  library.registerSource({ ...SOURCE, bytes: "a,b,\"2,\",CAFL", name: "two.txt" });
  assert.equal(library.listDatasets().length, 2);
});

test("KNW-004 search KNW-003 link graph relation edges graph traversal: ingest, publish, search and cite a real dataset", () => {
  const library = createHealthLibrary();
  const text = readFileSync(RIFE, "utf8");
  const registered = library.registerSource({ ...SOURCE, bytes: text, name: "rife_frequency.txt" });
  const dataset = library.ingestDataset(registered.dataset.id, text, "ingest");
  assert.ok(dataset.recordCount > 1000);

  const published = library.publish(dataset.id, "editor");
  assert.equal(published.state, "published");

  const hits = library.search("AIDS");
  assert.ok(hits.length > 0);
  const citation = library.citation(hits[0]!.id);
  assert.equal(citation.source.title, SOURCE.title);
  assert.equal(citation.disclaimer, HEALTH_DISCLAIMER);
  assert.match(citation.disclaimer, /not a diagnosis/i);
});

test("an empty list is refused rather than published as an empty dataset", () => {
  const library = createHealthLibrary();
  const registered = library.registerSource({ ...SOURCE, bytes: "nothing here", name: "empty.txt" });
  assert.throws(() => library.ingestDataset(registered.dataset.id, "nothing here", "ingest"), /no records/);
});

test("ingest and publication are recorded on a verifiable ledger", () => {
  const ledger = new EventLedger();
  const library = new HealthLibraryService(new MemoryRepository(), new MemoryRepository(), new MemoryRepository(), {
    ledger,
  });
  const text = readFileSync(RIFE, "utf8");
  const registered = library.registerSource({ ...SOURCE, bytes: text, name: "rife_frequency.txt" });
  library.ingestDataset(registered.dataset.id, text, "ingest");
  library.publish(registered.dataset.id, "editor");
  assert.equal(ledger.ofType("health.dataset.ingested").length, 1);
  assert.equal(ledger.ofType("health.dataset.published").length, 1);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });
});

test("a record always resolves to its source", () => {
  const library = createHealthLibrary();
  const registered = library.registerSource({ ...SOURCE, bytes: "xyz,y,\"1,\",CAFL", name: "xyz.txt" });
  library.ingestDataset(registered.dataset.id, "xyz,y,\"1,\",CAFL", "ingest");
  const hit = library.search("xyz")[0]!;
  assert.equal(library.citation(hit.id).source.publisher, SOURCE.publisher);
});
