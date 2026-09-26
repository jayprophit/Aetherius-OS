import { describe, expect, it } from "vitest";
import { buildChangeImpactGraph } from "../programme/changeImpact";
import type { TouchEstimate } from "./touch";
import {
  COLLISION_KINDS,
  forecastCollisions,
} from "./collisionPrediction";
import * as collision from "./collisionPrediction";
import type { PlannedWorker } from "./collisionPrediction";

/**
 * Dimension-specific fixtures. Each worker declares its own branch, merge
 * order and touch set explicitly, so one worker's predicted paths can never
 * satisfy another's collision query through an inherited default.
 */
function estimate(paths: string[], unknown: string[] = []): TouchEstimate {
  return { paths: [...paths], sources: [], unknown: [...unknown], invalid: [] };
}

function worker(id: string, branch: string, mergeOrder: number, paths: string[], unknown: string[] = []): PlannedWorker {
  return { workerId: id, branch, mergeOrder, touch: estimate(paths, unknown) };
}

const GRAPH = buildChangeImpactGraph({
  nodes: ["src/a.ts", "src/b.ts", "src/consumer.ts"],
  // consumer imports a and b, so a write to a or b affects consumer.
  edges: [
    { from: "src/consumer.ts", to: "src/a.ts", relation: "IMPORTS", reason: "consumer imports a" },
    { from: "src/consumer.ts", to: "src/b.ts", relation: "IMPORTS", reason: "consumer imports b" },
  ],
});

describe("shared-write prediction", () => {
  it("predicts a collision when two plans touch the same path", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "feat/one", 0, ["src/a.ts"]), worker("w2", "feat/two", 1, ["src/a.ts"])],
    });
    expect(result.collisions).toHaveLength(1);
    expect(result.collisions[0]!.kind).toBe("SHARED_WRITE");
    expect(result.collisions[0]!.workers).toEqual(["w1", "w2"]);
    expect(result.collisions[0]!.paths).toEqual(["src/a.ts"]);
    expect(result.collisions[0]!.viaBranch).toBe("feat/one");
  });

  it("predicts nothing for disjoint plans", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "feat/one", 0, ["src/a.ts"]), worker("w2", "feat/two", 1, ["src/b.ts"])],
    });
    expect(result.collisions).toEqual([]);
  });

  it("collects every shared path on one pair", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "b1", 0, ["src/a.ts", "src/b.ts"]), worker("w2", "b2", 1, ["src/b.ts", "src/a.ts"])],
    });
    expect(result.collisions).toHaveLength(1);
    expect(result.collisions[0]!.paths).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("orders the pair deterministically regardless of input order", () => {
    const forwards = forecastCollisions({
      workers: [worker("w1", "b1", 0, ["src/a.ts"]), worker("w2", "b2", 1, ["src/a.ts"])],
    });
    const backwards = forecastCollisions({
      workers: [worker("w2", "b2", 1, ["src/a.ts"]), worker("w1", "b1", 0, ["src/a.ts"])],
    });
    expect(forwards.collisions).toEqual(backwards.collisions);
    expect(forwards.collisions[0]!.workers).toEqual(["w1", "w2"]);
  });

  it("declares only two structural collision kinds", () => {
    expect([...COLLISION_KINDS]).toEqual(["SHARED_WRITE", "DEPENDENT_WRITE"]);
  });
});

describe("dependent-write prediction uses real dependency structure", () => {
  it("predicts DEPENDENT_WRITE when a consumer is affected by another's write", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "feat/one", 0, ["src/a.ts"]), worker("w2", "feat/consumer", 1, ["src/consumer.ts"])],
      graph: GRAPH,
    });
    const dependent = result.collisions.find((c) => c.kind === "DEPENDENT_WRITE");
    expect(dependent).toBeDefined();
    expect(dependent!.workers).toEqual(["w1", "w2"]);
    expect(dependent!.paths).toEqual(["src/a.ts"]);
  });

  it("does NOT predict a dependency collision when no graph is supplied", () => {
    // Absent dependency structure is not guessed at. Only SHARED_WRITE can be
    // predicted without a graph, and that limitation is the honest result.
    const result = forecastCollisions({
      workers: [worker("w1", "feat/one", 0, ["src/a.ts"]), worker("w2", "feat/consumer", 1, ["src/consumer.ts"])],
    });
    expect(result.collisions).toEqual([]);
  });

  it("does not invent a dependency from name similarity", () => {
    const similar = buildChangeImpactGraph({
      nodes: ["src/user.ts", "src/userService.ts"],
      edges: [],
    });
    const result = forecastCollisions({
      workers: [worker("w1", "b1", 0, ["src/user.ts"]), worker("w2", "b2", 1, ["src/userService.ts"])],
      graph: similar,
    });
    expect(result.collisions).toEqual([]);
  });

  it("reports a same-path write as SHARED_WRITE, not as a dependency on itself", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "b1", 0, ["src/a.ts"]), worker("w2", "b2", 1, ["src/a.ts"])],
      graph: GRAPH,
    });
    expect(result.collisions.map((c) => c.kind)).toEqual(["SHARED_WRITE"]);
  });
});

