import React, { useMemo, useState } from "react";
import {
  Bot, CheckCircle2, Database, Download, FlaskConical, Gauge, Layers3,
  RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy,
} from "lucide-react";
import AthleteProfilePanel from "./AthleteProfilePanel";
import { createAthleteProfile, profileSummary, resolvedAthleteRatings } from "../athleteProfile";
import { OBSERVED_RACE_LIBRARY, OBSERVED_RACE_LIBRARY_MANIFEST } from "../generated/observedRaceLibrary";
import { downloadIntelligencePdf } from "../intelligencePdf";
import { alignReferenceToAnalysis, referenceRows } from "../referenceLibrary";
import {
  Course, courseUnit, defaultCheckpoints, eventsForCourse, formatTime, getRecordBenchmark,
  getStandard, rankStrategies, RaceReference, SexCategory, strategyDefinitions, timeToSeconds,
} from "../raceModel";

type StudioTab = "plan" | "profile" | "references" | "brief";
const LEVELS = ["Sectionals", "Nationals", "Trials", "World Class"] as const;
const INPUT = "w-full rounded-xl border border-disabled bg-white px-3.5 py-3 text-sm font-bold text-surface outline-none transition focus:border-accent-hover focus:ring-4 focus:ring-canvas-raised";

function normalizedPlan(event: string, course: Course, total: number, factors: number[]) {
  const checkpoints = defaultCheckpoints(event, course);
  const distances = checkpoints.map((point, index) => point - (checkpoints[index - 1] || 0));
  const weighted = distances.map((distance, index) => distance * (factors[index] || factors.at(-1) || 1));
  const scale = total / Math.max(0.001, weighted.reduce((sum, value) => sum + value, 0));
  let running = 0;
  return checkpoints.map((point, index) => {
    const split = weighted[index] * scale;
    running += split;
    return { point, split, cumulative: index === checkpoints.length - 1 ? total : running };
  });
}

function downloadJson(name: string, payload: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}

