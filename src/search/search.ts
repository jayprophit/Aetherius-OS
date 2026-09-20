import { listApps } from "../apps/registry";
import type { createMatProvider } from "../providers/mat";

export interface SearchHit {
  source: "applications" | "mat";
  title: string;
  detail: string;
  ref: string;
}

export type MatProvider = ReturnType<typeof createMatProvider>;

// Unified search seam (P10-APPREG). Applications are always searchable from
// the local registry; MAT joins in only when its provider is AVAILABLE.
// Full universal search (files, settings, commands) waits on indexed
// providers and is NOT claimed here.
export async function searchApps(query: string, limit = 10): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return listApps()
    .filter(
      (app) =>
        app.id.includes(q) ||
        app.name.toLowerCase().includes(q) ||
        app.capabilities.some((capability) => capability.toLowerCase().includes(q)),
    )
    .slice(0, limit)
    .map((app) => ({
      source: "applications" as const,
      title: `${app.name} ${app.version}`,
      detail: app.capabilities.join(", "),
      ref: `app:${app.id}`,
    }));
}

export async function searchAll(
  query: string,
  mat: MatProvider | null,
  limit = 10,
): Promise<{ hits: SearchHit[]; matJoined: boolean }> {
  const hits = await searchApps(query, limit);
  if (!mat) return { hits, matJoined: false };
  let health: string | null = null;
  try {
    health = (await mat.check()).state;
  } catch {
    health = null;
  }
  if (health !== "AVAILABLE") return { hits, matJoined: false };
  const response = (await mat.search(query)) as {
    results?: { mat_id: string; record_name: string; symbol: string }[];
  };
  for (const record of response.results ?? []) {
    if (hits.length >= limit) break;
    hits.push({
      source: "mat",
      title: `${record.record_name} (${record.symbol})`,
      detail: record.mat_id,
      ref: `mat:${record.mat_id}`,
    });
  }
  return { hits, matJoined: true };
}
