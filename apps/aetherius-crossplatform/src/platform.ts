import { createHash } from "node:crypto";

import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Cross-platform runtime slice.
 *
 * The Crossplatform---multiplatform repository held only a README and a
 * licence, so there is no recovered implementation to copy. This slice builds
 * the capability set the programme measured as missing: a small deterministic
 * kernel, a dependency-aware module system, capability isolation, a workspace
 * shell, extensions, layered configuration, telemetry and packaging.
 *
 * It is a host-neutral library, not an operating-system kernel. "Kernel" here
 * means the scheduler and lifecycle core of this runtime.
 */

export const PLATFORM_VERSION = "0.1.0";

/* ------------------------------------------------------------------ kernel */

export type KernelPhase = "off" | "booting" | "running" | "stopped";

export interface KernelTask {
  id: string;
  label: string;
  priority: number;
  sequence: number;
  run: (kernel: RuntimeKernel) => void;
}

export interface KernelRunResult {
  executed: string[];
  failures: { id: string; message: string }[];
  remaining: number;
}

export interface KernelSnapshot {
  phase: KernelPhase;
  queued: { id: string; label: string; priority: number }[];
  shutdownHooks: number;
}

/**
 * PLT-001: a deterministic cooperative scheduler.
 *
 * Lower priority numbers run first; equal priorities run in submission order.
 * A task may schedule more work. The step limit is mandatory so a runaway
 * task graph cannot hang the host.
 */
export class RuntimeKernel {
  private phase: KernelPhase = "off";
  private readonly tasks: KernelTask[] = [];
  private readonly shutdownHooks: (() => void)[] = [];
  private sequence = 0;
  private readonly telemetry: Telemetry | null;

  constructor(options: { telemetry?: Telemetry } = {}) {
    this.telemetry = options.telemetry ?? null;
  }

  get state(): KernelPhase {
    return this.phase;
  }

  boot(): void {
    if (this.phase !== "off" && this.phase !== "stopped") {
      throw new Error(`the kernel cannot boot from phase ${this.phase}`);
    }
    this.phase = "booting";
    this.telemetry?.log("info", "kernel.booting");
    this.phase = "running";
    this.telemetry?.log("info", "kernel.running");
  }

  onShutdown(hook: () => void): void {
    this.shutdownHooks.push(hook);
  }

  schedule(label: string, priority: number, run: (kernel: RuntimeKernel) => void): string {
    if (this.phase !== "running") throw new Error("the kernel is not running");
    if (!label.trim()) throw new Error("a task needs a label");
    if (!Number.isInteger(priority) || priority < 0) throw new Error("a task priority must be a non-negative integer");
    const task: KernelTask = {
      id: newId("tsk"),
      label: label.trim(),
      priority,
      sequence: this.sequence,
      run,
    };
    this.sequence += 1;
    this.tasks.push(task);
    return task.id;
  }

  run(limit = 1000): KernelRunResult {
    if (this.phase !== "running") throw new Error("the kernel is not running");
    if (!Number.isInteger(limit) || limit < 0) throw new Error("a run limit must be a non-negative integer");
    const executed: string[] = [];
    const failures: { id: string; message: string }[] = [];
    for (let step = 0; step < limit && this.tasks.length > 0; step += 1) {
      this.tasks.sort((a, b) => a.priority - b.priority || a.sequence - b.sequence);
      const task = this.tasks.shift()!;
      try {
        task.run(this);
        executed.push(task.id);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        failures.push({ id: task.id, message });
        this.telemetry?.log("error", "kernel.task.failed", { task: task.label, message });
      }
    }
    this.telemetry?.log("debug", "kernel.run", { executed: executed.length, failures: failures.length, remaining: this.tasks.length });
    return { executed, failures, remaining: this.tasks.length };
  }

  shutdown(): { hooks: number; failures: { hook: number; message: string }[] } {
    this.phase = "stopped";
    const failures: { hook: number; message: string }[] = [];
    for (let index = this.shutdownHooks.length - 1; index >= 0; index -= 1) {
      try {
        this.shutdownHooks[index]!();
      } catch (caught) {
        failures.push({ hook: index, message: caught instanceof Error ? caught.message : String(caught) });
      }
    }
    this.tasks.length = 0;
    this.telemetry?.log("info", "kernel.stopped", { hooks: this.shutdownHooks.length, failures: failures.length });
    return { hooks: this.shutdownHooks.length, failures };
  }

