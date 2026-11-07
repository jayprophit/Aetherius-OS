/**
 * Engineering Studio Provider
 *
 * Provides the Engineering Studio service and CAD backend connection
 * to all components via React context.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { EngineeringStudioService, EngineeringProject, ParametricModel } from "../domain"
import { EngineeringService } from "../backend/cad-service.ts"

// ─── Types ──────────────────────────────────────────────────────────

export interface StudioState {
  service: EngineeringStudioService
  cadService: EngineeringService | null
  projects: Map<string, EngineeringProject>
  models: ParametricModel[]
  currentProjectId: string | null
  loading: boolean
  error: string | null
  actions: {
    createProject: (metadata: { name: string; description: string; category: string }) => EngineeringProject
    loadModel: (modelId: string) => ParametricModel | undefined
    addPart: (part: any) => any
    listParts: () => any[]
  }
  cadBackendStatus: "disconnected" | "connecting" | "connected" | "error"
}

// ─── Default State ─────────────────────────────────────────────────

const defaultState: StudioState = {
  service: new EngineeringStudioService(),
  cadService: null,
  projects: new Map(),
  models: [],
  currentProjectId: null,
  loading: false,
  error: null,
  actions: {
    createProject: () => new EngineeringStudioService().createProject({ id: "proj-1", name: "New Project", description: "Default project", category: "mechanical", createdBy: "user", updatedBy: "user", updatedAt: new Date().toISOString(), status: "draft", tags: [] }),
    loadModel: () => undefined,
    addPart: (p) => p,
    listParts: () => [],
  },
  cadBackendStatus: "disconnected",
}

// ─── Context ────────────────────────────────────────────────────────

const StudioContext = createContext<StudioState>(defaultState)

// ─── Provider ───────────────────────────────────────────────────────

interface StudioProviderProps {
  children: ReactNode
  initialProjects?: EngineeringProject[]
}

export function EngineeringStudioProvider({ children, initialProjects = [] }: StudioProviderProps) {
  const [state, setState] = useState<StudioState>({
    ...defaultState,
    models: [],
    cadBackendStatus: "disconnected",
  })

  useEffect(() => {
    let isMounted = true

    async function initialize() {
      try {
        setState(prev => ({ ...prev, loading: true }))

        // Initialize CAD backend service
        const cadService = new EngineeringService()
        await cadService.connect()

        // Add default models from the engineering workspace
        const defaultModels: ParametricModel[] = [
          {
            id: "model-bracket-v1",
            name: "Parametric Bracket",
            description: "Mounting bracket with four mounting holes",
            category: "mechanical",
            source: "cadquery",
            parameters: [
              { id: "dim-width", name: "Width", value: 150, units: "mm", min: 50, max: 300, step: 1, description: "Bracket width", category: "mechanical" },
              { id: "dim-depth", name: "Depth", value: 75, units: "mm", min: 25, max: 150, step: 1, description: "Bracket depth", category: "mechanical" },
              { id: "dim-height", name: "Height", value: 10, units: "mm", min: 5, max: 20, step: 0.5, description: "Bracket height", category: "mechanical" },
              { id: "dim-hole-diameter", name: "Hole Diameter", value: 4.0, units: "mm", min: 2, max: 10, step: 0.1, description: "Mounting hole diameter", category: "mechanical" },
              { id: "dim-hole-count", name: "Hole Count", value: 4, units: "count", min: 0, max: 12, step: 1, description: "Number of mounting holes", category: "mechanical" },
            ],
            defaultMaterialId: "mat-aluminum",
            dimensions: new Map([["width", 150], ["depth", 75], ["height", 10]]),
            createdAt: "2026-11-04T20:00:00Z",
            updatedAt: "2026-11-05T00:00:00Z",
            revision: 1,
          },
          {
            id: "model-plate-v1",
            name: "Mounting Plate",
            description: "Flat mounting plate with mounting holes",
            category: "mechanical",
            source: "cadquery",
            parameters: [
              { id: "dim-length", name: "Length", value: 100, units: "mm", min: 50, max: 200, step: 1, description: "Plate length", category: "mechanical" },
              { id: "dim-width", name: "Width", value: 100, units: "mm", min: 50, max: 200, step: 1, description: "Plate width", category: "mechanical" },
              { id: "dim-thickness", name: "Thickness", value: 5, units: "mm", min: 2, max: 10, step: 0.1, description: "Plate thickness", category: "mechanical" },
              { id: "dim-hole-diameter", name: "Hole Diameter", value: 3.0, units: "mm", min: 2, max: 8, step: 0.1, description: "Mounting hole diameter", category: "mechanical" },
              { id: "dim-hole-count", name: "Hole Count", value: 4, units: "count", min: 0, max: 8, step: 1, description: "Number of mounting holes", category: "mechanical" },
            ],
            defaultMaterialId: "mat-aluminum",
            dimensions: new Map([["length", 100], ["width", 100], ["thickness", 5]]),
            createdAt: "2026-11-04T20:30:00Z",
            updatedAt: "2026-11-05T00:00:00Z",
            revision: 1,
          },
          {
            id: "model-enclosure-v1",
            name: "Electronics Enclosure",
            description: "Simple electronics enclosure with wall thickness",
            category: "mechanical",
            source: "cadquery",
            parameters: [
              { id: "dim-length", name: "Length", value: 80, units: "mm", min: 40, max: 160, step: 1, description: "Enclosure length", category: "mechanical" },
              { id: "dim-width", name: "Width", value: 60, units: "mm", min: 30, max: 120, step: 1, description: "Enclosure width", category: "mechanical" },
              { id: "dim-height", name: "Height", value: 40, units: "mm", min: 20, max: 80, step: 1, description: "Enclosure height", category: "mechanical" },
              { id: "dim-wall-thickness", name: "Wall Thickness", value: 3, units: "mm", min: 1, max: 5, step: 0.5, description: "Wall thickness", category: "mechanical" },
            ],
            defaultMaterialId: "mat-plastic",
            dimensions: new Map([["length", 80], ["width", 60], ["height", 40], ["wall-thickness", 3]]),
            createdAt: "2026-11-04T20:40:00Z",
            updatedAt: "2026-11-05T00:00:00Z",
            revision: 1,
          },
        ]

        if (isMounted) {
          setState(prev => ({
            ...prev,
            service: new EngineeringStudioService(),
            cadService: cadService,
            models: defaultModels,
            cadBackendStatus: "connected",
            loading: false,
          }))
        }

        // Load existing projects if any
        await loadProjects()

        if (isMounted) {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (err) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : "Failed to initialize",
            loading: false,
          }))
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [])

  // Helper to load projects from disk
  async function loadProjects() {
    try {
      const fs = require("node:fs")
      const path = require("node:path")

      const projectDir = path.join(process.cwd(), "projects")
      if (fs.existsSync(projectDir)) {
        const files = fs.readdirSync(projectDir).filter(f => f.endsWith(".json"))
        for (const file of files) {
          const content = fs.readFileSync(path.join(projectDir, file), "utf-8")
          const projectData = JSON.parse(content) as EngineeringProject
          // Use the data's id if available, otherwise fall back to parsed id
          const id = (projectData as any).id || "proj-default"
          state.projects.set(id, projectData)
        }
      }
    } catch (err) {
      // No projects directory or parse error - ignore
    }
  }

  // Actions
  function createProject(metadata: { name: string; description: string; category: string }) {
    const project = state.service.createProject({
      id: "proj-" + Math.random().toString(36).slice(2, 10),
      name: metadata.name,
      description: metadata.description,
      category: metadata.category as any,
      createdBy: "user",
      updatedBy: "user",
      updatedAt: new Date().toISOString(),
      status: "draft",
      tags: [],
    })
    const newProjects = new Map(state.projects)
    newProjects.set(project.getMetadata().id, project)
    setState(prev => ({ ...prev, projects: newProjects }))
    return project
  }

  function loadModel(modelId: string) {
    const model = state.service.getModel(modelId)
    return model
  }

  function addPart(part: any) {
    const cadService = state.cadService
    if (!cadService) throw new Error("CAD service not connected")
    return cadService.addPart(part)
  }

  function listParts() {
    const cadService = state.cadService
    if (!cadService) return []
    // listParts is synchronous in this mock implementation
    // The real implementation would fetch from the backend
    return [] as any[]
  }

  const value: StudioState = {
    ...state,
    actions: {
      createProject,
      loadModel,
      addPart,
      listParts,
    },
    cadBackendStatus: state.cadService ? "connected" : "disconnected",
  }

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useStudio() {
  const context = useContext(StudioContext)
  if (!context) {
    throw new Error("useStudio must be used within EngineeringStudioProvider")
  }
  return context
}
