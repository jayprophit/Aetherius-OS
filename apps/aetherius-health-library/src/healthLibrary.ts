import { createHash } from "node:crypto";

import { EventLedger, MemoryRepository, SearchIndex, newId, nowIso, slugify } from "../../app-kit/src/index.ts";
import type { Repository } from "../../app-kit/src/index.ts";

/**
 * Health Library domain slice.
 *
 * This is a knowledge archive, not a treatment system. The frequency tables
 * are historical reference material; the library records what a source says
 * and never turns a listing into a diagnosis or a prescription.
 */

export const HEALTH_DISCLAIMER =
  "Historical reference only. Frequency lists are not a diagnosis, treatment or medical advice. " +
  "Do not use this library to delay qualified care.";

export const LIBRARY_RULES_VERSION = "health-library-1.0.0";

export interface FrequencyRecord {
  id: string;
  slug: string;
  name: string;
  category: string;
  program: string;
  frequenciesHz: number[];
  rawFrequencies: string;
  sourceId: string;
  line: number;
}

export interface FrequencySource {
  id: string;
  title: string;
  publisher: string;
  url: string | null;
  retrievedAt: string;
  licence: string;
  digest: string;
  bytes: number;
}

export interface FrequencyDataset {
  id: string;
  sourceId: string;
  name: string;
  digest: string;
  recordCount: number;
  aliases: string[];
  state: "draft" | "published" | "archived";
  version: number;
  ingestedAt: string;
}

export interface ParseResult {
  records: Omit<FrequencyRecord, "id" | "slug" | "sourceId">[];
  skipped: number;
}

const SEPARATOR = "\u007f\u00a0";

/**
 * The source file is one long stream of records separated by DEL + NBSP,
 * interleaved with page headers. A record is:
 *
 *   Name,Category,"1.2,3.4,",PROGRAM
 *
 * The frequency cell may contain `a=b` (a carrier with a gating value) and
 * `a-b=c` (a swept range). The raw cell is kept beside the parsed numbers so
 * a reader can check the interpretation.
 */
