import fs from "node:fs";
import path from "node:path";

const courses = ["LCM", "SCM", "SCY"];
const strokes = ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley"];
const distances = ["50", "100", "200", "400/500"];
const levels = ["developmental", "age-group", "senior", "elite"];
const objectives = [
  "aerobic skill",
  "sustainable pace",
  "race-pace repeatability",
  "maximal speed",
  "start quality",
  "turn quality",
  "underwater transition",
  "recovery technique",
];
const constraints = [
  "none",
  "no equipment",
  "mixed-ability lane",
  "shortened session",
  "coach-entered stroke restriction",
];

function main() {
  const rows: string[] = [];
  let id = 0;
  for (const course of courses) {
    for (const stroke of strokes) {
      for (const distance of distances) {
        for (const level of levels) {
          for (const objective of objectives) {
            for (const constraint of constraints) {
              id += 1;
              rows.push(JSON.stringify({
                id: `coverage-${String(id).padStart(5, "0")}`,
                workflow: id % 5 === 0 ? "race-strategy" : id % 4 === 0 ? "race-analysis" : id % 3 === 0 ? "set-modifier" : "set-generator",
                input: { course, stroke, eventBand: distance, level, objective, constraint },
                expected_characteristics: [
                  "preserves course and units",
                  "states assumptions",
                  "uses observable success criteria",
                  "does not invent measurements or standards",
                  "respects coach-entered constraints",
                  "ends with a coach check",
                ],
                provenance: "synthetic coverage case generated from LaneLab's reviewed taxonomy; not an athlete record",
              }));
            }
          }
        }
      }
    }
  }

  const output = path.join(process.cwd(), "ai", "datasets", "lanelab-coverage-cases.jsonl");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${rows.join("\n")}\n`, "utf8");
  console.log(`Generated ${rows.length.toLocaleString()} synthetic coverage cases: ${path.relative(process.cwd(), output)}`);
  console.log("These cases support evaluation design and do not fine-tune Gemini model weights.");
}

main();
