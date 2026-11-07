import { describe, it } from "node:test";
import assert from "node:assert";
import { CloudService } from "../src/domain.ts";

describe("CloudService", () => {
  it("deploys and lists deployments", () => {
    const cloud = new CloudService();
    const deployment = cloud.deploy("web-app", "aws", "us-east-1");
    assert.equal(deployment.provider, "aws");
    assert.equal(cloud.list().length, 1);
  });
});
