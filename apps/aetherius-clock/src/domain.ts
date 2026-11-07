import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Alarm {
  id: string;
  time: string;
  label: string;
  active: boolean;
}

export interface ClockOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class ClockService {
  private readonly alarms: Alarm[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ClockOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  setAlarm(time: string, label: string): Alarm {
    const alarm: Alarm = { id: newId("alarm"), time, label, active: true };
    this.alarms.push(alarm);
    this.ledger.append({ type: "clock.alarm.set", actor: "clock", subject: alarm.id });
    return alarm;
  }

  listAlarms(): Alarm[] {
    return [...this.alarms];
  }
}
