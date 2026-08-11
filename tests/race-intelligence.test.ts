import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENTS,
  SCM_EVENTS,
  SCY_EVENTS,
  WORLD_RECORD_REFERENCES,
  aquaPoints2026,
  completeCumulativeSplits,
  defaultCheckpoints,
  convertCourseTime,
  getRecordBenchmark,
  inputQualityScore,
  performanceScores,
} from "../src/raceModel";
import { createAthleteProfile, measuredValueToRating, resolvedAthleteRatings, ATHLETE_FACTOR_DEFINITIONS } from "../src/athleteProfile";
import { OBSERVED_RACE_LIBRARY, OBSERVED_RACE_LIBRARY_MANIFEST } from "../src/generated/observedRaceLibrary";
import { buildIntelligencePdf } from "../src/intelligencePdf";

test("the current LCM record library covers every event and sex category", () => {
  const lcm = WORLD_RECORD_REFERENCES.filter((item) => item.course === "LCM");
  assert.equal(lcm.length, EVENTS.length * 2);
  for (const event of EVENTS) {
    for (const sex of ["Men", "Women"] as const) {
      const race = lcm.find((item) => item.event === event && item.sex === sex);
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

test("SCM world records cover all course events and SCY is labeled as U.S. Open", () => {
  const scm = WORLD_RECORD_REFERENCES.filter((item) => item.course === "SCM");
  assert.equal(scm.length, SCM_EVENTS.length * 2);
  for (const event of SCM_EVENTS) for (const sex of ["Men", "Women"] as const) {
    const race = getRecordBenchmark(event, sex, "SCM");
    assert.ok(race, `${sex} ${event} SCM is missing`);
    assert.equal(race.benchmarkKind, "world-record");
    assert.equal(race.cumulative.at(-1), race.total);
  }
  const scy = WORLD_RECORD_REFERENCES.filter((item) => item.course === "SCY");
  assert.equal(scy.length, 28);
  assert.ok(scy.every((item) => item.benchmarkKind === "us-open-record"));
  assert.ok(SCY_EVENTS.includes("1650 Free"));
});

test("2026 World Aquatics points use the frozen official base table", () => {
  assert.deepEqual(aquaPoints2026(20.91, "50 Free", "Men"), { points: 1000, base: 20.91 });
  assert.equal(aquaPoints2026(20.88, "50 Free", "Men").points, 1004);
  assert.equal(aquaPoints2026(60, "not an event", "Men").points, 0);
});

test("course conversions preserve transparent NCAA and record-ratio methods", () => {
  const scmToScy = convertCourseTime(100, "200 Free", "Men", "SCM", "SCY");
  assert.equal(scmToScy.event, "200 Free");
  assert.equal(scmToScy.method, "ncaa-factor");
  assert.equal(scmToScy.time, 90.6);
  assert.equal(scmToScy.officialEntryTime, false);

  const lcmToScm = convertCourseTime(120, "200 Free", "Women", "LCM", "SCM");
  assert.equal(lcmToScm.method, "record-ratio");
  assert.ok(lcmToScm.time < 120);

  const lcmToScy = convertCourseTime(120, "200 Free", "Men", "LCM", "SCY");
  assert.equal(lcmToScy.method, "two-step-estimate");
  assert.ok(lcmToScy.note.includes("NCAA"));
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

test("split slots vary by event and course without collapsing blank comma positions", () => {
  const sprint = completeCumulativeSplits("5.20,,15.10,20.50", 20.5, "50 Free", undefined, "SCY");
  assert.equal(sprint.values.length, defaultCheckpoints("50 Free", "SCY").length);
  assert.deepEqual(sprint.enteredMask, [true, false, true, true]);
  const mile = completeCumulativeSplits("", 900, "1650 Free", undefined, "SCY");
  assert.equal(mile.values.length, defaultCheckpoints("1650 Free", "SCY").length);
  assert.equal(mile.values.at(-1), 900);
});

test("the official field library includes thousands of provenance-complete races", () => {
  assert.equal(OBSERVED_RACE_LIBRARY.length, OBSERVED_RACE_LIBRARY_MANIFEST.includedSwims);
  assert.ok(OBSERVED_RACE_LIBRARY.length >= 4_500);
  assert.ok(OBSERVED_RACE_LIBRARY_MANIFEST.includedOfficialCheckpoints >= 30_000);
  assert.deepEqual(new Set(OBSERVED_RACE_LIBRARY.map((item) => item.course)), new Set(["LCM", "SCM", "SCY"]));
  for (const reference of OBSERVED_RACE_LIBRARY) {
    assert.equal(reference.cumulative.length, reference.checkpoints.length);
    assert.equal(reference.checkpointProvenance?.length, reference.checkpoints.length);
    assert.equal(reference.cumulative.at(-1), reference.total);
    assert.ok(reference.sourceUrl.startsWith("https://"));
  }
});

test("athlete factors can be disabled, rated, or mapped from measured protocols", () => {
  const profile = createAthleteProfile(true);
  profile.factors.speed.enabled = false;
  profile.factors.turns.enabled = true;
  profile.factors.turns.mode = "measured";
  profile.factors.turns.measuredValue = 5;
  profile.factors.lactateTolerance.mode = "measured";
  profile.factors.lactateTolerance.enabled = true;
  profile.factors.lactateTolerance.measuredValue = 14;
  const ratings = resolvedAthleteRatings(profile);
  assert.equal(ratings.speed, undefined);
  assert.ok((ratings.turns || 0) > 5.5, "faster turn times should map upward");
  assert.equal(ratings.lactateTolerance, 5.5, "measured lactate is neutral context");
  const lactate = ATHLETE_FACTOR_DEFINITIONS.find((item) => item.key === "lactateTolerance")!;
  assert.equal(measuredValueToRating(lactate, 2), measuredValueToRating(lactate, 20));
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

test("analysis and strategy reports produce a valid paginated PDF", async () => {
  const bytes = await buildIntelligencePdf({
    title: "200 Free Race Analysis", kicker: "SetCraft Analysis Studio", subtitle: "LCM test report",
    generatedLabel: "11 Aug 2026", metrics: [{ label: "Race", value: "1:52.50" }],
    sections: [{ title: "Splits", table: { headers: ["Point", "Time"], rows: [["50 m", "26.10"], ["100 m", "54.20"]] } }],
    footerNote: "Test evidence note.",
  });
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-");
  assert.ok(bytes.length > 1_000);
});