  snapshot(): KernelSnapshot {
    return {
      phase: this.phase,
      queued: this.tasks
        .slice()
        .sort((a, b) => a.priority - b.priority || a.sequence - b.sequence)
        .map((task) => ({ id: task.id, label: task.label, priority: task.priority })),
      shutdownHooks: this.shutdownHooks.length,
    };
  }
}

/* ----------------------------------------------------------------- sandbox */

const MODULE_ID = /^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)*$/;

/**
 * PLT-003: capability isolation.
 *
 * Nothing is granted implicitly. A module may touch its own resource namespace
 * (`moduleId/...`) without a grant; anything else needs an explicit capability.
 * This is an in-process policy boundary, not an OS sandbox.
 */
export class CapabilitySandbox {
  private readonly grants = new Map<string, Set<string>>();

  grant(moduleId: string, capabilities: readonly string[]): string[] {
    if (!MODULE_ID.test(moduleId)) throw new Error(`invalid module id: ${moduleId}`);
    const set = this.grants.get(moduleId) ?? new Set<string>();
    for (const capability of capabilities) {
      if (!capability.trim()) throw new Error("a capability cannot be empty");
      set.add(capability.trim());
    }
    this.grants.set(moduleId, set);
    return [...set].sort();
  }

  revoke(moduleId: string, capability?: string): void {
    if (capability === undefined) {
      this.grants.delete(moduleId);
      return;
    }
    this.grants.get(moduleId)?.delete(capability);
  }

  has(moduleId: string, capability: string): boolean {
    return this.grants.get(moduleId)?.has(capability) ?? false;
  }

  assert(moduleId: string, capability: string): void {
    if (!this.has(moduleId, capability)) {
      throw new Error(`capability denied: ${moduleId} -> ${capability}`);
    }
  }

  /**
   * Resource access is namespaced by module. A shared grant or an exact
   * `resource:<path>` grant is required to cross the namespace.
   */
  assertResource(moduleId: string, resource: string): void {
    if (!resource.trim() || resource.startsWith("/") || resource.includes("..")) {
      throw new Error(`invalid resource path: ${resource}`);
    }
    if (resource.startsWith(`${moduleId}/`)) return;
    if (this.has(moduleId, "resource:shared")) return;
    if (this.has(moduleId, `resource:${resource}`)) return;
    throw new Error(`resource denied: ${moduleId} -> ${resource}`);
  }

  grantsFor(moduleId: string): string[] {
    return [...(this.grants.get(moduleId) ?? new Set<string>())].sort();
  }
}

/* ----------------------------------------------------------------- modules */

export type ModuleState = "registered" | "starting" | "started" | "stopping" | "stopped" | "failed";

export interface ModuleContext {
  moduleId: string;
  sandbox: CapabilitySandbox;
  telemetry: Telemetry | null;
}

export interface ModuleDefinition {
  id: string;
  version: string;
  dependencies: string[];
  capabilities: string[];
  start?: (context: ModuleContext) => void;
  stop?: () => void;
}

/**
 * PLT-002: dependency-aware module registry with lifecycle and rollback.
 */
export class ModuleRegistry {
  private readonly definitions = new Map<string, ModuleDefinition>();
  private readonly states = new Map<string, ModuleState>();
  private startOrder: string[] = [];
  private readonly sandbox: CapabilitySandbox;
  private readonly telemetry: Telemetry | null;

  constructor(options: { sandbox?: CapabilitySandbox; telemetry?: Telemetry } = {}) {
    this.sandbox = options.sandbox ?? new CapabilitySandbox();
    this.telemetry = options.telemetry ?? null;
  }

  register(definition: ModuleDefinition): void {
    if (!MODULE_ID.test(definition.id)) throw new Error(`invalid module id: ${definition.id}`);
    if (!definition.version.trim()) throw new Error(`module ${definition.id} needs a version`);
    if (this.definitions.has(definition.id)) throw new Error(`module is already registered: ${definition.id}`);
    if (new Set(definition.dependencies).size !== definition.dependencies.length) {
      throw new Error(`module ${definition.id} lists a dependency twice`);
    }
    if (definition.dependencies.includes(definition.id)) {
      throw new Error(`module ${definition.id} cannot depend on itself`);
    }
    this.definitions.set(definition.id, {
      ...definition,
      dependencies: [...definition.dependencies],
      capabilities: [...definition.capabilities],
    });
    this.states.set(definition.id, "registered");
  }

  state(moduleId: string): ModuleState {
    const state = this.states.get(moduleId);
    if (!state) throw new Error(`no module: ${moduleId}`);
    return state;
  }

