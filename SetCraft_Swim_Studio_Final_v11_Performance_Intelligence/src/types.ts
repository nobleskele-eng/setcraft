/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "Athlete" | "Coach" | "ClubAdmin";

export type SwimBlockType =
  | "warm-up"
  | "drill"
  | "underwater"
  | "kick"
  | "pull"
  | "aerobic"
  | "threshold"
  | "sprint"
  | "race-pace"
  | "lactate"
  | "USRPT"
  | "test-set"
  | "recovery";

export interface SwimSet {
  id: string;
  reps: number;
  distance: number;
  stroke: string;
  interval: string;
  type: SwimBlockType;
  equipment?: string[];
  intensity: number;
  notes?: string;
  isCustom?: boolean;
}

export interface WorkoutBlock {
  id: string;
  title: string;
  repeatCount: number;
  sets: SwimSet[];
}

export interface WorkoutSession {
  id: string;
  name: string;
  focus: string;
  phase: string;
  blocks: WorkoutBlock[];
  totalDistance: number;
  estimatedDuration: number;
  avgIntensity: number;
  rpeRating?: number;
  coachNotes?: string;
}

export interface SitemapNode {
  id: string;
  title: string;
  path: string;
  purpose: string;
  subPages?: SitemapSubPage[];
}

export interface SitemapSubPage {
  title: string;
  description: string;
  scopeNotes?: string;
}

export interface PaceInput {
  distance: number;
  timeString: string;
}

export interface PaceResult {
  pacePer100: string;
  metersPerSec: number;
  description: string;
}

export interface SplitInput {
  totalDistance: number;
  targetTimeString: string;
  strategy: "even" | "negative" | "descending";
}

export interface SplitResult {
  lapNumber: number;
  lapDistance: number;
  cumulativeTime: string;
  splitTime: string;
}

export interface IntervalInput {
  pacePer100Sec: number;
  targetRestSec: number;
  repeatDistance: number;
}

export interface IntervalResult {
  recommendedSendoff: string;
  exactInterval: string;
  expectedRest: string;
}

export interface UnitInput {
  value: number;
  fromUnit: "meters" | "yards";
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
}

export interface AISuggestion {
  title: string;
  description: string;
  prompt: string;
}

export interface CalendarDay {
  dateString: string;
  dayName: string;
  dayNumber: number;
  phase?: string;
  workout?: WorkoutSession;
  isGoalMeet?: boolean;
}

export interface SwimmerProfile {
  id: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  clubName?: string;
  personalBests: { stroke: string; distance: number; time: string }[];
  badges: { name: string; icon: string; desc: string }[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  clubName: string;
  score: number;
  avatarUrl: string;
}

export interface ClubChallenge {
  id: string;
  title: string;
  clubA: string;
  clubB: string;
  progressA: number;
  progressB: number;
  deadline: string;
}

export interface FeedItem {
  id: string;
  author: string;
  avatarUrl: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  hasSwimBadge?: string;
}
