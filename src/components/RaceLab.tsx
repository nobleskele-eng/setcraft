import React, { useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, BadgeCheck, BarChart3, BookOpen, CheckCircle2,
  ChevronRight, CircleAlert, Database, FileJson, Filter, Gauge, GitCompareArrows,
  Info, Link2, Medal, Plus, Scale, Search, ShieldCheck, Sparkles, Target, Trash2,
  Upload, UserRoundPlus, Waves,
} from "lucide-react";
import {
  Course, EVENTS, MEN_200_FREE_REFERENCES, OFFICIAL_SOURCES, RaceReference,
  ReferenceLevel, SexCategory, SWIMCLOUD_REQUEST, classifyAbsolute,
  closestReference, confidenceScore, defaultCheckpoints, formatTime,
  getAgeBand, getDerivedReferences, modelStandard,
  parseCumulativeSplits, scaledModel, segmentsFromCumulative, timeToSeconds,
} from "../raceModel";
import { WORLDS_2025_REFERENCES } from "../generated/worlds2025References";

type LabTab = "analyze" | "library" | "contribute" | "method";
type LibraryKind = "all" | "derived" | "observed" | "coach";

const LEVELS: ReferenceLevel[] = ["Sectionals", "Nationals", "Trials", "World Class"];
const OBSERVED_REFERENCES = [...WORLDS_2025_REFERENCES, ...MEN_200_FREE_REFERENCES];
const levelStyles: Record<ReferenceLevel, string> = {
  Sectionals: "bg-sky-50 text-sky-700 ring-sky-200",
  Nationals: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Trials: "bg-violet-50 text-violet-700 ring-violet-200",
  "World Class": "bg-amber-50 text-amber-800 ring-amber-200",
};

function downloadText(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function MiniMetric({ label, value, helper, tone = "blue" }: { label: string; value: string; helper: string; tone?: "blue" | "violet" | "amber" | "emerald" }) {
  const tones = { blue: "from-blue-500 to-cyan-500", violet: "from-violet-500 to-indigo-500", amber: "from-amber-400 to-orange-500", emerald: "from-emerald-400 to-teal-500" };
  return <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-inner shadow-white/5">
    <span className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${tones[tone]}`} />
    <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
    <p className="mt-1 text-xs leading-relaxed text-slate-400">{helper}</p>
  </div>;
}

function InputLabel({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-extrabold uppercase tracking-wide text-slate-500 ${className}`}>{label}{children}</label>;
}

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function parseImportedCsv(value: string): RaceReference[] {
  const lines = value.trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(lines[0]?.toLowerCase().startsWith("swimmer,") ? 1 : 0).map((line, index) => {
    const [swimmer, event, sex, course, age, level, total, checkpointsText, splitList, meet, archetype, sourceUrl] = line.split(",").map((item) => item.trim());
    const cumulative = (splitList || "").split("|").map(timeToSeconds).filter(Boolean);
    const checkpoints = (checkpointsText || "").split("|").map(Number).filter((item) => item > 0);
    const parsedTotal = timeToSeconds(total);
    return {
      id: `coach-${Date.now()}-${index}`, swimmer: swimmer || `Coach reference ${index + 1}`,
      event: EVENTS.includes(event as typeof EVENTS[number]) ? event : "200 Free",
      sex: sex === "Women" ? "Women" : "Men", course: course === "SCY" ? "SCY" : "LCM",
      age: Number(age) || undefined, meet: meet || "Coach contribution", date: new Date().toISOString().slice(0, 10),
      level: LEVELS.includes(level as ReferenceLevel) ? level as ReferenceLevel : "Sectionals",
      total: parsedTotal || cumulative.at(-1) || 0, cumulative,
      checkpoints: checkpoints.length === cumulative.length ? checkpoints : defaultCheckpoints(event || "200 Free").slice(0, cumulative.length),
      archetype: archetype || "Coach race", sourceName: sourceUrl ? "Coach-supplied result" : "Coach contribution",
      sourceUrl: sourceUrl || "", verification: "manual", dataClass: "coach",
      notes: "Coach-added record. Keep pending until a meet result or authorized team file is checked.",
    } as RaceReference;
  }).filter((race) => race.total > 0 && race.cumulative.length > 0);
}

