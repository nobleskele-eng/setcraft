/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowRightLeft,
  BrainCircuit,
  Calculator,
  Clock3,
  Gauge,
  Layers3,
  Ruler,
  Sigma,
  Waves,
  Zap,
} from "lucide-react";
import {
  buildPaceTable,
  calculateCriticalSwimSpeed,
  calculateSendoff,
  calculateSetMath,
  calculateStrokeMetrics,
  convertDistance,
  formatSwimTime,
  parseSwimTime,
  planSplits,
  sameVelocityConvertedTime,
  SplitStrategy,
} from "../swimMath";
import {
  Course, convertCourseTime, courseUnit, defaultCheckpoints, eventsForCourse, formatTime,
  getRecordBenchmark, getStandard, rankStrategies, SexCategory, strategyDefinitions, timeToSeconds,
} from "../raceModel";
import RaceStrategyStudio from "./RaceStrategyStudio";

type CalculatorTab = "strategy" | "pace" | "splits" | "sendoff" | "css" | "efficiency" | "setmath" | "conversion";

const TABS: Array<{ id: CalculatorTab; label: string; icon: React.ElementType }> = [
  { id: "strategy", label: "Race strategy AI", icon: BrainCircuit },
  { id: "pace", label: "Pace table", icon: Gauge },
  { id: "splits", label: "Race splits", icon: Layers3 },
  { id: "sendoff", label: "Send-offs", icon: Clock3 },
  { id: "css", label: "Critical speed", icon: Activity },
  { id: "efficiency", label: "Stroke efficiency", icon: Waves },
  { id: "setmath", label: "Set math", icon: Sigma },
  { id: "conversion", label: "Course convert", icon: ArrowRightLeft },
];

