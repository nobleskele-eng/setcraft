/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Blocks,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDot,
  ClipboardList,
  Copy,
  Droplets,
  FileDown,
  FileJson,
  FolderPlus,
  Flag,
  Gauge,
  GripVertical,
  Layers3,
  Lock,
  LockOpen,
  Maximize2,
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  MonitorUp,
  LayoutTemplate,
  ListChecks,
  Minus,
  MoreHorizontal,
  PenLine,
  Plus,
  Redo2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TimerReset,
  Trash2,
  Undo2,
  Users,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { UserRole, WorkoutSession } from "../types";
import { FamousWorkout } from "../famousWorkouts";
import { DeckSheetMeta, GoalTimeTable, LaneAssignmentConfig, LaneSetAssignment, LaneSwimmerAssignment, PracticeLaneAssignment } from "../studioSheetTypes";
import { DEFAULT_PROJECT_FOLDERS, StudioProject } from "../studioProjectTypes";
import {
  BREATHING_PATTERNS,
  EQUIPMENT,
  PALETTE_PRESETS,
  START_METHODS,
  STROKES,
  PoolLength,
  PoolUnit,
  StudioConditionNode,
  StudioLaneNode,
  StudioNode,
  StudioNoteNode,
  StudioProgressNode,
  StudioRepeatNode,
  StudioSectionNode,
  StudioSetNode,
  StudioTimeCapNode,
  ValidationIssue,
  calculateStats,
  cloneNode,
  containsNode,
  createPaletteNode,
  createSetNode,
  defaultLanes,
  findNode,
  flattenToLegacyBlocks,
  formatWorkoutText,
  insertNode,
  nodeLabel,
  parseQuickWrite,
  removeNode,
  starterWorkout,
  updateNode,
  validateWorkout,
} from "../swimStudioEngine";

interface SwimStudioProps {
  currentRole: UserRole;
  onSaveWorkoutToCalendar?: (workout: WorkoutSession) => void;
  initialWorkout?: FamousWorkout | null;
  initialProject?: StudioProject | null;
  onInitialWorkoutLoaded?: () => void;
  onInitialProjectLoaded?: () => void;
  requestedPage?: "project" | "build" | "lanes" | "deck" | "review";
  onPageChange?: (page: "project" | "build" | "lanes" | "deck" | "review") => void;
}

type SavedStudioTemplate = StudioProject;

interface CustomBlock {
  id: string;
  name: string;
  description?: string;
  node: StudioNode;
  savedAt: string;
}

type CustomBlockKind = "set" | "section" | "repeat" | "note";

interface MakeBlockDraft {
  name: string;
  description: string;
  kind: CustomBlockKind;
  blockType: StudioSetNode["blockType"];
  reps: number;
  distance: number;
  stroke: string;
  interval: string;
  intensity: number;
  notes: string;
  sectionPurpose: string;
  rounds: number;
}

const DEFAULT_MAKE_BLOCK: MakeBlockDraft = {
  name: "",
  description: "",
  kind: "set",
  blockType: "aerobic",
  reps: 4,
  distance: 100,
  stroke: "Free",
  interval: "1:30",
  intensity: 6,
  notes: "",
  sectionPurpose: "",
  rounds: 2,
};

