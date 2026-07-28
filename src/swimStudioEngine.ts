import { SwimBlockType, SwimSet, WorkoutBlock } from "./types";

export type PoolUnit = "m" | "yd";
export type PoolLength = 25 | 50;
export type IntervalMode = "send-off" | "rest" | "target-time" | "open";

interface LockableNode {
  id: string;
  locked: boolean;
}

export type StudioNode =
  | StudioSetNode
  | StudioRepeatNode
  | StudioSectionNode
  | StudioConditionNode
  | StudioProgressNode
  | StudioTimeCapNode
  | StudioLaneNode
  | StudioNoteNode;

export interface StudioSetNode extends LockableNode {
  kind: "set";
  blockType: SwimBlockType;
  label: string;
  variant: string;
  reps: number;
  distance: number;
  stroke: string;
  interval: string;
  intervalMode: IntervalMode;
  targetTime: string;
  restSeconds: number;
  intensity: number;
  equipment: string[];
  startMethod: string;
  breathingPattern: string;
  skillFocus: string;
  missLimit: number;
  notes: string;
}

export interface StudioRepeatNode extends LockableNode {
  kind: "repeat";
  label: string;
  rounds: number;
  children: StudioNode[];
}

export interface StudioSectionNode extends LockableNode {
  kind: "section";
  title: string;
  purpose: string;
  pointsOfPerformance: string;
  children: StudioNode[];
}

export interface StudioConditionNode extends LockableNode {
  kind: "condition";
  label: string;
  metric: string;
  comparator: string;
  threshold: string;
  action: string;
  elseAction: string;
  children: StudioNode[];
}

export interface StudioProgressNode extends LockableNode {
  kind: "progress";
  label: string;
  rounds: number;
  mode: "descend" | "build" | "increase-distance" | "reduce-rest" | "increase-reps";
  amount: number;
  unit: string;
  children: StudioNode[];
}

export interface StudioTimeCapNode extends LockableNode {
  kind: "time-cap";
  label: string;
  minutes: number;
  behavior: "move-on" | "stop-session" | "finish-current-rep";
  children: StudioNode[];
}

export interface LaneRule {
  id: string;
  name: string;
  targetPace: string;
  intervalAdjustmentSeconds: number;
  repsPercent: number;
  distancePercent: number;
}

export interface StudioLaneNode extends LockableNode {
  kind: "lane";
  label: string;
  lanes: LaneRule[];
  children: StudioNode[];
}

export interface StudioNoteNode extends LockableNode {
  kind: "note";
  label: string;
  text: string;
}

export interface StudioStats {
  totalDistance: number;
  estimatedDuration: number;
  averageIntensity: number;
  setCount: number;
  highIntensityDistance: number;
  recoveryDistance: number;
  strokeDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  equipment: string[];
}

export interface ValidationIssue {
  id: string;
  severity: "warning" | "info";
  message: string;
  nodeId?: string;
}

export interface PalettePreset {
  id: string;
  category: string;
  label: string;
  description: string;
  factory: () => StudioNode;
}

export const STROKES = ["Free", "Back", "Breast", "Fly", "IM", "Choice", "IM Order", "No stroke"];
export const EQUIPMENT = ["Fins", "Paddles", "Pull buoy", "Snorkel", "Kickboard", "Band", "Parachute", "Tether"];
export const START_METHODS = ["Push", "Dive", "In-water", "Backstroke start", "Turn start", "Choice"];
export const BREATHING_PATTERNS = ["Normal", "Every 2", "Every 3", "Every 5", "3/5/7", "No breath", "Coach choice"];

export const SWIM_BLOCK_TYPES: SwimBlockType[] = [
  "warm-up",
  "drill",
  "underwater",
  "kick",
  "pull",
  "aerobic",
  "threshold",
  "sprint",
  "race-pace",
  "lactate",
  "USRPT",
  "test-set",
  "recovery",
];

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function parseInterval(interval: string): number {
  const value = interval.trim();
  if (!value) return 0;
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 1) return Math.max(0, parts[0]);
  if (parts.length === 2) return Math.max(0, parts[0] * 60 + parts[1]);
  return 0;
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

const setDefaults: Record<SwimBlockType, Omit<StudioSetNode, "id" | "kind" | "blockType">> = {
  "warm-up": { label: "General warm-up", variant: "General", reps: 1, distance: 400, stroke: "Choice", interval: "8:00", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 3, equipment: [], startMethod: "Push", breathingPattern: "Normal", skillFocus: "Prepare every stroke", missLimit: 0, notes: "Build the final 100", locked: false },
  drill: { label: "Technique drill", variant: "Freestyle drill", reps: 4, distance: 50, stroke: "Free", interval: "1:10", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 4, equipment: ["Snorkel"], startMethod: "Push", breathingPattern: "Normal", skillFocus: "Quality before speed", missLimit: 0, notes: "25 drill + 25 swim", locked: false },
  underwater: { label: "Underwater skill", variant: "Breakout", reps: 8, distance: 15, stroke: "No stroke", interval: "0:40", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 7, equipment: ["Fins"], startMethod: "Push", breathingPattern: "No breath", skillFocus: "Tight streamline and breakout speed", missLimit: 0, notes: "Stop at 15 m", locked: false },
  kick: { label: "Kick set", variant: "Board kick", reps: 8, distance: 50, stroke: "Choice", interval: "1:05", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 6, equipment: ["Kickboard"], startMethod: "Push", breathingPattern: "Normal", skillFocus: "Consistent tempo", missLimit: 0, notes: "Strong walls", locked: false },
  pull: { label: "Pull set", variant: "Pull buoy", reps: 6, distance: 100, stroke: "Free", interval: "1:35", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 6, equipment: ["Pull buoy"], startMethod: "Push", breathingPattern: "Every 3", skillFocus: "Early vertical forearm", missLimit: 0, notes: "Long line and early catch", locked: false },
  aerobic: { label: "Aerobic endurance", variant: "Cruise intervals", reps: 6, distance: 200, stroke: "Free", interval: "3:00", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 6, equipment: [], startMethod: "Push", breathingPattern: "Normal", skillFocus: "Even sustainable pace", missLimit: 0, notes: "Hold form throughout", locked: false },
  threshold: { label: "Threshold pace", variant: "Pace hold", reps: 8, distance: 100, stroke: "Free", interval: "1:25", intervalMode: "send-off", targetTime: "1:12", restSeconds: 0, intensity: 8, equipment: [], startMethod: "Push", breathingPattern: "Normal", skillFocus: "Controlled high effort", missLimit: 0, notes: "Hold pace with controlled rest", locked: false },
  sprint: { label: "Maximum speed", variant: "25 m sprint", reps: 8, distance: 25, stroke: "Free", interval: "0:45", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 10, equipment: [], startMethod: "Push", breathingPattern: "No breath", skillFocus: "Speed with perfect mechanics", missLimit: 0, notes: "Full speed, perfect breakout", locked: false },
  "race-pace": { label: "Race-pace work", variant: "100 race pace", reps: 12, distance: 50, stroke: "Free", interval: "1:00", intervalMode: "send-off", targetTime: "0:28", restSeconds: 0, intensity: 9, equipment: [], startMethod: "Push", breathingPattern: "Race pattern", skillFocus: "Target race split", missLimit: 0, notes: "Record every repetition", locked: false },
  lactate: { label: "Lactate quality", variant: "Lactate production", reps: 4, distance: 50, stroke: "Choice", interval: "3:00", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 10, equipment: [], startMethod: "Dive", breathingPattern: "Race pattern", skillFocus: "Maximum quality", missLimit: 0, notes: "Full recovery between reps", locked: false },
  USRPT: { label: "USRPT-style pace", variant: "25 pace repeats", reps: 20, distance: 25, stroke: "Free", interval: "0:30", intervalMode: "send-off", targetTime: "0:14", restSeconds: 0, intensity: 9, equipment: [], startMethod: "Push", breathingPattern: "Race pattern", skillFocus: "Repeat exact race pace", missLimit: 3, notes: "Stop after coach-defined misses", locked: false },
  "test-set": { label: "Test set", variant: "Timed benchmark", reps: 1, distance: 400, stroke: "Free", interval: "8:00", intervalMode: "target-time", targetTime: "5:00", restSeconds: 0, intensity: 9, equipment: [], startMethod: "Dive", breathingPattern: "Race pattern", skillFocus: "Benchmark pacing", missLimit: 0, notes: "Record splits and stroke count", locked: false },
  recovery: { label: "Easy recovery", variant: "Easy swim", reps: 1, distance: 300, stroke: "Choice", interval: "6:00", intervalMode: "send-off", targetTime: "", restSeconds: 0, intensity: 2, equipment: [], startMethod: "Push", breathingPattern: "Normal", skillFocus: "Relax and reset", missLimit: 0, notes: "Easy and relaxed", locked: false },
};

