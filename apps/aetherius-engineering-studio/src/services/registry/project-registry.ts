/**
 * Project Registry - Persistent Engineering Project Registry
 *
 * SHA-256 artifact hashing, revision tracking, and project
 * persistence for the Engineering Design Studio.
 */

import * as fs from "node:fs"
import * as path from "node:path"

// ─── Types ──────────────────────────────────────────────────────────

export interface ProjectEntry {
  id: string
  type: "project" | "document" | "component" | "assembly" | "artifact"
  name: string
  category: string
  createdAt: string
  updatedAt: string
  version: number
  metadata: Record<string, any>
}

export interface ArtifactHash {
  sha256: string
  algorithm: "sha256"
  size: number
  filePath: string
  fileType: string
  createdAt: string
}

// ─── Project Registry ──────────────────────────────────────────────

export class ProjectRegistry {
  private entries: Map<string, ProjectEntry> = new Map()
  private engineeringDir: string

  constructor(engineeringDir?: string) {
    this.engineeringDir = engineeringDir || path.join(process.cwd(), "engineering_registry")
    this.loadExisting()
  }

  createProject(name: string, description: string, category: string): ProjectEntry {
    const now = new Date().toISOString()
    const entry: ProjectEntry = {
      id: "proj-" + Math.random().toString(36).slice(2, 10),
      type: "project",
      name,
      category,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: { description, creator: "user" },
    }
    this.entries.set(entry.id, entry)
    return entry
  }

  getProject(id: string): ProjectEntry | undefined {
    return this.entries.get(id)
  }

  updateProject(id: string, updates: Partial<ProjectEntry>): ProjectEntry | null {
    const entry = this.entries.get(id)
    if (!entry) return null
    const updated: ProjectEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: entry.version + 1,
    }
    this.entries.set(id, updated)
    return updated
  }

  listProjects(): ProjectEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.type === "project")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  private loadExisting(): void {
    try {
      const registryPath = path.join(this.engineeringDir, "project_registry.json")
      if (fs.existsSync(registryPath)) {
        const content = fs.readFileSync(registryPath, "utf-8")
        const manifest = JSON.parse(content)
        for (const entry of manifest.entries || []) {
          this.entries.set(entry.id, entry)
        }
      }
    } catch {
      // No existing registry
    }
  }

  save(): void {
    try {
      fs.mkdirSync(this.engineeringDir, { recursive: true })
      const manifest = {
        registryVersion: "1.0",
        createdAt: new Date().toISOString(),
        entries: Array.from(this.entries.values()),
      }
      fs.writeFileSync(
        path.join(this.engineeringDir, "project_registry.json"),
        JSON.stringify(manifest, null, 2)
      )
    } catch (err) {
      console.error("Failed to save registry:", err)
    }
  }
}