  order(): string[] {
    return this.topologicalOrder();
  }

  list(): { id: string; version: string; state: ModuleState; dependencies: string[]; capabilities: string[] }[] {
    return [...this.definitions.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((definition) => ({
        id: definition.id,
        version: definition.version,
        state: this.states.get(definition.id)!,
        dependencies: [...definition.dependencies],
        capabilities: [...definition.capabilities],
      }));
  }

  startAll(): { order: string[]; started: string[] } {
    const order = this.topologicalOrder();
    const started: string[] = [];
    for (const moduleId of order) {
      if (this.states.get(moduleId) === "started") continue;
      const definition = this.definitions.get(moduleId)!;
      this.states.set(moduleId, "starting");
      this.sandbox.grant(moduleId, definition.capabilities);
      try {
        definition.start?.({
          moduleId,
          sandbox: this.sandbox,
          telemetry: this.telemetry,
        });
        this.states.set(moduleId, "started");
        started.push(moduleId);
        this.telemetry?.log("info", "module.started", { module: moduleId, version: definition.version });
      } catch (caught) {
        this.states.set(moduleId, "failed");
        this.telemetry?.log("error", "module.start.failed", {
          module: moduleId,
          message: caught instanceof Error ? caught.message : String(caught),
        });
        this.rollback(started);
        throw new Error(`module ${moduleId} failed to start: ${caught instanceof Error ? caught.message : String(caught)}`);
      }
    }
    this.startOrder = started;
    return { order, started };
  }

  stopAll(): { stopped: string[]; failures: { module: string; message: string }[] } {
    const stopped: string[] = [];
    const failures: { module: string; message: string }[] = [];
    for (const moduleId of [...this.startOrder].reverse()) {
      const definition = this.definitions.get(moduleId);
      if (!definition || this.states.get(moduleId) !== "started") continue;
      this.states.set(moduleId, "stopping");
      try {
        definition.stop?.();
        this.states.set(moduleId, "stopped");
        stopped.push(moduleId);
        this.telemetry?.log("info", "module.stopped", { module: moduleId });
      } catch (caught) {
        this.states.set(moduleId, "failed");
        failures.push({ module: moduleId, message: caught instanceof Error ? caught.message : String(caught) });
      }
      this.sandbox.revoke(moduleId);
    }
    this.startOrder = [];
    return { stopped, failures };
  }

  private rollback(started: readonly string[]): void {
    for (const moduleId of [...started].reverse()) {
      const definition = this.definitions.get(moduleId);
      try {
        definition?.stop?.();
      } catch {
        // Rollback is best effort; the original start failure is the error
        // the caller needs to see.
      }
      this.states.set(moduleId, "stopped");
      this.sandbox.revoke(moduleId);
    }
  }

  private topologicalOrder(): string[] {
    const remaining = new Map<string, Set<string>>();
    for (const definition of this.definitions.values()) {
      for (const dependency of definition.dependencies) {
        if (!this.definitions.has(dependency)) {
          throw new Error(`module ${definition.id} depends on missing module ${dependency}`);
        }
      }
      remaining.set(definition.id, new Set(definition.dependencies));
    }
    const order: string[] = [];
    while (remaining.size > 0) {
      const ready = [...remaining.entries()]
        .filter(([, dependencies]) => dependencies.size === 0)
        .map(([id]) => id)
        .sort();
      if (ready.length === 0) {
        throw new Error(`module dependency cycle: ${[...remaining.keys()].sort().join(", ")}`);
      }
      for (const moduleId of ready) {
        order.push(moduleId);
        remaining.delete(moduleId);
        for (const dependencies of remaining.values()) dependencies.delete(moduleId);
      }
    }
    return order;
  }
}

/* --------------------------------------------------------------- workspace */

export type PanelRegion = "left" | "center" | "right" | "bottom";

export interface Panel {
  id: string;
  title: string;
  region: PanelRegion;
  size: number;
  visible: boolean;
  order: number;
}

export interface WorkspaceSnapshot {
  panels: Panel[];
  activeId: string | null;
}

const REGIONS: readonly PanelRegion[] = ["left", "center", "right", "bottom"];
const MIN_PANEL = 120;
const MAX_PANEL = 1200;

/**
 * PLT-004: the host-neutral workspace shell model.
 *
 * A renderer maps regions and panels onto native or web surfaces. This slice
 * owns the layout state, ordering and persistence, not the pixels.
 */
export class WorkspaceLayout {
  private panels: Panel[] = [];
  private activeId: string | null = null;

