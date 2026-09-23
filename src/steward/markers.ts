import { StewardError } from "./types";

const ID_RE = /^[a-z0-9][a-z0-9_-]*$/i;
const BEGIN = (id: string) => `<!-- aetherius-steward:begin ${id} -->`;
const END = (id: string) => `<!-- aetherius-steward:end ${id} -->`;

function assertId(markerId: string): void {
  if (!ID_RE.test(markerId)) {
    throw new StewardError("MARKER_INVALID_ID", `invalid marker id ${markerId}`);
  }
}

function assertContent(content: string): void {
  if (content.includes("aetherius-steward:")) {
    throw new StewardError("MARKER_CONTENT_INVALID", "marker content must not contain steward markers");
  }
}

interface MarkerSpan {
  start: number;
  contentStart: number;
  contentEnd: number;
  end: number;
}

function findSpan(body: string, markerId: string): MarkerSpan | undefined {
  const begin = BEGIN(markerId);
  const finish = END(markerId);
  const beginIdx = body.indexOf(begin);
  if (beginIdx === -1) {
    if (body.includes(finish)) {
      throw new StewardError("MARKER_MALFORMED", `marker ${markerId} has end without begin`);
    }
    return undefined;
  }
  const secondBegin = body.indexOf(begin, beginIdx + begin.length);
  if (secondBegin !== -1) {
    throw new StewardError("MARKER_MALFORMED", `marker ${markerId} appears more than once`);
  }
  const contentStart = beginIdx + begin.length;
  const endIdx = body.indexOf(finish, contentStart);
  if (endIdx === -1) {
    throw new StewardError("MARKER_MALFORMED", `marker ${markerId} has begin without end`);
  }
  const trailingBegin = body.indexOf(begin, endIdx + finish.length);
  if (trailingBegin !== -1) {
    throw new StewardError("MARKER_MALFORMED", `marker ${markerId} appears more than once`);
  }
  return { start: beginIdx, contentStart, contentEnd: endIdx, end: endIdx + finish.length };
}

/**
 * Upsert an owned steward marker block in a comment body.
 *
 * Only text between this marker's own begin/end pair is replaced. Text
 * outside the owned block — maintainer prose, other markers — is preserved
 * byte for byte. A missing block is appended; malformed blocks fail closed.
 */
export function upsertMarker(body: string, markerId: string, content: string): string {
  assertId(markerId);
  assertContent(content);
  const span = findSpan(body, markerId);
  if (!span) {
    const base = body.length === 0 || body.endsWith("\n") ? body : `${body}\n`;
    const gap = base.length === 0 || base.endsWith("\n\n") ? "" : "\n";
    return `${base}${gap}${BEGIN(markerId)}\n${content}\n${END(markerId)}\n`;
  }
  const inner = body.slice(span.contentStart, span.contentEnd);
  const leading = inner.match(/^\n?/)?.[0] ?? "\n";
  const trailing = inner.match(/\n?$/)?.[0] ?? "\n";
  const replacement = `${leading}${content}${trailing}`;
  return body.slice(0, span.contentStart) + replacement + body.slice(span.contentEnd);
}

/** Read the current content of an owned marker block, or undefined if absent. */
export function readMarker(body: string, markerId: string): string | undefined {
  assertId(markerId);
  const span = findSpan(body, markerId);
  if (!span) return undefined;
  return body.slice(span.contentStart, span.contentEnd).replace(/^\n/, "").replace(/\n$/, "");
}
