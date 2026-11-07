/** A prefixed identifier. The prefix makes a raw id readable in a ledger. */
export function newId(prefix: string): string {
  if (!/^[a-z][a-z0-9-]*$/.test(prefix)) {
    throw new Error(`invalid id prefix: ${prefix}`);
  }
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}

/** A stable, lower-case slug suitable for a URL or a file name. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** ISO-8601 UTC timestamp. The clock is injectable so tests are deterministic. */
export function nowIso(clock: () => Date = () => new Date()): string {
  return clock().toISOString();
}
