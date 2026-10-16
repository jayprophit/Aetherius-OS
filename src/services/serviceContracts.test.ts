import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as contracts from "./serviceContracts";
import {
  CANONICAL_SERVICE_CONTRACTS,
  ServiceContractError,
  ServiceContractRegistry,
  canonicalServiceRegistry,
  unboundServicePrimitives,
} from "./serviceContracts";

function expectContractError(fn: () => unknown, code: string) {
  try {
    fn();
    throw new Error("invalid service contract was accepted");
  } catch (error) {
    expect(error).toBeInstanceOf(ServiceContractError);
    expect((error as ServiceContractError).code).toBe(code);
  }
}

describe("unified service contracts", () => {
  it("contains exactly the required primitive vocabulary", () => {
    expect(CANONICAL_SERVICE_CONTRACTS.map((contract) => contract.primitive)).toEqual([
      "identity",
      "policy",
      "files",
      "search",
      "messaging",
      "wallet",
      "events",
      "rewards",
      "knowledge",
      "ai",
      "audit",
    ]);
    const registry = canonicalServiceRegistry();
    expect(registry.contracts()).toHaveLength(11);
    expect(() => registry.register(CANONICAL_SERVICE_CONTRACTS[0]!)).toThrowError(
      expect.objectContaining({ name: "ServiceContractError", code: "SERVICE_OPERATION_DUPLICATE" }),
    );
  });

  it("reports bound implementations and missing ones without conflating them", () => {
    const registry = canonicalServiceRegistry();
    expect(unboundServicePrimitives(registry)).toEqual(["files", "wallet", "rewards", "knowledge"]);
    expect(registry.requireBoundContract("search").adapter).toMatchObject({ status: "bound" });
    expect(() => registry.requireBoundContract("wallet")).toThrowError(/no wallet implementation is bound/);
    for (const contract of registry.contracts()) {
      if (contract.adapter.status !== "bound") continue;
      const path = fileURLToPath(new URL(`../../${contract.adapter.moduleRef}`, import.meta.url));
      expect(existsSync(path), `${contract.primitive} names a missing module`).toBe(true);
    }
  });

  it("keeps financial contracts descriptive and authority-free", () => {
    const registry = canonicalServiceRegistry();
    for (const primitive of ["wallet", "rewards"] as const) {
      for (const operation of registry.contractFor(primitive).operations) {
        expect(operation.access === "describe" || operation.access === "read").toBe(true);
        expect(operation.authority).toBe("none");
      }
    }
    expectContractError(
      () =>
        registry.register({
          primitive: "wallet",
          version: "1.0.0",
          summary: "Invalid execution-shaped wallet operation.",
          operations: [
            { operation: "transfer-funds", access: "request", authority: "owner-approval", evidence: "required", description: "Move funds." },
          ],
          adapter: { status: "unbound", unboundReason: "fixture" },
        }),
      "SERVICE_FINANCE_EXECUTION_REJECTED",
    );
  });

  it("rejects malformed, duplicate and unknown contracts", () => {
    const registry = new ServiceContractRegistry();
    expectContractError(
      () => registry.register({ ...CANONICAL_SERVICE_CONTRACTS[1]!, primitive: "mystery" as never }),
      "SERVICE_PRIMITIVE_UNKNOWN",
    );
    expectContractError(
      () => registry.register({ ...CANONICAL_SERVICE_CONTRACTS[1]!, operations: [] }),
      "SERVICE_OPERATION_INVALID",
    );
    expectContractError(() => registry.contractFor("mystery" as never), "SERVICE_PRIMITIVE_UNKNOWN");
  });

  it("exposes contracts and validation, not an execution surface", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "CANONICAL_SERVICE_CONTRACTS",
      "SERVICE_CONTRACT_VERSION",
      "SERVICE_PRIMITIVES",
      "ServiceContractError",
      "ServiceContractRegistry",
      "assertServiceContract",
      "canonicalServiceRegistry",
      "unboundServicePrimitives",
    ]);
  });
});