  constructor(panels: readonly Panel[] = []) {
    for (const panel of panels) this.addPanel(panel);
  }

  addPanel(input: { id: string; title: string; region: PanelRegion; size?: number; visible?: boolean; order?: number }): Panel {
    if (!MODULE_ID.test(input.id)) throw new Error(`invalid panel id: ${input.id}`);
    if (this.panels.some((panel) => panel.id === input.id)) throw new Error(`panel already exists: ${input.id}`);
    if (!input.title.trim()) throw new Error("a panel needs a title");
    if (!REGIONS.includes(input.region)) throw new Error(`unknown panel region: ${input.region}`);
    const panel: Panel = {
      id: input.id,
      title: input.title.trim(),
      region: input.region,
      size: clampSize(input.size ?? 320),
      visible: input.visible ?? true,
      order: input.order ?? this.nextOrder(input.region),
    };
    this.panels.push(panel);
    this.activeId ??= panel.id;
    return { ...panel };
  }

  removePanel(panelId: string): void {
    const before = this.panels.length;
    this.panels = this.panels.filter((panel) => panel.id !== panelId);
    if (this.panels.length === before) throw new Error(`no panel: ${panelId}`);
    if (this.activeId === panelId) this.activeId = this.panels[0]?.id ?? null;
  }

  movePanel(panelId: string, region: PanelRegion, order?: number): Panel {
    if (!REGIONS.includes(region)) throw new Error(`unknown panel region: ${region}`);
    const panel = this.requirePanel(panelId);
    panel.region = region;
    panel.order = order ?? this.nextOrder(region);
    return { ...panel };
  }

  resizePanel(panelId: string, size: number): Panel {
    const panel = this.requirePanel(panelId);
    panel.size = clampSize(size);
    return { ...panel };
  }

  togglePanel(panelId: string): Panel {
    const panel = this.requirePanel(panelId);
    panel.visible = !panel.visible;
    if (!panel.visible && this.activeId === panelId) {
      this.activeId = this.panels.find((candidate) => candidate.visible)?.id ?? null;
    }
    return { ...panel };
  }

  activate(panelId: string): void {
    const panel = this.requirePanel(panelId);
    if (!panel.visible) throw new Error(`panel is hidden: ${panelId}`);
    this.activeId = panelId;
  }

  get active(): string | null {
    return this.activeId;
  }

  list(region?: PanelRegion): Panel[] {
    return this.panels
      .filter((panel) => region === undefined || panel.region === region)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
      .map((panel) => ({ ...panel }));
  }

  snapshot(): WorkspaceSnapshot {
    return { panels: this.list(), activeId: this.activeId };
  }

  static restore(input: string | WorkspaceSnapshot): WorkspaceLayout {
    const parsed = typeof input === "string" ? (JSON.parse(input) as unknown) : input;
    if (!parsed || typeof parsed !== "object") throw new Error("a workspace snapshot must be an object");
    const snapshot = parsed as Partial<WorkspaceSnapshot>;
    if (!Array.isArray(snapshot.panels)) throw new Error("a workspace snapshot needs panels");
    if (snapshot.activeId !== null && typeof snapshot.activeId !== "string") {
      throw new Error("a workspace snapshot has an invalid active panel");
    }
    const layout = new WorkspaceLayout();
    for (const panel of snapshot.panels) {
      if (!panel || typeof panel !== "object") throw new Error("a workspace snapshot has an invalid panel");
      const candidate = panel as Panel;
      layout.addPanel({
        id: candidate.id,
        title: candidate.title,
        region: candidate.region,
        size: candidate.size,
        visible: candidate.visible,
        order: candidate.order,
      });
    }
    if (snapshot.activeId !== null && !layout.panels.some((panel) => panel.id === snapshot.activeId)) {
      throw new Error(`the active panel does not exist: ${snapshot.activeId}`);
    }
    layout.activeId = snapshot.activeId ?? null;
    return layout;
  }

  private requirePanel(panelId: string): Panel {
    const panel = this.panels.find((candidate) => candidate.id === panelId);
    if (!panel) throw new Error(`no panel: ${panelId}`);
    return panel;
  }