export default function Calculators() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>("strategy");

  return (
    <div className="mx-auto max-w-[1540px] space-y-6" id="calculators-hub">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 px-7 py-8 text-white md:px-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-300">
                <Calculator className="h-5 w-5" />
                <span className="text-xs font-extrabold uppercase tracking-[0.18em]">SetCraft Strategy Intelligence v13</span>
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Race Strategy Studio</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                A professional planning workspace with independently controlled athlete factors, measured-value protocols, official reference swims, exact split plans and exportable reports.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm text-slate-300 backdrop-blur">
              <p className="font-extrabold text-white">Coach-controlled outputs</p>
              <p className="mt-1 max-w-sm text-xs leading-5">Calculators show the formula and assumptions. They do not replace coaching judgement or official meet-conversion tables.</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 md:px-7">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition ${active ? "border-indigo-200 bg-white text-indigo-700 shadow-sm" : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900"}`}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 md:p-8 lg:p-10">
          {activeTab === "strategy" && <RaceStrategyStudio />}
          {activeTab === "pace" && <PaceCalculator />}
          {activeTab === "splits" && <SplitCalculator />}
          {activeTab === "sendoff" && <SendoffCalculator />}
          {activeTab === "css" && <CriticalSpeedCalculator />}
          {activeTab === "efficiency" && <EfficiencyCalculator />}
          {activeTab === "setmath" && <SetMathCalculator />}
          {activeTab === "conversion" && <ConversionCalculator />}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ReferenceCard title="Send-off vs. rest" text="A send-off fixes the start-to-start cycle. A rest interval begins after the swimmer touches, so faster and slower swimmers receive the same rest." />
        <ReferenceCard title="Exact totals first" text="Split plans are normalized so every displayed split adds back to the exact target time rather than drifting through rounding." />
        <ReferenceCard title="Conversion caution" text="NCAA factors and record-ratio estimates are shown with their method. Planning conversions are never silently presented as legal meet-entry times." />
      </section>
    </div>
  );
}

function normalizedStrategyPlan(event: string, course: Course, total: number, factors: number[]) {
  const checkpoints = defaultCheckpoints(event, course);
  const distances = checkpoints.map((point, index) => point - (checkpoints[index - 1] || 0));
  const weighted = distances.map((distance, index) => distance * (factors[index] || 1));
  const scale = total / Math.max(0.001, weighted.reduce((sum, value) => sum + value, 0));
  let running = 0;
  return checkpoints.map((point, index) => {
    const split = weighted[index] * scale;
    running += split;
    return { point, split, cumulative: index === checkpoints.length - 1 ? total : running };
  });
}

export function LegacyRaceStrategyCalculator() {
  const [course, setCourse] = useState<Course>("LCM");
  const [event, setEvent] = useState("200 Free");
  const [sex, setSex] = useState<SexCategory>("Men");
  const [age, setAge] = useState(16);
  const [goal, setGoal] = useState("1:50.00");
  const [pb, setPb] = useState("1:53.20");
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(70);
  const [speed, setSpeed] = useState(7);
  const [aerobic, setAerobic] = useState(8);
  const [lactate, setLactate] = useState(6);
  const [power, setPower] = useState(7);
  const [turns, setTurns] = useState(6);
  const [underwater, setUnderwater] = useState(6);
  const [technique, setTechnique] = useState(8);
  const [selectedId, setSelectedId] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const goalSeconds = timeToSeconds(goal);
  const pbSeconds = timeToSeconds(pb);
  const profile = { age, heightCm: height, weightKg: weight, speed, aerobic, lactateTolerance: lactate, power, turns, underwater, technique };
  const ranked = rankStrategies(event, profile);
  const selected = ranked.find((item) => item.id === selectedId) || ranked[0];
  const plan = normalizedStrategyPlan(event, course, goalSeconds, selected?.paceFactors || strategyDefinitions(event)[0].paceFactors);
  const benchmark = getRecordBenchmark(event, sex, course);
  const cuts = (["Sectionals", "Nationals", "Trials", "World Class"] as const).map((level) => ({ level, time: getStandard(level, event, sex, age, course) })).filter((item) => item.time);
  const improvement = pbSeconds && goalSeconds ? pbSeconds - goalSeconds : 0;
  const improvementPct = pbSeconds ? improvement / pbSeconds * 100 : 0;
  const strategyPayload = {
    course, event, sex, athlete: { age, heightCm: height, weightKg: weight, profile },
    personalBest: pbSeconds, goal: goalSeconds, requiredImprovementSeconds: improvement,
    recommended: selected, alternatives: ranked, splitPlan: plan,
    benchmark: benchmark ? { label: course === "SCY" ? "U.S. Open benchmark" : "world record", athlete: benchmark.swimmer, time: benchmark.total } : null,
    comparisons: cuts,
  };
  const offline = `RECOMMENDED SHAPE\n${selected?.name} is the strongest deterministic match (${selected?.fit}% fit). ${selected?.description}\n\nWHY IT FITS\n${selected?.bestFor}. The ranking uses the optional profile as context, not as a physiological test.\n\nRACE EXECUTION\nHold the displayed segment targets within ±0.2 s for sprint segments or ±0.5% for longer repeats. Validate the first half and closing segment separately before combining them.\n\nRISK CONTROL\n${selected?.risk} The ${Math.max(0, improvement).toFixed(2)} s goal improvement (${Math.max(0, improvementPct).toFixed(1)}%) should be staged through repeatable race-pace rehearsals, not assumed from one calculation.\n\nCOACH CHECK\nUse official timing/video to verify starts, walls, underwaters and stroke integrity. Do not infer blood lactate or readiness from the self-rating.`;

  const askAi = async () => {
    setAiLoading(true); setAiError("");
    try {
      const response = await fetch("/api/gemini/strategy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verifiedStrategy: JSON.stringify(strategyPayload), offlineFallback: offline }) });
      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const data = await response.json(); setAiResult(data.text || offline);
    } catch (error) { setAiError(error instanceof Error ? error.message : "AI unavailable"); setAiResult(offline); }
    finally { setAiLoading(false); }
  };

  const switchCourse = (next: Course) => {
    const options = eventsForCourse(next);
    setCourse(next); setEvent(options.includes(event) ? event : "200 Free"); setSelectedId(""); setAiResult("");
  };

  return <div className="space-y-7">
    <div className="grid gap-7 xl:grid-cols-[430px_minmax(0,1fr)]">
      <section className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 md:p-6">
        <div className="flex items-center gap-2 text-indigo-600"><BrainCircuit className="h-5 w-5" /><p className="text-xs font-extrabold uppercase tracking-[.16em]">Athlete + race inputs</p></div>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">Advanced race strategy</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Choose the course and goal, then add only the athlete context you trust. All official benchmarks remain independent of profile inputs.</p>
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-2">{(["LCM", "SCM", "SCY"] as Course[]).map((item) => <button type="button" key={item} onClick={() => switchCourse(item)} className={`rounded-xl border px-3 py-3 text-sm font-extrabold ${course === item ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
          <div className="grid grid-cols-2 gap-3"><Field label="Event"><select value={event} onChange={(e) => { setEvent(e.target.value); setSelectedId(""); }} className={inputClass}>{eventsForCourse(course).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Category"><select value={sex} onChange={(e) => setSex(e.target.value as SexCategory)} className={inputClass}><option>Men</option><option>Women</option></select></Field></div>
          <div className="grid grid-cols-3 gap-3"><Field label="Age"><NumberInput value={age} min={5} max={100} onChange={setAge} /></Field><Field label="Height"><NumberInput value={height} min={80} max={250} onChange={setHeight} suffix="cm" /></Field><Field label="Mass"><NumberInput value={weight} min={20} max={250} onChange={setWeight} suffix="kg" /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Current PB"><TextInput value={pb} onChange={setPb} mono /></Field><Field label="Goal time"><TextInput value={goal} onChange={setGoal} mono /></Field></div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700">Optional 1–10 context</p><div className="mt-3 space-y-3">{[
            ["Speed", speed, setSpeed], ["Aerobic", aerobic, setAerobic], ["Lactate tolerance", lactate, setLactate], ["Power", power, setPower], ["Turns", turns, setTurns], ["Underwater", underwater, setUnderwater], ["Technique", technique, setTechnique],
          ].map(([label, value, setter]) => <label key={label as string} className="grid grid-cols-[92px_1fr_28px] items-center gap-2 text-[11px] font-bold text-slate-600"><span>{label as string}</span><input type="range" min={1} max={10} value={value as number} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value))} className="accent-violet-600" /><span className="font-mono font-black text-violet-700">{value as number}</span></label>)}</div></div>
          <Notice>“Lactate tolerance” is a coach/athlete context rating—not a blood-lactate measurement. It ranks plan fit but never changes records, points or standards.</Notice>
        </div>
      </section>
      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-emerald-600">Recommended plan</p><h3 className="mt-1 text-2xl font-extrabold text-slate-950">{selected?.name}</h3></div><span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-extrabold text-white">{selected?.fit}% profile fit</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Goal" value={formatTime(goalSeconds)} accent /><Metric label="PB improvement" value={improvement > 0 ? `${improvement.toFixed(2)}s` : "Goal ≥ PB"} /><Metric label={course === "SCY" ? "U.S. Open benchmark" : "World record"} value={benchmark ? formatTime(benchmark.total) : "N/A"} /></div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">{ranked.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`rounded-2xl border p-4 text-left ${item.id === selected?.id ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200"}`}><div className="flex items-center justify-between"><span className="text-sm font-extrabold text-slate-900">{item.name}</span><span className="font-mono text-xs font-black text-indigo-700">{item.fit}%</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p></button>)}</div>
        <ResultTable headers={["Checkpoint", "Segment target", "Cumulative", "Execution cue"]} rows={plan.map((item, index) => [`${item.point} ${courseUnit(course)}`, formatTime(item.split), formatTime(item.cumulative), index === 0 ? "Commit cleanly, no rush" : index === plan.length - 1 ? "Hold line and finish through wall" : selected?.name])} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cuts.map((item) => <Metric key={item.level} label={course === "SCY" && item.level === "Nationals" ? "Winter Juniors" : course === "SCY" && item.level === "Trials" ? "NCAA DI" : item.level} value={formatTime(item.time!)} />)}</div>
      </section>
    </div>
    <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-violet-600">Coach Block strategy AI</p><h3 className="mt-1 text-2xl font-extrabold text-slate-950">Turn the plan into execution language</h3></div><button type="button" onClick={askAi} disabled={aiLoading} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60">{aiLoading ? <RefreshIcon /> : <Zap className="h-4 w-4" />}{aiLoading ? "Drafting…" : "Generate coach brief"}</button></div>{aiError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">{aiError}. Verified offline brief is shown.</p>}<div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">{aiResult || offline}</div></div>
      <div className="space-y-4"><div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-6"><p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Best fit</p><p className="mt-2 font-extrabold text-emerald-950">{selected?.bestFor}</p></div><div className="rounded-[26px] border border-rose-200 bg-rose-50 p-6"><p className="text-[10px] font-extrabold uppercase tracking-wide text-rose-700">Primary risk</p><p className="mt-2 text-sm font-bold leading-6 text-rose-950">{selected?.risk}</p></div></div>
    </section>
  </div>;
}

