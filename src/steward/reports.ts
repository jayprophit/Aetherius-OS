import { StateError } from "../state/types";
import type { OwnedStore } from "../state/store";
import type { StateEnvelope } from "../state/types";
import type { ReviewTarget, StewardReport } from "./types";

const KIND = "steward.report";
const SCHEMA = 1;

export function reportStateId(target: ReviewTarget): string {
  return `steward-${target.repo}-${target.kind}${target.number}`;
}

/**
 * Durable steward reports over the shared owned-state store: atomic writes,
 * integrity hashes, optimistic concurrency. Reports are append-by-revision:
 * each save bumps recordVersion; loading verifies integrity.
 */
export class StewardReportStore {
  private readonly store: OwnedStore;
  private readonly owner: string;

  constructor(store: OwnedStore, owner: string) {
    this.store = store;
    this.owner = owner;
  }

  save(report: StewardReport, options: { actor?: string; source?: string } = {}): StewardReport {
    const id = report.id;
    let recordVersion = 1;
    let createdAt = report.generatedAt;
    if (this.store.exists(id)) {
      const current = this.store.load<StewardReport>(id);
      if (current.payload.target.repo !== report.target.repo ||
          current.payload.target.kind !== report.target.kind ||
          current.payload.target.number !== report.target.number) {
        throw new StateError("STATE_VALIDATION_FAILED", `report ${id} target mismatch on update`);
      }
      recordVersion = current.recordVersion + 1;
      createdAt = current.createdAt;
    }
    const envelope: StateEnvelope<StewardReport> = {
      id,
      kind: KIND,
      schemaVersion: SCHEMA,
      recordVersion,
      createdAt,
      updatedAt: report.generatedAt,
      owner: this.owner,
      provenance: "p16-steward-automation",
      sensitivity: "USER",
      integrity: "",
      payload: report,
    };
    this.store.save(envelope, {
      expectedRecordVersion: recordVersion === 1 ? undefined : recordVersion - 1,
      causedBy: { actor: options.actor ?? "steward", source: options.source ?? "steward.report-store" },
    });
    return report;
  }

  load(id: string): StewardReport {
    const envelope = this.store.load<StewardReport>(id);
    if (envelope.kind !== KIND) {
      throw new StateError("STATE_MALFORMED", `record ${id} is not a steward report`);
    }
    return envelope.payload;
  }

  listIds(prefix = "steward-"): string[] {
    const withList = this.store as OwnedStore & { listIds?: (p?: string) => string[] };
    if (typeof withList.listIds === "function") {
      return withList.listIds(prefix);
    }
    return [];
  }
}
