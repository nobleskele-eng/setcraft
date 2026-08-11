/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  Calculator,
  Sparkles,
  Calendar,
  Users,
  Settings,
  ShieldCheck,
  BookOpenCheck,
  ChevronRight,
  ChevronDown,
  Waves,
  SlidersHorizontal,
  Blocks,
  FileDown,
  ListChecks,
  FolderKanban,
  ChartNoAxesCombined,
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

export default function App() {
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
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased md:flex" id="swimblock-root">
      <aside className={`relative z-30 flex w-full shrink-0 flex-col border-b border-slate-800 bg-surface text-ink md:sticky md:top-0 md:h-screen md:w-[318px] md:border-b-0 ${activeTab === "studio" ? "" : "md:border-r md:border-slate-800"}`} id="swimblock-sidebar">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="brand-orb flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 shadow-lg shadow-blue-950/40">
              <Waves className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-white">SetCraft</span>
              <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.19em] text-sky-300">Visual Training Studio</span>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
              <span>Workspace</span>
              <span className="flex items-center gap-1.5 rounded-full bg-sky-400/10 px-2.5 py-1 text-sky-300 ring-1 ring-sky-400/20"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" />Live</span>
            </div>
            <p className="mt-2 text-base font-bold text-white">{currentRole} Mode</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{savedCount} saved project{savedCount === 1 ? "" : "s"} on this device</p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:block md:flex-1 md:overflow-y-auto md:px-4 md:py-5" aria-label="Primary navigation">
          <button
            type="button"
            onClick={() => { if (activeTab !== "studio" && activeTab !== "projects") { openStudioPage(studioPage); setStudioNavOpen(true); } else { setStudioNavOpen((open) => !open); } }}
            className={`nav-rail-item group relative flex min-w-[210px] items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 md:min-w-0 md:w-full ${(activeTab === "studio" || activeTab === "projects") ? "border-blue-400/25 bg-gradient-to-r from-blue-500/15 to-indigo-500/12 text-white shadow-lg shadow-black/20" : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.065] hover:text-white"}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${(activeTab === "studio" || activeTab === "projects") ? "bg-blue-500 text-white shadow-md shadow-blue-950/40" : "bg-white/[0.07] text-slate-400 group-hover:bg-white/10 group-hover:text-sky-300"}`}>
              <Dumbbell className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold">Swim Studio</span>
              <span className="mt-0.5 hidden truncate text-[11px] text-slate-400 md:block">Projects, block builder and deck tools</span>
            </span>
            <ChevronDown className={`hidden h-4 w-4 text-sky-300 transition-transform md:block ${studioNavOpen ? "rotate-180" : ""}`} />
          </button>

          {studioNavOpen && (
            <div className="ml-4 mt-2 hidden space-y-1 border-l border-white/10 pl-3 md:block">
              {STUDIO_SUBNAV.map((item) => {
                const Icon = item.icon;
                const active = item.id === "projects" ? activeTab === "projects" : activeTab === "studio" && studioPage === item.page;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.id === "projects" ? setActiveTab("projects") : openStudioPage(item.page!)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-white/10 text-white ring-1 ring-blue-400/25" : "text-slate-500 hover:bg-white/[0.055] hover:text-slate-200"}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-indigo-500 text-white" : "bg-white/[0.045] text-slate-500 group-hover:text-sky-300"}`}><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[12px] font-extrabold">{item.label}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{item.helper}</span></span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-sky-300" />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="my-3 hidden h-px bg-white/10 md:block" />

          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`nav-rail-item group relative mt-1 flex min-w-[190px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 md:min-w-0 md:w-full ${active ? "border-blue-400/25 bg-gradient-to-r from-blue-500/15 to-indigo-500/12 text-white shadow-lg shadow-black/20" : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.065] hover:text-white"}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${active ? "bg-blue-500 text-white shadow-md shadow-blue-950/40" : "bg-white/[0.07] text-slate-400 group-hover:bg-white/10 group-hover:text-sky-300"}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold">{item.label}</span>
                  <span className={`mt-0.5 hidden truncate text-[10px] md:block ${active ? "text-sky-100/70" : "text-slate-500 group-hover:text-slate-400"}`}>{item.helper}</span>
                </span>
                <ChevronRight className={`hidden h-4 w-4 transition-transform md:block ${active ? "translate-x-0 text-sky-300" : "-translate-x-1 text-transparent group-hover:translate-x-0 group-hover:text-slate-500"}`} />
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t border-white/10 p-5 md:block">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-sky-400" /> Local workspace</span>
            <span>v13 Professional Race Intelligence</span>
          </div>
        </div>
      </aside>

      <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto" id="swimblock-main-viewport">
        {activeTab !== "studio" && (
          <div className="sticky top-0 z-20 hidden border-b border-slate-200/90 bg-white/90 px-8 py-4 backdrop-blur-xl md:flex md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-indigo-500">SetCraft workspace</p>
              <h1 className="mt-1 font-display text-xl font-extrabold tracking-tight text-slate-950">{currentTitle}</h1>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600">{currentRole} perspective</div>
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
  );
}
