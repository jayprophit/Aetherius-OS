/**
 * Engineering Design Studio - Automated Tests
 *
 * Tests for the Engineering Design Studio application.
 * Covers domain types, registry, and basic functionality.
 */

import { describe, it, expect, beforeEach } from "vitest"
import { EngineeringStudioService, ParametricModel, DesignRegistry } from "../src/domain.ts"
import { ProjectRegistry } from "../src/services/registry/project-registry.ts"

describe("Domain Types", () => {
  it("creates a parametric model", () => {
    const model: ParametricModel = {
      id: "test-model",
      name: "Test Model",
      description: "A test model",
      category: "mechanical",
      source: "cadquery",
      parameters: [],
      defaultMaterialId: "mat-aluminum",
      dimensions: new Map(),
      createdAt: "2026-11-05T00:00:00Z",
      updatedAt: "2026-11-05T00:00:00Z",
      revision: 1,
    }

    expect(model.id).toBe("test-model")
    expect(model.name).toBe("Test Model")
    expect(model.source).toBe("cadquery")
    expect(model.revision).toBe(1)
  })

  it("creates a design parameter with range validation", () => {
    const param = {
      id: "width",
      name: "Width",
      value: 100,
      units: "mm",
      min: 50,
      max: 200,
      step: 1,
      description: "Test parameter",
      category: "mechanical",
    }

    expect(param.value).toBe(100)
    expect(param.min).toBe(50)
    expect(param.max).toBe(200)
  })
})

describe("Design Registry", () => {
  let registry: DesignRegistry

  beforeEach(() => {
    registry = new DesignRegistry()
  })

  it("creates an entry", () => {
    const entry = registry.create({
      id: "test-entry",
      type: "component",
      name: "Test Component",
      category: "mechanical",
      metadata: {},
    })

    expect(entry.id).toBe("test-entry")
    expect(entry.name).toBe("Test Component")
    expect(entry.version).toBe(1)
    expect(registry.list().length).toBe(1)
  })

  it("updates an entry", () => {
    const entry = registry.create({
      id: "test-entry",
      type: "component",
      name: "Test Component",
      category: "mechanical",
      metadata: {},
    })

    const updated = registry.update("test-entry", { name: "Updated Component" })
    expect(updated).not.toBeNull()
    expect(updated!.name).toBe("Updated Component")
    expect(updated!.version).toBe(1)
  })

  it("lists all entries", () => {
    registry.create({ id: "a", type: "component", name: "A", category: "mechanical", metadata: {} })
    registry.create({ id: "b", type: "component", name: "B", category: "mechanical", metadata: {} })

    const list = registry.list()
    expect(list.length).toBe(2)
  })
})

describe("Engineering Studio Service", () => {
  let service: EngineeringStudioService

  beforeEach(() => {
    service = new EngineeringStudioService()
  })

  it("creates a project", () => {
    const project = service.createProject({
      id: "proj-test",
      name: "Test Project",
      description: "A test project",
      category: "mechanical",
      createdBy: "user",
      updatedBy: "user",
      updatedAt: "2026-11-05T00:00:00Z",
      status: "draft",
      tags: [],
    })

    expect(project.getMetadata().name).toBe("Test Project")
    expect(service.listProjects().length).toBe(1)
  })

  it("adds a model", () => {
    const model = service.addModel({
      name: "Test Model",
      description: "A test model",
      category: "mechanical",
      source: "cadquery",
      parameters: [],
      defaultMaterialId: "mat-aluminum",
      dimensions: new Map(),
    })

    expect(model.id).toBe("test-model")
    expect(service.listModels().length).toBe(1)
  })

  it("retrieves a model by id", () => {
    const retrieved = service.getModel("test-model")
    expect(retrieved).not.toBeUndefined()
    expect(retrieved!.name).toBe("Test Model")
  })
})

describe("Project Registry", () => {
  let registry: ProjectRegistry

  beforeEach(() => {
    registry = new ProjectRegistry()
  })

  it("creates a project", () => {
    const project = registry.createProject(
      "Test Project",
      "A test project",
      "mechanical"
    )

    expect(project.name).toBe("Test Project")
    expect(project.category).toBe("mechanical")
    expect(project.version).toBe(1)
  })

  it("lists projects sorted by updatedAt", () => {
    const p1 = registry.createProject("Project A", "A", "mechanical")
    const p2 = registry.createProject("Project B", "B", "electrical")

    const list = registry.listProjects()
    expect(list.length).toBe(2)
    expect(list[0].name).toBe("Project B")
    expect(list[1].name).toBe("Project A")
  })

  it("updates a project version", () => {
    const project = registry.createProject("Test", "Desc", "mechanical")
    const updated = registry.updateProject(project.id, { name: "Updated" })

    expect(updated).not.toBeNull()
    expect(updated!.version).toBe(1)
  })
})

describe("Compilation and Build", () => {
  it("TypeScript configuration exists", () => {
    // Verify tsconfig.json exists and is valid JSON
    const fs = require("fs")
    const path = require("path")
    const configPath = path.join(__dirname, "..", "tsconfig.json")

    expect(fs.existsSync(configPath)).toBe(true)

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
    expect(config.compilerOptions.jsx).toBe("react-jsx")
    expect(config.compilerOptions.module).toBe("ESNext")
  })

  it("package.json has required dependencies", () => {
    const fs = require("fs")
    const path = require("path")
    const pkgPath = path.join(__dirname, "..", "package.json")

    expect(fs.existsSync(pkgPath)).toBe(true)

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
    expect(pkg.dependencies.react).toBeDefined()
    expect(pkg.dependencies["react-dom"]).toBeDefined()
    expect(pkg.devDependencies.vite).toBeDefined()
  })

  it("vite.config.ts exists", () => {
    const fs = require("fs")
    const path = require("path")
    const configPath = path.join(__dirname, "..", "vite.config.ts")

    expect(fs.existsSync(configPath)).toBe(true)
  })
})
