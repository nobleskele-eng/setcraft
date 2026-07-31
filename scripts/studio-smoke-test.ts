import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  PALETTE_PRESETS,
  calculateStats,
  createPaletteNode,
  createSetNode,
  findNode,
  insertNode,
  parseQuickWrite,
  removeNode,
  starterWorkout,
  validateWorkout,
} from "../src/swimStudioEngine";
import { FAMOUS_WORKOUTS } from "../src/famousWorkouts";
import { createWorkoutPdfBytes } from "../src/pdfExport";

async function main() {
  assert.equal(PALETTE_PRESETS.length, 131, "Final build should expose 131 palette presets");
  assert.equal(FAMOUS_WORKOUTS.length, 30, "Final build should expose 30 editable library workouts");
  // Every palette item must create a usable node with an ID.
  const ids = new Set<string>();
  for (const preset of PALETTE_PRESETS) {
    const node = preset.factory();
    assert.ok(node.id, `Preset ${preset.id} created no ID`);
    assert.ok(!ids.has(node.id), `Preset ${preset.id} reused an ID`);
    ids.add(node.id);
  }

  // Every C-shaped container must accept any normal set and nested section.
  const containerIds = ["section", "repeat", "progress", "condition", "lane-branch", "time-cap"];
  for (const paletteId of containerIds) {
    let graph = [createPaletteNode(paletteId)];
    const parentId = graph[0].id;
    const set = createPaletteNode("cruise");
    const section = createPaletteNode("section");
    graph = insertNode(graph, parentId, 0, set);
    graph = insertNode(graph, parentId, 1, section);
    assert.ok(findNode(graph, set.id), `${paletteId} did not accept a set`);
    assert.ok(findNode(graph, section.id), `${paletteId} did not accept a nested section`);
  }

  // Moving a node through remove/insert must preserve the same node ID.
  let moveGraph = starterWorkout();
  const movingId = (moveGraph[0] as any).children[0].id as string;
  const removed = removeNode(moveGraph, movingId);
  assert.ok(removed.removed, "Move operation did not remove the source node");
  moveGraph = insertNode(removed.nodes, null, 0, removed.removed!);
  assert.equal(moveGraph[0].id, movingId, "Move operation changed the node identity");

  // Quick Write must create a nested section/repeat and calculate repeat multiplication.
  const quick = parseQuickWrite(`# Main set\nRepeat 3x: quality\n4x50 Free @ 1:00 RPE 8 - target pace\n1x100 Choice @ 2:00 - easy\nend`);
  assert.equal(quick.length, 1, "Quick Write did not create one top-level section");
  assert.equal(quick[0].kind, "section");
  const stats = calculateStats(quick);
  assert.equal(stats.totalDistance, 900, "Nested repeat distance was calculated incorrectly");
  assert.equal(stats.setCount, 15, "Nested repeat count was calculated incorrectly");

  // Target time must be faster than the send-off.
  const impossible = createSetNode("threshold", { reps: 4, distance: 100, targetTime: "1:20", intervalMode: "send-off", interval: "1:10" });
  const timingIssues = validateWorkout([impossible], 90, 25);
  assert.ok(timingIssues.some((issue) => issue.id.startsWith("negative-rest-")), "Impossible send-off did not trigger a deterministic warning");

  // Every library workout must remain calculable and non-empty.
  for (const workout of FAMOUS_WORKOUTS) {
    const workoutStats = calculateStats(workout.nodes);
    assert.ok(Number.isFinite(workoutStats.totalDistance) && workoutStats.totalDistance > 0, `${workout.title} has invalid calculated distance`);
  }

  // One-page PDF export must remain exactly one A4 portrait page.
  const starter = starterWorkout();
  const pdfBytes = await createWorkoutPdfBytes({
    name: "SetCraft smoke test",
    focus: "Race pace",
    phase: "Race preparation",
    poolLength: 25,
    poolUnit: "m",
    targetMinutes: 90,
    stats: calculateStats(starter),
    nodes: starter,
    laneAssignments: {
      enabled: true,
      absent: "",
      showLaneSetPlans: true,
      lanes: [
        { id: "lane-1", label: "Lane 1", defaultPace: "", defaultSendOff: "", laneNotes: "", setAssignments: [], swimmers: [{ id: "s1", name: "Ava", assignment: "Lead", notes: "" }] },
        { id: "lane-2", label: "Lane 2", defaultPace: "", defaultSendOff: "", laneNotes: "", setAssignments: [], swimmers: [{ id: "s2", name: "Noah", assignment: "Pace", notes: "" }] },
      ],
    },
    deckSheetMeta: {
      sessionCode: "TEST",
      date: "2026-07-21",
      timeRange: "5:30-7:00 PM",
      dayLabel: "Tuesday",
      coaches: "Coach Test",
      quote: "Quality first",
      weekFocus: "Race preparation",
      todayFocus: "Race pace",
      footerNote: "Coach-approved plan",
      bottomNotes: "Bring fins and record target splits.",
      goalTimesEnabled: true,
      goalTimeTables: [{ id: "goals", title: "Target goal times", columns: ["50", "100"], rows: [{ id: "goal-1", label: "Goal", values: ["0:28", "0:58"] }] }],
    },
  });
  const pdf = await PDFDocument.load(pdfBytes);
  assert.equal(pdf.getPageCount(), 1, "PDF export was not one page");
  const size = pdf.getPage(0).getSize();
  assert.ok(size.height > size.width, "PDF export was not portrait");

  console.log(`✓ ${PALETTE_PRESETS.length} palette presets create unique nodes`);
  console.log(`✓ ${FAMOUS_WORKOUTS.length} editable library workouts calculate correctly`);
  console.log("✓ Infeasible target/send-off timing is detected");
  console.log("✓ All C-shaped containers accept sets and nested sections");
  console.log("✓ Move/remove/insert preserves block identity");
  console.log("✓ Quick Write parses nested repeats and calculates totals");
  console.log(`✓ PDF export is one portrait page (${pdfBytes.length} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
