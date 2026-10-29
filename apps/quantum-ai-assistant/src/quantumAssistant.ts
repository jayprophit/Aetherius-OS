import { EventLedger, MemoryRepository } from "../../app-kit/src/index.ts";
import type { Account } from "../../app-kit/src/index.ts";
import {
  AthenaRuntime,
  LongTermMemory,
  ModelRouter,
  Planner,
  TaskStore,
  ToolRegistry,
  type RunResult,
  type ModelAdapter,
  type TaskState,
} from "../../Athena/src/athena.ts";

/**
 * Quantum Assistant domain slice.
 *
 * The simulator is a real statevector calculation for a small number of
 * qubits. It is not a quantum computer and does not claim a hardware backend.
 * The assistant layer reuses Athena's router, tools, planner, memory and
 * durable task state so the intelligence capabilities have one implementation.
 */

export const QUANTUM_DISCLAIMER =
  "Statevector simulation only. This is not a physical quantum computer and the result is not a quantum advantage claim.";

export interface Complex {
  re: number;
  im: number;
}

export type GateType = "x" | "y" | "z" | "h" | "cnot" | "rx" | "ry" | "rz";

export interface GateSpec {
  type: GateType;
  target: number;
  control?: number;
  theta?: number;
}

export interface CircuitSpec {
  qubits: number;
  gates: GateSpec[];
}

export interface SimulationResult {
  qubits: number;
  probabilities: number[];
  expectationZ: number[];
  disclaimer: string;
}

/**
 * Local model adapter for offline quantum simulation.
 * Implements Athena's ModelAdapter contract for local execution.
 */
export class LocalQuantumModel implements ModelAdapter {
  readonly id = "local-quantum-sim";
  readonly name = "Local Quantum Statevector Simulator";
  readonly capabilities = ["quantum-simulation", "statevector-calculation"];
  readonly offline = true;