  private nextOrder(region: PanelRegion): number {
    const orders = this.panels.filter((panel) => panel.region === region).map((panel) => panel.order);
    return orders.length === 0 ? 0 : Math.max(...orders) + 1;
  }
}

function clampSize(size: number): number {
  if (!Number.isFinite(size)) throw new Error("a panel size must be a finite number");
  return Math.round(Math.min(MAX_PANEL, Math.max(MIN_PANEL, size)));
}

/* -------------------------------------------------------------- extensions */

export interface CommandContribution {
  id: string;
  title: string;
  run: (args: Record<string, unknown>) => unknown;
}

export interface PanelContribution {
  id: string;
  title: string;
  region: PanelRegion;
  size?: number;
}

export interface ExtensionDefinition {
  id: string;
  name: string;
  version: string;
  commands?: CommandContribution[];
  panels?: PanelContribution[];
}

export interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  commands: string[];
  panels: string[];
}

/**
 * PLT-005: contribution-point registry.
 *
 * An extension declares commands and panels. Enabling it contributes them;
 * disabling it withdraws exactly its own contributions and nothing else.
 */
export class ExtensionRegistry {
  private readonly definitions = new Map<string, ExtensionDefinition>();
  private readonly enabled = new Set<string>();
  private readonly reservedCommands = new Map<string, string>();
  private readonly reservedPanels = new Map<string, string>();
  private readonly commandOwners = new Map<string, string>();
  private readonly panelOwners = new Map<string, string>();
  private readonly workspace: WorkspaceLayout;
  private readonly telemetry: Telemetry | null;

  constructor(workspace: WorkspaceLayout, options: { telemetry?: Telemetry } = {}) {
    this.workspace = workspace;
    this.telemetry = options.telemetry ?? null;
  }

  install(definition: ExtensionDefinition): void {
    if (!MODULE_ID.test(definition.id)) throw new Error(`invalid extension id: ${definition.id}`);
    if (!definition.name.trim() || !definition.version.trim()) throw new Error("an extension needs a name and a version");
    if (this.definitions.has(definition.id)) throw new Error(`extension is already installed: ${definition.id}`);
    const commands = definition.commands ?? [];
    const panels = definition.panels ?? [];
    if (new Set(commands.map((command) => command.id)).size !== commands.length) {
      throw new Error(`extension ${definition.id} declares a command twice`);
    }
    if (new Set(panels.map((panel) => panel.id)).size !== panels.length) {
      throw new Error(`extension ${definition.id} declares a panel twice`);
    }
    for (const command of commands) {
      if (this.reservedCommands.has(command.id)) throw new Error(`command is already contributed: ${command.id}`);
      if (!command.id.trim() || !command.title.trim()) throw new Error("a command needs an id and a title");
    }
    for (const panel of panels) {
      if (this.reservedPanels.has(panel.id) || this.workspace.list().some((candidate) => candidate.id === panel.id)) {
        throw new Error(`panel is already contributed: ${panel.id}`);
      }
    }
    for (const command of commands) this.reservedCommands.set(command.id, definition.id);
    for (const panel of panels) this.reservedPanels.set(panel.id, definition.id);
    this.definitions.set(definition.id, {
      ...definition,
      commands: [...commands],
      panels: [...panels],
    });
  }

  enable(extensionId: string): void {
    const definition = this.require(extensionId);
    if (this.enabled.has(extensionId)) return;
    for (const command of definition.commands ?? []) this.commandOwners.set(command.id, extensionId);
    for (const panel of definition.panels ?? []) {
      this.workspace.addPanel({ id: panel.id, title: panel.title, region: panel.region, size: panel.size });
      this.panelOwners.set(panel.id, extensionId);
    }
    this.enabled.add(extensionId);
    this.telemetry?.log("info", "extension.enabled", { extension: extensionId });
  }

  disable(extensionId: string): void {
    const definition = this.require(extensionId);
    if (!this.enabled.has(extensionId)) return;
    for (const command of definition.commands ?? []) {
      if (this.commandOwners.get(command.id) === extensionId) this.commandOwners.delete(command.id);
    }
    for (const panel of definition.panels ?? []) {
      if (this.panelOwners.get(panel.id) === extensionId) {
        this.panelOwners.delete(panel.id);
        if (this.workspace.list().some((candidate) => candidate.id === panel.id)) {
          this.workspace.removePanel(panel.id);
        }
      }
    }
    this.enabled.delete(extensionId);
    this.telemetry?.log("info", "extension.disabled", { extension: extensionId });
  }

  execute(commandId: string, args: Record<string, unknown> = {}): unknown {
    const owner = this.commandOwners.get(commandId);
    if (!owner) throw new Error(`no enabled command: ${commandId}`);
    const definition = this.definitions.get(owner)!;
    const command = definition.commands!.find((candidate) => candidate.id === commandId)!;
    return command.run(args);
  }

