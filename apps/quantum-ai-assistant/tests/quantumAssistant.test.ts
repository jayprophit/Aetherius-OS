import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger } from "../../app-kit/src/index.ts";
import type { Account } from "../../app-kit/src/index.ts";
import {
  QUANTUM_DISCLAIMER,
  QuantumAssistant,
  QuantumCircuit,
  bellCircuit,
  simulate,
} from "../src/quantumAssistant.ts";

const ACCOUNT: Account = {
  id: "acc_alice",
  handle: "alice",
  displayName: "Alice",
  email: null,
  roles: ["member"],
  status: "active",
  createdAt: "2026-10-27T00:00:00.000Z",
};

function assertClose(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
}

test("an X gate flips |0> to |1>", () => {
  const result = simulate({ qubits: 1, gates: [{ type: "x", target: 0 }] });
  assert.deepEqual(result.probabilities, [0, 1]);
  assert.equal(result.expectationZ[0], -1);
  assert.equal(result.disclaimer, QUANTUM_DISCLAIMER);
});

test("a Hadamard creates an equal superposition", () => {
  const result = simulate({ qubits: 1, gates: [{ type: "h", target: 0 }] });
  assertClose(result.probabilities[0]!, 0.5);
  assertClose(result.probabilities[1]!, 0.5);
  assertClose(result.expectationZ[0]!, 0);
});

test("a Bell circuit produces only |00> and |11>", () => {
  const result = simulate(bellCircuit());
  assertClose(result.probabilities[0]!, 0.5);
  assert.equal(result.probabilities[1], 0);
  assert.equal(result.probabilities[2], 0);
  assertClose(result.probabilities[3]!, 0.5);
  assertClose(result.expectationZ[0]!, 0);
  assertClose(result.expectationZ[1]!, 0);
});

test("RX(pi) reaches |1> and RY(pi/2) reaches an equal superposition", () => {
  const rx = simulate({ qubits: 1, gates: [{ type: "rx", target: 0, theta: Math.PI }] });
  assertClose(rx.probabilities[1]!, 1);
  const ry = simulate({ qubits: 1, gates: [{ type: "ry", target: 0, theta: Math.PI / 2 }] });
  assertClose(ry.probabilities[0]!, 0.5);
  assertClose(ry.probabilities[1]!, 0.5);
});

test("a CNOT without a control in superposition leaves |00>", () => {
  const result = simulate({ qubits: 2, gates: [{ type: "cnot", control: 0, target: 1 }] });
  assert.deepEqual(result.probabilities, [1, 0, 0, 0]);
});

test("sampling is deterministic for a seed and respects the Born distribution", () => {
  const circuit = new QuantumCircuit(2);
  for (const gate of bellCircuit().gates) circuit.apply(gate);
  const first = circuit.sample(1000, 7);
  const second = circuit.sample(1000, 7);
  assert.deepEqual(first, second);
  assert.equal(first[0]! + first[3]!, 1000);
  assert.ok(first[0]! > 400 && first[3]! > 400);
});

test("invalid qubits, gates and parameters are refused", () => {
  assert.throws(() => new QuantumCircuit(0), /1 to 10/);
  assert.throws(() => new QuantumCircuit(11), /1 to 10/);
  const circuit = new QuantumCircuit(2);
  assert.throws(() => circuit.apply({ type: "x", target: 2 }), /out of range/);
  assert.throws(() => circuit.apply({ type: "cnot", control: 0, target: 0 }), /must differ/);
  assert.throws(() => circuit.apply({ type: "rx", target: 0 }), /theta/);
  assert.throws(() => circuit.expectationZ(3), /out of range/);
  assert.throws(() => circuit.sample(0), /positive/);
});

test("INT-002 INT-003 INT-004 INT-005 INT-006 INT-007 INT-008 INT-009 tool registry plan working memory vector store agent pool delegate swarm checkpoint evaluation benchmark: the assistant runs the simulator through Athena's local model and audit trail", () => {
  const ledger = new EventLedger();
  const assistant = new QuantumAssistant({ ledger });
  const { simulation, run } = assistant.run(ACCOUNT, bellCircuit());
  assertClose(simulation.probabilities[0]!, 0.5);
  assertClose(simulation.probabilities[3]!, 0.5);
  assert.equal(run.modelId, "local/quantum");
  assert.equal(run.status, "complete");
  assert.equal(ledger.ofType("quantum.simulation.completed").length, 1);
  assert.equal(ledger.ofType("athena.run.completed").length, 1);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });
});

test("the assistant refuses an account without the member role", () => {
  const assistant = new QuantumAssistant();
  assert.throws(
    () => assistant.run({ ...ACCOUNT, roles: ["guest"] }, bellCircuit()),
    /permission denied/,
  );
});

test("the explanation is explicit that this is simulation, not hardware", () => {
  const assistant = new QuantumAssistant();
  assert.match(assistant.explanation(), /not a physical quantum computer/i);
  assert.match(assistant.explanation(), /statevector/i);
});
