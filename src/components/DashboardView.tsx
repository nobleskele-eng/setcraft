/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Sparkles,
  Calendar,
  ArrowRight,
  Play,
  Calculator,
  FolderKanban,
  Blocks,
  BookOpenCheck,
  FileDown,
  Clock3,
} from "lucide-react";
import { UserRole } from "../types";
import { StudioProject } from "../studioProjectTypes";
import { FAMOUS_WORKOUTS } from "../famousWorkouts";
import { calculateStats, PALETTE_PRESETS } from "../swimStudioEngine";

interface DashboardViewProps {
  currentRole: UserRole;
  onNavigateTo: (dest: string) => void;
  savedWorkoutsCount: number;
}

function readProjects(): StudioProject[] {
  try {
    const projects: StudioProject[] = JSON.parse(localStorage.getItem("setcraft_studio_projects") || "[]");
    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

export default function DashboardView({ currentRole, onNavigateTo, savedWorkoutsCount }: DashboardViewProps) {
  const [projects, setProjects] = React.useState<StudioProject[]>(readProjects);

  React.useEffect(() => {
    const refresh = () => setProjects(readProjects());
    const interval = window.setInterval(refresh, 2000);
    window.addEventListener("storage", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("storage", refresh); };
  }, []);

  const totalDistance = projects.reduce((sum, project) => sum + calculateStats(project.nodes || []).totalDistance, 0);
  const mostRecent = projects.slice(0, 4);

  const quickActions = [
    { id: "studio", label: "Build a practice", helper: "Open Project Setup and the Scratch-style builder", icon: Blocks },
    { id: "projects", label: "Project Hub", helper: "Create folders, duplicate and reopen season projects", icon: FolderKanban },
    { id: "famous", label: "Workout Library", helper: "Open one of the curated or SetCraft-original templates", icon: BookOpenCheck },
    { id: "calculators", label: "Calculator Lab", helper: "Pace, splits, send-offs, CSS, stroke and set math", icon: Calculator },
    { id: "calendar", label: "Season Calendar", helper: "Place saved projects into weekly training plans", icon: Calendar },
    { id: "copilot", label: "AI Coach", helper: "Generate or revise a draft and convert it to blocks", icon: Sparkles },
  ];

  const statCards = [
    { label: "Saved projects", value: savedWorkoutsCount },
    { label: "Programmed volume", value: totalDistance.toLocaleString() },
    { label: "Ready-made blocks", value: PALETTE_PRESETS.length },
    { label: "Library workouts", value: FAMOUS_WORKOUTS.length },
  ];

  return (
    <div className="mx-auto max-w-[1540px]" id="coach-dashboard">
      <div style={{ padding: "28px 8px", background: "var(--color-canvas-raised)", border: "1px solid var(--color-hairline-on-canvas)", borderLeft: "3px solid var(--color-accent)", borderRadius: "var(--radius)" }}>
        <div style={{ maxWidth: 640, padding: "0 24px" }}>
          <span className="sc-tag" data-tone="accent">{currentRole} workspace</span>
          <h1 style={{ fontSize: "var(--text-display-xl)", marginTop: 14 }}>Build the practice. Verify the math. Coach the swimmers.</h1>
          <p style={{ fontSize: "var(--text-body-lg)", color: "var(--color-ink-muted-on-canvas)", marginTop: 12, lineHeight: 1.5 }}>SetCraft keeps visual blocks, lane versions, project folders, deterministic calculations and the final pool-deck sheet in one workflow.</p>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="sc-btn" data-variant="primary" data-size="md" onClick={() => onNavigateTo("studio")}><Play className="h-4 w-4 fill-current" />Open Swim Studio</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 8px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 28, alignItems: "start" }} className="max-xl:grid-cols-1">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", border: "1px solid var(--color-hairline-on-canvas)", borderRadius: "var(--radius)", background: "var(--color-canvas-raised)" }} className="flex-wrap">
            {statCards.map((s, i) => (
              <div key={s.label} style={{ flex: "1 1 160px", padding: "14px 18px", borderRight: i < statCards.length - 1 ? "1px solid var(--color-hairline-on-canvas)" : "none" }}>
                <div style={{ fontSize: 11, color: "var(--color-ink-muted-on-canvas)", fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontVariantNumeric: "tabular-nums", color: "var(--color-ink-on-canvas)", marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-display-sm)", marginBottom: 12 }}>Coach tools</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="max-md:grid-cols-1">
              {quickActions.map(({ id, label, helper, icon: Icon }) => (
                <div key={id} className="sc-quick-tile" onClick={() => onNavigateTo(id)}>
                  <span className="sc-quick-tile-icon"><Icon className="h-4 w-4" /></span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink-on-canvas)" }}>{label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--color-ink-muted-on-canvas)", marginTop: 1 }}>{helper}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-display-sm)" }}>Recently edited</div>
              <button type="button" className="sc-btn" data-variant="secondary" data-size="sm" onClick={() => onNavigateTo("projects")}>View all</button>
            </div>
            {mostRecent.length === 0 ? (
              <div className="sc-card" data-elevation="sm" style={{ padding: "48px 24px", textAlign: "center" }}>
                <FolderKanban className="mx-auto h-8 w-8" style={{ color: "var(--color-ink-muted-on-canvas)" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink-on-canvas)", marginTop: 12 }}>No saved projects yet</div>
                <div style={{ marginTop: 12 }}>
                  <button type="button" className="sc-btn" data-variant="primary" data-size="sm" onClick={() => onNavigateTo("studio")}>Create the first practice</button>
                </div>
              </div>
            ) : (
              <div className="sc-card" data-elevation="sm">
                {mostRecent.map((project, i) => {
                  const stats = calculateStats(project.nodes || []);
                  return (
                    <div
                      key={project.id}
                      className="sc-recent-row"
                      style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderTop: i > 0 ? "1px solid var(--color-hairline-on-canvas)" : "none", cursor: "pointer" }}
                      onClick={() => onNavigateTo("projects")}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink-on-canvas)" }}>{project.name}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <span className="sc-tag" data-tone="neutral">{project.folder}</span>
                          <span className="sc-tag" data-tone="outline">{project.phase}</span>
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontVariantNumeric: "tabular-nums", color: "var(--color-ink-on-canvas)", textAlign: "right", width: 90 }}>{stats.totalDistance.toLocaleString()} {project.poolUnit}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontVariantNumeric: "tabular-nums", color: "var(--color-ink-muted-on-canvas)", textAlign: "right", width: 80 }}>{stats.estimatedDuration} min</div>
                      <ArrowRight className="h-4 w-4" style={{ color: "var(--color-ink-muted-on-canvas)" }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="sc-card" data-elevation="sm" style={{ padding: 18 }}>
          <span className="sc-quick-tile-icon"><FileDown className="h-5 w-5" /></span>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginTop: 12, marginBottom: 12 }}>Competition-ready workflow</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Build nested sections, repeats and conditions.",
              "Assign lane paces, swimmers and set-specific overrides.",
              "Review totals and warnings, then export the deck sheet.",
            ].map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid var(--color-hairline-on-canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-ink-muted-on-canvas)", flex: "none" }}>{i + 1}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-ink-on-canvas)" }}>{step}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid var(--color-hairline-on-canvas)", paddingTop: 14, fontSize: 12, color: "var(--color-ink-muted-on-canvas)" }}>
            <Clock3 className="h-4 w-4" style={{ color: "var(--color-accent-active)" }} />Projects auto-save locally while you work.
          </div>
        </div>
      </div>
    </div>
  );
}
