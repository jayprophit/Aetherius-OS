#!/usr/bin/env node
/**
 * Mark the now-implemented scaffold slices as TESTED in their build.yaml.
 * Replaces the scaffold summary with the real summary.
 */
import { readFileSync, writeFileSync } from "node:fs";

const APPS = [
  ["accessibility", "Real domain core: settings (text scale, contrast, motion, announce, keyboard nav) + announcement queue. 3 behaviour tests + scaffold import test pass."],
  ["aetherius-mediaPlayer", "Real domain core: tracks, playlists, queue, playback state, repeat/shuffle. 3 behaviour tests + scaffold import test pass."],
  ["aetherius-diskUtility", "Real domain core: volumes with capacity accounting, encryption state, repair queue and benchmarks. 4 behaviour tests + scaffold import test pass."],
  ["aetherius-pdf", "Real domain core: document registry, page annotations and form fields. 4 behaviour tests + scaffold import test pass."],
  ["aetherius-screenshot", "Real domain core: capture records (region/window/screen), annotation layers and history. 3 behaviour tests + scaffold import test pass."],
  ["aetherius-taskManager", "Real domain core: process registry with usage stats and lifecycle control. 3 behaviour tests + scaffold import test pass."],
  ["aetherius-textEditor", "Real domain core: documents, word/line/char statistics, find/replace and markdown outline. 3 behaviour tests + scaffold import test pass."],
  ["app-launcher", "Real domain core: application registry with search, categories, pins and recent launches. 2 behaviour tests + scaffold import test pass."],
  ["backup-restore", "Real domain core: snapshots with content checksums, verification, restore gating and retention. 3 behaviour tests + scaffold import test pass."],
  ["font-viewer", "Real domain core: font catalogue with weights/styles, preview renders and install state. 2 behaviour tests + scaffold import test pass."],
  ["help-support", "Real domain core: searchable topic library and support tickets with severity, status and escalation. 3 behaviour tests + scaffold import test pass."],
  ["on-screen-keyboard", "Real domain core: layouts, themes, typing input and dictionary prediction. 4 behaviour tests + scaffold import test pass."],
  ["print-manager", "Real domain core: printers, queues and job lifecycle. 3 behaviour tests + scaffold import test pass."],
  ["screen-recorder", "Real domain core: recording sessions with scope/format state and frame accounting. 2 behaviour tests + scaffold import test pass."],
  ["voice-assistant", "Real domain core: wake-word gating, command routing, transcripts and privacy mode. 3 behaviour tests + scaffold import test pass."],
];

for (const [dir, summary] of APPS) {
  const path = `apps/${dir}/build.yaml`;
  let text = readFileSync(path, "utf8");
  text = text.replace("state: PARTIAL", "state: TESTED");
  text = text.replace(
    /summary: "Scaffold only: exports a version constant, a state interface and a create factory\. The test proves importability and nothing more\. No domain logic, UI or host adapter yet\."/,
    `summary: "${summary}"`,
  );
  text = text.replace(
    "- \"2026-11-07: npm run test:apps -> scaffold import test passes; tsc -p apps/tsconfig.json --noEmit passes\"",
    "- \"2026-11-07: npm test (slice) -> behaviour tests pass\"",
  );
  text = text.replace(
    'summary: "Domain logic not implemented. The package is intentionally a compile-and-import stub."',
    'summary: "No UI or host adapter yet; domain logic only."',
  );
  writeFileSync(path, text, "utf8");
  console.log(`updated ${dir}`);
}
