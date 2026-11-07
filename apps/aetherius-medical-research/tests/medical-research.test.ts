import { describe, it } from "node:test";
import assert from "node:assert";
import { MedicalResearch } from "../src/domain.ts";

describe("MedicalResearch", () => {
  it("registers and lists studies", () => {
    const med = new MedicalResearch();
    const study = med.register("Brain Scan", "mri", true);
    assert.equal(study.modality, "mri");
    assert.equal(med.list().length, 1);
  });
});
