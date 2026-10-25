export interface SearchDocument {
  id: string;
  title: string;
  body: string;
  tags: readonly string[];
  kind?: string;
}

export interface SearchHit {
  id: string;
  score: number;
  matched: string[];
}

interface Indexed {
  document: SearchDocument;
  counts: Map<string, number>;
  titleTokens: Set<string>;
  tagTokens: Set<string>;
  length: number;
}

const STOP = new Set(["the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "you", "your"]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP.has(token));
}

/**
 * A deterministic in-memory inverted index.
 *
 * Title tokens weigh more than tag tokens, and tag tokens more than body
 * tokens. The score is integer arithmetic so two runs on the same input
 * always produce the same ranking.
 */
export class SearchIndex {
  private readonly documents = new Map<string, Indexed>();

  add(document: SearchDocument): void {
    const bodyTokens = tokenize(document.body);
    const titleTokens = new Set(tokenize(document.title));
    const tagTokens = new Set(document.tags.flatMap((tag) => tokenize(tag)));
    const counts = new Map<string, number>();
    for (const token of [...titleTokens, ...tagTokens, ...bodyTokens]) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
    this.documents.set(document.id, {
      document: structuredClone(document),
      counts,
      titleTokens,
      tagTokens,
      length: Math.max(1, bodyTokens.length),
    });
  }

  remove(id: string): boolean {
    return this.documents.delete(id);
  }

  size(): number {
    return this.documents.size;
  }

  search(query: string, limit = 10): SearchHit[] {
    const tokens = [...new Set(tokenize(query))];
    if (tokens.length === 0) return [];
    const hits: SearchHit[] = [];
    for (const entry of this.documents.values()) {
      let score = 0;
      const matched: string[] = [];
      for (const token of tokens) {
        const count = entry.counts.get(token) ?? 0;
        if (count === 0) continue;
        matched.push(token);
        const title = entry.titleTokens.has(token) ? 5000 : 0;
        const tag = entry.tagTokens.has(token) ? 1500 : 0;
        const body = Math.round((count / entry.length) * 1000) * 10;
        score += title + tag + body;
      }
      if (matched.length === 0) continue;
      // Require every query token to be present for a multi-token query.
      if (matched.length !== tokens.length) continue;
      score += matched.length * 100;
      hits.push({ id: entry.document.id, score, matched });
    }
    return hits
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, Math.max(0, limit));
  }

  suggest(prefix: string, limit = 8): string[] {
    const wanted = prefix.toLowerCase();
    if (!wanted) return [];
    const seen = new Set<string>();
    for (const entry of this.documents.values()) {
      for (const token of entry.counts.keys()) {
        if (token.startsWith(wanted)) seen.add(token);
        if (seen.size >= limit * 4) break;
      }
    }
    return [...seen].sort().slice(0, limit);
  }
}
