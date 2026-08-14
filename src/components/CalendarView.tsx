/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Calendar,
  Compass,
  Milestone,
  Flag,
  TrendingUp,
  Info,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Plus,
  X,
  FolderOpen,
} from "lucide-react";
import { WorkoutSession } from "../types";
import { StudioProject } from "../studioProjectTypes";
import { calculateStats } from "../swimStudioEngine";

type PlannerDay = { phase: string; workout?: WorkoutSession };
type CalendarPlans = Record<string, PlannerDay[]>;

const STORAGE_KEY = "setcraft_calendar_plan";
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PHASES = ["General Preparation", "Aerobic Base", "Endurance", "Threshold", "Power", "Speed", "Race Prep", "Taper", "Competition", "Recovery", "Off / Rest"];

const DEMO_WORKOUTS: WorkoutSession[] = [
  { id: "demo-aerobic", name: "Aerobic Capacity Foundations", focus: "Aerobic capacity", phase: "Aerobic Base", blocks: [], totalDistance: 3200, estimatedDuration: 65, avgIntensity: 5.5 },
  { id: "demo-threshold", name: "Progressive Threshold Control", focus: "Threshold endurance", phase: "Threshold", blocks: [], totalDistance: 2800, estimatedDuration: 55, avgIntensity: 7.2 },
  { id: "demo-speed", name: "Starts, Breakouts and Speed", focus: "Sprint quality", phase: "Speed", blocks: [], totalDistance: 1800, estimatedDuration: 42, avgIntensity: 8.5 },
];

function mondayOf(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, count: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + count);
  return copy;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyWeek(phase: string): PlannerDay[] {
  return DAY_NAMES.map(() => ({ phase }));
}

