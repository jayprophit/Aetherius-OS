import { describe, it } from "node:test";
import assert from "node:assert";
import { BioLab } from "../src/domain.ts";

describe("BioLab", () => {
  it("runs and lists experiments", () => {
    const bioLab = new BioLab();
    const experiment = bioLab.run("Cell Count", "microscopy", 96);
    assert.equal(experiment.modality, "microscopy");
    assert.equal(bioLab.list().length, 1);
  });
});
