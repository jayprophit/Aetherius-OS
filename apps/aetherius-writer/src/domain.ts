import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

export type BlockKind = "heading" | "paragraph" | "bullet" | "code";

export interface DocBlock {
  id: string;
  kind: BlockKind;
  text: string;
  level?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WriterDocument {
  id: string;
  title: string;
  blocks: DocBlock[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export interface WriterOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  storageDir?: string;
}

export class Writer {
  private readonly documents = new Map<string, WriterDocument>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly storageDir: string;

  constructor(options: WriterOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.storageDir = options.storageDir ?? "./writer-data";
  }

  create(title: string): WriterDocument {
    const now = nowIso(this.clock);
    const doc: WriterDocument = {
      id: newId("doc"),
      title,
      blocks: [],
      createdAt: now,
      updatedAt: now,
      revision: 0,
    };
    this.documents.set(doc.id, doc);
    this.ledger.append({ type: "writer.created", actor: "writer", subject: doc.id });
    this.persist();
    return doc;
  }

  append(docId: string, kind: BlockKind, text: string, level?: number): DocBlock {
    const doc = this.documents.get(docId);
    if (!doc) throw new Error("document not found");
    if (!text.trim()) throw new Error("a block needs text");
    if (kind === "heading" && level !== undefined && (level < 1 || level > 6)) {
      throw new Error("a heading level must be between 1 and 6");
    }

    const now = nowIso(this.clock);
    const block: DocBlock = {
      id: newId("block"),
      kind,
      text,
      level: kind === "heading" ? level ?? 1 : undefined,
      createdAt: now,
      updatedAt: now,
    };

    doc.blocks.push(block);
    doc.updatedAt = now;
    doc.revision += 1;
    this.ledger.append({ type: "writer.block.added", actor: "writer", subject: block.id });
    this.persist();
    return block;
  }

  remove(docId: string, blockId: string): void {
    const doc = this.documents.get(docId);
    if (!doc) throw new Error("document not found");
    const idx = doc.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) throw new Error("block not found");

    doc.blocks.splice(idx, 1);
    doc.updatedAt = nowIso(this.clock);
    doc.revision += 1;
    this.ledger.append({ type: "writer.block.removed", actor: "writer", subject: blockId });
    this.persist();
  }

  update(docId: string, blockId: string, text: string): DocBlock {
    const doc = this.documents.get(docId);
    if (!doc) throw new Error("document not found");
    if (!text.trim()) throw new Error("a block needs text");

    const block = doc.blocks.find((b) => b.id === blockId);
    if (!block) throw new Error("block not found");

    block.text = text;
    block.updatedAt = nowIso(this.clock);
    doc.updatedAt = nowIso(this.clock);
    doc.revision += 1;
    this.ledger.append({ type: "writer.block.updated", actor: "writer", subject: blockId });
    this.persist();
    return block;
  }

  getDocument(docId: string): WriterDocument | undefined {
    return this.documents.get(docId);
  }

  listDocuments(): WriterDocument[] {
    return Array.from(this.documents.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  plainText(docId: string): string {
    const doc = this.documents.get(docId);
    if (!doc) throw new Error("document not found");
    return doc.blocks.map((b) => b.text).join("\n");
  }

  markdown(docId: string): string {
    const doc = this.documents.get(docId);
    if (!doc) throw new Error("document not found");

    const lines: string[] = [`# ${doc.title}`, ""];
    for (const block of doc.blocks) {
      switch (block.kind) {
        case "heading":
          lines.push(`${"#".repeat(block.level ?? 1)} ${block.text}`);
          break;
        case "bullet":
          lines.push(`- ${block.text}`);
          break;
        case "code":
          lines.push(`\`\`\`
${block.text}
\`\`\``);
          break;
        default:
          lines.push(block.text);
      }
    }
    return lines.join("\n");
  }

  html(docId: string): string {
    const doc = this.documents.get(docId);
    if (!doc) throw new Error("document not found");

    const body = doc.blocks
      .map((b) => {
        switch (b.kind) {
          case "heading":
            return `<h${b.level ?? 1}>${escapeHtml(b.text)}</h${b.level ?? 1}>`;
          case "bullet":
            return `<li>${escapeHtml(b.text)}</li>`;
          case "code":
            return `<pre><code>${escapeHtml(b.text)}</code></pre>`;
          default:
            return `<p>${escapeHtml(b.text)}</p>`;
        }
      })
      .join("\n");

    return `<!DOCTYPE html><html><head><title>${escapeHtml(doc.title)}</title></head><body>${body}</body></html>`;
  }

  json(docId: string): string {
    const doc = this.documents.get(docId);
    if (!doc) throw new Error("document not found");
    return JSON.stringify(doc, null, 2);
  }

  private persist(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
    const all = Array.from(this.documents.values());
    writeFileSync(`${this.storageDir}/documents.json`, JSON.stringify(all, null, 2));
  }

  load(): void {
    if (!existsSync(this.storageDir)) return;
    const path = `${this.storageDir}/documents.json`;
    if (!existsSync(path)) return;
    const raw = readFileSync(path, "utf8");
    const data: WriterDocument[] = JSON.parse(raw);
    this.documents.clear();
    for (const doc of data) {
      this.documents.set(doc.id, doc);
    }
  }

  recover(docId: string): WriterDocument | undefined {
    return this.documents.get(docId);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
