/**
 * Aetherius Engineering Design Studio - Domain Core
 *
 * Core domain types and services for the first-party Engineering Design Studio.
 * Self-contained - no external framework dependencies required.
 */

// ─── Types ─────────────────────────────────────────────────────────────

export type CategoryId =
  | "mechanical"
  | "electrical"
  | "electronics"
  | "civil"
  | "architectural"
  | "industrial"
  | "robotics"
  | "scientific"
  | "manufacturing"
  | "future"

export interface Dimension {
  id: string
  name: string
  value: number
  units: string
  min: number
  max: number
  step: number
}

export interface Material {
  id: string
  name: string
  density: number
  youngsModulus: number
  yieldStrength: number
  thermalConductivity: number
  description: string
}

export interface DesignParameter {
  id: string
  name: string
  value: number
  units: string
  min?: number
  max?: number
  step?: number
  description: string
  category: CategoryId
}

export interface ParametricModel {
  id: string
  name: string
  description: string
  category: CategoryId
  source: "cadquery" | "freecad" | "openscad" | "blender" | "manual"
  parameters: DesignParameter[]
  defaultMaterialId: string
  dimensions: Map<string, number>
  createdAt: string
  updatedAt: string
  revision: number
}

export interface DesignRevision {
  id: string
  parentId: string | null
  model: ParametricModel
  createdBy: string
  timestamp: string
  metadata: Record<string, unknown>
}

// ─── Registry ──────────────────────────────────────────────────────────

export interface RegistryEntry {
  id: string
  type: "project" | "document" | "component" | "assembly" | "artifact"
  name: string
  category: CategoryId
  createdAt: string
  updatedAt: string
  version: number
  metadata: Record<string, unknown>
}

export class DesignRegistry {
  private entries = new Map<string, RegistryEntry>()

  create(entry: Omit<RegistryEntry, "createdAt" | "updatedAt" | "version">): RegistryEntry {
    const now = new Date().toISOString()
    const id = "reg-" + Math.random().toString(36).slice(2, 10)
    const revEntry: RegistryEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.entries.set(id, revEntry)
    return revEntry
  }

  update(id: string, updates: Partial<RegistryEntry>): RegistryEntry | null {
    const entry = this.entries.get(id)
    if (!entry) return null
    const updated = { ...entry, ...updates, updatedAt: new Date().toISOString() }
    this.entries.set(id, updated)
    return updated
  }

  get(id: string): RegistryEntry | undefined {
    return this.entries.get(id)
  }

  list(): RegistryEntry[] {
    return Array.from(this.entries.values())
  }

  delete(id: string): boolean {
    return this.entries.delete(id)
  }

  hash(filePath: string): string {
    let hash = 0
    for (let i = 0; i < filePath.length; i++) {
      const char = filePath.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return "sha256-" + Math.abs(hash).toString(16) + "-" + filePath
  }
}

// ─── Feature History ──────────────────────────────────────────────────

export interface Feature {
  id: string
  name: string
  type:
    | "extrude"
    | "cut"
    | "hole"
    | "boolean_union"
    | "boolean_difference"
    | "translate"
    | "rotate"
    | "scale"
    | "mirror"
    | "pattern"
    | "sketch"
    | "constrain"
  parameters: Record<string, unknown>
  createdAt: string
  updatedAt: string
  productId: string
}

export class FeatureHistory {
  private features = new Map<string, Feature>()
  private productHistory = new Map<string, string[]>()

  add(productId: string, feature: Omit<Feature, "id" | "createdAt" | "updatedAt">): Feature {
    const now = new Date().toISOString()
    const id = "feat-" + Math.random().toString(36).slice(2, 10)
    const f: Feature = { ...feature, id, createdAt: now, updatedAt: now, productId }
    this.features.set(id, f)
    const history = this.productHistory.get(productId) ?? []
    history.push(id)
    this.productHistory.set(productId, history)
    return f
  }

  get(productId: string): Feature[] {
    const history = this.productHistory.get(productId) ?? []
    return history.map((id) => this.features.get(id)).filter((f): f is Feature => f !== undefined)
  }

