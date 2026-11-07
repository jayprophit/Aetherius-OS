import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Scene {
  id: string;
  name: string;
  camera: string;
  cast: string[];
}

export interface VirtualStageOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class VirtualStage {
  private readonly scenes = new Map<string, Scene>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: VirtualStageOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createScene(name: string, camera: string, cast: string[]): Scene {
    const scene: Scene = { id: newId("scene"), name, camera, cast };
    this.scenes.set(scene.id, scene);
    this.ledger.append({ type: "virtual-stage.created", actor: "virtual-stage", subject: scene.id });
    return scene;
  }

  list(): Scene[] {
    return Array.from(this.scenes.values());
  }
}
