/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Calculator, ArrowRightLeft, Timer, ListPlus, Activity, Landmark } from "lucide-react";
import { PaceInput, PaceResult, SplitInput, SplitResult, IntervalInput, IntervalResult } from "../types";

export default function Calculators() {
  const [activeTab, setActiveTab] = useState<"pace" | "split" | "sendoff" | "conversion">("pace");

  // Pace Calculator state
  const [paceDist, setPaceDist] = useState<number>(500);
  const [paceTime, setPaceTime] = useState<string>("07:30");
  const [paceResult, setPaceResult] = useState<PaceResult | null>({
    pacePer100: "1:30.0",
    metersPerSec: 1.11,
    description: "Solid aerobic base endurance speed. Perfect for middle-distance pacing."
  });

  // Split Calculator state
  const [splitDist, setSplitDist] = useState<number>(200);
  const [splitTime, setSplitTime] = useState<string>("02:20");
  const [splitStrategy, setSplitStrategy] = useState<"even" | "negative" | "descending">("negative");
  const [splitResults, setSplitResults] = useState<SplitResult[]>([
    { lapNumber: 1, lapDistance: 50, cumulativeTime: "00:36.0", splitTime: "00:36.0" },
    { lapNumber: 2, lapDistance: 100, cumulativeTime: "01:11.5", splitTime: "00:35.5" },
    { lapNumber: 3, lapDistance: 150, cumulativeTime: "01:46.5", splitTime: "00:35.0" },
    { lapNumber: 4, lapDistance: 200, cumulativeTime: "02:20.0", splitTime: "00:33.5" }
  ]);

  // Send-off Cycle state
  const [cyclePace, setCyclePace] = useState<string>("1:40"); // Pace per 100
  const [cycleRest, setCycleRest] = useState<number>(15); // Target rest in secs
  const [cycleDist, setCycleDist] = useState<number>(100); // Repeat distance
  const [cycleResult, setCycleResult] = useState<IntervalResult | null>({
    recommendedSendoff: "1:55",
    exactInterval: "1:55",
    expectedRest: "15 seconds"
  });

  // Unit Converter state
  const [convVal, setConvVal] = useState<number>(100);
  const [convDir, setConvDir] = useState<"m2y" | "y2m">("m2y");

  // Helper: Time parser (MM:SS.hh to total seconds)
  const parseTimeToSeconds = (str: string): number => {
    const parts = str.split(":");
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    }
    return parseFloat(str) || 0;
  };

  // Helper: Seconds to MM:SS.h
  const formatSecondsToTime = (totalSecs: number): string => {
    if (totalSecs < 0) return "0:00";
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const ms = Math.round((totalSecs % 1) * 10);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}.${ms}`;
  };

  // 1. Calculate Pace
  const calculatePace = () => {
    const secs = parseTimeToSeconds(paceTime);
    if (secs <= 0 || paceDist <= 0) return;

    const pacePer100Secs = (secs / paceDist) * 100;
    const paceStr = formatSecondsToTime(pacePer100Secs);
    const mps = Math.round((paceDist / secs) * 100) / 100;

    let desc = "Pace determined.";
    if (pacePer100Secs < 60) desc = "Elite sprint capability. Requires supreme lactate tolerance.";
    else if (pacePer100Secs < 80) desc = "Highly competitive swimmer pace. Solid VO2 Max workload.";
    else if (pacePer100Secs < 100) desc = "Advanced master pace. Excellent threshold endurance territory.";
    else desc = "Healthy active recovery or beginner development speed.";

    setPaceResult({
      pacePer100: paceStr,
      metersPerSec: mps,
      description: desc
    });
  };

  // 2. Calculate Splits
  const calculateSplits = () => {
    const totalSecs = parseTimeToSeconds(splitTime);
    if (totalSecs <= 0 || splitDist <= 0) return;

    const numLaps = splitDist / 50;
    if (numLaps <= 0) return;

    const baseLapSplit = totalSecs / numLaps;
    const results: SplitResult[] = [];
    let cumulative = 0;

    if (splitStrategy === "even") {
      for (let i = 1; i <= numLaps; i++) {
        cumulative += baseLapSplit;
        results.push({
          lapNumber: i,
          lapDistance: i * 50,
          cumulativeTime: formatSecondsToTime(cumulative),
          splitTime: formatSecondsToTime(baseLapSplit)
        });
      }
    } else if (splitStrategy === "negative") {
      // Descending split times
      let currentSplit = baseLapSplit + (numLaps - 1) * 0.5; // Start slower
      for (let i = 1; i <= numLaps; i++) {
        cumulative += currentSplit;
        results.push({
          lapNumber: i,
          lapDistance: i * 50,
          cumulativeTime: formatSecondsToTime(cumulative),
          splitTime: formatSecondsToTime(currentSplit)
        });
        currentSplit -= 1.0; // split gets faster each lap
      }
    } else {
      // Descending: starts fast, holds, then finishes with strong effort
      let currentSplit = baseLapSplit - 1.5; // fast start
      for (let i = 1; i <= numLaps; i++) {
        if (i > 1) {
          currentSplit = baseLapSplit + 0.5; // settle in
        }
        if (i === numLaps) {
          currentSplit = baseLapSplit - 1.0; // sprint finish
        }
        cumulative += currentSplit;
        results.push({
          lapNumber: i,
          lapDistance: i * 50,
          cumulativeTime: formatSecondsToTime(cumulative),
          splitTime: formatSecondsToTime(currentSplit)
        });
      }
    }

    setSplitResults(results);
  };

  // 3. Calculate Send-off
  const calculateSendoff = () => {
    const paceSec = parseTimeToSeconds(cyclePace);
    if (paceSec <= 0 || cycleDist <= 0) return;

    const swimTimeForDist = (paceSec / 100) * cycleDist;
    const totalCycleSec = swimTimeForDist + cycleRest;

    // Standard interval rounding (e.g. to nearest 5 seconds)
    const roundedIntervalSec = Math.ceil(totalCycleSec / 5) * 5;
    const actRest = roundedIntervalSec - swimTimeForDist;

    setCycleResult({
      recommendedSendoff: formatSecondsToTime(roundedIntervalSec).split(".")[0], // drop milliseconds for cycle intervals
      exactInterval: formatSecondsToTime(totalCycleSec).split(".")[0],
      expectedRest: `${Math.round(actRest)} seconds`
    });
  };

  // 4. Conversions
  const handleConvert = (val: number, direction: "m2y" | "y2m") => {
    setConvVal(val);
    setConvDir(direction);
  };

  // Convert factor: 1 meter = 1.09361 yards (Often estimated as 1.1 in swim scheduling, or precisely 1.0936)
  const convertedValue = convDir === "m2y" ? Math.round(convVal * 1.09361 * 10) / 10 : Math.round(convVal / 1.09361 * 10) / 10;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm" id="calculators-hub">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            Athlete Pacing & Cycle Calculators
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Visual pacing algorithms tailored for swimmers, training cycles, and pool conversions.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 self-start md:self-auto text-xs">
          <button
            onClick={() => setActiveTab("pace")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "pace" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Pace
          </button>
          <button
            onClick={() => setActiveTab("split")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "split" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Splits Planner
          </button>
          <button
            onClick={() => setActiveTab("sendoff")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "sendoff" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Send-off Cycles
          </button>
          <button
            onClick={() => setActiveTab("conversion")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "conversion" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Pool Convert
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUT PANEL (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
            Calculator Inputs
          </h3>

          {activeTab === "pace" && (
            <div className="space-y-4" id="pace-inputs">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Workout Distance (meters/yards)</label>
                <input
                  type="number"
                  value={paceDist}
                  onChange={(e) => setPaceDist(Math.max(1, parseInt(e.target.value) || 0))}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Target Total Duration (MM:SS)</label>
                <input
                  type="text"
                  value={paceTime}
                  onChange={(e) => setPaceTime(e.target.value)}
                  placeholder="e.g. 07:30"
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <button
                onClick={calculatePace}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                Determine Pace
              </button>
            </div>
          )}

          {activeTab === "split" && (
            <div className="space-y-4" id="split-inputs">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Target Event Distance (meters/yards)</label>
                <select
                  value={splitDist}
                  onChange={(e) => setSplitDist(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                >
                  <option value="100">100 (2 laps)</option>
                  <option value="200">200 (4 laps)</option>
                  <option value="400">400 (8 laps)</option>
                  <option value="800">800 (16 laps)</option>
                  <option value="1500">1500 (30 laps)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Target Event Time (MM:SS)</label>
                <input
                  type="text"
                  value={splitTime}
                  onChange={(e) => setSplitTime(e.target.value)}
                  placeholder="e.g. 02:20"
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Racing Strategy</label>
                <select
                  value={splitStrategy}
                  onChange={(e) => setSplitStrategy(e.target.value as any)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                >
                  <option value="even">Even Pacing (Smooth)</option>
                  <option value="negative">Negative Split (Back-half fast)</option>
                  <option value="descending">Descending Build (Fast start / sprint finish)</option>
                </select>
              </div>

              <button
                onClick={calculateSplits}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                Project Race Splits
              </button>
            </div>
          )}

          {activeTab === "sendoff" && (
            <div className="space-y-4" id="sendoff-inputs">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Pace per 100 (MM:SS)</label>
                <input
                  type="text"
                  value={cyclePace}
                  onChange={(e) => setCyclePace(e.target.value)}
                  placeholder="e.g. 1:40"
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Repeat Distance (meters/yards)</label>
                <select
                  value={cycleDist}
                  onChange={(e) => setCycleDist(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs focus:outline-none"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Required Rest Time (seconds)</label>
                <input
                  type="number"
                  value={cycleRest}
                  onChange={(e) => setCycleRest(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <button
                onClick={calculateSendoff}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                Find Recommended Send-off
              </button>
            </div>
          )}

          {activeTab === "conversion" && (
            <div className="space-y-4" id="conversion-inputs">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Conversion Direction</label>
                <select
                  value={convDir}
                  onChange={(e) => setConvDir(e.target.value as any)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                >
                  <option value="m2y">Meters to Yards (LCM/SCM ──&gt; SCY)</option>
                  <option value="y2m">Yards to Meters (SCY ──&gt; SCM/LCM)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Distance (meters or yards)</label>
                <input
                  type="number"
                  value={convVal}
                  onChange={(e) => setConvVal(Math.max(1, parseInt(e.target.value) || 0))}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl p-3 w-full text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* RESULTS PANEL (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-50/50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-4 font-bold">
              Calculated Metrics Output
            </h3>

            {activeTab === "pace" && paceResult && (
              <div className="space-y-6" id="pace-output">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[9px] text-indigo-600 font-mono block font-bold">PACE PER 100M/YD</span>
                    <span className="text-2xl font-display font-extrabold text-slate-900 mt-1 block">
                      {paceResult.pacePer100}
                    </span>
                  </div>

                  <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[9px] text-indigo-600 font-mono block font-bold">VELOCITY</span>
                    <span className="text-2xl font-display font-extrabold text-slate-900 mt-1 block">
                      {paceResult.metersPerSec} <span className="text-xs text-slate-500 font-medium">m/s</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-start gap-2.5 shadow-2xs">
                  <Timer className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    <strong>Pacing Insight:</strong> {paceResult.description}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "split" && (
              <div className="space-y-4" id="split-output">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-mono text-[9px] border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3 text-center">LAP</th>
                        <th className="p-3">DISTANCE</th>
                        <th className="p-3">SPLIT TIME</th>
                        <th className="p-3">CUMULATIVE TIME</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {splitResults.map((lap) => (
                        <tr key={lap.lapNumber} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-mono font-bold text-indigo-600">{lap.lapNumber}</td>
                          <td className="p-3 font-mono">{lap.lapDistance}m</td>
                          <td className="p-3 font-mono font-semibold text-slate-800">{lap.splitTime}</td>
                          <td className="p-3 font-mono text-slate-450">{lap.cumulativeTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-slate-500 text-[11px] leading-relaxed italic bg-white p-4 rounded-xl border border-slate-200 shadow-2xs font-medium">
                  *Pacing projection takes into account speed drop-off, dive starts (Lap 1 faster), and lactic threshold exhaustion curves typical of a swimming build strategy.
                </div>
              </div>
            )}

            {activeTab === "sendoff" && cycleResult && (
              <div className="space-y-6" id="sendoff-output">
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                  <div>
                    <span className="text-[9px] text-indigo-600 font-mono block font-bold">RECOMMENDED INTERVAL CYCLE</span>
                    <span className="text-3xl font-display font-extrabold text-indigo-600 mt-1 block">
                      :{cycleResult.recommendedSendoff} <span className="text-xs text-slate-500 font-medium">send-off</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-mono font-bold">EXACT TIME NEEDED</span>
                      <span className="font-mono text-slate-800 font-bold">{cycleResult.exactInterval}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-mono font-bold">EXPECTED REST TIME</span>
                      <span className="font-mono text-emerald-600 font-bold">{cycleResult.expectedRest}</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                  Recommended cycles are automatically adjusted upwards to standard swim intervals (rounded to the nearest 5-second block) to ensure easy team clock reading.
                </p>
              </div>
            )}

            {activeTab === "conversion" && (
              <div className="space-y-6" id="conversion-output">
                <div className="bg-white p-5 rounded-xl border border-slate-200 text-center space-y-2 shadow-2xs">
                  <span className="text-[9px] text-slate-400 font-mono block font-bold">CONVERTED METRIC</span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl font-display font-bold text-slate-400">{convVal} {convDir === "m2y" ? "LCM" : "SCY"}</span>
                    <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                    <span className="text-3xl font-display font-extrabold text-indigo-600">{convertedValue} {convDir === "m2y" ? "SCY" : "LCM"}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed shadow-2xs font-medium">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                    <Landmark className="w-4 h-4" />
                    Pool Scale Rationale:
                  </div>
                  <p>
                    <strong>Long Course Meters (LCM):</strong> standard 50-meter Olympic pools.
                  </p>
                  <p>
                    <strong>Short Course Yards (SCY):</strong> standard 25-yard collegiate pools. Meters are scaled at approximately 10% more resistance per lap due to the lack of extra wall push-offs.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/60 pt-4 mt-6 flex justify-between items-center text-[9px] text-slate-400 font-mono font-bold">
            <span>SWIMBLOCK MATH ENGINE V1.2</span>
            <span>ATHLETE SPECIFIC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
