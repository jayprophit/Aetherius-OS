import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Clock core.
 *
 * Alarms with weekday recurrence, countdown timers, a stopwatch and world
 * clocks. It computes time; it does not schedule an OS wake-up, play a sound
 * or run in the background. The host owns the notification and audio layers.
 */

export interface Alarm {
  id: string;
  label: string;
  hour: number;
  minute: number;
  days: number[];
  enabled: boolean;
  lastTriggeredAt?: string;
}

export interface Timer {
  id: string;
  label: string;
  durationMs: number;
  remainingMs: number;
  running: boolean;
  startedAt?: string;
}

export interface StopwatchLap {
  index: number;
  atMs: number;
  splitMs: number;
}

export interface Stopwatch {
  running: boolean;
  elapsedMs: number;
  startedAt?: string;
  laps: StopwatchLap[];
}

export interface ClockOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

function assertHour(hour: number): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error(`invalid hour: ${hour}`);
}

function assertMinute(minute: number): void {
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error(`invalid minute: ${minute}`);
}

function normaliseDays(days: number[]): number[] {
  for (const day of days) {
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new Error(`invalid weekday: ${day}`);
  }
  return [...new Set(days)].sort((left, right) => left - right);
}

export class ClockApp {
  private readonly alarms = new Map<string, Alarm>();
  private readonly timers = new Map<string, Timer>();
  private readonly stopwatches = new Map<string, Stopwatch>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ClockOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addAlarm(input: { label?: string; hour: number; minute: number; days?: number[] }): Alarm {
    assertHour(input.hour);
    assertMinute(input.minute);
    const alarm: Alarm = {
      id: newId("alarm"),
      label: input.label?.trim() || "Alarm",
      hour: input.hour,
      minute: input.minute,
      days: normaliseDays(input.days ?? []),
      enabled: true,
    };
    this.alarms.set(alarm.id, alarm);
    this.ledger.append({ type: "clock.alarm.added", actor: "clock", subject: alarm.id });
    return structuredClone(alarm);
  }

  setAlarmEnabled(alarmId: string, enabled: boolean): Alarm {
    const alarm = this.requireAlarm(alarmId);
    const updated: Alarm = { ...alarm, enabled };
    this.alarms.set(alarmId, updated);
    return structuredClone(updated);
  }

  removeAlarm(alarmId: string): boolean {
    return this.alarms.delete(alarmId);
  }

  alarmsList(): Alarm[] {
    return [...this.alarms.values()]
      .sort((left, right) => left.hour * 60 + left.minute - (right.hour * 60 + right.minute))
      .map((alarm) => structuredClone(alarm));
  }

  /** The next time this alarm fires strictly after `after`, or undefined. */
  nextAlarmTime(alarmId: string, after: Date = this.clock()): Date | undefined {
    const alarm = this.requireAlarm(alarmId);
    if (!alarm.enabled) return undefined;
    for (let offset = 0; offset <= 8; offset += 1) {
      const candidate = new Date(after);
      candidate.setUTCDate(candidate.getUTCDate() + offset);
      candidate.setUTCHours(alarm.hour, alarm.minute, 0, 0);
      if (candidate.getTime() <= after.getTime()) continue;
      if (alarm.days.length === 0 || alarm.days.includes(candidate.getUTCDay())) return candidate;
    }
    return undefined;
  }

  nextAlarm(after: Date = this.clock()): { alarm: Alarm; at: Date } | undefined {
    const candidates = [...this.alarms.values()]
      .map((alarm) => ({ alarm, at: this.nextAlarmTime(alarm.id, after) }))
      .filter((entry): entry is { alarm: Alarm; at: Date } => entry.at !== undefined)
      .sort((left, right) => left.at.getTime() - right.at.getTime());
    const first = candidates[0];
    return first ? { alarm: structuredClone(first.alarm), at: first.at } : undefined;
  }

  /** Fire every alarm whose scheduled time has arrived since the last check. */
  triggerDue(at: Date = this.clock()): Alarm[] {
    const fired: Alarm[] = [];
    for (const alarm of this.alarms.values()) {
      if (!alarm.enabled) continue;
      const due = this.nextAlarmTime(alarm.id, new Date(at.getTime() - 60_000));
      if (!due || due.getTime() > at.getTime()) continue;
      if (alarm.lastTriggeredAt && alarm.lastTriggeredAt >= due.toISOString()) continue;
      const updated: Alarm = { ...alarm, lastTriggeredAt: due.toISOString() };
      this.alarms.set(alarm.id, updated);
      this.ledger.append({ type: "clock.alarm.fired", actor: "clock", subject: alarm.id });
      fired.push(structuredClone(updated));
    }
    return fired;
  }

