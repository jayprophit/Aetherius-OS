import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Meeting {
  id: string;
  title: string;
  participants: string[];
  startedAt: string;
  endedAt?: string;
}

export interface MeetOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class MeetService {
  private readonly meetings = new Map<string, Meeting>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MeetOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  start(title: string, participants: string[]): Meeting {
    const meeting: Meeting = { id: newId("meet"), title, participants, startedAt: nowIso(this.clock) };
    this.meetings.set(meeting.id, meeting);
    this.ledger.append({ type: "meet.started", actor: "meet", subject: meeting.id });
    return meeting;
  }

  end(id: string): Meeting {
    const meeting = this.meetings.get(id);
    if (!meeting) throw new Error("meeting not found");
    meeting.endedAt = nowIso(this.clock);
    this.ledger.append({ type: "meet.ended", actor: "meet", subject: id });
    return meeting;
  }

  list(): Meeting[] {
    return Array.from(this.meetings.values());
  }
}