function RefreshIcon() { return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />; }

function PaceCalculator() {
  const [distance, setDistance] = useState(500);
  const [time, setTime] = useState("7:30.0");
  const [customDistance, setCustomDistance] = useState(75);
  const seconds = parseSwimTime(time);
  const rows = useMemo(() => buildPaceTable(distance, seconds, [25, 50, 75, 100, 200, 400]), [distance, seconds]);
  const custom = buildPaceTable(distance, seconds, [customDistance])[0];
  const velocity = seconds > 0 ? distance / seconds : 0;

  return (
    <CalculatorLayout
      title="Pace table"
      description="Convert one swim result into exact pace references for common training distances."
      inputs={
        <>
          <Field label="Completed distance"><NumberInput value={distance} min={1} onChange={setDistance} suffix="m / yd" /></Field>
          <Field label="Total time"><TextInput value={time} onChange={setTime} placeholder="7:30.0" mono /></Field>
          <Field label="Custom split distance"><NumberInput value={customDistance} min={1} onChange={setCustomDistance} suffix="m / yd" /></Field>
          <Formula>pace for X = total time ÷ total distance × X</Formula>
        </>
      }
      output={
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Pace per 100" value={rows.find((row) => row.distance === 100)?.formatted || "—"} />
            <Metric label="Velocity" value={velocity > 0 ? `${velocity.toFixed(3)} /s` : "—"} />
            <Metric label={`Pace per ${customDistance}`} value={custom?.formatted || "—"} />
          </div>
          <ResultTable headers={["Distance", "Target time", "Seconds"]} rows={rows.map((row) => [`${row.distance}`, row.formatted, row.seconds.toFixed(2)])} />
        </>
      }
    />
  );
}

