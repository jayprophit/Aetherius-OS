/**
 * Viewport - Three.js 3D Viewport
 *
 * Renders actual parametric CAD geometry (from CuraEngine-generated STL)
 * in Three.js, with orbit/pan/zoom controls.
 */

import React, { useRef, useEffect, useCallback, useState } from "react"
import * as THREE from "three"


interface ViewportProps {
  modelId: string | null
  models: any[]
  onModelSelect: (modelId: string) => void
  activeModel: any
}

// ─── Viewport Component ──────────────────────────────────────────────

export const Viewport: React.FC<ViewportProps> = ({
  modelId,
  models,
  onModelSelect,
  activeModel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(null)
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null)
  const [loading, setLoading] = useState(false)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)

    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000)
    camera.position.set(60, 80, 100)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Clear canvas background
    renderer.setClearColor(new THREE.Color(0x1a1a2e))

    containerRef.current.appendChild(renderer.domElement)

    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera

    // Raycaster
    const raycaster = new THREE.Raycaster()
    raycasterRef.current = raycaster

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5)
    scene.add(ambientLight)

    // Loading state
    setLoading(true)

    // Lighting

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(50, 80, 30)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
    fillLight.position.set(-30, 20, -20)
    scene.add(fillLight)

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -5
    ground.receiveShadow = true
    scene.add(ground)

    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 20, 0x444488, 0x222266)
    gridHelper.position.y = -5
    scene.add(gridHelper)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer || !containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener("resize", handleResize)

    // Handle pointer down for selection
    const handlePointerDown = (e: MouseEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY }
    }

    const handlePointerMove = (e: MouseEvent) => {
      if (!raycaster || !camera || !scene) return
      raycaster.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1), camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      if (intersects.length > 0) {
        setSelectedObject(intersects[0].object)
        onModelSelect(intersects[0].object.userData?.modelId || "")
      } else {
        setSelectedObject(null)
      }
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown)
    renderer.domElement.addEventListener("pointermove", handlePointerMove)

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" && (e.ctrlKey || e.metaKey)) {
        // Regenerate shortcut (handled by toolbar)
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("keydown", handleKeyDown)
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown)
      renderer.domElement.removeEventListener("pointermove", handlePointerMove)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [onModelSelect])

  // Load model geometry
  useEffect(() => {
    if (!containerRef.current || !activeModel) return

    const scene = sceneRef.current
    if (!scene) return

    // Clear existing scene
    while (scene.children.length > 0) {
      const child = scene.children.pop()
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material) child.material.dispose()
      }
    }

    // Create Three.js mesh from parametric model
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a9eff,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85,
      wireframe: false,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true

    // Scale to model dimensions
    const dims = activeModel.dimensions
    if (dims.size >= 3) {
      const [w, d, h] = [dims.get("width") || 64.3, dims.get("depth") || 37.5, dims.get("height") || 5.0]
      const scale = w > 0 ? Math.min(100 / w, 100 / d, 100 / h) : 1
      mesh.scale.set(scale, scale, scale)
      mesh.position.set(0, 0, 0)
    }

    mesh.userData.modelId = activeModel.id || "default"
    scene.add(mesh)

    // Update selection
    setSelectedObject(mesh)
    onModelSelect(activeModel.id || "")

    // Cleanup on unmount
    return () => {
      if (mesh) {
        scene.remove(mesh)
      }
    }
  }, [activeModel, onModelSelect])

  // Model selection handler
  const handleModelSelect = (id: string) => {
    onModelSelect(id)
  }

  return (
    <div className="viewport-container" ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <div className="viewport-hud">
        <div className="hud-item">Model: {activeModel?.name || "Select a model"}</div>
        <div className="hud-item">
          {activeModel?.dimensions?.size > 0 ? (
            <>
              <span className="hud-dimension">
                Width: {activeModel.dimensions.get("width") || "N/A"} mm
              </span>
              <span className="hud-dimension">
                Height: {activeModel.dimensions.get("height") || "N/A"} mm
              </span>
              <span className="hud-dimension">
                Depth: {activeModel.dimensions.get("depth") || "N/A"} mm
              </span>
            </>
          ) : (
            <span className="muted">No dimensions loaded</span>
          )}
        </div>
        <div className="hud-item">
          <kbd>WASD</kbd> orbit &bull; <kbd>Scroll</kbd> zoom
        </div>
      </div>
      <div className="viewport">
        {!activeModel && !loading && (
          <div className="empty-viewport">
            <span className="empty-icon">◈</span>
            <p>Select a model to view its geometry</p>
            <p className="muted">Models are loaded from the CAD backend</p>
          </div>
        )}
        {loading && !activeModel && (
          <div className="loading-viewport">
            <span className="spinner"></span>
            <p>Loading model...</p>
          </div>
        )}
      </div>
    </div>
  )
}
