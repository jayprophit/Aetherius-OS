/**
 * Engineering Studio API Client
 *
 * HTTP client for communicating with the local engineering backend.
 * All requests are validated and asynchronous.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface BackendHealth {
  status: string
  timestamp: string
}

export interface BackendError {
  error: string
  details?: { errors: string[] }
  timestamp: string
}

export class EngineeringApiClient {
  private baseUrl: string

  constructor(baseUrl: string = "http://localhost:5174") {
    this.baseUrl = baseUrl
  }

  // ─── Health Check ────────────────────────────────────────────────────

  async healthCheck(): Promise<BackendHealth> {
    const response = await fetch(`${this.baseUrl}/api/health`)
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }
    return response.json()
  }

  // ─── Projects ────────────────────────────────────────────────────────

  async listProjects(): Promise<{ projects: { id: string; name: string; category: string; updatedAt: string }[] }> {
    const response = await fetch(`${this.baseUrl}/api/projects`)
    if (!response.ok) {
      throw new Error(`List projects failed: ${response.statusText}`)
    }
    return response.json()
  }

  // ─── Models ──────────────────────────────────────────────────────────

  async getModel(modelId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/models/${modelId}`)
    if (!response.ok) {
      throw new Error(`Get model failed: ${response.statusText}`)
    }
    return response.json()
  }

  // ─── Parameter Changes ────────────────────────────────────────────────

  async updateParameters(projectId: string, parameters: Record<string, number>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/parameters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parameters }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(`Update parameters failed: ${response.statusText}`, { cause: data })
    }
    return response.json()
  }

  // ─── CAD Regeneration ─────────────────────────────────────────────────

  async regenerateDesign(projectId: string, modelId: string, parameters: Record<string, number>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, parameters }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(`Regenerate design failed: ${response.statusText}`, { cause: data })
    }
    return response.json()
  }

  // ─── Geometry Validation ──────────────────────────────────────────────

  async validateGeometry(modelId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/models/${modelId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(`Validate geometry failed: ${response.statusText}`, { cause: data })
    }
    return response.json()
  }

  // ─── Artifacts ────────────────────────────────────────────────────────

  async listArtifacts(projectId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/artifacts`)
    if (!response.ok) {
      throw new Error(`List artifacts failed: ${response.statusText}`)
    }
    return response.json()
  }

  // ─── Revisions ────────────────────────────────────────────────────────

  async saveRevision(projectId: string, modelId: string, parameters: Record<string, number>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/revisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, parameters }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(`Save revision failed: ${response.statusText}`, { cause: data })
    }
    return response.json()
  }

  async getRevision(projectId: string, revisionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/revisions/${revisionId}`)
    if (!response.ok) {
      throw new Error(`Get revision failed: ${response.statusText}`)
    }
    return response.json()
  }

  // ─── Error Handling ───────────────────────────────────────────────────

  static isBackendError(error: unknown): error is BackendError {
    if (error instanceof Error) {
      return error.cause instanceof Object && "error" in error.cause
    }
    return false
  }
}

// ─── Singleton Instance ─────────────────────────────────────────────────

export const engineeringApi = new EngineeringApiClient()