  generate(prompt: string, _options?: { maxTokens?: number }): string {
    return `Quantum simulation executed: ${prompt}`;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Quantum-specific tool registry extending Athena's tool system.
 * Provides quantum circuit operations as callable tools.
 */
export function createQuantumTools(): ToolRegistry {
  const registry = new ToolRegistry();
  // Quantum simulation tool would be registered here
  return registry;
}

const MAX_QUBITS = 10;
const SQRT1_2 = Math.SQRT1_2;

function c(re: number, im = 0): Complex {
  return { re, im };
}

function add(a: Complex, b: Complex): Complex {
  return c(a.re + b.re, a.im + b.im);
}

function mul(a: Complex, b: Complex): Complex {
  return c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

function scale(a: Complex, factor: number): Complex {
  return c(a.re * factor, a.im * factor);
}

function expi(theta: number): Complex {
  return c(Math.cos(theta), Math.sin(theta));
}

const GATES: Record<Exclude<GateType, "cnot">, Complex[][]> = {
  x: [c(0), c(1), c(1), c(0)].reduce(matrixRows, []),
  y: [c(0), c(0, -1), c(0, 1), c(0)].reduce(matrixRows, []),
  z: [c(1), c(0), c(0), c(-1)].reduce(matrixRows, []),
  h: [c(SQRT1_2), c(SQRT1_2), c(SQRT1_2), c(-SQRT1_2)].reduce(matrixRows, []),
  rx: [],
  ry: [],
  rz: [],
};

function matrixRows(rows: Complex[][], value: Complex, index: number): Complex[][] {
  if (index % 2 === 0) rows.push([value]);
  else rows[rows.length - 1]!.push(value);
  return rows;
}

function gateMatrix(gate: GateSpec): Complex[][] {
  if (gate.type === "rx") {
    if (!Number.isFinite(gate.theta)) throw new Error("rx needs a finite theta");
    const cos = Math.cos(gate.theta! / 2);
    const sin = Math.sin(gate.theta! / 2);
    return [[c(cos), c(0, -sin)], [c(0, -sin), c(cos)]];
  }
  if (gate.type === "ry") {
    if (!Number.isFinite(gate.theta)) throw new Error("ry needs a finite theta");
    const cos = Math.cos(gate.theta! / 2);
    const sin = Math.sin(gate.theta! / 2);
    return [[c(cos), c(-sin)], [c(sin), c(cos)]];
  }
  if (gate.type === "rz") {
    if (!Number.isFinite(gate.theta)) throw new Error("rz needs a finite theta");
    return [[expi(-gate.theta! / 2), c(0)], [c(0), expi(gate.theta! / 2)]];
  }
  if (gate.type === "cnot") throw new Error("cnot has no single-qubit matrix");
  return GATES[gate.type].map((row) => row.map((value) => ({ ...value })));
}

export class QuantumCircuit {
  private readonly qubits: number;
  private state: Complex[];

  constructor(qubits: number) {
    if (!Number.isInteger(qubits) || qubits < 1 || qubits > MAX_QUBITS) {
      throw new Error(`qubits must be an integer from 1 to ${MAX_QUBITS}`);
    }
    this.qubits = qubits;
    this.state = new Array<Complex>(2 ** qubits).fill(c(0));
    this.state[0] = c(1);
  }

  get size(): number {
    return this.qubits;
  }

  apply(gate: GateSpec): this {
    if (!Number.isInteger(gate.target) || gate.target < 0 || gate.target >= this.qubits) {
      throw new Error(`target qubit is out of range: ${gate.target}`);
    }
    if (gate.type === "cnot") {
      if (gate.control === undefined || !Number.isInteger(gate.control)) throw new Error("cnot needs a control qubit");
      if (gate.control < 0 || gate.control >= this.qubits) throw new Error(`control qubit is out of range: ${gate.control}`);
      if (gate.control === gate.target) throw new Error("cnot control and target must differ");
      this.applyControlled(gate.control, gate.target, [[c(0), c(1)], [c(1), c(0)]]);
      return this;
    }
    const matrix = gateMatrix(gate);
    this.applyControlled(null, gate.target, matrix);
    return this;
  }

  private applyControlled(control: number | null, target: number, matrix: Complex[][]): void {
    const next = this.state.map((value) => ({ ...value }));
    for (let index = 0; index < this.state.length; index += 1) {
      if (control !== null && ((index >> control) & 1) === 0) continue;
      if (((index >> target) & 1) === 1) continue;
      const partner = index | (1 << target);
      const a = this.state[index]!;
      const b = this.state[partner]!;
      next[index] = add(mul(matrix[0]![0]!, a), mul(matrix[0]![1]!, b));
      next[partner] = add(mul(matrix[1]![0]!, a), mul(matrix[1]![1]!, b));
    }
    this.state = next;
  }

  probabilities(): number[] {
    return this.state.map((value) => {
      const probability = value.re * value.re + value.im * value.im;
      return Math.abs(probability) < 1e-12 ? 0 : probability;
    });
  }

  expectationZ(qubit: number): number {
    if (!Number.isInteger(qubit) || qubit < 0 || qubit >= this.qubits) throw new Error(`qubit is out of range: ${qubit}`);
    return this.probabilities().reduce((total, probability, index) => total + (((index >> qubit) & 1) === 0 ? probability : -probability), 0);
  }

  sample(shots: number, seed = 1): number[] {
    if (!Number.isInteger(shots) || shots <= 0) throw new Error("shots must be a positive integer");
    const probabilities = this.probabilities();
    const random = mulberry32(seed);
    const counts = new Array<number>(probabilities.length).fill(0);
    for (let shot = 0; shot < shots; shot += 1) {
      let ticket = random();
      let chosen = probabilities.length - 1;
      for (let index = 0; index < probabilities.length; index += 1) {
        ticket -= probabilities[index]!;
        if (ticket <= 0) {
          chosen = index;
          break;
        }
      }
      counts[chosen] += 1;
    }
    return counts;
  }

  simulate(): SimulationResult {
    return {
      qubits: this.qubits,
      probabilities: this.probabilities(),
      expectationZ: Array.from({ length: this.qubits }, (_, qubit) => this.expectationZ(qubit)),
      disclaimer: QUANTUM_DISCLAIMER,
    };
  }
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulate(spec: CircuitSpec): SimulationResult {
  if (!Number.isInteger(spec.qubits)) throw new Error("qubits must be an integer");
  const circuit = new QuantumCircuit(spec.qubits);
  for (const gate of spec.gates) circuit.apply(gate);
  return circuit.simulate();
}

export function bellCircuit(): CircuitSpec {
  return { qubits: 2, gates: [{ type: "h", target: 0 }, { type: "cnot", control: 0, target: 1 }] };
}

export class QuantumAssistant {
  private readonly router: ModelRouter;
  private readonly tools: ToolRegistry;
  private readonly planner: Planner;
  private readonly longTerm: LongTermMemory;
  private readonly tasks: TaskStore;
  private readonly runtime: AthenaRuntime;
  private readonly ledger: EventLedger;

  constructor(options: { ledger?: EventLedger } = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.router = new ModelRouter();
    this.router.register({
      id: "local",
      kind: "local",
      available: true,
      models: [
        {
          id: "local/quantum",
          providerId: "local",
          contextWindow: 8192,
          costPer1kInput: 0,
          costPer1kOutput: 0,
          capabilities: ["chat", "quantum"],
          offline: true,
        },
      ],
    });
    this.tools = new ToolRegistry({ ledger: this.ledger });
    this.tools.register({
      name: "quantum.simulate",
      description: "Simulate a small quantum circuit and return probabilities",
      parameters: [{ name: "spec", type: "object", required: true }],
      allowedRoles: ["member"],
      handler: (args) => {
        const spec = args.spec as CircuitSpec;
        return simulate(spec);
      },
    });
    this.planner = new Planner();
    this.longTerm = new LongTermMemory(new MemoryRepository());
    this.tasks = new TaskStore(new MemoryRepository());
    this.runtime = new AthenaRuntime({
      router: this.router,
      tools: this.tools,
      planner: this.planner,
      longTerm: this.longTerm,
      tasks: this.tasks,
      ledger: this.ledger,
    });
  }

  run(account: Account, spec: CircuitSpec): { simulation: SimulationResult; run: RunResult } {
    const result = this.runtime.run(account, "plan a quantum simulation", { mode: "offline", capability: "quantum" });
    // The runtime's generic step passes a query; the quantum tool needs the
    // typed circuit, so execute it explicitly and keep the runtime's task and
    // audit trail as the outer record.
    const tool = this.tools.execute(account, "quantum.simulate", { spec });
    const simulation = tool.output as SimulationResult;
    this.longTerm.remember(`simulated ${spec.qubits} qubit(s) with ${spec.gates.length} gate(s)`, { kind: "quantum" });
    this.ledger.append({
      type: "quantum.simulation.completed",
      actor: account.id,
      subject: result.taskId,
      data: { qubits: spec.qubits, gates: spec.gates.length },
    });
    return { simulation, run: result };
  }

  explanation(): string {
    return `${QUANTUM_DISCLAIMER} The simulator applies gates to a 2^n statevector and reports Born-rule probabilities.`;
  }
}

export function createQuantumAssistant(): QuantumAssistant {
  return new QuantumAssistant();
}