  list(): ExtensionInfo[] {
    return [...this.definitions.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((definition) => ({
        id: definition.id,
        name: definition.name,
        version: definition.version,
        enabled: this.enabled.has(definition.id),
        commands: (definition.commands ?? []).map((command) => command.id),
        panels: (definition.panels ?? []).map((panel) => panel.id),
      }));
  }

  private require(extensionId: string): ExtensionDefinition {
    const definition = this.definitions.get(extensionId);
    if (!definition) throw new Error(`no extension: ${extensionId}`);
    return definition;
  }
}

/* ------------------------------------------------------------------ config */

export type ConfigPrimitive = string | number | boolean;
export type ConfigType = "string" | "number" | "boolean";
export type ConfigLayer = "defaults" | "profile" | "user" | "flags";

export interface ConfigField {
  key: string;
  type: ConfigType;
  required?: boolean;
  default?: ConfigPrimitive;
  enum?: ConfigPrimitive[];
  secret?: boolean;
}

const LAYERS: readonly ConfigLayer[] = ["defaults", "profile", "user", "flags"];

/**
 * PLT-006: layered configuration with provenance and redaction.
 *
 * Precedence is defaults < profile < user < flags. Unknown keys are refused
 * rather than silently stored, so a typo in a flag cannot look accepted.
 */
export class ConfigService {
  private readonly fields = new Map<string, ConfigField>();
  private readonly values = new Map<ConfigLayer, Map<string, ConfigPrimitive>>();
  private readonly telemetry: Telemetry | null;

  constructor(fields: readonly ConfigField[], options: { telemetry?: Telemetry } = {}) {
    this.telemetry = options.telemetry ?? null;
    for (const field of fields) {
      if (!/^[a-z][a-z0-9_.-]*$/.test(field.key)) throw new Error(`invalid config key: ${field.key}`);
      if (this.fields.has(field.key)) throw new Error(`config key is declared twice: ${field.key}`);
      if (field.default !== undefined) this.checkValue(field, field.default);
      this.fields.set(field.key, { ...field, enum: field.enum ? [...field.enum] : undefined });
    }
    for (const layer of LAYERS) this.values.set(layer, new Map());
    const defaults = new Map<string, ConfigPrimitive>();
    for (const field of this.fields.values()) {
      if (field.default !== undefined) defaults.set(field.key, field.default);
    }
    this.values.set("defaults", defaults);
  }

  setLayer(layer: ConfigLayer, values: Record<string, ConfigPrimitive>): void {
    if (!LAYERS.includes(layer)) throw new Error(`unknown config layer: ${layer}`);
    const target = this.values.get(layer)!;
    for (const [key, value] of Object.entries(values)) {
      const field = this.fields.get(key);
      if (!field) throw new Error(`unknown config key: ${key}`);
      this.checkValue(field, value);
      target.set(key, value);
    }
    this.telemetry?.log("debug", "config.layer.set", { layer, keys: Object.keys(values).sort() });
  }

  get(key: string): { value: ConfigPrimitive; layer: ConfigLayer } | undefined {
    if (!this.fields.has(key)) throw new Error(`unknown config key: ${key}`);
    for (const layer of [...LAYERS].reverse()) {
      const value = this.values.get(layer)!.get(key);
      if (value !== undefined) return { value, layer };
    }
    return undefined;
  }

  require(key: string): ConfigPrimitive {
    const found = this.get(key);
    if (!found) throw new Error(`required config value is missing: ${key}`);
    return found.value;
  }

  provenance(key: string): ConfigLayer | null {
    return this.get(key)?.layer ?? null;
  }

  all(): Record<string, ConfigPrimitive> {
    const result: Record<string, ConfigPrimitive> = {};
    for (const key of [...this.fields.keys()].sort()) {
      const found = this.get(key);
      if (found) result[key] = found.value;
    }
    return result;
  }

  validate(): { ok: boolean; missing: string[] } {
    const missing = [...this.fields.values()]
      .filter((field) => field.required && this.get(field.key) === undefined)
      .map((field) => field.key)
      .sort();
    return { ok: missing.length === 0, missing };
  }