export function createSetNode(blockType: SwimBlockType, patch: Partial<StudioSetNode> = {}): StudioSetNode {
  return { id: uid("set"), kind: "set", blockType, ...setDefaults[blockType], ...patch };
}

const preset = (id: string, category: string, label: string, description: string, factory: () => StudioNode): PalettePreset => ({ id, category, label, description, factory });

export const PALETTE_PRESETS: PalettePreset[] = [
  preset("section", "Structure", "Section", "Group warm-up, pre-set, main set or cooldown", () => ({ id: uid("section"), kind: "section", title: "New section", purpose: "", pointsOfPerformance: "", children: [], locked: false })),
  preset("coach-note", "Structure", "Coach note", "Add deck instructions without changing calculations", () => ({ id: uid("note"), kind: "note", label: "Coach note", text: "Add instruction, transition or safety cue here.", locked: false })),

  preset("general-warmup", "Warm-up", "General warm-up", "Choice swimming with progressive effort", () => createSetNode("warm-up")),
  preset("stroke-warmup", "Warm-up", "Stroke warm-up", "Prepare one stroke with technique cues", () => createSetNode("warm-up", { label: "Stroke warm-up", variant: "Stroke-specific", stroke: "Free", distance: 500, notes: "Mix swim, kick and drill" })),
  preset("im-warmup", "Warm-up", "IM warm-up", "Prepare all four strokes and transitions", () => createSetNode("warm-up", { label: "IM warm-up", variant: "IM", stroke: "IM Order", distance: 600, notes: "50 swim / 50 drill by stroke" })),
  preset("progressive-warmup", "Warm-up", "Progressive warm-up", "Build speed through the block", () => createSetNode("warm-up", { label: "Progressive warm-up", variant: "Progressive", reps: 4, distance: 100, interval: "1:40", notes: "Descend 1–4" })),
  preset("activation-swim", "Warm-up", "Activation swim", "Short builds before quality work", () => createSetNode("warm-up", { label: "Activation swim", variant: "Activation", reps: 8, distance: 25, interval: "0:35", intensity: 6, notes: "12.5 easy + 12.5 fast" })),

  preset("free-drill", "Skills", "Freestyle drill", "Catch, rotation and body-line work", () => createSetNode("drill")),
  preset("stroke-drill", "Skills", "Stroke drill", "Technique block for fly, back or breast", () => createSetNode("drill", { label: "Stroke drill", variant: "Stroke-specific", stroke: "Choice", equipment: [], notes: "Coach selects drill and cue" })),
  preset("scull", "Skills", "Sculling", "Feel for water and catch position", () => createSetNode("drill", { label: "Sculling progression", variant: "Scull", reps: 8, distance: 25, interval: "0:40", equipment: ["Snorkel"], skillFocus: "Pressure on forearms" })),
  preset("underwater", "Skills", "Underwater / breakout", "Streamline, dolphin kick and breakout", () => createSetNode("underwater")),
  preset("turns", "Skills", "Turn skill", "Approach, rotation, push-off and breakout", () => createSetNode("drill", { label: "Turn skill", variant: "Turns", reps: 8, distance: 25, interval: "0:45", skillFocus: "Fast approach and tight rotation", notes: "Start 12.5 m from wall" })),

  preset("flutter-kick", "Kick & Pull", "Flutter kick", "Board or streamline flutter kick", () => createSetNode("kick", { label: "Flutter kick", variant: "Flutter", stroke: "Free" })),
  preset("dolphin-kick", "Kick & Pull", "Dolphin kick", "Surface or underwater dolphin kick", () => createSetNode("kick", { label: "Dolphin kick", variant: "Dolphin", stroke: "Fly", equipment: ["Fins"], notes: "Alternate back and streamline" })),
  preset("vertical-kick", "Kick & Pull", "Vertical kick", "Timed power and body-position work", () => createSetNode("kick", { label: "Vertical kick", variant: "Vertical", reps: 6, distance: 0, interval: "0:45", intervalMode: "rest", restSeconds: 20, notes: "20 sec work + 25 sec reset" })),
  preset("pull-buoy", "Kick & Pull", "Pull buoy", "Aerobic pull with body-line focus", () => createSetNode("pull")),
  preset("paddles-pull", "Kick & Pull", "Paddles pull", "Strength-endurance pull", () => createSetNode("pull", { label: "Paddles pull", variant: "Paddles", equipment: ["Pull buoy", "Paddles"], intensity: 7 })),

  preset("cruise", "Aerobic", "Cruise intervals", "Repeatable aerobic pace", () => createSetNode("aerobic")),
  preset("long-aerobic", "Aerobic", "Long aerobic", "Continuous or long-repeat endurance", () => createSetNode("aerobic", { label: "Long aerobic set", variant: "Long repeats", reps: 3, distance: 400, interval: "6:00" })),
  preset("negative-split", "Aerobic", "Negative split", "Second half faster than first", () => createSetNode("aerobic", { label: "Negative-split aerobic", variant: "Negative split", reps: 4, distance: 200, notes: "Second 100 faster than first" })),
  preset("descend-aerobic", "Aerobic", "Descending set", "Each repetition becomes faster", () => createSetNode("aerobic", { label: "Descend aerobic", variant: "Descend", reps: 4, distance: 200, notes: "Descend 1–4" })),
  preset("build-aerobic", "Aerobic", "Build set", "Increase speed within every repetition", () => createSetNode("aerobic", { label: "Build aerobic", variant: "Build", reps: 8, distance: 100, notes: "Build by 25" })),

  preset("css-threshold", "Threshold", "CSS threshold", "Threshold work around coach-defined CSS", () => createSetNode("threshold", { variant: "CSS-style", label: "CSS threshold" })),
  preset("broken-threshold", "Threshold", "Broken threshold", "Long threshold work split into parts", () => createSetNode("threshold", { label: "Broken threshold", variant: "Broken", reps: 4, distance: 200, interval: "3:00", notes: "50 easy between rounds" })),
  preset("pace-hold", "Threshold", "Pace hold", "Hold target time across repetitions", () => createSetNode("threshold")),
  preset("threshold-test", "Threshold", "Threshold test", "Benchmark sustainable pace", () => createSetNode("test-set", { label: "Threshold test set", variant: "CSS test", reps: 2, distance: 400, interval: "10:00", notes: "Record 400 and 200 times" })),

  preset("25-sprint", "Speed", "25 sprint", "Maximum speed from a push", () => createSetNode("sprint")),
  preset("breakout-sprint", "Speed", "Breakout sprint", "15 m acceleration and breakout", () => createSetNode("sprint", { label: "Breakout sprint", variant: "15 m breakout", distance: 15, startMethod: "Push", equipment: ["Fins"] })),
  preset("dive-sprint", "Speed", "Dive sprint", "Race start and maximum acceleration", () => createSetNode("sprint", { label: "Dive sprint", variant: "Dive", reps: 6, distance: 25, interval: "1:30", startMethod: "Dive" })),
  preset("speed-endurance", "Speed", "Speed endurance", "Maintain near-max speed for longer reps", () => createSetNode("sprint", { label: "Speed endurance", variant: "50 speed endurance", reps: 6, distance: 50, interval: "2:00", breathingPattern: "Race pattern" })),

  preset("50-race", "Race pace", "50 race pace", "Short target splits for 50 events", () => createSetNode("race-pace", { label: "50 race pace", variant: "50 race pace", distance: 25, targetTime: "0:13", interval: "1:00" })),
  preset("100-race", "Race pace", "100 race pace", "Target splits for 100 events", () => createSetNode("race-pace")),
  preset("200-race", "Race pace", "200 race pace", "Repeatable target splits for 200 events", () => createSetNode("race-pace", { label: "200 race pace", variant: "200 race pace", reps: 8, distance: 50, targetTime: "0:32", interval: "1:10", intensity: 8 })),
  preset("broken-race", "Race pace", "Broken race", "Race distance split by planned recovery", () => createSetNode("race-pace", { label: "Broken race", variant: "Broken swim", reps: 4, distance: 50, intervalMode: "rest", restSeconds: 10, interval: "0:45", notes: "Add splits for full race time" })),
  preset("target-split", "Race pace", "Target split set", "Explicit target time for every repetition", () => createSetNode("race-pace", { label: "Target split set", variant: "Target split", intervalMode: "target-time" })),

  preset("lactate-production", "Lactate", "Lactate production", "Very high quality with full recovery", () => createSetNode("lactate")),
  preset("lactate-tolerance", "Lactate", "Lactate tolerance", "Maintain quality under accumulated fatigue", () => createSetNode("lactate", { label: "Lactate tolerance", variant: "Tolerance", reps: 6, distance: 50, interval: "2:00" })),
  preset("high-rest-speed", "Lactate", "High-rest speed", "Max quality and long rest", () => createSetNode("lactate", { label: "High-rest speed", variant: "High rest", reps: 6, distance: 25, interval: "2:00" })),

  preset("usrpt-25", "USRPT", "USRPT 25s", "25 pace repeats with miss counter", () => createSetNode("USRPT")),
  preset("usrpt-50", "USRPT", "USRPT 50s", "50 pace repeats with coach-defined failure rule", () => createSetNode("USRPT", { label: "USRPT-style 50s", variant: "50 pace repeats", reps: 16, distance: 50, interval: "0:55", targetTime: "0:31" })),

  preset("easy-swim", "Recovery", "Easy swim", "Low-intensity active recovery", () => createSetNode("recovery")),
  preset("drill-recovery", "Recovery", "Drill recovery", "Easy technique between hard rounds", () => createSetNode("recovery", { label: "Drill recovery", variant: "Drill recovery", reps: 4, distance: 50, interval: "1:10", intensity: 2, notes: "Relaxed skill reset" })),
  preset("cooldown", "Recovery", "Cooldown", "Close the practice and reset technique", () => createSetNode("recovery", { label: "Cooldown", variant: "Cooldown", distance: 400 })),

  // Expanded coaching library - reusable building blocks inspired by common competitive-swimming structures.
  preset("skips-warmup", "Warm-up", "SKIPS warm-up", "Swim, kick, IM, pull and skill rotation", () => createSetNode("warm-up", { label: "SKIPS warm-up", variant: "SKIPS", reps: 5, distance: 100, stroke: "Choice", interval: "1:50", notes: "100 swim / kick / IM / pull / skill" })),
  preset("meet-warmup", "Warm-up", "Meet warm-up", "Race-day activation with starts and pace", () => createSetNode("warm-up", { label: "Meet warm-up", variant: "Competition", reps: 1, distance: 900, stroke: "Choice", interval: "18:00", intensity: 5, notes: "Easy swim, drill, build, pace, starts and easy reset" })),
  preset("pre-race-activation", "Warm-up", "Pre-race activation", "Short quality primer before race-pace work", () => createSetNode("warm-up", { label: "Pre-race activation", variant: "Primer", reps: 8, distance: 25, stroke: "Choice", interval: "0:40", intensity: 7, notes: "Odds build; evens breakout to 15m" })),
  preset("choice-rotation-warmup", "Warm-up", "Choice rotation", "Rotate swim, kick, pull and drill", () => createSetNode("warm-up", { label: "Choice rotation warm-up", variant: "Rotation", reps: 4, distance: 150, stroke: "Choice", interval: "2:40", notes: "50 swim + 50 kick + 50 drill/pull" })),

  preset("catch-up-drill", "Skills", "Catch-up drill", "Front-quadrant timing and line", () => createSetNode("drill", { label: "Catch-up drill", variant: "Catch-up", reps: 8, distance: 50, stroke: "Free", interval: "1:05", equipment: [], skillFocus: "Long line; patient lead hand", notes: "25 catch-up + 25 swim" })),
  preset("fingertip-drag", "Skills", "Fingertip drag", "Relaxed recovery and high elbow", () => createSetNode("drill", { label: "Fingertip drag", variant: "Recovery drill", reps: 8, distance: 50, stroke: "Free", interval: "1:00", equipment: [], skillFocus: "Relaxed recovery; clean hand entry", notes: "Odds drill, evens swim" })),
  preset("six-kick-switch", "Skills", "6-kick switch", "Rotation, balance and kick timing", () => createSetNode("drill", { label: "6-kick switch", variant: "Rotation", reps: 8, distance: 50, stroke: "Free", interval: "1:10", equipment: ["Fins"], skillFocus: "Stable side line and fast switch", notes: "Six kicks per side" })),
  preset("single-arm-fly", "Skills", "Single-arm fly", "Body rhythm and catch timing", () => createSetNode("drill", { label: "Single-arm butterfly", variant: "Fly timing", reps: 8, distance: 25, stroke: "Fly", interval: "0:40", equipment: [], skillFocus: "Chest press and relaxed recovery", notes: "Alternate arms by 25" })),
  preset("breast-timing-drill", "Skills", "Breast timing drill", "Kick, glide and pull timing", () => createSetNode("drill", { label: "Breaststroke timing", variant: "2 kicks 1 pull", reps: 8, distance: 50, stroke: "Breast", interval: "1:15", equipment: [], skillFocus: "Finish kick before next pull", notes: "2 kicks + 1 pull" })),
  preset("back-rotation-drill", "Skills", "Back rotation drill", "Hip-led rotation and entry line", () => createSetNode("drill", { label: "Backstroke rotation", variant: "6-kick switch", reps: 8, distance: 50, stroke: "Back", interval: "1:10", equipment: ["Fins"], skillFocus: "Rotate from hips; pinky entry", notes: "Six kicks each side" })),
  preset("dog-paddle-catch", "Skills", "Dog paddle catch", "Early vertical forearm and pressure", () => createSetNode("drill", { label: "Dog paddle catch", variant: "EVF", reps: 8, distance: 25, stroke: "Free", interval: "0:40", equipment: ["Snorkel"], skillFocus: "Hold water with forearm", notes: "No recovery above water" })),
  preset("im-transition", "Skills", "IM transitions", "Turn and breakout links between strokes", () => createSetNode("drill", { label: "IM transition skills", variant: "Transitions", reps: 8, distance: 50, stroke: "IM Order", interval: "1:15", equipment: [], skillFocus: "Fast legal transition and breakout", notes: "25 into wall + 25 out" })),
  preset("stroke-count", "Skills", "Stroke-count challenge", "Maintain speed with fewer strokes", () => createSetNode("drill", { label: "Stroke-count challenge", variant: "DPS", reps: 12, distance: 50, stroke: "Free", interval: "1:00", equipment: [], intensity: 6, skillFocus: "Hold pace and reduce stroke count", notes: "Cycle baseline, -1 stroke, -2 strokes" })),

  preset("breast-kick", "Kick & Pull", "Breaststroke kick", "Timing and propulsion for breaststroke", () => createSetNode("kick", { label: "Breaststroke kick", variant: "Breast kick", stroke: "Breast", reps: 8, distance: 50, interval: "1:15", equipment: ["Kickboard"], notes: "Fast heels; finish feet together" })),
  preset("back-kick", "Kick & Pull", "Backstroke kick", "Body line and kick tempo", () => createSetNode("kick", { label: "Backstroke kick", variant: "Back kick", stroke: "Back", reps: 8, distance: 50, interval: "1:05", equipment: [], notes: "Streamline or arms at side" })),
  preset("streamline-kick", "Kick & Pull", "Streamline kick", "No-board kick with race body line", () => createSetNode("kick", { label: "Streamline kick", variant: "No-board", reps: 12, distance: 25, stroke: "Choice", interval: "0:40", equipment: ["Fins"], notes: "Tight line; fast breakout" })),
  preset("vertical-to-sprint", "Kick & Pull", "Vertical kick + sprint", "Power contrast from vertical work to speed", () => ({ id: uid("repeat"), kind: "repeat", label: "Vertical kick to sprint", rounds: 6, children: [createSetNode("kick", { label: "Vertical kick", reps: 1, distance: 0, interval: "0:30", intervalMode: "rest", restSeconds: 10, notes: "20 sec max vertical kick" }), createSetNode("sprint", { label: "Kick-to-swim sprint", reps: 1, distance: 25, interval: "0:45", notes: "Explode off wall" })], locked: false })),
  preset("band-only-pull", "Kick & Pull", "Band-only pull", "Body line and catch without buoy", () => createSetNode("pull", { label: "Band-only pull", variant: "Band only", reps: 8, distance: 50, interval: "1:05", equipment: ["Band"], intensity: 7, notes: "Keep hips high" })),
  preset("dps-pull", "Kick & Pull", "DPS pull", "Distance per stroke under load", () => createSetNode("pull", { label: "Distance-per-stroke pull", variant: "DPS", reps: 8, distance: 100, interval: "1:35", equipment: ["Pull buoy", "Paddles", "Snorkel"], notes: "Count strokes; hold pace" })),
  preset("pull-threshold", "Kick & Pull", "Threshold pull", "Sustained pull at threshold", () => createSetNode("pull", { label: "Threshold pull", variant: "Threshold", reps: 10, distance: 100, interval: "1:30", equipment: ["Pull buoy", "Paddles"], intensity: 8, targetTime: "1:18", notes: "Stable catch under fatigue" })),
  preset("resisted-kick", "Kick & Pull", "Resisted kick", "Power kick with drag or tether", () => createSetNode("kick", { label: "Resisted kick", variant: "Resistance", reps: 8, distance: 25, interval: "1:00", equipment: ["Parachute"], intensity: 9, notes: "Maximum kick tempo" })),

  preset("aerobic-pyramid", "Aerobic", "Aerobic pyramid", "Build distance up and down", () => ({ id: uid("section"), kind: "section", title: "Aerobic pyramid", purpose: "Pacing discipline through changing distances", pointsOfPerformance: "Even pace; efficient walls; controlled breathing", children: [createSetNode("aerobic", { reps: 1, distance: 100, interval: "1:30" }), createSetNode("aerobic", { reps: 1, distance: 200, interval: "3:00" }), createSetNode("aerobic", { reps: 1, distance: 300, interval: "4:30" }), createSetNode("aerobic", { reps: 1, distance: 400, interval: "6:00" }), createSetNode("aerobic", { reps: 1, distance: 300, interval: "4:30" }), createSetNode("aerobic", { reps: 1, distance: 200, interval: "3:00" }), createSetNode("aerobic", { reps: 1, distance: 100, interval: "1:30" })], locked: false })),
  preset("descending-ladder", "Aerobic", "Descending ladder", "500 to 100 on a fixed base pace", () => ({ id: uid("section"), kind: "section", title: "Descending aerobic ladder", purpose: "Hold the same base pace as distance falls", pointsOfPerformance: "Consistent pace per 100; faster final 100", children: [500,400,300,200,100].map((distance) => createSetNode("aerobic", { reps: 1, distance, interval: formatSeconds(distance / 100 * 90), notes: "Base 1:30 per 100" })), locked: false })),
  preset("im-aerobic-ladder", "Aerobic", "IM aerobic ladder", "Medley pacing with active freestyle resets", () => ({ id: uid("section"), kind: "section", title: "IM aerobic ladder", purpose: "Build medley endurance and transitions", pointsOfPerformance: "Legal turns; control first half; descend each group", children: [createSetNode("aerobic", { reps: 2, distance: 100, stroke: "IM", interval: "1:45", notes: "Descend 1-2" }), createSetNode("recovery", { reps: 1, distance: 100, stroke: "Free", interval: "1:30" }), createSetNode("aerobic", { reps: 3, distance: 100, stroke: "IM", interval: "1:45", notes: "Descend 1-3" }), createSetNode("recovery", { reps: 1, distance: 100, stroke: "Free", interval: "1:30" }), createSetNode("aerobic", { reps: 4, distance: 100, stroke: "IM", interval: "1:45", notes: "Descend 1-4" })], locked: false })),
  preset("red-mist-100s", "Aerobic", "Red-mist 100s", "Long sequence of controlled 100s", () => createSetNode("aerobic", { label: "Red-mist 100s", variant: "Long sequence", reps: 30, distance: 100, interval: "1:30", intensity: 7, notes: "Hold narrow pace range; adjust interval by lane" })),
  preset("bilateral-aerobic", "Aerobic", "Bilateral aerobic", "Aerobic freestyle with breathing pattern changes", () => createSetNode("aerobic", { label: "Bilateral breathing aerobic", variant: "Breathing control", reps: 12, distance: 100, interval: "1:35", breathingPattern: "3/5/7", notes: "25 breathe 3 / 25 breathe 5 / 25 breathe 7 / 25 normal" })),
  preset("pull-swim-ladder", "Aerobic", "Pull-swim ladder", "Alternate pull strength and swim rhythm", () => ({ id: uid("repeat"), kind: "repeat", label: "Pull-swim aerobic ladder", rounds: 3, children: [createSetNode("pull", { reps: 2, distance: 200, interval: "3:00" }), createSetNode("aerobic", { reps: 4, distance: 100, interval: "1:25", notes: "Negative split" })], locked: false })),
  preset("open-water-sighting", "Aerobic", "Open-water sighting", "Sighting and rhythm practice", () => createSetNode("aerobic", { label: "Open-water sighting", variant: "Sighting", reps: 8, distance: 100, interval: "1:45", notes: "Sight twice per 25; return immediately to line" })),

  preset("20x100-threshold", "Threshold", "20 x 100 threshold", "Classic sustained threshold volume", () => createSetNode("threshold", { label: "20 x 100 threshold", variant: "Sustained", reps: 20, distance: 100, interval: "1:25", targetTime: "1:15", notes: "Hold target with 8-12 sec rest" })),
  preset("broken-400-threshold", "Threshold", "Broken 400s", "Threshold 400s split into 100s", () => ({ id: uid("repeat"), kind: "repeat", label: "Broken 400 threshold", rounds: 4, children: [createSetNode("threshold", { reps: 4, distance: 100, interval: "1:20", targetTime: "1:12" }), createSetNode("recovery", { reps: 1, distance: 100, interval: "2:00", notes: "Easy between rounds" })], locked: false })),
  preset("descending-rest-pace", "Threshold", "Descending-rest pace", "Hold pace as send-off tightens", () => ({ id: uid("section"), kind: "section", title: "Descending-rest pace challenge", purpose: "Maintain target pace with progressively less recovery", pointsOfPerformance: "Same speed each rep; protect stroke length", children: ["1:30","1:20","1:10","1:00","0:50","0:40"].map((interval) => createSetNode("threshold", { reps: 1, distance: 50, interval, targetTime: "0:29", notes: "100 race-pace effort" })), locked: false })),
  preset("threshold-200s", "Threshold", "Threshold 200s", "Longer repeats at sustainable hard pace", () => createSetNode("threshold", { label: "Threshold 200s", variant: "200 pace", reps: 8, distance: 200, interval: "2:50", targetTime: "2:34", notes: "Even split within 3 sec" })),
  preset("aerobic-power-50s", "Threshold", "Aerobic-power 50s", "Fast 50s with short controlled rest", () => createSetNode("threshold", { label: "Aerobic-power 50s", variant: "EN2+", reps: 20, distance: 50, interval: "0:45", targetTime: "0:34", intensity: 8, notes: "Hold technique under pressure" })),
  preset("css-mixed", "Threshold", "CSS mixed set", "100/200 mix around CSS", () => ({ id: uid("repeat"), kind: "repeat", label: "CSS mixed round", rounds: 4, children: [createSetNode("threshold", { reps: 1, distance: 200, interval: "3:00", notes: "CSS + 3 sec/100" }), createSetNode("threshold", { reps: 2, distance: 100, interval: "1:25", notes: "CSS pace" }), createSetNode("recovery", { reps: 1, distance: 50, interval: "1:00" })], locked: false })),

  preset("12-5-blast", "Speed", "12.5 blast", "Explosive half-length sprint", () => createSetNode("sprint", { label: "12.5 m blast", variant: "12.5 speed", reps: 12, distance: 12.5, interval: "0:35", notes: "Easy to wall after breakout" })),
  preset("overspeed-fins", "Speed", "Overspeed fins", "Race-rate sprint with fins", () => createSetNode("sprint", { label: "Overspeed with fins", variant: "Overspeed", reps: 12, distance: 25, interval: "0:45", equipment: ["Fins"], intensity: 10, notes: "Faster than race tempo; perfect line" })),
  preset("resisted-sprint", "Speed", "Resisted sprint", "Short resisted power work", () => createSetNode("sprint", { label: "Resisted sprint", variant: "Resistance", reps: 8, distance: 15, interval: "1:15", equipment: ["Parachute"], intensity: 10, notes: "Max force; remove resistance if form fails" })),
  preset("turn-sprint", "Speed", "Turn sprint", "Fast-in, fast-out turn quality", () => createSetNode("sprint", { label: "Turn sprint", variant: "Turn speed", reps: 12, distance: 25, interval: "0:45", notes: "Start 12.5m out; sprint through 7.5m breakout" })),
  preset("dive-25-easy", "Speed", "Dive 25 + easy", "Race start paired with recovery", () => ({ id: uid("repeat"), kind: "repeat", label: "Dive sprint + reset", rounds: 8, children: [createSetNode("sprint", { reps: 1, distance: 25, interval: "1:00", startMethod: "Dive", notes: "Time to 15m and finish" }), createSetNode("recovery", { reps: 1, distance: 50, interval: "1:10", notes: "Easy reset" })], locked: false })),
  preset("relay-takeover", "Speed", "Relay takeovers", "Exchange timing and breakout speed", () => createSetNode("sprint", { label: "Relay takeover sprint", variant: "Relay", reps: 8, distance: 25, interval: "1:00", startMethod: "Dive", notes: "Record exchange time; sprint to 15m" })),
  preset("closing-speed", "Speed", "Closing-speed 75s", "Finish every repeat at maximum speed", () => createSetNode("sprint", { label: "Closing-speed 75s", variant: "Fast finish", reps: 8, distance: 75, interval: "1:45", intensity: 9, notes: "50 controlled + 25 all-out" })),

  preset("400-race", "Race pace", "400/500 race pace", "Target 100 splits for middle distance", () => createSetNode("race-pace", { label: "400/500 race pace", variant: "400 pace", reps: 12, distance: 100, interval: "1:40", targetTime: "1:08", intensity: 8, notes: "Hold goal-race rhythm" })),
  preset("800-race", "Race pace", "800/1000 race pace", "Long race-pace repeats", () => createSetNode("race-pace", { label: "800/1000 race pace", variant: "Distance pace", reps: 8, distance: 200, interval: "2:55", targetTime: "2:35", intensity: 8, notes: "Even splits and fast turns" })),
  preset("1500-race", "Race pace", "1500/1650 race pace", "Distance event pace control", () => createSetNode("race-pace", { label: "1500/1650 race pace", variant: "Mile pace", reps: 15, distance: 100, interval: "1:30", targetTime: "1:15", intensity: 8, notes: "Hold stroke count and breathing plan" })),
  preset("broken-100", "Race pace", "Broken 100", "Four 25s with short planned rest", () => createSetNode("race-pace", { label: "Broken 100", variant: "Broken 100", reps: 4, distance: 25, intervalMode: "rest", restSeconds: 10, interval: "0:30", targetTime: "0:14", intensity: 10, notes: "Add splits plus rest" })),
  preset("broken-200", "Race pace", "Broken 200", "Race 200 assembled from quality segments", () => ({ id: uid("repeat"), kind: "repeat", label: "Broken 200", rounds: 2, children: [createSetNode("race-pace", { reps: 4, distance: 50, intervalMode: "rest", restSeconds: 15, interval: "0:50", targetTime: "0:30" }), createSetNode("recovery", { reps: 1, distance: 100, interval: "2:00" })], locked: false })),
  preset("race-simulation-75", "Race pace", "Race-simulation 75", "Start, middle and finish skills", () => createSetNode("race-pace", { label: "Race-simulation 75", variant: "75 simulation", reps: 6, distance: 75, interval: "2:30", targetTime: "0:45", startMethod: "Dive", intensity: 10, notes: "Race first 25, control middle, close hard" })),
  preset("pace-25s", "Race pace", "Pace 25s", "High-precision race split practice", () => createSetNode("race-pace", { label: "Race-pace 25s", variant: "Pace 25", reps: 24, distance: 25, interval: "0:35", targetTime: "0:14", notes: "Hit exact split; record misses" })),

  preset("lactate-clearance", "Lactate", "Lactate clearance", "Fast work followed by aerobic clearance", () => ({ id: uid("repeat"), kind: "repeat", label: "Lactate production + clearance", rounds: 4, children: [createSetNode("lactate", { reps: 1, distance: 50, interval: "2:30", startMethod: "Dive" }), createSetNode("aerobic", { reps: 1, distance: 200, interval: "3:00", intensity: 6, notes: "Strong aerobic clearance" }), createSetNode("recovery", { reps: 1, distance: 100, interval: "2:00" })], locked: false })),
  preset("kick-lactate-spike", "Lactate", "Kick lactate spike", "Fast kicking alternated with strong swimming", () => ({ id: uid("section"), kind: "section", title: "Kick lactate spike", purpose: "Load the legs, then swim through fatigue", pointsOfPerformance: "Max kick tempo; preserve body line when swimming", children: [createSetNode("kick", { reps: 4, distance: 25, interval: "0:35", intensity: 10, notes: "Fast kick" }), createSetNode("lactate", { reps: 1, distance: 100, interval: "2:00", intensity: 9, notes: "Strong swim" }), createSetNode("kick", { reps: 4, distance: 25, interval: "0:40", intensity: 10 }), createSetNode("lactate", { reps: 1, distance: 200, interval: "3:30", intensity: 9 })], locked: false })),
  preset("broken-lactate", "Lactate", "Broken lactate swim", "Race distance with short recovery windows", () => createSetNode("lactate", { label: "Broken lactate swim", variant: "Broken", reps: 4, distance: 50, intervalMode: "rest", restSeconds: 20, interval: "0:55", targetTime: "0:29", notes: "Full-race effort across all segments" })),

  preset("usrpt-75", "USRPT", "USRPT-style 75s", "Longer race-pace repeats with miss rule", () => createSetNode("USRPT", { label: "USRPT-style 75s", variant: "75 pace repeats", reps: 12, distance: 75, interval: "1:20", targetTime: "0:52", missLimit: 3 })),
  preset("usrpt-100", "USRPT", "USRPT-style 100s", "100 pace repetitions with quality cutoff", () => createSetNode("USRPT", { label: "USRPT-style 100s", variant: "100 pace repeats", reps: 10, distance: 100, interval: "1:35", targetTime: "1:12", missLimit: 2 })),
  preset("usrpt-reset", "USRPT", "USRPT failure reset", "Pace repetitions with an easy reset after misses", () => ({ id: uid("condition"), kind: "condition", label: "USRPT miss rule", metric: "consecutive misses", comparator: ">=", threshold: "2", action: "skip one repetition and reset", elseAction: "continue at target pace", children: [createSetNode("USRPT")], locked: false })),

  preset("t30-test", "Threshold", "T30 test", "Thirty-minute continuous threshold benchmark", () => createSetNode("test-set", { label: "T30 threshold test", variant: "30-minute", reps: 1, distance: 0, interval: "30:00", intervalMode: "open", targetTime: "30:00", notes: "Record distance, average pace and stroke count" })),
  preset("best-average-100s", "Threshold", "Best-average 100s", "High-quality repeatability benchmark", () => createSetNode("test-set", { label: "Best-average 100s", variant: "Best average", reps: 8, distance: 100, interval: "3:00", intensity: 10, notes: "Record all times; calculate average and range" })),
  preset("stroke-count-test", "Skills", "Stroke-count test", "Measure speed-efficiency trade-off", () => createSetNode("test-set", { label: "Stroke-count 50 test", variant: "Efficiency", reps: 6, distance: 50, interval: "2:00", intensity: 8, notes: "Record time and stroke count" })),

  preset("100-easy", "Recovery", "100 easy", "Quick reset between demanding rounds", () => createSetNode("recovery", { label: "100 easy reset", reps: 1, distance: 100, interval: "2:00" })),
  preset("200-easy", "Recovery", "200 easy", "Longer active recovery", () => createSetNode("recovery", { label: "200 easy recovery", reps: 1, distance: 200, interval: "4:00" })),
  preset("breathing-reset", "Recovery", "Breathing reset", "Easy swimming with controlled exhale", () => createSetNode("recovery", { label: "Breathing reset", reps: 4, distance: 50, interval: "1:10", breathingPattern: "Every 3", notes: "Long exhale; relaxed neck" })),
  preset("warmdown-ladder", "Recovery", "Warm-down ladder", "200-150-100-50 easy progression", () => ({ id: uid("section"), kind: "section", title: "Warm-down ladder", purpose: "Gradually lower effort and restore technique", pointsOfPerformance: "Long strokes; relaxed breathing; easy walls", children: [200,150,100,50].map((distance) => createSetNode("recovery", { reps: 1, distance, interval: formatSeconds(distance / 100 * 120) })) , locked: false })),

  preset("repeat", "Control", "Repeat", "Run nested blocks for multiple rounds", () => ({ id: uid("repeat"), kind: "repeat", label: "Repeat circuit", rounds: 2, children: [], locked: false })),
  preset("progress", "Control", "Progress / descend", "Change pace, distance, rest or repetitions by round", () => ({ id: uid("progress"), kind: "progress", label: "Progress each round", rounds: 4, mode: "descend", amount: 2, unit: "sec", children: [], locked: false })),
  preset("condition", "Control", "If / else", "React to pace misses, quality or technique", () => ({ id: uid("condition"), kind: "condition", label: "Quality decision", metric: "pace misses", comparator: ">=", threshold: "2", action: "increase recovery", elseAction: "continue as written", children: [], locked: false })),
  preset("equipment-branch", "Control", "Equipment branch", "Provide a substitution when equipment is unavailable", () => ({ id: uid("condition"), kind: "condition", label: "Equipment branch", metric: "equipment available", comparator: "=", threshold: "no paddles", action: "substitute sculling", elseAction: "use paddles", children: [], locked: false })),
  preset("quality-threshold", "Control", "Quality threshold", "Stop or modify when quality drops", () => ({ id: uid("condition"), kind: "condition", label: "Quality threshold", metric: "pace drop-off", comparator: ">", threshold: "5%", action: "stop the block", elseAction: "continue", children: [], locked: false })),
  preset("lane-branch", "Control", "Lane branch", "Create equivalent targets for three lanes", () => ({ id: uid("lane"), kind: "lane", label: "Three-lane adaptation", lanes: defaultLanes(), children: [], locked: false })),
  preset("time-cap", "Control", "Time cap", "Continue nested work until the time limit", () => ({ id: uid("timecap"), kind: "time-cap", label: "Time-capped block", minutes: 15, behavior: "finish-current-rep", children: [], locked: false })),
];

