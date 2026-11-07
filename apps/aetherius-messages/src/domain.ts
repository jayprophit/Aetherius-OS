import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Message {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  body: string;
  sentAt: string;
  read: boolean;
}

export interface Thread {
  id: string;
  participants: string[];
  messages: Message[];
}

export interface MessagingOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Messaging {
  private readonly threads = new Map<string, Thread>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MessagingOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createThread(participants: string[]): Thread {
    const thread: Thread = {
      id: newId("thread"),
      participants,
      messages: [],
    };
    this.threads.set(thread.id, thread);
    this.ledger.append({ type: "messaging.thread.created", actor: "messaging", subject: thread.id });
    return thread;
  }

  send(threadId: string, from: string, body: string, to: string[]): Message {
    const thread = this.threads.get(threadId);
    if (!thread) throw new Error("thread not found");
    const message: Message = {
      id: newId("msg"),
      threadId,
      from,
      to,
      body,
      sentAt: nowIso(this.clock),
      read: false,
    };
    thread.messages.push(message);
    this.ledger.append({ type: "messaging.message.sent", actor: "messaging", subject: message.id });
    return message;
  }

  getThread(threadId: string): Thread | undefined {
    return this.threads.get(threadId);
  }

  listThreads(): Thread[] {
    return Array.from(this.threads.values());
  }
}
