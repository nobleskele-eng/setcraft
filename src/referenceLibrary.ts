import {
  Course,
  defaultCheckpoints,
  genericCumulativeModel,
  RaceReference,
  SexCategory,
} from "./raceModel";

export type AlignedReference = {
  reference: RaceReference;
  checkpoints: number[];
  cumulative: number[];
  provenance: Array<"official" | "secondary" | "estimated" | "coach">;
};

function roundHundredth(value: number) {
  return Math.round(value * 100) / 100;
}

export function alignReferenceToAnalysis(reference: RaceReference): AlignedReference {
  const checkpoints = defaultCheckpoints(reference.event, reference.course);
  const base = genericCumulativeModel(reference.event, reference.total);
  const anchors = new Map<number, { value: number; provenance: "official" | "secondary" | "estimated" | "coach" }>();
  reference.checkpoints.forEach((checkpoint, index) => {
    const value = reference.cumulative[index];
    if (!Number.isFinite(value) || value <= 0) return;
    anchors.set(checkpoint, {
      value,
      provenance: reference.checkpointProvenance?.[index]
        || (reference.dataClass === "coach" ? "coach" : reference.verification === "official" ? "official" : "secondary"),
    });
  });
  const finish = checkpoints.at(-1) || 0;
  if (!anchors.has(finish)) anchors.set(finish, { value: reference.total, provenance: reference.verification === "official" ? "official" : "secondary" });

  const values = Array(checkpoints.length).fill(0) as number[];
  const provenance = Array(checkpoints.length).fill("estimated") as AlignedReference["provenance"];
  const targetAnchors = checkpoints.flatMap((checkpoint, index) => {
    const anchor = anchors.get(checkpoint);
    return anchor ? [{ checkpoint, index, ...anchor }] : [];
  });
  if (!targetAnchors.some((anchor) => anchor.index === checkpoints.length - 1)) {
    targetAnchors.push({ checkpoint: finish, index: checkpoints.length - 1, value: reference.total, provenance: "estimated" });
  }

  let previousIndex = -1;
  let previousValue = 0;
  let previousBase = 0;
  targetAnchors.sort((a, b) => a.index - b.index).forEach((anchor) => {
    const anchorBase = base[anchor.index];
    for (let index = previousIndex + 1; index <= anchor.index; index += 1) {
      if (index === anchor.index) {
        values[index] = anchor.value;
        provenance[index] = anchor.provenance;
      } else {
        const share = (base[index] - previousBase) / Math.max(0.001, anchorBase - previousBase);
        values[index] = roundHundredth(previousValue + share * (anchor.value - previousValue));
        provenance[index] = "estimated";
      }
    }
    previousIndex = anchor.index;
    previousValue = anchor.value;
    previousBase = anchorBase;
  });
  values[values.length - 1] = reference.total;
  return { reference, checkpoints, cumulative: values, provenance };
}

export function mergeRecordWithObserved(record: RaceReference, observed: RaceReference[]) {
  const exact = observed.find((reference) => reference.course === record.course
    && reference.event === record.event
    && reference.sex === record.sex
    && Math.abs(reference.total - record.total) <= 0.02);
  if (!exact) return alignReferenceToAnalysis(record);

  const checkpoints = [...record.checkpoints];
  const cumulative = [...record.cumulative];
  const checkpointProvenance = [...(record.checkpointProvenance || record.checkpoints.map(() => "estimated" as const))];
  exact.checkpoints.forEach((checkpoint, index) => {
    const targetIndex = checkpoints.indexOf(checkpoint);
    if (targetIndex >= 0) {
      cumulative[targetIndex] = exact.cumulative[index];
      checkpointProvenance[targetIndex] = "official";
    } else {
      checkpoints.push(checkpoint);
      cumulative.push(exact.cumulative[index]);
      checkpointProvenance.push("official");
    }
  });
  const sorted = checkpoints.map((checkpoint, index) => ({ checkpoint, value: cumulative[index], provenance: checkpointProvenance[index] }))
    .sort((a, b) => a.checkpoint - b.checkpoint);
  return alignReferenceToAnalysis({
    ...record,
    checkpoints: sorted.map((item) => item.checkpoint),
    cumulative: sorted.map((item) => item.value),
    checkpointProvenance: sorted.map((item) => item.provenance),
    notes: `${record.notes || ""} Exact official checkpoints were merged from ${exact.meet}.`.trim(),
  });
}

export function closestObservedReferences(input: {
  references: RaceReference[];
  event: string;
  course: Course;
  sex: SexCategory;
  total: number;
  cumulative: number[];
  enteredMask: boolean[];
  limit?: number;
}) {
  const { references, event, course, sex, total, cumulative, enteredMask, limit = 5 } = input;
  if (!total) return [];
  const shapeCoverage = enteredMask.filter(Boolean).length / Math.max(1, enteredMask.length);
  const currentShape = cumulative.map((value) => value / total);
  return references
    .filter((reference) => reference.event === event && reference.course === course && reference.sex === sex && reference.total > 0)
    .map((reference) => {
      const aligned = alignReferenceToAnalysis(reference);
      const targetShape = aligned.cumulative.map((value) => value / reference.total);
      const shapeError = currentShape.reduce((sum, value, index) => sum + Math.abs(value - (targetShape[index] || value)), 0) / Math.max(1, currentShape.length);
      const timeGap = Math.abs(Math.log(reference.total / total));
      const distance = shapeError * (5 + shapeCoverage * 10) + timeGap * (1.4 - shapeCoverage * 0.7);
      const match = Math.max(1, Math.min(99, Math.round(100 * Math.exp(-distance))));
      return { ...aligned, match, shapeError, timeGapPct: Math.abs(reference.total - total) / total * 100 };
    })
    .sort((a, b) => b.match - a.match || a.timeGapPct - b.timeGapPct)
    .slice(0, limit);
}

export function referenceRows(reference: AlignedReference) {
  let previous = 0;
  return reference.checkpoints.map((checkpoint, index) => {
    const cumulative = reference.cumulative[index];
    const segment = cumulative - previous;
    previous = cumulative;
    return {
      checkpoint,
      cumulative,
      segment,
      provenance: reference.provenance[index],
    };
  });
}