const makeLane = (index: number): PracticeLaneAssignment => ({
  id: `practice-lane-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  label: `Lane ${index + 1}`,
  defaultPace: "",
  defaultSendOff: "",
  laneNotes: "",
  swimmers: [],
  setAssignments: [],
});

const DEFAULT_LANE_ASSIGNMENTS: LaneAssignmentConfig = {
  enabled: true,
  lanes: Array.from({ length: 6 }, (_, index) => makeLane(index)),
  absent: "",
  showLaneSetPlans: true,
};

const DEFAULT_DECK_SHEET_META: DeckSheetMeta = {
  sessionCode: "W34D4",
  date: new Date().toISOString().slice(0, 10),
  timeRange: "5:30-7:30pm",
  dayLabel: "Friday",
  coaches: "Coach",
  quote: "",
  weekFocus: "",
  todayFocus: "",
  footerNote: "",
  bottomNotes: "",
  goalTimesEnabled: false,
  goalTimeTables: [{
    id: "goal-table-default",
    title: "Target goal times",
    columns: ["25", "50", "100", "200"],
    rows: [{ id: "goal-row-default", label: "Goal", values: ["", "", "", ""] }],
  }],
};

function migrateLaneAssignments(value?: Partial<LaneAssignmentConfig> | null): LaneAssignmentConfig {
  const source = value || DEFAULT_LANE_ASSIGNMENTS;
  const lanes = (source.lanes || DEFAULT_LANE_ASSIGNMENTS.lanes).map((lane, index) => ({
    ...makeLane(index),
    ...lane,
    defaultPace: lane.defaultPace || "",
    defaultSendOff: lane.defaultSendOff || "",
    laneNotes: lane.laneNotes || "",
    swimmers: lane.swimmers || [],
    setAssignments: lane.setAssignments || [],
  }));
  return { enabled: source.enabled ?? true, absent: source.absent || "", showLaneSetPlans: source.showLaneSetPlans ?? true, lanes };
}

function migrateDeckMeta(value?: Partial<DeckSheetMeta> | null): DeckSheetMeta {
  return { ...DEFAULT_DECK_SHEET_META, ...(value || {}), bottomNotes: value?.bottomNotes || "", goalTimesEnabled: value?.goalTimesEnabled ?? false, goalTimeTables: value?.goalTimeTables?.length ? value.goalTimeTables : DEFAULT_DECK_SHEET_META.goalTimeTables };
}

function workoutNodeOptions(nodes: StudioNode[], depth = 0): Array<{ id: string; label: string }> {
  const options: Array<{ id: string; label: string }> = [];
  nodes.forEach((node) => {
    options.push({ id: node.id, label: `${"— ".repeat(depth)}${nodeLabel(node)}` });
    if (node.kind !== "set" && node.kind !== "note") options.push(...workoutNodeOptions(node.children, depth + 1));
  });
  return options;
}

interface QuickSetDraft {
  blockType: StudioSetNode["blockType"];
  reps: number;
  distance: number;
  stroke: string;
  interval: string;
  notes: string;
}

const DEFAULT_QUICK_SET: QuickSetDraft = {
  blockType: "aerobic",
  reps: 4,
  distance: 100,
  stroke: "Free",
  interval: "1:30",
  notes: "",
};


interface DragPayload {
  source: "palette" | "custom" | "canvas";
  paletteId?: string;
  customId?: string;
  nodeId?: string;
}

type RightTab = "inspector" | "analysis" | "preview";
type StudioPage = "project" | "build" | "lanes" | "deck" | "review";

const CATEGORY_META: Record<string, { dot: string; selected: string; palette: string; icon: React.ElementType }> = {
  Structure: { dot: "bg-block-structure", selected: "bg-canvas-raised text-surface", palette: "bg-block-structure hover:brightness-110", icon: Layers3 },
  "Warm-up": { dot: "bg-block-warmup", selected: "bg-canvas-raised text-block-warmup", palette: "bg-block-warmup hover:brightness-110", icon: Waves },
  Skills: { dot: "bg-block-skills", selected: "bg-canvas-raised text-block-skills", palette: "bg-block-skills hover:brightness-110", icon: Target },
  "Kick & Pull": { dot: "bg-block-kickpull", selected: "bg-canvas-raised text-block-kickpull", palette: "bg-block-kickpull hover:brightness-110", icon: Droplets },
  Aerobic: { dot: "bg-block-aerobic", selected: "bg-canvas-raised text-block-aerobic", palette: "bg-block-aerobic hover:brightness-110", icon: Activity },
  Threshold: { dot: "bg-block-threshold", selected: "bg-canvas-raised text-block-threshold", palette: "bg-block-threshold hover:brightness-110", icon: Gauge },
  Speed: { dot: "bg-block-sprint", selected: "bg-canvas-raised text-block-sprint", palette: "bg-block-sprint hover:brightness-110", icon: Zap },
  "Race pace": { dot: "bg-block-racepace", selected: "bg-canvas-raised text-block-racepace", palette: "bg-block-racepace hover:brightness-110", icon: Flag },
  Lactate: { dot: "bg-block-lactate", selected: "bg-canvas-raised text-block-lactate", palette: "bg-block-lactate hover:brightness-110", icon: Activity },
  USRPT: { dot: "bg-block-usrpt", selected: "bg-canvas-raised text-block-usrpt", palette: "bg-block-usrpt hover:brightness-110", icon: TimerReset },
  Recovery: { dot: "bg-block-recovery", selected: "bg-canvas-raised text-block-recovery", palette: "bg-block-recovery hover:brightness-110", icon: RefreshCw },
  Control: { dot: "bg-block-structure", selected: "bg-canvas-raised text-surface", palette: "bg-block-structure hover:brightness-110", icon: Blocks },
  "Favorites": { dot: "bg-accent", selected: "bg-canvas-raised text-accent-active", palette: "bg-accent hover:bg-accent-hover", icon: Star },
  "My Blocks": { dot: "bg-signal-warn", selected: "bg-canvas-raised text-signal-warn", palette: "bg-signal-warn hover:brightness-110", icon: Sparkles },
  "Backpack": { dot: "bg-block-usrpt", selected: "bg-canvas-raised text-block-usrpt", palette: "bg-block-usrpt hover:brightness-110", icon: ClipboardList },
};

const NODE_STYLE: Record<string, { shell: string; header: string; badge: string; border: string }> = {
  section: { shell: "bg-canvas border-hairline-on-canvas", header: "bg-block-structure", badge: "bg-canvas-raised text-ink-on-canvas border-hairline-on-canvas", border: "border-hairline-on-canvas" },
  repeat: { shell: "bg-canvas border-block-kickpull", header: "bg-block-kickpull", badge: "bg-canvas-raised text-block-kickpull border-hairline-on-canvas", border: "border-block-kickpull" },
  condition: { shell: "bg-canvas border-block-usrpt", header: "bg-block-usrpt", badge: "bg-canvas-raised text-block-usrpt border-hairline-on-canvas", border: "border-block-usrpt" },
  progress: { shell: "bg-canvas border-block-threshold", header: "bg-block-threshold", badge: "bg-canvas-raised text-block-threshold border-hairline-on-canvas", border: "border-block-threshold" },
  "time-cap": { shell: "bg-canvas border-block-usrpt", header: "bg-block-usrpt", badge: "bg-canvas-raised text-block-usrpt border-hairline-on-canvas", border: "border-block-usrpt" },
  lane: { shell: "bg-canvas border-block-racepace", header: "bg-block-racepace", badge: "bg-canvas-raised text-block-racepace border-hairline-on-canvas", border: "border-block-racepace" },
  note: { shell: "bg-canvas border-disabled", header: "bg-disabled", badge: "bg-canvas-raised text-ink-muted-on-canvas border-hairline-on-canvas", border: "border-disabled" },
  "warm-up": { shell: "bg-block-warmup border-block-warmup", header: "bg-block-warmup", badge: "bg-canvas-raised text-block-warmup border-hairline-on-canvas", border: "border-block-warmup" },
  drill: { shell: "bg-block-skills border-block-skills", header: "bg-block-skills", badge: "bg-canvas-raised text-block-skills border-hairline-on-canvas", border: "border-block-skills" },
  underwater: { shell: "bg-block-recovery border-block-recovery", header: "bg-block-recovery", badge: "bg-canvas-raised text-block-recovery border-hairline-on-canvas", border: "border-block-recovery" },
  kick: { shell: "bg-block-kickpull border-block-kickpull", header: "bg-block-kickpull", badge: "bg-canvas-raised text-block-kickpull border-hairline-on-canvas", border: "border-block-kickpull" },
  pull: { shell: "bg-block-kickpull border-block-kickpull", header: "bg-block-kickpull", badge: "bg-canvas-raised text-block-kickpull border-hairline-on-canvas", border: "border-block-kickpull" },
  aerobic: { shell: "bg-block-aerobic border-block-aerobic", header: "bg-block-aerobic", badge: "bg-canvas-raised text-block-aerobic border-hairline-on-canvas", border: "border-block-aerobic" },
  threshold: { shell: "bg-block-threshold border-block-threshold", header: "bg-block-threshold", badge: "bg-canvas-raised text-block-threshold border-hairline-on-canvas", border: "border-block-threshold" },
  sprint: { shell: "bg-block-sprint border-block-sprint", header: "bg-block-sprint", badge: "bg-canvas-raised text-block-sprint border-hairline-on-canvas", border: "border-block-sprint" },
  "race-pace": { shell: "bg-block-racepace border-block-racepace", header: "bg-block-racepace", badge: "bg-canvas-raised text-block-racepace border-hairline-on-canvas", border: "border-block-racepace" },
  lactate: { shell: "bg-block-lactate border-block-lactate", header: "bg-block-lactate", badge: "bg-canvas-raised text-block-lactate border-hairline-on-canvas", border: "border-block-lactate" },
  USRPT: { shell: "bg-block-usrpt border-block-usrpt", header: "bg-block-usrpt", badge: "bg-canvas-raised text-block-usrpt border-hairline-on-canvas", border: "border-block-usrpt" },
  "test-set": { shell: "bg-surface-raised border-surface-raised", header: "bg-surface-raised", badge: "bg-canvas-raised text-ink-on-canvas border-hairline-on-canvas", border: "border-surface-raised" },
  recovery: { shell: "bg-block-recovery border-block-recovery", header: "bg-block-recovery", badge: "bg-canvas-raised text-block-recovery border-hairline-on-canvas", border: "border-block-recovery" },
};

const TYPE_LABEL: Record<string, string> = {
  "warm-up": "Warm-up",
  drill: "Drill",
  underwater: "Underwater",
  kick: "Kick",
  pull: "Pull",
  aerobic: "Aerobic",
  threshold: "Threshold",
  sprint: "Sprint",
  "race-pace": "Race pace",
  lactate: "Lactate",
  USRPT: "USRPT",
  "test-set": "Test set",
  recovery: "Recovery",
};

function styleKey(node: StudioNode): string {
  return node.kind === "set" ? node.blockType : node.kind;
}

function childrenOf(node: StudioNode): StudioNode[] {
  return node.kind === "set" || node.kind === "note" ? [] : node.children;
}

function findParentInfo(nodes: StudioNode[], nodeId: string, parentId: string | null = null): { parentId: string | null; index: number } | null {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.id === nodeId) return { parentId, index };
    const result = findParentInfo(childrenOf(node), nodeId, node.id);
    if (result) return result;
  }
  return null;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted-on-canvas">{children}</label>;
}

function StopDrag({ children }: { children: React.ReactNode }) {
  return <span onMouseDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>{children}</span>;
}

function DropZone({ parentId, index, active, label, onDropPayload }: { parentId: string | null; index: number; active: boolean; label?: string; onDropPayload: (parentId: string | null, index: number, event: React.DragEvent<HTMLDivElement>) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      data-setcraft-dropzone="true"
      className={`group relative flex items-center justify-center transition-all duration-100 ${hovered ? "h-16" : active ? "h-9" : "h-1.5"}`}
      onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); setHovered(true); }}
      onDragLeave={(event) => {
        event.stopPropagation();
        const related = event.relatedTarget as Node | null;
        if (!related || !event.currentTarget.contains(related)) setHovered(false);
      }}
      onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; }}
      onDrop={(event) => { setHovered(false); onDropPayload(parentId, index, event); }}
    >
      <div className={`mx-1 flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed transition-all ${hovered ? "border-accent-hover bg-canvas shadow-[0_0_0_5px_rgba(6,182,212,0.14)]" : active ? "border-disabled/80 bg-canvas/45" : "border-transparent group-hover:border-disabled"}`}>
        {hovered && <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-white shadow-sm">Snap {label || "block"} here</span>}
      </div>
    </div>
  );
}

interface NodeCardProps {
  node: StudioNode;
  selectedId: string | null;
  draggingId: string | null;
  dragActive: boolean;
  dragLabel: string;
  collapsedIds: Set<string>;
  poolUnit: PoolUnit;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPatch: (id: string, patcher: (node: StudioNode) => StudioNode) => void;
  onToggleCollapse: (id: string) => void;
  onDragStart: (id: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDropPayload: (parentId: string | null, index: number, event: React.DragEvent<HTMLDivElement>) => void;
  onQuickAdd: (parentId: string, paletteId: string) => void;
}

function NodeCard({ node, selectedId, draggingId, dragActive, dragLabel, collapsedIds, poolUnit, onSelect, onDelete, onDuplicate, onPatch, onToggleCollapse, onDragStart, onDragEnd, onDropPayload, onQuickAdd }: NodeCardProps) {
  const style = NODE_STYLE[styleKey(node)] || NODE_STYLE.aerobic;
  const selected = selectedId === node.id;
  const collapsed = collapsedIds.has(node.id);

  if (node.kind === "set") {
    const patchSet = (fields: Partial<StudioSetNode>) => onPatch(node.id, (current) => current.kind === "set" ? { ...current, ...fields } : current);
    return (
      <div onClick={(event) => { event.stopPropagation(); onSelect(node.id); }} className={`scratch-stack-block relative rounded-[14px] border-2 text-white shadow-sm transition ${style.shell} ${selected ? "ring-4 ring-surface/70 ring-offset-2" : "hover:-translate-y-0.5 hover:shadow-md"} ${draggingId === node.id ? "opacity-35" : "opacity-100"}`}>
        <div className="flex min-h-11 items-center gap-2 px-3 py-2">
          <div
            draggable={!node.locked}
            onDragStart={(event) => !node.locked && onDragStart(node.id, event)}
            onDragEnd={onDragEnd}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${node.locked ? "cursor-not-allowed opacity-50" : "cursor-grab hover:bg-white/15 active:cursor-grabbing"}`}
            title={node.locked ? "Unlock this block before moving it" : "Drag block"}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <button type="button" onClick={(event) => { event.stopPropagation(); onToggleCollapse(node.id); }} className="rounded p-0.5 hover:bg-white/15" title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <span className="max-w-[160px] truncate text-xs font-bold">{node.label}</span>
          <span className="rounded-full bg-black/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">{TYPE_LABEL[node.blockType]}</span>
          <div className="ml-auto flex items-center gap-1">
            {node.locked && <Lock className="h-4 w-4" />}
            <button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(node.id); }} className="rounded p-1 hover:bg-white/15" title="Duplicate"><Copy className="h-4 w-4" /></button>
            <button type="button" disabled={node.locked} onClick={(event) => { event.stopPropagation(); onDelete(node.id); }} className="rounded p-1 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>

        {!collapsed && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-white/20 px-3 py-2.5 text-[11px] font-semibold">
            <StopDrag>
              <input aria-label="Repetitions" type="number" min={1} value={node.reps} onChange={(event) => patchSet({ reps: Math.max(1, Number(event.target.value) || 1) })} className="scratch-input w-12" />
            </StopDrag>
            <span>×</span>
            <StopDrag>
              <input aria-label={`Distance ${poolUnit}`} type="number" min={0} step={5} value={node.distance} onChange={(event) => patchSet({ distance: Math.max(0, Number(event.target.value) || 0) })} className="scratch-input w-16" />
            </StopDrag>
            <span>{poolUnit}</span>
            <StopDrag>
              <select aria-label="Stroke" value={node.stroke} onChange={(event) => patchSet({ stroke: event.target.value })} className="scratch-input min-w-20">
                {STROKES.map((stroke) => <option key={stroke} className="text-surface">{stroke}</option>)}
              </select>
            </StopDrag>
            <span>on</span>
            <StopDrag>
              <input aria-label="Send-off" value={node.interval} onChange={(event) => patchSet({ interval: event.target.value })} className="scratch-input w-16 font-mono" />
            </StopDrag>
            {node.targetTime && <span className="rounded-full bg-black/15 px-2 py-1 font-mono">target {node.targetTime}</span>}
            <span className="rounded-full bg-black/15 px-2 py-1">RPE {node.intensity}</span>
            {node.equipment.slice(0, 2).map((item) => <span key={item} className="rounded-full bg-white/15 px-2 py-1">{item}</span>)}
            {node.equipment.length > 2 && <span className="rounded-full bg-white/15 px-2 py-1">+{node.equipment.length - 2}</span>}
          </div>
        )}
      </div>
    );
  }

  if (node.kind === "note") {
    return (
      <div onClick={(event) => { event.stopPropagation(); onSelect(node.id); }} className={`relative rounded-xl border-2 p-3 text-surface-raised shadow-sm ${style.shell} ${selected ? "ring-4 ring-surface/70 ring-offset-2" : ""}`}>
        <div className="flex items-start gap-2">
          <div draggable={!node.locked} onDragStart={(event) => !node.locked && onDragStart(node.id, event)} onDragEnd={onDragEnd} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${node.locked ? "cursor-not-allowed opacity-50" : "cursor-grab hover:bg-yellow-100"}`}><GripVertical className="h-4 w-4 text-yellow-700" /></div>
          <ClipboardList className="h-4 w-4 text-yellow-700" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold">{node.label}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted-on-canvas">{node.text}</p>
          </div>
          <button type="button" disabled={node.locked} onClick={(event) => { event.stopPropagation(); onDelete(node.id); }} className="rounded p-1 text-ink-muted-on-canvas hover:bg-yellow-100 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }

  const children = node.children;
  const title = nodeLabel(node);
  const kindLabel = node.kind === "section" ? "Section" : node.kind === "repeat" ? "Repeat" : node.kind === "condition" ? "If / else" : node.kind === "progress" ? "Progress" : node.kind === "time-cap" ? "Time cap" : "Lane branch";
  let summary = "";
  if (node.kind === "section") summary = node.purpose;
  if (node.kind === "repeat") summary = `${node.rounds} rounds`;
  if (node.kind === "condition") summary = `${node.metric} ${node.comparator} ${node.threshold} → ${node.action}`;
  if (node.kind === "progress") summary = `${node.rounds} rounds · ${node.mode} ${node.amount}${node.unit}`;
  if (node.kind === "time-cap") summary = `${node.minutes} min · ${node.behavior}`;
  if (node.kind === "lane") summary = `${node.lanes.length} lane versions`;

  return (
    <div onClick={(event) => { event.stopPropagation(); onSelect(node.id); }} className={`scratch-c-block relative rounded-[18px] border-2 p-2.5 shadow-sm transition ${style.shell} ${selected ? "ring-4 ring-surface/70 ring-offset-2" : "hover:shadow-md"} ${draggingId === node.id ? "opacity-35" : "opacity-100"}`}>
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-white ${style.header}`}>
        <div draggable={!node.locked} onDragStart={(event) => !node.locked && onDragStart(node.id, event)} onDragEnd={onDragEnd} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${node.locked ? "cursor-not-allowed opacity-50" : "cursor-grab hover:bg-white/15 active:cursor-grabbing"}`}><GripVertical className="h-4 w-4" /></div>
        <button type="button" onClick={(event) => { event.stopPropagation(); onToggleCollapse(node.id); }} className="rounded p-0.5 hover:bg-white/15">{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        <span className="rounded-full bg-black/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">{kindLabel}</span>
        {node.kind === "repeat" && (
          <StopDrag>
            <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-1.5 py-0.5 text-[10px] font-bold">
              repeat
              <input
                aria-label="Repeat rounds"
                type="number"
                min={1}
                max={99}
                value={node.rounds}
                onChange={(event) => onPatch(node.id, (current) => current.kind === "repeat" ? { ...current, rounds: Math.max(1, Number(event.target.value) || 1) } : current)}
                className="scratch-input h-6 w-12 py-0 text-center"
              />
              x
            </span>
          </StopDrag>
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-bold">{title}</span>
        {summary && <span className="hidden max-w-[220px] truncate rounded-full bg-black/15 px-2 py-0.5 text-[9px] font-semibold lg:block">{summary}</span>}
        {node.locked && <Lock className="h-4 w-4" />}
        <button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(node.id); }} className="rounded p-1 hover:bg-white/15"><Copy className="h-4 w-4" /></button>
        <button type="button" disabled={node.locked} onClick={(event) => { event.stopPropagation(); onDelete(node.id); }} className="rounded p-1 hover:bg-white/15 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
      </div>

      {!collapsed && (
        <>
          {node.kind === "condition" && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 px-2 text-[10px] font-semibold text-surface">
              <span className="rounded-full bg-white px-2 py-1">IF {node.metric} {node.comparator} {node.threshold}</span>
              <span className="rounded-full bg-canvas-raised px-2 py-1">THEN {node.action}</span>
              <span className="rounded-full bg-white px-2 py-1">ELSE {node.elseAction}</span>
            </div>
          )}
          {node.kind === "lane" && (
            <div className="mt-2 flex flex-wrap gap-1.5 px-2">
              {node.lanes.map((lane) => <span key={lane.id} className="rounded-full border border-pink-200 bg-white px-2 py-1 text-[11px] font-bold text-pink-800">{lane.name}: {lane.targetPace} · {lane.intervalAdjustmentSeconds >= 0 ? "+" : ""}{lane.intervalAdjustmentSeconds}s</span>)}
            </div>
          )}

          <div
            className={`mt-2 min-h-24 rounded-[14px] border-2 border-dashed bg-white/80 p-2 transition ${style.border} ${dragActive ? "ring-2 ring-hairline-on-canvas/70" : ""}`}
            onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; }}
            onDrop={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest('[data-setcraft-dropzone="true"]')) return;
              onDropPayload(node.id, children.length, event);
            }}
          >
            <DropZone parentId={node.id} index={0} active={dragActive} label={dragLabel} onDropPayload={onDropPayload} />
            {children.map((child, index) => (
              <React.Fragment key={child.id}>
                <NodeCard node={child} selectedId={selectedId} draggingId={draggingId} dragActive={dragActive} dragLabel={dragLabel} collapsedIds={collapsedIds} poolUnit={poolUnit} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} onPatch={onPatch} onToggleCollapse={onToggleCollapse} onDragStart={onDragStart} onDragEnd={onDragEnd} onDropPayload={onDropPayload} onQuickAdd={onQuickAdd} />
                <DropZone parentId={node.id} index={index + 1} active={dragActive} label={dragLabel} onDropPayload={onDropPayload} />
              </React.Fragment>
            ))}
            {children.length === 0 && <div className="pointer-events-none flex min-h-12 items-center justify-center text-[11px] font-semibold text-ink-muted-on-canvas">Drop blocks inside this control block</div>}
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 border-t border-canvas-raised pt-2">
              <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "cruise"); }} className="rounded-full border border-hairline-on-canvas bg-white px-2.5 py-1 text-[11px] font-bold text-ink-muted-on-canvas hover:bg-canvas">+ swim</button>
              <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "easy-swim"); }} className="rounded-full border border-hairline-on-canvas bg-white px-2.5 py-1 text-[11px] font-bold text-ink-muted-on-canvas hover:bg-canvas">+ recovery</button>
              <button type="button" onClick={(event) => { event.stopPropagation(); onQuickAdd(node.id, "repeat"); }} className="rounded-full border border-hairline-on-canvas bg-white px-2.5 py-1 text-[11px] font-bold text-ink-muted-on-canvas hover:bg-canvas">+ repeat</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SwimStudio({ currentRole, onSaveWorkoutToCalendar, initialWorkout, initialProject, onInitialWorkoutLoaded, onInitialProjectLoaded, requestedPage, onPageChange }: SwimStudioProps) {
  void currentRole;
  const [sessionName, setSessionName] = useState("100 Free Speed Endurance");
  const [focus, setFocus] = useState("Race pace & speed endurance");
  const [phase, setPhase] = useState("Race preparation");
  const [poolLength, setPoolLength] = useState<PoolLength>(25);
  const [poolUnit, setPoolUnit] = useState<PoolUnit>("m");
  const [targetMinutes, setTargetMinutes] = useState(90);
  const [nodes, setNodes] = useState<StudioNode[]>(starterWorkout());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragLabel, setDragLabel] = useState("block");
  const [dropNotice, setDropNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<StudioNode[][]>([]);
  const [future, setFuture] = useState<StudioNode[][]>([]);
  const [activeCategory, setActiveCategory] = useState("Warm-up");
  const [paletteSearch, setPaletteSearch] = useState("");
  const [rightTab, setRightTab] = useState<RightTab>("inspector");
  const [internalStudioPage, setInternalStudioPage] = useState<StudioPage>(requestedPage || "project");
  const [paletteVisible, setPaletteVisible] = useState(true);
  const [inspectorVisible, setInspectorVisible] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<"saved" | "saving">("saved");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [savedTemplates, setSavedTemplates] = useState<SavedStudioTemplate[]>([]);
  const [projectFolder, setProjectFolder] = useState("Inbox");
  const [projectTags, setProjectTags] = useState("");
  const [projectFolders, setProjectFolders] = useState<string[]>(DEFAULT_PROJECT_FOLDERS);
  const [newFolderName, setNewFolderName] = useState("");
  const [backpackBlocks, setBackpackBlocks] = useState<CustomBlock[]>([]);
  const [favoritePresetIds, setFavoritePresetIds] = useState<string[]>([]);
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);
  const [pdfNotice, setPdfNotice] = useState(false);
  const [quickWriteOpen, setQuickWriteOpen] = useState(false);
  const [quickWriteText, setQuickWriteText] = useState("# Main set\n8x50 Free @ 1:00 RPE 7 - descend 1-4\n4x25 choice @ :40 - easy technique");
  const [makeBlockOpen, setMakeBlockOpen] = useState(false);
  const [makeBlockDraft, setMakeBlockDraft] = useState<MakeBlockDraft>(DEFAULT_MAKE_BLOCK);
  const [laneAssignments, setLaneAssignments] = useState<LaneAssignmentConfig>(DEFAULT_LANE_ASSIGNMENTS);
  const [deckSheetMeta, setDeckSheetMeta] = useState<DeckSheetMeta>(DEFAULT_DECK_SHEET_META);
  const [quickSetDraft, setQuickSetDraft] = useState<QuickSetDraft>(DEFAULT_QUICK_SET);
  const [aiAudit, setAiAudit] = useState<{ isSafe: boolean; warnings: string[]; recommendations: string[] } | null>(null);
  const [aiAuditLoading, setAiAuditLoading] = useState(false);
  const [aiAuditError, setAiAuditError] = useState("");
  const paletteSearchRef = useRef<HTMLInputElement | null>(null);

  // Use one navigation path for clicks from either workflow bar. Previously, a
  // child effect could restore the old requestedPage before the parent received
  // the new page, which made the top tabs appear to flash or ignore a click.
  const studioPage = requestedPage ?? internalStudioPage;
  const setStudioPage = useCallback((page: StudioPage) => {
    setInternalStudioPage(page);
    if (page !== requestedPage) onPageChange?.(page);
  }, [onPageChange, requestedPage]);

  useEffect(() => {
    const savedLibrary = localStorage.getItem("setcraft_builder_library_visible");
    const savedInspector = localStorage.getItem("setcraft_builder_inspector_visible");
    if (savedLibrary !== null) setPaletteVisible(savedLibrary !== "false");
    if (savedInspector !== null) setInspectorVisible(savedInspector !== "false");
    if (savedLibrary === null && savedInspector === null && window.matchMedia("(max-width: 1180px)").matches) {
      setPaletteVisible(false);
      setInspectorVisible(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("setcraft_builder_library_visible", String(paletteVisible));
    localStorage.setItem("setcraft_builder_inspector_visible", String(inspectorVisible));
  }, [paletteVisible, inspectorVisible]);


  useEffect(() => {
    try {
      const templates = localStorage.getItem("setcraft_studio_projects") || localStorage.getItem("setcraft_studio_templates");
      const myBlocks = localStorage.getItem("setcraft_my_blocks");
      const folders = localStorage.getItem("setcraft_project_folders");
      const backpack = localStorage.getItem("setcraft_backpack");
      const favorites = localStorage.getItem("setcraft_favorite_presets");
      if (templates) {
        const parsed = JSON.parse(templates) as Partial<StudioProject>[];
        setSavedTemplates(parsed.map((item) => ({
          ...item,
          id: item.id || `project-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          folder: item.folder || "Inbox",
          tags: item.tags || [],
          laneAssignments: migrateLaneAssignments(item.laneAssignments),
          deckSheetMeta: migrateDeckMeta(item.deckSheetMeta),
          createdAt: item.createdAt || (item as Partial<StudioProject> & { savedAt?: string }).savedAt || new Date().toISOString(),
          updatedAt: item.updatedAt || (item as Partial<StudioProject> & { savedAt?: string }).savedAt || new Date().toISOString(),
        })) as StudioProject[]);
      }
      if (myBlocks) setCustomBlocks(JSON.parse(myBlocks));
      if (folders) setProjectFolders(JSON.parse(folders));
      if (backpack) setBackpackBlocks(JSON.parse(backpack));
      if (favorites) setFavoritePresetIds(JSON.parse(favorites));
    } catch (error) {
      console.error("Could not load SetCraft Studio data", error);
    }
  }, []);

  useEffect(() => {
    if (!initialWorkout) return;
    setSessionName(initialWorkout.title);
    setFocus(initialWorkout.focus);
    setPhase(initialWorkout.phase);
    setPoolLength(initialWorkout.poolLength);
    setPoolUnit(initialWorkout.poolUnit);
    setTargetMinutes(initialWorkout.durationMinutes);
    setDeckSheetMeta((current) => ({
      ...current,
      weekFocus: initialWorkout.phase,
      todayFocus: initialWorkout.focus,
      footerNote: `${initialWorkout.attribution} - ${initialWorkout.sourceName}`,
    }));
    setNodes(initialWorkout.nodes.map(cloneNode));
    setHistory([]);
    setFuture([]);
    setSelectedId(null);
    onInitialWorkoutLoaded?.();
  }, [initialWorkout, onInitialWorkoutLoaded]);

  useEffect(() => {
    if (!initialProject) return;
    setSessionName(initialProject.name);
    setFocus(initialProject.focus);
    setPhase(initialProject.phase);
    setProjectFolder(initialProject.folder || "Inbox");
    setProjectTags((initialProject.tags || []).join(", "));
    setPoolLength(initialProject.poolLength);
    setPoolUnit(initialProject.poolUnit);
    setTargetMinutes(initialProject.targetMinutes);
    setLaneAssignments(migrateLaneAssignments(initialProject.laneAssignments));
    setDeckSheetMeta(migrateDeckMeta(initialProject.deckSheetMeta));
    setNodes(initialProject.nodes.map(cloneNode));
    setHistory([]);
    setFuture([]);
    setSelectedId(null);
    onInitialProjectLoaded?.();
  }, [initialProject, onInitialProjectLoaded]);

  useEffect(() => {
    setAutoSaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem("setcraft_autosave_draft", JSON.stringify({
          name: sessionName,
          focus,
          phase,
          poolLength,
          poolUnit,
          targetMinutes,
          folder: projectFolder,
          tags: projectTags.split(",").map((item) => item.trim()).filter(Boolean),
          nodes,
          laneAssignments,
          deckSheetMeta,
          updatedAt: new Date().toISOString(),
        }));
        setAutoSaveState("saved");
      } catch (error) {
        console.error("Could not auto-save draft", error);
        setAutoSaveState("saved");
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [deckSheetMeta, focus, laneAssignments, nodes, phase, poolLength, poolUnit, projectFolder, projectTags, sessionName, targetMinutes]);

  const selectedNode = selectedId ? findNode(nodes, selectedId) : null;
  const stats = useMemo(() => calculateStats(nodes), [nodes]);
  const validation = useMemo(() => validateWorkout(nodes, targetMinutes, poolLength), [nodes, targetMinutes, poolLength]);
  const previewText = useMemo(() => formatWorkoutText(nodes, poolUnit), [nodes, poolUnit]);
  const warningCount = validation.filter((issue) => issue.severity === "warning").length;
  const laneWorkoutOptions = useMemo(() => workoutNodeOptions(nodes), [nodes]);

  useEffect(() => {
    setAiAudit(null);
    setAiAuditError("");
  }, [nodes]);
  const containerIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (items: StudioNode[]) => items.forEach((item) => {
      if (item.kind !== "set" && item.kind !== "note") {
        ids.push(item.id);
        walk(item.children);
      }
    });
    walk(nodes);
    return ids;
  }, [nodes]);

  const commitNodes = (next: StudioNode[] | ((current: StudioNode[]) => StudioNode[])) => {
    setNodes((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      if (resolved === current) return current;
      setHistory((items) => [...items.slice(-49), current]);
      setFuture([]);
      return resolved;
    });
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [nodes, ...items].slice(0, 50));
    setNodes(previous);
    if (selectedId && !findNode(previous, selectedId)) setSelectedId(null);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((items) => items.slice(1));
    setHistory((items) => [...items, nodes].slice(-50));
    setNodes(next);
    if (selectedId && !findNode(next, selectedId)) setSelectedId(null);
  };

  const addFromPalette = (paletteId: string, parentId: string | null = null, index?: number) => {
    let newNode: StudioNode;
    if (paletteId.startsWith("custom:")) {
      const custom = [...customBlocks, ...backpackBlocks].find((item) => item.id === paletteId.replace("custom:", ""));
      if (!custom) return;
      newNode = cloneNode(custom.node);
    } else {
      newNode = createPaletteNode(paletteId);
    }
    commitNodes((current) => {
      const parent = parentId ? findNode(current, parentId) : null;
      const destinationLength = parent && parent.kind !== "set" && parent.kind !== "note" ? parent.children.length : current.length;
      return insertNode(current, parentId, index ?? destinationLength, newNode);
    });
    setSelectedId(newNode.id);
    setRightTab("inspector");
  };

  const showDropMessage = (message: string) => {
    setDropNotice(message);
    window.setTimeout(() => setDropNotice(null), 2200);
  };

  const handlePaletteDragStart = (payload: DragPayload, event: React.DragEvent<HTMLButtonElement>) => {
    const raw = JSON.stringify(payload);
    event.dataTransfer.setData("application/setcraft-block", raw);
    event.dataTransfer.setData("text/plain", raw);
    event.dataTransfer.effectAllowed = "copyMove";
    const preset = payload.paletteId ? PALETTE_PRESETS.find((item) => item.id === payload.paletteId) : null;
    const custom = payload.customId ? [...customBlocks, ...backpackBlocks].find((item) => item.id === payload.customId) : null;
    setDragLabel(preset?.label || custom?.name || "block");
    setDragActive(true);
  };

  const handleNodeDragStart = (nodeId: string, event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const payload: DragPayload = { source: "canvas", nodeId };
    const raw = JSON.stringify(payload);
    event.dataTransfer.setData("application/setcraft-block", raw);
    event.dataTransfer.setData("text/plain", raw);
    event.dataTransfer.effectAllowed = "copyMove";
    const moving = findNode(nodes, nodeId);
    setDragLabel(moving ? nodeLabel(moving) : "block");
    setDraggingId(nodeId);
    setDragActive(true);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragActive(false);
    setDragLabel("block");
  };

  const handleDropPayload = (parentId: string | null, index: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const raw = event.dataTransfer.getData("application/setcraft-block") || event.dataTransfer.getData("text/plain");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as DragPayload;
      const parent = parentId ? findNode(nodes, parentId) : null;
      if (parentId && (!parent || parent.kind === "set" || parent.kind === "note")) {
        showDropMessage("That block cannot contain other blocks. Drop beside it or inside a section/repeat.");
        return;
      }
      if (parent?.locked) {
        showDropMessage("Unlock the destination block before adding sets inside it.");
        return;
      }
      if (payload.source === "palette" && payload.paletteId) {
        addFromPalette(payload.paletteId, parentId, index);
        showDropMessage(`Snapped ${dragLabel} into place.`);
        return;
      }
      if (payload.source === "custom" && payload.customId) {
        addFromPalette(`custom:${payload.customId}`, parentId, index);
        showDropMessage(`Snapped ${dragLabel} into place.`);
        return;
      }
      if (payload.source !== "canvas" || !payload.nodeId) return;
      const dragged = findNode(nodes, payload.nodeId);
      if (!dragged || dragged.locked) {
        showDropMessage("Unlock this block before moving it.");
        return;
      }
      if (parentId && containsNode(dragged, parentId)) {
        showDropMessage("A block cannot be placed inside itself.");
        return;
      }
      const source = findParentInfo(nodes, payload.nodeId);
      let destinationIndex = index;
      if (source && source.parentId === parentId && source.index < index) destinationIndex -= 1;
      const removal = removeNode(nodes, payload.nodeId);
      if (!removal.removed) return;
      commitNodes(insertNode(removal.nodes, parentId, destinationIndex, removal.removed));
      setSelectedId(payload.nodeId);
      showDropMessage(`Snapped ${nodeLabel(removal.removed)} into place.`);
    } catch (error) {
      console.error("Invalid SetCraft drag payload", error);
      showDropMessage("The block could not be placed. Try dragging from its handle again.");
    } finally {
      setDraggingId(null);
      setDragLabel("block");
    }
  };

  const deleteNode = (id: string) => {
    const node = findNode(nodes, id);
    if (!node || node.locked) return;
    commitNodes((current) => removeNode(current, id).nodes);
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateNode = (id: string) => {
    const source = findNode(nodes, id);
    const location = findParentInfo(nodes, id);
    if (!source || !location) return;
    const copy = cloneNode(source);
    commitNodes((current) => insertNode(current, location.parentId, location.index + 1, copy));
    setSelectedId(copy.id);
  };

  const patchNode = (id: string, patcher: (node: StudioNode) => StudioNode) => commitNodes((current) => updateNode(current, id, patcher));
  const patchSelected = (patcher: (node: StudioNode) => StudioNode) => selectedId && patchNode(selectedId, patcher);

  const toggleCollapse = (id: string) => setCollapsedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const startNewProject = () => {
    setSessionName("Untitled swim practice");
    setFocus("");
    setPhase("General preparation");
    setProjectFolder("Inbox");
    setProjectTags("");
    setPoolLength(25);
    setPoolUnit("m");
    setTargetMinutes(90);
    setNodes([]);
    setLaneAssignments(migrateLaneAssignments(DEFAULT_LANE_ASSIGNMENTS));
    setDeckSheetMeta({ ...DEFAULT_DECK_SHEET_META, date: new Date().toISOString().slice(0, 10) });
    setHistory([]);
    setFuture([]);
    setSelectedId(null);
    setTemplateOpen(false);
    setStudioPage("project");
    showDropMessage("New project started. Complete the setup, then build the sets.");
  };

  const saveTemplate = () => {
    const now = new Date().toISOString();
    const name = sessionName.trim() || "Untitled workout";
    const existing = savedTemplates.find((item) => item.name.toLowerCase() === name.toLowerCase() && item.folder === projectFolder);
    const template: SavedStudioTemplate = {
      id: existing?.id || `project-${Date.now()}`,
      name,
      focus,
      phase,
      folder: projectFolder || "Inbox",
      tags: projectTags.split(",").map((item) => item.trim()).filter(Boolean),
      poolLength,
      poolUnit,
      targetMinutes,
      nodes,
      laneAssignments: migrateLaneAssignments(laneAssignments),
      deckSheetMeta: migrateDeckMeta(deckSheetMeta),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const updated = [template, ...savedTemplates.filter((item) => item.id !== template.id)].slice(0, 200);
    setSavedTemplates(updated);
    localStorage.setItem("setcraft_studio_projects", JSON.stringify(updated));
    localStorage.setItem("setcraft_studio_templates", JSON.stringify(updated));
    const legacy: WorkoutSession = { id: template.id, name: template.name, focus, phase, blocks: flattenToLegacyBlocks(nodes), totalDistance: stats.totalDistance, estimatedDuration: stats.estimatedDuration, avgIntensity: stats.averageIntensity };
    const old = JSON.parse(localStorage.getItem("swimblock_templates") || "[]") as WorkoutSession[];
    localStorage.setItem("swimblock_templates", JSON.stringify([legacy, ...old.filter((item) => item.id !== legacy.id)].slice(0, 200)));
    setSaveNotice(true);
    window.setTimeout(() => setSaveNotice(false), 2000);
  };

  const loadTemplate = (template: SavedStudioTemplate) => {
    setSessionName(template.name);
    setFocus(template.focus);
    setPhase(template.phase);
    setProjectFolder(template.folder || "Inbox");
    setProjectTags((template.tags || []).join(", "));
    setPoolLength(template.poolLength);
    setPoolUnit(template.poolUnit);
    setTargetMinutes(template.targetMinutes);
    setLaneAssignments(migrateLaneAssignments(template.laneAssignments));
    setDeckSheetMeta(migrateDeckMeta(template.deckSheetMeta));
    commitNodes(template.nodes);
    setSelectedId(null);
    setTemplateOpen(false);
  };

  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter((item) => item.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem("setcraft_studio_projects", JSON.stringify(updated));
    localStorage.setItem("setcraft_studio_templates", JSON.stringify(updated));
  };

  const saveSelectedAsCustom = () => {
    if (!selectedNode) return;
    const name = nodeLabel(selectedNode) || "My block";
    const custom: CustomBlock = { id: `custom-${Date.now()}`, name, description: "Saved from the canvas", node: cloneNode(selectedNode), savedAt: new Date().toISOString() };
    const updated = [custom, ...customBlocks].slice(0, 40);
    setCustomBlocks(updated);
    localStorage.setItem("setcraft_my_blocks", JSON.stringify(updated));
    setActiveCategory("My Blocks");
  };

  const deleteCustom = (id: string) => {
    const updated = customBlocks.filter((item) => item.id !== id);
    setCustomBlocks(updated);
    localStorage.setItem("setcraft_my_blocks", JSON.stringify(updated));
  };

  const addProjectFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const updated = [...new Set([...projectFolders, name])];
    setProjectFolders(updated);
    setProjectFolder(name);
    setNewFolderName("");
    localStorage.setItem("setcraft_project_folders", JSON.stringify(updated));
  };

  const saveSelectedToBackpack = () => {
    if (!selectedNode) return;
    const item: CustomBlock = { id: `backpack-${Date.now()}`, name: nodeLabel(selectedNode), description: "Portable block copied from a workout", node: cloneNode(selectedNode), savedAt: new Date().toISOString() };
    const updated = [item, ...backpackBlocks].slice(0, 50);
    setBackpackBlocks(updated);
    localStorage.setItem("setcraft_backpack", JSON.stringify(updated));
    showDropMessage("Copied to Backpack. You can reuse it in any project.");
  };

  const deleteBackpackItem = (id: string) => {
    const updated = backpackBlocks.filter((item) => item.id !== id);
    setBackpackBlocks(updated);
    localStorage.setItem("setcraft_backpack", JSON.stringify(updated));
  };

  const toggleFavoritePreset = (id: string) => {
    const updated = favoritePresetIds.includes(id) ? favoritePresetIds.filter((item) => item !== id) : [...favoritePresetIds, id];
    setFavoritePresetIds(updated);
    localStorage.setItem("setcraft_favorite_presets", JSON.stringify(updated));
  };

  const runAiAudit = async () => {
    setAiAuditLoading(true);
    setAiAuditError("");
    try {
      const response = await fetch("/api/gemini/audit-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sets: nodes }),
      });
      if (!response.ok) throw new Error(`Audit request failed (${response.status})`);
      const result = await response.json();
      setAiAudit({
        isSafe: Boolean(result?.isSafe),
        warnings: Array.isArray(result?.warnings) ? result.warnings.map(String) : [],
        recommendations: Array.isArray(result?.recommendations) ? result.recommendations.map(String) : [],
      });
    } catch (error) {
      setAiAuditError(error instanceof Error ? error.message : "Could not run the AI review.");
    } finally {
      setAiAuditLoading(false);
    }
  };

  const exportJson = () => {
    const payload = { version: 5, session: { name: sessionName, focus, phase, poolLength, poolUnit, targetMinutes }, laneAssignments, deckSheetMeta, stats, nodes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(sessionName || "setcraft-workout").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const { exportWorkoutPdf } = await import("../pdfExport");
    await exportWorkoutPdf({ name: sessionName, focus, phase, poolLength, poolUnit, targetMinutes, stats, nodes, laneAssignments, deckSheetMeta });
    setPdfNotice(true);
    window.setTimeout(() => setPdfNotice(false), 2200);
  };

  const addQuickWrittenSets = () => {
    const parsed = parseQuickWrite(quickWriteText);
    if (!parsed.length) {
      showDropMessage("Write at least one set before adding it.");
      return;
    }
    const destination = selectedNode && selectedNode.kind !== "set" && selectedNode.kind !== "note" && !selectedNode.locked ? selectedNode.id : null;
    commitNodes((current) => {
      const parent = destination ? findNode(current, destination) : null;
      const startIndex = parent && parent.kind !== "set" && parent.kind !== "note" ? parent.children.length : current.length;
      return parsed.reduce((working, node, offset) => insertNode(working, destination, startIndex + offset, node), current);
    });
    setQuickWriteOpen(false);
    setSelectedId(parsed[0]?.id || null);
    showDropMessage(`Added ${parsed.length} quick-written block${parsed.length === 1 ? "" : "s"}.`);
  };

  const addQuickSet = () => {
    const newNode = createSetNode(quickSetDraft.blockType, {
      label: quickSetDraft.notes.trim() || `${quickSetDraft.stroke} ${quickSetDraft.blockType}`,
      reps: Math.max(1, quickSetDraft.reps),
      distance: Math.max(0, quickSetDraft.distance),
      stroke: quickSetDraft.stroke,
      interval: quickSetDraft.interval,
      notes: quickSetDraft.notes,
    });
    const destination = selectedNode && selectedNode.kind !== "set" && selectedNode.kind !== "note" && !selectedNode.locked ? selectedNode.id : null;
    commitNodes((current) => {
      const parent = destination ? findNode(current, destination) : null;
      const index = parent && parent.kind !== "set" && parent.kind !== "note" ? parent.children.length : current.length;
      return insertNode(current, destination, index, newNode);
    });
    setSelectedId(newNode.id);
    setRightTab("inspector");
    showDropMessage(destination ? "Quick set added inside the selected block." : "Quick set added to the workout.");
  };

  const createCustomBlock = () => {
    const name = makeBlockDraft.name.trim();
    if (!name) {
      showDropMessage("Give your custom block a name first.");
      return;
    }
    let node: StudioNode;
    if (makeBlockDraft.kind === "set") {
      node = createSetNode(makeBlockDraft.blockType, {
        label: name,
        variant: "Custom",
        reps: Math.max(1, makeBlockDraft.reps),
        distance: Math.max(0, makeBlockDraft.distance),
        stroke: makeBlockDraft.stroke,
        interval: makeBlockDraft.interval,
        intensity: Math.max(1, Math.min(10, makeBlockDraft.intensity)),
        notes: makeBlockDraft.notes,
      });
    } else if (makeBlockDraft.kind === "section") {
      const section = createPaletteNode("section") as StudioSectionNode;
      node = { ...section, title: name, purpose: makeBlockDraft.sectionPurpose || makeBlockDraft.description, pointsOfPerformance: "", children: [] };
    } else if (makeBlockDraft.kind === "repeat") {
      const repeat = createPaletteNode("repeat") as StudioRepeatNode;
      node = { ...repeat, label: name, rounds: Math.max(1, makeBlockDraft.rounds), children: [] };
    } else {
      const note = createPaletteNode("coach-note") as StudioNoteNode;
      node = { ...note, label: name, text: makeBlockDraft.notes || makeBlockDraft.description || "Custom coach instruction" };
    }
    const custom: CustomBlock = {
      id: `custom-${Date.now()}`,
      name,
      description: makeBlockDraft.description || `Custom ${makeBlockDraft.kind}`,
      node,
      savedAt: new Date().toISOString(),
    };
    const updated = [custom, ...customBlocks.filter((item) => item.name.toLowerCase() !== name.toLowerCase())].slice(0, 60);
    setCustomBlocks(updated);
    localStorage.setItem("setcraft_my_blocks", JSON.stringify(updated));
    setMakeBlockDraft(DEFAULT_MAKE_BLOCK);
    setMakeBlockOpen(false);
    setActiveCategory("My Blocks");
    showDropMessage(`Created “${name}” in My Blocks.`);
  };

  const pushToCalendar = () => onSaveWorkoutToCalendar?.({ id: `workout-${Date.now()}`, name: sessionName, focus, phase, blocks: flattenToLegacyBlocks(nodes), totalDistance: stats.totalDistance, estimatedDuration: stats.estimatedDuration, avgIntensity: stats.averageIntensity });

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && selectedId) { event.preventDefault(); duplicateNode(selectedId); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveTemplate(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setStudioPage("build");
        setPaletteVisible(true);
        window.setTimeout(() => paletteSearchRef.current?.focus(), 50);
      }
      if (event.key === "?" && !event.ctrlKey && !event.metaKey) { event.preventDefault(); setShortcutsOpen(true); }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) { event.preventDefault(); deleteNode(selectedId); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const categories = ["Favorites", ...new Set(PALETTE_PRESETS.map((item) => item.category)), "My Blocks", "Backpack"];
  const searchQuery = paletteSearch.trim().toLowerCase();
  const paletteItems = PALETTE_PRESETS.filter((item) => {
    if (searchQuery) return `${item.label} ${item.description} ${item.category}`.toLowerCase().includes(searchQuery);
    if (activeCategory === "Favorites") return favoritePresetIds.includes(item.id);
    return item.category === activeCategory;
  });
  const customItems = customBlocks.filter((item) => !searchQuery || item.name.toLowerCase().includes(searchQuery));
  const backpackItems = backpackBlocks.filter((item) => !searchQuery || item.name.toLowerCase().includes(searchQuery));

  return (
    <div className="w-full" id="setcraft-swim-studio">
      <section className="overflow-hidden bg-canvas-raised">
        <div className="sc-nav studio-command-bar flex-wrap !h-auto py-2">
          <span className="sc-nav-brand">Swim Studio</span>
          <span className="text-[10px] font-medium text-ink-muted">Scratch-style set programming</span>
          <div className="h-6 w-px bg-hairline" />
          <button type="button" onClick={() => setTemplateOpen((open) => !open)} className="sc-btn" data-variant="ghost-on-dark" data-size="sm"><ArrowDownToLine className="h-4 w-4" /> File <ChevronDown className="h-3 w-3" /></button>
          <button type="button" onClick={undo} disabled={history.length === 0} className="sc-btn-icon" style={{ background: "transparent", borderColor: "transparent", color: "var(--color-ink)" }} title="Undo"><Undo2 className="h-4 w-4" /></button>
          <button type="button" onClick={redo} disabled={future.length === 0} className="sc-btn-icon" style={{ background: "transparent", borderColor: "transparent", color: "var(--color-ink)" }} title="Redo"><Redo2 className="h-4 w-4" /></button>
          <div className="sc-nav-spacer" />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setStudioPage("build"); setQuickWriteOpen(true); }} className="sc-btn" data-variant="ghost-on-dark" data-size="sm"><PenLine className="h-4 w-4" /> Quick write</button>
            <button type="button" onClick={() => { setRightTab("analysis"); setStudioPage("review"); }} className="sc-btn" data-variant="ghost-on-dark" data-size="sm"><ShieldCheck className="h-4 w-4" /> Validate</button>
            <button type="button" onClick={saveTemplate} className="sc-btn" data-variant="primary" data-size="sm"><Save className="h-4 w-4" /> {saveNotice ? "Saved" : "Save project"}</button>
            <button type="button" onClick={exportPdf} className="sc-btn" data-variant="secondary" data-size="sm"><FileDown className="h-4 w-4" /> {pdfNotice ? "PDF ready" : "Export PDF"}</button>
            <span className="sc-tag hidden 2xl:inline-flex" data-tone="neutral" style={{ background: "var(--color-surface-hover)", color: "var(--color-ink-muted)" }}>{autoSaveState === "saving" ? "Saving…" : "Auto-saved"}</span>
            <button type="button" onClick={() => setShortcutsOpen(true)} className="sc-btn-icon" style={{ background: "transparent", borderColor: "transparent", color: "var(--color-ink-muted)" }} title="Keyboard shortcuts"><Keyboard className="h-4 w-4" /></button>
            <button type="button" onClick={exportJson} className="sc-btn-icon" style={{ background: "transparent", borderColor: "transparent", color: "var(--color-ink-muted)" }} title="Export structured JSON"><FileJson className="h-4 w-4" /></button>
            <div className="rounded-[var(--radius)] bg-surface-raised px-[var(--space-3)] py-[var(--space-2)] text-body-sm font-bold text-ink-muted">{currentRole} perspective</div>
          </div>
        </div>

        {templateOpen && (
          <div className="absolute z-50 ml-4 mt-2 w-80 overflow-hidden rounded-2xl border border-hairline-on-canvas bg-white shadow-md">
            <div className="flex items-center justify-between border-b border-canvas-raised px-4 py-3">
              <div><p className="text-xs font-bold text-surface">Workout projects</p><p className="text-[10px] text-ink-muted-on-canvas">Saved by season folder on this device</p></div>
              <button type="button" onClick={() => setTemplateOpen(false)} className="rounded p-1 text-ink-muted-on-canvas hover:bg-canvas-raised"><X className="h-4 w-4" /></button>
            </div>
            <div className="border-b border-canvas-raised p-2"><button type="button" onClick={startNewProject} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-xs font-bold text-white hover:bg-accent-active"><Plus className="h-4 w-4" /> New blank project</button></div><div className="max-h-80 overflow-y-auto p-2">
              {savedTemplates.length === 0 ? <p className="px-3 py-8 text-center text-xs text-ink-muted-on-canvas">No saved workouts yet.</p> : savedTemplates.map((template) => (
                <div key={template.id} className="group flex items-center gap-2 rounded-xl p-2 hover:bg-canvas">
                  <button type="button" onClick={() => loadTemplate(template)} className="min-w-0 flex-1 text-left"><p className="truncate text-xs font-bold text-surface-raised">{template.name}</p><p className="mt-1 text-[10px] text-ink-muted-on-canvas">{template.folder || "Inbox"} · {template.poolLength}{template.poolUnit} · {template.targetMinutes} min</p></button>
                  <button type="button" onClick={() => deleteTemplate(template.id)} className="rounded p-1.5 text-disabled opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <nav className="sc-nav studio-workflow !h-auto py-1.5" aria-label="Swim Studio workflow" role="tablist">
          <div className="studio-workflow-track">
            {([
              { id: "project", label: "Project Setup", helper: `${projectFolder} · ${phase}`, icon: FolderPlus },
              { id: "build", label: "Build Sets", helper: `${stats.setCount} sets · ${stats.totalDistance.toLocaleString()} ${poolUnit}`, icon: LayoutTemplate },
              { id: "lanes", label: "Lane Plan", helper: `${laneAssignments.lanes.length} lanes configured`, icon: Users },
              { id: "deck", label: "Deck Sheet", helper: "Header, notes and goals", icon: FileDown },
              { id: "review", label: "Review & Export", helper: warningCount ? `${warningCount} items to check` : "Ready to export", icon: ListChecks },
            ] as Array<{ id: StudioPage; label: string; helper: string; icon: React.ElementType }>).map((item) => {
              const Icon = item.icon;
              const active = studioPage === item.id;
              return (
                <button
                  key={item.id}
                  id={`studio-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`studio-page-${item.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setStudioPage(item.id)}
                  onKeyDown={(event) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') || []);
                    if (!tabs.length) return;
                    event.preventDefault();
                    const currentIndex = tabs.indexOf(event.currentTarget);
                    const nextIndex = event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
                    const nextPage = tabs[nextIndex].dataset.page as StudioPage;
                    tabs[nextIndex].focus();
                    setStudioPage(nextPage);
                  }}
                  data-page={item.id}
                  title={item.helper}
                  className="sc-nav-item studio-workflow-tab flex items-center gap-2"
                  data-active={active ? "true" : "false"}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: active ? "var(--color-accent)" : "var(--color-ink-muted)" }} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {active && <span className="hidden max-w-[220px] truncate text-[11px] font-semibold xl:inline" style={{ color: "var(--color-accent)", opacity: 0.85 }}>· {item.helper}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {studioPage === "project" && (
          <div id="studio-page-project" role="tabpanel" aria-labelledby="studio-tab-project" tabIndex={0} className="studio-stage-page min-h-[960px] bg-gradient-to-b from-slate-50 via-white to-canvas/40 px-6 py-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-[1500px] space-y-7">
              <header className="flex flex-wrap items-end justify-between gap-5 rounded-[28px] border border-hairline-on-canvas bg-white p-7 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 text-accent-active"><FolderPlus className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Project setup</span></div>
                  <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-surface">Create the workout project before building the sets.</h2>
                  <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink-muted-on-canvas">Give the practice a clear identity, connect it to a season folder, and define the training context. Everything here travels with the saved project and appears in your Project Hub.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={startNewProject} className="premium-button flex items-center gap-2 rounded-xl border border-disabled bg-white px-4 py-3 text-sm font-bold text-ink-on-canvas hover:border-disabled hover:bg-canvas"><Plus className="h-4 w-4" /> New project</button>
                  <button type="button" onClick={saveTemplate} className="premium-button flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-lg shadow-hairline-on-canvas hover:bg-accent-active"><Save className="h-4 w-4" /> Save project</button>
                </div>
              </header>

              <div className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
                <section className="rounded-[28px] border border-hairline-on-canvas bg-white p-7 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-canvas-raised pb-5"><div><h3 className="font-display text-xl font-bold text-surface">Project identity</h3><p className="mt-1 text-sm text-ink-muted-on-canvas">The information coaches use to find and understand this practice later.</p></div><span className="rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-accent-active">Auto-saved</span></div>
                  <div className="mt-6 space-y-5">
                    <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-ink-muted-on-canvas">Workout project name</span><input value={sessionName} onChange={(event) => setSessionName(event.target.value)} className="w-full rounded-2xl border border-disabled bg-white px-4 py-4 font-display text-xl font-bold text-surface outline-none focus:border-accent-hover focus:ring-4 focus:ring-canvas-raised" placeholder="e.g. Friday speed endurance" /></label>
                    <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-ink-muted-on-canvas">Training focus</span><textarea value={focus} onChange={(event) => setFocus(event.target.value)} className="studio-meta-input min-h-[110px] resize-y" placeholder="Describe the purpose, event focus and desired adaptation." /></label>
                    <div className="grid gap-5 md:grid-cols-2"><CompactField label="Season phase"><select value={phase} onChange={(event) => setPhase(event.target.value)} className="studio-meta-input"><option>General preparation</option><option>Aerobic base</option><option>Endurance</option><option>Threshold</option><option>Power</option><option>Race preparation</option><option>Speed phase</option><option>Taper</option><option>Competition week</option><option>Recovery</option><option>Testing</option></select></CompactField><CompactField label="Project tags"><input value={projectTags} onChange={(event) => setProjectTags(event.target.value)} className="studio-meta-input" placeholder="freestyle, senior, race pace" /></CompactField></div>
                  </div>
                </section>

                <aside className="space-y-7">
                  <section className="rounded-[28px] border border-hairline-on-canvas bg-white p-6 shadow-sm"><h3 className="font-display text-lg font-bold text-surface">Training context</h3><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><CompactField label="Pool length"><div className="grid grid-cols-2 gap-2"><select value={poolLength} onChange={(event) => setPoolLength(Number(event.target.value) as PoolLength)} className="studio-meta-input"><option value={25}>25</option><option value={50}>50</option></select><select value={poolUnit} onChange={(event) => setPoolUnit(event.target.value as PoolUnit)} className="studio-meta-input"><option value="m">Metres</option><option value="yd">Yards</option></select></div></CompactField><CompactField label="Booking time"><div className="relative"><input type="number" min={10} max={240} value={targetMinutes} onChange={(event) => setTargetMinutes(Math.max(10, Number(event.target.value) || 10))} className="studio-meta-input pr-14" /><span className="pointer-events-none absolute right-4 top-3.5 text-xs font-bold text-ink-muted-on-canvas">min</span></div></CompactField></div></section>

                  <section className="rounded-[28px] border border-hairline-on-canvas bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-bold text-surface">Season folder</h3><p className="mt-1 text-sm text-ink-muted-on-canvas">Keep practices grouped by phase, squad or meet cycle.</p></div><FolderPlus className="h-5 w-5 text-ink-muted-on-canvas" /></div><select value={projectFolder} onChange={(event) => setProjectFolder(event.target.value)} className="studio-meta-input mt-5">{projectFolders.map((folder) => <option key={folder}>{folder}</option>)}</select><div className="mt-3 flex gap-2"><input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addProjectFolder(); }} placeholder="Create another folder" className="studio-meta-input" /><button type="button" onClick={addProjectFolder} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-surface px-4 py-3 text-sm font-bold text-white hover:bg-accent-active"><Plus className="h-4 w-4" /> Add</button></div><div className="mt-4 flex flex-wrap gap-2">{projectFolders.slice(0, 8).map((folder) => <button key={folder} type="button" onClick={() => setProjectFolder(folder)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${projectFolder === folder ? "border-disabled bg-canvas text-accent-active" : "border-hairline-on-canvas bg-canvas text-ink-muted-on-canvas hover:border-disabled hover:bg-canvas"}`}>{folder}</button>)}</div></section>
                </aside>
              </div>

              <section className="grid gap-4 rounded-[28px] border border-hairline bg-surface p-6 text-white shadow-sm md:grid-cols-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Current distance</p><p className="mt-2 text-2xl font-bold">{stats.totalDistance.toLocaleString()} {poolUnit}</p></div><div><p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Estimated duration</p><p className="mt-2 text-2xl font-bold">{stats.estimatedDuration} min</p></div><div><p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Lane groups</p><p className="mt-2 text-2xl font-bold">{laneAssignments.lanes.length}</p></div><button type="button" onClick={() => setStudioPage("build")} className="premium-button flex items-center justify-center gap-2 rounded-2xl bg-accent-hover px-5 py-4 text-base font-bold text-surface hover:bg-disabled">Continue to Build Sets <ChevronRight className="h-5 w-5" /></button></section>
            </div>
          </div>
        )}

        {studioPage === "build" && (
          <div id="studio-page-build" role="tabpanel" aria-labelledby="studio-tab-build" tabIndex={0}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-hairline-on-canvas bg-gradient-to-r from-slate-50 to-canvas/40 px-6 pt-4 pb-3.5"><div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5"><span className="text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-ink-muted-on-canvas">Building</span><h2 className="font-display text-base font-bold leading-none text-surface">{sessionName}</h2><span className="text-xs font-medium leading-none text-ink-muted-on-canvas">{phase} · {projectFolder} · {targetMinutes} min</span></div><button type="button" onClick={() => setStudioPage("project")} className="shrink-0 rounded-lg border border-disabled bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink-on-canvas transition hover:border-disabled hover:bg-canvas">Edit project setup</button></div>

        <QuickSetComposer draft={quickSetDraft} onChange={setQuickSetDraft} onAdd={addQuickSet} destination={selectedNode && selectedNode.kind !== "set" && selectedNode.kind !== "note" && !selectedNode.locked ? nodeLabel(selectedNode) : "Workout end"} poolUnit={poolUnit} />

        <div className="studio-builder-layout min-h-[1080px]" data-library={paletteVisible ? "true" : "false"} data-inspector={inspectorVisible ? "true" : "false"}>
          {paletteVisible && (
          <aside className="studio-block-library grid min-h-[940px] grid-cols-[92px_minmax(0,1fr)] border-r border-hairline-on-canvas bg-white" aria-label="Block library">
            <div className="border-r border-hairline-on-canvas bg-canvas py-2">
              {categories.map((category) => {
                const meta = CATEGORY_META[category] || CATEGORY_META.Structure;
                const Icon = meta.icon;
                const active = activeCategory === category && !searchQuery;
                return (
                  <button type="button" key={category} onClick={() => { setPaletteSearch(""); setActiveCategory(category); }} className={`flex w-full flex-col items-center gap-1 px-1 py-2 text-center text-[10px] font-bold leading-tight transition ${active ? meta.selected : "text-ink-muted-on-canvas hover:bg-white"}`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${meta.dot}`}><Icon className="h-4 w-4" /></span>
                    <span>{category}</span>
                  </button>
                );
              })}
            </div>

            <div className="min-w-0">
              <div className="border-b border-canvas-raised p-3">
                <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted-on-canvas" /><input ref={paletteSearchRef} value={paletteSearch} onChange={(event) => setPaletteSearch(event.target.value)} placeholder="Search all blocks (Ctrl+K)" className="w-full rounded-xl border border-hairline-on-canvas bg-canvas py-2 pl-9 pr-3 text-xs text-ink-on-canvas outline-none focus:border-accent-hover focus:bg-white" /></div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-muted-on-canvas">{searchQuery ? "Search results" : activeCategory}</p>
                  <button type="button" onClick={() => setPaletteVisible(false)} className="studio-panel-edge-close" aria-label="Hide block library" title="Hide block library"><PanelLeftClose className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="max-h-[950px] space-y-2 overflow-y-auto p-3">
                {activeCategory === "My Blocks" && !searchQuery && (
                  <div className="mb-3 space-y-2 rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                    <button type="button" onClick={() => setMakeBlockOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600"><Plus className="h-4 w-4" /> Make a Block</button>
                    <button type="button" onClick={() => setQuickWriteOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"><PenLine className="h-4 w-4" /> Quick-write sets</button>
                    <p className="text-[11px] leading-relaxed text-rose-700/70">Create reusable swim blocks, empty sections, repeat containers or coach-note blocks from scratch.</p>
                  </div>
                )}
                {(searchQuery || !["My Blocks", "Backpack"].includes(activeCategory)) && paletteItems.map((item) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.Structure;
                  const favorite = favoritePresetIds.includes(item.id);
                  return (
                    <div key={item.id} className="group relative">
                      <button type="button" draggable onDragStart={(event) => handlePaletteDragStart({ source: "palette", paletteId: item.id }, event)} onDragEnd={handleDragEnd} onClick={() => addFromPalette(item.id)} className={`palette-puzzle w-full cursor-grab rounded-xl px-3 py-2.5 pr-9 text-left text-white shadow-sm transition active:cursor-grabbing ${meta.palette}`}>
                        <div className="flex items-center gap-2"><GripVertical className="h-4 w-4 opacity-70" /><span className="text-sm font-bold">{item.label}</span><Plus className="ml-auto h-4 w-4" /></div>
                        <p className="mt-1 pl-5 text-[11px] leading-relaxed text-white/85">{item.description}</p>
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); toggleFavoritePreset(item.id); }} className={`absolute right-1.5 top-1.5 rounded-lg p-1.5 transition ${favorite ? "bg-white text-yellow-500" : "text-white/70 opacity-0 hover:bg-white/15 group-hover:opacity-100"}`} title={favorite ? "Remove favorite" : "Add favorite"}><Star className={`h-3 w-3 ${favorite ? "fill-current" : ""}`} /></button>
                    </div>
                  );
                })}

                {(searchQuery || activeCategory === "My Blocks") && customItems.map((item) => (
                  <div key={item.id} className="group relative">
                    <button type="button" draggable onDragStart={(event) => handlePaletteDragStart({ source: "custom", customId: item.id }, event)} onDragEnd={handleDragEnd} onClick={() => addFromPalette(`custom:${item.id}`)} className="palette-puzzle w-full cursor-grab rounded-xl bg-rose-500 px-3 py-2.5 text-left text-white shadow-sm hover:bg-rose-600">
                      <div className="flex items-center gap-2"><GripVertical className="h-4 w-4" /><span className="truncate text-sm font-bold">{item.name}</span><Sparkles className="ml-auto h-4 w-4" /></div>
                      <p className="mt-1 pl-5 text-[11px] text-white/80">{item.description || "Reusable custom block"}</p>
                    </button>
                    <button type="button" onClick={() => deleteCustom(item.id)} className="absolute right-1 top-1 rounded p-1 text-white/60 opacity-0 hover:bg-white/15 hover:text-white group-hover:opacity-100"><X className="h-3 w-3" /></button>
                  </div>
                ))}

                {(searchQuery || activeCategory === "Backpack") && backpackItems.map((item) => (
                  <div key={item.id} className="group relative">
                    <button type="button" draggable onDragStart={(event) => handlePaletteDragStart({ source: "custom", customId: item.id }, event)} onDragEnd={handleDragEnd} onClick={() => addFromPalette(`custom:${item.id}`)} className="palette-puzzle w-full cursor-grab rounded-xl bg-accent px-3 py-2.5 text-left text-white shadow-sm hover:bg-accent-active">
                      <div className="flex items-center gap-2"><GripVertical className="h-4 w-4" /><span className="truncate text-sm font-bold">{item.name}</span><ClipboardList className="ml-auto h-4 w-4" /></div>
                      <p className="mt-1 pl-5 text-[11px] text-white/80">{item.description || "Portable reusable block"}</p>
                    </button>
                    <button type="button" onClick={() => deleteBackpackItem(item.id)} className="absolute right-1 top-1 rounded p-1 text-white/60 opacity-0 hover:bg-white/15 hover:text-white group-hover:opacity-100"><X className="h-3 w-3" /></button>
                  </div>
                ))}

                {activeCategory === "Favorites" && paletteItems.length === 0 && !searchQuery && <div className="rounded-xl border border-dashed border-yellow-200 bg-yellow-50 p-5 text-center"><Star className="mx-auto h-5 w-5 text-yellow-400" /><p className="mt-2 text-xs font-bold text-yellow-800">No favorite blocks yet</p><p className="mt-1 text-[11px] leading-relaxed text-yellow-700/70">Use the star on any palette block to pin it here.</p></div>}
                {activeCategory === "Backpack" && backpackBlocks.length === 0 && !searchQuery && <div className="rounded-xl border border-dashed border-hairline-on-canvas bg-canvas p-5 text-center"><ClipboardList className="mx-auto h-5 w-5 text-ink-muted-on-canvas" /><p className="mt-2 text-xs font-bold text-surface-raised">Backpack is empty</p><p className="mt-1 text-[11px] leading-relaxed text-accent-active/70">Select any canvas block and save it to Backpack to carry it between projects.</p></div>}

                {activeCategory === "My Blocks" && customBlocks.length === 0 && !searchQuery && <div className="rounded-xl border border-dashed border-hairline-on-canvas bg-canvas p-5 text-center"><Sparkles className="mx-auto h-5 w-5 text-disabled" /><p className="mt-2 text-xs font-bold text-ink-muted-on-canvas">No custom blocks</p><p className="mt-1 text-[11px] leading-relaxed text-ink-muted-on-canvas">Choose “Make a Block,” or select a canvas block and save it here.</p></div>}
              </div>
            </div>
          </aside>
          )}

          <main className={`studio-canvas-pane min-w-0 bg-[#f7fbff] ${inspectorVisible ? "border-r border-hairline-on-canvas" : ""}`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-hairline-on-canvas bg-white px-5 py-2.5">
              <div className="flex items-center gap-2"><CircleDot className="h-4 w-4 text-accent-active" /><span className="text-sm font-bold text-surface-raised">Scripts</span></div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="studio-panel-controls">
                  <button type="button" onClick={() => setPaletteVisible((value) => !value)} className="studio-panel-toggle" data-active={paletteVisible ? "true" : "false"} aria-pressed={paletteVisible}>
                    {paletteVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                    <span>{paletteVisible ? "Hide library" : "Show library"}</span>
                  </button>
                  <button type="button" onClick={() => setInspectorVisible((value) => !value)} className="studio-panel-toggle" data-active={inspectorVisible ? "true" : "false"} aria-pressed={inspectorVisible}>
                    {inspectorVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                    <span>{inspectorVisible ? "Hide inspector" : "Show inspector"}</span>
                  </button>
                  {(paletteVisible || inspectorVisible) && <button type="button" onClick={() => { setPaletteVisible(false); setInspectorVisible(false); }} className="studio-panel-toggle" title="Hide both side panels"><Maximize2 className="h-4 w-4" /><span>Focus canvas</span></button>}
                </div>
                <span className="h-6 w-px bg-hairline-on-canvas" />
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setCanvasZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(1))))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline-on-canvas bg-white text-ink-muted-on-canvas transition hover:bg-canvas" title="Zoom out"><Minus className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setCanvasZoom(1)} className="flex h-9 min-w-[3.5rem] items-center justify-center rounded-lg border border-hairline-on-canvas bg-white px-2 text-xs font-bold text-ink-muted-on-canvas transition hover:bg-canvas" title="Reset zoom to 100%">{Math.round(canvasZoom * 100)}%</button>
                  <button type="button" onClick={() => setCanvasZoom((value) => Math.min(1.4, Number((value + 0.1).toFixed(1))))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline-on-canvas bg-white text-ink-muted-on-canvas transition hover:bg-canvas" title="Zoom in"><Plus className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setCanvasZoom(nodes.length > 16 ? 0.8 : nodes.length > 9 ? 0.9 : 1)} className="flex h-9 items-center gap-1.5 rounded-lg border border-hairline-on-canvas bg-white px-3 text-xs font-bold text-ink-muted-on-canvas transition hover:bg-canvas" title="Fit the workout stack to the workspace"><Maximize2 className="h-4 w-4" /> Fit</button>
                </div>
                <span className="h-6 w-px bg-hairline-on-canvas" />
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setCollapsedIds(new Set(containerIds))} className="flex h-9 items-center gap-1.5 rounded-lg border border-hairline-on-canvas bg-white px-3 text-xs font-bold text-ink-muted-on-canvas transition hover:bg-canvas" title="Collapse every section and control block"><Layers3 className="h-4 w-4" /> Collapse</button>
                  <button type="button" onClick={() => setCollapsedIds(new Set())} className="flex h-9 items-center rounded-lg border border-hairline-on-canvas bg-white px-3 text-xs font-bold text-ink-muted-on-canvas transition hover:bg-canvas" title="Expand every section and control block">Expand</button>
                </div>
                <span className="h-6 w-px bg-hairline-on-canvas" />
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => { commitNodes(starterWorkout()); setSelectedId(null); }} className="flex h-9 items-center rounded-lg border border-hairline-on-canvas bg-white px-3 text-xs font-bold text-ink-muted-on-canvas transition hover:bg-canvas" title="Load the starter workout">Starter</button>
                  <button type="button" onClick={() => { commitNodes([]); setSelectedId(null); }} className="flex h-9 items-center rounded-lg border border-hairline-on-canvas bg-white px-3 text-xs font-bold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50" title="Clear the canvas">Clear</button>
                </div>
              </div>
            </div>

            <div
              className={`studio-grid min-h-[1030px] overflow-auto p-5 transition ${dragActive ? "bg-canvas/60" : ""}`}
              onClick={() => setSelectedId(null)}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
              onDrop={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest('[data-setcraft-dropzone="true"]')) return;
                handleDropPayload(null, nodes.length, event);
              }}
            >
              <div style={{ transform: `scale(${canvasZoom})`, transformOrigin: "top left", width: `${100 / canvasZoom}%` }}>
                <DropZone parentId={null} index={0} active={dragActive} label={dragLabel} onDropPayload={handleDropPayload} />
                {nodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <NodeCard node={node} selectedId={selectedId} draggingId={draggingId} dragActive={dragActive} dragLabel={dragLabel} collapsedIds={collapsedIds} poolUnit={poolUnit} onSelect={(id) => { setSelectedId(id); setRightTab("inspector"); }} onDelete={deleteNode} onDuplicate={duplicateNode} onPatch={patchNode} onToggleCollapse={toggleCollapse} onDragStart={handleNodeDragStart} onDragEnd={handleDragEnd} onDropPayload={handleDropPayload} onQuickAdd={(parentId, paletteId) => addFromPalette(paletteId, parentId)} />
                    <DropZone parentId={null} index={index + 1} active={dragActive} label={dragLabel} onDropPayload={handleDropPayload} />
                  </React.Fragment>
                ))}
                {nodes.length === 0 && (
                  <div className="mx-auto mt-24 max-w-md rounded-2xl border-2 border-dashed border-disabled bg-white/80 px-8 py-12 text-center shadow-sm">
                    <Blocks className="mx-auto h-9 w-9 text-disabled" />
                    <h3 className="mt-4 font-display text-base font-bold text-surface-raised">Build your first set</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted-on-canvas">Choose a category, drag a block into the scripts area, then place blocks inside repeats, progressions, lane branches and conditions.</p>
                    <button type="button" onClick={(event) => { event.stopPropagation(); commitNodes(starterWorkout()); }} className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-active">Load starter workout</button>
                  </div>
                )}
              </div>
            </div>
          </main>

          {inspectorVisible && (
          <aside className="studio-inspector-panel min-w-0 bg-white" aria-label="Workout inspector">
            <div className="studio-inspector-header">
              <div className="grid min-w-0 flex-1 grid-cols-3">
                <TabButton active={rightTab === "inspector"} onClick={() => setRightTab("inspector")} icon={MoreHorizontal} label="Inspector" />
                <TabButton active={rightTab === "analysis"} onClick={() => setRightTab("analysis")} icon={Gauge} label="Analysis" badge={warningCount || undefined} />
                <TabButton active={rightTab === "preview"} onClick={() => setRightTab("preview")} icon={Maximize2} label="Preview" />
              </div>
              <button type="button" onClick={() => setInspectorVisible(false)} className="studio-panel-edge-close" aria-label="Hide workout inspector" title="Hide inspector"><PanelRightClose className="h-4 w-4" /></button>
            </div>

            <div className="max-h-[1010px] overflow-y-auto p-5">
              {rightTab === "inspector" && (
                !selectedNode ? (
                  <div className="rounded-2xl border border-dashed border-hairline-on-canvas bg-canvas px-6 py-12 text-center"><CircleDot className="mx-auto h-8 w-8 text-disabled" /><p className="mt-3 text-xs font-bold text-ink-muted-on-canvas">Select a block</p><p className="mt-1 text-[10px] leading-relaxed text-ink-muted-on-canvas">Every block has editable parameters. Basic values can also be changed directly on the canvas.</p></div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-canvas-raised pb-3">
                      <div className="min-w-0"><span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${NODE_STYLE[styleKey(selectedNode)].badge}`}>{selectedNode.kind === "set" ? TYPE_LABEL[selectedNode.blockType] : selectedNode.kind}</span><p className="mt-2 truncate text-sm font-bold text-surface">{nodeLabel(selectedNode)}</p></div>
                      <div className="flex gap-1"><button type="button" onClick={() => patchSelected((node) => ({ ...node, locked: !node.locked } as StudioNode))} className={`rounded-lg border p-2 ${selectedNode.locked ? "border-amber-200 bg-amber-50 text-amber-700" : "border-hairline-on-canvas text-ink-muted-on-canvas hover:bg-canvas"}`} title={selectedNode.locked ? "Unlock" : "Lock"}>{selectedNode.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}</button><button type="button" onClick={() => duplicateNode(selectedNode.id)} className="rounded-lg border border-hairline-on-canvas p-2 text-ink-muted-on-canvas hover:bg-canvas"><Copy className="h-4 w-4" /></button><button type="button" disabled={selectedNode.locked} onClick={() => deleteNode(selectedNode.id)} className="rounded-lg border border-hairline-on-canvas p-2 text-ink-muted-on-canvas hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></div>
                    </div>

                    {selectedNode.kind === "set" && <SetInspector node={selectedNode} patchSelected={patchSelected} poolUnit={poolUnit} />}
                    {selectedNode.kind === "repeat" && <RepeatInspector node={selectedNode} patchSelected={patchSelected} />}
                    {selectedNode.kind === "section" && <SectionInspector node={selectedNode} patchSelected={patchSelected} />}
                    {selectedNode.kind === "condition" && <ConditionInspector node={selectedNode} patchSelected={patchSelected} />}
                    {selectedNode.kind === "progress" && <ProgressInspector node={selectedNode} patchSelected={patchSelected} />}
                    {selectedNode.kind === "time-cap" && <TimeCapInspector node={selectedNode} patchSelected={patchSelected} />}
                    {selectedNode.kind === "lane" && <LaneInspector node={selectedNode} patchSelected={patchSelected} />}
                    {selectedNode.kind === "note" && <NoteInspector node={selectedNode} patchSelected={patchSelected} />}

                    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={saveSelectedAsCustom} className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"><Sparkles className="h-4 w-4" /> My Blocks</button><button type="button" onClick={saveSelectedToBackpack} className="flex items-center justify-center gap-2 rounded-xl border border-hairline-on-canvas bg-canvas px-3 py-2.5 text-xs font-bold text-accent-active hover:bg-canvas-raised"><ClipboardList className="h-4 w-4" /> Backpack</button></div>
                  </div>
                )
              )}

              {rightTab === "analysis" && (
                <div className="space-y-4">
                  <div><h2 className="text-sm font-bold text-surface">Live calculations</h2><p className="mt-1 text-[10px] text-ink-muted-on-canvas">Updated recursively from every nested block.</p></div>
                  <div className="grid grid-cols-2 gap-2"><Metric label="Distance" value={stats.totalDistance.toLocaleString()} suffix={poolUnit} /><Metric label="Duration" value={String(stats.estimatedDuration)} suffix="min" /><Metric label="Average load" value={String(stats.averageIntensity)} suffix="/10" /><Metric label="Executed reps" value={String(stats.setCount)} suffix="" /><Metric label="High intensity" value={stats.highIntensityDistance.toLocaleString()} suffix={poolUnit} /><Metric label="Recovery" value={stats.recoveryDistance.toLocaleString()} suffix={poolUnit} /></div>
                  <div className="rounded-xl border border-canvas-raised bg-canvas p-3"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted-on-canvas"><span>Booking usage</span><span className={stats.estimatedDuration > targetMinutes ? "text-rose-600" : "text-ink-muted-on-canvas"}>{stats.estimatedDuration}/{targetMinutes} min</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-hairline-on-canvas"><div className={`h-full rounded-full ${stats.estimatedDuration > targetMinutes ? "bg-rose-500" : "bg-accent-hover"}`} style={{ width: `${Math.min(100, (stats.estimatedDuration / Math.max(1, targetMinutes)) * 100)}%` }} /></div></div>
                  <div><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold text-surface-raised">Validation</h3><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${warningCount ? "bg-amber-100 text-amber-800" : "bg-canvas-raised text-surface-raised"}`}>{warningCount ? `${warningCount} warnings` : "Clear"}</span></div><div className="space-y-2">{validation.map((issue) => <React.Fragment key={issue.id}><ValidationRow issue={issue} onSelect={(id) => { setSelectedId(id); setRightTab("inspector"); }} /></React.Fragment>)}</div></div>
                  {stats.equipment.length > 0 && <div><p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Equipment list</p><div className="mt-2 flex flex-wrap gap-1.5">{stats.equipment.map((item) => <span key={item} className="rounded-md border border-hairline-on-canvas bg-white px-2 py-1 text-[10px] font-semibold text-ink-muted-on-canvas">{item}</span>)}</div></div>}
                </div>
              )}

              {rightTab === "preview" && (
                <div className="space-y-4">
                  <div><h2 className="text-sm font-bold text-surface">Pool-deck preview</h2><p className="mt-1 text-[10px] text-ink-muted-on-canvas">A clean text view generated from the same block graph.</p></div>
                  <div className="rounded-2xl bg-surface p-4 text-ink shadow-inner"><div className="flex items-center justify-between border-b border-hairline pb-3"><div><p className="font-display text-sm font-bold">{sessionName}</p><p className="mt-1 text-[9px] text-ink-muted">{focus} · {stats.totalDistance.toLocaleString()}{poolUnit} · {stats.estimatedDuration} min</p></div><Waves className="h-5 w-5 text-accent" /></div><pre className="mt-4 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-ink-muted">{previewText || "Build a set to see the deck preview."}</pre></div>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(previewText)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-hairline-on-canvas bg-white px-3 py-2.5 text-xs font-bold text-ink-on-canvas hover:bg-canvas"><Copy className="h-4 w-4" /> Copy workout text</button>
                  {onSaveWorkoutToCalendar && <button type="button" onClick={pushToCalendar} className="w-full rounded-xl bg-accent px-3 py-2.5 text-xs font-bold text-white hover:bg-accent-active">Add to training week</button>}
                </div>
              )}
            </div>
          </aside>
          )}
        </div>
          </div>
        )}

        {studioPage === "lanes" && (
          <div id="studio-page-lanes" role="tabpanel" aria-labelledby="studio-tab-lanes" tabIndex={0} className="bg-canvas p-4 md:p-6">
            <LaneAssignmentPanel
              config={laneAssignments}
              onChange={setLaneAssignments}
              deckMeta={deckSheetMeta}
              onDeckMetaChange={setDeckSheetMeta}
              open
              onToggleOpen={() => undefined}
              workoutOptions={laneWorkoutOptions}
              mode="lanes"
            />
          </div>
        )}

        {studioPage === "deck" && (
          <div id="studio-page-deck" role="tabpanel" aria-labelledby="studio-tab-deck" tabIndex={0} className="bg-canvas p-4 md:p-6">
            <LaneAssignmentPanel
              config={laneAssignments}
              onChange={setLaneAssignments}
              deckMeta={deckSheetMeta}
              onDeckMetaChange={setDeckSheetMeta}
              open
              onToggleOpen={() => undefined}
              workoutOptions={laneWorkoutOptions}
              mode="deck"
            />
          </div>
        )}

        {studioPage === "review" && (
          <div id="studio-page-review" role="tabpanel" aria-labelledby="studio-tab-review" tabIndex={0} className="bg-canvas p-4 md:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
              <section className="professional-card overflow-hidden rounded-2xl border border-hairline-on-canvas bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-3 border-b border-hairline bg-surface px-5 py-5 text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-hover text-surface"><MonitorUp className="h-5 w-5" /></span>
                  <div><h2 className="font-display text-lg font-bold">Pool-deck preview</h2><p className="mt-1 text-xs text-ink-muted-on-canvas">The same structured workout that will be used for PDF export.</p></div>
                  <button type="button" onClick={exportPdf} className="premium-button ml-auto flex items-center gap-2 rounded-xl bg-accent-hover px-4 py-3 text-sm font-bold text-surface hover:bg-disabled"><FileDown className="h-4 w-4" /> Export PDF</button>
                </div>
                <div className="p-5 md:p-7">
                  <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Metric label="Distance" value={stats.totalDistance.toLocaleString()} suffix={poolUnit} />
                    <Metric label="Duration" value={String(stats.estimatedDuration)} suffix="min" />
                    <Metric label="Average load" value={String(stats.averageIntensity)} suffix="/10" />
                    <Metric label="Lanes" value={String(laneAssignments.enabled ? laneAssignments.lanes.length : 0)} suffix="" />
                  </div>
                  <div className="rounded-2xl border border-hairline-on-canvas bg-white shadow-inner">
                    <div className="border-b border-hairline-on-canvas bg-canvas px-5 py-4"><h3 className="font-display text-xl font-bold text-surface">{sessionName}</h3><p className="mt-1 text-sm text-ink-muted-on-canvas">{focus} · {phase}</p></div>
                    <pre className="max-h-[820px] overflow-y-auto whitespace-pre-wrap p-5 font-mono text-xs leading-7 text-ink-on-canvas">{previewText || "Build a workout to see the preview."}</pre>
                  </div>
                </div>
              </section>

              <aside className="space-y-5">
                <section className="professional-card rounded-2xl border border-hairline-on-canvas bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between"><div><h2 className="text-base font-bold text-surface">Final checks</h2><p className="mt-1 text-xs text-ink-muted-on-canvas">Resolve warnings before sending the practice to the deck.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${warningCount ? "bg-amber-100 text-amber-800" : "bg-canvas-raised text-surface-raised"}`}>{warningCount ? `${warningCount} warnings` : "All clear"}</span></div>
                  <div className="mt-4 space-y-2">{validation.map((issue) => <React.Fragment key={issue.id}><ValidationRow issue={issue} onSelect={(id) => { setSelectedId(id); setStudioPage("build"); setRightTab("inspector"); }} /></React.Fragment>)}</div>
                  <div className="mt-5 border-t border-canvas-raised pt-5">
                    <div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-bold text-surface"><Sparkles className="h-4 w-4 text-accent-active" />Optional AI second review</h3><p className="mt-1 text-[11px] leading-5 text-ink-muted-on-canvas">The deterministic checks above remain the trusted math layer. AI can suggest additional questions for coach review.</p></div><button type="button" onClick={runAiAudit} disabled={aiAuditLoading} className="flex shrink-0 items-center gap-2 rounded-xl border border-hairline-on-canvas bg-canvas px-3 py-2 text-xs font-bold text-accent-active hover:bg-canvas-raised disabled:opacity-50">{aiAuditLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{aiAuditLoading ? "Reviewing…" : "Run review"}</button></div>
                    {aiAuditError && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{aiAuditError}</p>}
                    {aiAudit && <div className="mt-3 space-y-3 rounded-2xl border border-canvas-raised bg-canvas/60 p-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${aiAudit.isSafe ? "bg-canvas-raised text-surface-raised" : "bg-amber-100 text-amber-800"}`}>{aiAudit.isSafe ? "No major AI flags" : "Coach review needed"}</span>{aiAudit.warnings.length > 0 && <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Questions / warnings</p><ul className="mt-2 space-y-1 text-xs leading-5 text-ink-on-canvas">{aiAudit.warnings.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul></div>}{aiAudit.recommendations.length > 0 && <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Possible checks</p><ul className="mt-2 space-y-1 text-xs leading-5 text-ink-on-canvas">{aiAudit.recommendations.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul></div>}</div>}
                  </div>
                </section>
                <section className="professional-card rounded-2xl border border-hairline-on-canvas bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-surface">Project actions</h2>
                  <div className="mt-4 grid gap-2">
                    <button type="button" onClick={saveTemplate} className="premium-button flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent-active"><Save className="h-4 w-4" /> Save project</button>
                    <button type="button" onClick={exportPdf} className="flex items-center justify-center gap-2 rounded-xl border border-disabled bg-canvas px-4 py-3 text-sm font-bold text-surface-raised hover:bg-canvas-raised"><FileDown className="h-4 w-4" /> Export one-page PDF</button>
                    <button type="button" onClick={exportJson} className="flex items-center justify-center gap-2 rounded-xl border border-disabled bg-white px-4 py-3 text-sm font-bold text-ink-on-canvas hover:bg-canvas"><FileJson className="h-4 w-4" /> Export structured JSON</button>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(previewText)} className="flex items-center justify-center gap-2 rounded-xl border border-disabled bg-white px-4 py-3 text-sm font-bold text-ink-on-canvas hover:bg-canvas"><Copy className="h-4 w-4" /> Copy workout text</button>
                  </div>
                  <div className="mt-4 rounded-xl bg-canvas p-3 text-xs leading-5 text-ink-muted-on-canvas"><span className="font-bold text-ink-on-canvas">Auto-save:</span> {autoSaveState === "saving" ? "Saving current draft…" : "Current draft saved locally."}</div>
                </section>
              </aside>
            </div>
          </div>
        )}
      </section>

      {dropNotice && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-surface px-5 py-3 text-xs font-bold text-white shadow-md">
          {dropNotice}
        </div>
      )}

      {shortcutsOpen && (
        <ModalFrame
          title="Keyboard shortcuts"
          subtitle="Use the studio faster without taking your hands off the keyboard."
          onClose={() => setShortcutsOpen(false)}
          footer={<button type="button" onClick={() => setShortcutsOpen(false)} className="rounded-xl bg-surface px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-active">Done</button>}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Ctrl / Cmd + S", "Save the current workout project"],
              ["Ctrl / Cmd + K", "Open the block search"],
              ["Ctrl / Cmd + Z", "Undo the last block change"],
              ["Ctrl / Cmd + Y", "Redo the last block change"],
              ["Ctrl / Cmd + D", "Duplicate the selected block"],
              ["Delete", "Delete the selected unlocked block"],
              ["?", "Open this shortcut guide"],
              ["Escape", "Close pop-ups and previews"],
            ].map(([key, description]) => <div key={key} className="rounded-2xl border border-hairline-on-canvas bg-canvas p-4"><kbd className="rounded-lg border border-disabled bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-surface-raised shadow-sm">{key}</kbd><p className="mt-3 text-sm leading-6 text-ink-muted-on-canvas">{description}</p></div>)}
          </div>
        </ModalFrame>
      )}

      {quickWriteOpen && (
        <QuickWriteModal
          value={quickWriteText}
          destination={selectedNode && selectedNode.kind !== "set" && selectedNode.kind !== "note" && !selectedNode.locked ? `Inside ${nodeLabel(selectedNode)}` : "At the end of the workout"}
          onChange={setQuickWriteText}
          onClose={() => setQuickWriteOpen(false)}
          onAdd={addQuickWrittenSets}
        />
      )}

      {makeBlockOpen && (
        <MakeBlockModal
          draft={makeBlockDraft}
          onChange={setMakeBlockDraft}
          onClose={() => setMakeBlockOpen(false)}
          onCreate={createCustomBlock}
        />
      )}
    </div>
  );
}


function LaneAssignmentPanel({ config, onChange, deckMeta, onDeckMetaChange, open, onToggleOpen, workoutOptions, mode = "all" }: {
  config: LaneAssignmentConfig;
  onChange: React.Dispatch<React.SetStateAction<LaneAssignmentConfig>>;
  deckMeta: DeckSheetMeta;
  onDeckMetaChange: React.Dispatch<React.SetStateAction<DeckSheetMeta>>;
  open: boolean;
  onToggleOpen: () => void;
  workoutOptions: Array<{ id: string; label: string }>;
  mode?: "all" | "lanes" | "deck";
}) {
  const addLane = () => onChange((current) => ({ ...current, lanes: [...current.lanes, makeLane(current.lanes.length)] }));
  const removeLane = (laneId: string) => onChange((current) => ({ ...current, lanes: current.lanes.filter((lane) => lane.id !== laneId) }));
  const updateLane = (laneId: string, patch: Partial<PracticeLaneAssignment>) => onChange((current) => ({
    ...current,
    lanes: current.lanes.map((lane) => lane.id === laneId ? { ...lane, ...patch } : lane),
  }));

  const addSwimmer = (laneId: string) => onChange((current) => ({
    ...current,
    lanes: current.lanes.map((lane) => lane.id === laneId ? {
      ...lane,
      swimmers: [...lane.swimmers, { id: `swimmer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: "", assignment: "", notes: "" }],
    } : lane),
  }));

  const updateSwimmer = (laneId: string, swimmerId: string, patch: Partial<LaneSwimmerAssignment>) => onChange((current) => ({
    ...current,
    lanes: current.lanes.map((lane) => lane.id === laneId ? {
      ...lane,
      swimmers: lane.swimmers.map((swimmer) => swimmer.id === swimmerId ? { ...swimmer, ...patch } : swimmer),
    } : lane),
  }));

  const removeSwimmer = (laneId: string, swimmerId: string) => onChange((current) => ({
    ...current,
    lanes: current.lanes.map((lane) => lane.id === laneId ? { ...lane, swimmers: lane.swimmers.filter((swimmer) => swimmer.id !== swimmerId) } : lane),
  }));

  const addSetAssignment = (laneId: string) => onChange((current) => ({
    ...current,
    lanes: current.lanes.map((lane) => lane.id === laneId ? {
      ...lane,
      setAssignments: [...lane.setAssignments, {
        id: `lane-set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nodeId: workoutOptions[0]?.id || "",
        nodeLabel: workoutOptions[0]?.label.replace(/^—\s*/g, "") || "Whole workout",
        targetPace: "",
        sendOff: "",
        repsOverride: "",
        distanceOverride: "",
        instructions: "",
      }],
    } : lane),
  }));

  const updateSetAssignment = (laneId: string, assignmentId: string, patch: Partial<LaneSetAssignment>) => onChange((current) => ({
    ...current,
    lanes: current.lanes.map((lane) => lane.id === laneId ? {
      ...lane,
      setAssignments: lane.setAssignments.map((assignment) => assignment.id === assignmentId ? { ...assignment, ...patch } : assignment),
    } : lane),
  }));

  const removeSetAssignment = (laneId: string, assignmentId: string) => onChange((current) => ({
    ...current,
    lanes: current.lanes.map((lane) => lane.id === laneId ? { ...lane, setAssignments: lane.setAssignments.filter((assignment) => assignment.id !== assignmentId) } : lane),
  }));

  const updateGoalTable = (tableId: string, patch: Partial<GoalTimeTable>) => onDeckMetaChange((current) => ({
    ...current,
    goalTimeTables: current.goalTimeTables.map((table) => table.id === tableId ? { ...table, ...patch } : table),
  }));

  const addGoalTable = () => onDeckMetaChange((current) => ({
    ...current,
    goalTimeTables: [...current.goalTimeTables, {
      id: `goal-table-${Date.now()}`,
      title: "Target goal times",
      columns: ["25", "50", "100", "200"],
      rows: [{ id: `goal-row-${Date.now()}`, label: "Goal", values: ["", "", "", ""] }],
    }],
  }));

  const removeGoalTable = (tableId: string) => onDeckMetaChange((current) => ({ ...current, goalTimeTables: current.goalTimeTables.filter((table) => table.id !== tableId) }));
  const metaInput = "w-full rounded-xl border border-disabled bg-white px-3 py-2.5 text-sm font-medium text-surface-raised outline-none transition focus:border-accent-hover focus:ring-2 focus:ring-canvas-raised";
  const miniInput = "w-full rounded-xl border border-disabled bg-white px-3 py-2.5 text-sm font-medium text-ink-on-canvas outline-none transition focus:border-accent-hover focus:ring-4 focus:ring-canvas";
  const panelTitle = mode === "lanes" ? "Lane assignments" : mode === "deck" ? "Deck-sheet setup" : "Lane assignments & deck-sheet setup";
  const panelHelper = mode === "lanes" ? "Roster, swimmer notes and lane-specific set overrides" : mode === "deck" ? "Practice header, bottom notes and optional goal-time tables" : "Roster, lane-specific pace plans, goal-time tables and PDF notes";

  return (
    <section className="professional-card overflow-hidden rounded-2xl border border-hairline-on-canvas bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button type="button" onClick={mode === "all" ? onToggleOpen : undefined} className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas-raised text-accent-active"><Users className="h-5 w-5" /></span>
          <span><span className="block text-base font-bold text-surface">{panelTitle}</span><span className="mt-1 block text-sm text-ink-muted-on-canvas">{panelHelper}</span></span>
          {mode === "all" && (open ? <ChevronDown className="h-5 w-5 text-ink-muted-on-canvas" /> : <ChevronRight className="h-5 w-5 text-ink-muted-on-canvas" />)}
        </button>
        {(mode === "all" || mode === "lanes") && <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-hairline-on-canvas bg-canvas px-3 py-2.5 text-sm font-bold text-ink-on-canvas">
            <button type="button" role="switch" aria-checked={config.enabled} onClick={() => onChange((current) => ({ ...current, enabled: !current.enabled }))} className={`relative h-6 w-11 rounded-full transition ${config.enabled ? "bg-accent-hover" : "bg-disabled"}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${config.enabled ? "left-6" : "left-1"}`} />
            </button>
            Include lane table
          </label>
          <span className="rounded-xl border border-hairline-on-canvas bg-white px-3 py-2.5 text-sm font-bold text-ink-muted-on-canvas">{config.lanes.length} lane{config.lanes.length === 1 ? "" : "s"}</span>
          <button type="button" onClick={addLane} className="premium-button flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-active"><Plus className="h-4 w-4" /> Add lane</button>
        </div>}
      </div>

      {open && (
        <div className="space-y-6 border-t border-canvas-raised bg-canvas/70 px-5 py-5">
          {(mode === "all" || mode === "deck") && (
          <div className="rounded-2xl border border-hairline-on-canvas bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><div><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted-on-canvas">Practice header</h3><p className="mt-1 text-xs text-ink-muted-on-canvas">These fields appear at the top and bottom of the exported deck sheet.</p></div></div>
            <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
              <label><FieldLabel>Session code</FieldLabel><input value={deckMeta.sessionCode} onChange={(event) => onDeckMetaChange((current) => ({ ...current, sessionCode: event.target.value }))} className={metaInput} /></label>
              <label><FieldLabel>Date</FieldLabel><input type="date" value={deckMeta.date} onChange={(event) => onDeckMetaChange((current) => ({ ...current, date: event.target.value }))} className={metaInput} /></label>
              <label><FieldLabel>Time</FieldLabel><input value={deckMeta.timeRange} onChange={(event) => onDeckMetaChange((current) => ({ ...current, timeRange: event.target.value }))} className={metaInput} /></label>
              <label><FieldLabel>Day label</FieldLabel><input value={deckMeta.dayLabel} onChange={(event) => onDeckMetaChange((current) => ({ ...current, dayLabel: event.target.value }))} className={metaInput} /></label>
              <label className="md:col-span-2"><FieldLabel>Coaches</FieldLabel><input value={deckMeta.coaches} onChange={(event) => onDeckMetaChange((current) => ({ ...current, coaches: event.target.value }))} className={metaInput} /></label>
              <label className="md:col-span-2"><FieldLabel>Quote / theme</FieldLabel><input value={deckMeta.quote} onChange={(event) => onDeckMetaChange((current) => ({ ...current, quote: event.target.value }))} className={metaInput} placeholder="Swimming rewards the tough" /></label>
              <label className="md:col-span-2 xl:col-span-3"><FieldLabel>Week’s focus</FieldLabel><input value={deckMeta.weekFocus} onChange={(event) => onDeckMetaChange((current) => ({ ...current, weekFocus: event.target.value }))} className={metaInput} /></label>
              <label className="md:col-span-2 xl:col-span-3"><FieldLabel>Today’s focus</FieldLabel><input value={deckMeta.todayFocus} onChange={(event) => onDeckMetaChange((current) => ({ ...current, todayFocus: event.target.value }))} className={metaInput} /></label>
              <label className="md:col-span-2"><FieldLabel>Short footer line</FieldLabel><input value={deckMeta.footerNote} onChange={(event) => onDeckMetaChange((current) => ({ ...current, footerNote: event.target.value }))} className={metaInput} /></label>
              <label className="md:col-span-4 xl:col-span-8"><FieldLabel>Notes shown at bottom of PDF</FieldLabel><textarea rows={3} value={deckMeta.bottomNotes} onChange={(event) => onDeckMetaChange((current) => ({ ...current, bottomNotes: event.target.value }))} className={metaInput} placeholder="Meet reminders, equipment notes, coaching instructions, substitutions..." /></label>
            </div>
          </div>

          )}

          {(mode === "all" || mode === "lanes") && (
          <div className={`${config.enabled ? "opacity-100" : "opacity-60"}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted-on-canvas">Lane roster & lane-specific set plan</h3><p className="mt-1 text-xs text-ink-muted-on-canvas">Assign a section or set to a lane and override pace, send-off, repetitions or distance.</p></div>
              <label className="min-w-[280px] flex-1 md:max-w-xl"><FieldLabel>Absent swimmers</FieldLabel><input value={config.absent} onChange={(event) => onChange((current) => ({ ...current, absent: event.target.value }))} className={metaInput} placeholder="Names separated by commas" /></label>
            </div>
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {config.lanes.map((lane, laneIndex) => (
                <div key={lane.id} className="rounded-2xl border border-hairline-on-canvas bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-xs font-bold text-white">{laneIndex + 1}</span>
                    <input value={lane.label} onChange={(event) => updateLane(lane.id, { label: event.target.value })} className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-surface outline-none" />
                    <button type="button" onClick={() => addSwimmer(lane.id)} className="rounded-lg bg-canvas p-2 text-accent-active hover:bg-canvas-raised" title="Add swimmer"><Users className="h-4 w-4" /></button>
                    <button type="button" onClick={() => removeLane(lane.id)} disabled={config.lanes.length <= 1} className="rounded-lg p-2 text-disabled hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30" title="Remove lane"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label><FieldLabel>Default target pace</FieldLabel><input value={lane.defaultPace} onChange={(event) => updateLane(lane.id, { defaultPace: event.target.value })} className={miniInput} placeholder="1:08 / 100" /></label>
                    <label><FieldLabel>Default send-off</FieldLabel><input value={lane.defaultSendOff} onChange={(event) => updateLane(lane.id, { defaultSendOff: event.target.value })} className={miniInput} placeholder="1:20" /></label>
                    <label className="col-span-2"><FieldLabel>Lane notes</FieldLabel><input value={lane.laneNotes} onChange={(event) => updateLane(lane.id, { laneNotes: event.target.value })} className={miniInput} placeholder="Lead order, equipment, rotation, restrictions..." /></label>
                  </div>

                  <div className="mt-4 rounded-xl border border-canvas-raised bg-canvas p-3">
                    <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Swimmers</p><button type="button" onClick={() => addSwimmer(lane.id)} className="text-[10px] font-bold text-accent-active">+ Add swimmer</button></div>
                    <div className="mt-2 space-y-2">
                      {lane.swimmers.map((swimmer) => (
                        <div key={swimmer.id} className="rounded-xl border border-hairline-on-canvas bg-white p-2.5">
                          <div className="flex gap-1.5"><input value={swimmer.name} onChange={(event) => updateSwimmer(lane.id, swimmer.id, { name: event.target.value })} placeholder="Swimmer name" className="min-w-0 flex-1 rounded-lg border border-hairline-on-canvas px-2.5 py-2 text-xs font-bold outline-none focus:border-accent-hover" /><button type="button" onClick={() => removeSwimmer(lane.id, swimmer.id)} className="rounded-lg p-2 text-disabled hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button></div>
                          <input value={swimmer.assignment} onChange={(event) => updateSwimmer(lane.id, swimmer.id, { assignment: event.target.value })} placeholder="Personal assignment / pace / equipment" className="mt-2 w-full rounded-lg border border-hairline-on-canvas px-2.5 py-2 text-[11px] outline-none focus:border-accent-hover" />
                          <input value={swimmer.notes} onChange={(event) => updateSwimmer(lane.id, swimmer.id, { notes: event.target.value })} placeholder="Personal note or restriction" className="mt-2 w-full rounded-lg border border-hairline-on-canvas px-2.5 py-2 text-[11px] outline-none focus:border-accent-hover" />
                        </div>
                      ))}
                      {lane.swimmers.length === 0 && <button type="button" onClick={() => addSwimmer(lane.id)} className="w-full rounded-xl border border-dashed border-disabled px-3 py-4 text-xs font-bold text-ink-muted-on-canvas hover:border-accent-hover hover:bg-canvas hover:text-accent-active">+ Add swimmer</button>}
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-pink-100 bg-pink-50/60 p-3">
                    <div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-wider text-pink-800">Set assignments</p><p className="mt-0.5 text-[10px] text-pink-700/70">Overrides print beside the matching section.</p></div><button type="button" onClick={() => addSetAssignment(lane.id)} className="rounded-lg bg-pink-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-pink-700">+ Assign set</button></div>
                    <div className="mt-2 space-y-2">
                      {lane.setAssignments.map((assignment) => (
                        <div key={assignment.id} className="rounded-xl border border-pink-100 bg-white p-2.5">
                          <div className="flex gap-1.5">
                            <select value={assignment.nodeId} onChange={(event) => { const selected = workoutOptions.find((option) => option.id === event.target.value); updateSetAssignment(lane.id, assignment.id, { nodeId: event.target.value, nodeLabel: selected?.label.replace(/^—\s*/g, "") || "Set" }); }} className="min-w-0 flex-1 rounded-lg border border-hairline-on-canvas px-2 py-2 text-[11px] font-bold outline-none focus:border-pink-400">
                              {workoutOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                            </select>
                            <button type="button" onClick={() => removeSetAssignment(lane.id, assignment.id)} className="rounded-lg p-2 text-disabled hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <input value={assignment.targetPace} onChange={(event) => updateSetAssignment(lane.id, assignment.id, { targetPace: event.target.value })} placeholder="Target pace" className={miniInput} />
                            <input value={assignment.sendOff} onChange={(event) => updateSetAssignment(lane.id, assignment.id, { sendOff: event.target.value })} placeholder="Send-off" className={miniInput} />
                            <input value={assignment.repsOverride} onChange={(event) => updateSetAssignment(lane.id, assignment.id, { repsOverride: event.target.value })} placeholder="Reps override" className={miniInput} />
                            <input value={assignment.distanceOverride} onChange={(event) => updateSetAssignment(lane.id, assignment.id, { distanceOverride: event.target.value })} placeholder="Distance override" className={miniInput} />
                            <input value={assignment.instructions} onChange={(event) => updateSetAssignment(lane.id, assignment.id, { instructions: event.target.value })} placeholder="Lane-specific instruction" className={`col-span-2 ${miniInput}`} />
                          </div>
                        </div>
                      ))}
                      {lane.setAssignments.length === 0 && <p className="rounded-lg border border-dashed border-pink-200 px-3 py-3 text-center text-[10px] text-pink-700/70">No lane-specific set overrides yet.</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          )}

          {(mode === "all" || mode === "deck") && (
          <div className="rounded-2xl border border-hairline-on-canvas bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted-on-canvas">Target goal-time tables</h3><p className="mt-1 text-xs text-ink-muted-on-canvas">Optional tables printed at the bottom of the deck sheet.</p></div>
              <label className="ml-auto flex items-center gap-2 text-xs font-bold text-ink-on-canvas"><button type="button" role="switch" aria-checked={deckMeta.goalTimesEnabled} onClick={() => onDeckMetaChange((current) => ({ ...current, goalTimesEnabled: !current.goalTimesEnabled }))} className={`relative h-6 w-11 rounded-full transition ${deckMeta.goalTimesEnabled ? "bg-accent-hover" : "bg-disabled"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${deckMeta.goalTimesEnabled ? "left-6" : "left-1"}`} /></button>Include in PDF</label>
              <button type="button" onClick={addGoalTable} className="rounded-xl border border-hairline-on-canvas px-3 py-2 text-xs font-bold text-ink-on-canvas hover:bg-canvas">+ Add table</button>
            </div>
            {deckMeta.goalTimesEnabled && <div className="mt-4 space-y-4">
              {deckMeta.goalTimeTables.map((table) => (
                <div key={table.id} className="rounded-xl border border-hairline-on-canvas bg-canvas p-3">
                  <div className="flex gap-2"><input value={table.title} onChange={(event) => updateGoalTable(table.id, { title: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-hairline-on-canvas bg-white px-3 py-2 text-sm font-bold outline-none focus:border-accent-hover" /><button type="button" onClick={() => removeGoalTable(table.id)} className="rounded-lg p-2 text-ink-muted-on-canvas hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div>
                  <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] border-collapse text-xs"><thead><tr><th className="border border-hairline-on-canvas bg-white p-2 text-left">Label</th>{table.columns.map((column, index) => <th key={`${table.id}-col-${index}`} className="border border-hairline-on-canvas bg-white p-1"><input value={column} onChange={(event) => { const columns = [...table.columns]; columns[index] = event.target.value; updateGoalTable(table.id, { columns }); }} className="w-full min-w-[70px] border-0 bg-transparent p-1 text-center font-bold outline-none" /></th>)}</tr></thead><tbody>{table.rows.map((row) => <tr key={row.id}><td className="border border-hairline-on-canvas bg-white p-1"><input value={row.label} onChange={(event) => updateGoalTable(table.id, { rows: table.rows.map((item) => item.id === row.id ? { ...item, label: event.target.value } : item) })} className="w-full border-0 bg-transparent p-1 font-bold outline-none" /></td>{table.columns.map((_, index) => <td key={`${row.id}-${index}`} className="border border-hairline-on-canvas bg-white p-1"><input value={row.values[index] || ""} onChange={(event) => { const values = [...row.values]; values[index] = event.target.value; updateGoalTable(table.id, { rows: table.rows.map((item) => item.id === row.id ? { ...item, values } : item) }); }} className="w-full min-w-[70px] border-0 bg-transparent p-1 text-center outline-none" /></td>)}</tr>)}</tbody></table></div>
                  <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => updateGoalTable(table.id, { columns: [...table.columns, "New"] , rows: table.rows.map((row) => ({ ...row, values: [...row.values, ""] })) })} className="rounded-lg border border-hairline-on-canvas bg-white px-2.5 py-1.5 text-[10px] font-bold text-ink-muted-on-canvas">+ Column</button><button type="button" onClick={() => updateGoalTable(table.id, { rows: [...table.rows, { id: `goal-row-${Date.now()}`, label: "Goal", values: table.columns.map(() => "") }] })} className="rounded-lg border border-hairline-on-canvas bg-white px-2.5 py-1.5 text-[10px] font-bold text-ink-muted-on-canvas">+ Row</button>{table.columns.length > 1 && <button type="button" onClick={() => updateGoalTable(table.id, { columns: table.columns.slice(0, -1), rows: table.rows.map((row) => ({ ...row, values: row.values.slice(0, -1) })) })} className="rounded-lg border border-hairline-on-canvas bg-white px-2.5 py-1.5 text-xs font-bold text-ink-muted-on-canvas">Remove last column</button>}{table.rows.length > 1 && <button type="button" onClick={() => updateGoalTable(table.id, { rows: table.rows.slice(0, -1) })} className="rounded-lg border border-hairline-on-canvas bg-white px-2.5 py-1.5 text-xs font-bold text-ink-muted-on-canvas">Remove last row</button>}</div>
                </div>
              ))}
            </div>}
          </div>
          )}
        </div>
      )}
    </section>
  );
}

function QuickSetComposer({ draft, onChange, onAdd, destination, poolUnit }: {
  draft: QuickSetDraft;
  onChange: React.Dispatch<React.SetStateAction<QuickSetDraft>>;
  onAdd: () => void;
  destination: string;
  poolUnit: PoolUnit;
}) {
  const [open, setOpen] = useState(false);
  const field = "rounded-lg border border-disabled bg-white px-3 py-2 text-sm font-semibold text-ink-on-canvas outline-none transition focus:border-accent-hover focus:ring-4 focus:ring-canvas-raised";
  const labelText = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-muted-on-canvas";
  if (!open) {
    return (
      <div className="flex items-center gap-3 border-b border-hairline-on-canvas bg-white px-6 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-canvas-raised text-accent-active"><Zap className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0"><p className="text-[13px] font-bold leading-tight text-surface">Quick set composer</p><p className="truncate text-[11px] font-medium text-ink-muted-on-canvas">Fast-add a set to {destination}</p></div>
        <button type="button" onClick={() => setOpen(true)} className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline-on-canvas bg-canvas px-3 py-1.5 text-xs font-bold text-accent-active transition hover:bg-canvas-raised"><Plus className="h-4 w-4" /> Quick add <ChevronDown className="h-3.5 w-3.5" /></button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2.5 border-b border-hairline-on-canvas bg-white px-6 py-3">
      <button type="button" onClick={() => setOpen(false)} title="Collapse quick composer" className="mr-1 flex items-center gap-2.5 border-r border-hairline-on-canvas pr-4 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas-raised text-accent-active"><Zap className="h-[18px] w-[18px]" /></span><span><span className="flex items-center gap-1 text-[13px] font-bold leading-tight text-surface">Quick set composer <ChevronUp className="h-3.5 w-3.5 text-ink-muted-on-canvas" /></span><span className="block text-[11px] font-medium text-ink-muted-on-canvas">Adds to {destination}</span></span></button>
      <label><span className={labelText}>Type</span><select value={draft.blockType} onChange={(event) => onChange((current) => ({ ...current, blockType: event.target.value as StudioSetNode["blockType"] }))} className={field}><option value="warm-up">Warm-up</option><option value="drill">Drill</option><option value="underwater">Underwater</option><option value="kick">Kick</option><option value="pull">Pull</option><option value="aerobic">Aerobic</option><option value="threshold">Threshold</option><option value="sprint">Sprint</option><option value="race-pace">Race pace</option><option value="lactate">Lactate</option><option value="USRPT">USRPT</option><option value="test-set">Test set</option><option value="recovery">Recovery</option></select></label>
      <label><span className={labelText}>Reps</span><input type="number" min={1} value={draft.reps} onChange={(event) => onChange((current) => ({ ...current, reps: Math.max(1, Number(event.target.value) || 1) }))} className={`${field} w-20`} /></label>
      <label><span className={labelText}>Distance ({poolUnit})</span><input type="number" min={0} value={draft.distance} onChange={(event) => onChange((current) => ({ ...current, distance: Math.max(0, Number(event.target.value) || 0) }))} className={`${field} w-24`} /></label>
      <label><span className={labelText}>Stroke</span><select value={draft.stroke} onChange={(event) => onChange((current) => ({ ...current, stroke: event.target.value }))} className={field}>{STROKES.map((stroke) => <option key={stroke}>{stroke}</option>)}</select></label>
      <label><span className={labelText}>Send-off</span><input value={draft.interval} onChange={(event) => onChange((current) => ({ ...current, interval: event.target.value }))} className={`${field} w-24 font-mono`} /></label>
      <label className="min-w-[200px] flex-1"><span className={labelText}>Label / note</span><input value={draft.notes} onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))} placeholder="e.g. descend 1-4" className={`${field} w-full`} /></label>
      <button type="button" onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-accent-active"><Plus className="h-4 w-4" /> Add set</button>
    </div>
  );
}


function ModalFrame({ title, subtitle, onClose, children, footer }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-surface/55 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-hairline-on-canvas bg-white shadow-md">
        <div className="flex items-start justify-between gap-4 border-b border-canvas-raised px-6 py-5">
          <div><h2 className="font-display text-lg font-bold text-surface">{title}</h2><p className="mt-1 text-xs leading-relaxed text-ink-muted-on-canvas">{subtitle}</p></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-hairline-on-canvas p-2 text-ink-muted-on-canvas hover:bg-canvas" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-canvas-raised bg-canvas px-6 py-4">{footer}</div>
      </div>
    </div>
  );
}

function QuickWriteModal({ value, destination, onChange, onClose, onAdd }: { value: string; destination: string; onChange: (value: string) => void; onClose: () => void; onAdd: () => void }) {
  return (
    <ModalFrame
      title="Quick-write a set"
      subtitle="Type familiar coach notation. Each line becomes an editable block, and headings become sections."
      onClose={onClose}
      footer={<><button type="button" onClick={onClose} className="rounded-xl border border-hairline-on-canvas bg-white px-4 py-2.5 text-xs font-bold text-ink-muted-on-canvas hover:bg-canvas">Cancel</button><button type="button" onClick={onAdd} className="rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white hover:bg-accent-active">Add structured blocks</button></>}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-canvas-raised bg-canvas px-4 py-3 text-xs text-surface-raised"><span className="font-bold">Destination:</span> {destination}. Select an unlocked section or repeat before opening Quick Write to add directly inside it.</div>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={13} autoFocus spellCheck={false} className="w-full resize-y rounded-2xl border border-hairline bg-surface p-4 font-mono text-sm leading-relaxed text-slate-100 outline-none focus:border-accent-hover" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-hairline-on-canvas bg-canvas p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Common notation</p><pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-on-canvas"># Warm-up{"\n"}4x100 Choice @ 1:40 RPE 4 - build by 25{"\n"}8x50 Free @ 1:00 target :34 - paddles</pre></div>
          <div className="rounded-xl border border-hairline-on-canvas bg-canvas p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">Nested repeat</p><pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-on-canvas">Repeat 3x: Race circuit{"\n"}4x25 Fly @ :40 RPE 8{"\n"}1x100 Choice @ 2:00 - easy{"\n"}end</pre></div>
        </div>
        <p className="text-[10px] leading-relaxed text-ink-muted-on-canvas">Recognized details include stroke, send-off, target time, rest seconds, RPE, equipment names, notes, section headings, repeat groups and coach notes. Anything unrecognized is safely added as a note instead of being discarded.</p>
      </div>
    </ModalFrame>
  );
}

function MakeBlockModal({ draft, onChange, onClose, onCreate }: { draft: MakeBlockDraft; onChange: React.Dispatch<React.SetStateAction<MakeBlockDraft>>; onClose: () => void; onCreate: () => void }) {
  const patch = (fields: Partial<MakeBlockDraft>) => onChange((current) => ({ ...current, ...fields }));
  const kinds: Array<{ value: CustomBlockKind; label: string; description: string }> = [
    { value: "set", label: "Swim block", description: "A reusable repetitions × distance set" },
    { value: "section", label: "Section", description: "An empty container that accepts unlimited blocks" },
    { value: "repeat", label: "Repeat", description: "A C-shaped repeat container with editable rounds" },
    { value: "note", label: "Coach note", description: "A reusable instruction or transition" },
  ];
  return (
    <ModalFrame
      title="Make a Block"
      subtitle="Create a reusable block definition, similar to Scratch My Blocks. It will appear in the My Blocks palette and can be dragged anywhere compatible."
      onClose={onClose}
      footer={<><button type="button" onClick={onClose} className="rounded-xl border border-hairline-on-canvas bg-white px-4 py-2.5 text-xs font-bold text-ink-muted-on-canvas hover:bg-canvas">Cancel</button><button type="button" onClick={onCreate} className="rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-600">Create My Block</button></>}
    >
      <div className="space-y-5">
        <div>
          <FieldLabel>Block shape</FieldLabel>
          <div className="grid gap-2 md:grid-cols-2">{kinds.map((kind) => <button type="button" key={kind.value} onClick={() => patch({ kind: kind.value })} className={`rounded-xl border p-3 text-left transition ${draft.kind === kind.value ? "border-rose-300 bg-rose-50 ring-2 ring-rose-100" : "border-hairline-on-canvas bg-white hover:bg-canvas"}`}><p className={`text-xs font-bold ${draft.kind === kind.value ? "text-rose-800" : "text-surface-raised"}`}>{kind.label}</p><p className="mt-1 text-[10px] leading-relaxed text-ink-muted-on-canvas">{kind.description}</p></button>)}</div>
        </div>
        <div className="grid gap-3 md:grid-cols-2"><div><FieldLabel>Name</FieldLabel><input value={draft.name} onChange={(event) => patch({ name: event.target.value })} placeholder="e.g. Broken 200 pace" className={inputClass} /></div><div><FieldLabel>Palette description</FieldLabel><input value={draft.description} onChange={(event) => patch({ description: event.target.value })} placeholder="What this block is for" className={inputClass} /></div></div>

        {draft.kind === "set" && (
          <div className="space-y-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
            <div className="grid gap-3 md:grid-cols-2"><div><FieldLabel>Training type</FieldLabel><select value={draft.blockType} onChange={(event) => patch({ blockType: event.target.value as StudioSetNode["blockType"] })} className={inputClass}>{Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><FieldLabel>Stroke</FieldLabel><select value={draft.stroke} onChange={(event) => patch({ stroke: event.target.value })} className={inputClass}>{STROKES.map((stroke) => <option key={stroke}>{stroke}</option>)}</select></div></div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div><FieldLabel>Reps</FieldLabel><input type="number" min={1} value={draft.reps} onChange={(event) => patch({ reps: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} /></div><div><FieldLabel>Distance</FieldLabel><input type="number" min={0} step={5} value={draft.distance} onChange={(event) => patch({ distance: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} /></div><div><FieldLabel>Send-off</FieldLabel><input value={draft.interval} onChange={(event) => patch({ interval: event.target.value })} className={`${inputClass} font-mono`} /></div><div><FieldLabel>RPE</FieldLabel><input type="number" min={1} max={10} value={draft.intensity} onChange={(event) => patch({ intensity: Math.max(1, Math.min(10, Number(event.target.value) || 1)) })} className={inputClass} /></div></div>
            <div><FieldLabel>Default cue / notes</FieldLabel><textarea value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} rows={3} className={`${inputClass} resize-none`} /></div>
          </div>
        )}

        {draft.kind === "section" && <div className="rounded-2xl border border-canvas-raised bg-canvas/60 p-4"><FieldLabel>Section purpose</FieldLabel><textarea value={draft.sectionPurpose} onChange={(event) => patch({ sectionPurpose: event.target.value })} rows={4} placeholder="e.g. Quality race-pace work. Drag any number or type of blocks inside." className={`${inputClass} resize-none`} /><p className="mt-2 text-[10px] text-accent-active">Custom sections are empty when placed and accept sets, repeats, conditions, notes and other sections without a block limit.</p></div>}

        {draft.kind === "repeat" && <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4"><FieldLabel>Default repeat count</FieldLabel><input type="number" min={1} max={99} value={draft.rounds} onChange={(event) => patch({ rounds: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} /><p className="mt-2 text-[10px] text-amber-700">The count remains editable directly on the repeat block after it is added to the canvas.</p></div>}

        {draft.kind === "note" && <div className="rounded-2xl border border-yellow-100 bg-yellow-50/60 p-4"><FieldLabel>Instruction text</FieldLabel><textarea value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} rows={5} className={`${inputClass} resize-none`} /></div>}
      </div>
    </ModalFrame>
  );
}

function CompactField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-3 block md:mt-0"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">{label}</span>{children}</label>;
}

function TabButton({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string; badge?: number }) {
  return <button type="button" onClick={onClick} className={`relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold transition ${active ? "bg-white text-accent-active shadow-sm" : "text-ink-muted-on-canvas hover:bg-white/60"}`}><Icon className="h-4 w-4" />{label}{badge ? <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[8px] text-white">{badge}</span> : null}</button>;
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return <div className="rounded-xl border border-canvas-raised bg-canvas p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-on-canvas">{label}</p><p className="mt-1 font-display text-lg font-bold text-surface">{value} <span className="text-[10px] font-semibold text-ink-muted-on-canvas">{suffix}</span></p></div>;
}

function ValidationRow({ issue, onSelect }: { issue: ValidationIssue; onSelect: (id: string) => void }) {
  const warning = issue.severity === "warning";
  return <button type="button" onClick={() => issue.nodeId && onSelect(issue.nodeId)} className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left ${warning ? "border-amber-100 bg-amber-50/70" : "border-canvas-raised bg-canvas"} ${issue.nodeId ? "hover:border-disabled" : "cursor-default"}`}>{warning ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted-on-canvas" />}<span className="text-[10px] leading-relaxed text-ink-muted-on-canvas">{issue.message}</span></button>;
}

const inputClass = "w-full rounded-lg border border-hairline-on-canvas bg-white px-3 py-2 text-xs text-surface-raised outline-none focus:border-accent-hover";

function SetInspector({ node, patchSelected, poolUnit }: { node: StudioSetNode; patchSelected: (patcher: (node: StudioNode) => StudioNode) => void; poolUnit: PoolUnit }) {
  const patch = (fields: Partial<StudioSetNode>) => patchSelected((current) => current.kind === "set" ? { ...current, ...fields } : current);
  return (
    <>
      <div className="grid grid-cols-2 gap-3"><div><FieldLabel>Block type</FieldLabel><select value={node.blockType} onChange={(event) => patch({ blockType: event.target.value as StudioSetNode["blockType"] })} className={inputClass}>{Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><FieldLabel>Variant</FieldLabel><input value={node.variant} onChange={(event) => patch({ variant: event.target.value })} className={inputClass} /></div></div>
      <div><FieldLabel>Block name</FieldLabel><input value={node.label} onChange={(event) => patch({ label: event.target.value })} className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3"><div><FieldLabel>Repetitions</FieldLabel><input type="number" min={1} value={node.reps} onChange={(event) => patch({ reps: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} /></div><div><FieldLabel>Distance ({poolUnit})</FieldLabel><input type="number" min={0} step={5} value={node.distance} onChange={(event) => patch({ distance: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} /></div><div><FieldLabel>Stroke</FieldLabel><select value={node.stroke} onChange={(event) => patch({ stroke: event.target.value })} className={inputClass}>{STROKES.map((stroke) => <option key={stroke}>{stroke}</option>)}</select></div><div><FieldLabel>Start method</FieldLabel><select value={node.startMethod} onChange={(event) => patch({ startMethod: event.target.value })} className={inputClass}>{START_METHODS.map((item) => <option key={item}>{item}</option>)}</select></div></div>
      <div className="rounded-xl border border-canvas-raised bg-canvas p-3"><FieldLabel>Timing mode</FieldLabel><div className="grid grid-cols-2 gap-2">{(["send-off", "rest", "target-time", "open"] as const).map((mode) => <button type="button" key={mode} onClick={() => patch({ intervalMode: mode })} className={`rounded-lg border px-2 py-2 text-[10px] font-bold ${node.intervalMode === mode ? "border-disabled bg-canvas text-accent-active" : "border-hairline-on-canvas bg-white text-ink-muted-on-canvas"}`}>{mode}</button>)}</div><div className="mt-3 grid grid-cols-2 gap-3"><div><FieldLabel>Send-off / interval</FieldLabel><input value={node.interval} onChange={(event) => patch({ interval: event.target.value })} className={`${inputClass} font-mono`} /></div><div><FieldLabel>Target time</FieldLabel><input value={node.targetTime} onChange={(event) => patch({ targetTime: event.target.value })} placeholder="0:30" className={`${inputClass} font-mono`} /></div>{node.intervalMode === "rest" && <div><FieldLabel>Rest seconds</FieldLabel><input type="number" min={0} value={node.restSeconds} onChange={(event) => patch({ restSeconds: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} /></div>}</div></div>
      <div><div className="flex items-center justify-between"><FieldLabel>Intensity</FieldLabel><span className="text-xs font-bold text-ink-on-canvas">RPE {node.intensity}/10</span></div><input type="range" min={1} max={10} value={node.intensity} onChange={(event) => patch({ intensity: Number(event.target.value) })} className="w-full accent-accent" /></div>
      <div className="grid grid-cols-2 gap-3"><div><FieldLabel>Breathing pattern</FieldLabel><select value={node.breathingPattern} onChange={(event) => patch({ breathingPattern: event.target.value })} className={inputClass}>{BREATHING_PATTERNS.map((item) => <option key={item}>{item}</option>)}</select></div>{node.blockType === "USRPT" && <div><FieldLabel>Miss limit</FieldLabel><input type="number" min={1} value={node.missLimit} onChange={(event) => patch({ missLimit: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} /></div>}</div>
      <div><FieldLabel>Equipment</FieldLabel><div className="flex flex-wrap gap-1.5">{EQUIPMENT.map((item) => { const active = node.equipment.includes(item); return <button key={item} type="button" onClick={() => patch({ equipment: active ? node.equipment.filter((value) => value !== item) : [...node.equipment, item] })} className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold ${active ? "border-disabled bg-canvas text-surface-raised" : "border-hairline-on-canvas bg-white text-ink-muted-on-canvas hover:bg-canvas"}`}>{item}</button>; })}</div></div>
      <div><FieldLabel>Skill / quality focus</FieldLabel><input value={node.skillFocus} onChange={(event) => patch({ skillFocus: event.target.value })} className={inputClass} /></div>
      <div><FieldLabel>Coach cue / notes</FieldLabel><textarea value={node.notes} onChange={(event) => patch({ notes: event.target.value })} rows={3} className={`${inputClass} resize-none leading-relaxed`} /></div>
    </>
  );
}

function RepeatInspector({ node, patchSelected }: { node: StudioRepeatNode; patchSelected: (patcher: (node: StudioNode) => StudioNode) => void }) {
  const patch = (fields: Partial<StudioRepeatNode>) => patchSelected((current) => current.kind === "repeat" ? { ...current, ...fields } : current);
  return <><div><FieldLabel>Logic label</FieldLabel><input value={node.label} onChange={(event) => patch({ label: event.target.value })} className={inputClass} /></div><div><FieldLabel>Number of rounds</FieldLabel><input type="number" min={1} max={40} value={node.rounds} onChange={(event) => patch({ rounds: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} /></div><InfoBox tone="amber">Every nested block is multiplied by the number of rounds.</InfoBox></>;
}

function SectionInspector({ node, patchSelected }: { node: StudioSectionNode; patchSelected: (patcher: (node: StudioNode) => StudioNode) => void }) {
  const patch = (fields: Partial<StudioSectionNode>) => patchSelected((current) => current.kind === "section" ? { ...current, ...fields } : current);
  return <><div><FieldLabel>Section title</FieldLabel><input value={node.title} onChange={(event) => patch({ title: event.target.value })} className={inputClass} /></div><div><FieldLabel>Purpose</FieldLabel><textarea value={node.purpose} onChange={(event) => patch({ purpose: event.target.value })} rows={2} className={`${inputClass} resize-none`} /></div><div><FieldLabel>Points of performance</FieldLabel><textarea value={node.pointsOfPerformance || ""} onChange={(event) => patch({ pointsOfPerformance: event.target.value })} rows={4} placeholder="One cue per line or separate cues with semicolons" className={`${inputClass} resize-none`} /></div><InfoBox tone="sky">The section title, purpose and points of performance appear as a dedicated row in the deck-sheet PDF.</InfoBox></>;
}

function ConditionInspector({ node, patchSelected }: { node: StudioConditionNode; patchSelected: (patcher: (node: StudioNode) => StudioNode) => void }) {
  const patch = (fields: Partial<StudioConditionNode>) => patchSelected((current) => current.kind === "condition" ? { ...current, ...fields } : current);
  return <><div><FieldLabel>Condition label</FieldLabel><input value={node.label} onChange={(event) => patch({ label: event.target.value })} className={inputClass} /></div><div className="grid grid-cols-[1fr_70px] gap-2"><div><FieldLabel>Metric</FieldLabel><select value={node.metric} onChange={(event) => patch({ metric: event.target.value })} className={inputClass}><option>pace misses</option><option>pace drop-off</option><option>stroke count</option><option>technique score</option><option>equipment available</option><option>time remaining</option><option>RPE</option></select></div><div><FieldLabel>Compare</FieldLabel><select value={node.comparator} onChange={(event) => patch({ comparator: event.target.value })} className={inputClass}><option>&gt;=</option><option>&gt;</option><option>=</option><option>&lt;</option><option>&lt;=</option></select></div></div><div><FieldLabel>Threshold</FieldLabel><input value={node.threshold} onChange={(event) => patch({ threshold: event.target.value })} className={inputClass} /></div><div><FieldLabel>Then action</FieldLabel><input value={node.action} onChange={(event) => patch({ action: event.target.value })} className={inputClass} /></div><div><FieldLabel>Else action</FieldLabel><input value={node.elseAction} onChange={(event) => patch({ elseAction: event.target.value })} className={inputClass} /></div><InfoBox tone="violet">Nested blocks describe the work controlled by this decision. The coach remains in control of live execution.</InfoBox></>;
}

function ProgressInspector({ node, patchSelected }: { node: StudioProgressNode; patchSelected: (patcher: (node: StudioNode) => StudioNode) => void }) {
  const patch = (fields: Partial<StudioProgressNode>) => patchSelected((current) => current.kind === "progress" ? { ...current, ...fields } : current);
  return <><div><FieldLabel>Progression label</FieldLabel><input value={node.label} onChange={(event) => patch({ label: event.target.value })} className={inputClass} /></div><div className="grid grid-cols-2 gap-3"><div><FieldLabel>Rounds</FieldLabel><input type="number" min={2} max={20} value={node.rounds} onChange={(event) => patch({ rounds: Math.max(2, Number(event.target.value) || 2) })} className={inputClass} /></div><div><FieldLabel>Mode</FieldLabel><select value={node.mode} onChange={(event) => patch({ mode: event.target.value as StudioProgressNode["mode"] })} className={inputClass}><option value="descend">Descend pace</option><option value="build">Build effort</option><option value="increase-distance">Increase distance</option><option value="reduce-rest">Reduce rest</option><option value="increase-reps">Increase reps</option></select></div><div><FieldLabel>Change</FieldLabel><input type="number" min={0} value={node.amount} onChange={(event) => patch({ amount: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} /></div><div><FieldLabel>Unit</FieldLabel><select value={node.unit} onChange={(event) => patch({ unit: event.target.value })} className={inputClass}><option>sec</option><option>%</option><option>m</option><option>reps</option><option>RPE</option></select></div></div><InfoBox tone="orange">The nested circuit is executed once per round while the selected variable progresses.</InfoBox></>;
}

function TimeCapInspector({ node, patchSelected }: { node: StudioTimeCapNode; patchSelected: (patcher: (node: StudioNode) => StudioNode) => void }) {
  const patch = (fields: Partial<StudioTimeCapNode>) => patchSelected((current) => current.kind === "time-cap" ? { ...current, ...fields } : current);
  return <><div><FieldLabel>Block label</FieldLabel><input value={node.label} onChange={(event) => patch({ label: event.target.value })} className={inputClass} /></div><div><FieldLabel>Time cap (minutes)</FieldLabel><input type="number" min={1} max={120} value={node.minutes} onChange={(event) => patch({ minutes: Math.max(1, Number(event.target.value) || 1) })} className={inputClass} /></div><div><FieldLabel>At the cap</FieldLabel><select value={node.behavior} onChange={(event) => patch({ behavior: event.target.value as StudioTimeCapNode["behavior"] })} className={inputClass}><option value="finish-current-rep">Finish current rep</option><option value="move-on">Move on immediately</option><option value="stop-session">Stop session</option></select></div><InfoBox tone="indigo">Distance is estimated from the nested work and the selected time cap.</InfoBox></>;
}

function LaneInspector({ node, patchSelected }: { node: StudioLaneNode; patchSelected: (patcher: (node: StudioNode) => StudioNode) => void }) {
  const patch = (fields: Partial<StudioLaneNode>) => patchSelected((current) => current.kind === "lane" ? { ...current, ...fields } : current);
  const updateLane = (id: string, fields: Partial<StudioLaneNode["lanes"][number]>) => patch({ lanes: node.lanes.map((lane) => lane.id === id ? { ...lane, ...fields } : lane) });
  return <><div><FieldLabel>Branch label</FieldLabel><input value={node.label} onChange={(event) => patch({ label: event.target.value })} className={inputClass} /></div><div className="space-y-3">{node.lanes.map((lane, index) => <div key={lane.id} className="rounded-xl border border-pink-100 bg-pink-50/60 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-pink-700">Lane {index + 1}</span><button type="button" disabled={node.lanes.length <= 2} onClick={() => patch({ lanes: node.lanes.filter((item) => item.id !== lane.id) })} className="rounded p-1 text-pink-400 hover:bg-pink-100 hover:text-pink-700 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div><div className="grid grid-cols-2 gap-2"><input value={lane.name} onChange={(event) => updateLane(lane.id, { name: event.target.value })} className={inputClass} placeholder="Lane name" /><input value={lane.targetPace} onChange={(event) => updateLane(lane.id, { targetPace: event.target.value })} className={inputClass} placeholder="Target pace" /><label><span className="mb-1 block text-[8px] font-bold uppercase text-ink-muted-on-canvas">Interval ± sec</span><input type="number" value={lane.intervalAdjustmentSeconds} onChange={(event) => updateLane(lane.id, { intervalAdjustmentSeconds: Number(event.target.value) || 0 })} className={inputClass} /></label><label><span className="mb-1 block text-[8px] font-bold uppercase text-ink-muted-on-canvas">Reps %</span><input type="number" min={25} max={150} value={lane.repsPercent} onChange={(event) => updateLane(lane.id, { repsPercent: Math.max(25, Number(event.target.value) || 100) })} className={inputClass} /></label></div></div>)}</div><button type="button" onClick={() => patch({ lanes: [...node.lanes, { ...defaultLanes()[0], id: `lane-${Date.now()}`, name: `Lane ${node.lanes.length + 1}` }] })} className="flex w-full items-center justify-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100"><Plus className="h-4 w-4" /> Add lane</button><InfoBox tone="pink">Nested blocks are the shared coaching objective. Lane rules alter pace, interval and repetitions while preserving that objective.</InfoBox></>;
}

function NoteInspector({ node, patchSelected }: { node: StudioNoteNode; patchSelected: (patcher: (node: StudioNode) => StudioNode) => void }) {
  const patch = (fields: Partial<StudioNoteNode>) => patchSelected((current) => current.kind === "note" ? { ...current, ...fields } : current);
  return <><div><FieldLabel>Note label</FieldLabel><input value={node.label} onChange={(event) => patch({ label: event.target.value })} className={inputClass} /></div><div><FieldLabel>Deck instruction</FieldLabel><textarea value={node.text} onChange={(event) => patch({ text: event.target.value })} rows={5} className={`${inputClass} resize-none leading-relaxed`} /></div><InfoBox tone="yellow">Coach notes appear in the deck preview but do not change distance or duration.</InfoBox></>;
}

function InfoBox({ tone, children }: { tone: string; children: React.ReactNode }) {
  const styles: Record<string, string> = { amber: "border-amber-100 bg-amber-50 text-amber-800", sky: "border-canvas-raised bg-canvas text-surface-raised", violet: "border-canvas-raised bg-canvas text-surface-raised", orange: "border-orange-100 bg-orange-50 text-orange-800", indigo: "border-canvas-raised bg-canvas text-surface-raised", pink: "border-pink-100 bg-pink-50 text-pink-800", yellow: "border-yellow-100 bg-yellow-50 text-yellow-800" };
  return <div className={`rounded-lg border p-3 text-[10px] leading-relaxed ${styles[tone] || styles.sky}`}>{children}</div>;
}