function loadPlans(): CalendarPlans {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function projectSessions(): WorkoutSession[] {
  try {
    const projects: StudioProject[] = JSON.parse(localStorage.getItem("setcraft_studio_projects") || "[]");
    return projects.map((project) => {
      const stats = calculateStats(project.nodes || []);
      return {
        id: `project:${project.id}`,
        name: project.name,
        focus: project.focus || "Custom practice",
        phase: project.phase || "General Preparation",
        blocks: [],
        totalDistance: stats.totalDistance,
        estimatedDuration: Math.max(1, stats.estimatedDuration),
        avgIntensity: stats.averageIntensity,
      };
    });
  } catch {
    return [];
  }
}

export default function CalendarView() {
  const [currentWeekOffset, setCurrentWeekOffset] = React.useState(0);
  const [plans, setPlans] = React.useState<CalendarPlans>(loadPlans);
  const [seasonPhase, setSeasonPhase] = React.useState("General Preparation");
  const [goalMeetName, setGoalMeetName] = React.useState("Goal competition");
  const [goalMeetDate, setGoalMeetDate] = React.useState(() => {
    const future = addDays(new Date(), 56);
    return dateKey(future);
  });
  const [availableProjects, setAvailableProjects] = React.useState<WorkoutSession[]>(projectSessions);

  const baseMonday = React.useMemo(() => addDays(mondayOf(new Date()), currentWeekOffset * 7), [currentWeekOffset]);
  const weekKey = dateKey(baseMonday);
  const week: PlannerDay[] = plans[weekKey] || emptyWeek(seasonPhase);
  const availableWorkouts = React.useMemo(() => [...availableProjects, ...DEMO_WORKOUTS], [availableProjects]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

  React.useEffect(() => {
    const refresh = () => setAvailableProjects(projectSessions());
    window.addEventListener("storage", refresh);
    const interval = window.setInterval(refresh, 2500);
    return () => { window.removeEventListener("storage", refresh); window.clearInterval(interval); };
  }, []);

  const updateWeek = (updater: (days: PlannerDay[]) => PlannerDay[]) => {
    setPlans((current) => ({ ...current, [weekKey]: updater([...(current[weekKey] || emptyWeek(seasonPhase))]) }));
  };

  const totalWeeklyVolume = week.reduce((sum, day) => sum + (day.workout?.totalDistance || 0), 0);
  const totalWeeklyTime = week.reduce((sum, day) => sum + (day.workout?.estimatedDuration || 0), 0);
  const intensityDays = week.filter((day) => (day.workout?.avgIntensity || 0) >= 7.5).length;
  const meet = new Date(`${goalMeetDate}T12:00:00`);
  const daysUntilMeet = Number.isFinite(meet.getTime()) ? Math.ceil((meet.getTime() - Date.now()) / 86400000) : 0;

  const assignWorkout = (index: number, workoutId: string) => updateWeek((days) => {
    const workout = availableWorkouts.find((item) => item.id === workoutId);
    days[index] = { ...days[index], workout, phase: workout?.phase || days[index].phase || seasonPhase };
    return days;
  });

  const shiftWorkout = (fromIndex: number, toIndex: number) => updateWeek((days) => {
    const next = days.map((day) => ({ ...day }));
    [next[fromIndex].workout, next[toIndex].workout] = [next[toIndex].workout, next[fromIndex].workout];
    return next;
  });

  const rotateSchedule = () => updateWeek((days) => {
    const next = days.map((day) => ({ ...day }));
    const last = next[next.length - 1].workout;
    for (let index = next.length - 1; index > 0; index -= 1) next[index].workout = next[index - 1].workout;
    next[0].workout = last;
    return next;
  });

  const weekLabel = baseMonday.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="rounded-[28px] border border-hairline-on-canvas/80 bg-white p-6 shadow-sm md:p-9" id="calendar-workspace">
      <div className="mb-8 flex flex-col gap-5 border-b border-canvas-raised pb-7 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold text-surface"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-canvas text-accent-active"><Calendar className="h-5 w-5" /></span>Season Calendar & Week Planner</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted-on-canvas">Assign saved SetCraft projects to training days, move sessions, label phases and keep each week stored locally.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={rotateSchedule} className="flex items-center gap-2 rounded-xl border border-hairline-on-canvas bg-white px-4 py-3 text-sm font-bold text-ink-on-canvas transition hover:-translate-y-0.5 hover:border-disabled hover:shadow-md"><Shuffle className="h-4 w-4 text-accent-active" />Rotate sessions</button>
          <div className="flex items-center rounded-xl border border-hairline-on-canvas bg-canvas-raised p-1">
            <button type="button" onClick={() => setCurrentWeekOffset((value) => value - 1)} className="rounded-lg p-2 text-ink-muted-on-canvas hover:bg-white hover:text-surface"><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-[190px] px-3 text-center text-xs font-bold text-ink-on-canvas">Week of {weekLabel}</span>
            <button type="button" onClick={() => setCurrentWeekOffset((value) => value + 1)} className="rounded-lg p-2 text-ink-muted-on-canvas hover:bg-white hover:text-surface"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
        {[
          { Icon: TrendingUp, label: "Weekly volume", value: `${totalWeeklyVolume.toLocaleString()} distance units` },
          { Icon: Compass, label: "Estimated pool time", value: `${Math.floor(totalWeeklyTime / 60)}h ${totalWeeklyTime % 60}m` },
          { Icon: Milestone, label: "Higher-intensity days", value: `${intensityDays} session${intensityDays === 1 ? "" : "s"}` },
          { Icon: FolderOpen, label: "Saved practices available", value: `${availableProjects.length} project${availableProjects.length === 1 ? "" : "s"}` },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-hairline-on-canvas bg-canvas/70 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"><Icon className="h-5 w-5 text-accent-active" /><span className="mt-4 block text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted-on-canvas">{label}</span><span className="mt-1 block text-lg font-bold text-surface">{value}</span></div>
        ))}
      </div>

      <div className="mb-8 grid gap-5 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 lg:grid-cols-[1fr_220px_190px] lg:items-end">
        <label><span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800"><Flag className="h-4 w-4" />Goal competition</span><input value={goalMeetName} onChange={(event) => setGoalMeetName(event.target.value)} className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-surface outline-none focus:ring-2 focus:ring-rose-200" /></label>
        <label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-rose-800">Meet date</span><input type="date" value={goalMeetDate} onChange={(event) => setGoalMeetDate(event.target.value)} className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-surface-raised outline-none" /></label>
        <div className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-center"><span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700">Countdown</span><span className="text-xl font-bold text-rose-900">{daysUntilMeet >= 0 ? `${daysUntilMeet} days` : `${Math.abs(daysUntilMeet)} days ago`}</span></div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-hairline-on-canvas bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"><div><span className="block text-sm font-bold text-surface">Default week phase</span><span className="text-xs text-ink-muted-on-canvas">Used for empty days and new week plans.</span></div><select value={seasonPhase} onChange={(event) => setSeasonPhase(event.target.value)} className="rounded-xl border border-hairline-on-canvas bg-white px-4 py-3 text-sm font-bold text-surface-raised outline-none focus:border-accent-hover">{PHASES.map((phase) => <option key={phase}>{phase}</option>)}</select></div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7" id="weekly-calendar-grid">
        {DAY_NAMES.map((dayName, index) => {
          const date = addDays(baseMonday, index);
          const day = week[index] || { phase: seasonPhase };
          return (
            <article key={dateKey(date)} className="flex min-h-[360px] flex-col rounded-2xl border border-hairline-on-canvas bg-canvas/50 p-4 transition hover:-translate-y-1 hover:border-hairline-on-canvas hover:bg-white hover:shadow-lg">
              <header className="flex items-start justify-between gap-2"><div><span className="block text-xs font-bold text-ink-muted-on-canvas">{dayName}</span><span className="mt-1 block font-display text-2xl font-bold text-surface">{date.getDate()}</span></div><button type="button" onClick={() => assignWorkout(index, "")} title="Clear session" className="rounded-lg p-2 text-disabled hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button></header>
              <select value={day.phase || seasonPhase} onChange={(event) => updateWeek((days) => { days[index] = { ...days[index], phase: event.target.value }; return days; })} className="mt-3 w-full rounded-lg border border-hairline-on-canvas bg-white px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted-on-canvas outline-none">{PHASES.map((phase) => <option key={phase}>{phase}</option>)}</select>

              {day.workout ? (
                <div className="mt-4 flex-1 rounded-2xl border border-hairline-on-canvas bg-white p-4 shadow-sm"><span className="text-[10px] font-bold uppercase tracking-wider text-accent-active">{day.workout.focus}</span><h3 className="mt-2 text-sm font-bold leading-snug text-surface">{day.workout.name}</h3><div className="mt-4 grid grid-cols-2 gap-2 text-center"><span className="rounded-lg bg-canvas-raised px-2 py-2 text-[10px] font-bold text-ink-muted-on-canvas">{day.workout.totalDistance.toLocaleString()}</span><span className="rounded-lg bg-canvas-raised px-2 py-2 text-[10px] font-bold text-ink-muted-on-canvas">{day.workout.estimatedDuration} min</span></div></div>
              ) : <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-disabled bg-white/70 p-4 text-center"><Plus className="h-6 w-6 text-disabled" /><span className="mt-2 text-xs font-bold text-ink-muted-on-canvas">Rest day or assign a project</span></div>}

              <select value={day.workout?.id || ""} onChange={(event) => assignWorkout(index, event.target.value)} className="mt-4 w-full rounded-xl border border-hairline-on-canvas bg-white px-3 py-2.5 text-xs font-bold text-ink-on-canvas outline-none focus:border-accent-hover"><option value="">Choose practice…</option>{availableProjects.length > 0 && <optgroup label="Saved projects">{availableProjects.map((workout) => <option key={workout.id} value={workout.id}>{workout.name}</option>)}</optgroup>}<optgroup label="Sample plans">{DEMO_WORKOUTS.map((workout) => <option key={workout.id} value={workout.id}>{workout.name}</option>)}</optgroup></select>
              {day.workout && <div className="mt-3 flex items-center justify-between border-t border-hairline-on-canvas pt-3 text-xs font-bold text-ink-muted-on-canvas"><span>Move</span><div className="flex gap-1"><button type="button" onClick={() => shiftWorkout(index, (index + 6) % 7)} className="rounded-lg px-2 py-1 hover:bg-canvas-raised hover:text-surface">←</button><button type="button" onClick={() => shiftWorkout(index, (index + 1) % 7)} className="rounded-lg px-2 py-1 hover:bg-canvas-raised hover:text-surface">→</button></div></div>}
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-hairline-on-canvas bg-canvas p-5"><Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-active" /><p className="text-xs leading-relaxed text-surface"><strong>Planning note:</strong> Weekly volume and intensity-day counts are summaries, not automatic readiness decisions. Use them alongside actual completion, athlete feedback, meet timing and qualified coaching judgment.</p></div>
    </div>
  );
}