function SplitCalculator() {
  const [distance, setDistance] = useState(200);
  const [time, setTime] = useState("2:00.0");
  const [splitDistance, setSplitDistance] = useState(50);
  const [strategy, setStrategy] = useState<SplitStrategy>("negative");
  const seconds = parseSwimTime(time);
  const splits = useMemo(() => planSplits(distance, seconds, splitDistance, strategy), [distance, seconds, splitDistance, strategy]);
  const total = splits.reduce((sum, item) => sum + item.splitSeconds, 0);

  return (
    <CalculatorLayout
      title="Race split planner"
      description="Plan even, negative, positive or fast-finish splits while preserving the exact target total."
      inputs={
        <>
          <Field label="Race distance"><NumberInput value={distance} min={1} onChange={setDistance} suffix="m / yd" /></Field>
          <Field label="Goal time"><TextInput value={time} onChange={setTime} placeholder="2:00.0" mono /></Field>
          <Field label="Split distance"><NumberInput value={splitDistance} min={1} onChange={setSplitDistance} suffix="m / yd" /></Field>
          <Field label="Pacing pattern">
            <select value={strategy} onChange={(event) => setStrategy(event.target.value as SplitStrategy)} className={inputClass}>
              <option value="even">Even</option>
              <option value="negative">Negative split</option>
              <option value="positive">Positive split</option>
              <option value="fast-finish">Controlled middle, fast finish</option>
            </select>
          </Field>
          <Formula>each split uses a normalized pacing weight; all split seconds sum to the entered goal time</Formula>
        </>
      }
      output={
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Goal total" value={formatSwimTime(seconds)} />
            <Metric label="Calculated total" value={formatSwimTime(total)} />
            <Metric label="Split count" value={splits.length || "—"} />
          </div>
          <ResultTable headers={["#", "Distance", "Split", "Cumulative"]} rows={splits.map((item) => [item.index, item.distance, item.split, item.cumulative])} />
          <Notice>These are planning targets, not a claim that one pacing pattern is best for every swimmer or event.</Notice>
        </>
      }
    />
  );
}

