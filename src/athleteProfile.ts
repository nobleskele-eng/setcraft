export type AthleteFactorKey =
  | "speed"
  | "aerobic"
  | "lactateTolerance"
  | "power"
  | "strength"
  | "turns"
  | "underwater"
  | "technique"
  | "mobility";

export type AthleteFactorInput = {
  enabled: boolean;
  mode: "rating" | "measured";
  rating: number;
  measuredValue: number | null;
};

export type AthleteProfileState = {
  enabled: boolean;
  factors: Record<AthleteFactorKey, AthleteFactorInput>;
};

export type AthleteFactorDefinition = {
  key: AthleteFactorKey;
  label: string;
  shortLabel: string;
  measuredLabel: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  inverse?: boolean;
  neutralMeasured?: boolean;
  protocol: string;
  caution: string;
};

export const ATHLETE_FACTOR_DEFINITIONS: AthleteFactorDefinition[] = [
  {
    key: "speed",
    label: "Clean-swim speed",
    shortLabel: "Speed",
    measuredLabel: "Max clean-swim velocity",
    unit: "m/s",
    min: 1,
    max: 2.5,
    step: 0.01,
    protocol: "Use a timed clean-swim zone that excludes the start, turn and finish; keep stroke and course consistent.",
    caution: "A single sprint speed does not describe speed endurance.",
  },
  {
    key: "aerobic",
    label: "Aerobic speed",
    shortLabel: "Aerobic",
    measuredLabel: "Critical swim speed",
    unit: "m/s",
    min: 0.8,
    max: 1.8,
    step: 0.01,
    protocol: "Prefer a consistent 200 m + 400 m protocol in the same stroke and course; longer multi-trial protocols improve validity.",
    caution: "Critical speed is protocol-sensitive and is not VO2max.",
  },
  {
    key: "lactateTolerance",
    label: "Post-race lactate response",
    shortLabel: "Lactate",
    measuredLabel: "Peak blood lactate",
    unit: "mmol/L",
    min: 2,
    max: 20,
    step: 0.1,
    neutralMeasured: true,
    protocol: "Record the event, warm-up and sample timing. A practical profile uses repeated samples around 3 and 6 minutes post-race.",
    caution: "Higher lactate is not automatically better and cannot be converted directly into 'tolerance'. Measured mode is recorded as context and does not receive a positive or negative fitness score.",
  },
  {
    key: "power",
    label: "Lower-body explosiveness",
    shortLabel: "Explosiveness",
    measuredLabel: "Countermovement jump",
    unit: "cm",
    min: 15,
    max: 80,
    step: 0.5,
    protocol: "Use the same jump system, arm position and warm-up; record the best of repeatable trials.",
    caution: "Jump height relates to start qualities but is not a direct measure of block performance.",
  },
  {
    key: "strength",
    label: "Relative lower-body strength",
    shortLabel: "Strength",
    measuredLabel: "Isometric peak force / mass",
    unit: "N/kg",
    min: 10,
    max: 40,
    step: 0.1,
    protocol: "Use a supervised isometric mid-thigh pull or comparable force-platform protocol and normalize peak force to body mass.",
    caution: "Do not compare values collected with different joint angles, devices or force-processing methods.",
  },
  {
    key: "turns",
    label: "Turn performance",
    shortLabel: "Turns",
    measuredLabel: "5 m-in to 10 m-out",
    unit: "s",
    min: 4,
    max: 10,
    step: 0.01,
    inverse: true,
    protocol: "Time head crossing 5 m before the wall through head crossing 10 m after the wall; average repeatable turns.",
    caution: "Video frame rate and wall-contact identification affect the result.",
  },
  {
    key: "underwater",
    label: "Start + underwater",
    shortLabel: "Underwater",
    measuredLabel: "15 m start time",
    unit: "s",
    min: 5,
    max: 12,
    step: 0.01,
    inverse: true,
    protocol: "Time the start signal to the swimmer's head crossing 15 m; keep starting system, course and timing method consistent.",
    caution: "A longer underwater distance is useful only while displacement velocity remains effective and legal.",
  },
  {
    key: "technique",
    label: "Clean-swim efficiency",
    shortLabel: "Technique",
    measuredLabel: "Stroke index",
    unit: "m2/s",
    min: 0.8,
    max: 4,
    step: 0.01,
    protocol: "Stroke index = clean-swim velocity x distance per complete stroke cycle; compare the same stroke and speed zone.",
    caution: "A higher index at a different race speed is not a like-for-like technique comparison.",
  },
  {
    key: "mobility",
    label: "Overhead mobility",
    shortLabel: "Mobility",
    measuredLabel: "Shoulder flexion range",
    unit: "deg",
    min: 120,
    max: 200,
    step: 1,
    protocol: "Measure standardized pain-free active shoulder flexion with the trunk controlled; use the same side and assessor method.",
    caution: "More range is not always better, and mobility does not diagnose shoulder health.",
  },
];

