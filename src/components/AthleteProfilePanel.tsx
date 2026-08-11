import React from "react";
import { Activity, FlaskConical, Info, SlidersHorizontal } from "lucide-react";
import {
  ATHLETE_FACTOR_DEFINITIONS,
  AthleteFactorKey,
  AthleteProfileState,
  measuredValueToRating,
  profileEvidenceScore,
} from "../athleteProfile";

const INPUT = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export default function AthleteProfilePanel({ value, onChange }: { value: AthleteProfileState; onChange: (value: AthleteProfileState) => void }) {
  const evidence = profileEvidenceScore(value);
  const updateFactor = (key: AthleteFactorKey, patch: Partial<AthleteProfileState["factors"][AthleteFactorKey]>) => {
    onChange({ ...value, factors: { ...value.factors, [key]: { ...value.factors[key], ...patch } } });
  };

  return <div className="space-y-5">
    <div className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-violet-700"><SlidersHorizontal className="h-4 w-4" /><span className="text-[11px] font-black uppercase tracking-[.16em]">Optional athlete context</span></div>
        <p className="mt-2 text-sm font-bold text-slate-900">Use only factors you trust. Every factor can be off, self-rated, or measured.</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">These inputs rank strategy fit and shape the explanation. They never alter official race times, records or AQUA points.</p>
      </div>
      <button type="button" onClick={() => onChange({ ...value, enabled: !value.enabled })} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-black ${value.enabled ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"}`}>
        {value.enabled ? "Profile on" : "Profile off"}
      </button>
    </div>

    {!value.enabled ? <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center"><Activity className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">Race-only mode is active. No physiology or body-performance factor affects strategy fit.</p></div> : <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-950 px-5 py-4 text-white">
        <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-cyan-300">Profile evidence</p><p className="mt-1 text-sm font-bold">{evidence.label} · {evidence.active} active</p></div>
        <div className="text-right"><p className="font-mono text-2xl font-black">{evidence.score ?? "—"}%</p><p className="text-[10px] text-slate-400">{evidence.measured} measured · {evidence.rated} rated</p></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {ATHLETE_FACTOR_DEFINITIONS.map((definition) => {
          const input = value.factors[definition.key];
          const derived = input.mode === "measured" ? measuredValueToRating(definition, input.measuredValue) : input.rating;
          return <section key={definition.key} className={`rounded-2xl border p-4 transition ${input.enabled ? "border-violet-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50 opacity-75"}`}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-black text-slate-950">{definition.label}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{definition.measuredLabel}</p></div>
              <button type="button" onClick={() => updateFactor(definition.key, { enabled: !input.enabled })} className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${input.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{input.enabled ? "On" : "Off"}</button>
            </div>
            {input.enabled && <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <button type="button" onClick={() => updateFactor(definition.key, { mode: "rating" })} className={`rounded-lg px-3 py-2 text-[11px] font-black ${input.mode === "rating" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>1-10 rating</button>
                <button type="button" onClick={() => updateFactor(definition.key, { mode: "measured" })} className={`rounded-lg px-3 py-2 text-[11px] font-black ${input.mode === "measured" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>Measured value</button>
              </div>
              {input.mode === "rating" ? <label className="block"><span className="flex justify-between text-[11px] font-bold text-slate-600"><span>Coach / athlete context</span><span className="font-mono text-violet-700">{input.rating}/10</span></span><input type="range" min={1} max={10} step={1} value={input.rating} onChange={(event) => updateFactor(definition.key, { rating: Number(event.target.value) })} className="mt-2 w-full accent-violet-600" /></label> : <div>
                <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">{definition.measuredLabel}</span><div className="relative"><input type="number" min={definition.min} max={definition.max} step={definition.step} value={input.measuredValue ?? ""} onChange={(event) => updateFactor(definition.key, { measuredValue: event.target.value === "" ? null : Number(event.target.value) })} className={`${INPUT} pr-16`} /><span className="pointer-events-none absolute right-3 top-3.5 text-xs font-bold text-slate-400">{definition.unit}</span></div></label>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-violet-50 px-3 py-2 text-[11px]"><span className="font-bold text-violet-900">SetCraft context</span><span className="font-mono font-black text-violet-700">{derived == null ? "Enter value" : definition.neutralMeasured ? "Recorded - neutral" : `${derived}/10`}</span></div>
              </div>}
              <details className="rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-wide text-slate-600">Protocol + limits</summary><p className="mt-2 text-[11px] leading-5 text-slate-600">{definition.protocol}</p><p className="mt-2 flex gap-2 text-[11px] leading-5 text-amber-800"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{definition.caution}</p></details>
            </div>}
          </section>;
        })}
      </div>
      <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-6 text-blue-900"><FlaskConical className="mt-1 h-4 w-4 shrink-0 text-blue-700" /><p>Measured values improve evidence quality only when the protocol is repeatable. SetCraft uses conservative context indices, not clinical cut-offs. Peak lactate is stored as an event-dependent response and is never treated as a direct fitness score.</p></div>
    </>}
  </div>;
}