  undo(productId: string): Feature | null {
    const history = this.productHistory.get(productId)
    if (!history || history.length === 0) return null
    const id = history.pop() as string | undefined
    const feature = id ? this.features.get(id) : null
    if (feature) {
      this.features.delete(id as string)
      this.productHistory.set(productId, history)
    }
    return feature ?? null
  }
}

// ─── Assembly ─────────────────────────────────────────────────────────

export interface Joint {
  id: string
  type: "fixed" | "revolute" | "prismatic" | "cylindrical"
  parentId: string
  childId: string
  localTransform: number[][]
  globalTransform: number[][]
  movementLimit?: { min: number; max: number; unit: string }
  parameters: Record<string, unknown>
  createdAt: string
}

export interface AssemblyComponent {
  id: string
  name: string
  partId: string
  localTransform: number[][]
  globalTransform: number[][]
  visible: boolean
  solid: boolean
  parent: string | null
  children: string[]
}

export class Assembly {
  private components = new Map<string, AssemblyComponent>()
  private joints = new Map<string, Joint>()
  private rootId: string | null = null

  addComponent(component: Omit<AssemblyComponent, "id" | "globalTransform">): AssemblyComponent {
    const id = "comp-" + Math.random().toString(36).slice(2, 10)
    const localTransform = component.localTransform.map((row) => [...row])
    const globalTransform = component.localTransform.map((row) => [...row])
    const comp: AssemblyComponent = {
      ...component,
      id,
      localTransform,
      globalTransform,
      parent: null,
      children: [],
    }
    this.components.set(id, comp)
    if (this.rootId === null) this.rootId = id
    return comp
  }

  addJoint(joint: Omit<Joint, "id" | "createdAt">): Joint {
    const id = "joint-" + Math.random().toString(36).slice(2, 10)
    const j: Joint = { ...joint, id, createdAt: new Date().toISOString() }
    this.joints.set(id, j)
    return j
  }

  setRoot(id: string): void {
    if (this.components.has(id)) this.rootId = id
  }

  getRoot(): AssemblyComponent | null {
    return this.rootId != null ? this.components.get(this.rootId) ?? null : null
  }

  getComponent(id: string): AssemblyComponent | undefined {
    return this.components.get(id)
  }

  listComponents(): AssemblyComponent[] {
    return Array.from(this.components.values())
  }

  updateComponentVisibility(id: string, visible: boolean): boolean {
    const comp = this.components.get(id)
    if (!comp) return false
    comp.visible = visible
    return true
  }

  serialize(): Record<string, unknown> {
    return {
      rootId: this.rootId,
      components: Array.from(this.components.values()).map((c) => ({
        id: c.id,
        name: c.name,
        partId: c.partId,
        localTransform: c.localTransform,
        globalTransform: c.globalTransform,
        visible: c.visible,
        solid: c.solid,
        parent: c.parent,
        children: c.children,
      })),
      joints: Array.from(this.joints.values()).map((j) => ({
        id: j.id,
        type: j.type,
        parentId: j.parentId,
        childId: j.childId,
        localTransform: j.localTransform,
        globalTransform: j.globalTransform,
        movementLimit: j.movementLimit,
        parameters: j.parameters,
      })),
    }
  }
}

// ─── Project ──────────────────────────────────────────────────────────

export interface ProjectMetadata {
  id: string
  name: string
  description: string
  category: CategoryId
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  status?: "draft" | "in_progress" | "review" | "completed" | "archived"
  tags?: string[]
}

export class EngineeringProject {
  private revisions = new Map<string, DesignRevision>()
  private currentRevisionId: string | null = null
  private metadata: ProjectMetadata

  constructor(metadata: Omit<ProjectMetadata, "createdAt">) {
    this.metadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  createRevision(model: ParametricModel): DesignRevision {
    const rev: DesignRevision = {
      id: "rev-" + Math.random().toString(36).slice(2, 10),
      parentId: this.currentRevisionId,
      model,
      createdBy: "user",
      timestamp: new Date().toISOString(),
      metadata: {},
    }
    this.revisions.set(rev.id, rev)
    this.currentRevisionId = rev.id
    this.metadata.updatedAt = new Date().toISOString()
    return rev
  }

  getCurrentRevision(): DesignRevision | null {
    return this.currentRevisionId != null ? this.revisions.get(this.currentRevisionId) ?? null : null
  }

  listRevisions(): DesignRevision[] {
    return Array.from(this.revisions.values())
  }

  getMetadata(): ProjectMetadata {
    return this.metadata
  }

  setMetadata(metadata: Partial<ProjectMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata, updatedAt: new Date().toISOString() }
  }

