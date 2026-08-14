/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  Calculator,
  Sparkles,
  Calendar,
  Users,
  Settings,
  BookOpenCheck,
  ChevronDown,
  Menu,
  SlidersHorizontal,
  Blocks,
  FileDown,
  ListChecks,
  FolderKanban,
  ChartNoAxesCombined,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { UserRole } from "./types";
import DashboardView from "./components/DashboardView";
import SwimStudio from "./components/SwimStudio";
import Calculators from "./components/Calculators";
import AICopilot from "./components/AICopilot";
import CalendarView from "./components/CalendarView";
import CommunityView from "./components/CommunityView";
import SettingsView from "./components/SettingsView";
import FamousSetsView from "./components/FamousSetsView";
import ProjectsView from "./components/ProjectsView";
import RaceLab from "./components/RaceLab";
import { FamousWorkout } from "./famousWorkouts";
import { StudioProject } from "./studioProjectTypes";
import { parseQuickWrite } from "./swimStudioEngine";

export type StudioWorkspacePage = "project" | "build" | "lanes" | "deck" | "review";

function aiTextToQuickWrite(text: string): string {
  return text
    .split(/\r?\n/)
    .map((raw) => raw
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s*/, "# ")
      .replace(/^[•*-]\s*/, "")
      .replace(/\b(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:meters?|metres?|yards?|yds?)\b/gi, "$1x$2")
      .replace(/\b(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)m\b/gi, "$1x$2")
      .replace(/\bon a\s+(\d{0,2}:\d{1,2})\s+(?:cycle\s+)?interval/gi, "@ $1")
      .replace(/\bon\s+(\d{0,2}:\d{1,2})\s+(?:cycle\s+)?interval/gi, "@ $1")
      .replace(/\((RPE\s*\d+(?:\.\d+)?(?:\/10)?)\)/gi, "$1")
      .trim())
    .filter((line) => line && !/^physiological purpose:?$/i.test(line) && !/^why this modification works:?$/i.test(line))
    .map((line) => {
      if (/^#/.test(line)) return line;
      if (/^(warm-?up|pre-?set|main set|secondary set|skill|technique|kick|pull|sprint|race pace|recovery|cool-?down|test set)\s*:?$/i.test(line)) {
        return `# ${line.replace(/:$/, "")}`;
      }
      return line;
    })
    .join("\n");
}

const PRIMARY_NAV_ITEMS = [
  { id: "dashboard", label: "Home Dashboard", helper: "Overview and recent work", icon: LayoutDashboard },
  { id: "famous", label: "Famous Sets", helper: "Curated and coach libraries", icon: BookOpenCheck },
  { id: "race-lab", label: "Race Analysis Lab", helper: "LCM, SCM, SCY records and race analysis", icon: ChartNoAxesCombined },
  { id: "calculators", label: "Race Strategy Studio", helper: "Athlete plans, conversion and swim math", icon: Calculator },
  { id: "copilot", label: "Coach Block AI", helper: "Coach chat, set generation and revision", icon: Sparkles },
  { id: "calendar", label: "Season Calendar", helper: "Plan training phases", icon: Calendar },
  { id: "community", label: "Swimmer Guild", helper: "Shared learning space", icon: Users },
  { id: "settings", label: "Settings & Roles", helper: "Workspace preferences", icon: Settings },
] as const;

const STUDIO_SUBNAV: Array<{ id: string; page?: StudioWorkspacePage; label: string; helper: string; icon: React.ElementType }> = [
  { id: "projects", label: "Project Hub", helper: "Projects, folders and season plans", icon: FolderKanban },
  { id: "project", page: "project", label: "Project Setup", helper: "Name, phase, pool and folder", icon: SlidersHorizontal },
  { id: "build", page: "build", label: "Build Sets", helper: "Blocks, scripts and quick write", icon: Blocks },
  { id: "lanes", page: "lanes", label: "Lane Plan", helper: "Groups, swimmers and pace versions", icon: Users },
  { id: "deck", page: "deck", label: "Deck Sheet", helper: "Header, notes and goal tables", icon: FileDown },
  { id: "review", page: "review", label: "Review & Export", helper: "Validate, preview and publish", icon: ListChecks },
];

type AppProps = {
  userDisplayName: string;
  userEmail: string;
  signOutPath: string;
};