export function defaultLanes(): LaneRule[] {
  return [
    { id: uid("lane"), name: "Lane 1", targetPace: "Advanced", intervalAdjustmentSeconds: 0, repsPercent: 100, distancePercent: 100 },
    { id: uid("lane"), name: "Lane 2", targetPace: "Intermediate", intervalAdjustmentSeconds: 10, repsPercent: 100, distancePercent: 100 },
    { id: uid("lane"), name: "Lane 3", targetPace: "Developing", intervalAdjustmentSeconds: 20, repsPercent: 85, distancePercent: 100 },
  ];
}

export function createPaletteNode(paletteId: string): StudioNode {
  const found = PALETTE_PRESETS.find((item) => item.id === paletteId);
  return found ? found.factory() : createSetNode("aerobic");
}

export function cloneNode(node: StudioNode): StudioNode {
  const cloneRecursive = (source: StudioNode): StudioNode => {
    if (source.kind === "set") return { ...source, id: uid("set"), equipment: [...source.equipment] };
    if (source.kind === "note") return { ...source, id: uid("note") };
    if (source.kind === "lane") return { ...source, id: uid("lane"), lanes: source.lanes.map((lane) => ({ ...lane, id: uid("lane") })), children: source.children.map(cloneRecursive) };
    return { ...source, id: uid(source.kind.replace("-", "")), children: source.children.map(cloneRecursive) } as StudioNode;
  };
  return cloneRecursive(node);
}

