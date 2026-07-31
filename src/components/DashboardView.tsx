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
  Users,
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
    { id: "studio", label: "Build a practice", helper: "Open Project Setup and the Scratch-style builder", icon: Blocks, accent: "from-blue-600 to-indigo-700" },
    { id: "projects", label: "Project Hub", helper: "Create folders, duplicate and reopen season projects", icon: FolderKanban, accent: "from-slate-800 to-slate-950" },
    { id: "famous", label: "Workout Library", helper: "Open one of the curated or SetCraft-original templates", icon: BookOpenCheck, accent: "from-cyan-600 to-blue-700" },
    { id: "calculators", label: "Calculator Lab", helper: "Pace, splits, send-offs, CSS, stroke and set math", icon: Calculator, accent: "from-violet-600 to-indigo-700" },
    { id: "calendar", label: "Season Calendar", helper: "Place saved projects into weekly training plans", icon: Calendar, accent: "from-emerald-600 to-teal-700" },
    { id: "copilot", label: "AI Coach", helper: "Generate or revise a draft and convert it to blocks", icon: Sparkles, accent: "from-fuchsia-600 to-violet-700" },
  ];

  return (
    <div className="mx-auto max-w-[1540px] space-y-8" id="coach-dashboard">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-7 text-white shadow-2xl shadow-slate-900/20 md:p-10 xl:p-12">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-200"><span className="h-2 w-2 rounded-full bg-cyan-300" />{currentRole} workspace</span>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Build the practice. Verify the math. Coach the swimmers.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">SetCraft keeps visual blocks, lane versions, project folders, deterministic calculations and the final pool-deck sheet in one workflow.</p>
          </div>
          <button type="button" onClick={() => onNavigateTo("studio")} className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"><Play className="h-4 w-4 fill-current" />Open Swim Studio</button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Saved projects", value: savedWorkoutsCount, icon: FolderKanban },
          { label: "Programmed volume", value: totalDistance.toLocaleString(), icon: Users },
          { label: "Ready-made blocks", value: PALETTE_PRESETS.length, icon: Blocks },
          { label: "Library workouts", value: FAMOUS_WORKOUTS.length, icon: BookOpenCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg md:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></span><span className="mt-5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</span><span className="mt-1 block font-display text-3xl font-extrabold text-slate-950">{value}</span></div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">Start here</p><h2 className="mt-1 font-display text-2xl font-extrabold text-slate-950">Coach tools</h2></div></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map(({ id, label, helper, icon: Icon, accent }) => (
            <button key={id} type="button" onClick={() => onNavigateTo(id)} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl">
              <div className={`h-2 bg-gradient-to-r ${accent}`} />
              <div className="p-6"><div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-indigo-50 group-hover:text-indigo-600"><Icon className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 -translate-x-2 text-slate-300 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></div><h3 className="mt-5 text-lg font-extrabold text-slate-950">{label}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p></div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">Local projects</p><h2 className="mt-1 font-display text-2xl font-extrabold text-slate-950">Recently edited</h2></div><button type="button" onClick={() => onNavigateTo("projects")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:border-indigo-300 hover:text-indigo-700">View all</button></div>
          <div className="mt-6 space-y-3">
            {mostRecent.length ? mostRecent.map((project) => {
              const stats = calculateStats(project.nodes || []);
              return <button key={project.id} type="button" onClick={() => onNavigateTo("projects")} className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-indigo-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-center sm:justify-between"><div><span className="text-sm font-extrabold text-slate-950">{project.name}</span><p className="mt-1 text-xs text-slate-500">{project.folder} · {project.phase}</p></div><div className="flex gap-2 text-[10px] font-extrabold text-slate-600"><span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">{stats.totalDistance.toLocaleString()} {project.poolUnit}</span><span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">{stats.estimatedDuration} min</span></div></button>;
            }) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><FolderKanban className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-extrabold text-slate-700">No saved projects yet</p><button type="button" onClick={() => onNavigateTo("studio")} className="mt-3 text-sm font-extrabold text-indigo-600">Create the first practice →</button></div>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300"><FileDown className="h-5 w-5" /></span>
          <h2 className="mt-6 font-display text-2xl font-extrabold">Competition-ready workflow</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <p className="flex gap-3"><span className="font-extrabold text-cyan-300">1</span>Build nested sections, repeats and conditions.</p>
            <p className="flex gap-3"><span className="font-extrabold text-cyan-300">2</span>Assign lane paces, swimmers and set-specific overrides.</p>
            <p className="flex gap-3"><span className="font-extrabold text-cyan-300">3</span>Review totals and warnings, then export the deck sheet.</p>
          </div>
          <div className="mt-7 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-xs text-slate-300"><Clock3 className="h-4 w-4 text-cyan-300" />Projects auto-save locally while you work.</div>
        </div>
      </section>
    </div>
  );
}