export function createAthleteProfile(enabled = false): AthleteProfileState {
  return {
    enabled,
    factors: Object.fromEntries(ATHLETE_FACTOR_DEFINITIONS.map((definition) => [definition.key, {
      enabled: false,
      mode: "rating" as const,
      rating: 6,
      measuredValue: null,
    }])) as Record<AthleteFactorKey, AthleteFactorInput>,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function measuredValueToRating(definition: AthleteFactorDefinition, value: number | null) {
  if (value == null || !Number.isFinite(value)) return null;
  if (definition.neutralMeasured) return 5.5;
  const share = clamp((value - definition.min) / Math.max(0.001, definition.max - definition.min), 0, 1);
  const directed = definition.inverse ? 1 - share : share;
  return Math.round((1 + directed * 9) * 10) / 10;
}

export function resolvedAthleteRatings(profile: AthleteProfileState) {
  if (!profile.enabled) return {} as Partial<Record<AthleteFactorKey, number>>;
  return Object.fromEntries(ATHLETE_FACTOR_DEFINITIONS.flatMap((definition) => {
    const input = profile.factors[definition.key];
    if (!input.enabled) return [];
    const value = input.mode === "rating" ? input.rating : measuredValueToRating(definition, input.measuredValue);
    return value == null ? [] : [[definition.key, value]];
  })) as Partial<Record<AthleteFactorKey, number>>;
}

export function profileEvidenceScore(profile: AthleteProfileState) {
  if (!profile.enabled) return { score: null, active: 0, measured: 0, rated: 0, label: "Profile off" };
  const active = ATHLETE_FACTOR_DEFINITIONS.filter((definition) => profile.factors[definition.key].enabled);
  const measured = active.filter((definition) => profile.factors[definition.key].mode === "measured" && profile.factors[definition.key].measuredValue != null).length;
  const rated = active.filter((definition) => profile.factors[definition.key].mode === "rating").length;
  if (!active.length) return { score: 0, active: 0, measured: 0, rated: 0, label: "No active factors" };
  const score = Math.round((measured + rated * 0.55) / active.length * 100);
  return {
    score,
    active: active.length,
    measured,
    rated,
    label: measured === active.length ? "Measured profile" : measured ? "Mixed evidence" : "Self-rated context",
  };
}

export function profileSummary(profile: AthleteProfileState) {
  if (!profile.enabled) return "Athlete profile off.";
  const parts = ATHLETE_FACTOR_DEFINITIONS.flatMap((definition) => {
    const input = profile.factors[definition.key];
    if (!input.enabled) return [];
    if (input.mode === "measured" && input.measuredValue != null) {
      const rating = measuredValueToRating(definition, input.measuredValue);
      const note = definition.neutralMeasured ? "context only" : `context index ${rating}/10`;
      return [`${definition.shortLabel}: ${input.measuredValue}${definition.unit} (${note})`];
    }
    return [`${definition.shortLabel}: ${input.rating}/10 self-rating`];
  });
  return parts.length ? parts.join("; ") : "Athlete profile enabled with no active factors.";
}