function childrenOf(node: StudioNode): StudioNode[] {
  return node.kind === "set" || node.kind === "note" ? [] : node.children;
}

export function findNode(nodes: StudioNode[], id: string): StudioNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(childrenOf(node), id);
    if (found) return found;
  }
  return null;
}

export function containsNode(node: StudioNode, id: string): boolean {
  if (node.id === id) return true;
  return childrenOf(node).some((child) => containsNode(child, id));
}

export function updateNode(nodes: StudioNode[], id: string, updater: (node: StudioNode) => StudioNode): StudioNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.kind === "set" || node.kind === "note") return node;
    return { ...node, children: updateNode(node.children, id, updater) } as StudioNode;
  });
}

export function removeNode(nodes: StudioNode[], id: string): { nodes: StudioNode[]; removed: StudioNode | null } {
  let removed: StudioNode | null = null;
  const next: StudioNode[] = [];
  for (const node of nodes) {
    if (node.id === id) {
      removed = node;
      continue;
    }
    if (node.kind === "set" || node.kind === "note") {
      next.push(node);
      continue;
    }
    const childResult = removeNode(node.children, id);
    if (childResult.removed) removed = childResult.removed;
    next.push({ ...node, children: childResult.nodes } as StudioNode);
  }
  return { nodes: next, removed };
}

