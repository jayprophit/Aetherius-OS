import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Point {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  point: Point;
  label: string;
}

export interface RouteStep {
  instruction: string;
  distanceM: number;
}

export interface MapOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class MapService {
  private readonly markers = new Map<string, MapMarker>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MapOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addMarker(point: Point, label: string): MapMarker {
    const marker: MapMarker = { id: newId("marker"), point, label };
    this.markers.set(marker.id, marker);
    this.ledger.append({ type: "map.marker.added", actor: "maps", subject: marker.id });
    return marker;
  }

  removeMarker(id: string): void {
    if (!this.markers.has(id)) throw new Error("marker not found");
    this.markers.delete(id);
    this.ledger.append({ type: "map.marker.removed", actor: "maps", subject: id });
  }

  getMarker(id: string): MapMarker | undefined {
    return this.markers.get(id);
  }

  listMarkers(): MapMarker[] {
    return Array.from(this.markers.values());
  }
}

export class RoutePlanner {
  plan(from: Point, to: Point): RouteStep[] {
    const distance = Math.round(Math.sqrt((to.lat - from.lat) ** 2 + (to.lng - from.lng) ** 2) * 111_320);
    return [
      { instruction: `Head toward ${to.lat.toFixed(4)}, ${to.lng.toFixed(4)}`, distanceM: distance },
    ];
  }
}
