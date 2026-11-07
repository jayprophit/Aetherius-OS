import { describe, it } from "node:test";
import assert from "node:assert";
import { AccessibilityService } from "../src/domain.ts";

describe("AccessibilityService", () => {
  it("applies accessibility profiles", () => {
    const access = new AccessibilityService();
    const profile = access.apply({ screenReader: true, highContrast: false, fontSize: 18 });
    assert.equal(profile.screenReader, true);
    assert.equal(profile.fontSize, 18);
    assert.equal(access.current()?.id, profile.id);
  });
});
