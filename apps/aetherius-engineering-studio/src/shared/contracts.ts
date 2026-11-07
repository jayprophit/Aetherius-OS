/**
 * Aetherius Engineering Design Studio - Shared Contracts
 *
 * Reusable typed interfaces for:
 * - Engineering projects
 * - Design parameters
 * - CAD generation requests
 * - CAD generation results
 * - Geometry-validation results
 * - Artifact references
 * - Revisions
 * - Errors and task states
 *
 * Keep shared code compatible with both browser and backend environments.
 */

// ─── Categories ─────────────────────────────────────────────────────────

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
  | "future";

// ─── Core Value Types ───────────────────────────────────────────────────

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
  geometry?: ModelGeometry
}

export interface ModelGeometry {
  faces: number
  vertices: number
  edges: number
  volume: number
  bounds: { min: number[]; max: number[] }
}

export interface DesignRevision {
  id: string
  parentId: string | null
  model: ParametricModel
  createdBy: string
  timestamp: string
  metadata: Record<string, unknown>
}

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

// ─── Assembly Types ─────────────────────────────────────────────────────

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

export interface Assembly {
  rootId: string | null
  components: AssemblyComponent[]
  joints: Joint[]
}

// ─── Engineering Project ────────────────────────────────────────────────

export interface EngineeringProject {
  id: string
  name: string
  description: string
  category: CategoryId
  createdBy: string
  updatedBy: string
  updatedAt: string
  status: "draft" | "review" | "queued" | "completed" | "archived"
  tags: string[]
  metadata: Record<string, unknown>
  models: ParametricModel[]
  revisions: DesignRevision[]
  createdAt: string
  workspacePath: string
}

// ─── CAD Backend Request/Responses ─────────────────────────────────────

export interface BackendRequest {
  id: string
  type:
    | "get_model"
    | "create_model"
    | "regenerate"
    | "export_step"
    | "export_stl"
    | "validate"
    | "list_parts"
    | "parameters"
    | "version"
    | "health"
  payload?: any
  timeoutMs?: number
  options?: {
    keepSource?: boolean
    outputDir?: string
    format?: string
  }
}

export interface BackendResponse {
  id: string
  success: boolean
  data?: any
  error?: string
  timestamp: string
}

export interface CadQueryResult {
  success: boolean
  geometry?: {
    faces: number
    vertices: number
    edges: number
    volume: number
    bounds: { min: number[]; max: number[] }
  }
  parameters?: Record<string, any>
  source?: string
  errors?: string[]
}

export interface ValidationResult {
  valid: boolean
  faces: number
  volume: number
  bounds: { min: number[]; max: number[] } | null
  watertight: boolean
  errors?: string[]
}

export interface ArtifactReference {
  id: string
  name: string
  type: "stl" | "step" | "gcode" | "json" | "scad"
  path: string
  sizeBytes: number
  sha256: string
  createdAt: string
}

export interface RevisionEntry {
  id: string
  parentId: string | null
  modelId: string
  modelName: string
  createdBy: string
  timestamp: string
  parameters: Record<string, unknown>
  artifactIds: string[]
}

// ─── Error and Task States ───────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(public field: string, public message: string, public code: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export interface TaskState {
  id: string
  type: "design" | "regenerate" | "validate" | "export" | "import" | "eval"
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  message?: string
  error?: string
  timestamp: string
}

export interface BackendError {
  code: string
  message: string
  details?: Record<string, unknown>
}
