import type { EventLedger } from "./ledger.ts";
import { newId, nowIso, slugify } from "./ids.ts";
import type { Repository } from "./store.ts";

export type ContentState = "draft" | "review" | "published" | "archived";

export interface ContentRevision {
  revision: number;
  title: string;
  body: string;
  tags: string[];
  at: string;
  by: string;
}

export interface ContentItem {
  id: string;
  kind: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
  authorId: string;
  state: ContentState;
  revision: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  revisions: ContentRevision[];
}

export interface CreateContentInput {
  kind?: string;
  title: string;
  body?: string;
  tags?: string[];
}

/**
 * Content with revisions and an explicit state machine.
 *
 * Draft -> review -> published -> archived. Editing a published item creates a
 * new draft revision rather than mutating the published text in place, so a
 * reader never sees an edit halfway through.
 */
export class ContentService {
  private readonly items: Repository<ContentItem>;
  private readonly ledger?: EventLedger;
  private readonly clock: () => Date;

  constructor(items: Repository<ContentItem>, options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    this.items = items;
    this.ledger = options.ledger;
    this.clock = options.clock ?? (() => new Date());
  }

  create(authorId: string, input: CreateContentInput): ContentItem {
    const kind = (input.kind ?? "post").trim();
    if (!kind) throw new Error("content kind is empty");
    if (!input.title?.trim()) throw new Error("content title is empty");
    const at = nowIso(this.clock);
    const item: ContentItem = {
      id: newId("cnt"),
      kind,
      slug: this.uniqueSlug(input.title),
      title: input.title.trim(),
      body: input.body ?? "",
      tags: normaliseTags(input.tags ?? []),
      authorId,
      state: "draft",
      revision: 1,
      createdAt: at,
      updatedAt: at,
      publishedAt: null,
      revisions: [
        { revision: 1, title: input.title.trim(), body: input.body ?? "", tags: normaliseTags(input.tags ?? []), at, by: authorId },
      ],
    };
    this.items.put(item);
    this.record("content.created", authorId, item.id, { kind: item.kind });
    return structuredClone(item);
  }

  get(id: string): ContentItem | undefined {
    const item = this.items.get(id);
    return item ? structuredClone(item) : undefined;
  }

  bySlug(slug: string): ContentItem | undefined {
    const item = this.items.all().find((candidate) => candidate.slug === slug);
    return item ? structuredClone(item) : undefined;
  }

  list(filter: { kind?: string; state?: ContentState; authorId?: string } = {}): ContentItem[] {
    return this.items
      .all()
      .filter((item) => filter.kind === undefined || item.kind === filter.kind)
      .filter((item) => filter.state === undefined || item.state === filter.state)
      .filter((item) => filter.authorId === undefined || item.authorId === filter.authorId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((item) => structuredClone(item));
  }

  update(actor: string, id: string, patch: Partial<Pick<ContentItem, "title" | "body" | "tags">>): ContentItem {
    const item = this.require(id);
    if (item.authorId !== actor) throw new Error("only the author may edit this content");
    if (item.state === "archived") throw new Error("an archived item cannot be edited");
    if (item.state === "published") {
      // A published item keeps its published revision; the edit becomes a
      // new draft that must be published deliberately.
      item.state = "draft";
      item.publishedAt = null;
    }
    const at = nowIso(this.clock);
    const title = patch.title?.trim() ?? item.title;
    const body = patch.body ?? item.body;
    const tags = patch.tags ? normaliseTags(patch.tags) : item.tags;
    if (!title) throw new Error("content title is empty");
    item.title = title;
    item.body = body;
    item.tags = tags;
    item.revision += 1;
    item.updatedAt = at;
    item.slug = patch.title === undefined ? item.slug : this.uniqueSlug(title, item.id);
    item.revisions.push({ revision: item.revision, title, body, tags, at, by: actor });
    this.items.put(item);
    this.record("content.updated", actor, id, { revision: item.revision });
    return structuredClone(item);
  }

  submitForReview(actor: string, id: string): ContentItem {
    const item = this.require(id);
    if (item.authorId !== actor) throw new Error("only the author may submit this content");
    return this.transition(actor, item, "review", "content.review_requested");
  }

  publish(actor: string, id: string, options: { moderator?: boolean } = {}): ContentItem {
    const item = this.require(id);
    const allowed = item.authorId === actor || options.moderator === true;
    if (!allowed) throw new Error("only the author or a moderator may publish this content");
    if (item.state !== "review") {
      throw new Error(`cannot publish content in state ${item.state}; submit it for review first`);
    }
    if (!item.body.trim()) throw new Error("an empty item cannot be published");
    item.publishedAt = nowIso(this.clock);
    return this.transition(actor, item, "published", "content.published");
  }

  archive(actor: string, id: string, options: { moderator?: boolean } = {}): ContentItem {
    const item = this.require(id);
    if (item.authorId !== actor && options.moderator !== true) {
      throw new Error("only the author or a moderator may archive this content");
    }
    return this.transition(actor, item, "archived", "content.archived");
  }

  private transition(actor: string, item: ContentItem, state: ContentState, type: string): ContentItem {
    item.state = state;
    item.updatedAt = nowIso(this.clock);
    this.items.put(item);
    this.record(type, actor, item.id, { state });
    return structuredClone(item);
  }

  private require(id: string): ContentItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`no content: ${id}`);
    return structuredClone(item);
  }

  private uniqueSlug(title: string, exceptId?: string): string {
    const base = slugify(title) || "untitled";
    let candidate = base;
    let suffix = 2;
    while (this.items.all().some((item) => item.slug === candidate && item.id !== exceptId)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private record(type: string, actor: string, subject: string, data: Record<string, unknown>): void {
    this.ledger?.append({ type, actor, subject, data });
  }
}

export function normaliseTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort();
}
