import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AuthGate from "./components/AuthGate";
import "./index.css";

const localWorkspacePreview = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get("workspace-preview") === "1";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {localWorkspacePreview ? (
      <App
        userDisplayName="Taylor Coach"
        userEmail="coach@setcraft.local"
        signOutPath="/"
      />
    ) : <AuthGate />}
  </StrictMode>,
);