function SendoffCalculator() {
  const [pace, setPace] = useState("1:20.0");
  const [distance, setDistance] = useState(100);
  const [rest, setRest] = useState(15);
  const [rounding, setRounding] = useState(5);
  const [laneCount, setLaneCount] = useState(4);
  const [laneStep, setLaneStep] = useState(5);
  const result = calculateSendoff(parseSwimTime(pace), distance, rest, rounding);
  const lanes = Array.from({ length: Math.max(1, laneCount) }, (_, index) => {
    const lanePace = parseSwimTime(pace) + index * laneStep;
    const laneResult = calculateSendoff(lanePace, distance, rest, rounding);
    return [`Lane ${index + 1}`, formatSwimTime(lanePace), formatSwimTime(laneResult.sendoffSeconds, 0), `${laneResult.expectedRestSeconds.toFixed(1)}s`];
  });

  return (
    <CalculatorLayout
      title="Send-off and lane cycle planner"
      description="Build clock-friendly send-offs from a target pace and desired rest, then create lane variants."
      inputs={
        <>
          <Field label="Base pace per 100"><TextInput value={pace} onChange={setPace} placeholder="1:20.0" mono /></Field>
          <Field label="Repeat distance"><NumberInput value={distance} min={1} onChange={setDistance} suffix="m / yd" /></Field>
          <Field label="Desired rest"><NumberInput value={rest} min={0} onChange={setRest} suffix="seconds" /></Field>
          <Field label="Round up to"><NumberInput value={rounding} min={1} onChange={setRounding} suffix="seconds" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Number of lanes"><NumberInput value={laneCount} min={1} max={12} onChange={setLaneCount} /></Field>
            <Field label="Pace step / lane"><NumberInput value={laneStep} min={0} onChange={setLaneStep} suffix="sec/100" /></Field>
          </div>
          <Formula>send-off = round up(swim time + desired rest) to the selected clock increment</Formula>
        </>
      }
      output={
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Expected swim" value={formatSwimTime(result.swimSeconds)} />
            <Metric label="Exact cycle" value={formatSwimTime(result.exactSeconds)} />
            <Metric label="Recommended send-off" value={formatSwimTime(result.sendoffSeconds, 0)} accent />
            <Metric label="Actual rest" value={`${result.expectedRestSeconds.toFixed(1)}s`} />
          </div>
          <ResultTable headers={["Lane", "Pace / 100", "Send-off", "Expected rest"]} rows={lanes} />
        </>
      }
    />
  );
}

