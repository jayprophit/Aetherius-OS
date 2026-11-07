/**
 * Engineering Design Studio - Entry Point
 */

import React from "react"
import ReactDOM from "react-dom/client"
import { EngineeringStudioProvider } from "./studio/studio-provider"
import { EngineeringDesignStudio } from "./studio/studio"
import "./styles/global.css"

const container = document.getElementById("root")
if (!container) {
  throw new Error("Root element not found")
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <EngineeringStudioProvider>
      <EngineeringDesignStudio projectRegistry={new (require("./services/registry/project-registry").ProjectRegistry)()} />
    </EngineeringStudioProvider>
  </React.StrictMode>
)
