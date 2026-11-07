import { describe, it } from "node:test";
import assert from "node:assert";
import { MlOps } from "../src/domain.ts";

describe("MlOps", () => {
  it("runs and lists experiments", () => {
    const mlOps = new MlOps();
    const experiment = mlOps.run("Sentiment", "reviews", "accuracy");
    assert.equal(experiment.metric, "accuracy");
    assert.equal(mlOps.list().length, 1);
  });
});
