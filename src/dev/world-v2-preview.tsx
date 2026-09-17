import React from "react"
import ReactDOM from "react-dom/client"
import "../index.css"
import DsaWorldV2 from "../components/world-v2/DsaWorldV2"

const rootElement = document.getElementById("root")
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <DsaWorldV2 />
    </React.StrictMode>
  )
}
