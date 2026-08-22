import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LandingPage from "./components/LandingPage";
import "./index.css";

const localWorkspacePreview = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get("workspace-preview") === "1";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {localWorkspacePreview ? (
      <App
        userDisplayName="Taylor Coach"
        userEmail="coach@lanelab.local"
        signOutPath="/"
      />
    ) : <LandingPage user={null} />}
  </StrictMode>,
);
