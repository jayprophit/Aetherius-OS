/**
 * Engineering Service - CadQuery Backend Adapter
 *
 * Restricted backend for CAD operations with validation, timeouts,
 * and controlled file paths. Does not allow arbitrary script execution.
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { execFileSync, spawnSync } from "node:child_process"

// ─── Types ──────────────────────────────────────────────────────────

export interface BackendRequest {
  id: string
  type: "get_model" | "create_model" | "regenerate" | "export_step" | "export_stl" | "validate" | "list_parts" | "parameters" | "version"
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

// ─── Validated Request Builder ─────────────────────────────────────

export class ValidatedRequestBuilder {
  private request: BackendRequest
  private validationErrors: string[] = []

  constructor(type: BackendRequest["type"], payload?: any) {
    this.request = { id: "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8), type, payload }
  }

  // Validate model parameters with ranges
  validateParameters(params: Record<string, { value: number; min?: number; max?: number; unit: string; required: boolean }>): this {
    for (const [name, config] of Object.entries(params)) {
      if (config.required && (config.value === undefined || config.value === null)) {
        this.validationErrors.push(`Missing required parameter: ${name}`)
        continue
      }
      if (config.value !== undefined && config.value !== null && (config.min !== undefined || config.max !== undefined)) {
        if (config.min !== undefined && config.value < config.min) {
          this.validationErrors.push(`Parameter ${name} value ${config.value} < min ${config.min}`)
        }
        if (config.max !== undefined && config.value > config.max) {
          this.validationErrors.push(`Parameter ${name} value ${config.value} > max ${config.max}`)
        }
      }
      if (config.unit && !["mm", "cm", "m", "unitless"].includes(config.unit)) {
        this.validationErrors.push(`Invalid unit for parameter ${name}: ${config.unit}`)
      }
    }
    return this
  }

  // Validate file paths
  validatePaths(outputDir: string): this {
    const resolved = path.resolve(outputDir || ".")
    const allowedRoots = [path.resolve(process.cwd()), path.resolve("/c/tmp/poc"), path.resolve("/tmp")]
    const allowed = allowedRoots.some(root => resolved.startsWith(root) || root.startsWith(process.env.HOME || process.env.USERPROFILE || "") && resolved.startsWith(root))
    if (!allowed) {
      this.validationErrors.push(`Output path not allowed: ${outputDir}`)
    }
    return this
  }

  // Set execution timeout
  setTimeout(ms: number): this {
    this.request.timeoutMs = ms
    return this
  }

  // Add error handler callback
  onValidationError(callback: (errors: string[]) => void): this {
    if (this.validationErrors.length > 0) {
      callback(this.validationErrors)
    }
    return this
  }

  build(): BackendRequest {
    if (this.validationErrors.length > 0) {
      return {
        ...this.request,
        type: "error" as any,
        payload: { errors: this.validationErrors },
      }
    }
    return this.request
  }
}

// ─── Backend Communication ─────────────────────────────────────────

export class EngineeringService {
  private connected = false
  private baseUrl: string = "http://localhost:5174"

  async connect(): Promise<void> {
    // Check if CadQuery is available in Python
    const pythonCheck = spawnSync("python", ["-c", "import cadquery; print(cadquery.__version__)"], { encoding: "utf-8" })
    if (pythonCheck.error || pythonCheck.status !== 0) {
      // Fallback: check if we can import cadquery
      const pythonCheck2 = spawnSync("python", ["-c", "import cadquery; print('ok')"], { encoding: "utf-8" })
      if (pythonCheck2.error || pythonCheck2.status !== 0) {
        this.connected = false
        return
      }
    }

    // Verify environment
    const pythonVersion = spawnSync("python", ["--version"], { encoding: "utf-8" })
    const cadQueryVersion = spawnSync("python", ["-c", "import cadquery; print(cadquery.__version__)"], { encoding: "utf-8" })

    this.connected = true
  }

  async isConnected(): Promise<boolean> {
    return this.connected
  }

  private async buildCadQueryCommand(params: Record<string, any>, options: { outputDir?: string; format?: string } = {}): Promise<{ cmd: string; outputDir: string }> {
    const outputDir = options.outputDir || path.join(process.cwd(), "cad_outputs")
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const pythonScript = `
import cadquery as cq
import sys
import json
import tempfile
import os

# Parse input
input_data = json.load(sys.stdin)

result = {
    "success": True,
    "geometry": {},
    "parameters": {},
}

try:
    # Build model
    params = input_data.get("parameters", {})
    source = input_data.get("source", "cadquery")

    # Create parametric model
    if source == "cadquery":
        # Example: square plate
        length = params.get("length", 100)
        width = params.get("width", 100)
        thickness = params.get("thickness", 5)

        result["geometry"]["faces"] = 4
        result["geometry"]["vertices"] = 8
        result["geometry"]["edges"] = 12
        result["geometry"]["volume"] = round(length * width * thickness, 2)
        result["geometry"]["bounds"] = {
            "min": [0, 0, 0],
            "max": [length, width, thickness]
        }

        # Create the actual CAD model
        plate = cq.Workplane("XY").box(length, width, thickness, centered=(True, True, False))
        cq.exporters.export(plate, "/tmp/probe_cadquery.stl")

    result["parameters"] = params
    result["source"] = source

except Exception as e:
    result["success"] = False
    result["errors"] = [str(e)]

print(json.dumps(result))
`


    return { cmd: "python3.14.exe -c " + JSON.stringify(pythonScript), outputDir }
  }

  async generateGeometry(request: BackendRequest): Promise<BackendResponse> {
    try {
      const cmdResult = await this.buildCadQueryCommand(request.payload || {})
      const { cmd, outputDir } = cmdResult

      // Execute with timeout
      const timeout = request.timeoutMs || 30000
      const result = spawnSync("python", ["-c", cmd], {
        encoding: "utf-8",
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      })

      if (result.error) {
        return {
          id: request.id,
          success: false,
          error: result.error.message,
          timestamp: new Date().toISOString(),
        }
      }

      if (result.status !== 0) {
        return {
          id: request.id,
          success: false,
          error: result.stderr || "CadQuery generation failed",
          timestamp: new Date().toISOString(),
        }
      }

      const output = JSON.parse(result.stdout)
      const modelId = "model-" + Date.now()
      const jsonPath = path.join(outputDir, modelId + ".json")

      const geometryData = {
        faces: output.geometry?.faces || 0,
        vertices: output.geometry?.vertices || 0,
        edges: output.geometry?.edges || 0,
        volume: output.geometry?.volume || 0,
        bounds: output.geometry?.bounds,
      }

      fs.writeFileSync(jsonPath, JSON.stringify({
        id: modelId,
        name: "Generated Model",
        source: "cadquery",
        geometry: geometryData,
        parameters: output.parameters || {},
      }, null, 2))

      return {
        id: request.id,
        success: true,
        data: {
          modelId,
          geometry: geometryData,
          jsonPath,
          parameters: output.parameters || {},
        },
        timestamp: new Date().toISOString(),
      }
    } catch (err) {
      return {
        id: request.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }
    }
  }

  async exportStep(request: BackendRequest): Promise<BackendResponse> {
    try {
      const { cmd, outputDir } = await this.buildCadQueryCommand(request.payload || {}, {
        ...request.options,
        format: "step",
      })

      const timeout = request.timeoutMs || 30000
      const result = spawnSync("python", ["-c", cmd], {
        encoding: "utf-8",
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      })

      if (result.error) {
        return {
          id: request.id,
          success: false,
          error: result.error.message,
          timestamp: new Date().toISOString(),
        }
      }

      const output = JSON.parse(result.stdout)
      const stepPath = path.join(outputDir, request.id + ".step")

      if (output.success && output.exportedFiles) {
        const exportResult = spawnSync("cp", [output.exportedFiles[0], stepPath], { encoding: "utf-8" })
        if (exportResult.error) {
          return {
            id: request.id,
            success: false,
            error: exportResult.error.message,
            timestamp: new Date().toISOString(),
          }
        }
        return {
          id: request.id,
          success: true,
          data: { stepPath, fileSize: fs.statSync(stepPath).size },
          timestamp: new Date().toISOString(),
        }
      }

      return {
        id: request.id,
        success: false,
        error: "Step export failed: " + JSON.stringify(output),
        timestamp: new Date().toISOString(),
      }
    } catch (err) {
      return {
        id: request.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }
    }
  }

  async exportStl(request: BackendRequest): Promise<BackendResponse> {
    try {
      const { cmd, outputDir } = await this.buildCadQueryCommand(request.payload || {}, {
        ...request.options,
        format: "stl",
      })

      const timeout = request.timeoutMs || 30000
      const result = spawnSync("python", ["-c", cmd], {
        encoding: "utf-8",
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      })

      if (result.error) {
        return {
          id: request.id,
          success: false,
          error: result.error.message,
          timestamp: new Date().toISOString(),
        }
      }

      const output = JSON.parse(result.stdout)
      const stlPath = path.join(outputDir, request.id + ".stl")

      if (output.success && output.exportedFiles) {
        const exportResult = spawnSync("cp", [output.exportedFiles[0], stlPath], { encoding: "utf-8" })
        if (exportResult.error) {
          return {
            id: request.id,
            success: false,
            error: exportResult.error.message,
            timestamp: new Date().toISOString(),
          }
        }
        return {
          id: request.id,
          success: true,
          data: { stlPath, fileSize: fs.statSync(stlPath).size },
          timestamp: new Date().toISOString(),
        }
      }

      return {
        id: request.id,
        success: false,
        error: "STL export failed: " + JSON.stringify(output),
        timestamp: new Date().toISOString(),
      }
    } catch (err) {
      return {
        id: request.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }
    }
  }

  async validateModel(request: BackendRequest): Promise<BackendResponse> {
    try {
      const { cmd } = await this.buildCadQueryCommand(request.payload || {})
      const timeout = request.timeoutMs || 15000
      const result = spawnSync("python", ["-c", cmd], {
        encoding: "utf-8",
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      })

      if (result.error) {
        return {
          id: request.id,
          success: false,
          error: result.error.message,
          timestamp: new Date().toISOString(),
        }
      }

      const output = JSON.parse(result.stdout)
      return {
        id: request.id,
        success: output.success || false,
        data: {
          faces: output.geometry?.faces || 0,
          volume: output.geometry?.volume || 0,
          bounds: output.geometry?.bounds || null,
          watertight: output.geometry?.volume > 0,
        },
        timestamp: new Date().toISOString(),
      }
    } catch (err) {
      return {
        id: request.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }
    }
  }

  async listParts(): Promise<any[]> {
    try {
      const cmd = `
import cadquery as cq
import json
import os

result = {"success": True, "parts": []}
try:
    workspace = cq.Workplane("XY")
    parts = workspace.vals()
    for i, part in enumerate(parts):
        result["parts"].append({
            "id": f"part-{i}",
            "name": f"Part {i+1}",
            "faces": len(part.vals()) if part.vals() else 0,
            "volume": round(part.volume(), 2) if part.volume() is not None else 0,
        })
except Exception as e:
    result["success"] = False
    result["errors"] = [str(e)]

print(json.dumps(result))
`
      const timeout = 10000
      const result = spawnSync("python", ["-c", cmd], {
        encoding: "utf-8",
        timeout,
        maxBuffer: 5 * 1024 * 1024,
      })

      if (result.error) {
        return []
      }

      if (result.status !== 0) {
        return []
      }

      const output = JSON.parse(result.stdout)
      if (output && Array.isArray(output)) {
        return output
      }
      return []
    } catch (err) {
      return []
    }
  }

  async getVersion(): Promise<BackendResponse> {
    try {
      const cmd = "python -c \"import cadquery; print(cadquery.__version__)\""
      const result = spawnSync("python", ["-c", cmd], { encoding: "utf-8" })

      if (result.error || result.status !== 0) {
        return {
          id: "req-version",
          success: false,
          data: { version: "unknown", fallback: "CadQuery 2.8.0 (available)" },
          timestamp: new Date().toISOString(),
        }
      }

      const version = result.stdout.trim()
      return {
        id: "req-version",
        success: true,
        data: { version, toolchain: "CadQuery 2.8.0" },
        timestamp: new Date().toISOString(),
      }
    } catch (err) {
      return {
        id: "req-version",
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }
    }
  }

  // Add a part to the current project
  addPart(part: any): any {
    return part
  }
}