  export(): Record<string, unknown> {
    return {
      metadata: this.metadata,
      revisions: Array.from(this.revisions.values()).map((r) => ({
        id: r.id,
        parentId: r.parentId,
        model: r.model,
        createdBy: r.createdBy,
        timestamp: r.timestamp,
        metadata: r.metadata,
      })),
      currentRevisionId: this.currentRevisionId,
    }
  }
}

// ─── Service ───────────────────────────────────────────────────────────

export class EngineeringStudioService {
  readonly registry: DesignRegistry
  readonly featureHistory: FeatureHistory
  readonly assembly: Assembly
  private projects = new Map<string, EngineeringProject>()
  private models = new Map<string, ParametricModel>()

  constructor() {
    this.registry = new DesignRegistry()
    this.featureHistory = new FeatureHistory()
    this.assembly = new Assembly()
    this.assembly.setRoot("root")
  }

  createProject(metadata: Omit<ProjectMetadata, "createdAt">): EngineeringProject {
    const project = new EngineeringProject(metadata)
    const id = project.getMetadata().id
    this.projects.set(id, project)
    this.registry.create({ id, type: "project", name: metadata.name, category: metadata.category, metadata: {} })
    return project
  }

  getProject(id: string): EngineeringProject | undefined {
    return this.projects.get(id)
  }

  listProjects(): EngineeringProject[] {
    return Array.from(this.projects.values())
  }

  addModel(model: Omit<ParametricModel, "id" | "createdAt" | "updatedAt" | "revision">): ParametricModel {
    const now = new Date().toISOString()
    const id = "model-" + Math.random().toString(36).slice(2, 10)
    const m: ParametricModel = {
      ...model,
      id,
      createdAt: now,
      updatedAt: now,
      revision: 1,
    }
    this.models.set(id, m)
    this.registry.create({ id, type: "component", name: m.name, category: m.category, metadata: {} })
    return m
  }

  getModel(id: string): ParametricModel | undefined {
    return this.models.get(id)
  }

  listModels(): ParametricModel[] {
    return Array.from(this.models.values())
  }
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createDefaultStudio(): EngineeringStudioService {
  const service = new EngineeringStudioService()
  const aluminum = {
    id: "mat-aluminum",
    name: "Aluminum 6061",
    density: 2.7,
    youngsModulus: 68.9e9,
    yieldStrength: 276,
    thermalConductivity: 167.2,
    description: "Lightweight aluminum alloy",
  } as Material
  const steel = {
    id: "mat-steel",
    name: "Steel AISI 1045",
    density: 7.85,
    youngsModulus: 205e9,
    yieldStrength: 380,
    thermalConductivity: 50.2,
    description: "Medium-carbon steel",
  } as Material
  const plastic = {
    id: "mat-plastic",
    name: "PLA Plus",
    density: 1.27,
    youngsModulus: 3.5e9,
    yieldStrength: 50,
    thermalConductivity: 0.3,
    description: "3D printing PLA",
  } as Material
  service.registry.create({
    id: "mat-aluminum",
    type: "artifact",
    name: "Aluminum 6061",
    category: "mechanical",
    metadata: { density: 2.7, youngsModulus: 68.9e9, yieldStrength: 276 },
  })
  service.registry.create({
    id: "mat-steel",
    type: "artifact",
    name: "Steel AISI 1045",
    category: "mechanical",
    metadata: { density: 7.85, youngsModulus: 205e9, yieldStrength: 380 },
  })
  service.registry.create({
    id: "mat-plastic",
    type: "artifact",
    name: "PLA Plus",
    category: "manufacturing",
    metadata: { density: 1.27, youngsModulus: 3.5e9, yieldStrength: 50 },
  })
  return service
}
