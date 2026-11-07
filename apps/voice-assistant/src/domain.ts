import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Voice Assistant domain core.
 *
 * A command router: wake-word gating, typed commands with arguments,
 * dictation transcripts and a privacy mode. Speech recognition and speech
 * synthesis are host adapter concerns; this layer routes the transcripts.
 */

export type VoiceCommandKind = "open-app" | "set-setting" | "search" | "note" | "media";

export interface VoiceCommand {
  id: string;
  phrase: string;
  kind: VoiceCommandKind;
  argument: string;
  recognizedAt: string;
  executed: boolean;
}

export interface VoiceTranscript {
  id: string;
  text: string;
  at: string;
}

export interface VoiceAssistantOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  wakeWord?: string;
}

const COMMAND_KINDS: VoiceCommandKind[] = ["open-app", "set-setting", "search", "note", "media"];

export class VoiceAssistant {
  private readonly commands: VoiceCommand[] = [];
  private readonly transcripts: VoiceTranscript[] = [];
  private readonly wakeWord: string;
  private awake = false;
  private privacyMode = false;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: VoiceAssistantOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    const wake = (options.wakeWord ?? "aetherius").trim().toLowerCase();
    this.wakeWord = wake || "aetherius";
  }

  hear(transcript: string): VoiceTranscript {
    if (typeof transcript !== "string" || transcript.trim().length === 0) {
      throw new Error("a transcript needs text");
    }
    const entry: VoiceTranscript = { id: newId("tx"), text: transcript.trim(), at: nowIso(this.clock) };
    this.transcripts.push(entry);
    this.ledger.append({ type: "voice.transcript", actor: "voice", subject: entry.id, data: { chars: entry.text.length } });
    return structuredClone(entry);
  }

  wake(): boolean {
    this.awake = true;
    this.ledger.append({ type: "voice.woke", actor: "voice", subject: this.wakeWord, data: {} });
    return true;
  }

  sleep(): boolean {
    this.awake = false;
    return true;
  }

  get isAwake(): boolean {
    return this.awake;
  }

  setPrivacyMode(enabled: boolean): void {
    this.privacyMode = enabled === true;
    this.ledger.append({ type: "voice.privacy_changed", actor: "voice", subject: "privacy", data: { enabled: enabled === true } });
    if (this.privacyMode) {
      this.awake = false;
    }
  }

  get privacyEnabled(): boolean {
    return this.privacyMode;
  }

  /** Route a transcript into a typed command when the wake word is present. */
  route(transcript: string): VoiceCommand | null {
    if (typeof transcript !== "string" || transcript.trim().length === 0) return null;
    if (this.privacyMode) return null;
    const normalized = transcript.trim().toLowerCase();
    if (!this.awake && !normalized.startsWith(this.wakeWord)) return null;
    const remainder = normalized.startsWith(this.wakeWord)
      ? normalized.slice(this.wakeWord.length).trim()
      : normalized;
    if (remainder.length === 0) return null;

    const patterns: Array<{ kind: VoiceCommandKind; match: RegExp }> = [
      { kind: "open-app", match: /^open\s+(.+)$/ },
      { kind: "set-setting", match: /^set\s+(.+)$/ },
      { kind: "search", match: /^search\s+for\s+(.+)$/ },
      { kind: "note", match: /^note\s+that\s+(.+)$/ },
      { kind: "media", match: /^(play|pause|stop)\s*(.*)$/ },
    ];
    for (const pattern of patterns) {
      const hit = pattern.match.exec(remainder);
      if (hit) {
        const command: VoiceCommand = {
          id: newId("cmd"),
          phrase: transcript.trim(),
          kind: pattern.kind,
          argument: hit[1].trim(),
          recognizedAt: nowIso(this.clock),
          executed: false,
        };
        this.commands.push(command);
        this.ledger.append({ type: "voice.command_routed", actor: "voice", subject: command.id, data: { kind: pattern.kind } });
        return structuredClone(command);
      }
    }
    return null;
  }

  markExecuted(commandId: string): VoiceCommand {
    const command = this.commands.find((candidate) => candidate.id === commandId);
    if (!command) throw new Error(`no command: ${commandId}`);
    command.executed = true;
    return structuredClone(command);
  }

  commandsList(executedOnly = false): VoiceCommand[] {
    return this.commands
      .filter((command) => !executedOnly || command.executed)
      .map((command) => structuredClone(command));
  }

  transcriptsList(): VoiceTranscript[] {
    return this.transcripts.map((entry) => structuredClone(entry));
  }

  static commandKinds(): VoiceCommandKind[] {
    return [...COMMAND_KINDS];
  }
}
