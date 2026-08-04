import fs from "node:fs";

const [, , lenexPath, singleAgeTextPath, outputDir = "src/generated"] = process.argv;
if (!lenexPath || !singleAgeTextPath) {
  throw new Error("Usage: node scripts/extract-reference-data.mjs <results.lef> <single-age.txt> [output-dir]");
}

const xml = fs.readFileSync(lenexPath, "utf8");
const standardsText = fs.readFileSync(singleAgeTextPath, "utf8");

const attrs = (value) => Object.fromEntries([...value.matchAll(/([\w]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
const seconds = (value) => {
  if (!value || value === "NT") return 0;
  const parts = value.split(":").map(Number);
  return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 100) / 100;
};

const strokeLabels = { FREE: "Free", BACK: "Back", BREAST: "Breast", FLY: "Fly", MEDLEY: "IM" };
const finalEvents = new Map();
for (const match of xml.matchAll(/<EVENT\s+([^>]*round="FIN"[^>]*)>([\s\S]*?)<\/EVENT>/g)) {
  const eventAttrs = attrs(match[1]);
  const swimstyle = match[2].match(/<SWIMSTYLE\s+([^>]*)\/>/);
  if (!swimstyle) continue;
  const style = attrs(swimstyle[1]);
  if (style.relaycount !== "1") continue;
  finalEvents.set(eventAttrs.eventid, {
    event: `${style.distance} ${strokeLabels[style.stroke]}`,
    sex: eventAttrs.gender === "F" ? "Women" : "Men",
    distance: Number(style.distance),
  });
}

const references = [];
const finalistTimes = {};
for (const clubMatch of xml.matchAll(/<CLUB\s+([^>]*)>([\s\S]*?)<\/CLUB>/g)) {
  const club = attrs(clubMatch[1]);
  for (const athleteMatch of clubMatch[2].matchAll(/<ATHLETE\s+([^>]*)>([\s\S]*?)<\/ATHLETE>/g)) {
    const athlete = attrs(athleteMatch[1]);
    for (const resultMatch of athleteMatch[2].matchAll(/<RESULT\s+([^>]*)>([\s\S]*?)<\/RESULT>/g)) {
      const result = attrs(resultMatch[1]);
      const event = finalEvents.get(result.eventid);
      const place = Number(result.place);
      if (!event || place < 1 || place > 8 || result.status) continue;
      const splits = [...resultMatch[2].matchAll(/<SPLIT\s+([^>]*)\/>/g)].map((split) => attrs(split[1]));
      const cumulative = splits.map((split) => seconds(split.swimtime));
      const checkpoints = splits.map((split) => Number(split.distance));
      const total = seconds(result.swimtime);
      const meanKey = `${event.event}|${event.sex}`;
      finalistTimes[meanKey] ||= [];
      finalistTimes[meanKey].push(total);
      if (place > 3) continue;
      const firstHalf = cumulative.find((_, index) => checkpoints[index] === event.distance / 2) ?? total / 2;
      const secondHalf = total - firstHalf;
      const halfDelta = secondHalf - firstHalf;
      let archetype = event.distance === 50 ? "Championship sprint" : "Balanced race";
      if (event.distance === 100) archetype = halfDelta > total * 0.09 ? "Front-speed hold" : halfDelta < total * 0.06 ? "Back-half speed" : "Balanced sprint";
      else if (event.distance >= 200) archetype = halfDelta > total * 0.035 ? "Front-half pressure" : halfDelta < total * 0.015 ? "Back-half build" : "Even-pressure race";
      references.push({
        id: `worlds-2025-${event.sex.toLowerCase()}-${event.event.toLowerCase().replaceAll(" ", "-")}-${place}`,
        swimmer: `${athlete.firstname} ${athlete.lastname}`.trim().replace(/\s+/g, " "),
        nation: club.nation || club.code,
        age: athlete.birthdate ? 2025 - Number(athlete.birthdate.slice(0, 4)) : undefined,
        event: event.event,
        sex: event.sex,
        course: "LCM",
        meet: "2025 World Aquatics Championships · Singapore final",
        date: "2025-07-27/2025-08-03",
        level: "World Class",
        total,
        cumulative,
        checkpoints,
        archetype,
        reactionTime: result.reactiontime ? Number(result.reactiontime.replace("+", "")) / 100 : undefined,
        sourceName: "Official Omega 2025 Worlds Lenex results",
        sourceUrl: "https://www.omegatiming.com/File/0001190001FFFFFFFFFFFFFFFFFFFFC0.lef",
        verification: "official",
        dataClass: "observed",
        notes: event.distance === 50 ? "Official final time and reaction time. The source does not publish 15/25/35 m checkpoints; SetCraft keeps modeled intermediate checkpoints clearly labeled as estimates." : "Official cumulative split line from the championship final.",
      });
    }
  }
}

references.sort((a, b) => a.event.localeCompare(b.event) || a.sex.localeCompare(b.sex) || a.total - b.total);
const finalMeans = {};
for (const [key, values] of Object.entries(finalistTimes)) {
  const [event, sex] = key.split("|");
  finalMeans[event] ||= {};
  finalMeans[event][sex] = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 100) / 100;
}

const eventMap = {
  "50 FR": "50 Free", "100 FR": "100 Free", "200 FR": "200 Free", "400 FR": "400 Free", "800 FR": "800 Free", "1500 FR": "1500 Free",
  "50 BK": "50 Back", "100 BK": "100 Back", "200 BK": "200 Back",
  "50 BR": "50 Breast", "100 BR": "100 Breast", "200 BR": "200 Breast",
  "50 FL": "50 Fly", "100 FL": "100 Fly", "200 FL": "200 Fly", "200 IM": "200 IM", "400 IM": "400 IM",
};
const ageStandards = {};
let currentAge = null;
for (const line of standardsText.split(/\r?\n/)) {
  const heading = line.match(/^\s*(\d{2}) Girls\s+Event\s+\1 Boys/);
  if (heading) {
    currentAge = Number(heading[1]);
    ageStandards[currentAge] = { Women: {}, Men: {} };
    continue;
  }
  if (!currentAge || !line.includes("LCM")) continue;
  const eventMatch = line.match(/(50|100|200|400|800|1500)\s+(FR|BK|BR|FL|IM)\s+LCM/);
  if (!eventMatch) continue;
  const label = eventMap[`${eventMatch[1]} ${eventMatch[2]}`];
  if (!label) continue;
  const [left, right] = line.split(eventMatch[0]);
  const extract = (side) => [...side.matchAll(/(?:\d+:)?\d{1,2}\.\d{2}/g)].map((match) => seconds(match[0].includes(":") ? `00:${match[0]}` : `00:00:${match[0]}`));
  const women = extract(left).slice(-6).reverse();
  const men = extract(right).slice(0, 6);
  if (women.length === 6) ageStandards[currentAge].Women[label] = women;
  if (men.length === 6) ageStandards[currentAge].Men[label] = men;
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(`${outputDir}/worlds2025References.ts`, `import type { RaceReference } from "../raceModel";\n\nexport const WORLDS_2025_FINAL_MEAN_LCM: Record<string, { Men: number; Women: number }> = ${JSON.stringify(finalMeans, null, 2)};\n\nexport const WORLDS_2025_REFERENCES: RaceReference[] = ${JSON.stringify(references, null, 2)};\n`);
fs.writeFileSync(`${outputDir}/singleAgeLcmStandards.ts`, `export const SINGLE_AGE_LCM_STANDARDS: Record<number, Record<"Men" | "Women", Record<string, number[]>>> = ${JSON.stringify(ageStandards, null, 2)};\n`);

console.log(JSON.stringify({ finalEvents: finalEvents.size, references: references.length, ages: Object.keys(ageStandards).length, ageEventCells: Object.values(ageStandards).reduce((sum, age) => sum + Object.keys(age.Men).length + Object.keys(age.Women).length, 0) }, null, 2));
