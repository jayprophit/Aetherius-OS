import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { VoiceAssistant } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("VoiceAssistant", () => {
  it("routes the wake word and known command shapes", () => {
    const assistant = new VoiceAssistant({ clock: CLOCK, wakeWord: "aetherius" });
    assert.equal(assistant.route("open notes"), null);
    assert.equal(assistant.route("aetherius open notes")?.kind, "open-app");
    assert.equal(assistant.route("aetherius search for invoices")?.kind, "search");
    assert.equal(assistant.route("aetherius search for invoices")?.argument, "invoices");
    const note = assistant.route("aetherius note that I have a meeting");
    assert.equal(note?.kind, "note");
    assert.equal(note?.argument, "i have a meeting");
    assert.equal(assistant.commandsList().length, 4);
    assert.equal(assistant.route("aetherius gibberish words"), null);
  });

  it("wake, sleep and privacy mode gate routing", () => {
    const assistant = new VoiceAssistant({ clock: CLOCK });
    assistant.wake();
    assert.equal(assistant.route("open terminal")?.kind, "open-app");
    assistant.sleep();
    assert.equal(assistant.route("open terminal"), null);

    assistant.setPrivacyMode(true);
    assistant.wake();
    assert.equal(assistant.route("aetherius open notes"), null);
    assert.equal(assistant.privacyEnabled, true);
    assistant.setPrivacyMode(false);
    assert.notEqual(assistant.route("aetherius open notes"), null);
  });

  it("records transcripts and marks commands executed", () => {
    const assistant = new VoiceAssistant({ clock: CLOCK });
    const transcript = assistant.hear("aetherius open weather");
    assert.match(transcript.text, /open weather/);
    assert.equal(assistant.transcriptsList().length, 1);
    const command = assistant.route("aetherius open weather");
    assert.ok(command);
    assistant.markExecuted(command!.id);
    assert.equal(assistant.commandsList(true).length, 1);
    assert.throws(() => assistant.markExecuted("missing"), /no command/);
    assert.throws(() => assistant.hear(""), /needs text/);
  });
});
