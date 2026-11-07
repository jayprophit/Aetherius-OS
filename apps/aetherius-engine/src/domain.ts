import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Scene {
  id: string;
  name: string;
  entities: string[];
}

export interface EngineOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Engine {
  private readonly scenes = new Map<string, Scene>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: EngineOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  loadScene(name: string, entities: string[]): Scene {
    const scene: Scene = { id: newId("scene"), name, entities };
    this.scenes.set(scene.id, scene);
    this.ledger.append({ type: "engine.loaded", actor: "engine", subject: scene.id });
    return scene;
  }

  listScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }
}
