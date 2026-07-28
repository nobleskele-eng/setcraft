/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Calendar, Compass, Milestone, Flag, TrendingUp, Info, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { CalendarDay, WorkoutSession } from "../types";

// Predefined demo workouts representing different days of the week
const DEMO_WORKOUTS: Record<string, WorkoutSession> = {
  Mon: {
    id: "w-mon",
    name: "Aerobic Capacity Foundations",
    focus: "Aerobic Capacity",
    phase: "Base Build",
    blocks: [],
    totalDistance: 3200,
    estimatedDuration: 65,
    avgIntensity: 5.5
  },
  Wed: {
    id: "w-wed",
    name: "V02 Max Lactate Threshold",
    focus: "Threshold Endurance",
    phase: "Base Build",
    blocks: [],
    totalDistance: 2800,
    estimatedDuration: 55,
    avgIntensity: 7.8
  },
  Fri: {
    id: "w-fri",
    name: "Sprint Start & Speed prime",
    focus: "Sprints & Speed",
    phase: "Race Prep",
    blocks: [],
    totalDistance: 1800,
    estimatedDuration: 40,
    avgIntensity: 8.5
  }
};

export default function CalendarView() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [seasonPhase, setSeasonPhase] = useState("Base Build");
  const [goalMeetName, setGoalMeetName] = useState("Pacific Masters Swim Championships");
  const [daysUntilMeet, setDaysUntilMeet] = useState(48);

  // Calendar days array representing Monday through Sunday
  const [weeklySchedule, setWeeklySchedule] = useState<CalendarDay[]>([
    { dateString: "2026-07-06", dayName: "Mon", dayNumber: 6, phase: "Base Build", workout: DEMO_WORKOUTS.Mon },
    { dateString: "2026-07-07", dayName: "Tue", dayNumber: 7, phase: "Base Build" },
    { dateString: "2026-07-08", dayName: "Wed", dayNumber: 8, phase: "Base Build", workout: DEMO_WORKOUTS.Wed },
    { dateString: "2026-07-09", dayName: "Thu", dayNumber: 9, phase: "Recovery" },
    { dateString: "2026-07-10", dayName: "Fri", dayNumber: 10, phase: "Race Prep", workout: DEMO_WORKOUTS.Fri },
    { dateString: "2026-07-11", dayName: "Sat", dayNumber: 11, phase: "Strength Focus" },
    { dateString: "2026-07-12", dayName: "Sun", dayNumber: 12, phase: "Off/Rest" }
  ]);

  // Calculate stats
  const totalWeeklyVolume = weeklySchedule.reduce((acc, day) => acc + (day.workout?.totalDistance || 0), 0);
  const totalWeeklyTime = weeklySchedule.reduce((acc, day) => acc + (day.workout?.estimatedDuration || 0), 0);

  // Reschedule workout (simulate drag/drop or instant shifting for simple desktop UX)
  const shiftWorkout = (fromIndex: number, toIndex: number) => {
    const updated = [...weeklySchedule];
    const temp = updated[fromIndex].workout;
    updated[fromIndex].workout = updated[toIndex].workout;
    updated[toIndex].workout = temp;
    setWeeklySchedule(updated);
  };

  const handleRandomize = () => {
    // Shuffle workouts among weekdays
    const updated = [...weeklySchedule];
    const workouts = updated.map(d => d.workout);
    // basic rotation
    const last = workouts.pop();
    workouts.unshift(last);
    
    updated.forEach((day, idx) => {
      day.workout = workouts[idx];
    });
    setWeeklySchedule(updated);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm" id="calendar-workspace">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Season Calendar & Week Planner
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Drag, sequence, and label your weekly volume blocks and track upcoming competitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomize}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            title="Rotate workouts to show drag rescheduling"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
            Reorder Schedule
          </button>
          
          <div className="flex items-center bg-slate-100 border border-slate-200/60 rounded-xl p-1">
            <button
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="p-1.5 text-slate-500 hover:text-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium px-3 text-slate-700">
              Week of July 6, 2026
            </span>
            <button
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="p-1.5 text-slate-500 hover:text-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* METRIC RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 font-mono block font-medium">TOTAL WEEKLY VOLUME</span>
            <span className="text-lg font-display font-bold text-slate-800">
              {totalWeeklyVolume.toLocaleString()} yards
            </span>
          </div>
        </div>

        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 flex items-center gap-3">
          <Compass className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 font-mono block font-medium">EST. POOL TIME</span>
            <span className="text-lg font-display font-bold text-slate-800">
              {Math.floor(totalWeeklyTime / 60)}h {totalWeeklyTime % 60}m
            </span>
          </div>
        </div>

        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 flex items-center gap-3">
          <Milestone className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1">
            <span className="text-[10px] text-slate-500 font-mono block font-medium">CURRENT MICROCYCLE</span>
            <select
              value={seasonPhase}
              onChange={(e) => setSeasonPhase(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded px-2 py-1 mt-0.5 shadow-2xs focus:outline-none"
            >
              <option>Base Build</option>
              <option>Strength Focus</option>
              <option>Race Prep</option>
              <option>Taper</option>
              <option>Active Recovery</option>
            </select>
          </div>
        </div>
      </div>

      {/* GOAL MEET COUNTDOWN CARD */}
      <div className="bg-rose-50/30 p-5 rounded-xl border border-rose-200/40 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-2.5">
          <Flag className="w-5 h-5 text-rose-600 shrink-0 mt-1" />
          <div>
            <span className="text-[10px] text-rose-700 font-semibold block uppercase tracking-wider font-mono">Goal Competition Countdown</span>
            <input
              type="text"
              value={goalMeetName}
              onChange={(e) => setGoalMeetName(e.target.value)}
              className="bg-transparent text-slate-800 text-sm font-display font-bold border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-rose-600 focus:outline-none w-72 md:w-96 pb-0.5 mt-0.5"
            />
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-200/60 rounded-xl px-5 py-2.5 text-center shrink-0 self-end md:self-auto">
          <span className="text-[9px] text-rose-700 font-mono font-bold block">MEET COUNTDOWN</span>
          <span className="text-lg font-display font-bold text-rose-800">{daysUntilMeet} Days Out</span>
        </div>
      </div>

      {/* WEEKLY GRID DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4" id="weekly-calendar-grid">
        {weeklySchedule.map((day, idx) => (
          <div
            key={day.dateString}
            className="bg-slate-50/40 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between min-h-[220px] hover:border-slate-300 transition-colors"
          >
            {/* Day Header */}
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-slate-500 font-bold block">{day.dayName}</span>
                  <span className="text-lg font-display font-bold text-slate-800 mt-0.5">{day.dayNumber}</span>
                </div>
                <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 shadow-2xs">
                  {day.phase || seasonPhase}
                </span>
              </div>

              {/* Workout Block Container */}
              {day.workout ? (
                <div className="mt-4 bg-white border border-slate-200/80 rounded-xl p-3 space-y-2 shadow-2xs">
                  <span className="text-[9px] text-indigo-600 font-bold uppercase block tracking-wider font-mono">
                    {day.workout.focus}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                    {day.workout.name}
                  </h4>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono font-medium pt-1">
                    <span>{day.workout.totalDistance} yd</span>
                    <span>{day.workout.estimatedDuration}m</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 py-8 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 italic">Off / Rest Day</span>
                </div>
              )}
            </div>

            {/* Quick shift actions */}
            {day.workout && (
              <div className="flex gap-1 mt-3 border-t border-slate-100 pt-2 text-[10px] justify-between text-slate-400 font-mono font-semibold">
                <span>SHIFT:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => shiftWorkout(idx, (idx - 1 + 7) % 7)}
                    className="hover:text-slate-900"
                    title="Move back 1 day"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => shiftWorkout(idx, (idx + 1) % 7)}
                    className="hover:text-slate-900"
                    title="Move forward 1 day"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-slate-50/50 p-5 rounded-xl border border-slate-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Planning Strategy:</strong> Desktop users benefit from full seasonal visibility. Dragging workouts adjusts total volume calculations across the entire week, preventing overtraining fatigue scores from spiking above safety limits.
        </p>
      </div>
    </div>
  );
}
