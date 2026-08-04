import React, { useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, BookOpen, Bot, CircleAlert, Database, FileJson,
  Filter, Gauge, Link2, Plus, RefreshCw, Scale, Search, ShieldCheck, Target, Trash2, Upload,
  UserRoundPlus, Waves,
} from "lucide-react";
import {
  Course, EVENTS, MEN_200_FREE_REFERENCES, OFFICIAL_SOURCES, RaceReference,
  ReferenceLevel, SexCategory, SWIMCLOUD_REQUEST, TimingStatus, WORLD_RECORD_REFERENCES,
  classifyAbsolute, closestReference, completeCumulativeSplits, defaultCheckpoints,
  formatTime, getAgeBand, getDerivedReferences, getWorldRecord, inputQualityScore,
  modelStandard, performanceScores, scaledModel, segmentsFromCumulative, timeToSeconds,
} from "../raceModel";
import { WORLDS_2025_REFERENCES } from "../generated/worlds2025References";

type LabTab = "analyze" | "library" | "contribute" | "method";
type LibraryKind = "all" | "world-record" | "derived" | "observed" | "coach";
type ProfileKey = "strength" | "explosiveness" | "lactateProduction" | "lactateTolerance" | "aerobicCapacity" | "shoulderMobility" | "ankleMobility" | "underwaterSkill";
type ProfileMetric = { enabled: boolean; value: number };

const LEVELS: ReferenceLevel[] = ["Sectionals", "Nationals", "Trials", "World Class"];
const OBSERVED_REFERENCES = [...WORLDS_2025_REFERENCES, ...MEN_200_FREE_REFERENCES];
const PROFILE_LABELS: Record<ProfileKey, string> = {
  strength: "Strength", explosiveness: "Explosiveness", lactateProduction: "Lactate production",
  lactateTolerance: "Lactate tolerance", aerobicCapacity: "Aerobic capacity",
  shoulderMobility: "Shoulder mobility", ankleMobility: "Ankle mobility", underwaterSkill: "Underwater skill",
};
const levelStyles: Record<ReferenceLevel, string> = {
  Sectionals: "bg-sky-50 text-sky-700 ring-sky-200",
  Nationals: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Trials: "bg-violet-50 text-violet-700 ring-violet-200",
  "World Class": "bg-amber-50 text-amber-800 ring-amber-200",
};
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function downloadText(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character] || character));
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-extrabold uppercase tracking-wide text-slate-500 ${className}`}>{label}{children}</label>;
}

function ScoreCard({ label, value, helper, tone = "blue" }: { label: string; value: string; helper: string; tone?: "blue" | "violet" | "amber" | "emerald" }) {
  const tones = { blue: "from-blue-500 to-cyan-500", violet: "from-violet-500 to-indigo-500", amber: "from-amber-400 to-orange-500", emerald: "from-emerald-400 to-teal-500" };
  return <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <span className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${tones[tone]}`} />
    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">{label}</p>
    <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
    <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
  </div>;
}

function dataKind(race: RaceReference): Exclude<LibraryKind, "all"> {
  if (race.dataClass === "world-record") return "world-record";
  if (race.dataClass === "derived") return "derived";
  if (race.dataClass === "coach") return "coach";
  return "observed";
}

