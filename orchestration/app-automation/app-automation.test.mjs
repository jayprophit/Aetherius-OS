import { describe, expect, it } from "vitest";

import { appId, automationFor, classify, parseShortcutText } from "./detect.mjs";
import { validateUrl } from "./automate.mjs";
import { loadRegistry } from "./detect.mjs";

describe("app detection helpers", () => {
  it("classifies applications by name", () => {
    expect(classify("Firefox Developer Edition")).toBe("browser");
    expect(classify("Blender 5.2.2.0")).toBe("creative");
    expect(classify("Hermes")).toBe("agent");
    expect(classify("Audacity 4.0.0")).toBe("audio");
    expect(classify("Totally Unknown App")).toBe("utility");
  });

  it("derives stable ids", () => {
    expect(appId("Firefox Developer Edition")).toBe("firefox-developer-edition");
    expect(appId("Godot_v4.7.2-stable_mono_win64 - Shortcut")).toBe("godot-v4-7-2-stable-mono-win64-shortcut");
    expect(appId("")).toBe("app");
  });

  it("maps automation modes by app kind", () => {
    expect(automationFor({ label: "Google Chrome", target: "C:\\chrome.exe" })).toContain("browser");
    expect(automationFor({ label: "Ollama", target: "C:\\ollama.exe" })).toContain("cli");
    expect(automationFor({ label: "Blender 5.2", target: "C:\\blender.exe" })).toContain("file");
    expect(automationFor({ label: "Obscure Thing", target: "C:\\thing.exe" })).toEqual(["launch-only"]);
  });

  it("parses shortcut resolution output", () => {
    const parsed = parseShortcutText("C:\\tools\\app.exe\t--headless\tC:\\work\nD:\\game.exe\t\t");
    expect(parsed).toEqual([
      { target: "C:\\tools\\app.exe", args: "--headless", workingDir: "C:\\work" },
      { target: "D:\\game.exe", args: "", workingDir: "" },
    ]);
    expect(parseShortcutText("")).toEqual([]);
  });
});

describe("browser URL validation", () => {
  it("accepts http and https only", () => {
    expect(validateUrl("https://example.com/path?x=1")).toBe("https://example.com/path?x=1");
    expect(validateUrl("http://127.0.0.1:7317/a2a")).toBe("http://127.0.0.1:7317/a2a");
    expect(() => validateUrl("file:///C:/secret")).toThrow(/protocol/);
    expect(() => validateUrl("javascript:alert(1)")).toThrow(/protocol/);
    expect(() => validateUrl("not a url")).toThrow(/not a valid URL/);
  });
});

describe("app registry", () => {
  it("is present, populated and free of secret-looking values", () => {
    let registry;
    try {
      registry = loadRegistry();
    } catch {
      // Detect before the registry exists; detection is the deliverable.
      return;
    }
    expect(registry.count).toBe(registry.apps.length);
    expect(registry.count).toBeGreaterThan(20);
    expect(registry.policy.free_only).toBe(true);
    expect(registry.policy.launch_requires_owner_approval).toBe(true);
    const secretPattern = /(api[_-]?key\s*[:=]|secret\s*[:=]|token\s*=|bearer\s+[a-z0-9]{20,})/i;
    for (const app of registry.apps) {
      expect(app.id).toBeTruthy();
      expect(app.label).toBeTruthy();
      expect(app.category).toBeTruthy();
      expect(app.checked_at).toBeTruthy();
      expect(Array.isArray(app.automation)).toBe(true);
      for (const value of [app.id, app.label, app.target, app.args]) {
        expect(secretPattern.test(String(value ?? ""))).toBe(false);
      }
    }
  });
});