describe("an unpredictable plan is not a cleared plan", () => {
  it("keeps a worker whose touch set could not be estimated out of the cleared set", () => {
    const result = forecastCollisions({
      workers: [
        worker("w1", "b1", 0, ["src/a.ts"]),
        worker("w2", "b2", 1, [], ["could not resolve skill ref"]),
      ],
    });
    // w2 predicted nothing, but it is NOT reported as collision-free.
    expect(result.unpredictable).toEqual([{ workerId: "w2", reasons: ["could not resolve skill ref"] }]);
    expect(result.collisions).toEqual([]);
  });

  it("carries every estimator reason through rather than the first", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "b1", 0, [], ["reason-a", "reason-b"])],
    });
    expect(result.unpredictable[0]!.reasons).toEqual(["reason-a", "reason-b"]);
  });

  it("does not count an unpredictable worker's paths as collisions", () => {
    const result = forecastCollisions({
      workers: [
        worker("w1", "b1", 0, ["src/a.ts"]),
        worker("w2", "b2", 1, ["src/a.ts"], ["unknown reason"]),
      ],
    });
    // w2 is unpredictable, so it is not silently treated as colliding here.
    expect(result.collisions).toEqual([]);
    expect(result.unpredictable).toHaveLength(1);
  });
});

describe("merge order is reported, never silently reordered", () => {
  it("flags two branches claiming the same merge position", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "feat/one", 0, ["src/a.ts"]), worker("w2", "feat/two", 0, ["src/b.ts"])],
    });
    expect(result.mergeOrderClashes).toEqual([{ branches: ["feat/one", "feat/two"], mergeOrder: 0 }]);
  });

  it("does not flag distinct merge positions", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "feat/one", 0, ["src/a.ts"]), worker("w2", "feat/two", 1, ["src/b.ts"])],
    });
    expect(result.mergeOrderClashes).toEqual([]);
  });

  it("does not flag two workers on the SAME branch at the same position", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "feat/one", 0, ["src/a.ts"]), worker("w2", "feat/one", 0, ["src/b.ts"])],
    });
    expect(result.mergeOrderClashes).toEqual([]);
  });
});

describe("a forecast is not a prevention and not a proof", () => {
  it("names the reactive policy that remains the actual oracle", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "b1", 0, ["src/a.ts"]), worker("w2", "b2", 1, ["src/a.ts"])],
      reactiveOracle: "incoming-wins",
    });
    // The forecast never claims to prevent anything; the sync conflict is
    // the real observation, under the caller's chosen policy.
    expect(result.reactiveOracle).toBe("incoming-wins");
    expect(result.noProbability).toBe(true);
  });

  it("rejects an invented reactive policy", () => {
    expect(() => forecastCollisions({ workers: [worker("w1", "b1", 0, ["src/a.ts"])], reactiveOracle: "force" as never })).toThrowError(
      /policy/,
    );
  });

  it("produces no probability, score, ranking or verdict", () => {
    const result = forecastCollisions({
      workers: [worker("w1", "b1", 0, ["src/a.ts"]), worker("w2", "b2", 1, ["src/a.ts"])],
      graph: GRAPH,
    });
    for (const banned of ["probability", "confidence", "score", "risk", "verdict", "rank", "winner", "rating", "severity"]) {
      expect(Object.keys(result)).not.toContain(banned);
    }
  });

  it("does not reimplement reactive serialization", () => {
    const names = Object.keys(collision);
    expect(names).not.toContain("applySync");
    expect(names).not.toContain("diffManifests");
    for (const banned of ["sync", "apply", "merge", "lock", "lease", "serialize"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });
});

describe("validation", () => {
  it("rejects an empty worker set and malformed workers", () => {
    expect(() => forecastCollisions({ workers: [] })).toThrowError(/workers/);
    expect(() => forecastCollisions({ workers: [worker("", "b", 0, [])] })).toThrowError(/worker-id/);
    expect(() => forecastCollisions({ workers: [worker("w1", "", 0, [])] })).toThrowError(/branch/);
    expect(() => forecastCollisions({ workers: [worker("w1", "b", -1, [])] })).toThrowError(/merge-order/);
    // A malformed touch set is rejected by the module, not by the fixture
    // helper that would otherwise spread it first.
    expect(() =>
      forecastCollisions({ workers: [{ workerId: "w1", branch: "b", mergeOrder: 0, touch: null as never }] }),
    ).toThrowError(/touch/);
  });

  it("rejects duplicate worker ids", () => {
    expect(() =>
      forecastCollisions({ workers: [worker("w1", "b1", 0, []), worker("w1", "b2", 1, [])] }),
    ).toThrowError(/duplicate-worker/);
  });

  it("rejects unrecognised keys rather than silently dropping them", () => {
    expect(() => forecastCollisions({ workers: [worker("w1", "b", 0, [])], retries: 3 } as never)).toThrowError(
      /unknown-field/,
    );
  });

  it("does not mutate its inputs", () => {
    const workers = [worker("w1", "b1", 0, ["src/a.ts"]), worker("w2", "b2", 1, ["src/a.ts"])];
    const before = JSON.stringify(workers);
    forecastCollisions({ workers, graph: GRAPH });
    expect(JSON.stringify(workers)).toBe(before);
  });
});
