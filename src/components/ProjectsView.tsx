import React, { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Folder,
  FolderOpen,
  FolderPlus,
  Grid2X2,
  List,
  Plus,
  Search,
  Trash2,
  Waves,
  X,
  ArrowRight,
  CalendarDays,
  Layers3,
  Clock3,
  Sparkles,
} from "lucide-react";
import { DEFAULT_PROJECT_FOLDERS, StudioProject } from "../studioProjectTypes";
import { calculateStats, createPaletteNode, StudioSectionNode } from "../swimStudioEngine";

interface ProjectsViewProps {
  onOpenProject: (project: StudioProject) => void;
  onCreateProject: (project: StudioProject) => void;
}

interface NewProjectDraft {
  name: string;
  focus: string;
  phase: string;
  folder: string;
  poolLength: 25 | 50;
  poolUnit: "m" | "yd";
  targetMinutes: number;
}

const readProjects = (): StudioProject[] => {
  try {
    return JSON.parse(localStorage.getItem("setcraft_studio_projects") || "[]") as StudioProject[];
  } catch {
    return [];
  }
};

const readFolders = (projects: StudioProject[]): string[] => {
  try {
    const saved = JSON.parse(localStorage.getItem("setcraft_project_folders") || "[]") as string[];
    return [...new Set([...DEFAULT_PROJECT_FOLDERS, ...saved, ...projects.map((project) => project.folder || "Inbox")])];
  } catch {
    return [...new Set([...DEFAULT_PROJECT_FOLDERS, ...projects.map((project) => project.folder || "Inbox")])];
  }
};

const laneConfig = () => ({
  enabled: true,
  absent: "",
  showLaneSetPlans: true,
  lanes: Array.from({ length: 6 }, (_, index) => ({
    id: `lane-${Date.now()}-${index}`,
    label: `Lane ${index + 1}`,
    defaultPace: "",
    defaultSendOff: "",
    laneNotes: "",
    swimmers: [],
    setAssignments: [],
  })),
});

const deckMeta = () => ({
  sessionCode: "",
  date: new Date().toISOString().slice(0, 10),
  timeRange: "",
  dayLabel: "",
  coaches: "",
  quote: "",
  weekFocus: "",
  todayFocus: "",
  footerNote: "",
  bottomNotes: "",
  goalTimesEnabled: false,
  goalTimeTables: [],
});

const createDraft = (folder: string): NewProjectDraft => ({
  name: "Untitled swim practice",
  focus: "",
  phase: "General preparation",
  folder,
  poolLength: 25,
  poolUnit: "m",
  targetMinutes: 90,
});

