import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENTS,
  WORLD_RECORD_REFERENCES,
  aquaPoints2026,
  completeCumulativeSplits,
  defaultCheckpoints,
  inputQualityScore,
  performanceScores,
} from "../src/raceModel";

test("the current LCM record library covers every event and sex category", () => {
  assert.equal(WORLD_RECORD_REFERENCES.length, EVENTS.length * 2);
  for (const event of EVENTS) {
    for (const sex of ["Men", "Women"] as const) {
      const race = WORLD_RECORD_REFERENCES.find((item) => item.event === event && item.sex === sex);
      assert.ok(race, `${sex} ${event} is missing`);
      assert.deepEqual(race.checkpoints, defaultCheckpoints(event));
      assert.equal(race.cumulative.length, race.checkpoints.length);
      assert.equal(race.checkpointProvenance?.length, race.checkpoints.length);
      assert.equal(race.cumulative.at(-1), race.total);
      race.cumulative.forEach((value, index) => {
        assert.ok(value > 0, `${race.id} has a non-positive checkpoint`);
        if (index) assert.ok(value > race.cumulative[index - 1], `${race.id} is not monotonic`);
      });
    }
  }
});

test("2026 World Aquatics points use the frozen official base table", () => {
  assert.deepEqual(aquaPoints2026(20.91, "50 Free", "Men"), { points: 1000, base: 20.91 });
  assert.equal(aquaPoints2026(20.88, "50 Free", "Men").points, 1004);
  assert.equal(aquaPoints2026(60, "not an event", "Men").points, 0);
});

test("blank and double-comma split fields are preserved and estimated", () => {
  const partial = completeCumulativeSplits("27.20,,1:26.20,1:56.00", 116, "200 Free");
  assert.deepEqual(partial.enteredMask, [true, false, true, true]);
  assert.deepEqual(partial.estimatedMask, [false, true, false, false]);
  assert.equal(partial.values.at(-1), 116);
  assert.ok(partial.values[1] > partial.values[0] && partial.values[1] < partial.values[2]);

  const blank = completeCumulativeSplits("", 116, "200 Free");
  assert.deepEqual(blank.enteredMask, [false, false, false, false]);
  assert.ok(blank.values.every((value, index) => value > (blank.values[index - 1] || 0)));
  assert.equal(blank.values.at(-1), 116);

  const unknownDistance = completeCumulativeSplits("", 480, "800 Free");
  const distanceSegments = unknownDistance.values.map((value, index) => value - (unknownDistance.values[index - 1] || 0));
  assert.ok(Math.max(...distanceSegments) - Math.min(...distanceSegments) < 2, "balanced 800 fallback should keep a narrow split band");
});

test("quality rewards verified entered splits without pretending estimates are missing data", () => {
  const complete = completeCumulativeSplits("27.20,56.50,1:26.20,1:56.00", 116, "200 Free");
  const estimated = completeCumulativeSplits("27.20,,,1:56.00", 116, "200 Free");
  const common = { event: "200 Free", course: "LCM" as const, total: 116, age: 15, goalTime: 112.09, physiologyEnabled: false, activePhysiologyValues: [] };
  const officialQuality = inputQualityScore({ ...common, cumulative: complete.values, enteredMask: complete.enteredMask, timingStatus: "official" });
  const estimatedQuality = inputQualityScore({ ...common, cumulative: estimated.values, enteredMask: estimated.enteredMask, timingStatus: "self-reported" });
  assert.ok(officialQuality.score > estimatedQuality.score);
  assert.equal(estimatedQuality.estimatedSplits, 2);
});

test("SetCraft scoring is bounded and improves toward the same goal", () => {
  const slower = performanceScores(125, 15, "Men", "200 Free", 112.09);
  const faster = performanceScores(115, 15, "Men", "200 Free", 112.09);
  assert.ok(faster.aquaPoints > slower.aquaPoints);
  assert.ok(faster.goalReadiness > slower.goalReadiness);
  assert.ok(faster.setcraftScore >= slower.setcraftScore);
  assert.ok(faster.setcraftScore >= 0 && faster.setcraftScore <= 100);
});