function CheckpointStrip({ race }: { race: RaceReference }) {
  const segments = segmentsFromCumulative(race.cumulative);
  return <div className="grid grid-flow-col auto-cols-[132px] gap-2">
    {race.checkpoints.map((point, index) => {
      const provenance = race.checkpointProvenance?.[index] || (race.dataClass === "derived" ? "estimated" : race.dataClass === "coach" ? "coach" : "official");
      const badge = provenance === "official" ? "Official" : provenance === "secondary" ? "Secondary" : provenance === "coach" ? "Coach" : "Estimated";
      return <div key={`${race.id}-${point}`} className={`rounded-xl border p-3 ${provenance === "estimated" ? "border-dashed border-amber-200 bg-amber-50/60" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{point} m</p><span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase ${provenance === "official" ? "bg-emerald-100 text-emerald-700" : provenance === "estimated" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{badge}</span></div>
        <p className="mt-2 font-mono text-sm font-black text-slate-900">{formatTime(race.cumulative[index])}</p>
        <p className="mt-1 font-mono text-[10px] text-slate-500">segment {formatTime(segments[index])}</p>
      </div>;
    })}
  </div>;
}

function ReferenceCard({ race, onDelete }: { race: RaceReference; onDelete?: () => void }) {
  const kind = dataKind(race);
  const label = kind === "world-record" ? "World record" : kind === "derived" ? "Modeled strategy" : kind === "coach" ? "Coach-added" : "Observed race";
  return <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start md:p-6">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1 ${levelStyles[race.level]}`}>{race.level}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">{label}</span>{race.recordStatus === "pending" && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-800">Pending ratification</span>}</div>
        <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">{kind === "derived" ? race.archetype : race.swimmer}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">{race.sex} · {race.event} · {race.course}{race.nation ? ` · ${race.nation}` : ""} · {race.meet}</p>
        {race.strategyDescription && <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{race.strategyDescription}</p>}
      </div>
      <div className="flex items-start gap-2"><div className="rounded-2xl bg-slate-950 px-5 py-3 text-right text-white"><p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Final time</p><p className="mt-1 font-mono text-xl font-black">{formatTime(race.total)}</p></div>{onDelete && <button type="button" onClick={onDelete} aria-label={`Delete ${race.swimmer}`} className="rounded-xl border border-rose-200 p-3 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}</div>
    </div>
    <div className="overflow-x-auto border-y border-slate-100 bg-slate-50/70 p-4 md:px-6"><CheckpointStrip race={race} /></div>
    <div className="flex flex-wrap items-start justify-between gap-3 p-4 md:px-6"><p className="max-w-4xl text-xs leading-5 text-slate-500">{race.notes || `${race.date} · ${race.archetype}`}</p>{race.sourceUrl ? <a href={race.sourceUrl} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800">{race.sourceName}<Link2 className="h-3.5 w-3.5" /></a> : <span className="text-xs font-bold text-amber-700">No source attached</span>}</div>
  </article>;
}

function parseImportedCsv(value: string): RaceReference[] {
  const lines = value.trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(lines[0]?.toLowerCase().startsWith("swimmer,") ? 1 : 0).map((line, index) => {
    const [swimmer, eventRaw, sexRaw, courseRaw, ageRaw, levelRaw, totalRaw, checkpointsRaw, splitsRaw, meet, archetype, sourceUrl] = line.split(",").map((item) => item.trim());
    const event = EVENTS.includes(eventRaw as typeof EVENTS[number]) ? eventRaw : "200 Free";
    const total = timeToSeconds(totalRaw);
    const completed = completeCumulativeSplits((splitsRaw || "").replaceAll("|", ","), total, event);
    return {
      id: `coach-${Date.now()}-${index}`, swimmer: swimmer || `Coach reference ${index + 1}`, event,
      sex: sexRaw === "Women" ? "Women" : "Men", course: courseRaw === "SCY" ? "SCY" : "LCM",
      age: Number(ageRaw) || undefined, meet: meet || "Coach contribution", date: new Date().toISOString().slice(0, 10),
      level: LEVELS.includes(levelRaw as ReferenceLevel) ? levelRaw as ReferenceLevel : "Sectionals", total,
      cumulative: completed.values, checkpoints: checkpointsRaw ? checkpointsRaw.split("|").map(Number) : defaultCheckpoints(event),
      checkpointProvenance: completed.enteredMask.map((entered) => entered ? "coach" : "estimated"),
      archetype: archetype || "Coach race", sourceName: sourceUrl ? "Coach-supplied result" : "Coach contribution",
      sourceUrl: sourceUrl || "", verification: "manual", dataClass: "coach",
      notes: "Coach-added record. Missing checkpoints were estimated and remain visibly labeled.",
    } as RaceReference;
  }).filter((race) => race.total > 0);
}

export default function RaceLab() {
  const [tab, setTab] = useState<LabTab>("analyze");
  const [event, setEvent] = useState("200 Free");
  const [sex, setSex] = useState<SexCategory>("Men");
  const course: Course = "LCM";
  const [age, setAge] = useState(15);
  const [timeInput, setTimeInput] = useState("1:56.00");
  const [splitInput, setSplitInput] = useState("27.20, 56.50, 1:26.20, 1:56.00");
  const [timingStatus, setTimingStatus] = useState<TimingStatus>("self-reported");
  const [targetLevel, setTargetLevel] = useState<ReferenceLevel>("Nationals");
  const [goalTimeInput, setGoalTimeInput] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [profileEnabled, setProfileEnabled] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [profile, setProfile] = useState<Record<ProfileKey, ProfileMetric>>(() => Object.fromEntries(Object.keys(PROFILE_LABELS).map((key) => [key, { enabled: false, value: 5 }])) as Record<ProfileKey, ProfileMetric>);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [customReferences, setCustomReferences] = useState<RaceReference[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("setcraft_race_references_v3") || localStorage.getItem("setcraft_race_references_v2") || "[]"); } catch { return []; }
  });
  const [libraryEvent, setLibraryEvent] = useState("All events");
  const [librarySex, setLibrarySex] = useState("All categories");
  const [libraryKind, setLibraryKind] = useState<LibraryKind>("all");
  const [librarySearch, setLibrarySearch] = useState("");
  const [showCount, setShowCount] = useState(16);
  const [csvInput, setCsvInput] = useState("");
  const [importNotice, setImportNotice] = useState("");
  const [coachForm, setCoachForm] = useState({ swimmer: "", event: "200 Free", sex: "Men" as SexCategory, age: "", level: "Sectionals" as ReferenceLevel, total: "", splits: "", meet: "", archetype: "", sourceUrl: "" });

  const total = timeToSeconds(timeInput);
  const checkpoints = defaultCheckpoints(event);
  const strategyModels = useMemo(() => getDerivedReferences(event, sex, age), [event, sex, age]);
  const levelModels = strategyModels.filter((race) => race.level === targetLevel);
  const selectedReference = levelModels.find((race) => race.id === referenceId) || levelModels[1] || levelModels[0] || null;
  const levelTarget = modelStandard(targetLevel, event, sex, age).time || total;
  const goalTime = timeToSeconds(goalTimeInput) || levelTarget;
  const targetCumulative = selectedReference ? scaledModel(selectedReference, goalTime) : [];
  const swimmerModel = selectedReference ? scaledModel(selectedReference, total) : [];
  const completed = completeCumulativeSplits(splitInput, total, event, swimmerModel);
  const cumulative = completed.values;
  const inputSegments = segmentsFromCumulative(cumulative);
  const targetSegments = segmentsFromCumulative(targetCumulative);
  const activeProfile = (Object.keys(profile) as ProfileKey[]).filter((key) => profile[key].enabled);
  const quality = inputQualityScore({ event, course, total, cumulative, enteredMask: completed.enteredMask, age, goalTime, timingStatus, physiologyEnabled: profileEnabled, activePhysiologyValues: activeProfile.map((key) => profile[key].value) });
  const scores = performanceScores(total, age, sex, event, goalTime);
  const absolute = classifyAbsolute(total, event, sex, age);
  const ageBand = getAgeBand(total, age, sex, event);
  const worldRecord = getWorldRecord(event, sex);
  const eligibleObserved = [...OBSERVED_REFERENCES, ...customReferences].filter((race) => race.event === event && race.sex === sex && race.course === course && race.cumulative.length === cumulative.length);
  const closest = completed.enteredMask.some(Boolean) && eligibleObserved.length ? closestReference(cumulative, total, eligibleObserved) : null;
  const deltas = checkpoints.map((_, index) => (inputSegments[index] || 0) - (targetSegments[index] || 0));
  const leakIndex = deltas.length ? deltas.reduce((best, value, index, array) => value > array[best] ? index : best, 0) : 0;

  const profileInsights = useMemo(() => {
    if (!profileEnabled) return ["Athlete-profile factors are off, so the analysis uses race evidence only."];
    const insights: string[] = [];
    const distance = Number(event.match(/^\d+/)?.[0] || 200);
    if (profile.explosiveness.enabled && profile.explosiveness.value >= 8) insights.push(distance <= 100 ? "High explosiveness is consistent with a start-led race model; verify it with an actual 15 m time." : "High explosiveness may support starts, turns and planned surges, but should not force an aggressive opening pace.");
    if (profile.strength.enabled && profile.strength.value >= 8) insights.push("High strength may support block force and wall impulse; relative power and technical transfer matter more than body mass alone.");
    if (profile.lactateProduction.enabled && profile.lactateProduction.value >= 8 && profile.lactateTolerance.enabled && profile.lactateTolerance.value <= 5) insights.push("The combination of high self-rated lactate production and lower tolerance may fit short speed better than an over-aggressive 100/200 opening; confirm with coach testing.");
    if (profile.aerobicCapacity.enabled && profile.aerobicCapacity.value >= 8) insights.push("High aerobic capacity is consistent with even-pressure or back-half models, especially from 200 m upward.");
    if ((profile.shoulderMobility.enabled && profile.shoulderMobility.value <= 4) || (profile.ankleMobility.enabled && profile.ankleMobility.value <= 4)) insights.push("Lower mobility ratings may affect streamline or propulsion positions, but a coach should observe the actual movement before drawing a technical conclusion.");
    if (profile.underwaterSkill.enabled && profile.underwaterSkill.value >= 8) insights.push("Strong underwater skill may make start/turn phases a genuine advantage; compare measured 15 m and turn-out times rather than assuming it from the rating.");
    if (weightKg) insights.push(`Body mass (${weightKg} kg${heightCm ? ` at ${heightCm} cm` : ""}) is recorded as context only and does not change the official time score.`);
    return insights.length ? insights : ["The enabled ratings are near the middle of the scale; race splits remain the stronger evidence for this analysis."];
  }, [profileEnabled, profile, event, weightKg, heightCm]);

  const offlineAnalysis = [
    `Overview: ${formatTime(total)} in the ${sex.toLowerCase()} ${event} LCM earns ${scores.aquaPoints} official 2026 World Aquatics points and a SetCraft score of ${scores.setcraftScore}/100.`,
    `Pacing: ${quality.estimatedSplits} of ${checkpoints.length} checkpoints were estimated. ${deltas[leakIndex] > 0 ? `The largest gap to the selected ${targetLevel} ${selectedReference?.archetype || "balanced"} model is ${deltas[leakIndex].toFixed(2)} seconds in the ${checkpoints[leakIndex - 1] || 0}–${checkpoints[leakIndex]} m segment.` : "The entered race shape is at or inside the selected target model across the largest compared segment."}`,
    `Age and goal: the exact-age band is ${ageBand.label}; age score is ${scores.ageScore ?? "not available"}/100 and goal readiness is ${scores.goalReadiness}/100 toward ${formatTime(goalTime)}.`,
    `Athlete profile: ${profileInsights.join(" ")}`,
    `Coach checks: verify every estimated checkpoint, add reaction/15 m/turn data where possible, and review whether the target strategy matches the swimmer's actual technical strengths. Input quality is ${quality.score}%.`,
  ].join("\n\n");

  const resultPayload = {
    schema: "setcraft.race-analysis.v3", generatedAt: new Date().toISOString(), event, sex, course, age,
    swim: { totalSeconds: total, formatted: formatTime(total), timingStatus, checkpoints, cumulative, segments: inputSegments, enteredMask: completed.enteredMask, estimatedMask: completed.estimatedMask },
    scores, result: { absoluteLevel: absolute.achieved, nextLevel: absolute.next, ageBand: ageBand.label, inputQuality: quality },
    worldRecord: worldRecord ? { swimmer: worldRecord.swimmer, time: worldRecord.total, status: worldRecord.recordStatus } : null,
    closestObservedReference: closest ? { id: closest.id, swimmer: closest.swimmer, archetype: closest.archetype, source: closest.sourceUrl } : null,
    target: { level: targetLevel, goalTime, cumulative: targetCumulative, segments: targetSegments, strategy: selectedReference?.archetype },
    athleteProfile: profileEnabled ? { heightCm: Number(heightCm) || null, weightKg: Number(weightKg) || null, factors: profile, insights: profileInsights } : { enabled: false },
    analysis: aiAnalysis || offlineAnalysis,
  };

  const saveCustom = (next: RaceReference[]) => { setCustomReferences(next); localStorage.setItem("setcraft_race_references_v3", JSON.stringify(next)); };
  const allDerived = useMemo(() => EVENTS.flatMap((item) => (["Men", "Women"] as SexCategory[]).flatMap((category) => getDerivedReferences(item, category, age))), [age]);
  const allLibrary = [...WORLD_RECORD_REFERENCES, ...allDerived, ...OBSERVED_REFERENCES, ...customReferences];
  const filteredLibrary = allLibrary.filter((race) => {
    const haystack = `${race.swimmer} ${race.event} ${race.sex} ${race.level} ${race.archetype} ${race.meet}`.toLowerCase();
    return (libraryEvent === "All events" || race.event === libraryEvent) && (librarySex === "All categories" || race.sex === librarySex) && (libraryKind === "all" || dataKind(race) === libraryKind) && (!librarySearch.trim() || haystack.includes(librarySearch.toLowerCase()));
  });

  const generateAiAnalysis = async () => {
    setAiLoading(true); setAiError("");
    try {
      const response = await fetch("/api/gemini/analyze-race", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verifiedSummary: JSON.stringify({ ...resultPayload, analysis: undefined }), offlineFallback: offlineAnalysis }) });
      if (!response.ok) throw new Error(`AI request failed (${response.status})`);
      const data = await response.json();
      setAiAnalysis(data.text || offlineAnalysis);
    } catch (error) { setAiError(error instanceof Error ? error.message : "Could not reach Gemini."); setAiAnalysis(offlineAnalysis); }
    finally { setAiLoading(false); }
  };

  const exportHtml = () => {
    const rows = checkpoints.map((point, index) => `<tr><td>${point} m</td><td>${escapeHtml(formatTime(cumulative[index]))}</td><td>${completed.enteredMask[index] ? "Entered" : "Estimated"}</td><td>${escapeHtml(formatTime(targetCumulative[index]))}</td><td>${(deltas[index] || 0).toFixed(2)} s</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>SetCraft Race Analysis</title><style>body{font-family:Arial,sans-serif;max-width:980px;margin:40px auto;padding:0 24px;color:#0f172a}h1{font-size:34px}h2{margin-top:32px}header{background:#081225;color:white;padding:28px;border-radius:22px}.scores{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.card{border:1px solid #dbe3ef;border-radius:14px;padding:16px}.big{font-size:28px;font-weight:800}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #e2e8f0;padding:10px}.analysis{white-space:pre-wrap;line-height:1.65;background:#f8fafc;padding:20px;border-radius:16px}.note{font-size:12px;color:#64748b}@media(max-width:700px){.scores{grid-template-columns:1fr 1fr}}</style></head><body><header><p>SETCRAFT RACE INTELLIGENCE</p><h1>${escapeHtml(`${sex} ${event} · ${formatTime(total)}`)}</h1><p>Generated ${new Date().toLocaleString()} · input quality ${quality.score}%</p></header><div class="scores"><div class="card"><div>AQUA points</div><div class="big">${scores.aquaPoints}</div></div><div class="card"><div>SetCraft score</div><div class="big">${scores.setcraftScore}/100</div></div><div class="card"><div>Age score</div><div class="big">${scores.ageScore ?? "N/A"}</div></div><div class="card"><div>Goal readiness</div><div class="big">${scores.goalReadiness}%</div></div></div><h2>Split analysis</h2><table><thead><tr><th>Checkpoint</th><th>Swimmer</th><th>Source</th><th>Goal model</th><th>Delta</th></tr></thead><tbody>${rows}</tbody></table><h2>Coach Block analysis</h2><div class="analysis">${escapeHtml(aiAnalysis || offlineAnalysis)}</div><h2>Method notes</h2><p class="note">Official 2026 World Aquatics points use the annual base table and cubic formula. The live record gap uses the record catalogue checked 4 August 2026. Estimated checkpoints are event-normal modeling, not measured timing. Athlete-profile ratings are self/coach context and do not change official points.</p></body></html>`;
    downloadText(`setcraft-${event.toLowerCase().replaceAll(" ", "-")}-analysis.html`, html, "text/html");
  };

  const addCoachReference = () => {
    const coachTotal = timeToSeconds(coachForm.total);
    if (!coachForm.swimmer.trim() || !coachTotal) { setImportNotice("Add a reference name and valid final time."); return; }
    const coachCompleted = completeCumulativeSplits(coachForm.splits.replaceAll("|", ","), coachTotal, coachForm.event);
    const race: RaceReference = { id: `coach-${Date.now()}`, swimmer: coachForm.swimmer.trim(), event: coachForm.event, sex: coachForm.sex, course: "LCM", age: Number(coachForm.age) || undefined, meet: coachForm.meet.trim() || "Coach contribution", date: new Date().toISOString().slice(0, 10), level: coachForm.level, total: coachTotal, cumulative: coachCompleted.values, checkpoints: defaultCheckpoints(coachForm.event), checkpointProvenance: coachCompleted.enteredMask.map((entered) => entered ? "coach" : "estimated"), archetype: coachForm.archetype.trim() || "Coach race", sourceName: coachForm.sourceUrl ? "Coach-supplied result" : "No source attached", sourceUrl: coachForm.sourceUrl.trim(), verification: "manual", dataClass: "coach", notes: "Coach-added record. Missing checkpoints were estimated and remain visibly labeled." };
    saveCustom([...customReferences, race]);
    setCoachForm((current) => ({ ...current, swimmer: "", total: "", splits: "", meet: "", archetype: "", sourceUrl: "" }));
    setImportNotice("Coach reference added on this device. It remains pending until its source is verified.");
  };

  const importRaces = () => {
    try { const races = parseImportedCsv(csvInput); if (!races.length) throw new Error("No valid rows found."); saveCustom([...customReferences, ...races]); setCsvInput(""); setImportNotice(`${races.length} reference${races.length === 1 ? "" : "s"} imported as pending.`); }
    catch (error) { setImportNotice(error instanceof Error ? error.message : "Could not import that data."); }
  };

  return <div className="mx-auto max-w-[1580px] space-y-6 pb-16">
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/60 md:p-9">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative grid gap-8 xl:grid-cols-[1.15fr_.85fr] xl:items-end"><div><span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-200"><Activity className="h-4 w-4" /> Race intelligence lab · v3</span><h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-5xl">Score the result. Explain the race.</h2><p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">Current world records, official AQUA points, exact-age context, automatic split completion, optional athlete factors and exportable Gemini-ready analysis.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Current records</p><p className="mt-2 text-3xl font-black">34</p><p className="mt-1 text-xs text-slate-400">Every individual LCM event</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Reference models</p><p className="mt-2 text-3xl font-black">408+</p><p className="mt-1 text-xs text-slate-400">Levels, strategies and races</p></div></div></div>
    </section>

    <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{(["analyze", "library", "contribute", "method"] as LabTab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-xl px-4 py-3 text-sm font-extrabold capitalize transition ${tab === item ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>{item === "method" ? "Method & sources" : item === "contribute" ? "Coach contributions" : item}</button>)}</nav>

    {tab === "analyze" && <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-600">Race input</p><h3 className="mt-1 text-2xl font-black text-slate-950">Result and goal</h3></div><Waves className="h-7 w-7 text-blue-500" /></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Event"><select value={event} onChange={(e) => { setEvent(e.target.value); setReferenceId(""); setSplitInput(""); setGoalTimeInput(""); setAiAnalysis(""); }} className={inputClass}>{EVENTS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Category"><select value={sex} onChange={(e) => { setSex(e.target.value as SexCategory); setReferenceId(""); setAiAnalysis(""); }} className={inputClass}><option>Men</option><option>Women</option></select></Field><Field label="Age"><input type="number" min={5} max={100} value={age} onChange={(e) => setAge(Number(e.target.value) || 15)} className={inputClass} /></Field><Field label="Timing source"><select value={timingStatus} onChange={(e) => setTimingStatus(e.target.value as TimingStatus)} className={inputClass}><option value="official">Official electronic result</option><option value="self-reported">Self-reported race</option><option value="training">Practice / hand time</option></select></Field><Field label="Final time"><input value={timeInput} onChange={(e) => { setTimeInput(e.target.value); setAiAnalysis(""); }} className={`${inputClass} font-mono`} placeholder="1:56.00" /></Field><Field label="Goal level"><select value={targetLevel} onChange={(e) => { setTargetLevel(e.target.value as ReferenceLevel); setReferenceId(""); setGoalTimeInput(""); setAiAnalysis(""); }} className={inputClass}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></Field><Field label="Custom goal time (optional)"><input value={goalTimeInput} onChange={(e) => { setGoalTimeInput(e.target.value); setAiAnalysis(""); }} className={`${inputClass} font-mono`} placeholder={formatTime(levelTarget)} /></Field><Field label="Race strategy"><select value={selectedReference?.id || ""} onChange={(e) => setReferenceId(e.target.value)} className={inputClass}>{levelModels.map((model) => <option key={model.id} value={model.id}>{model.archetype}</option>)}</select></Field></div>
          <Field label={`Cumulative splits · ${checkpoints.join(" / ")} m`} className="mt-4"><textarea value={splitInput} onChange={(e) => { setSplitInput(e.target.value); setAiAnalysis(""); }} rows={3} className={`${inputClass} resize-y font-mono`} placeholder={checkpoints.map(() => "").join(", ")} /></Field><p className="mt-2 text-xs leading-5 text-slate-500">Leave the entire field blank or leave any position blank with two commas. SetCraft fills missing checkpoints with a balanced event-normal model and labels each estimate.</p>
          {completed.issues.length > 0 && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">{completed.issues.join(" ")}</div>}
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-violet-600">Optional profile</p><h3 className="mt-1 text-2xl font-black text-slate-950">Athlete factors</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">These inputs influence explanations and strategy fit only. They do not change AQUA points or the official time ranking.</p></div><button type="button" onClick={() => setProfileEnabled((value) => !value)} className={`rounded-xl px-4 py-3 text-sm font-extrabold ${profileEnabled ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-600"}`}>{profileEnabled ? "Profile on" : "Profile off"}</button></div>
          {profileEnabled ? <><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Height (cm, optional)"><input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputClass} /></Field><Field label="Body mass (kg, optional)"><input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputClass} /></Field></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{(Object.keys(PROFILE_LABELS) as ProfileKey[]).map((key) => <div key={key} className={`rounded-2xl border p-4 ${profile[key].enabled ? "border-violet-200 bg-violet-50/60" : "border-slate-200 bg-slate-50"}`}><div className="flex items-center justify-between gap-3"><button type="button" onClick={() => setProfile({ ...profile, [key]: { ...profile[key], enabled: !profile[key].enabled } })} className="text-left text-sm font-black text-slate-800">{PROFILE_LABELS[key]}</button><span className="font-mono text-sm font-black text-violet-700">{profile[key].enabled ? `${profile[key].value}/10` : "Off"}</span></div>{profile[key].enabled && <input aria-label={PROFILE_LABELS[key]} type="range" min={1} max={10} value={profile[key].value} onChange={(e) => setProfile({ ...profile, [key]: { enabled: true, value: Number(e.target.value) } })} className="mt-4 w-full accent-violet-600" />}</div>)}</div></> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><Gauge className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">Race-only mode is active. Input quality is not penalized for leaving this optional section off.</p></div>}
        </article>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><ScoreCard label="AQUA points" value={`${scores.aquaPoints}`} helper={`Official 2026 base ${formatTime(scores.aquaBase || 0)} · cubic formula`} tone="blue" /><ScoreCard label="SetCraft score" value={`${scores.setcraftScore}/100`} helper="60% AQUA · 25% age · 15% goal readiness" tone="violet" /><ScoreCard label="Age score" value={scores.ageScore == null ? "N/A" : `${scores.ageScore}/100`} helper={`${ageBand.label} · exact-age USA standard`} tone="emerald" /><ScoreCard label="Goal readiness" value={`${scores.goalReadiness}%`} helper={`Toward ${formatTime(goalTime)} · ${targetLevel}`} tone="amber" /><ScoreCard label="Input quality" value={`${quality.score}%`} helper={`${quality.enteredSplits} entered · ${quality.estimatedSplits} estimated`} tone="emerald" /><ScoreCard label="Live WR gap" value={scores.worldRecordGapPct == null ? "N/A" : `${scores.worldRecordGapPct.toFixed(1)}%`} helper={worldRecord ? `${worldRecord.swimmer} · ${formatTime(worldRecord.total)}` : "No record found"} tone="amber" /></div>

      <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4 p-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-600">Split comparison</p><h3 className="mt-1 text-2xl font-black text-slate-950">Swimmer vs {targetLevel} {selectedReference?.archetype}</h3></div><div className="rounded-2xl bg-slate-950 px-5 py-3 text-right text-white"><p className="text-[9px] font-extrabold uppercase text-slate-400">Goal</p><p className="font-mono text-xl font-black">{formatTime(goalTime)}</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wide text-slate-400"><tr><th className="px-6 py-3">Checkpoint</th><th className="px-4 py-3">Swimmer cumulative</th><th className="px-4 py-3">Data status</th><th className="px-4 py-3">Segment</th><th className="px-4 py-3">Goal segment</th><th className="px-6 py-3">Delta</th></tr></thead><tbody>{checkpoints.map((point, index) => <tr key={point} className="border-t border-slate-100"><td className="px-6 py-4 font-black text-slate-900">{point} m</td><td className="px-4 py-4 font-mono font-black">{formatTime(cumulative[index])}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${completed.enteredMask[index] ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{completed.enteredMask[index] ? "Entered" : "Estimated"}</span></td><td className="px-4 py-4 font-mono text-sm text-slate-600">{formatTime(inputSegments[index])}</td><td className="px-4 py-4 font-mono text-sm text-slate-600">{formatTime(targetSegments[index])}</td><td className={`px-6 py-4 font-mono font-black ${deltas[index] <= 0 ? "text-emerald-600" : "text-rose-600"}`}>{deltas[index] > 0 ? "+" : ""}{deltas[index].toFixed(2)} s</td></tr>)}</tbody></table></div></article>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-violet-600">Coach Block analysis</p><h3 className="mt-1 text-2xl font-black text-slate-950">Gemini-ready race explanation</h3></div><button type="button" onClick={generateAiAnalysis} disabled={aiLoading} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60">{aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}{aiLoading ? "Analyzing…" : "Generate analysis"}</button></div>{aiError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">{aiError} The verified offline analysis is shown instead.</p>}<div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">{aiAnalysis || offlineAnalysis}</div><p className="mt-3 text-xs leading-5 text-slate-500">The deterministic score and split math are supplied to Gemini as locked facts. Without a configured key, the same button returns the verified offline explanation.</p></article><div className="space-y-4"><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-600">Export center</p><h3 className="mt-1 text-xl font-black text-slate-950">Take the analysis with you</h3><button type="button" onClick={exportHtml} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white"><ArrowDownToLine className="h-4 w-4" /> Export analysis page (.html)</button><button type="button" onClick={() => downloadText("setcraft-race-analysis-v3.json", JSON.stringify(resultPayload, null, 2))} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700"><FileJson className="h-4 w-4" /> Export model data (.json)</button></article><article className="rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6"><div className="flex gap-3"><Target className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><div><p className="font-black text-blue-950">Largest pacing opportunity</p><p className="mt-2 text-sm leading-6 text-blue-900">{deltas[leakIndex] > 0 ? `${checkpoints[leakIndex - 1] || 0}–${checkpoints[leakIndex]} m is ${deltas[leakIndex].toFixed(2)} s outside the selected goal model.` : "No positive segment gap appears against the selected model."}</p>{closest && <p className="mt-2 text-xs text-blue-800">Closest observed shape: {closest.swimmer} · {closest.archetype}</p>}</div></div></article></div></div>
    </section>}

    {tab === "library" && <section className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ScoreCard label="Current world records" value={`${WORLD_RECORD_REFERENCES.length}`} helper="Every individual men's and women's LCM event" tone="amber" /><ScoreCard label="2025 Worlds races" value={`${WORLDS_2025_REFERENCES.length}`} helper="Recent observed medal performances" tone="emerald" /><ScoreCard label="Strategy models" value={`${allDerived.length}`} helper="Four levels × three strategies" tone="blue" /><ScoreCard label="Coach additions" value={`${customReferences.length}`} helper="Local, exportable and pending verification" tone="violet" /></div><div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><Filter className="h-4 w-4" /> Reference filters</div><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={librarySearch} onChange={(e) => { setLibrarySearch(e.target.value); setShowCount(16); }} placeholder="Search athlete, event, strategy or meet" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-blue-500" /></label><select value={libraryEvent} onChange={(e) => { setLibraryEvent(e.target.value); setShowCount(16); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold"><option>All events</option>{EVENTS.map((item) => <option key={item}>{item}</option>)}</select><select value={librarySex} onChange={(e) => { setLibrarySex(e.target.value); setShowCount(16); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold"><option>All categories</option><option>Men</option><option>Women</option></select><select value={libraryKind} onChange={(e) => { setLibraryKind(e.target.value as LibraryKind); setShowCount(16); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold"><option value="all">All data types</option><option value="world-record">World records</option><option value="observed">Observed races</option><option value="derived">Modeled strategies</option><option value="coach">Coach-added</option></select></div></div><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-slate-600">Showing {Math.min(showCount, filteredLibrary.length)} of {filteredLibrary.length} references</p><button type="button" onClick={() => downloadText("setcraft-reference-library-v3.json", JSON.stringify(filteredLibrary, null, 2))} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-700"><ArrowDownToLine className="h-4 w-4" /> Export filtered</button></div><div className="space-y-5">{filteredLibrary.slice(0, showCount).map((race) => <ReferenceCard key={race.id} race={race} onDelete={race.dataClass === "coach" ? () => saveCustom(customReferences.filter((item) => item.id !== race.id)) : undefined} />)}</div>{showCount < filteredLibrary.length && <button type="button" onClick={() => setShowCount((count) => count + 16)} className="w-full rounded-2xl border border-slate-200 bg-white py-4 text-sm font-extrabold text-slate-700">Load 16 more</button>}</section>}

    {tab === "contribute" && <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]"><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-violet-600">Coach contribution</p><h3 className="mt-1 text-2xl font-black text-slate-950">Add a reference race</h3><p className="mt-2 text-sm leading-6 text-slate-600">Unknown splits are allowed. SetCraft fills them and labels them estimated until the coach provides measured checkpoints.</p></div><UserRoundPlus className="h-7 w-7 text-slate-300" /></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Athlete / label"><input value={coachForm.swimmer} onChange={(e) => setCoachForm({ ...coachForm, swimmer: e.target.value })} className={inputClass} /></Field><Field label="Meet"><input value={coachForm.meet} onChange={(e) => setCoachForm({ ...coachForm, meet: e.target.value })} className={inputClass} /></Field><Field label="Event"><select value={coachForm.event} onChange={(e) => setCoachForm({ ...coachForm, event: e.target.value, splits: "" })} className={inputClass}>{EVENTS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Category"><select value={coachForm.sex} onChange={(e) => setCoachForm({ ...coachForm, sex: e.target.value as SexCategory })} className={inputClass}><option>Men</option><option>Women</option></select></Field><Field label="Age (optional)"><input type="number" value={coachForm.age} onChange={(e) => setCoachForm({ ...coachForm, age: e.target.value })} className={inputClass} /></Field><Field label="Reference level"><select value={coachForm.level} onChange={(e) => setCoachForm({ ...coachForm, level: e.target.value as ReferenceLevel })} className={inputClass}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></Field><Field label="Final time"><input value={coachForm.total} onChange={(e) => setCoachForm({ ...coachForm, total: e.target.value })} className={`${inputClass} font-mono`} /></Field><Field label="Strategy label"><input value={coachForm.archetype} onChange={(e) => setCoachForm({ ...coachForm, archetype: e.target.value })} className={inputClass} /></Field><Field label={`Cumulative splits · ${defaultCheckpoints(coachForm.event).join(" / ")} m`} className="sm:col-span-2"><input value={coachForm.splits} onChange={(e) => setCoachForm({ ...coachForm, splits: e.target.value })} placeholder="Use commas; blanks are allowed" className={`${inputClass} font-mono`} /></Field><Field label="Result source URL" className="sm:col-span-2"><input value={coachForm.sourceUrl} onChange={(e) => setCoachForm({ ...coachForm, sourceUrl: e.target.value })} className={inputClass} /></Field></div><button type="button" onClick={addCoachReference} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-4 text-sm font-extrabold text-white"><Plus className="h-4 w-4" /> Add pending reference</button>{importNotice && <p className="mt-3 rounded-xl bg-slate-100 p-3 text-xs font-bold leading-5 text-slate-600">{importNotice}</p>}</article><div className="space-y-6"><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-600">Bulk contribution</p><h3 className="mt-1 text-xl font-black text-slate-950">Import coach CSV</h3><textarea value={csvInput} onChange={(e) => setCsvInput(e.target.value)} rows={9} className="mt-4 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs leading-6" placeholder="Paste CSV rows…" /><button type="button" onClick={importRaces} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold"><Upload className="h-4 w-4" /> Import pending references</button><button type="button" onClick={() => downloadText("setcraft-reference-template-v3.csv", "swimmer,event,sex,course,age,level,total,checkpoints,splits,meet,archetype,source_url\nJane Doe,200 Free,Women,LCM,16,Nationals,2:02.10,50|100|150|200,28.40||1:30.60|2:02.10,Championship final,Balanced close,https://example.com/result", "text/csv")} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-extrabold"><ArrowDownToLine className="h-4 w-4" /> Download CSV template</button></article><article className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6"><CircleAlert className="h-6 w-6 text-amber-600" /><p className="mt-3 font-black text-amber-950">Verification stays visible</p><p className="mt-2 text-sm leading-6 text-amber-900">Coach-added races remain pending. Only authorized club files or linked official results should be used, especially for minors.</p></article></div></section>}

    {tab === "method" && <section className="grid gap-6 xl:grid-cols-[1fr_.9fr]"><div className="space-y-6"><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><Scale className="h-7 w-7 text-blue-600" /><h3 className="mt-3 text-2xl font-black text-slate-950">Transparent scoring</h3><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Official AQUA points</p><p className="mt-2 font-mono text-xs">trunc(1000 × (2026 base ÷ time)³)</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">SetCraft score</p><p className="mt-2 text-xs leading-5 text-slate-600">60% AQUA strength + 25% exact-age strength + 15% goal readiness. If no age table exists, weights redistribute to 80% + 20%.</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Missing splits</p><p className="mt-2 text-xs leading-5 text-slate-600">Known anchors stay fixed. Missing points inherit the selected balanced race shape between anchors and are marked estimated.</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Input quality</p><p className="mt-2 text-xs leading-5 text-slate-600">Race time, monotonicity, entered-vs-estimated splits, context and timing provenance. Optional factors only enter the denominator when switched on.</p></div></div></article><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-600">Provenance</p><h3 className="mt-1 text-xl font-black text-slate-950">Inspectable sources</h3></div><BookOpen className="h-6 w-6 text-slate-300" /></div><div className="mt-5 divide-y divide-slate-100">{OFFICIAL_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-4 py-4"><div><p className="text-sm font-black text-slate-900">{source.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{source.detail}</p></div><Link2 className="mt-1 h-4 w-4 shrink-0 text-slate-300" /></a>)}</div></article></div><div className="space-y-6"><article className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white"><ShieldCheck className="h-7 w-7 text-cyan-300" /><h3 className="mt-3 text-xl font-black">Scientific guardrails</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300"><li>• Strength and explosiveness can be relevant to starts and turns, but self-ratings are not laboratory measurements.</li><li>• Lactate production/tolerance ratings are context—not a diagnosis or blood-lactate result.</li><li>• Mobility and body mass never change official points.</li><li>• Age standards describe current performance, not guaranteed future potential.</li><li>• AI explains locked calculations and must disclose estimated splits.</li></ul></article><article className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6"><p className="font-black text-amber-950">Requested SwimCloud result: {SWIMCLOUD_REQUEST.status}</p><p className="mt-2 text-sm leading-6 text-amber-900">{SWIMCLOUD_REQUEST.note}</p><a href={SWIMCLOUD_REQUEST.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-amber-950 underline">Open result page <Link2 className="h-3.5 w-3.5" /></a></article><article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><Database className="h-7 w-7 text-violet-600" /><h3 className="mt-3 text-xl font-black text-slate-950">v3 coverage</h3><div className="mt-4 grid grid-cols-2 gap-2 text-xs">{["34 current LCM records", "Official 2026 AQUA points", "Exact-age scoring", "Goal readiness", "408 strategy profiles", "99 recent Worlds races", "Partial split estimation", "Per-checkpoint provenance", "8 optional athlete factors", "Gemini analysis route", "HTML analysis export", "Coach CSV import"].map((item) => <div key={item} className="rounded-xl bg-slate-50 p-3 font-bold text-slate-600">{item}</div>)}</div></article></div></section>}
  </div>;
}
