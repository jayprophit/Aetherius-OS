import { describe, expect, it } from "vitest";
import {
  failoverOrder,
  pickBest,
  routeCapabilityRequest,
  type CapabilityRequest,
  type ModelCard,
} from "./capabilities";

function model(over: Partial<ModelCard> & { id: string }): ModelCard {
  return {
    providerId: "p",
    localRemote: "remote",
    capabilities: {
      contextLimit: 128000,
      modalities: ["text"],
      reasoning: true,
      coding: true,
      vision: false,
      audio: false,
      toolUse: true,
      structuredOutput: true,
    },
    costRank: 1,
    healthy: true,
    ...over,
  };
}

const baseRequest: CapabilityRequest = {
  minContext: 64000,
  modalities: ["text"],
  coding: true,
  toolUse: true,
  privacy: "cloud-allowed",
};

describe("capability routing", () => {
  it("ranks eligible models deterministically", () => {
    const models = [
      model({ id: "b", providerId: "p2" }),
      model({ id: "a", providerId: "p1" }),
      model({ id: "c", providerId: "p1", capabilities: { ...model({ id: "x" }).capabilities, contextLimit: 1000000 } }),
    ];
    const first = routeCapabilityRequest(models, baseRequest);
    const second = routeCapabilityRequest([...models].reverse(), baseRequest);
    expect(first.ranked.map((m) => m.id)).toEqual(["c", "a", "b"]);
    expect(second.ranked.map((m) => m.id)).toEqual(["c", "a", "b"]);
    expect(pickBest(first)?.id).toBe("c");
    expect(failoverOrder(first)).toEqual(["c", "a", "b"]);
  });
  it("prefers local models for equal capability", () => {
    const models = [model({ id: "cloud" }), model({ id: "edge", localRemote: "local" })];
    expect(routeCapabilityRequest(models, baseRequest).ranked[0].id).toBe("edge");
  });
  it("enforces local-only privacy without silent fallback", () => {
    const models = [model({ id: "cloud" })];
    const r = routeCapabilityRequest(models, { ...baseRequest, privacy: "local-only" });
    expect(r.ranked).toEqual([]);
    expect(pickBest(r)).toBeNull();
    expect(r.excluded[0].reason).toContain("local-only");
  });
  it("excludes missing context, modality, capability and unhealthy with reasons", () => {
    const models = [
      model({ id: "small", capabilities: { ...model({ id: "x" }).capabilities, contextLimit: 8000 } }),
      model({ id: "blind", capabilities: { ...model({ id: "x" }).capabilities, vision: false } }),
      model({ id: "sick", healthy: false }),
    ];
    const r = routeCapabilityRequest(models, { ...baseRequest, modalities: ["text", "image"], vision: true });
    expect(r.ranked).toEqual([]);
    expect(r.excluded.map((e) => e.model).sort()).toEqual(["blind", "sick", "small"]);
    for (const e of r.excluded) expect(e.reason.length).toBeGreaterThan(0);
  });
  it("manual pin still enforces hard requirements", () => {
    const models = [model({ id: "a" }), model({ id: "b" })];
    const ok = routeCapabilityRequest(models, { ...baseRequest, pin: "b" });
    expect(ok.ranked.map((m) => m.id)).toEqual(["b"]);
    const bad = routeCapabilityRequest(models, { ...baseRequest, pin: "ghost" });
    expect(bad.ranked).toEqual([]);
  });
});
