import { DeckSheetMeta, LaneAssignmentConfig } from "./studioSheetTypes";
import { PoolLength, PoolUnit, StudioNode } from "./swimStudioEngine";

export interface StudioProject {
  id: string;
  name: string;
  focus: string;
  phase: string;
  folder: string;
  tags: string[];
  poolLength: PoolLength;
  poolUnit: PoolUnit;
  targetMinutes: number;
  nodes: StudioNode[];
  laneAssignments: LaneAssignmentConfig;
  deckSheetMeta: DeckSheetMeta;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PROJECT_FOLDERS = [
  "Inbox",
  "General Preparation",
  "Aerobic Base",
  "Endurance",
  "Threshold",
  "Power",
  "Speed",
  "Race Pace",
  "Taper",
  "Competition Week",
  "Recovery",
  "Testing",
];
