import { writeFile } from "node:fs/promises";
import { calculateStats } from "../src/swimStudioEngine";
import { FAMOUS_WORKOUTS } from "../src/famousWorkouts";
import { createWorkoutPdfBytes } from "../src/pdfExport";

const workout = FAMOUS_WORKOUTS.find((item) => item.id === "urbanchek-progressive-threshold") ?? FAMOUS_WORKOUTS[0];
const bytes = await createWorkoutPdfBytes({
  name: workout.title,
  focus: workout.focus,
  phase: workout.phase,
  poolLength: workout.poolLength,
  poolUnit: workout.poolUnit,
  targetMinutes: workout.durationMinutes,
  stats: calculateStats(workout.nodes),
  nodes: workout.nodes,
  laneAssignments: {
    enabled: true,
    absent: "Mazdak, Allie, Mattea, Eliana, Aidan",
    showLaneSetPlans: true,
    lanes: [
      { id: "lane-1", label: "1", defaultPace: "1:08/100", defaultSendOff: "1:20", laneNotes: "Red group", setAssignments: [{ id: "as1", nodeId: workout.nodes[1]?.id || "", nodeLabel: "Main set", targetPace: "1:05-1:08", sendOff: "1:20", repsOverride: "12", distanceOverride: "100", instructions: "Hold even splits" }], swimmers: [
        { id: "1a", name: "Aaron", assignment: "Lead; red @ 1:20", notes: "Paddles allowed" },
        { id: "1b", name: "Eric", assignment: "2nd", notes: "Target even splits" },
        { id: "1c", name: "Zach", assignment: "3rd", notes: "Underwater to 8m" },
      ] },
      { id: "lane-2", label: "2", defaultPace: "", defaultSendOff: "", laneNotes: "", setAssignments: [], swimmers: [
        { id: "2a", name: "Michael", assignment: "Lead; red @ 1:25", notes: "" },
        { id: "2b", name: "Allen", assignment: "2nd", notes: "No paddles" },
        { id: "2c", name: "Victor", assignment: "3rd", notes: "" },
      ] },
      { id: "lane-3", label: "3", defaultPace: "", defaultSendOff: "", laneNotes: "", setAssignments: [], swimmers: [
        { id: "3a", name: "Shayan", assignment: "Lead; red @ 1:30", notes: "Track 100 splits" },
        { id: "3b", name: "Alex", assignment: "2nd", notes: "" },
        { id: "3c", name: "Jack", assignment: "3rd", notes: "" },
      ] },
      { id: "lane-4", label: "4", defaultPace: "", defaultSendOff: "", laneNotes: "", setAssignments: [], swimmers: [
        { id: "4a", name: "Zoey", assignment: "Lead; red @ 1:35", notes: "" },
        { id: "4b", name: "Emmeline", assignment: "2nd", notes: "No fly" },
        { id: "4c", name: "Nora", assignment: "3rd", notes: "" },
      ] },
      { id: "lane-5", label: "5", defaultPace: "", defaultSendOff: "", laneNotes: "", setAssignments: [], swimmers: [
        { id: "5a", name: "Yunha", assignment: "Lead; red @ 1:40", notes: "" },
        { id: "5b", name: "Saba", assignment: "2nd", notes: "" },
        { id: "5c", name: "Taylor", assignment: "3rd", notes: "Fins on kick" },
      ] },
      { id: "lane-6", label: "6", defaultPace: "", defaultSendOff: "", laneNotes: "", setAssignments: [], swimmers: [
        { id: "6a", name: "Eva", assignment: "Lead; red @ 1:45", notes: "" },
        { id: "6b", name: "Adrija", assignment: "2nd", notes: "Shoulder note" },
        { id: "6c", name: "Emma", assignment: "3rd", notes: "" },
      ] },
    ],
  },
  deckSheetMeta: {
    sessionCode: "W34D4",
    date: "2026-07-24",
    timeRange: "5:30-7:30 PM",
    dayLabel: "Friday",
    coaches: "Coach Eddie and Coach Billy",
    quote: "Swimming rewards the tough",
    weekFocus: "USRPT I (Phase 2)",
    todayFocus: workout.focus,
    footerNote: "Adjust send-offs by lane while preserving the same training objective. Record missed pace and technique breakdown.",
    bottomNotes: "Bring fins, paddles and snorkels. Record 100 splits and missed targets.",
    goalTimesEnabled: true,
    goalTimeTables: [{ id: "goals", title: "100 freestyle target splits", columns: ["Female", "Male"], rows: [{ id: "15", label: "15 yo", values: ["0:16", "0:15"] }, { id: "16", label: "16 yo", values: ["0:16", "0:14"] }] }],
  },
});
await writeFile("/mnt/data/lanelab_v5_deck_sheet_sample.pdf", bytes);
console.log(`Wrote ${bytes.length} bytes`);