  /** Coerce a CLI string according to the declared field type. */
  parse(key: string, raw: string): ConfigPrimitive {
    const field = this.fields.get(key);
    if (!field) throw new Error(`unknown config key: ${key}`);
    if (field.type === "string") return raw;
    if (field.type === "number") {
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`config ${key} expects a number`);
      return value;
    }
    if (raw === "true" || raw === "1") return true;
    if (raw === "false" || raw === "0") return false;
    throw new Error(`config ${key} expects a boolean`);
  }

  toJSON(options: { redactSecrets?: boolean } = {}): Record<string, ConfigPrimitive> {
    const redact = options.redactSecrets ?? true;
    const result: Record<string, ConfigPrimitive> = {};
    for (const [key, field] of [...this.fields.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const found = this.get(key);
      if (!found) continue;
      result[key] = redact && field.secret ? "[redacted]" : found.value;
    }
    return result;
  }

  private checkValue(field: ConfigField, value: ConfigPrimitive): void {
    if (typeof value !== field.type) {
      throw new Error(`config ${field.key} expects ${field.type}`);
    }
    if (field.enum && !field.enum.includes(value)) {
      throw new Error(`config ${field.key} must be one of: ${field.enum.join(", ")}`);
    }
  }
}

/* --------------------------------------------------------------- telemetry */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type SpanStatus = "ok" | "error";

export interface LogEntry {
  id: string;
  at: string;
  level: LogLevel;
  message: string;
  fields: Record<string, unknown>;
  traceId: string | null;
}

export interface Span {
  id: string;
  traceId: string;
  name: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
  status: SpanStatus | null;
  fields: Record<string, unknown>;
}

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * PLT-007: logs, spans, counters and gauges in one inspectable snapshot.
 * Error logs and failed spans are appended to the shared audit chain.
 */
export class Telemetry {
  private readonly logs: LogEntry[] = [];
  private readonly spans: Span[] = [];
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();
  private readonly capacity: number;
  private minLevel: LogLevel;
  private readonly ledger: EventLedger | null;
  private readonly clock: () => Date;

  constructor(options: {
    capacity?: number;
    level?: LogLevel;
    ledger?: EventLedger;
    clock?: () => Date;
  } = {}) {
    this.capacity = options.capacity ?? 1000;
    if (!Number.isInteger(this.capacity) || this.capacity < 1) throw new Error("telemetry capacity must be positive");
    this.minLevel = options.level ?? "info";
    this.ledger = options.ledger ?? null;
    this.clock = options.clock ?? (() => new Date());
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  log(level: LogLevel, message: string, fields: Record<string, unknown> = {}, traceId: string | null = null): LogEntry | null {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) return null;
    if (!message.trim()) throw new Error("a log message cannot be empty");
    const entry: LogEntry = {
      id: newId("log"),
      at: nowIso(this.clock),
      level,
      message: message.trim(),
      fields: structuredClone(fields),
      traceId,
    };
    this.logs.push(entry);
    if (this.logs.length > this.capacity) this.logs.splice(0, this.logs.length - this.capacity);
    if (level === "error") this.audit("telemetry.log.error", { message: entry.message, fields: entry.fields });
    return structuredClone(entry);
  }

  startSpan(name: string, fields: Record<string, unknown> = {}): Span {
    if (!name.trim()) throw new Error("a span needs a name");
    const span: Span = {
      id: newId("spn"),
      traceId: newId("trc"),
      name: name.trim(),
      startedAt: this.clock().getTime(),
      endedAt: null,
      durationMs: null,
      status: null,
      fields: structuredClone(fields),
    };
    this.spans.push(span);
    return structuredClone(span);
  }

  endSpan(span: Span, status: SpanStatus = "ok"): Span {
    const stored = this.spans.find((candidate) => candidate.id === span.id);
    if (!stored) throw new Error(`no span: ${span.id}`);
    if (stored.endedAt !== null) throw new Error(`span is already ended: ${span.id}`);
    stored.endedAt = this.clock().getTime();
    stored.durationMs = Math.max(0, stored.endedAt - stored.startedAt);
    stored.status = status;
    if (status === "error") this.audit("telemetry.span.error", { span: stored.name, durationMs: stored.durationMs });
    return structuredClone(stored);
  }

  counter(name: string, delta = 1): number {
    if (!name.trim()) throw new Error("a counter needs a name");
    if (!Number.isFinite(delta)) throw new Error("a counter delta must be finite");
    const value = (this.counters.get(name) ?? 0) + delta;
    this.counters.set(name, value);
    return value;
  }

  gauge(name: string, value: number): void {
    if (!name.trim()) throw new Error("a gauge needs a name");
    if (!Number.isFinite(value)) throw new Error("a gauge value must be finite");
    this.gauges.set(name, value);
  }

