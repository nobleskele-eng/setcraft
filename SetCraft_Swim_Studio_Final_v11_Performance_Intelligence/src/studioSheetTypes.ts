export interface LaneSwimmerAssignment {
  id: string;
  name: string;
  assignment: string;
  notes: string;
}

export interface LaneSetAssignment {
  id: string;
  nodeId: string;
  nodeLabel: string;
  targetPace: string;
  sendOff: string;
  repsOverride: string;
  distanceOverride: string;
  instructions: string;
}

export interface PracticeLaneAssignment {
  id: string;
  label: string;
  defaultPace: string;
  defaultSendOff: string;
  laneNotes: string;
  swimmers: LaneSwimmerAssignment[];
  setAssignments: LaneSetAssignment[];
}

export interface LaneAssignmentConfig {
  enabled: boolean;
  lanes: PracticeLaneAssignment[];
  absent: string;
  showLaneSetPlans: boolean;
}

export interface GoalTimeRow {
  id: string;
  label: string;
  values: string[];
}

export interface GoalTimeTable {
  id: string;
  title: string;
  columns: string[];
  rows: GoalTimeRow[];
}

export interface DeckSheetMeta {
  sessionCode: string;
  date: string;
  timeRange: string;
  dayLabel: string;
  coaches: string;
  quote: string;
  weekFocus: string;
  todayFocus: string;
  footerNote: string;
  bottomNotes: string;
  goalTimesEnabled: boolean;
  goalTimeTables: GoalTimeTable[];
}