export function parseFrequencyList(text: string): ParseResult {
  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const chunks = normalised.split(SEPARATOR);
  const records: ParseResult["records"] = [];
  let skipped = 0;
  let line = 0;

  for (const chunk of chunks) {
    line += 1;
    const candidate = chunk
      .replace(/^\s+/, "")
      .replace(/\s+$/, "")
      .replace(/^--- Page \d+ ---\s*/i, "")
      .trim();
    if (!candidate) continue;

    const match = /^(.*),([^,"]*),"([0-9][0-9.,=\- ]*)",([A-Za-z]{2,8})$/.exec(candidate);
    if (!match) {
      skipped += 1;
      continue;
    }
    const name = match[1]!.replace(/\s+/g, " ").trim();
    const category = match[2]!.replace(/\s+/g, " ").trim();
    const raw = match[3]!.trim().replace(/\s+/g, "");
    const program = match[4]!.toUpperCase();
    if (!name || !raw) {
      skipped += 1;
      continue;
    }
    const frequenciesHz = parseFrequencies(raw);
    if (frequenciesHz.length === 0) {
      skipped += 1;
      continue;
    }
    records.push({ name, category, program, frequenciesHz, rawFrequencies: raw, line });
  }

  return { records, skipped };
}

export function parseFrequencies(raw: string): number[] {
  const values: number[] = [];
  for (const part of raw.split(",")) {
    const token = part.trim();
    if (!token) continue;
    // "371450-386900=3600" is a sweep: record both ends, not the gate.
    const sweep = /^(-?\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)(?:=-?\d+(?:\.\d+)?)?$/.exec(token);
    if (sweep) {
      values.push(Number(sweep[1]), Number(sweep[2]));
      continue;
    }
    const carrier = /^(-?\d+(?:\.\d+)?)(?:=-?\d+(?:\.\d+)?)?$/.exec(token);
    if (carrier) values.push(Number(carrier[1]));
  }
  return values.filter((value) => Number.isFinite(value) && value >= 0);
}

export function digest(text: string | Uint8Array): string {
  return createHash("sha256").update(text).digest("hex");
}

export class HealthLibraryService {
  private readonly records: Repository<FrequencyRecord>;
  private readonly sources: Repository<FrequencySource>;
  private readonly datasets: Repository<FrequencyDataset>;
  private readonly ledger: EventLedger;
  private readonly index = new SearchIndex();
  private readonly slugs = new Set<string>();
  private readonly clock: () => Date;

  constructor(
    records: Repository<FrequencyRecord>,
    sources: Repository<FrequencySource>,
    datasets: Repository<FrequencyDataset>,
    options: { ledger?: EventLedger; clock?: () => Date } = {},
  ) {
    this.records = records;
    this.sources = sources;
    this.datasets = datasets;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    for (const record of records.all()) {
      this.index.add(toDocument(record));
      this.slugs.add(record.slug);
    }
  }

  /**
   * Register a source. When the bytes are already known under another name the
   * new name becomes an alias, not a second dataset: two names for identical
   * bytes is one dataset, and saying otherwise would invent a distinction.
   */
  registerSource(input: {
    title: string;
    publisher: string;
    url?: string | null;
    retrievedAt: string;
    licence: string;
    bytes: Uint8Array | string;
    name: string;
  }): { source: FrequencySource; dataset: FrequencyDataset; aliasOf: FrequencyDataset | null } {
    if (!input.title.trim() || !input.publisher.trim()) throw new Error("a source needs a title and a publisher");
    if (!input.licence.trim()) throw new Error("a source needs a licence");
    const sourceDigest = digest(input.bytes);
    const byteLength = typeof input.bytes === "string" ? Buffer.byteLength(input.bytes) : input.bytes.byteLength;
    const existing = this.datasets.all().find((dataset) => dataset.digest === sourceDigest);
    const source: FrequencySource = {
      id: newId("hsrc"),
      title: input.title.trim(),
      publisher: input.publisher.trim(),
      url: input.url ?? null,
      retrievedAt: input.retrievedAt,
      licence: input.licence.trim(),
      digest: sourceDigest,
      bytes: byteLength,
    };
    this.sources.put(source);

    if (existing) {
      if (!existing.aliases.includes(input.name)) {
        existing.aliases.push(input.name);
        this.datasets.put(existing);
      }
      this.ledger.append({
        type: "health.dataset.alias",
        actor: "ingest",
        subject: existing.id,
        data: { alias: input.name, digest: sourceDigest },
      });
      return { source, dataset: structuredClone(existing), aliasOf: structuredClone(existing) };
    }

    const dataset: FrequencyDataset = {
      id: newId("hds"),
      sourceId: source.id,
      name: input.name,
      digest: sourceDigest,
      recordCount: 0,
      aliases: [],
      state: "draft",
      version: 1,
      ingestedAt: nowIso(this.clock),
    };
    this.datasets.put(dataset);
    this.ledger.append({
      type: "health.dataset.registered",
      actor: "ingest",
      subject: dataset.id,
      data: { name: dataset.name, digest: sourceDigest, bytes: byteLength },
    });
    return { source, dataset: structuredClone(dataset), aliasOf: null };
  }

  ingestDataset(datasetId: string, text: string, actor: string): FrequencyDataset {
    const dataset = this.requireDataset(datasetId);
    const parsed = parseFrequencyList(text);
    if (parsed.records.length === 0) throw new Error("the frequency list produced no records");
    let inserted = 0;
    for (const record of parsed.records) {
      const slug = this.uniqueSlug(`${record.name}-${record.program}`);
      const stored: FrequencyRecord = {
        ...record,
        id: newId("hfr"),
        slug,
        sourceId: dataset.sourceId,
      };
      this.records.put(stored);
      this.index.add(toDocument(stored));
      this.slugs.add(slug);
      inserted += 1;
    }
    dataset.recordCount += inserted;
    dataset.version += 1;
    this.datasets.put(dataset);
    this.ledger.append({
      type: "health.dataset.ingested",
      actor,
      subject: dataset.id,
      data: { inserted, skipped: parsed.skipped, version: dataset.version },
    });
    return structuredClone(dataset);
  }

  publish(datasetId: string, actor: string): FrequencyDataset {
    const dataset = this.requireDataset(datasetId);
    if (dataset.recordCount === 0) throw new Error("an empty dataset cannot be published");
    dataset.state = "published";
    dataset.version += 1;
    this.datasets.put(dataset);
    this.ledger.append({ type: "health.dataset.published", actor, subject: dataset.id, data: { version: dataset.version } });
    return structuredClone(dataset);
  }

  archive(datasetId: string, actor: string): FrequencyDataset {
    const dataset = this.requireDataset(datasetId);
    dataset.state = "archived";
    dataset.version += 1;
    this.datasets.put(dataset);
    this.ledger.append({ type: "health.dataset.archived", actor, subject: dataset.id, data: { version: dataset.version } });
    return structuredClone(dataset);
  }

  search(query: string, limit = 10): FrequencyRecord[] {
    return this.index
      .search(query, limit)
      .map((hit) => this.records.get(hit.id))
      .filter((record): record is FrequencyRecord => record !== undefined)
      .map((record) => structuredClone(record));
  }

  forCondition(name: string): FrequencyRecord[] {
    return this.search(name, 50).filter((record) => record.name.toLowerCase().includes(name.toLowerCase()));
  }

  get(recordId: string): FrequencyRecord | undefined {
    const record = this.records.get(recordId);
    return record ? structuredClone(record) : undefined;
  }

  listDatasets(): FrequencyDataset[] {
    return this.datasets
      .all()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((dataset) => structuredClone(dataset));
  }

  source(sourceId: string): FrequencySource | undefined {
    const source = this.sources.get(sourceId);
    return source ? structuredClone(source) : undefined;
  }

  citation(recordId: string): { record: FrequencyRecord; source: FrequencySource; disclaimer: string } {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`no frequency record: ${recordId}`);
    const source = this.sources.get(record.sourceId);
    if (!source) throw new Error(`record ${recordId} has no source`);
    return {
      record: structuredClone(record),
      source: structuredClone(source),
      disclaimer: HEALTH_DISCLAIMER,
    };
  }

  private requireDataset(datasetId: string): FrequencyDataset {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) throw new Error(`no dataset: ${datasetId}`);
    return structuredClone(dataset);
  }

  private uniqueSlug(value: string): string {
    const base = slugify(value) || "frequency";
    let candidate = base;
    let suffix = 2;
    while (this.slugs.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}

function toDocument(record: FrequencyRecord) {
  return {
    id: record.id,
    title: record.name,
    body: [record.category, record.program, record.rawFrequencies].join(" "),
    tags: [record.category, record.program].filter(Boolean),
    kind: "frequency",
  };
}

export function createHealthLibrary(): HealthLibraryService {
  return new HealthLibraryService(new MemoryRepository(), new MemoryRepository(), new MemoryRepository());
}
