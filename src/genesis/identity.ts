/**
 * P22/1 Genesis identity references for Aetherius services.
 *
 * The persistent identity itself lives in Genesis (C++ identity subsystem).
 * This module carries REFERENCES and runtime bindings only — it never
 * mints, stores, or duplicates the canonical identity, and applying a
 * binding can never mutate the referenced root.
 */

export interface GenesisIdentityRef {
  readonly genesisId: string;
  readonly lineageId?: string;
  readonly schemaVersion: string;
}

export type BindingKind =
  | "model"
  | "provider"
  | "session"
  | "project"
  | "worker"
  | "avatar"
  | "interface-mode";

export interface IdentityBinding {
  readonly kind: BindingKind;
  readonly ref: string;
  readonly genesisId: string;
}

export interface WorkerRelationship {
  readonly workerId: string;
  readonly supervisedBy: string;
  readonly taskId?: string;
  readonly capabilityScope?: string[];
}

export interface BridgePrincipal {
  readonly genesis: string;
  readonly on_behalf_of: string;
}

function nonEmpty(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value;
}

/**
 * Explicit bootstrap of a reference handle. Requires provenance; never
 * generates an id silently (missing/corrupt state must surface elsewhere).
 */
export function bootstrapReference(
  genesisId: string,
  provenance: string,
  lineageId?: string,
): GenesisIdentityRef {
  nonEmpty(genesisId, "genesisId");
  nonEmpty(provenance, "provenance");
  return Object.freeze({
    genesisId: genesisId.trim(),
    ...(lineageId !== undefined ? { lineageId: lineageId.trim() } : {}),
    schemaVersion: "1",
  });
}

export function parseIdentityRef(value: unknown): GenesisIdentityRef {
  if (typeof value !== "object" || value === null) {
    throw new Error("genesis identity reference must be an object");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.genesisId !== "string" || !record.genesisId.trim()) {
    throw new Error("genesis identity reference has no genesisId (never generated silently)");
  }
  return bootstrapReference(
    record.genesisId,
    typeof record.provenance === "string" ? record.provenance : "parsed-reference",
    typeof record.lineageId === "string" ? record.lineageId : undefined,
  );
}

export function bindRuntime(
  root: GenesisIdentityRef,
  kind: BindingKind,
  ref: string,
): IdentityBinding {
  nonEmpty(ref, "binding ref");
  // The root object is frozen; bindings only ever reference its id.
  return Object.freeze({ kind, ref: ref.trim(), genesisId: root.genesisId });
}

export function relateWorker(
  root: GenesisIdentityRef,
  workerId: string,
  taskId?: string,
  capabilityScope: string[] = [],
): WorkerRelationship {
  nonEmpty(workerId, "workerId");
  if (workerId.trim() === root.genesisId) {
    throw new Error("worker id must differ from the Genesis identity");
  }
  return Object.freeze({
    workerId: workerId.trim(),
    supervisedBy: root.genesisId,
    ...(taskId !== undefined ? { taskId } : {}),
    capabilityScope: [...capabilityScope],
  });
}

/** Owner and Genesis are distinct principals; enforced, never assumed. */
export function bridgePrincipal(genesisId: string, ownerId: string): BridgePrincipal {
  nonEmpty(genesisId, "genesisId");
  nonEmpty(ownerId, "ownerId");
  if (genesisId.trim() === ownerId.trim()) {
    throw new Error("owner and Genesis identities must remain distinct");
  }
  return Object.freeze({ genesis: genesisId.trim(), on_behalf_of: ownerId.trim() });
}

export type InterfaceMode = "chat" | "work";

/** Both modes reference the same Genesis; switching allocates nothing. */
export function interfaceViewRef(mode: InterfaceMode, root: GenesisIdentityRef): GenesisIdentityRef {
  void mode;
  return root;
}
