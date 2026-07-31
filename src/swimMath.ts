export type SplitStrategy = "even" | "negative" | "positive" | "fast-finish";

export interface PacePoint {
  distance: number;
  seconds: number;
  formatted: string;
}

export interface PlannedSplit {
  index: number;
  distance: number;
  splitSeconds: number;
  split: string;
  cumulativeSeconds: number;
  cumulative: string;
}

export function parseSwimTime(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : 0;
  const cleaned = value.trim().replace(/\s/g, "");
  if (!cleaned) return 0;
  const pieces = cleaned.split(":").map((piece) => Number(piece));
  if (pieces.some((piece) => !Number.isFinite(piece) || piece < 0)) return 0;
  if (pieces.length === 1) return pieces[0];
  if (pieces.length === 2) return pieces[0] * 60 + pieces[1];
  if (pieces.length === 3) return pieces[0] * 3600 + pieces[1] * 60 + pieces[2];
  return 0;
}

export function formatSwimTime(totalSeconds: number, decimals = 1): string {
  const safeDecimals = Math.max(0, Math.min(3, Math.floor(decimals)));
  const factor = 10 ** safeDecimals;
  const safe = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
  const rounded = Math.round(safe * factor) / factor;
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded - hours * 3600 - minutes * 60;
  const secondsWidth = safeDecimals > 0 ? 3 + safeDecimals : 2;
  const secondsText = seconds.toFixed(safeDecimals).padStart(secondsWidth, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${secondsText}`;
  return `${minutes}:${secondsText}`;
}

export function paceForDistance(totalDistance: number, totalSeconds: number, targetDistance: number): number {
  if (totalDistance <= 0 || totalSeconds <= 0 || targetDistance <= 0) return 0;
  return (totalSeconds / totalDistance) * targetDistance;
}

export function buildPaceTable(totalDistance: number, totalSeconds: number, distances: number[]): PacePoint[] {
  return distances.map((distance) => {
    const seconds = paceForDistance(totalDistance, totalSeconds, distance);
    return { distance, seconds, formatted: formatSwimTime(seconds) };
  });
}

function normalizedWeights(count: number, strategy: SplitStrategy): number[] {
  if (count <= 0) return [];
  if (strategy === "even") return Array.from({ length: count }, () => 1);
  if (strategy === "negative") {
    const raw = Array.from({ length: count }, (_, index) => 1.035 - (index / Math.max(1, count - 1)) * 0.07);
    const mean = raw.reduce((sum, value) => sum + value, 0) / count;
    return raw.map((value) => value / mean);
  }
  if (strategy === "positive") {
    const raw = Array.from({ length: count }, (_, index) => 0.965 + (index / Math.max(1, count - 1)) * 0.07);
    const mean = raw.reduce((sum, value) => sum + value, 0) / count;
    return raw.map((value) => value / mean);
  }
  const raw = Array.from({ length: count }, (_, index) => {
    if (index === count - 1) return 0.94;
    if (index === 0) return 0.98;
    return 1.02;
  });
  const mean = raw.reduce((sum, value) => sum + value, 0) / count;
  return raw.map((value) => value / mean);
}

export function planSplits(totalDistance: number, totalSeconds: number, splitDistance: number, strategy: SplitStrategy): PlannedSplit[] {
  if (totalDistance <= 0 || totalSeconds <= 0 || splitDistance <= 0) return [];
  const count = Math.ceil(totalDistance / splitDistance);
  const weights = normalizedWeights(count, strategy);
  const weightedDistance = weights.reduce((sum, weight, index) => {
    const distance = index === count - 1 ? totalDistance - splitDistance * (count - 1) : splitDistance;
    return sum + distance * weight;
  }, 0);
  let cumulative = 0;
  return weights.map((weight, index) => {
    const distance = index === count - 1 ? totalDistance - splitDistance * (count - 1) : splitDistance;
    const splitSeconds = totalSeconds * ((distance * weight) / weightedDistance);
    cumulative += splitSeconds;
    return {
      index: index + 1,
      distance,
      splitSeconds,
      split: formatSwimTime(splitSeconds),
      cumulativeSeconds: cumulative,
      cumulative: formatSwimTime(cumulative),
    };
  });
}

export function roundSendoff(seconds: number, increment = 5): number {
  const safeIncrement = Math.max(1, increment);
  return Math.ceil(Math.max(0, seconds) / safeIncrement) * safeIncrement;
}

export function calculateSendoff(pacePer100Seconds: number, repeatDistance: number, desiredRestSeconds: number, roundingSeconds = 5) {
  const swimSeconds = paceForDistance(100, pacePer100Seconds, repeatDistance);
  const exactSeconds = swimSeconds + Math.max(0, desiredRestSeconds);
  const sendoffSeconds = roundSendoff(exactSeconds, roundingSeconds);
  return {
    swimSeconds,
    exactSeconds,
    sendoffSeconds,
    expectedRestSeconds: Math.max(0, sendoffSeconds - swimSeconds),
  };
}

export function calculateCriticalSwimSpeed(shortDistance: number, shortTimeSeconds: number, longDistance: number, longTimeSeconds: number) {
  if (shortDistance <= 0 || longDistance <= shortDistance || shortTimeSeconds <= 0 || longTimeSeconds <= shortTimeSeconds) return null;
  const speed = (longDistance - shortDistance) / (longTimeSeconds - shortTimeSeconds);
  if (!Number.isFinite(speed) || speed <= 0) return null;
  return {
    speed,
    pacePer100Seconds: 100 / speed,
  };
}

export function calculateStrokeMetrics(distance: number, timeSeconds: number, strokeCycles: number) {
  if (distance <= 0 || timeSeconds <= 0 || strokeCycles <= 0) return null;
  const velocity = distance / timeSeconds;
  const strokeRate = (strokeCycles / timeSeconds) * 60;
  const distancePerCycle = distance / strokeCycles;
  const strokeIndex = velocity * distancePerCycle;
  return { velocity, strokeRate, distancePerCycle, strokeIndex };
}

export function calculateSetMath(input: {
  reps: number;
  distance: number;
  rounds: number;
  timingMode: "sendoff" | "rest";
  sendoffSeconds: number;
  pacePer100Seconds: number;
  restSeconds: number;
}) {
  const reps = Math.max(1, Math.floor(input.reps));
  const rounds = Math.max(1, Math.floor(input.rounds));
  const totalReps = reps * rounds;
  const totalDistance = totalReps * Math.max(0, input.distance);
  const swimSecondsPerRep = paceForDistance(100, input.pacePer100Seconds, input.distance);
  const cycleSeconds = input.timingMode === "sendoff"
    ? Math.max(swimSecondsPerRep, input.sendoffSeconds)
    : swimSecondsPerRep + Math.max(0, input.restSeconds);
  const totalSeconds = totalReps * cycleSeconds;
  const totalSwimSeconds = totalReps * swimSecondsPerRep;
  const totalRestSeconds = Math.max(0, totalSeconds - totalSwimSeconds);
  const workRestRatio = totalRestSeconds > 0 ? totalSwimSeconds / totalRestSeconds : null;
  return { totalReps, totalDistance, swimSecondsPerRep, cycleSeconds, totalSeconds, totalSwimSeconds, totalRestSeconds, workRestRatio };
}

export function convertDistance(value: number, direction: "m-to-yd" | "yd-to-m"): number {
  if (!Number.isFinite(value)) return 0;
  return direction === "m-to-yd" ? value / 0.9144 : value * 0.9144;
}

export function sameVelocityConvertedTime(timeSeconds: number, direction: "m-to-yd" | "yd-to-m"): number {
  if (timeSeconds <= 0) return 0;
  return direction === "m-to-yd" ? timeSeconds * 0.9144 : timeSeconds / 0.9144;
}
