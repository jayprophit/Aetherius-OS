import { describe, it } from "node:test";
import assert from "node:assert";
import { ModelLab } from "../src/domain.ts";

describe("ModelLab", () => {
  it("runs and lists experiments", () => {
    const lab = new ModelLab();
    const experiment = lab.run("GPT-micro", "tiny-stories", "perplexity");
    assert.equal(experiment.metric, "perplexity");
    assert.equal(lab.list().length, 1);
  });
});
