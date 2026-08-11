import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  Filter,
  Gauge,
  Search,
  Sparkles,
  Plus,
  Trash2,
  UserRound,
  Waves,
  X,
  Eye,
  LibraryBig,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { FAMOUS_WORKOUTS, FAMOUS_WORKOUT_TAGS, FamousWorkout } from "../famousWorkouts";
import { calculateStats, cloneNode, formatWorkoutText } from "../swimStudioEngine";
import { StudioProject } from "../studioProjectTypes";

interface FamousSetsViewProps {
  onOpenWorkout: (workout: FamousWorkout) => void;
}

const levelClass: Record<FamousWorkout["level"], string> = {
  Beginner: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Intermediate: "bg-blue-100 text-blue-800 ring-blue-200",
  Advanced: "bg-amber-100 text-amber-900 ring-amber-200",
  Elite: "bg-rose-100 text-rose-800 ring-rose-200",
};

function safeArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`Could not read ${key}`, error);
    return [];
  }
}

export default function FamousSetsView({ onOpenWorkout }: FamousSetsViewProps) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("All levels");
  const [tag, setTag] = useState<string>("All focuses");
  const [selected, setSelected] = useState<FamousWorkout | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [coachWorkouts, setCoachWorkouts] = useState<FamousWorkout[]>([]);
  const [savedProjects, setSavedProjects] = useState<StudioProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const coachLibrary = safeArray<FamousWorkout>("setcraft_coach_famous_sets").filter((item) => item?.id && item?.title && Array.isArray(item?.nodes));
    const projects = safeArray<StudioProject>("setcraft_studio_projects").filter((item) => item?.id && item?.name && Array.isArray(item?.nodes));
    setCoachWorkouts(coachLibrary);
    setSavedProjects(projects);
    setSelectedProjectId(projects[0]?.id || "");
    setSelected((current) => current || coachLibrary[0] || FAMOUS_WORKOUTS[0] || null);
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [previewOpen]);

  const allWorkouts = useMemo(() => [...coachWorkouts, ...FAMOUS_WORKOUTS].filter((workout): workout is FamousWorkout => Boolean(workout?.id && workout?.title && Array.isArray(workout?.nodes))), [coachWorkouts]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allWorkouts.filter((workout) => {
      const haystack = `${workout.title} ${workout.subtitle} ${workout.attribution} ${workout.sourceName} ${workout.focus} ${workout.phase} ${workout.tags.join(" ")}`.toLowerCase();
      return (!query || haystack.includes(query))
        && (level === "All levels" || workout.level === level)
        && (tag === "All focuses" || workout.tags.includes(tag));
    });
  }, [allWorkouts, level, search, tag]);

  const openPreview = (workout: FamousWorkout) => {
    setSelected(workout);
    setPreviewOpen(true);
  };

  const addCoachWorkout = () => {
    const project = savedProjects.find((item) => item.id === selectedProjectId);
    if (!project) return;
    const workout: FamousWorkout = {
      id: `coach-${project.id}`,
      title: project.name,
      subtitle: project.focus || "Coach-created editable workout",
      attribution: "Added by the coach from SetCraft Projects",
      sourceName: "Coach Library",
      sourceUrl: "",
      level: "Advanced",
      focus: project.focus,
      phase: project.phase,
      durationMinutes: project.targetMinutes,
      poolLength: project.poolLength,
      poolUnit: project.poolUnit,
      tags: [...new Set(["Coach-created", project.phase, ...(project.tags || [])])],
      disclaimer: "Coach-created workout. Review suitability, intervals and safety for the assigned swimmers.",
      nodes: project.nodes.map(cloneNode),
    };
    const updated = [workout, ...coachWorkouts.filter((item) => item.id !== workout.id)];
    setCoachWorkouts(updated);
    localStorage.setItem("setcraft_coach_famous_sets", JSON.stringify(updated));
    setAddOpen(false);
    openPreview(workout);
  };

  const deleteCoachWorkout = (id: string) => {
    const updated = coachWorkouts.filter((item) => item.id !== id);
    setCoachWorkouts(updated);
    localStorage.setItem("setcraft_coach_famous_sets", JSON.stringify(updated));
    if (selected?.id === id) {
      setSelected(FAMOUS_WORKOUTS[0] || null);
      setPreviewOpen(false);
    }
  };

  const selectedStats = selected ? calculateStats(selected.nodes) : null;
  const selectedText = selected ? formatWorkoutText(selected.nodes, selected.poolUnit) : "";

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-6">
      <header className="hero-panel relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-slate-900/15">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative grid gap-7 px-7 py-8 md:grid-cols-[1fr_auto] md:items-end md:px-10 md:py-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-200">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Curated + coach-created library</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">Famous Sets</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              Preview a complete practice in a real pop-up, open it as editable visual blocks, customize it for your lanes, and save the result as a new project.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <MetricTile value={allWorkouts.length} label="Practices" />
            <MetricTile value={coachWorkouts.length} label="Coach sets" />
            <MetricTile value={FAMOUS_WORKOUT_TAGS.length} label="Focus tags" />
          </div>
        </div>
      </header>

      <section className="professional-card rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-cyan-50 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><UserRound className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-slate-950">Coach Library</h2>
            <p className="mt-1 text-sm text-slate-600">Turn any saved SetCraft project into a reusable library workout.</p>
          </div>
          <button type="button" onClick={() => setAddOpen((value) => !value)} className="premium-button flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add my workout
          </button>
        </div>
        {addOpen && (
          <div className="mt-4 grid gap-3 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]">
            <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
              <option value="">Choose a saved project</option>
              {savedProjects.map((project) => <option key={project.id} value={project.id}>{project.folder} / {project.name}</option>)}
            </select>
            <button type="button" disabled={!selectedProjectId} onClick={addCoachWorkout} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-extrabold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40">Add to library</button>
            {savedProjects.length === 0 && <p className="md:col-span-2 text-sm text-slate-500">Save a workout project in Swim Studio first, then return here.</p>}
          </div>
        )}
      </section>

      <section className="professional-card rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Find the right practice</h2>
          <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{filtered.length} results</span>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_210px_240px]">
          <label className="relative block">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coach, stroke, phase or focus" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-50" />
          </label>
          <label className="relative block">
            <Gauge className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <select value={level} onChange={(event) => setLevel(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-50">
              <option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Elite</option>
            </select>
          </label>
          <label className="relative block">
            <Filter className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <select value={tag} onChange={(event) => setTag(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-50">
              <option>All focuses</option>{FAMOUS_WORKOUT_TAGS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((workout) => {
          const stats = calculateStats(workout.nodes);
          return (
            <article key={workout.id} className="workout-library-card group relative flex min-h-[330px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-2xl hover:shadow-slate-900/10">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-1 ${levelClass[workout.level]}`}>{workout.level}</span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{workout.sourceName}</span>
                  {workout.sourceName === "Coach Library" && <button type="button" onClick={() => deleteCoachWorkout(workout.id)} className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600" title="Remove from Coach Library"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </div>
              <h2 className="mt-5 font-display text-xl font-extrabold leading-snug text-slate-950">{workout.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{workout.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">{workout.tags.slice(0, 4).map((item) => <span key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">{item}</span>)}</div>
              <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-center">
                <CardStat value={stats.totalDistance.toLocaleString()} label={workout.poolUnit} />
                <CardStat value={workout.durationMinutes} label="Minutes" />
                <CardStat value={workout.nodes.length} label="Sections" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openPreview(workout)} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-extrabold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"><Eye className="h-4 w-4" /> Preview</button>
                <button type="button" onClick={() => onOpenWorkout(workout)} className="premium-button flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-sm font-extrabold text-white shadow-md hover:bg-indigo-700">Open in Studio <ArrowRight className="h-4 w-4" /></button>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-300 bg-white p-16 text-center"><LibraryBig className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-4 text-base font-bold text-slate-700">No workout matches those filters.</p><button type="button" onClick={() => { setSearch(""); setLevel("All levels"); setTag("All focuses"); }} className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Clear filters</button></div>}
      </section>

      {previewOpen && selected && selectedStats && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm md:p-7" role="dialog" aria-modal="true" aria-label={`${selected.title} preview`} onMouseDown={(event) => { if (event.currentTarget === event.target) setPreviewOpen(false); }}>
          <div className="modal-enter grid max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl md:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-h-0 overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-start gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur-xl">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-white shadow-lg"><BookOpen className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-500">Practice preview</p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold text-slate-950">{selected.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.attribution}</p>
                </div>
                <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:rotate-3 hover:bg-slate-100 hover:text-slate-900" title="Close preview"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 md:p-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <pre className="whitespace-pre-wrap font-mono text-[12px] leading-7 text-slate-700">{selectedText}</pre>
                </div>
              </div>
            </div>
            <aside className="border-l border-slate-200 bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-2 text-cyan-300"><Waves className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">Workout summary</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <DarkStat value={`${selectedStats.totalDistance.toLocaleString()}${selected.poolUnit}`} label="Distance" />
                <DarkStat value={`${selected.durationMinutes} min`} label="Booking" />
                <DarkStat value={`${selected.poolLength}${selected.poolUnit}`} label="Pool" />
                <DarkStat value={selected.level} label="Level" />
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <p className="text-xs font-extrabold text-white">Focus</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{selected.focus}</p>
                <p className="mt-4 text-xs font-extrabold text-white">Phase</p>
                <p className="mt-2 text-sm text-slate-300">{selected.phase}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">{selected.tags.map((item) => <span key={item} className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-slate-300">{item}</span>)}</div>
              <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-xs leading-5 text-amber-100">{selected.disclaimer}</div>
              <div className="mt-6 space-y-3">
                <button type="button" onClick={() => onOpenWorkout(selected)} className="premium-button flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3.5 text-sm font-extrabold text-slate-950 hover:bg-cyan-300"><CheckCircle2 className="h-4 w-4" /> Open and edit in Studio</button>
                {selected.sourceUrl ? <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white hover:bg-white/10">Read source <ExternalLink className="h-4 w-4" /></a> : <div className="flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-400">Coach-created practice</div>}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTile({ value, label }: { value: React.ReactNode; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur"><p className="text-2xl font-extrabold">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p></div>;
}

function CardStat({ value, label }: { value: React.ReactNode; label: string }) {
  return <div><p className="text-base font-extrabold text-slate-950">{value}</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p></div>;
}

function DarkStat({ value, label }: { value: React.ReactNode; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3"><p className="text-base font-extrabold text-white">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p></div>;
}