function CheckpointStrip({ race, compact = false }: { race: RaceReference; compact?: boolean }) {
  const segments = segmentsFromCumulative(race.cumulative);
  return <div className={`grid gap-2 ${compact ? "grid-flow-col auto-cols-[112px]" : "grid-flow-col auto-cols-[128px]"}`}>
    {race.checkpoints.map((point, index) => <div key={`${race.id}-${point}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{point} m</p>
      <p className="mt-1 font-mono text-sm font-black text-slate-900">{formatTime(race.cumulative[index])}</p>
      <p className="mt-1 font-mono text-[10px] text-slate-500">segment {formatTime(segments[index])}</p>
    </div>)}
  </div>;
}

function ReferenceCard({ race, onDelete }: { race: RaceReference; onDelete?: () => void }) {
  const derived = race.dataClass === "derived";
  const official = race.verification === "official";
  return <article className="professional-card overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm">
    <div className="p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${derived ? "bg-indigo-50 text-indigo-600" : official ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            {derived ? <Sparkles className="h-6 w-6" /> : official ? <BadgeCheck className="h-6 w-6" /> : <CircleAlert className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1 ${levelStyles[race.level]}`}>{race.level}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{derived ? "Modeled" : official ? "Observed" : "Coach-added"}</span>
            </div>
            <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">{derived ? race.archetype : race.swimmer}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{race.sex} · {race.event} · {race.course}{!derived && race.nation ? ` · ${race.nation}` : ""}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Final</p>
            <p className="mt-1 font-mono text-xl font-black">{formatTime(race.total)}</p>
          </div>
          {onDelete && <button type="button" onClick={onDelete} aria-label={`Delete ${race.swimmer}`} className="rounded-xl border border-rose-200 p-3 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}
        </div>
      </div>
      {derived ? <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Race plan</p><p className="mt-2 text-sm leading-6 text-slate-700">{race.strategyDescription}</p></div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Best for</p><p className="mt-2 text-sm leading-6 text-emerald-950">{race.bestFor}</p></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">Main risk</p><p className="mt-2 text-sm leading-6 text-amber-950">{race.risk}</p></div>
      </div> : <p className="mt-4 text-sm leading-6 text-slate-600">{race.meet} · {race.date}{race.reactionTime ? ` · ${race.reactionTime.toFixed(2)} reaction` : ""}</p>}
    </div>
    <div className="overflow-x-auto border-y border-slate-100 bg-slate-50/60 p-4 md:px-6"><CheckpointStrip race={race} compact /></div>
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:px-6">
      <p className="max-w-3xl text-xs leading-5 text-slate-500">{race.notes}</p>
      {race.sourceUrl ? <a href={race.sourceUrl} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800">{race.sourceName}<Link2 className="h-3.5 w-3.5" /></a> : <span className="text-xs font-bold text-amber-700">No source attached</span>}
    </div>
  </article>;
}

export default function RaceLab() {
  const [tab, setTab] = useState<LabTab>("analyze");
  const [event, setEvent] = useState("200 Free");
  const [sex, setSex] = useState<SexCategory>("Men");
  const course: Course = "LCM";
  const [age, setAge] = useState(15);
  const [timeInput, setTimeInput] = useState("1:56.00");
  const [splitInput, setSplitInput] = useState("27.20, 56.50, 1:26.20, 1:56.00");
  const [targetLevel, setTargetLevel] = useState<ReferenceLevel>("Nationals");
  const [referenceId, setReferenceId] = useState("");
  const [customReferences, setCustomReferences] = useState<RaceReference[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("setcraft_race_references_v2") || localStorage.getItem("setcraft_race_references") || "[]"); } catch { return []; }
  });
  const [libraryEvent, setLibraryEvent] = useState("All events");
  const [librarySex, setLibrarySex] = useState("All categories");
  const [libraryLevel, setLibraryLevel] = useState("All levels");
  const [libraryKind, setLibraryKind] = useState<LibraryKind>("all");
  const [librarySearch, setLibrarySearch] = useState("");
  const [showCount, setShowCount] = useState(18);
  const [csvInput, setCsvInput] = useState("");
  const [importNotice, setImportNotice] = useState("");
  const [coachForm, setCoachForm] = useState({ swimmer: "", event: "200 Free", sex: "Men" as SexCategory, age: "", level: "Sectionals" as ReferenceLevel, total: "", checkpoints: "50|100|150|200", splits: "", meet: "", archetype: "", sourceUrl: "" });

  const saveCustom = (next: RaceReference[]) => {
    setCustomReferences(next);
    localStorage.setItem("setcraft_race_references_v2", JSON.stringify(next));
  };

  const strategyModels = useMemo(() => getDerivedReferences(event, sex, age), [event, sex, age]);
  const levelModels = strategyModels.filter((race) => race.level === targetLevel);
  const selectedReference = levelModels.find((race) => race.id === referenceId) || levelModels[0] || null;
  const total = timeToSeconds(timeInput);
  const cumulative = useMemo(() => parseCumulativeSplits(splitInput, total), [splitInput, total]);
  const inputSegments = useMemo(() => segmentsFromCumulative(cumulative), [cumulative]);
  const checkpoints = defaultCheckpoints(event);
  const eligibleObserved = [...OBSERVED_REFERENCES, ...customReferences].filter((race) => race.event === event && race.sex === sex && race.course === course && race.cumulative.length === cumulative.length);
  const closest = eligibleObserved.length ? closestReference(cumulative, total, eligibleObserved) : null;
  const targetTotal = modelStandard(targetLevel, event, sex, age).time || total;
  const targetCumulative = selectedReference ? scaledModel(selectedReference, targetTotal) : [];
  const targetSegments = segmentsFromCumulative(targetCumulative);
  const absolute = classifyAbsolute(total, event, sex, age);
  const ageBand = getAgeBand(total, age, sex, event);
  const confidence = confidenceScore(event, course, cumulative, total);
  const deltas = checkpoints.map((_, index) => (inputSegments[index] ?? 0) - (targetSegments[index] ?? 0));
  const leakIndex = deltas.length ? deltas.reduce((best, value, index, array) => value > array[best] ? index : best, 0) : 0;
  const splitCompleteness = `${Math.min(cumulative.length, checkpoints.length)}/${checkpoints.length}`;
  const nextGap = absolute.nextCut ? total - absolute.nextCut : 0;

  const allDerived = useMemo(() => EVENTS.flatMap((item) => (["Men", "Women"] as SexCategory[]).flatMap((category) => getDerivedReferences(item, category, age))), [age]);
  const allLibrary = [...allDerived, ...OBSERVED_REFERENCES, ...customReferences];
  const filteredLibrary = allLibrary.filter((race) => {
    const kind = race.dataClass || (race.verification === "official" ? "observed" : "coach");
    const haystack = `${race.swimmer} ${race.event} ${race.sex} ${race.level} ${race.archetype} ${race.meet}`.toLowerCase();
    return (libraryEvent === "All events" || race.event === libraryEvent)
      && (librarySex === "All categories" || race.sex === librarySex)
      && (libraryLevel === "All levels" || race.level === libraryLevel)
      && (libraryKind === "all" || kind === libraryKind)
      && (!librarySearch.trim() || haystack.includes(librarySearch.toLowerCase()));
  });

  const setEventEverywhere = (nextEvent: string) => {
    setEvent(nextEvent); setReferenceId("");
    const points = defaultCheckpoints(nextEvent);
    setSplitInput("");
    setCoachForm((current) => ({ ...current, event: nextEvent, checkpoints: points.join("|") }));
  };

  const loadTargetExample = () => {
    if (!selectedReference || !targetTotal) return;
    const exampleTotal = Math.round(targetTotal * 1.045 * 100) / 100;
    setTimeInput(formatTime(exampleTotal));
    setSplitInput(scaledModel(selectedReference, exampleTotal).map((value) => formatTime(value)).join(", "));
  };

  const addCoachReference = () => {
    const totalSeconds = timeToSeconds(coachForm.total);
    const cumulativeValues = coachForm.splits.split("|").map(timeToSeconds).filter(Boolean);
    const checkpointValues = coachForm.checkpoints.split("|").map(Number).filter((value) => value > 0);
    if (!coachForm.swimmer.trim() || !totalSeconds || !cumulativeValues.length || cumulativeValues.length !== checkpointValues.length) {
      setImportNotice("Add an athlete/reference label, final time, and the same number of checkpoint distances and cumulative splits."); return;
    }
    if (Math.abs((cumulativeValues.at(-1) || 0) - totalSeconds) > 0.11) {
      setImportNotice("The final cumulative split must match the final time within 0.10 seconds."); return;
    }
    if (cumulativeValues.some((value, index) => index > 0 && value <= cumulativeValues[index - 1])) {
      setImportNotice("Cumulative splits must increase at every checkpoint."); return;
    }
    const race: RaceReference = {
      id: `coach-${Date.now()}`, swimmer: coachForm.swimmer.trim(), event: coachForm.event,
      sex: coachForm.sex, course: "LCM", age: Number(coachForm.age) || undefined,
      meet: coachForm.meet.trim() || "Coach contribution", date: new Date().toISOString().slice(0, 10), level: coachForm.level,
      total: totalSeconds, cumulative: cumulativeValues, checkpoints: checkpointValues,
      archetype: coachForm.archetype.trim() || "Coach race", sourceName: coachForm.sourceUrl ? "Coach-supplied result" : "No source attached",
      sourceUrl: coachForm.sourceUrl.trim(), verification: "manual", dataClass: "coach",
      notes: "Coach-added record. Pending verification against the attached result or an authorized team file.",
    };
    saveCustom([...customReferences, race]);
    setCoachForm((current) => ({ ...current, swimmer: "", total: "", splits: "", meet: "", archetype: "", sourceUrl: "" }));
    setImportNotice("Coach reference added to this device. It remains visibly pending until verified.");
  };

  const importRaces = () => {
    try {
      const races = parseImportedCsv(csvInput);
      if (!races.length) throw new Error("No valid rows found.");
      saveCustom([...customReferences, ...races]);
      setCsvInput("");
      setImportNotice(`${races.length} coach reference${races.length === 1 ? "" : "s"} added as pending verification.`);
    } catch (error) { setImportNotice(error instanceof Error ? error.message : "Could not import that data."); }
  };

  const resultPayload = {
    schema: "setcraft.race-analysis.v2", generatedAt: new Date().toISOString(), event, sex, course, age,
    swim: { totalSeconds: total, formatted: formatTime(total), checkpoints, cumulative, segments: inputSegments },
    result: { absoluteLevel: absolute.achieved, nextLevel: absolute.next, gapSeconds: nextGap, ageBand: ageBand.label, confidence },
    closestObservedReference: closest ? { id: closest.id, swimmer: closest.swimmer, archetype: closest.archetype, source: closest.sourceUrl } : null,
    target: { level: targetLevel, totalSeconds: targetTotal, cumulative: targetCumulative, segments: targetSegments, basedOn: selectedReference?.id },
  };

  return <div className="mx-auto max-w-[1580px] space-y-6 pb-16">
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/60 md:p-8 xl:p-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-80 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="relative grid gap-8 xl:grid-cols-[1.1fr_.9fr] xl:items-end">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-200"><Activity className="h-4 w-4" /> Race intelligence lab · v2</span>
          <h2 className="mt-5 max-w-4xl font-display text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">Every race has a shape. Find yours.</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">All individual LCM events, exact-age context, multiple strategies at every level, recent observed medal races and coach-extensible references—with modeled and measured data kept visibly separate.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label="All-events models" value="408" helper="17 events × 2 categories × 4 levels × 3 strategies" tone="blue" />
          <MiniMetric label="Recent observed races" value={`${WORLDS_2025_REFERENCES.length}`} helper="2025 Worlds medal performances from official Lenex" tone="violet" />
          <MiniMetric label="Checkpoint rule" value="15 → 50" helper="15/25/35 for 50s · 25s for 100s · 50s for 200+" tone="emerald" />
          <MiniMetric label="Age engine" value="10–18" helper="Every LCM event published in USA Swimming single-age standards" tone="amber" />
        </div>
      </div>
    </section>

    <div className="sticky top-3 z-20 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-200/50 backdrop-blur" role="tablist" aria-label="Race Lab sections">
      {([ ["analyze", "Analyze a swim", GitCompareArrows], ["library", "Reference library", Database], ["contribute", "Coach contributions", UserRoundPlus], ["method", "Data & method", ShieldCheck] ] as const).map(([id, label, Icon]) =>
        <button key={id} type="button" onClick={() => setTab(id)} role="tab" aria-selected={tab === id} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold ${tab === id ? "bg-slate-950 text-white shadow-md" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon className="h-4 w-4" />{label}</button>)}
    </div>

    {tab === "analyze" && <div className="grid gap-6 2xl:grid-cols-[410px_minmax(0,1fr)]">
      <aside className="h-fit space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/45 2xl:sticky 2xl:top-24">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">Race input</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Swimmer performance</h3></div><button type="button" onClick={loadTargetExample} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">Load model example</button></div>
        <div className="grid grid-cols-2 gap-3">
          <InputLabel label="Event" className="col-span-2"><select value={event} onChange={(e) => setEventEverywhere(e.target.value)} className={inputClass}>{EVENTS.map((item) => <option key={item}>{item}</option>)}</select></InputLabel>
          <InputLabel label="Category"><select value={sex} onChange={(e) => { setSex(e.target.value as SexCategory); setReferenceId(""); }} className={inputClass}><option>Men</option><option>Women</option></select></InputLabel>
          <InputLabel label="Age"><input type="number" min={8} max={99} value={age} onChange={(e) => setAge(Number(e.target.value))} className={inputClass} /></InputLabel>
          <InputLabel label="Course"><input value={course} readOnly className={`${inputClass} bg-slate-50 text-slate-600`} /></InputLabel>
          <InputLabel label="Final time"><input value={timeInput} onChange={(e) => setTimeInput(e.target.value)} placeholder="1:56.00" className={`${inputClass} font-mono`} /></InputLabel>
        </div>
        <InputLabel label="Required cumulative checkpoints"><div className="mt-2 flex flex-wrap gap-1.5">{checkpoints.map((point) => <span key={point} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-black text-blue-700">{point} m</span>)}</div><textarea value={splitInput} onChange={(e) => setSplitInput(e.target.value)} rows={4} placeholder={checkpoints.map((point) => `${point} m`).join(", ")} className={`${inputClass} resize-none font-mono leading-6`} /><span className="mt-1.5 block text-[11px] font-medium normal-case tracking-normal text-slate-400">Enter cumulative times in checkpoint order, separated by commas.</span></InputLabel>
        <div className="h-px bg-slate-100" />
        <InputLabel label="Target level"><select value={targetLevel} onChange={(e) => { setTargetLevel(e.target.value as ReferenceLevel); setReferenceId(""); }} className={inputClass}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></InputLabel>
        <InputLabel label="Race strategy"><select value={selectedReference?.id || ""} onChange={(e) => setReferenceId(e.target.value)} className={inputClass}>{levelModels.map((race) => <option key={race.id} value={race.id}>{race.archetype}</option>)}</select><span className="mt-2 block text-[11px] font-medium normal-case leading-5 tracking-normal text-slate-500">{selectedReference?.strategyDescription}</span></InputLabel>
        <button type="button" onClick={() => downloadText("setcraft-race-analysis.json", JSON.stringify(resultPayload, null, 2))} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><FileJson className="h-4 w-4" /> Export analysis JSON</button>
      </aside>

      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="professional-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Medal className="h-5 w-5" /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Absolute</span></div><p className="mt-4 text-2xl font-black tracking-tight text-slate-950">{absolute.achieved}</p><p className="mt-1 text-xs leading-5 text-slate-500">{absolute.next ? `${formatTime(Math.max(0, nextGap))} from ${absolute.next}` : "Highest populated reference reached"}</p></div>
          <div className="professional-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Sparkles className="h-5 w-5" /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Age {age}</span></div><p className="mt-4 text-2xl font-black tracking-tight text-slate-950">{ageBand.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{ageBand.source}</p></div>
          <div className="professional-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Waves className="h-5 w-5" /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Closest observed</span></div><p className="mt-4 truncate text-xl font-black tracking-tight text-slate-950">{closest?.archetype || "Add comparable race"}</p><p className="mt-1 truncate text-xs leading-5 text-slate-500">{closest ? `${closest.swimmer} · ${closest.meet}` : "No measured race has matching checkpoints"}</p></div>
          <div className="professional-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Gauge className="h-5 w-5" /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Input quality</span></div><p className="mt-4 text-2xl font-black tracking-tight text-slate-950">{confidence}%</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500" style={{ width: `${confidence}%` }} /></div><p className="mt-2 text-xs text-slate-500">{splitCompleteness} required checkpoints · {course}</p></div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">Split comparison</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Your race vs {selectedReference?.archetype}</h3></div><span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ${levelStyles[targetLevel]}`}>Target {formatTime(targetTotal || 0)}</span></div>
            <div className="max-h-[680px] overflow-auto"><table className="w-full min-w-[680px] text-left"><thead className="sticky top-0 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500"><tr><th className="px-6 py-4">Checkpoint</th><th className="px-4 py-4">Your cumulative</th><th className="px-4 py-4">Your segment</th><th className="px-4 py-4">Target segment</th><th className="px-6 py-4 text-right">Delta</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{checkpoints.map((checkpoint, index) => { const delta = cumulative[index] == null ? null : deltas[index]; return <tr key={checkpoint} className={index === leakIndex && (delta || 0) > 0 ? "bg-rose-50/60" : "hover:bg-slate-50/70"}><td className="px-6 py-4 text-sm font-black text-slate-900">{checkpoint} m</td><td className="px-4 py-4 font-mono text-sm font-bold text-slate-700">{formatTime(cumulative[index] || 0)}</td><td className="px-4 py-4 font-mono text-sm font-bold text-slate-700">{formatTime(inputSegments[index] || 0)}</td><td className="px-4 py-4 font-mono text-sm font-bold text-indigo-700">{formatTime(targetSegments[index] || 0)}</td><td className={`px-6 py-4 text-right font-mono text-sm font-black ${delta == null ? "text-slate-300" : delta <= 0 ? "text-emerald-600" : "text-rose-600"}`}>{delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)}`}</td></tr>; })}</tbody>
            </table></div><div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-xs leading-5 text-slate-500"><strong className="text-slate-700">Interpretation:</strong> positive delta means that segment was slower than the selected model. These checkpoints are a strategy scaled to the target level—not a claim that every successful swimmer races identically.</div>
          </article>
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600">Race shape</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Segment pressure map</h3></div><BarChart3 className="h-6 w-6 text-slate-300" /></div>
            <div className="mt-6 max-h-[520px] space-y-4 overflow-auto pr-1">{checkpoints.map((checkpoint, index) => { const entered = inputSegments[index]; const target = targetSegments[index] || 1; const ratio = entered ? Math.min(135, Math.max(65, entered / target * 100)) : 0; return <div key={checkpoint}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-extrabold text-slate-700">{checkpoints[index - 1] || 0}–{checkpoint} m</span><span className={`font-mono font-black ${!entered ? "text-slate-300" : ratio <= 100 ? "text-emerald-600" : "text-rose-600"}`}>{entered ? `${ratio.toFixed(1)}% of target` : "not entered"}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${ratio <= 100 ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-amber-400 to-rose-500"}`} style={{ width: `${Math.min(100, ratio / 1.35)}%` }} /></div></div>; })}</div>
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-3"><Target className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><div><p className="text-sm font-black text-slate-900">Largest opportunity</p><p className="mt-1 text-sm leading-6 text-slate-600">{cumulative[leakIndex] != null && deltas[leakIndex] > 0 ? `The ${checkpoints[leakIndex - 1] || 0}–${checkpoints[leakIndex]} m segment is ${deltas[leakIndex].toFixed(2)} s outside this model.` : "Enter every checkpoint to identify the largest segment gap."}</p></div></div></div>
          </article>
        </div>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">Four reference points</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">American ladder · {sex.toLowerCase()} · {event} · LCM</h3></div><p className="max-w-lg text-right text-xs leading-5 text-slate-500">For non-Olympic 50 back/breast/fly, Trials is a clearly labeled equivalent between Nationals and the 2025 Worlds final mean—not an official Trials cut.</p></div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">{LEVELS.map((level) => { const standard = modelStandard(level, event, sex, age); const gap = standard.time ? total - standard.time : 0; return <button key={level} type="button" onClick={() => { setTargetLevel(level); setReferenceId(""); }} className={`rounded-2xl border p-4 text-left hover:-translate-y-0.5 hover:shadow-lg ${targetLevel === level ? "border-blue-500 bg-blue-50/60 shadow-md shadow-blue-100" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1 ${levelStyles[level]}`}>{level}</span>{standard.time && total <= standard.time ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <ChevronRight className="h-5 w-5 text-slate-300" />}</div><p className="mt-4 font-mono text-2xl font-black text-slate-950">{formatTime(standard.time || 0)}</p><p className="mt-2 text-xs font-bold text-slate-500">{standard.official ? "Official anchor" : "Modeled equivalent"} · {gap <= 0 ? `${formatTime(Math.abs(gap))} inside` : `${formatTime(gap)} to go`}</p></button>; })}</div>
        </article>
      </section>
    </div>}

    {tab === "library" && <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Modeled profiles</p><p className="mt-2 text-3xl font-black text-slate-950">{allDerived.length}</p><p className="mt-1 text-xs text-slate-500">All events, categories, levels and strategies</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">2025 Worlds</p><p className="mt-2 text-3xl font-black text-slate-950">{WORLDS_2025_REFERENCES.length}</p><p className="mt-1 text-xs text-slate-500">Official recent medal-race result lines</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Historical / U.S.</p><p className="mt-2 text-3xl font-black text-slate-950">{MEN_200_FREE_REFERENCES.length}</p><p className="mt-1 text-xs text-slate-500">Sectionals, Nationals, Trials and elite 200 free</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Coach additions</p><p className="mt-2 text-3xl font-black text-slate-950">{customReferences.length}</p><p className="mt-1 text-xs text-slate-500">Device-local and visibly pending verification</p></div></div>
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><Filter className="h-4 w-4" /> Library filters</div><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(4,1fr)]"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={librarySearch} onChange={(e) => { setLibrarySearch(e.target.value); setShowCount(18); }} placeholder="Search athlete, strategy, meet…" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-blue-500" /></label><select value={libraryEvent} onChange={(e) => { setLibraryEvent(e.target.value); setShowCount(18); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold"><option>All events</option>{EVENTS.map((item) => <option key={item}>{item}</option>)}</select><select value={librarySex} onChange={(e) => { setLibrarySex(e.target.value); setShowCount(18); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold"><option>All categories</option><option>Men</option><option>Women</option></select><select value={libraryLevel} onChange={(e) => { setLibraryLevel(e.target.value); setShowCount(18); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold"><option>All levels</option>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select><select value={libraryKind} onChange={(e) => { setLibraryKind(e.target.value as LibraryKind); setShowCount(18); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold"><option value="all">All data types</option><option value="derived">Modeled strategies</option><option value="observed">Observed official races</option><option value="coach">Coach-added</option></select></div></div>
      <div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-600">Showing {Math.min(showCount, filteredLibrary.length)} of {filteredLibrary.length} matching references</p><button type="button" onClick={() => downloadText("setcraft-reference-library.json", JSON.stringify(filteredLibrary, null, 2))} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50"><ArrowDownToLine className="h-4 w-4" /> Export filtered</button></div>
      <div className="space-y-5">{filteredLibrary.slice(0, showCount).map((race) => <ReferenceCard key={race.id} race={race} onDelete={race.dataClass === "coach" ? () => saveCustom(customReferences.filter((item) => item.id !== race.id)) : undefined} />)}</div>
      {!filteredLibrary.length && <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center"><Database className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-black text-slate-800">No references match these filters.</p><button type="button" onClick={() => { setLibraryEvent("All events"); setLibrarySex("All categories"); setLibraryLevel("All levels"); setLibraryKind("all"); setLibrarySearch(""); }} className="mt-3 text-sm font-bold text-blue-600">Clear filters</button></div>}
      {showCount < filteredLibrary.length && <button type="button" onClick={() => setShowCount((count) => count + 18)} className="w-full rounded-2xl border border-slate-200 bg-white py-4 text-sm font-extrabold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">Load 18 more references</button>}
    </section>}

    {tab === "contribute" && <section className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-600">Coach contribution</p><h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Add one reference race</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Use an authorized team result, meet export or manually confirmed race. New records stay marked pending until a source is checked.</p></div><UserRoundPlus className="h-7 w-7 text-slate-300" /></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2"><InputLabel label="Athlete or reference label"><input value={coachForm.swimmer} onChange={(e) => setCoachForm({ ...coachForm, swimmer: e.target.value })} placeholder="Athlete name" className={inputClass} /></InputLabel><InputLabel label="Meet"><input value={coachForm.meet} onChange={(e) => setCoachForm({ ...coachForm, meet: e.target.value })} placeholder="Meet and round" className={inputClass} /></InputLabel><InputLabel label="Event"><select value={coachForm.event} onChange={(e) => { const next = e.target.value; setCoachForm({ ...coachForm, event: next, checkpoints: defaultCheckpoints(next).join("|") }); }} className={inputClass}>{EVENTS.map((item) => <option key={item}>{item}</option>)}</select></InputLabel><InputLabel label="Category"><select value={coachForm.sex} onChange={(e) => setCoachForm({ ...coachForm, sex: e.target.value as SexCategory })} className={inputClass}><option>Men</option><option>Women</option></select></InputLabel><InputLabel label="Age (optional)"><input value={coachForm.age} onChange={(e) => setCoachForm({ ...coachForm, age: e.target.value })} type="number" className={inputClass} /></InputLabel><InputLabel label="Reference level"><select value={coachForm.level} onChange={(e) => setCoachForm({ ...coachForm, level: e.target.value as ReferenceLevel })} className={inputClass}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></InputLabel><InputLabel label="Final time"><input value={coachForm.total} onChange={(e) => setCoachForm({ ...coachForm, total: e.target.value })} placeholder="1:56.00" className={`${inputClass} font-mono`} /></InputLabel><InputLabel label="Race strategy label"><input value={coachForm.archetype} onChange={(e) => setCoachForm({ ...coachForm, archetype: e.target.value })} placeholder="Balanced close" className={inputClass} /></InputLabel><InputLabel label="Checkpoint distances"><input value={coachForm.checkpoints} onChange={(e) => setCoachForm({ ...coachForm, checkpoints: e.target.value })} placeholder="50|100|150|200" className={`${inputClass} font-mono`} /></InputLabel><InputLabel label="Cumulative splits"><input value={coachForm.splits} onChange={(e) => setCoachForm({ ...coachForm, splits: e.target.value })} placeholder="27.20|56.50|1:26.20|1:56.00" className={`${inputClass} font-mono`} /></InputLabel><InputLabel label="Official result URL" className="md:col-span-2"><input value={coachForm.sourceUrl} onChange={(e) => setCoachForm({ ...coachForm, sourceUrl: e.target.value })} placeholder="https://…" className={inputClass} /></InputLabel></div>
        <button type="button" onClick={addCoachReference} className="premium-button mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-4 text-sm font-extrabold text-white"><Plus className="h-4 w-4" /> Add pending reference</button>{importNotice && <p className="mt-3 rounded-xl bg-slate-100 px-3 py-3 text-xs font-bold leading-5 text-slate-600">{importNotice}</p>}
      </article>
      <div className="space-y-6"><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">Bulk contribution</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Import coach CSV</h3></div><Upload className="h-6 w-6 text-slate-300" /></div><p className="mt-3 text-sm leading-6 text-slate-600">Use vertical bars inside checkpoint and split fields so commas remain column separators.</p><textarea value={csvInput} onChange={(e) => setCsvInput(e.target.value)} rows={8} placeholder="Paste CSV rows…" className="mt-4 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 font-mono text-xs leading-6 text-slate-800 outline-none focus:border-violet-500" /><button type="button" onClick={importRaces} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"><Upload className="h-4 w-4" /> Import pending references</button><button type="button" onClick={() => downloadText("setcraft-reference-template.csv", "swimmer,event,sex,course,age,level,total,checkpoints,splits,meet,archetype,source_url\nJane Doe,200 Free,Women,LCM,16,Nationals,2:02.10,50|100|150|200,28.40|59.20|1:30.60|2:02.10,Championship final,Balanced close,https://example.com/result", "text/csv")} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-200"><ArrowDownToLine className="h-4 w-4" /> Download v2 template</button></article>
        <article className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6"><div className="flex gap-4"><CircleAlert className="h-6 w-6 shrink-0 text-amber-600" /><div><p className="font-black text-amber-950">Contribution rules</p><ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900"><li>• Attach an official result or authorized team file whenever possible.</li><li>• Do not upload data your club is not authorized to share.</li><li>• Minors’ information should follow club consent and privacy rules.</li><li>• A coach-added race never becomes “official” automatically.</li></ul></div></div></article>
        {customReferences.length > 0 && <article className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white"><p className="text-xs font-extrabold uppercase tracking-wide text-cyan-300">Your contributions</p><p className="mt-2 text-3xl font-black">{customReferences.length}</p><p className="mt-2 text-sm leading-6 text-slate-300">Open the Reference library and filter to “Coach-added” to inspect, export or remove them.</p><button type="button" onClick={() => { setLibraryKind("coach"); setTab("library"); }} className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-950">View coach references</button></article>}
      </div>
    </section>}

    {tab === "method" && <section className="grid gap-6 xl:grid-cols-[1fr_.86fr]">
      <div className="space-y-6"><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Scale className="h-6 w-6" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">Model definition</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Measured races and strategy models are different things</h3><p className="mt-3 text-sm leading-7 text-slate-600">Observed profiles reproduce checkpoints present in an official result file. Modeled profiles begin with an official final-time anchor, apply an event-specific pacing strategy and normalize the segments back to exactly that target time. They guide planning; they do not pretend an athlete actually produced those intermediate values.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-black text-slate-900">Absolute gap</p><p className="mt-2 font-mono text-xs text-slate-600">(swim − standard) ÷ standard × 100</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-black text-slate-900">Pacing distance</p><p className="mt-2 font-mono text-xs text-slate-600">Σ |segment share − reference share|</p></div></div></article>
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600">Provenance</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Every source is inspectable</h3></div><BookOpen className="h-6 w-6 text-slate-300" /></div><div className="mt-5 divide-y divide-slate-100">{OFFICIAL_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="text-sm font-black text-slate-900 group-hover:text-blue-700">{source.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{source.detail}</p></div><Link2 className="mt-1 h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500" /></a>)}</div></article>
      </div>
      <div className="space-y-6"><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-600">Coverage map</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">What v2 contains</h3></div><Database className="h-6 w-6 text-slate-300" /></div><div className="mt-5 grid grid-cols-2 gap-2 text-xs">{["17 individual LCM events", "Men + women categories", "4 performance levels", "3 strategies per event", "99 recent medal races", "34 event/category finals", "15/25/35 m sprint checks", "25 m checks for 100s", "50 m checks for 200+", "ages 10–18 where offered", "coach form + bulk CSV", "JSON and CSV exports"].map((field) => <div key={field} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-bold text-slate-600">{field}</div>)}</div></article>
        <article className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6"><div className="flex gap-4"><CircleAlert className="h-6 w-6 shrink-0 text-amber-600" /><div><p className="text-sm font-black text-amber-950">Requested SwimCloud result: {SWIMCLOUD_REQUEST.status}</p><p className="mt-2 text-sm leading-6 text-amber-900">{SWIMCLOUD_REQUEST.note}</p><a href={SWIMCLOUD_REQUEST.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-amber-950 underline decoration-amber-400 underline-offset-4">Open exact result page <Link2 className="h-3.5 w-3.5" /></a></div></div></article>
        <article className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white"><div className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><div><p className="font-black">Accuracy guardrails</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300"><li>• No SCY/SCM conversion is presented as an official LCM time.</li><li>• Non-Olympic Trials equivalents are explicitly labeled modeled.</li><li>• Intermediate 50-sprint checkpoints are estimates unless a source measured them.</li><li>• Exact-age level stays separate from absolute competitive level.</li><li>• Coach imports remain pending until verified.</li></ul></div></div></article>
      </div>
    </section>}
  </div>;
}
