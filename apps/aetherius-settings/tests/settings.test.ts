import { describe, it } from "node:test";
import assert from "node:assert";
import { SettingsService } from "../src/domain.ts";

describe("SettingsService", () => {
  it("sets and gets settings", () => {
    const settings = new SettingsService();
    const s = settings.set("theme", "dark", "appearance");
    assert.equal(settings.get("theme")?.value, "dark");
    assert.equal(s.category, "appearance");
  });

  it("lists by category", () => {
    const settings = new SettingsService();
    settings.set("theme", "dark", "appearance");
    settings.set("font", "sans", "appearance");
    settings.set("lang", "en", "regional");
    const appearance = settings.listByCategory("appearance");
    assert.equal(appearance.length, 2);
  });
});