export function insertNode(nodes: StudioNode[], parentId: string | null, index: number, node: StudioNode): StudioNode[] {
  if (!parentId) {
    const copy = [...nodes];
    copy.splice(Math.max(0, Math.min(index, copy.length)), 0, node);
    return copy;
  }
  return nodes.map((current) => {
    if (current.id === parentId && current.kind !== "set" && current.kind !== "note") {
      const children = [...current.children];
      children.splice(Math.max(0, Math.min(index, children.length)), 0, node);
      return { ...current, children } as StudioNode;
    }
    if (current.kind === "set" || current.kind === "note") return current;
    return { ...current, children: insertNode(current.children, parentId, index, node) } as StudioNode;
  });
}

function emptyStats(): StudioStats & { durationSeconds: number; intensityWeight: number } {
  return { totalDistance: 0, estimatedDuration: 0, durationSeconds: 0, averageIntensity: 0, intensityWeight: 0, setCount: 0, highIntensityDistance: 0, recoveryDistance: 0, strokeDistribution: {}, typeDistribution: {}, equipment: [] };
}

function mergeStats(target: ReturnType<typeof emptyStats>, source: ReturnType<typeof emptyStats>, multiplier = 1) {
  target.totalDistance += source.totalDistance * multiplier;
  target.durationSeconds += source.durationSeconds * multiplier;
  target.intensityWeight += source.intensityWeight * multiplier;
  target.setCount += source.setCount * multiplier;
  target.highIntensityDistance += source.highIntensityDistance * multiplier;
  target.recoveryDistance += source.recoveryDistance * multiplier;
  Object.entries(source.strokeDistribution).forEach(([key, value]) => { target.strokeDistribution[key] = (target.strokeDistribution[key] || 0) + value * multiplier; });
  Object.entries(source.typeDistribution).forEach(([key, value]) => { target.typeDistribution[key] = (target.typeDistribution[key] || 0) + value * multiplier; });
  source.equipment.forEach((item) => { if (!target.equipment.includes(item)) target.equipment.push(item); });
}

