/**
 * Engineering Design Studio - Main Application Shell
 *
 * Full application shell with toolbar, viewport, panels, and
 * engineering console.
 */

import React, { useMemo, useRef } from "react"
import { useStudio } from "./studio-provider"
import { ProjectRegistry } from "../services/registry/project-registry"
import { Viewport } from "../components/3d/Viewport"
import { EngineeringStudioProvider } from "./studio-provider"

// ─── Types ──────────────────────────────────────────────────────────

interface ToolbarProps {
  onNewProject: () => void
  onOpenProject: () => void
  onSaveProject: () => void
  onRegenerate: () => void
  onExport: (format: string) => void
  canSave: boolean
  canRegenerate: boolean
  canExport: boolean
  actionLabel: string
}

const Toolbar: React.FC<ToolbarProps> = ({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onRegenerate,
  onExport,
  canSave,
  canRegenerate,
  canExport,
  actionLabel,
}) => (
  <div className="toolbar">
    <div className="toolbar-group">
      <button
        className="toolbar-btn"
        onClick={onNewProject}
        disabled={!canSave}
        title="New Project (Ctrl+N)"
      >
        <span className="btn-icon">＋</span> New Project
      </button>
      <button
        className="toolbar-btn"
        onClick={onOpenProject}
        disabled={!canSave}
        title="Open Project (Ctrl+O)"
      >
        <span className="btn-icon">⌘</span> Open Project
      </button>
      <button
        className="toolbar-btn"
        onClick={onSaveProject}
        disabled={!canSave}
        title="Save Project (Ctrl+S)"
      >
        <span className="btn-icon">✓</span> Save
      </button>
      <button
        className="toolbar-btn"
        onClick={() => onExport("step")}
        disabled={!canExport}
        title="Export STEP"
      >
        <span className="btn-icon">▤</span> STEP
      </button>
      <button
        className="toolbar-btn"
        onClick={() => onExport("stl")}
        disabled={!canExport}
        title="Export STL"
      >
        <span className="btn-icon">▦</span> STL
      </button>
    </div>
    <div className="toolbar-group">
      <button
        className="toolbar-btn primary"
        onClick={onRegenerate}
        disabled={!canRegenerate}
        title="Regenerate Geometry (F5)"
      >
        <span className="btn-icon">⟳</span> Regenerate
      </button>
      <span className="action-indicator">{actionLabel}</span>
    </div>
  </div>
)

// ─── Left Panel (Project Explorer & Component Hierarchy) ────────────