  snapshot(): {
    logs: LogEntry[];
    spans: Span[];
    counters: Record<string, number>;
    gauges: Record<string, number>;
  } {
    return {
      logs: this.logs.map((entry) => structuredClone(entry)),
      spans: this.spans.map((span) => structuredClone(span)),
      counters: Object.fromEntries([...this.counters.entries()].sort(([a], [b]) => a.localeCompare(b))),
      gauges: Object.fromEntries([...this.gauges.entries()].sort(([a], [b]) => a.localeCompare(b))),
    };
  }

  private audit(type: string, data: Record<string, unknown>): void {
    this.ledger?.append({ type, actor: "telemetry", subject: "platform", data });
  }
}

/* --------------------------------------------------------------- packaging */

export interface Artifact {
  path: string;
  sha256: string;
  bytes: number;
}

export type ReleaseChannel = "dev" | "beta" | "stable";

export interface PackageManifest {
  id: string;
  name: string;
  version: string;
  channel: ReleaseChannel;
  artifacts: Artifact[];
  builtAt: string;
  testsPassed: boolean;
  notes: string[];
}

export interface PackageCheck {
  ok: boolean;
  reasons: string[];
  digest: string;
}

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;

/**
 * PLT-008: release manifest creation and verification.
 *
 * A stable release is refused when the caller cannot assert that the tests
 * passed. The manifest digest is a canonical SHA-256 over the manifest body.
 */
export class Packager {
  create(input: Omit<PackageManifest, "builtAt" | "notes"> & { builtAt?: string; notes?: string[] }): PackageManifest {
    if (!MODULE_ID.test(input.id)) throw new Error(`invalid package id: ${input.id}`);
    if (!input.name.trim()) throw new Error("a package needs a name");
    if (!SEMVER.test(input.version)) throw new Error(`package version is not semver: ${input.version}`);
    if (!["dev", "beta", "stable"].includes(input.channel)) throw new Error(`unknown release channel: ${input.channel}`);
    if (input.artifacts.length === 0) throw new Error("a package needs at least one artifact");
    const paths = new Set<string>();
    for (const artifact of input.artifacts) {
      if (!artifact.path.trim() || artifact.path.startsWith("/") || artifact.path.includes("..")) {
        throw new Error(`invalid artifact path: ${artifact.path}`);
      }
      if (paths.has(artifact.path)) throw new Error(`artifact path is listed twice: ${artifact.path}`);
      paths.add(artifact.path);
      if (!/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error(`artifact digest is not SHA-256: ${artifact.path}`);
      if (!Number.isSafeInteger(artifact.bytes) || artifact.bytes <= 0) throw new Error(`artifact size is invalid: ${artifact.path}`);
    }
    if (input.channel === "stable" && !input.testsPassed) {
      throw new Error("a stable release requires passing tests");
    }
    const builtAt = input.builtAt ?? new Date().toISOString();
    if (Number.isNaN(Date.parse(builtAt))) throw new Error(`package build time is invalid: ${builtAt}`);
    return {
      id: input.id,
      name: input.name.trim(),
      version: input.version,
      channel: input.channel,
      artifacts: input.artifacts.map((artifact) => ({ ...artifact })),
      builtAt,
      testsPassed: input.testsPassed,
      notes: [...(input.notes ?? [])],
    };
  }

  digest(manifest: PackageManifest): string {
    return createHash("sha256").update(canonical(manifest)).digest("hex");
  }

  verify(manifest: PackageManifest): PackageCheck {
    const reasons: string[] = [];
    if (!SEMVER.test(manifest.version)) reasons.push("version is not semver");
    if (manifest.artifacts.length === 0) reasons.push("there are no artifacts");
    if (manifest.channel === "stable" && !manifest.testsPassed) reasons.push("a stable release requires passing tests");
    const paths = new Set<string>();
    for (const artifact of manifest.artifacts) {
      if (paths.has(artifact.path)) reasons.push(`duplicate artifact path: ${artifact.path}`);
      paths.add(artifact.path);
      if (!/^[a-f0-9]{64}$/.test(artifact.sha256)) reasons.push(`invalid digest: ${artifact.path}`);
    }
    if (Number.isNaN(Date.parse(manifest.builtAt))) reasons.push("build time is invalid");
    return { ok: reasons.length === 0, reasons, digest: this.digest(manifest) };
  }
}

export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}

export * from "./bridge.ts";