  startTimer(label: string, durationMs: number): Timer {
    if (!Number.isInteger(durationMs) || durationMs <= 0) throw new Error("a timer needs a positive duration");
    const timer: Timer = {
      id: newId("timer"),
      label: label.trim() || "Timer",
      durationMs,
      remainingMs: durationMs,
      running: true,
      startedAt: nowIso(this.clock),
    };
    this.timers.set(timer.id, timer);
    this.ledger.append({ type: "clock.timer.started", actor: "clock", subject: timer.id });
    return structuredClone(timer);
  }

  timer(timerId: string): Timer | undefined {
    const timer = this.timers.get(timerId);
    return timer ? structuredClone(timer) : undefined;
  }

  tickTimer(timerId: string, at: Date = this.clock()): Timer {
    const timer = this.requireTimer(timerId);
    if (!timer.running || !timer.startedAt) return structuredClone(timer);
    const elapsed = at.getTime() - new Date(timer.startedAt).getTime();
    const remainingMs = Math.max(0, timer.remainingMs - Math.max(0, elapsed));
    const updated: Timer = {
      ...timer,
      remainingMs,
      running: remainingMs > 0,
      startedAt: remainingMs > 0 ? timer.startedAt : undefined,
    };
    this.timers.set(timerId, updated);
    if (remainingMs === 0) {
      this.ledger.append({ type: "clock.timer.finished", actor: "clock", subject: timerId });
    }
    return structuredClone(updated);
  }

  pauseTimer(timerId: string, at: Date = this.clock()): Timer {
    const timer = this.tickTimer(timerId, at);
    const updated: Timer = { ...timer, running: false, startedAt: undefined };
    this.timers.set(timerId, updated);
    return structuredClone(updated);
  }

  resumeTimer(timerId: string): Timer {
    const timer = this.requireTimer(timerId);
    if (timer.remainingMs <= 0) throw new Error("the timer has finished");
    const updated: Timer = { ...timer, running: true, startedAt: nowIso(this.clock) };
    this.timers.set(timerId, updated);
    return structuredClone(updated);
  }

  startStopwatch(): Stopwatch {
    const stopwatch: Stopwatch = {
      running: true,
      elapsedMs: 0,
      startedAt: nowIso(this.clock),
      laps: [],
    };
    this.stopwatches.set("default", stopwatch);
    return structuredClone(stopwatch);
  }

  stopStopwatch(at: Date = this.clock()): Stopwatch {
    const stopwatch = this.requireStopwatch();
    const elapsedMs = this.stopwatchElapsed(stopwatch, at);
    const updated: Stopwatch = { ...stopwatch, running: false, elapsedMs, startedAt: undefined };
    this.stopwatches.set("default", updated);
    return structuredClone(updated);
  }

  lap(at: Date = this.clock()): StopwatchLap {
    const stopwatch = this.requireStopwatch();
    if (!stopwatch.running) throw new Error("the stopwatch is not running");
    const elapsed = this.stopwatchElapsed(stopwatch, at);
    const previous = stopwatch.laps.at(-1)?.atMs ?? 0;
    const lap: StopwatchLap = {
      index: stopwatch.laps.length + 1,
      atMs: elapsed,
      splitMs: elapsed - previous,
    };
    const updated: Stopwatch = { ...stopwatch, laps: [...stopwatch.laps, lap] };
    this.stopwatches.set("default", updated);
    return structuredClone(lap);
  }

  stopwatch(): Stopwatch | undefined {
    const stopwatch = this.stopwatches.get("default");
    return stopwatch ? structuredClone(stopwatch) : undefined;
  }

  worldTime(timeZone: string, at: Date = this.clock()): string {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
        hour12: false,
      }).format(at);
    } catch {
      throw new Error(`unknown time zone: ${timeZone}`);
    }
  }

  private stopwatchElapsed(stopwatch: Stopwatch, at: Date): number {
    if (!stopwatch.running || !stopwatch.startedAt) return stopwatch.elapsedMs;
    return stopwatch.elapsedMs + Math.max(0, at.getTime() - new Date(stopwatch.startedAt).getTime());
  }

  private requireAlarm(alarmId: string): Alarm {
    const alarm = this.alarms.get(alarmId);
    if (!alarm) throw new Error(`no alarm: ${alarmId}`);
    return alarm;
  }

  private requireTimer(timerId: string): Timer {
    const timer = this.timers.get(timerId);
    if (!timer) throw new Error(`no timer: ${timerId}`);
    return timer;
  }

  private requireStopwatch(): Stopwatch {
    const stopwatch = this.stopwatches.get("default");
    if (!stopwatch) throw new Error("no stopwatch has been started");
    return stopwatch;
  }
}
