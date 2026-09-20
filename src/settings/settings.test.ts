import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, SettingsStore, validateSettings } from "./store";

describe("settings store", () => {
  it("starts from defaults without storage", () => {
    expect(new SettingsStore(null).get()).toEqual(DEFAULT_SETTINGS);
  });

  it("rejects bad values and non-loopback endpoints", () => {
    const settings = validateSettings({
      theme: "neon",
      providerPollMs: 5,
      bridgeEndpoint: "https://evil.example:9999",
      matEndpoint: "http://127.0.0.1:9999",
    });
    expect(settings.theme).toBe("dark");
    expect(settings.providerPollMs).toBe(DEFAULT_SETTINGS.providerPollMs);
    expect(settings.bridgeEndpoint).toBe(DEFAULT_SETTINGS.bridgeEndpoint);
    expect(settings.matEndpoint).toBe("http://127.0.0.1:9999");
  });

  it("persists valid updates and notifies", () => {
    const saved: string[] = [];
    const store = new SettingsStore({
      load: () => null,
      save: (raw: string) => {
        saved.push(raw);
      },
    });
    const seen: string[] = [];
    const unsubscribe = store.subscribe((next) => seen.push(next.theme));
    store.update({ theme: "light", providerPollMs: 5000 });
    expect(store.get().theme).toBe("light");
    expect(saved.length).toBe(1);
    expect(seen).toEqual(["light"]);
    unsubscribe();
    store.update({ theme: "dark" });
    expect(seen).toEqual(["light"]);
  });

  it("recovers from corrupt storage", () => {
    const store = new SettingsStore({
      load: () => "{broken",
      save: () => {},
    });
    expect(store.get()).toEqual(DEFAULT_SETTINGS);
  });

  it("reset restores defaults", () => {
    const store = new SettingsStore(null);
    store.update({ theme: "light" });
    expect(store.reset()).toEqual(DEFAULT_SETTINGS);
  });
});