function nodeStats(node: StudioNode): ReturnType<typeof emptyStats> {
  const stats = emptyStats();
  if (node.kind === "note") return stats;
  if (node.kind === "set") {
    const reps = Math.max(1, node.reps);
    const distance = Math.max(0, node.distance) * reps;
    const intervalSec = node.intervalMode === "rest"
      ? Math.max(parseInterval(node.targetTime), parseInterval(node.interval)) + Math.max(0, node.restSeconds)
      : Math.max(parseInterval(node.interval), parseInterval(node.targetTime));
    stats.totalDistance = distance;
    stats.durationSeconds = intervalSec * reps;
    stats.intensityWeight = Math.max(1, Math.min(10, node.intensity)) * Math.max(1, distance || reps);
    stats.setCount = reps;
    stats.highIntensityDistance = node.intensity >= 8 ? distance : 0;
    stats.recoveryDistance = node.blockType === "recovery" || node.intensity <= 3 ? distance : 0;
    stats.strokeDistribution[node.stroke] = distance;
    stats.typeDistribution[node.blockType] = distance;
    stats.equipment = [...node.equipment];
    return stats;
  }

  const child = calculateRawStats(node.children);
  if (node.kind === "repeat") mergeStats(stats, child, Math.max(1, node.rounds));
  else if (node.kind === "progress") mergeStats(stats, child, Math.max(1, node.rounds));
  else if (node.kind === "time-cap") {
    const capSeconds = Math.max(1, node.minutes) * 60;
    const ratio = child.durationSeconds > 0 ? capSeconds / child.durationSeconds : 1;
    mergeStats(stats, child, ratio);
    stats.durationSeconds = capSeconds;
  } else mergeStats(stats, child, 1);
  return stats;
}

