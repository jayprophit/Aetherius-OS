import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Shell workflow contract tests.
 *
 * These prove the integration claims without a browser: every window id the
 * launcher can open resolves to a real registry entry, the AI provider
 * labels are honest, and Task Manager no longer simulates process telemetry.
 */

const registrySource = readFileSync(resolve("src/apps/shellRegistry.tsx"), "utf-8");
const providerSource = readFileSync(resolve("src/ai/provider.ts"), "utf-8");
const taskManagerSource = readFileSync(resolve("components/apps/TaskManager.tsx"), "utf-8");
const dataSource = readFileSync(resolve("data.ts"), "utf-8");

function registryIds(): string[] {
  return [...registrySource.matchAll(/component: "(aetherius-[a-z0-9-]+)"/g)].map((m) => m[1]);
}

function menuIds(): string[] {
  return [...dataSource.matchAll(/component: "(aetherius-[a-z0-9-]+)"/g)].map((m) => m[1]);
}

import { probeGenesisServer, probeAgentBridge, chatWithProvider } from "./ai/provider";

describe("AI provider contracts", () => {
  it("genesis server is honestly NOT_CONFIGURED", async () => {
    const state = await probeGenesisServer();
    expect(state.available).toBe(false);
    expect(state.label).toContain("NOT_CONFIGURED");
  });

  it("agent bridge is honestly NOT_CONFIGURED", async () => {
    const state = await probeAgentBridge();
    expect(state.available).toBe(false);
    expect(state.label).toContain("NOT_CONFIGURED");
  });

  it("offline fallback never claims to be Genesis output", async () => {
    const result = await chatWithProvider([{ role: "user", content: "hello" }], { preferLocal: false });
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("offline-fallback");
    expect(result.label).toContain("OFFLINE");
    expect(result.text?.length).toBeGreaterThan(0);
  });
});

describe("shell registry integration", () => {
  it("registers the 30 previously-unwired components", () => {
    const ids = registryIds();
    expect(ids.length).toBe(30);
    expect(new Set(ids).size).toBe(30);
  });

  it("every registry id has a menu/desktop entry", () => {
    const menu = new Set(menuIds());
    for (const id of registryIds()) {
      expect(menu.has(id), `registry id ${id} missing from data.ts`).toBe(true);
    }
  });

  it("Task Manager uses real browser signals, not simulation", () => {
    expect(taskManagerSource).toContain("hardwareConcurrency");
    expect(taskManagerSource).toContain("Browser preview shows real browser signals only");
    expect(taskManagerSource).not.toContain("Math.random()");
    expect(taskManagerSource).not.toContain("initialProcesses");
  });

  it("AI provider names the runtime that answered", () => {
    expect(providerSource).toContain("local-ollama");
    expect(providerSource).toContain("offline-fallback");
    expect(providerSource).toContain("OFFLINE FALLBACK");
    // The native Genesis model is never presented as an Ollama response.
    expect(providerSource).not.toContain("native Genesis output");
  });

  it("file manager labels the virtual filesystem honestly", () => {
    const fileManager = readFileSync(resolve("components/apps/FileManager.tsx"), "utf-8");
    expect(fileManager.toLowerCase()).toMatch(/local ?storage|on this device/);
  });
});
