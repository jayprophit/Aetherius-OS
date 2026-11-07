import { describe, it } from "node:test";
import assert from "node:assert";
import { Browser } from "../src/domain.ts";

describe("Browser", () => {
  it("opens and closes tabs", () => {
    const browser = new Browser();
    const tab = browser.open("https://aetherius.os");
    assert.equal(browser.listTabs().length, 1);
    browser.close(tab.id);
    assert.equal(browser.listTabs().length, 0);
  });

  it("throws on missing tab", () => {
    const browser = new Browser();
    assert.throws(() => browser.close("nonexistent"), /tab not found/);
  });
});