function CriticalSpeedCalculator() {
  const [shortDistance, setShortDistance] = useState(200);
  const [shortTime, setShortTime] = useState("2:10.0");
  const [longDistance, setLongDistance] = useState(400);
  const [longTime, setLongTime] = useState("4:35.0");
  const css = calculateCriticalSwimSpeed(shortDistance, parseSwimTime(shortTime), longDistance, parseSwimTime(longTime));
  const references = css ? [0.9, 0.95, 1, 1.05].map((ratio) => [
    `${Math.round(ratio * 100)}% CSS velocity`,
    formatSwimTime(css.pacePer100Seconds / ratio),
    (css.speed * ratio).toFixed(3),
  ]) : [];

  return (
    <CalculatorLayout
      title="Critical swim speed reference"
      description="Estimate the slope of the distance-time relationship from two maximal swims, commonly 200 and 400."
      inputs={
        <>
          <div className="grid grid-cols-2 gap-3"><Field label="Short distance"><NumberInput value={shortDistance} min={1} onChange={setShortDistance} /></Field><Field label="Short time"><TextInput value={shortTime} onChange={setShortTime} mono /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Long distance"><NumberInput value={longDistance} min={2} onChange={setLongDistance} /></Field><Field label="Long time"><TextInput value={longTime} onChange={setLongTime} mono /></Field></div>
          <Formula>critical speed = (long distance − short distance) ÷ (long time − short time)</Formula>
        </>
      }
      output={
        css ? <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Critical speed" value={`${css.speed.toFixed(3)} m/s`} accent />
            <Metric label="Reference pace / 100" value={formatSwimTime(css.pacePer100Seconds)} />
            <Metric label="Reference pace / 50" value={formatSwimTime(css.pacePer100Seconds / 2)} />
          </div>
          <ResultTable headers={["Reference", "Pace / 100", "Velocity"]} rows={references} />
          <Notice>Use this as a repeatable training reference. Testing conditions, stroke, pool course and fatigue must remain consistent.</Notice>
        </> : <EmptyResult text="Enter a valid faster short swim and slower long swim." />
      }
    />
  );
}

function EfficiencyCalculator() {
  const [distance, setDistance] = useState(50);
  const [time, setTime] = useState("30.0");
  const [cycles, setCycles] = useState(20);
  const result = calculateStrokeMetrics(distance, parseSwimTime(time), cycles);

  return (
    <CalculatorLayout
      title="Stroke efficiency metrics"
      description="Calculate velocity, stroke rate, distance per cycle and stroke index for one measured segment."
      inputs={
        <>
          <Field label="Measured distance"><NumberInput value={distance} min={1} onChange={setDistance} suffix="metres" /></Field>
          <Field label="Segment time"><TextInput value={time} onChange={setTime} placeholder="30.0" mono /></Field>
          <Field label="Complete stroke cycles"><NumberInput value={cycles} min={1} onChange={setCycles} suffix="cycles" /></Field>
          <Formula>stroke rate = cycles ÷ time × 60; distance/cycle = distance ÷ cycles; stroke index = velocity × distance/cycle</Formula>
        </>
      }
      output={
        result ? <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Velocity" value={`${result.velocity.toFixed(3)} m/s`} />
            <Metric label="Stroke rate" value={`${result.strokeRate.toFixed(1)} cycles/min`} />
            <Metric label="Distance / cycle" value={`${result.distancePerCycle.toFixed(2)} m`} accent />
            <Metric label="Stroke index" value={result.strokeIndex.toFixed(3)} />
          </div>
          <Notice>Count complete arm cycles consistently. These metrics are most useful for comparing the same swimmer under similar conditions.</Notice>
        </> : <EmptyResult text="Enter positive distance, time and cycle values." />
      }
    />
  );
}

