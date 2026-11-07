import { describe, it } from "node:test";
import assert from "node:assert";
import { LanguageService } from "../src/domain.ts";

describe("LanguageService", () => {
  it("translates text", () => {
    const lang = new LanguageService();
    const result = lang.translate("Hello", "en", "fr");
    assert.equal(result.translatedText, "[fr] Hello");
  });
});
