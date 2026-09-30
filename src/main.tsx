import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Dashboard } from "@/components/sky/dashboard"
import "./styles.css"

const root = document.getElementById("root")
if (!root) throw new Error("Missing root")
createRoot(root).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
)