function SetMathCalculator() {
  const [reps, setReps] = useState(8);
  const [distance, setDistance] = useState(100);
  const [rounds, setRounds] = useState(2);
  const [timingMode, setTimingMode] = useState<"sendoff" | "rest">("sendoff");
  const [sendoff, setSendoff] = useState("1:30");
  const [pace, setPace] = useState("1:15");
  const [rest, setRest] = useState(15);
  const sendoffSeconds = parseSwimTime(sendoff);
  const result = calculateSetMath({ reps, distance, rounds, timingMode, sendoffSeconds, pacePer100Seconds: parseSwimTime(pace), restSeconds: rest });
  const impossibleSendoff = timingMode === "sendoff" && sendoffSeconds > 0 && sendoffSeconds < result.swimSecondsPerRep;

  return (
    <CalculatorLayout
      title="Set distance and duration"
      description="Check the full math for repeats, rounds, swim time, rest time and work-to-rest ratio."
      inputs={
        <>
          <div className="grid grid-cols-3 gap-3"><Field label="Reps"><NumberInput value={reps} min={1} onChange={setReps} /></Field><Field label="Distance"><NumberInput value={distance} min={0} onChange={setDistance} /></Field><Field label="Rounds"><NumberInput value={rounds} min={1} onChange={setRounds} /></Field></div>
          <Field label="Timing mode"><select value={timingMode} onChange={(event) => setTimingMode(event.target.value as "sendoff" | "rest")} className={inputClass}><option value="sendoff">Fixed send-off</option><option value="rest">Fixed rest after each rep</option></select></Field>
          <Field label="Expected pace per 100"><TextInput value={pace} onChange={setPace} mono /></Field>
          {timingMode === "sendoff" ? <Field label="Send-off"><TextInput value={sendoff} onChange={setSendoff} mono /></Field> : <Field label="Rest after each rep"><NumberInput value={rest} min={0} onChange={setRest} suffix="seconds" /></Field>}
          <Formula>{timingMode === "sendoff" ? "duration = total repetitions × send-off" : "duration = total repetitions × (expected swim time + rest)"}</Formula>
        </>
      }
      output={
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total distance" value={result.totalDistance.toLocaleString()} accent />
            <Metric label="Total duration" value={formatSwimTime(result.totalSeconds, 0)} />
            <Metric label="Total swim time" value={formatSwimTime(result.totalSwimSeconds, 0)} />
            <Metric label="Total rest" value={formatSwimTime(result.totalRestSeconds, 0)} />
          </div>
          <ResultTable headers={["Metric", "Value"]} rows={[
            ["Total repetitions", result.totalReps],
            ["Expected swim / rep", formatSwimTime(result.swimSecondsPerRep)],
            ["Cycle / rep", formatSwimTime(result.cycleSeconds)],
            ["Work : rest", result.workRestRatio ? `${result.workRestRatio.toFixed(2)} : 1` : "No modeled rest"],
          ]} />
          {impossibleSendoff && <Notice tone="warning">The entered send-off is faster than the modeled completion time. SetCraft used the completion time for duration, but the coach must choose a feasible cycle or faster target pace.</Notice>}
        </>
      }
    />
  );
}

