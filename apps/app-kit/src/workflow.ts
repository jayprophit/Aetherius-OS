import type { EventLedger } from "./ledger.ts";
import { newId, nowIso } from "./ids.ts";
import type { Repository } from "./store.ts";

export interface WorkflowDefinition {
  name: string;
  initial: string;
  /** state -> the states it may move to. */
  transitions: Record<string, string[]>;
  /** "from>to" -> roles, one of which must approve the move. Empty means any actor. */
  requiredRoles?: Record<string, string[]>;
}

export interface WorkflowStep {
  from: string;
  to: string;
  actor: string;
  note: string;
  at: string;
}

export interface WorkflowInstance {
  id: string;
  definition: string;
  subject: string;
  state: string;
  history: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ActorContext {
  id: string;
  roles: readonly string[];
}

/**
 * A small state machine with an approval gate and a recorded history.
 *
 * A transition that is not declared by the definition is refused. A
 * transition that names required roles is refused unless the actor holds one
 * of them. The history is append-only, so "who approved this" has an answer.
 */
export class WorkflowService {
  private readonly definitions = new Map<string, WorkflowDefinition>();
  private readonly instances: Repository<WorkflowInstance>;
  private readonly ledger?: EventLedger;
  private readonly clock: () => Date;

  constructor(
    definitions: readonly WorkflowDefinition[],
    instances: Repository<WorkflowInstance>,
    options: { ledger?: EventLedger; clock?: () => Date } = {},
  ) {
    for (const definition of definitions) this.define(definition);
    this.instances = instances;
    this.ledger = options.ledger;
    this.clock = options.clock ?? (() => new Date());
  }

  define(definition: WorkflowDefinition): void {
    if (!definition.name.trim()) throw new Error("workflow has no name");
    if (!(definition.initial in definition.transitions)) {
      throw new Error(`workflow ${definition.name} has no transitions from its initial state`);
    }
    // A state with no outgoing transitions is terminal, so a target does not
    // have to appear as a key. The runtime transition check is authoritative.
    this.definitions.set(definition.name, structuredClone(definition));
  }

  start(definitionName: string, subject: string, actor: ActorContext): WorkflowInstance {
    const definition = this.requireDefinition(definitionName);
    if (!subject.trim()) throw new Error("workflow subject is empty");
    const at = nowIso(this.clock);
    const instance: WorkflowInstance = {
      id: newId("wfl"),
      definition: definition.name,
      subject,
      state: definition.initial,
      history: [],
      createdAt: at,
      updatedAt: at,
    };
    this.instances.put(instance);
    this.ledger?.append({
      type: "workflow.started",
      actor: actor.id,
      subject: instance.id,
      data: { definition: definition.name, state: instance.state, workSubject: subject },
    });
    return structuredClone(instance);
  }

  get(id: string): WorkflowInstance | undefined {
    const instance = this.instances.get(id);
    return instance ? structuredClone(instance) : undefined;
  }

  transition(id: string, to: string, actor: ActorContext, note = ""): WorkflowInstance {
    const instance = this.require(id);
    const definition = this.requireDefinition(instance.definition);
    const targets = definition.transitions[instance.state] ?? [];
    if (!targets.includes(to)) {
      throw new Error(`workflow ${definition.name} cannot move ${instance.state} -> ${to}`);
    }
    const required = definition.requiredRoles?.[`${instance.state}>${to}`] ?? [];
    if (required.length > 0 && !required.some((role) => actor.roles.includes(role))) {
      throw new Error(`transition ${instance.state} -> ${to} requires one of: ${required.join(", ")}`);
    }
    const at = nowIso(this.clock);
    instance.history.push({ from: instance.state, to, actor: actor.id, note: note.trim(), at });
    instance.state = to;
    instance.updatedAt = at;
    this.instances.put(instance);
    this.ledger?.append({
      type: "workflow.transitioned",
      actor: actor.id,
      subject: id,
      data: { from: instance.history.at(-1)!.from, to, note: note.trim() },
    });
    return structuredClone(instance);
  }

  private require(id: string): WorkflowInstance {
    const instance = this.instances.get(id);
    if (!instance) throw new Error(`no workflow instance: ${id}`);
    return structuredClone(instance);
  }

  private requireDefinition(name: string): WorkflowDefinition {
    const definition = this.definitions.get(name);
    if (!definition) throw new Error(`unknown workflow: ${name}`);
    return definition;
  }
}