export default function RaceStrategyStudio() {
  const [tab, setTab] = useState<StudioTab>("plan");
  const [course, setCourse] = useState<Course>("LCM");
  const [event, setEvent] = useState("200 Free");
  const [sex, setSex] = useState<SexCategory>("Men");
  const [age, setAge] = useState(16);
  const [height, setHeight] = useState(178);
  const [mass, setMass] = useState(70);
  const [pbText, setPbText] = useState("1:53.20");
  const [goalText, setGoalText] = useState("1:50.00");
  const [profile, setProfile] = useState(createAthleteProfile(true));
  const [strategyId, setStrategyId] = useState("");
  const [referenceLevel, setReferenceLevel] = useState<(typeof LEVELS)[number] | "All">("All");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const goal = timeToSeconds(goalText);
  const pb = timeToSeconds(pbText);
  const ratings = resolvedAthleteRatings(profile);
  const ranked = useMemo(() => rankStrategies(event, { ...ratings, age, heightCm: height, weightKg: mass }), [event, ratings, age, height, mass]);
  const selected = ranked.find((item) => item.id === strategyId) || ranked[0] || strategyDefinitions(event)[0];
  const plan = normalizedPlan(event, course, goal, selected?.paceFactors || [1]);
  const record = getRecordBenchmark(event, sex, course);
  const references = useMemo(() => OBSERVED_RACE_LIBRARY
    .filter((item) => item.course === course && item.event === event && item.sex === sex && (referenceLevel === "All" || item.level === referenceLevel))
    .map((item) => ({ item, distance: Math.abs(Math.log(item.total / Math.max(goal, 0.01))) + (item.archetype.toLowerCase().includes(selected?.name.toLowerCase().split(" ")[0] || "") ? -0.08 : 0) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8)
    .map(({ item }) => item), [course, event, sex, goal, referenceLevel, selected?.name]);
  const primaryReference = references[0];
  const standards = LEVELS.map((level) => ({ level, time: getStandard(level, event, sex, age, course) })).filter((item) => item.time);
  const improvement = pb > 0 && goal > 0 ? pb - goal : 0;

  const offlineBrief = `RACE SHAPE\n${selected?.name} is the strongest deterministic match (${selected?.fit}% fit). ${selected?.description}\n\nEXECUTION\nUse the checkpoint plan as a first rehearsal target. The total is normalized to ${formatTime(goal)} exactly; preserve technical quality before forcing a split.\n\nREFERENCE\n${primaryReference ? `${primaryReference.swimmer}, ${primaryReference.meet}, ${formatTime(primaryReference.total)} (${primaryReference.level}) is the nearest official result in the filtered library. Compare proportional race shape, not raw time alone.` : "No exact event/course/category reference is available in the current filter."}\n\nRISK\n${selected?.risk}\n\nCOACH CHECK\nValidate starts, turns, underwater distance and clean-swim rhythm with video or official timing. Athlete profile values are context, not diagnosis.`;

  const payload = { generated: new Date().toISOString(), course, event, sex, athlete: { age, heightCm: height, massKg: mass, profile, profileSummary: profileSummary(profile) }, personalBest: pb, goal, improvement, strategy: selected, plan, standards, record, references };

  const generateBrief = async () => {
    setAiLoading(true); setAiError("");
    try {
      const response = await fetch("/api/gemini/strategy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verifiedStrategy: JSON.stringify(payload), offlineFallback: offlineBrief }) });
      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const data = await response.json(); setAiText(data.text || offlineBrief);
    } catch (error) { setAiError(error instanceof Error ? error.message : "AI unavailable"); setAiText(offlineBrief); }
    finally { setAiLoading(false); }
  };

  const exportPdf = () => downloadIntelligencePdf(`lanelab-${event.toLowerCase().replaceAll(" ", "-")}-${course.toLowerCase()}-strategy.pdf`, {
    title: `${event} Race Strategy`, kicker: "LaneLab Strategy Studio",
    subtitle: `${course} ${sex} plan for a ${formatTime(goal)} goal. Strategy targets are coaching aids; reference checkpoints retain their source provenance.`,
    generatedLabel: new Date().toLocaleString(),
    metrics: [
      { label: "Goal", value: formatTime(goal), note: `${event} ${course}` },
      { label: "Personal best", value: formatTime(pb), note: improvement > 0 ? `${improvement.toFixed(2)} s improvement` : "Goal is not faster than PB" },
      { label: "Strategy", value: selected?.name || "—", note: `${selected?.fit || 0}% context fit` },
      { label: course === "SCY" ? "U.S. Open benchmark" : "World record", value: record ? formatTime(record.total) : "N/A", note: record?.swimmer },
      { label: "Reference races", value: `${references.length}`, note: `${OBSERVED_RACE_LIBRARY_MANIFEST.includedSwims.toLocaleString()} in library` },
      { label: "Profile", value: profile.enabled ? "On" : "Off", note: profileSummary(profile).slice(0, 35) },
    ],
    sections: [
      { title: "Exact split plan", table: { headers: ["Checkpoint", "Segment", "Cumulative", "Cue"], widths: [1, 1, 1, 2], rows: plan.map((item, index) => [`${item.point} ${courseUnit(course)}`, formatTime(item.split), formatTime(item.cumulative), index === 0 ? "Clean commitment" : index === plan.length - 1 ? "Finish through wall" : selected?.name || "Hold shape"]) } },
      { title: "Strategy rationale", body: [selected?.description || "", `Best for: ${selected?.bestFor || "—"}`, `Primary risk: ${selected?.risk || "—"}`] },
      { title: "Nearest official examples", table: { headers: ["Athlete", "Time", "Level", "Race shape", "Meet"], widths: [1.5, .8, 1, 1.2, 2], rows: references.slice(0, 6).map((item) => [item.swimmer, formatTime(item.total), item.level, item.archetype, item.meet]) } },
      { title: "Coach brief", body: [(aiText || offlineBrief)] },
      { title: "Athlete context", body: [profileSummary(profile)] },
    ],
    footerNote: "Official reference races remain separate from world-record benchmarks. Measured athlete values are protocol-dependent context and are not medical or diagnostic conclusions.",
  });

  const switchCourse = (next: Course) => {
    const options = eventsForCourse(next);
    setCourse(next); setEvent(options.includes(event) ? event : "200 Free"); setStrategyId(""); setAiText("");
  };

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-[26px] border border-hairline bg-surface text-white">
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,.32),transparent_38%)] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div><div className="flex items-center gap-2 text-ink-muted"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[.2em]">Professional strategy workspace</span></div><h2 className="mt-2 text-3xl font-black">Plan. Compare. Brief.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Build an exact race plan, control every athlete factor independently, and ground the recommendation in official comparison swims.</p></div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-2">{(["LCM", "SCM", "SCY"] as Course[]).map((item) => <button type="button" key={item} onClick={() => switchCourse(item)} className={`rounded-xl px-5 py-3 text-xs font-black ${course === item ? "bg-disabled text-surface" : "text-disabled hover:bg-white/10"}`}>{item}</button>)}</div>
        </div>
      </div>
    </section>

    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-hairline-on-canvas bg-white p-2 shadow-sm">{([
      ["plan", Target, "Race plan"], ["profile", SlidersHorizontal, "Athlete profile"], ["references", Database, "Reference races"], ["brief", Bot, "Coach brief"],
    ] as Array<[StudioTab, React.ElementType, string]>).map(([id, Icon, label]) => <button type="button" key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-xs font-black ${tab === id ? "bg-surface text-white" : "text-ink-muted-on-canvas hover:bg-canvas"}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>

    {tab === "plan" && <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <StudioCard eyebrow="Race facts" title="Set the performance target">
        <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Event"><select className={INPUT} value={event} onChange={(e) => { setEvent(e.target.value); setStrategyId(""); }}>{eventsForCourse(course).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Category"><select className={INPUT} value={sex} onChange={(e) => setSex(e.target.value as SexCategory)}><option>Men</option><option>Women</option></select></Field></div><div className="grid grid-cols-3 gap-3"><Field label="Age"><input className={INPUT} type="number" min="5" max="100" value={age} onChange={(e) => setAge(Number(e.target.value))} /></Field><Field label="Height cm"><input className={INPUT} type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></Field><Field label="Mass kg"><input className={INPUT} type="number" value={mass} onChange={(e) => setMass(Number(e.target.value))} /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Current PB"><input className={`${INPUT} font-mono`} value={pbText} onChange={(e) => setPbText(e.target.value)} /></Field><Field label="Goal"><input className={`${INPUT} font-mono`} value={goalText} onChange={(e) => setGoalText(e.target.value)} /></Field></div></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><MiniMetric label="Improvement" value={improvement > 0 ? `${improvement.toFixed(2)}s` : "Review goal"} /><MiniMetric label="Official examples" value={`${OBSERVED_RACE_LIBRARY.filter((item) => item.course === course && item.event === event && item.sex === sex).length}`} /></div>
      </StudioCard>
      <div className="space-y-6"><StudioCard eyebrow="Recommended architecture" title={selected?.name || "Race strategy"} action={<span className="rounded-full bg-canvas-raised px-3 py-1.5 text-xs font-black text-accent-active">{selected?.fit || 0}% fit</span>}>
        <div className="grid gap-3 md:grid-cols-3">{ranked.map((item) => <button type="button" key={item.id} onClick={() => setStrategyId(item.id)} className={`rounded-2xl border p-4 text-left ${item.id === selected?.id ? "border-accent-hover bg-canvas ring-4 ring-canvas-raised" : "border-hairline-on-canvas hover:border-hairline-on-canvas"}`}><div className="flex items-center justify-between gap-2"><p className="text-sm font-black text-surface">{item.name}</p><span className="font-mono text-xs font-black text-accent-active">{item.fit}%</span></div><p className="mt-2 text-xs leading-5 text-ink-muted-on-canvas">{item.description}</p></button>)}</div>
        <RaceTable plan={plan} course={course} cue={selected?.name || "Hold shape"} />
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-3 text-xs font-black text-white"><Download className="h-4 w-4" />Export strategy PDF</button><button type="button" onClick={() => downloadJson("setcraft-race-strategy-v13.json", payload)} className="inline-flex items-center gap-2 rounded-xl border border-disabled bg-white px-4 py-3 text-xs font-black text-ink-on-canvas"><Layers3 className="h-4 w-4" />Export JSON</button></div>
      </StudioCard></div>
    </div>}

    {tab === "profile" && <StudioCard eyebrow="Optional performance context" title="Choose rating or professional value"><AthleteProfilePanel value={profile} onChange={setProfile} /></StudioCard>}

    {tab === "references" && <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]"><StudioCard eyebrow="Reference filter" title="Comparable field"><Field label="Performance level"><select className={INPUT} value={referenceLevel} onChange={(e) => setReferenceLevel(e.target.value as typeof referenceLevel)}><option>All</option>{LEVELS.map((item) => <option key={item}>{item}</option>)}</select></Field><div className="mt-5 space-y-2 text-xs text-ink-muted-on-canvas"><p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-ink-muted-on-canvas" />Official result files</p><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-ink-muted-on-canvas" />Minor names anonymized</p><p className="flex items-center gap-2"><Database className="h-4 w-4 text-ink-muted-on-canvas" />{OBSERVED_RACE_LIBRARY_MANIFEST.includedSwims.toLocaleString()} indexed races</p></div></StudioCard><StudioCard eyebrow="Nearest examples" title={`${event} ${course} · ${sex}`}><div className="grid gap-4 lg:grid-cols-2">{references.map((reference) => <ReferenceCard key={reference.id} reference={reference} />)}{!references.length && <p className="rounded-2xl border border-dashed border-disabled p-8 text-center text-sm font-bold text-ink-muted-on-canvas">No reference matches this filter.</p>}</div></StudioCard></div>}

    {tab === "brief" && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><StudioCard eyebrow="Coach Block AI" title="Evidence-locked execution brief" action={<button type="button" onClick={generateBrief} disabled={aiLoading} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-black text-white disabled:opacity-60">{aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}{aiLoading ? "Drafting…" : "Generate brief"}</button>}>{aiError && <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">{aiError}. The verified offline brief is shown.</p>}<div className="whitespace-pre-wrap rounded-2xl bg-surface p-5 text-sm leading-7 text-ink-muted">{aiText || offlineBrief}</div></StudioCard><div className="space-y-4"><Insight icon={Gauge} label="Best fit" text={selected?.bestFor || "—"} tone="emerald" /><Insight icon={Trophy} label="Primary risk" text={selected?.risk || "—"} tone="rose" /><Insight icon={FlaskConical} label="Profile evidence" text={profileSummary(profile)} tone="blue" /><button type="button" onClick={exportPdf} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface px-5 py-4 text-sm font-black text-white"><Download className="h-4 w-4" />Export strategy PDF</button></div></div>}
  </div>;
}

function StudioCard({ eyebrow, title, action, children }: { eyebrow: string; title: string; action?: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-[24px] border border-hairline-on-canvas bg-white p-5 shadow-sm md:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-accent-active">{eyebrow}</p><h3 className="mt-1 text-xl font-black text-surface">{title}</h3></div>{action}</div>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-ink-muted-on-canvas">{label}</span>{children}</label>; }
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-canvas-raised p-4"><p className="text-[10px] font-black uppercase tracking-wide text-ink-muted-on-canvas">{label}</p><p className="mt-1 font-mono text-xl font-black text-surface">{value}</p></div>; }
function RaceTable({ plan, course, cue }: { plan: Array<{ point: number; split: number; cumulative: number }>; course: Course; cue: string }) { return <div className="mt-5 overflow-x-auto rounded-2xl border border-hairline-on-canvas"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-surface text-white"><tr>{["Checkpoint", "Segment", "Cumulative", "Execution cue"].map((item) => <th key={item} className="px-4 py-3 text-[10px] font-black uppercase tracking-wide">{item}</th>)}</tr></thead><tbody className="divide-y divide-canvas-raised">{plan.map((item, index) => <tr key={item.point}><td className="px-4 py-3 font-black">{item.point} {courseUnit(course)}</td><td className="px-4 py-3 font-mono font-black text-accent-active">{formatTime(item.split)}</td><td className="px-4 py-3 font-mono">{formatTime(item.cumulative)}</td><td className="px-4 py-3 text-xs text-ink-muted-on-canvas">{index === 0 ? "Clean commitment" : index === plan.length - 1 ? "Finish through wall" : cue}</td></tr>)}</tbody></table></div>; }
function ReferenceCard({ reference }: { reference: RaceReference }) { const aligned = alignReferenceToAnalysis(reference); return <article className="rounded-2xl border border-hairline-on-canvas p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-surface">{reference.swimmer}</p><p className="mt-1 text-[11px] text-ink-muted-on-canvas">{reference.meet} · {reference.round || "Result"}</p></div><div className="text-right"><p className="font-mono text-lg font-black text-accent-active">{formatTime(reference.total)}</p><p className="text-[10px] font-black uppercase text-ink-muted-on-canvas">{reference.level}</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{referenceRows(aligned).map((row) => <span key={row.checkpoint} className={`rounded-lg px-2 py-1 font-mono text-[10px] font-bold ${row.provenance === "estimated" ? "bg-amber-50 text-amber-700" : "bg-canvas text-accent-active"}`}>{row.checkpoint}: {formatTime(row.cumulative)}</span>)}</div><p className="mt-3 text-[10px] font-bold text-ink-muted-on-canvas">{reference.archetype} · green measured / amber projected</p></article>; }
function Insight({ icon: Icon, label, text, tone }: { icon: React.ElementType; label: string; text: string; tone: "emerald" | "rose" | "blue" }) { const colors = { emerald: "border-hairline-on-canvas bg-canvas text-surface", rose: "border-rose-200 bg-rose-50 text-rose-950", blue: "border-hairline-on-canvas bg-canvas text-surface" }[tone]; return <div className={`rounded-2xl border p-5 ${colors}`}><Icon className="h-5 w-5" /><p className="mt-3 text-[10px] font-black uppercase tracking-wide">{label}</p><p className="mt-2 text-sm font-bold leading-6">{text}</p></div>; }
