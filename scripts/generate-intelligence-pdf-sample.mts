import { mkdir, writeFile } from "node:fs/promises";
import { buildIntelligencePdf } from "../src/intelligencePdf";

const rows = [
  ["50 m", "26.10", "26.10", "Entered", "Official"],
  ["100 m", "54.20", "28.10", "Entered", "Official"],
  ["150 m", "1:23.15", "28.95", "Modeled", "Estimated"],
  ["200 m", "1:52.50", "29.35", "Entered", "Official"],
];

const bytes = await buildIntelligencePdf({
  title: "200 Free Race Analysis",
  kicker: "LaneLab Analysis Studio",
  subtitle: "LCM Men analysis for 1:52.50. Entered and modeled checkpoints are identified independently throughout this report.",
  generatedLabel: "11 Aug 2026",
  metrics: [
    { label: "Race time", value: "1:52.50", note: "Official result" },
    { label: "Goal", value: "1:49.99", note: "2.51 s to goal" },
    { label: "AQUA points", value: "812", note: "2026 LCM base" },
    { label: "Input quality", value: "91%", note: "3 entered / 1 modeled" },
    { label: "Age context", value: "National", note: "Exact-age context" },
    { label: "World record", value: "1:42.00", note: "Official benchmark" },
  ],
  sections: [
    { title: "Split breakdown", table: { headers: ["Checkpoint", "Cumulative", "Segment", "Status", "Provenance"], widths: [1, 1, 1, 1, 1], rows } },
    { title: "Closest official races", table: { headers: ["Athlete", "Time", "Match", "Level", "Race shape", "Meet"], widths: [1.4, .8, .7, .9, 1.2, 2], rows: [["Official athlete", "1:52.31", "96%", "Nationals", "Balanced build", "2026 Toyota National Championships"], ["Anonymous junior athlete", "1:52.74", "93%", "Nationals", "Front-speed hold", "2026 Junior National Championships"]] } },
    { title: "Coach analysis", body: ["The entered first-half timing is reliable enough to compare with the nearest official field races. The modeled 150 m checkpoint should be confirmed with video before making a pacing decision.", "Use the comparison as proportional race-shape evidence, not as a claim that two athletes require the same execution."] },
  ],
  footerNote: "Official field races and world-record benchmarks are separate layers. Modeled checkpoints are estimates. Profile measurements are protocol-dependent context, not diagnoses.",
});

await mkdir("output/pdf", { recursive: true });
await writeFile("output/pdf/lanelab-intelligence-sample.pdf", bytes);