function calculateRawStats(nodes: StudioNode[]): ReturnType<typeof emptyStats> {
  const stats = emptyStats();
  nodes.forEach((node) => mergeStats(stats, nodeStats(node)));
  return stats;
}

export function calculateStats(nodes: StudioNode[]): StudioStats {
  const raw = calculateRawStats(nodes);
  return {
    totalDistance: Math.round(raw.totalDistance),
    estimatedDuration: Math.round(raw.durationSeconds / 60),
    averageIntensity: raw.totalDistance > 0 || raw.setCount > 0 ? Math.round((raw.intensityWeight / Math.max(1, raw.totalDistance || raw.setCount)) * 10) / 10 : 0,
    setCount: Math.round(raw.setCount),
    highIntensityDistance: Math.round(raw.highIntensityDistance),
    recoveryDistance: Math.round(raw.recoveryDistance),
    strokeDistribution: Object.fromEntries(Object.entries(raw.strokeDistribution).map(([key, value]) => [key, Math.round(value)])),
    typeDistribution: Object.fromEntries(Object.entries(raw.typeDistribution).map(([key, value]) => [key, Math.round(value)])),
    equipment: raw.equipment,
  };
}

export function validateWorkout(nodes: StudioNode[], targetMinutes: number, poolLength: PoolLength = 25): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const stats = calculateStats(nodes);
  const flatSets: StudioSetNode[] = [];
  const allNodes: StudioNode[] = [];
  const visit = (items: StudioNode[]) => {
    items.forEach((node) => {
      allNodes.push(node);
      if (node.kind === "set") flatSets.push(node);
      else if (node.kind !== "note") visit(node.children);
    });
  };
  visit(nodes);

  if (nodes.length === 0) return [{ id: "empty", severity: "info", message: "Drag a block into the scripts area to begin." }];
  if (!flatSets.some((set) => set.blockType === "warm-up")) issues.push({ id: "warmup", severity: "warning", message: "No warm-up block is included." });
  if (!flatSets.some((set) => set.blockType === "recovery")) issues.push({ id: "cooldown", severity: "warning", message: "No recovery or cooldown block is included." });
  if (targetMinutes > 0 && stats.estimatedDuration > targetMinutes) issues.push({ id: "duration", severity: "warning", message: `Estimated duration is ${stats.estimatedDuration - targetMinutes} min over the ${targetMinutes}-min booking.` });
  if (stats.totalDistance > 0 && stats.highIntensityDistance / stats.totalDistance > 0.4) issues.push({ id: "intensity-balance", severity: "info", message: "More than 40% of the distance is marked RPE 8–10. Confirm that this is intentional." });

  flatSets.forEach((set) => {
    const interval = parseInterval(set.interval);
    if (set.distance > 0 && interval <= 0 && set.intervalMode !== "open") issues.push({ id: `interval-${set.id}`, nodeId: set.id, severity: "warning", message: `${set.label}: enter a valid interval such as 1:30.` });
    if (set.reps <= 0 || set.distance < 0) issues.push({ id: `distance-${set.id}`, nodeId: set.id, severity: "warning", message: `${set.label}: repetitions must be positive and distance cannot be negative.` });
    if (set.distance > 0 && set.distance % poolLength !== 0 && ![12.5, 15].includes(set.distance)) issues.push({ id: `pool-${set.id}`, nodeId: set.id, severity: "info", message: `${set.label}: ${set.distance} is not a full ${poolLength}-length multiple. Confirm it is a partial-pool drill.` });
    if ((set.blockType === "sprint" || set.blockType === "lactate") && set.intensity < 8) issues.push({ id: `intensity-${set.id}`, nodeId: set.id, severity: "info", message: `${set.label}: this category normally uses a higher intensity; confirm the choice.` });
    if (set.blockType === "USRPT" && set.missLimit <= 0) issues.push({ id: `usrpt-${set.id}`, nodeId: set.id, severity: "warning", message: `${set.label}: add a coach-defined miss limit.` });
    if (set.intervalMode === "target-time" && parseInterval(set.targetTime) <= 0) issues.push({ id: `target-${set.id}`, nodeId: set.id, severity: "warning", message: `${set.label}: target-time mode needs a valid target time.` });
  });

  allNodes.forEach((node) => {
    if (node.kind === "repeat" && node.children.length === 0) issues.push({ id: `empty-${node.id}`, nodeId: node.id, severity: "info", message: `${node.label}: add blocks inside the repeat.` });
    if (node.kind === "progress" && node.children.length === 0) issues.push({ id: `empty-${node.id}`, nodeId: node.id, severity: "info", message: `${node.label}: add blocks to progress.` });
    if (node.kind === "time-cap" && node.minutes <= 0) issues.push({ id: `cap-${node.id}`, nodeId: node.id, severity: "warning", message: `${node.label}: time cap must be positive.` });
    if (node.kind === "lane" && node.lanes.length < 2) issues.push({ id: `lanes-${node.id}`, nodeId: node.id, severity: "warning", message: `${node.label}: add at least two lane variants.` });
  });

  return issues.length > 0 ? issues : [{ id: "clear", severity: "info", message: "All deterministic structure checks are clear." }];
}

function collectSets(items: StudioNode[], multiplier = 1): SwimSet[] {
  const output: SwimSet[] = [];
  items.forEach((node) => {
    if (node.kind === "set") {
      output.push({ id: node.id, reps: Math.max(1, Math.round(node.reps * multiplier)), distance: node.distance, stroke: node.stroke, interval: node.interval, type: node.blockType, equipment: [...node.equipment], intensity: node.intensity, notes: [node.notes, node.targetTime ? `Target ${node.targetTime}` : "", node.skillFocus].filter(Boolean).join(" · ") });
    } else if (node.kind === "note") {
      return;
    } else if (node.kind === "repeat" || node.kind === "progress") {
      output.push(...collectSets(node.children, multiplier * node.rounds));
    } else {
      output.push(...collectSets(node.children, multiplier));
    }
  });
  return output;
}

export function flattenToLegacyBlocks(nodes: StudioNode[]): WorkoutBlock[] {
  return nodes.map((node, index) => {
    if (node.kind === "section") return { id: node.id, title: node.title, repeatCount: 1, sets: collectSets(node.children) };
    if (node.kind === "note") return { id: node.id, title: node.label, repeatCount: 1, sets: [] };
    return { id: `legacy-${node.id}`, title: nodeLabel(node) || `Block ${index + 1}`, repeatCount: 1, sets: collectSets([node]) };
  });
}

export function nodeLabel(node: StudioNode): string {
  if (node.kind === "set") return node.label;
  if (node.kind === "section") return node.title;
  return node.label;
}

export function formatWorkoutText(nodes: StudioNode[], unit: PoolUnit = "m"): string {
  const lines: string[] = [];
  const visit = (items: StudioNode[], depth = 0) => {
    items.forEach((node) => {
      const pad = "  ".repeat(depth);
      if (node.kind === "set") {
        const distance = node.distance > 0 ? `${node.reps} × ${node.distance}${unit}` : `${node.reps} rounds`;
        const target = node.targetTime ? ` target ${node.targetTime}` : "";
        lines.push(`${pad}${distance} ${node.stroke} — ${node.label} @ ${node.interval}${target}`.trimEnd());
        if (node.notes) lines.push(`${pad}  Cue: ${node.notes}`);
      } else if (node.kind === "note") {
        lines.push(`${pad}NOTE — ${node.text}`);
      } else if (node.kind === "section") {
        lines.push(`${pad}${node.title.toUpperCase()}`);
        visit(node.children, depth + 1);
      } else if (node.kind === "repeat") {
        lines.push(`${pad}REPEAT ${node.rounds}× — ${node.label}`);
        visit(node.children, depth + 1);
      } else if (node.kind === "progress") {
        lines.push(`${pad}${node.mode.toUpperCase()} ${node.rounds} rounds — ${node.amount}${node.unit} each round`);
        visit(node.children, depth + 1);
      } else if (node.kind === "condition") {
        lines.push(`${pad}IF ${node.metric} ${node.comparator} ${node.threshold}, ${node.action}; ELSE ${node.elseAction}`);
        visit(node.children, depth + 1);
      } else if (node.kind === "time-cap") {
        lines.push(`${pad}TIME CAP ${node.minutes} min — ${node.behavior}`);
        visit(node.children, depth + 1);
      } else if (node.kind === "lane") {
        lines.push(`${pad}${node.label.toUpperCase()}`);
        node.lanes.forEach((lane) => lines.push(`${pad}  ${lane.name}: ${lane.targetPace}, interval ${lane.intervalAdjustmentSeconds >= 0 ? "+" : ""}${lane.intervalAdjustmentSeconds}s, reps ${lane.repsPercent}%`));
        visit(node.children, depth + 1);
      }
    });
  };
  visit(nodes);
  return lines.join("\n");
}

