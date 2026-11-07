import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Photo {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  takenAt: string;
}

export interface CameraOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Camera {
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CameraOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  capture(width = 1920, height = 1080): Photo {
    if (width <= 0 || height <= 0) throw new Error("invalid dimensions");
    const photo: Photo = {
      id: newId("photo"),
      dataUrl: `data:image/png;base64,${Buffer.from(`placeholder-${width}x${height}`).toString("base64")}`,
      width,
      height,
      takenAt: nowIso(this.clock),
    };
    this.ledger.append({ type: "camera.photo.captured", actor: "camera", subject: photo.id });
    return photo;
  }
}
