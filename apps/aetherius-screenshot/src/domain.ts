import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Screenshot domain core.
 *
 * Records of captures (region, window, full screen, timer) with annotation
 * layers and a history. Pixel capture is a host adapter concern; this layer
 * models what was captured and the marks on it.
 */

export type CaptureScope = "region" | "window" | "screen";
export type CaptureFormat = "png" | "jpeg" | "bmp";

export interface Capture {
  id: string;
  scope: CaptureScope;
  format: CaptureFormat;
  width: number;
  height: number;
  timerSeconds: number;
  annotations: string[];
  capturedAt: string;
}

export interface ScreenshotOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const SCOPES: CaptureScope[] = ["region", "window", "screen"];
const FORMATS: CaptureFormat[] = ["png", "jpeg", "bmp"];

export class Screenshots {
  private readonly captures = new Map<string, Capture>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ScreenshotOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  capture(input: { scope?: string; format?: string; width: number; height: number; timerSeconds?: number }): Capture {
    const scope = (input.scope ?? "screen") as CaptureScope;
    const format = (input.format ?? "png") as CaptureFormat;
    if (!SCOPES.includes(scope)) throw new Error(`scope must be one of: ${SCOPES.join(", ")}`);
    if (!FORMATS.includes(format)) throw new Error(`format must be one of: ${FORMATS.join(", ")}`);
    if (!Number.isInteger(input.width) || input.width <= 0) throw new Error("width must be a positive integer");
    if (!Number.isInteger(input.height) || input.height <= 0) throw new Error("height must be a positive integer");
    const timer = input.timerSeconds ?? 0;
    if (!Number.isInteger(timer) || timer < 0 || timer > 60) {
      throw new Error("timerSeconds must be an integer between 0 and 60");
    }
    const capture: Capture = {
      id: newId("shot"),
      scope,
      format,
      width: input.width,
      height: input.height,
      timerSeconds: timer,
      annotations: [],
      capturedAt: nowIso(this.clock),
    };
    this.captures.set(capture.id, capture);
    this.ledger.append({
      type: "screenshot.captured",
      actor: "screenshot",
      subject: capture.id,
      data: { scope, width: input.width, height: input.height, timer },
    });
    return structuredClone(capture);
  }

  annotate(captureId: string, note: string): Capture {
    const capture = this.require(captureId);
    if (typeof note !== "string" || note.trim().length === 0) {
      throw new Error("an annotation needs text");
    }
    capture.annotations.push(note.trim());
    this.captures.set(captureId, capture);
    return structuredClone(capture);
  }

  get(captureId: string): Capture | undefined {
    const found = this.captures.get(captureId);
    return found ? structuredClone(found) : undefined;
  }

  list(scope?: CaptureScope): Capture[] {
    return [...this.captures.values()]
      .filter((c) => scope === undefined || c.scope === scope)
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt) || b.id.localeCompare(a.id))
      .map((c) => structuredClone(c));
  }

  delete(captureId: string): boolean {
    if (!this.captures.delete(captureId)) return false;
    this.ledger.append({ type: "screenshot.deleted", actor: "screenshot", subject: captureId, data: {} });
    return true;
  }

  private require(captureId: string): Capture {
    const found = this.captures.get(captureId);
    if (!found) throw new Error(`no capture: ${captureId}`);
    return structuredClone(found);
  }
}