export function starterWorkout(): StudioNode[] {
  return [
    { id: uid("section"), kind: "section", title: "Warm-up & skills", purpose: "Prepare technique and range", pointsOfPerformance: "Long line; quality turns; progressive effort", locked: false, children: [createPaletteNode("progressive-warmup"), createPaletteNode("free-drill")] },
    { id: uid("section"), kind: "section", title: "Main set", purpose: "Race pace and quality", pointsOfPerformance: "Hit target pace; protect technique; record misses", locked: false, children: [
      { id: uid("repeat"), kind: "repeat", label: "Race-pace circuit", rounds: 2, locked: false, children: [createPaletteNode("100-race"), createPaletteNode("easy-swim")] },
    ] },
    createPaletteNode("cooldown"),
  ];
}

/**
 * Parses fast, coach-style workout notation into structured Studio nodes.
 * Supported examples:
 *   # Main set
 *   8x50 Free @ 1:00 RPE 7 - descend 1-4
 *   Repeat 3x:
 *   4x25 Fly @ :40
 *   end
 *   Note: Focus on clean breakouts
 */
export function parseQuickWrite(input: string): StudioNode[] {
  const result: StudioNode[] = [];
  const containerStack: Array<{ node: StudioSectionNode | StudioRepeatNode; children: StudioNode[] }> = [];

  const currentChildren = () => containerStack.length ? containerStack[containerStack.length - 1].children : result;
  const pushNode = (node: StudioNode) => currentChildren().push(node);

  const normalizeStroke = (value?: string): string => {
    if (!value) return "Choice";
    const key = value.toLowerCase();
    if (["free", "freestyle", "fr"].includes(key)) return "Free";
    if (["back", "backstroke", "bk"].includes(key)) return "Back";
    if (["breast", "breaststroke", "br"].includes(key)) return "Breast";
    if (["fly", "butterfly", "fl"].includes(key)) return "Fly";
    if (["im", "individual medley"].includes(key)) return "IM";
    if (["choice", "ch"].includes(key)) return "Choice";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const inferType = (text: string): SwimBlockType => {
    const lower = text.toLowerCase();
    if (/warm.?up|activation/.test(lower)) return "warm-up";
    if (/drill|scull|technique|skill/.test(lower)) return "drill";
    if (/underwater|breakout|dolphin kick/.test(lower)) return "underwater";
    if (/\bkick\b/.test(lower)) return "kick";
    if (/\bpull\b|paddles|pull buoy/.test(lower)) return "pull";
    if (/usrpt/.test(lower)) return "USRPT";
    if (/lactate/.test(lower)) return "lactate";
    if (/race.?pace|target split|broken race/.test(lower)) return "race-pace";
    if (/sprint|max speed|speed endurance/.test(lower)) return "sprint";
    if (/threshold|css|pace hold/.test(lower)) return "threshold";
    if (/cool.?down|recovery|easy/.test(lower)) return "recovery";
    if (/test set|test/.test(lower)) return "test-set";
    return "aerobic";
  };

  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const rawLine of lines) {
    const line = rawLine.replace(/^[•*-]\s*/, "").trim();
    if (!line) continue;

    if (/^(end|end repeat|end section|})$/i.test(line)) {
      containerStack.pop();
      continue;
    }

    const sectionMatch = line.match(/^(?:#\s*|section\s*:\s*|\[)([^\]]+?)(?:\])?$/i);
    if (sectionMatch && !/^\d+\s*[x×]/i.test(line)) {
      const section: StudioSectionNode = {
        id: uid("section"),
        kind: "section",
        title: sectionMatch[1].trim(),
        purpose: "",
        pointsOfPerformance: "",
        children: [],
        locked: false,
      };
      pushNode(section);
      containerStack.length = 0;
      containerStack.push({ node: section, children: section.children });
      continue;
    }

    const repeatMatch = line.match(/^repeat\s+(\d+)\s*[x×]?(?:\s*times?)?\s*:?(.*)$/i);
    if (repeatMatch) {
      const repeat: StudioRepeatNode = {
        id: uid("repeat"),
        kind: "repeat",
        label: repeatMatch[2].trim() || "Quick-written repeat",
        rounds: Math.max(1, Number(repeatMatch[1]) || 1),
        children: [],
        locked: false,
      };
      pushNode(repeat);
      containerStack.push({ node: repeat, children: repeat.children });
      continue;
    }

    const noteMatch = line.match(/^(?:note|coach note|cue)\s*:\s*(.+)$/i);
    if (noteMatch) {
      pushNode({ id: uid("note"), kind: "note", label: "Coach note", text: noteMatch[1].trim(), locked: false });
      continue;
    }

    const setMatch = line.match(/^(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:m|yd|y)?\s*(free(?:style)?|back(?:stroke)?|breast(?:stroke)?|fly|butterfly|im|choice|fr|bk|br|fl)?\s*(.*)$/i);
    if (setMatch) {
      const reps = Math.max(1, Number(setMatch[1]) || 1);
      const distance = Math.max(0, Number(setMatch[2]) || 0);
      const stroke = normalizeStroke(setMatch[3]);
      const tail = setMatch[4].trim();
      const intervalMatch = tail.match(/(?:@|\bon\b)\s*(\d{0,2}:\d{1,2}|\d+)/i);
      const targetMatch = tail.match(/\btarget\s*(\d{0,2}:\d{1,2}|\d+)/i);
      const restMatch = tail.match(/\b(?:rest|r)\s*(\d+)\s*(?:s|sec|seconds?)?/i);
      const rpeMatch = tail.match(/\brpe\s*(\d+(?:\.\d+)?)/i);
      const missMatch = tail.match(/\b(?:miss|fail(?:ure)?)\s*(\d+)/i);
      const notesMatch = tail.match(/(?:\s+-\s+|\s+--\s+)(.+)$/);
      const equipment = EQUIPMENT.filter((item) => tail.toLowerCase().includes(item.toLowerCase()));
      const type = inferType(`${line} ${notesMatch?.[1] || ""}`);
      const interval = intervalMatch?.[1]
        ? (intervalMatch[1].includes(":") ? intervalMatch[1] : `0:${String(intervalMatch[1]).padStart(2, "0")}`)
        : setDefaults[type].interval;
      const intervalMode: IntervalMode = restMatch ? "rest" : targetMatch && !intervalMatch ? "target-time" : "send-off";
      const label = notesMatch?.[1]?.split(/[|,]/)[0]?.trim() || setDefaults[type].label;
      pushNode(createSetNode(type, {
        label,
        variant: "Quick write",
        reps,
        distance,
        stroke,
        interval,
        intervalMode,
        targetTime: targetMatch?.[1] || "",
        restSeconds: restMatch ? Math.max(0, Number(restMatch[1]) || 0) : 0,
        intensity: rpeMatch ? Math.max(1, Math.min(10, Number(rpeMatch[1]) || 5)) : setDefaults[type].intensity,
        equipment,
        missLimit: missMatch ? Math.max(1, Number(missMatch[1]) || 1) : type === "USRPT" ? 2 : 0,
        notes: notesMatch?.[1]?.trim() || tail.replace(intervalMatch?.[0] || "", "").replace(targetMatch?.[0] || "", "").replace(restMatch?.[0] || "", "").replace(rpeMatch?.[0] || "", "").trim(),
      }));
      continue;
    }

    pushNode({ id: uid("note"), kind: "note", label: "Quick note", text: line, locked: false });
  }

  return result;
}

export function canContainChildren(node: StudioNode | null): node is Exclude<StudioNode, StudioSetNode | StudioNoteNode> {
  return Boolean(node && node.kind !== "set" && node.kind !== "note");
}
