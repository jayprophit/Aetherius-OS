import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Study {
  id: string;
  title: string;
  modality: "mri" | "ct" | "microscopy";
  consent: boolean;
}

export interface MedicalResearchOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class MedicalResearch {
  private readonly studies = new Map<string, Study>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MedicalResearchOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(title: string, modality: Study["modality"], consent: boolean): Study {
    const study: Study = { id: newId("study"), title, modality, consent };
    this.studies.set(study.id, study);
    this.ledger.append({ type: "medical-research.registered", actor: "medical-research", subject: study.id });
    return study;
  }

  list(): Study[] {
    return Array.from(this.studies.values());
  }
}