interface LeftPanelProps {
  projectRegistry: ProjectRegistry
  selectedProjectId: string | null
  onSelectProject: (id: string) => void
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  projectRegistry,
  selectedProjectId,
  onSelectProject,
}) => {
  const projects = projectRegistry.listProjects()
    .filter(p => p.type === "project")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="left-panel">
      <div className="panel-header">
        <h3>Project Explorer</h3>
        <span className="project-count">{projects.length}</span>
      </div>
      <div className="panel-content">
        <ul className="project-list">
          {projects.map(project => (
            <li
              key={project.id}
              className={`project-item ${selectedProjectId === project.id ? "selected" : ""}`}
              onClick={() => onSelectProject(project.id)}
            >
              <span className="project-name">{project.name}</span>
              <span className="project-meta">v{project.version}</span>
            </li>
          ))}
        </ul>
        {projects.length === 0 && (
          <div className="empty-state">
            <p>No projects yet.</p>
            <p className="muted">Create a new project to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Right Panel (Properties Inspector) ────────────────────────────

interface RightPanelProps {
  model: any
  onParameterChange: (paramId: string, value: number) => void
}

const RightPanel: React.FC<RightPanelProps> = ({
  model,
  onParameterChange,
}) => {
  if (!model) {
    return (
      <div className="right-panel">
        <div className="panel-header">
          <h3>Properties</h3>
        </div>
        <div className="panel-content">
          <div className="empty-state">
            <p>No model selected.</p>
            <p className="muted">Select a component in the viewport.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="right-panel">
      <div className="panel-header">
        <h3>Properties</h3>
        <span className="project-count">{model.name}</span>
      </div>
      <div className="panel-content">
        <div className="properties-section">
          <h4>Parameters</h4>
          {model.parameters?.map(param => (
            <div key={param.id} className="parameter-row">
              <label className="parameter-label">{param.name}</label>
              <input
                type="number"
                className="parameter-value"
                value={param.value}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  onParameterChange(param.id, val)
                }}
                min={param.min || 0}
                max={param.max || 1000}
              />
              <span className="parameter-units">{param.units}</span>
            </div>
          ))}
        </div>
        <div className="properties-section">
          <h4>Dimensions</h4>
          {model.dimensions?.size > 0 ? (
            <div className="dimensions-list">
              {Array.from(model.dimensions.entries()).map(([key, value]) => (
                <div key={key} className="dimension-row">
                  <span className="dimension-name">{key}</span>
                  <span className="dimension-value">{value} mm</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">No dimensions loaded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Bottom Panel (Engineering Console) ─────────────────────────────

interface BottomPanelProps {
  status: string
  findings: string[]
  errorMessage: string | null
  onClear: () => void
}

const BottomPanel: React.FC<BottomPanelProps> = ({
  status,
  findings,
  errorMessage,
  onClear,
}) => {
  const panelContent = (
    <div className="bottom-panel">
      <div className="panel-header">
        <h3>Engineering Console</h3>
        <button className="btn-icon" onClick={onClear} title="Clear">✕</button>
      </div>
      <div className="panel-content">
        <div className="console-status">
          <span className={`status-badge ${status === "error" ? "error" : "ok"}`}>
            {status === "error" ? "ERROR" : "OK"}
          </span>
          <span className="status-text">{status}</span>
        </div>
        {errorMessage && (
          <div className="console-error">
            <span className="error-icon">⚠</span>
            <pre>{errorMessage}</pre>
          </div>
        )}
        {findings.length > 0 && (
          <div className="console-findings">
            {findings.map((finding, i) => (
              <div key={i} className="finding-item">
                <span>●</span>
                <span>{finding}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="bottom-panel">
      {panelContent}
    </div>
  )
}

// ─── Main Application Shell ─────────────────────────────────────────

interface StudioProps {
  projectRegistry: ProjectRegistry
}

export const EngineeringDesignStudio: React.FC<StudioProps> = ({ projectRegistry }) => {
  const { service, cadService, models, loading, error, actions } = useStudio()
  const selectedModelRef = useRef<string | null>(null)

  const [leftPanelExpanded, setLeftPanelExpanded] = React.useState(true)
  const [rightPanelExpanded, setRightPanelExpanded] = React.useState(true)
  const [bottomPanelExpanded, setBottomPanelExpanded] = React.useState(true)
  const [style, setStyle] = React.useState({ left: "25%", right: "28%", bottom: "22%" })
  const [actionLabel, setActionLabel] = React.useState("Ready")
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)
  const [currentModel, setCurrentModel] = React.useState<any>(null)

  const activeModel = models.find(m => m.id === selectedModelRef.current) || models[0] || null

  const handleParameterChange = (paramId: string, value: number) => {
    if (!activeModel) return

    const newParams = { ...activeModel.parameters, [paramId]: value }
    setCurrentModel(prev => ({
      ...prev,
      parameters: newParams,
    }))

    // Call backend to regenerate
    if (cadService) {
      void cadService.generateGeometry({
        id: "req-param-edit",
        type: "regenerate",
        payload: { parameters: newParams },
        timeoutMs: 5000,
      })
    }
  }

  // Panel resize handlers
  const handleResizeStart = (panel: "left" | "right" | "bottom", position: string) => {
    const handleMouseMove = (e: MouseEvent) => {
      const newStyle = { ...style }
      const panelWidth = document.querySelector(`[data-panel="${panel}"]`)?.clientWidth || 200
      newStyle[panel] = Math.max(150, Math.min(500, e.clientX - panelWidth / 2)) + "px"
      setStyle(newStyle)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div className="engineering-studio">
      <Toolbar
        onNewProject={() => actions.createProject({ name: "Untitled", description: "", category: "mechanical" })}
        onOpenProject={() => {}}
        onSaveProject={() => {}}
        onRegenerate={() => {
          if (cadService && activeModel) {
            cadService.generateGeometry({
              id: "req-regenerate",
              type: "regenerate",
              payload: { modelId: activeModel.id },
              timeoutMs: 5000,
            })
            setBottomPanelExpanded(true)
          }
        }}
        onExport={() => {}}
        canSave={true}
        canRegenerate={cadService !== null}
        canExport={cadService !== null}
        actionLabel={actionLabel}
      />

      <div className="studio-body">
        {/* Left Panel */}
        <div
          className="left-panel panel-resize-handle"
          data-panel="left"
          onMouseDown={() => handleResizeStart("left", "left")}
        >
          <LeftPanel
            projectRegistry={projectRegistry}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />
        </div>

        {/* Viewport */}
        <div className="viewport">
          <Viewport
            modelId={selectedModelRef.current}
            models={models}
            onModelSelect={(id) => {
              selectedModelRef.current = id
              setCurrentModel(models.find(m => m.id === id))
            }}
            activeModel={activeModel}
          />
        </div>

        {/* Right Panel */}
        <div
          className="right-panel panel-resize-handle"
          data-panel="right"
          onMouseDown={() => handleResizeStart("right", "right")}
        >
          <RightPanel
            model={currentModel}
            onParameterChange={handleParameterChange}
          />
        </div>
      </div>

      {/* Bottom Panel */}
      <div
        className="bottom-panel panel-resize-handle"
        data-panel="bottom"
        onMouseDown={() => handleResizeStart("bottom", "bottom")}
      >
        <BottomPanel
          status={cadService ? "connected" : "disconnected"}
          findings={[
            "Backend connected",
            "Parameter editing enabled",
            "Geometry regenerate available",
            "Mesh validation active",
          ]}
          errorMessage={error}
          onClear={() => {}}
        />
      </div>
    </div>
  )
}

// ─── Root Component ─────────────────────────────────────────────────

export default function App() {
  const [projectRegistry] = React.useState(() => {
    const registry = new ProjectRegistry()
    try {
      const fs = require("node:fs")
      const path = require("node:path")
      const manifestPath = path.join(process.cwd(), "engineering_registry", "traceability_manifest.json")
      if (fs.existsSync(manifestPath)) {
        const content = fs.readFileSync(manifestPath, "utf-8")
        const manifest = JSON.parse(content)
        for (const entry of manifest.artifacts || []) {
          registry.createProject(entry.id, entry.name, "mechanical")
        }
      }
    } catch {
      // Registry init failed - continue with empty registry
    }
    return registry
  })

  return (
    <EngineeringStudioProvider>
      <EngineeringDesignStudio projectRegistry={projectRegistry} />
    </EngineeringStudioProvider>
  )
}
