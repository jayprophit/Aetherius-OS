import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface ForecastDay {
  date: string;
  highC: number;
  lowC: number;
  condition: "sunny" | "cloudy" | "rain" | "snow" | "windy";
}

export interface WeatherOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class WeatherService {
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: WeatherOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  current(lat: number, lng: number): ForecastDay {
    if (lat < -90 || lat > 90) throw new Error("invalid latitude");
    if (lng < -180 || lng > 180) throw new Error("invalid longitude");
    const day = this.clock().toISOString().slice(0, 10);
    const forecast: ForecastDay = {
      date: day,
      highC: 20,
      lowC: 12,
      condition: "sunny",
    };
    this.ledger.append({ type: "weather.fetched", actor: "weather", subject: day });
    return forecast;
  }
}
