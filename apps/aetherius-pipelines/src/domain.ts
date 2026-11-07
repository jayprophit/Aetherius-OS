import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Pipeline {
  id: string;
  name: string;
  stages: string[];
  status: "idle" | "running" | "success" | "failed";
}

export interface PipelinesOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Pipelines {
  private readonly pipelines = new Map<string, Pipeline>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: PipelinesOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(name: string, stages: string[]): Pipeline {
    const pipeline: Pipeline = { id: newId("pipeline"), name, stages, status: "idle" };
    this.pipelines.set(pipeline.id, pipeline);
    this.ledger.append({ type: "pipelines.created", actor: "pipelines", subject: pipeline.id });
    return pipeline;
  }

  list(): Pipeline[] {
    return Array.from(this.pipelines.values());
  }
}