export default function ProjectsView({ onOpenProject, onCreateProject }: ProjectsViewProps) {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [folders, setFolders] = useState<string[]>(DEFAULT_PROJECT_FOLDERS);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("All folders");
  const [newFolderName, setNewFolderName] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [draft, setDraft] = useState<NewProjectDraft>(createDraft("Inbox"));
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const loaded = readProjects();
    setProjects(loaded);
    setFolders(readFolders(loaded));
  }, []);

  const persistProjects = (next: StudioProject[]) => {
    setProjects(next);
    localStorage.setItem("setcraft_studio_projects", JSON.stringify(next));
    localStorage.setItem("setcraft_studio_templates", JSON.stringify(next));
  };

  const persistFolders = (next: string[]) => {
    const unique = [...new Set(next.map((item) => item.trim()).filter(Boolean))];
    setFolders(unique);
    localStorage.setItem("setcraft_project_folders", JSON.stringify(unique));
  };

  const createFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    persistFolders([...folders, name]);
    setFolder(name);
    setDraft((current) => ({ ...current, folder: name }));
    setNewFolderName("");
  };

  const removeFolder = (name: string) => {
    if (DEFAULT_PROJECT_FOLDERS.includes(name)) return;
    const used = projects.some((project) => (project.folder || "Inbox") === name);
    if (used) return;
    persistFolders(folders.filter((item) => item !== name));
    if (folder === name) setFolder("All folders");
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesFolder = folder === "All folders" || (project.folder || "Inbox") === folder;
      const matchesSearch = !query || `${project.name} ${project.focus} ${project.phase} ${(project.tags || []).join(" ")}`.toLowerCase().includes(query);
      return matchesFolder && matchesSearch;
    });
  }, [projects, search, folder]);

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => counts.set(project.folder || "Inbox", (counts.get(project.folder || "Inbox") || 0) + 1));
    return counts;
  }, [projects]);

  const totalDistance = useMemo(() => projects.reduce((sum, project) => sum + calculateStats(project.nodes).totalDistance, 0), [projects]);
  const recentProjects = useMemo(() => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3), [projects]);

  const duplicateProject = (project: StudioProject) => {
    const now = new Date().toISOString();
    const copy: StudioProject = { ...project, id: `project-${Date.now()}`, name: `${project.name} copy`, createdAt: now, updatedAt: now };
    persistProjects([copy, ...projects]);
  };

  const deleteProject = (id: string) => persistProjects(projects.filter((project) => project.id !== id));

  const moveProject = (id: string, targetFolder: string) => {
    persistProjects(projects.map((project) => project.id === id ? { ...project, folder: targetFolder, updatedAt: new Date().toISOString() } : project));
  };

  const createProject = () => {
    const now = new Date().toISOString();
    const section = createPaletteNode("section") as StudioSectionNode;
    section.title = "Warm-up";
    section.purpose = "Prepare swimmers for the session";
    const project: StudioProject = {
      id: `project-${Date.now()}`,
      name: draft.name.trim() || "Untitled swim practice",
      focus: draft.focus,
      phase: draft.phase,
      folder: draft.folder || "Inbox",
      tags: [],
      poolLength: draft.poolLength,
      poolUnit: draft.poolUnit,
      targetMinutes: Math.max(10, draft.targetMinutes),
      nodes: [section],
      laneAssignments: laneConfig(),
      deckSheetMeta: deckMeta(),
      createdAt: now,
      updatedAt: now,
    };
    persistProjects([project, ...projects]);
    if (!folders.includes(project.folder)) persistFolders([...folders, project.folder]);
    setNewProjectOpen(false);
    setDraft(createDraft(project.folder));
    onCreateProject(project);
  };

  return (
    <div className="mx-auto w-full max-w-[1900px] space-y-8 pb-20">
      <header className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/10 lg:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-7">
          <div>
            <div className="flex items-center gap-2 text-cyan-300"><FolderOpen className="h-6 w-6" /><span className="text-xs font-extrabold uppercase tracking-[0.2em]">Season workspace</span></div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight lg:text-5xl">Project Hub</h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-300 lg:text-lg">Create practices, build season folders, and reopen every workout as an editable visual program. Your saved work stays organized by phase, squad or meet cycle.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setNewProjectOpen(true)} className="premium-button flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/20 hover:bg-cyan-300"><Plus className="h-5 w-5" /> New project</button>
            <button type="button" onClick={() => document.getElementById("new-folder-field")?.focus()} className="premium-button flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-extrabold text-white hover:bg-white/15"><FolderPlus className="h-5 w-5" /> New folder</button>
          </div>
        </div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[{ label: "Saved projects", value: projects.length.toString(), icon: Layers3 }, { label: "Season folders", value: folders.length.toString(), icon: Folder }, { label: "Programmed volume", value: `${totalDistance.toLocaleString()} m/yd`, icon: Waves }, { label: "Recently edited", value: recentProjects[0]?.name || "No project yet", icon: Clock3 }].map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.065] p-4 backdrop-blur"><div className="flex items-center gap-2 text-slate-400"><Icon className="h-4 w-4 text-cyan-300" /><span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span></div><p className="mt-2 truncate text-lg font-extrabold text-white">{item.value}</p></div>; })}
        </div>
      </header>

      <div className="grid gap-7 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-500">Organization</p><h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Folders</h2></div><FolderPlus className="h-5 w-5 text-indigo-500" /></div>
            <button type="button" onClick={() => setFolder("All folders")} className={`mt-5 flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-extrabold ${folder === "All folders" ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}><span>All projects</span><span className={`rounded-full px-2 py-0.5 text-xs ${folder === "All folders" ? "bg-white/15" : "bg-slate-100"}`}>{projects.length}</span></button>
            <div className="mt-2 max-h-[520px] space-y-1 overflow-y-auto pr-1">
              {folders.map((item) => {
                const count = folderCounts.get(item) || 0;
                return <div key={item} className="group flex items-center gap-1"><button type="button" onClick={() => setFolder(item)} className={`flex min-w-0 flex-1 items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold ${folder === item ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "text-slate-600 hover:bg-slate-50"}`}><span className="flex min-w-0 items-center gap-2"><Folder className="h-4 w-4 shrink-0" /><span className="truncate">{item}</span></span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500 shadow-sm">{count}</span></button>{!DEFAULT_PROJECT_FOLDERS.includes(item) && count === 0 && <button type="button" onClick={() => removeFolder(item)} className="rounded-lg p-2 text-slate-300 opacity-0 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100" title="Delete empty folder"><X className="h-3.5 w-3.5" /></button>}</div>;
              })}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4"><label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Create folder</label><div className="mt-2 flex gap-2"><input id="new-folder-field" value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createFolder(); }} placeholder="e.g. Winter power block" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" /><button type="button" onClick={createFolder} className="rounded-xl bg-slate-950 p-3 text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /></button></div></div>
          </section>

          {recentProjects.length > 0 && <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-cyan-600" /><h2 className="font-display text-lg font-extrabold text-slate-950">Recently edited</h2></div><div className="mt-4 space-y-2">{recentProjects.map((project) => <button key={project.id} type="button" onClick={() => onOpenProject(project)} className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left hover:border-cyan-200 hover:bg-cyan-50"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 group-hover:bg-white"><Waves className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-slate-800">{project.name}</span><span className="mt-0.5 block truncate text-[10px] text-slate-400">{project.folder} · {project.phase}</span></span><ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-cyan-600" /></button>)}</div></section>}
        </aside>

        <main className="space-y-5">
          <section className="flex flex-wrap items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <label className="relative min-w-[260px] flex-1"><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workout name, focus, phase or tag" className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-4 text-base outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" /></label>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1"><button type="button" onClick={() => setView("grid")} className={`rounded-lg p-2.5 ${view === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`} title="Grid view"><Grid2X2 className="h-4 w-4" /></button><button type="button" onClick={() => setView("list")} className={`rounded-lg p-2.5 ${view === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`} title="List view"><List className="h-4 w-4" /></button></div>
          </section>

          <div className="flex items-center justify-between px-1"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-500">{folder}</p><h2 className="mt-1 font-display text-2xl font-extrabold text-slate-950">{filtered.length} project{filtered.length === 1 ? "" : "s"}</h2></div><button type="button" onClick={() => setNewProjectOpen(true)} className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100"><Plus className="h-4 w-4" /> Add project</button></div>

          <div className={view === "grid" ? "grid gap-5 md:grid-cols-2 2xl:grid-cols-3" : "space-y-4"}>
            {filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((project) => {
              const stats = calculateStats(project.nodes);
              return <article key={project.id} className={`professional-card group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm ${view === "list" ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center" : ""}`}>
                <div>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-indigo-700">{project.phase}</span><h3 className="mt-3 truncate font-display text-xl font-extrabold text-slate-950">{project.name}</h3><p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{project.focus || "No training focus written yet."}</p></div><span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-500">{project.folder || "Inbox"}</span></div>
                  <div className="mt-4 flex flex-wrap gap-2">{(project.tags || []).slice(0, 4).map((tag) => <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">#{tag}</span>)}</div>
                </div>
                <div>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center"><div><p className="text-base font-extrabold text-slate-900">{stats.totalDistance.toLocaleString()}</p><p className="text-[9px] font-bold uppercase text-slate-400">{project.poolUnit}</p></div><div><p className="text-base font-extrabold text-slate-900">{stats.estimatedDuration}</p><p className="text-[9px] font-bold uppercase text-slate-400">Minutes</p></div><div><p className="text-base font-extrabold text-slate-900">{stats.setCount}</p><p className="text-[9px] font-bold uppercase text-slate-400">Sets</p></div></div>
                  <label className="mt-3 block"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Move to folder</span><select value={project.folder || "Inbox"} onChange={(event) => moveProject(project.id, event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400">{folders.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2"><button type="button" onClick={() => onOpenProject(project)} className="premium-button flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-extrabold text-white hover:bg-indigo-700">Open in Studio <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => duplicateProject(project)} className="rounded-xl border border-slate-200 p-3 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600" title="Duplicate"><Copy className="h-4 w-4" /></button><button type="button" onClick={() => deleteProject(project.id)} className="rounded-xl border border-slate-200 p-3 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              </article>;
            })}
          </div>

          {filtered.length === 0 && <div className="rounded-[30px] border-2 border-dashed border-slate-300 bg-white p-20 text-center"><FolderOpen className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-5 text-2xl font-extrabold text-slate-800">No projects in this view</h2><p className="mx-auto mt-2 max-w-xl text-base text-slate-500">Create a new project here, or choose another folder. Empty folders remain available so you can plan the season before every workout is written.</p><button type="button" onClick={() => setNewProjectOpen(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Create first project</button></div>}
        </main>
      </div>

      {newProjectOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setNewProjectOpen(false); }}><div className="modal-enter w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-slate-950 to-indigo-950 p-7 text-white"><div><div className="flex items-center gap-2 text-cyan-300"><Sparkles className="h-5 w-5" /><span className="text-xs font-extrabold uppercase tracking-[0.16em]">New workout project</span></div><h2 className="mt-2 font-display text-3xl font-extrabold">Start with the training context.</h2><p className="mt-2 text-sm text-slate-300">The project opens in Project Setup and is saved immediately in your chosen folder.</p></div><button type="button" onClick={() => setNewProjectOpen(false)} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div><div className="space-y-5 p-7"><label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Project name</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="studio-meta-input text-base" autoFocus /></label><label className="block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Training focus</span><textarea value={draft.focus} onChange={(event) => setDraft({ ...draft, focus: event.target.value })} className="studio-meta-input min-h-[100px] resize-y" placeholder="Main objective, event, energy system and coaching priority" /></label><div className="grid gap-4 md:grid-cols-2"><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Season phase</span><select value={draft.phase} onChange={(event) => setDraft({ ...draft, phase: event.target.value })} className="studio-meta-input"><option>General preparation</option><option>Aerobic base</option><option>Endurance</option><option>Threshold</option><option>Power</option><option>Race preparation</option><option>Speed phase</option><option>Taper</option><option>Competition week</option><option>Recovery</option><option>Testing</option></select></label><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Folder</span><select value={draft.folder} onChange={(event) => setDraft({ ...draft, folder: event.target.value })} className="studio-meta-input">{folders.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-3"><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Pool</span><select value={draft.poolLength} onChange={(event) => setDraft({ ...draft, poolLength: Number(event.target.value) as 25 | 50 })} className="studio-meta-input"><option value={25}>25</option><option value={50}>50</option></select></label><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Unit</span><select value={draft.poolUnit} onChange={(event) => setDraft({ ...draft, poolUnit: event.target.value as "m" | "yd" })} className="studio-meta-input"><option value="m">Metres</option><option value="yd">Yards</option></select></label><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Booking</span><input type="number" min={10} max={240} value={draft.targetMinutes} onChange={(event) => setDraft({ ...draft, targetMinutes: Number(event.target.value) || 90 })} className="studio-meta-input" /></label></div></div><div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5"><button type="button" onClick={() => setNewProjectOpen(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" onClick={createProject} className="premium-button flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700">Create and open <ArrowRight className="h-4 w-4" /></button></div></div></div>}
    </div>
  );
}