export default function App({ userDisplayName, userEmail, signOutPath }: AppProps) {
  const [activeTab, setActiveTab] = useState<string>("studio");
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("setcraft_active_role") : null;
    return saved === "Athlete" || saved === "ClubAdmin" || saved === "Coach" ? saved : "Coach";
  });
  const [savedCount, setSavedCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const cached = localStorage.getItem("setcraft_studio_projects") || localStorage.getItem("swimblock_templates");
      return cached ? JSON.parse(cached).length || 0 : 0;
    } catch { return 0; }
  });
  const [studioImport, setStudioImport] = useState<FamousWorkout | null>(null);
  const [projectImport, setProjectImport] = useState<StudioProject | null>(null);
  const [studioPage, setStudioPage] = useState<StudioWorkspacePage>("project");
  const [studioNavOpen, setStudioNavOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("setcraft_sidebar_collapsed") === "true";
  });
  const mainRef = useRef<HTMLElement | null>(null);

  const updateSavedCount = () => {
    try {
      const cached = localStorage.getItem("setcraft_studio_projects") || localStorage.getItem("swimblock_templates");
      if (cached) setSavedCount(JSON.parse(cached).length || 0);
    } catch (error) {
      console.error("Could not count saved projects", error);
    }
  };

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem("setcraft_settings") || "{}");
      document.documentElement.dataset.setcraftReduceMotion = String(Boolean(settings.reduceMotion));
      document.documentElement.dataset.setcraftLargeDeck = String(settings.largerDeckText !== false);
    } catch {
      document.documentElement.dataset.setcraftReduceMotion = "false";
      document.documentElement.dataset.setcraftLargeDeck = "true";
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(updateSavedCount, 2000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("setcraft_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setMobileNavOpen(false);
  }, [activeTab, studioPage]);

  const openStudioPage = (page: StudioWorkspacePage) => {
    setActiveTab("studio");
    setStudioPage(page);
    setStudioNavOpen(true);
  };

  const openGeneratedSetInStudio = (text: string, title: string, focus: string) => {
    const quickWrite = aiTextToQuickWrite(text);
    const nodes = parseQuickWrite(quickWrite);
    const usefulNodes = nodes.length > 0 ? nodes : parseQuickWrite(`# Main Set\nNote: ${text}`);
    setStudioImport({
      id: `ai-workout-${Date.now()}`,
      title: title || "AI-generated swim set",
      subtitle: "Editable draft generated by SetCraft AI Coach",
      attribution: "Generated in SetCraft AI Coach",
      sourceName: "SetCraft AI",
      sourceUrl: "",
      level: "Advanced",
      focus: focus || "Coach-selected focus",
      phase: "General preparation",
      durationMinutes: 60,
      poolLength: 25,
      poolUnit: "m",
      tags: ["AI draft", "Editable"],
      disclaimer: "AI-generated draft. The coach must verify distance, intervals, recovery, athlete restrictions and suitability before use.",
      nodes: usefulNodes,
    });
    setStudioPage("build");
    setActiveTab("studio");
  };

  const currentTitle = activeTab === "studio"
    ? STUDIO_SUBNAV.find((item) => item.page === studioPage)?.label || "Swim Studio"
    : activeTab === "projects"
      ? "Project Hub"
      : PRIMARY_NAV_ITEMS.find((item) => item.id === activeTab)?.label || "SetCraft";

  const studioActive = activeTab === "studio" || activeTab === "projects";
  const accountInitial = userDisplayName.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="sc-shell" id="swimblock-root">
      <div className="sc-mobile-topbar">
        <button type="button" className="sc-mobile-topbar-btn" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="sc-mobile-brand">SetCraft</span>
        <span className="sc-mobile-account" aria-label={`Signed in as ${userDisplayName}`}>{accountInitial}</span>
      </div>
      <div className="sc-sidebar-overlay" data-open={mobileNavOpen ? "true" : "false"} onClick={() => setMobileNavOpen(false)} />

      <aside className="sc-sidebar" data-open={mobileNavOpen ? "true" : "false"} data-collapsed={sidebarCollapsed ? "true" : "false"} id="swimblock-sidebar">
        <div className="sc-sidebar-brand">
          <div className="sc-sidebar-brand-lockup">
            <span className="sc-sidebar-mark" aria-hidden="true"><span /><span /><span /></span>
            <div>
              <div className="sc-sidebar-brand-name">SetCraft</div>
              <div className="sc-sidebar-brand-tag">Swim performance studio</div>
            </div>
          </div>
          <button
            type="button"
            className="sc-sidebar-collapse"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "Expand primary sidebar" : "Collapse primary sidebar"}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="sc-sidebar-nav" aria-label="Primary navigation">
          <button
            type="button"
            className="sc-sidebar-item"
            data-active={studioActive ? "true" : "false"}
            onClick={() => { if (activeTab !== "studio" && activeTab !== "projects") { openStudioPage(studioPage); setStudioNavOpen(true); } else { setStudioNavOpen((open) => !open); } }}
            aria-expanded={studioNavOpen}
            title="Swim Studio"
          >
            <Dumbbell className="sc-sidebar-item-icon" />
            <div className="sc-sidebar-item-text">
              <span className="sc-sidebar-item-label">Swim Studio</span>
              <span className="sc-sidebar-item-desc">Projects, block builder and deck tools</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-ink-muted)", marginTop: 2, transform: studioNavOpen ? "rotate(180deg)" : undefined, transition: "transform 0.15s ease" }} />
          </button>

          {studioNavOpen && (
            <div className="sc-sidebar-sub">
              {STUDIO_SUBNAV.map((item) => {
                const active = item.id === "projects" ? activeTab === "projects" : activeTab === "studio" && studioPage === item.page;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className="sc-sidebar-sub-item"
                    data-active={active ? "true" : "false"}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      if (item.id === "projects") setActiveTab("projects");
                      else openStudioPage(item.page!);
                      setMobileNavOpen(false);
                    }}
                  >
                    <div className="sc-sidebar-sub-label">{item.label}</div>
                    {item.helper && <div className="sc-sidebar-sub-desc">{item.helper}</div>}
                  </button>
                );
              })}
            </div>
          )}

          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button type="button" key={item.id} className="sc-sidebar-item" data-active={active ? "true" : "false"} aria-current={active ? "page" : undefined} title={item.label} onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}>
                <Icon className="sc-sidebar-item-icon" />
                <div className="sc-sidebar-item-text">
                  <span className="sc-sidebar-item-label">{item.label}</span>
                  <span className="sc-sidebar-item-desc">{item.helper}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="sc-sidebar-status">
          <div className="sc-account-card">
            <span className="sc-account-avatar" aria-hidden="true">{accountInitial}</span>
            <div className="sc-account-copy">
              <span className="sc-account-name">{userDisplayName}</span>
              <span className="sc-account-email">{userEmail}</span>
            </div>
            <a className="sc-account-signout" href={signOutPath} aria-label="Log out of SetCraft" title="Log out">
              <LogOut className="h-4 w-4" />
            </a>
          </div>
          <div className="sc-sidebar-role">
            <div>
              <div className="sc-sidebar-role-label">{currentRole} workspace</div>
              <div className="sc-sidebar-role-hint">Race and training tools</div>
            </div>
          </div>
          <div className="sc-sidebar-meta-row"><span>{savedCount} saved project{savedCount === 1 ? "" : "s"} on this device</span></div>
          <div className="sc-sidebar-meta-row sc-session-row"><span><span className="sc-sidebar-dot" />Session secured</span><span>v20</span></div>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto" id="swimblock-main-viewport">
          {activeTab !== "studio" && (
            <div className="sc-header">
              <div>
                <div className="sc-header-kicker">SetCraft workspace</div>
                <div className="sc-header-title">{currentTitle}</div>
              </div>
              <div className="sc-header-account">
                <span className="sc-header-account-copy"><strong>{userDisplayName}</strong><small>{currentRole} perspective</small></span>
                <span className="sc-header-avatar">{accountInitial}</span>
              </div>
            </div>
          )}

          <div className={`page-enter ${activeTab === "studio" ? "" : "p-4 md:p-7 xl:p-10"}`}>
            {activeTab === "dashboard" && <DashboardView currentRole={currentRole} onNavigateTo={setActiveTab} savedWorkoutsCount={savedCount} />}
            {activeTab === "studio" && <SwimStudio currentRole={currentRole} initialWorkout={studioImport} initialProject={projectImport} requestedPage={studioPage} onPageChange={setStudioPage} onInitialWorkoutLoaded={() => setStudioImport(null)} onInitialProjectLoaded={() => setProjectImport(null)} />}
            {activeTab === "projects" && <ProjectsView onOpenProject={(project) => { setProjectImport(project); setStudioPage("build"); setActiveTab("studio"); }} onCreateProject={(project) => { setProjectImport(project); setStudioPage("project"); setActiveTab("studio"); }} />}
            {activeTab === "famous" && <FamousSetsView onOpenWorkout={(workout) => { setStudioImport(workout); setStudioPage("build"); setActiveTab("studio"); }} />}
            {activeTab === "race-lab" && <RaceLab />}
            {activeTab === "calculators" && <Calculators />}
            {activeTab === "copilot" && <AICopilot onOpenGeneratedSet={openGeneratedSetInStudio} />}
            {activeTab === "calendar" && <CalendarView />}
            {activeTab === "community" && <CommunityView />}
            {activeTab === "settings" && <SettingsView currentRole={currentRole} onRoleChange={setCurrentRole} />}
          </div>
        </main>
      </div>
    </div>
  );
}
