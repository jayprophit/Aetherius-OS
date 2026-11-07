/**
 * Shared in-memory sync session.
 *
 * CloudSyncSettings pastes a token (session-only). Apps that can sync read
 * the token from here at sync time instead of each keeping their own copy.
 * Nothing here is persisted: a page reload clears the token, which is the
 * documented behaviour for the sync credential.
 */

let endpoint: string | null = null;
let token: string | null = null;

export function setSyncSession(nextEndpoint: string, nextToken: string): void {
  endpoint = nextEndpoint.trim() || null;
  token = nextToken.trim() || null;
}

export function clearSyncSession(): void {
  endpoint = null;
  token = null;
}

export function getSyncEndpoint(): string | null {
  return endpoint;
}

export function getSyncToken(): string | null {
  return token;
}

/** The stored endpoint wins; the deployed worker is the fallback default. */
export function effectiveSyncEndpoint(): string | null {
  return endpoint || "https://aetherius-sync.jprophit-87b.workers.dev";
}
