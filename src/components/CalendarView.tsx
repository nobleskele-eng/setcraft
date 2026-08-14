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
type CalendarViewMode = "week" | "month" | "year";

const STORAGE_KEY = "setcraft_calendar_plan";
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
const VIEW_MODES: CalendarViewMode[] = ["week", "month", "year"];
const PHASES = ["General Preparation", "Aerobic Base", "Endurance", "Threshold", "Power", "Speed", "Race Prep", "Taper", "Competition", "Recovery", "Off / Rest"];

const DEMO_WORKOUTS: WorkoutSession[] = [
  { id: "demo-aerobic", name: "Aerobic Capacity Foundations", focus: "Aerobic capacity", phase: "Aerobic Base", blocks: [], totalDistance: 3200, estimatedDuration: 65, avgIntensity: 5.5 },
  { id: "demo-threshold", name: "Progressive Threshold Control", focus: "Threshold endurance", phase: "Threshold", blocks: [], totalDistance: 2800, estimatedDuration: 55, avgIntensity: 7.2 },
  { id: "demo-speed", name: "Starts, Breakouts and Speed", focus: "Sprint quality", phase: "Speed", blocks: [], totalDistance: 1800, estimatedDuration: 42, avgIntensity: 8.5 },
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function mondayOf(date: Date): Date {
  const copy = startOfDay(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

function addDays(date: Date, count: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + count);
  return copy;
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(left: Date, right: Date): boolean {
  return dateKey(left) === dateKey(right);
}

function emptyWeek(phase: string): PlannerDay[] {
  return DAY_NAMES.map(() => ({ phase }));
}

function dayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function datesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  for (let cursor = startOfDay(start); cursor <= end; cursor = addDays(cursor, 1)) dates.push(cursor);
  return dates;
}

function monthDates(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return datesBetween(first, last);
}

function monthGrid(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = mondayOf(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function yearDates(year: number): Date[] {
  return datesBetween(new Date(year, 0, 1), new Date(year, 11, 31));
}

function plannerDayFor(plans: CalendarPlans, date: Date, defaultPhase: string): PlannerDay {
  const week = plans[dateKey(mondayOf(date))];
  return week?.[dayIndex(date)] || { phase: defaultPhase };
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

function summarize(plans: CalendarPlans, dates: Date[], defaultPhase: string) {
  const workouts = dates.map((date) => plannerDayFor(plans, date, defaultPhase).workout).filter(Boolean) as WorkoutSession[];
  return {
    sessions: workouts.length,
    volume: workouts.reduce((sum, workout) => sum + (workout.totalDistance || 0), 0),
    minutes: workouts.reduce((sum, workout) => sum + (workout.estimatedDuration || 0), 0),
    intensityDays: workouts.filter((workout) => (workout.avgIntensity || 0) >= 7.5).length,
  };
}

function periodLabel(mode: CalendarViewMode, anchorDate: Date): string {
  if (mode === "week") {
    const start = mondayOf(anchorDate);
    const end = addDays(start, 6);
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString(undefined, { month: "long" })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }
  if (mode === "month") return anchorDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return String(anchorDate.getFullYear());
}

export default function CalendarView() {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("week");
  const [anchorDate, setAnchorDate] = React.useState(today);
  const [plans, setPlans] = React.useState<CalendarPlans>(loadPlans);
  const [seasonPhase, setSeasonPhase] = React.useState("General Preparation");
  const [goalMeetName, setGoalMeetName] = React.useState("Goal competition");
  const [goalMeetDate, setGoalMeetDate] = React.useState(() => dateKey(addDays(new Date(), 56)));
  const [availableProjects, setAvailableProjects] = React.useState<WorkoutSession[]>(projectSessions);

  const weekStart = React.useMemo(() => mondayOf(anchorDate), [anchorDate]);
  const weekKey = dateKey(weekStart);
  const week = plans[weekKey] || emptyWeek(seasonPhase);
  const weekDates = React.useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const currentMonthDates = React.useMemo(() => monthDates(anchorDate), [anchorDate]);
  const currentYearDates = React.useMemo(() => yearDates(anchorDate.getFullYear()), [anchorDate]);
  const currentPeriodDates = viewMode === "week" ? weekDates : viewMode === "month" ? currentMonthDates : currentYearDates;
  const currentSummary = React.useMemo(() => summarize(plans, currentPeriodDates, seasonPhase), [plans, currentPeriodDates, seasonPhase]);
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

  const movePeriod = (direction: number) => {
    setAnchorDate((current) => {
      if (viewMode === "week") return addDays(current, direction * 7);
      if (viewMode === "month") return addMonths(current, direction);
      return new Date(current.getFullYear() + direction, current.getMonth(), 1);
    });
  };

  const handleViewKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, mode: CalendarViewMode) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = VIEW_MODES.indexOf(mode);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? VIEW_MODES.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + VIEW_MODES.length) % VIEW_MODES.length;
    const nextMode = VIEW_MODES[nextIndex];
    setViewMode(nextMode);
    document.getElementById(`calendar-view-${nextMode}`)?.focus();
  };

  const meet = new Date(`${goalMeetDate}T12:00:00`);
  const daysUntilMeet = Number.isFinite(meet.getTime()) ? Math.ceil((meet.getTime() - Date.now()) / 86400000) : 0;
  const periodUnit = viewMode === "week" ? "this week" : viewMode === "month" ? "this month" : "this year";

  return (
    <section className="sc-calendar" id="calendar-workspace" aria-labelledby="calendar-title">
      <header className="sc-calendar-header">
        <div className="sc-calendar-heading">
          <span className="sc-calendar-icon" aria-hidden="true"><Calendar className="h-5 w-5" /></span>
          <div>
            <span className="sc-calendar-kicker">Training plan</span>
            <h2 id="calendar-title">Season Calendar</h2>
            <p>Plan the current week in detail, then step back to review monthly load and the full season.</p>
          </div>
        </div>

        <div className="sc-calendar-view-switch" role="tablist" aria-label="Calendar view">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              id={`calendar-view-${mode}`}
              type="button"
              role="tab"
              aria-selected={viewMode === mode}
              aria-controls="calendar-period-panel"
              tabIndex={viewMode === mode ? 0 : -1}
              data-active={viewMode === mode ? "true" : "false"}
              onClick={() => setViewMode(mode)}
              onKeyDown={(event) => handleViewKeyDown(event, mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="sc-calendar-toolbar" aria-label="Calendar period controls">
        <div className="sc-calendar-period-nav">
          <button type="button" onClick={() => movePeriod(-1)} aria-label={`Previous ${viewMode}`} title={`Previous ${viewMode}`}><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" className="sc-calendar-today" onClick={() => setAnchorDate(today)}>Today</button>
          <button type="button" onClick={() => movePeriod(1)} aria-label={`Next ${viewMode}`} title={`Next ${viewMode}`}><ChevronRight className="h-4 w-4" /></button>
        </div>
        <strong className="sc-calendar-period-label" aria-live="polite">{periodLabel(viewMode, anchorDate)}</strong>
        {viewMode === "week" && <button type="button" onClick={rotateSchedule} className="sc-calendar-rotate"><Shuffle className="h-4 w-4" />Rotate sessions</button>}
      </div>

      <div className="sc-calendar-metrics" aria-label={`${viewMode} summary`}>
        {[
          { Icon: TrendingUp, label: "Planned volume", value: currentSummary.volume.toLocaleString(), suffix: "pool units" },
          { Icon: Compass, label: "Pool time", value: `${Math.floor(currentSummary.minutes / 60)}h ${currentSummary.minutes % 60}m`, suffix: periodUnit },
          { Icon: Milestone, label: "Quality sessions", value: String(currentSummary.intensityDays), suffix: "RPE 7.5+" },
          { Icon: FolderOpen, label: "Sessions scheduled", value: String(currentSummary.sessions), suffix: periodUnit },
        ].map(({ Icon, label, value, suffix }) => (
          <div key={label} className="sc-calendar-metric">
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{suffix}</small>
          </div>
        ))}
      </div>

      <div className="sc-calendar-settings">
        <label className="sc-calendar-meet-name">
          <span><Flag className="h-4 w-4" aria-hidden="true" />Goal competition</span>
          <input value={goalMeetName} onChange={(event) => setGoalMeetName(event.target.value)} aria-label="Goal competition name" />
        </label>
        <label>
          <span>Meet date</span>
          <input type="date" value={goalMeetDate} onChange={(event) => setGoalMeetDate(event.target.value)} />
        </label>
        <div className="sc-calendar-countdown" aria-live="polite"><span>Countdown</span><strong>{daysUntilMeet >= 0 ? `${daysUntilMeet} days` : `${Math.abs(daysUntilMeet)} days ago`}</strong></div>
        <label>
          <span>Default phase</span>
          <select value={seasonPhase} onChange={(event) => setSeasonPhase(event.target.value)}>{PHASES.map((phase) => <option key={phase}>{phase}</option>)}</select>
        </label>
      </div>

      <div id="calendar-period-panel" role="tabpanel" aria-labelledby={`calendar-view-${viewMode}`} tabIndex={0} className="sc-calendar-panel">
        {viewMode === "week" && (
          <div className="sc-calendar-week" aria-label={`Week of ${weekStart.toLocaleDateString()}`}>
            {DAY_NAMES.map((dayName, index) => {
              const date = weekDates[index];
              const day = week[index] || { phase: seasonPhase };
              const fullDate = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
              return (
                <article key={dateKey(date)} className="sc-calendar-day" data-today={isSameDay(date, today) ? "true" : "false"}>
                  <header>
                    <div><span>{dayName}</span><strong>{date.getDate()}</strong><small>{date.toLocaleDateString(undefined, { month: "short" })}</small></div>
                    <button type="button" onClick={() => assignWorkout(index, "")} aria-label={`Clear session for ${fullDate}`} title="Clear session"><X className="h-4 w-4" /></button>
                  </header>

                  <label className="sc-calendar-field">
                    <span className="sr-only">Training phase for {fullDate}</span>
                    <select value={day.phase || seasonPhase} onChange={(event) => updateWeek((days) => { days[index] = { ...days[index], phase: event.target.value }; return days; })}>{PHASES.map((phase) => <option key={phase}>{phase}</option>)}</select>
                  </label>

                  {day.workout ? (
                    <div className="sc-calendar-session">
                      <span>{day.workout.focus}</span>
                      <h3>{day.workout.name}</h3>
                      <dl><div><dt>Distance</dt><dd>{day.workout.totalDistance.toLocaleString()}</dd></div><div><dt>Time</dt><dd>{day.workout.estimatedDuration} min</dd></div></dl>
                    </div>
                  ) : (
                    <div className="sc-calendar-rest"><Plus className="h-5 w-5" aria-hidden="true" /><span>Rest day</span><small>or assign a practice below</small></div>
                  )}

                  <label className="sc-calendar-field">
                    <span className="sr-only">Practice for {fullDate}</span>
                    <select value={day.workout?.id || ""} onChange={(event) => assignWorkout(index, event.target.value)}>
                      <option value="">Choose practice…</option>
                      {availableProjects.length > 0 && <optgroup label="Saved projects">{availableProjects.map((workout) => <option key={workout.id} value={workout.id}>{workout.name}</option>)}</optgroup>}
                      <optgroup label="Sample plans">{DEMO_WORKOUTS.map((workout) => <option key={workout.id} value={workout.id}>{workout.name}</option>)}</optgroup>
                    </select>
                  </label>

                  {day.workout && (
                    <div className="sc-calendar-move">
                      <span>Move session</span>
                      <div>
                        <button type="button" onClick={() => shiftWorkout(index, (index + 6) % 7)} aria-label={`Move ${day.workout.name} to previous day`}>←</button>
                        <button type="button" onClick={() => shiftWorkout(index, (index + 1) % 7)} aria-label={`Move ${day.workout.name} to next day`}>→</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {viewMode === "month" && (
          <div className="sc-calendar-table-wrap">
            <table className="sc-calendar-month-table">
              <caption className="sr-only">Monthly training overview for {periodLabel("month", anchorDate)}</caption>
              <thead><tr>{DAY_NAMES.map((day) => <th scope="col" key={day}>{day}</th>)}</tr></thead>
              <tbody>
                {Array.from({ length: 6 }, (_, row) => (
                  <tr key={row}>
                    {monthGrid(anchorDate).slice(row * 7, row * 7 + 7).map((date) => {
                      const day = plannerDayFor(plans, date, seasonPhase);
                      const outside = date.getMonth() !== anchorDate.getMonth();
                      const fullDate = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
                      return (
                        <td key={dateKey(date)} data-outside={outside ? "true" : "false"} data-today={isSameDay(date, today) ? "true" : "false"}>
                          <button type="button" onClick={() => { setAnchorDate(date); setViewMode("week"); }} aria-label={`${fullDate}. ${day.workout ? `${day.workout.name}, ${day.workout.totalDistance} distance units` : "No session scheduled"}. Open week.`}>
                            <span className="sc-month-date">{date.getDate()}</span>
                            {day.workout ? <><span className="sc-month-session">{day.workout.name}</span><small>{day.workout.totalDistance.toLocaleString()} · {day.workout.estimatedDuration} min</small></> : <span className="sc-month-rest">Rest / open</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === "year" && (
          <div className="sc-calendar-year" aria-label={`${anchorDate.getFullYear()} training overview`}>
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const monthDate = new Date(anchorDate.getFullYear(), monthIndex, 1);
              const dates = monthDates(monthDate);
              const gridDates = monthGrid(monthDate);
              const summary = summarize(plans, dates, seasonPhase);
              return (
                <button key={monthIndex} type="button" className="sc-calendar-year-month" onClick={() => { setAnchorDate(monthDate); setViewMode("month"); }} aria-label={`${monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}: ${summary.sessions} sessions, ${summary.volume} distance units. Open month.`}>
                  <header><strong>{monthDate.toLocaleDateString(undefined, { month: "long" })}</strong><span>{summary.sessions} sessions</span></header>
                  <div className="sc-year-day-labels" aria-hidden="true">{DAY_INITIALS.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
                  <div className="sc-year-days" aria-hidden="true">
                    {gridDates.map((date) => {
                      const day = plannerDayFor(plans, date, seasonPhase);
                      return <span key={dateKey(date)} data-outside={date.getMonth() !== monthIndex ? "true" : "false"} data-session={day.workout ? "true" : "false"} data-quality={(day.workout?.avgIntensity || 0) >= 7.5 ? "true" : "false"}>{date.getDate()}</span>;
                    })}
                  </div>
                  <footer><span>{summary.volume.toLocaleString()} volume</span><span>{Math.round(summary.minutes / 60)}h pool time</span></footer>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="sc-calendar-note"><Info className="h-4 w-4" aria-hidden="true" /><p><strong>Coach note:</strong> Calendar totals are planning signals, not readiness decisions. Compare them with actual completion, athlete feedback, meet timing and qualified coaching judgment.</p></div>
    </section>
  );
}