function ConversionCalculator() {
  const [from, setFrom] = useState<Course>("LCM");
  const [event, setEvent] = useState("200 Free");
  const [sex, setSex] = useState<SexCategory>("Men");
  const [time, setTime] = useState("2:00.0");
  const seconds = parseSwimTime(time);
  const results = (["LCM", "SCM", "SCY"] as Course[]).map((to) => convertCourseTime(seconds, event, sex, from, to));
  const metresToYards = convertDistance(Number(event.match(/^\d+/)?.[0] || 0), "m-to-yd");

  const switchFrom = (next: Course) => {
    const options = eventsForCourse(next);
    setFrom(next); setEvent(options.includes(event) ? event : "200 Free");
  };

  return (
    <CalculatorLayout
      title="LCM · SCM · SCY performance conversion"
      description="Compare a competitive result across all three courses using current record ratios and the published NCAA SCM-to-SCY factors."
      inputs={
        <>
          <Field label="Source course"><select value={from} onChange={(e) => switchFrom(e.target.value as Course)} className={inputClass}><option>LCM</option><option>SCM</option><option>SCY</option></select></Field>
          <Field label="Event"><select value={event} onChange={(e) => setEvent(e.target.value)} className={inputClass}>{eventsForCourse(from).map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Category"><select value={sex} onChange={(e) => setSex(e.target.value as SexCategory)} className={inputClass}><option>Men</option><option>Women</option></select></Field>
          <Field label="Source time"><TextInput value={time} onChange={setTime} mono /></Field>
          <Formula>LCM↔SCM uses current same-sex record ratios; SCM↔SCY uses NCAA factors (0.906, with published distance-event exceptions)</Formula>
        </>
      }
      output={
        <>
          <div className="grid gap-3 sm:grid-cols-3">{results.map((result) => <Metric key={result.to} label={`${result.event} ${result.to}`} value={formatTime(result.time)} accent={result.to === from} />)}</div>
          <ResultTable headers={["Target", "Estimate", "Factor", "Method", "Use"]} rows={results.map((result) => [`${result.event} ${result.to}`, formatTime(result.time), result.factor.toFixed(4), result.method.replaceAll("-", " "), result.to === from ? "Source result" : "Planning estimate only"])} />
          <div className="grid gap-3 sm:grid-cols-2"><Metric label="Exact physical conversion" value={`${Number(event.match(/^\d+/)?.[0] || 0)} m = ${metresToYards.toFixed(2)} yd`} /><Metric label="Raw same-speed illustration" value={formatSwimTime(sameVelocityConvertedTime(seconds, from === "SCY" ? "yd-to-m" : "m-to-yd"))} /></div>
          <Notice tone="warning">These are transparent planning comparisons, not guaranteed legal meet-entry conversions. Use the target meet’s published rules and accepted proof-of-time procedure.</Notice>
        </>
      }
    />
  );
}

function CalculatorLayout({ title, description, inputs, output }: { title: string; description: string; inputs: React.ReactNode; output: React.ReactNode }) {
  return (
    <div className="grid gap-7 xl:grid-cols-[420px_minmax(0,1fr)]">
      <section className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 md:p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">Inputs</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 space-y-4">{inputs}</div>
      </section>
      <section className="min-h-[470px] rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-slate-500"><Ruler className="h-4 w-4 text-indigo-600" /><span className="text-xs font-extrabold uppercase tracking-[0.15em]">Calculated output</span></div>
        <div className="space-y-6">{output}</div>
      </section>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}

function TextInput({ value, onChange, placeholder, mono = false }: { value: string; onChange: (value: string) => void; placeholder?: string; mono?: boolean }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${inputClass} ${mono ? "font-mono" : ""}`} />;
}

function NumberInput({ value, onChange, min, max, suffix }: { value: number; onChange: (value: number) => void; min?: number; max?: number; suffix?: string }) {
  return <div className="relative"><input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value) || 0)} className={`${inputClass} ${suffix ? "pr-12" : ""}`} />{suffix && <span className="pointer-events-none absolute right-3 top-3.5 text-xs font-bold text-slate-400">{suffix}</span>}</div>;
}

function Formula({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 font-mono text-xs leading-5 text-indigo-800"><strong>Formula:</strong> {children}</div>;
}

function Metric({ label, value, accent = false }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${accent ? "border-cyan-200 bg-gradient-to-br from-cyan-50 to-indigo-50" : "border-slate-200 bg-slate-50"}`}><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500">{label}</p><p className={`mt-2 font-display text-xl font-extrabold ${accent ? "text-indigo-700" : "text-slate-950"}`}>{value}</p></div>;
}

function ResultTable({ headers, rows }: { headers: string[]; rows: Array<Array<React.ReactNode>> }) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-950 text-white"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.13em]">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, rowIndex) => <tr key={rowIndex} className="transition hover:bg-indigo-50/50">{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? "font-extrabold text-slate-900" : "font-mono text-slate-600"}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warning" }) {
  return <div className={`rounded-2xl border px-4 py-3 text-xs font-medium leading-5 ${tone === "warning" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{children}</div>;
}

function EmptyResult({ text }: { text: string }) {
  return <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center"><Activity className="h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">{text}</p></div>;
}

function ReferenceCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="font-display text-base font-extrabold text-slate-950">{title}</p><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>;
}
