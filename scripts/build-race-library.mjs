import fs from "node:fs";
import path from "node:path";

const [
  , , usaNationalsPath, usaJuniorNationalsPath, worldsPath, worldScmPath,
  ncaaMenTextPath, ncaaWomenTextPath, outputDir = "src/generated",
] = process.argv;

if (![usaNationalsPath, usaJuniorNationalsPath, worldsPath, worldScmPath, ncaaMenTextPath, ncaaWomenTextPath].every(Boolean)) {
  throw new Error("Usage: node scripts/build-race-library.mjs <usa-nationals.lef> <usa-junior-nationals.lef> <worlds.lef> <world-scm.lef> <ncaa-men.txt> <ncaa-women.txt> [output-dir]");
}

const LENEX_MEETS = [
  {
    path: usaNationalsPath,
    id: "usa-nationals-2026",
    name: "2026 Toyota National Championships",
    date: "2026-07-28/2026-08-01",
    year: 2026,
    sourceName: "Official Omega 2026 Toyota Nationals Lenex",
    sourceUrl: "https://www.omegatiming.com/File/00011A0002FFFFFFFFFFFFFFFFFFFFC0.lef",
  },
  {
    path: usaJuniorNationalsPath,
    id: "usa-junior-nationals-2026",
    name: "2026 Speedo Junior National Championships",
    date: "2026-08-03/2026-08-07",
    year: 2026,
    sourceName: "Official Omega 2026 Junior Nationals Lenex",
    sourceUrl: "https://www.omegatiming.com/File/00011A0004FFFFFFFFFFFFFFFFFFFFC0.lef",
  },
  {
    path: worldsPath,
    id: "worlds-2025",
    name: "2025 World Aquatics Championships",
    date: "2025-07-27/2025-08-03",
    year: 2025,
    sourceName: "Official Omega 2025 World Championships Lenex",
    sourceUrl: "https://www.omegatiming.com/File/0001190001FFFFFFFFFFFFFFFFFFFFC0.lef",
  },
  {
    path: worldScmPath,
    id: "world-scm-2024",
    name: "2024 World Aquatics Swimming Championships (25m)",
    date: "2024-12-10/2024-12-15",
    year: 2024,
    sourceName: "Official Omega 2024 World 25m Championships Lenex",
    sourceUrl: "https://www.omegatiming.com/File/0001180008FFFFFFFFFFFFFFFFFFFFC0.lef",
  },
];

const HYTEK_MEETS = [
  {
    path: ncaaMenTextPath,
    id: "ncaa-men-2026",
    name: "2026 NCAA Division I Men's Championships",
    date: "2026-03-25/2026-03-28",
    sex: "Men",
    sourceName: "Official 2026 NCAA Division I men's final results",
    sourceUrl: "https://ramblinwreck.com/wp-content/uploads/2026/03/2026-NCAA-Division-I-Mens-Championships-Final-Results.pdf",
  },
  {
    path: ncaaWomenTextPath,
    id: "ncaa-women-2026",
    name: "2026 NCAA Division I Women's Championships",
    date: "2026-03-18/2026-03-21",
    sex: "Women",
    sourceName: "Official 2026 NCAA Division I women's final results",
    sourceUrl: "https://ramblinwreck.com/wp-content/uploads/2026/03/2026-NCAA-Division-I-Women-Final-Results.pdf",
  },
];

const strokeLabels = {
  FREE: "Free",
  BACK: "Back",
  BREAST: "Breast",
  FLY: "Fly",
  MEDLEY: "IM",
};

const roundLabels = {
  PRE: "Heats",
  SEM: "Semifinal",
  FIN: "Final",
  TIM: "Timed final",
  FHT: "Fastest heat",
  SOP: "Swim-off",
  SOF: "Swim-off",
};

const attrs = (value) => Object.fromEntries(
  [...value.matchAll(/([\w]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
);

function seconds(value) {
  if (!value || value === "NT") return 0;
  const parts = String(value).replace(/[A-Z]+$/i, "").split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function slug(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ageBand(age) {
  if (!age) return "Open";
  if (age <= 14) return "14U";
  if (age <= 16) return "15-16";
  if (age <= 18) return "17-18";
  return "Open";
}

function levelFromPoints(points, fallback = "Nationals") {
  if (points >= 900) return "World Class";
  if (points >= 850) return "Trials";
  if (points >= 750) return "Nationals";
  if (points > 0) return "Sectionals";
  return fallback;
}

function parseLenex(config) {
  const xml = fs.readFileSync(config.path, "utf8");
  const meetAttrs = attrs(xml.match(/<MEET\s+([^>]*)>/)?.[1] || "");
  const course = meetAttrs.course === "SCM" ? "SCM" : "LCM";
  const events = new Map();

  for (const eventMatch of xml.matchAll(/<EVENT\s+([^>]*)>([\s\S]*?)<\/EVENT>/g)) {
    const eventAttrs = attrs(eventMatch[1]);
    const styleMatch = eventMatch[2].match(/<SWIMSTYLE\s+([^>]*)\/>/);
    if (!styleMatch) continue;
    const style = attrs(styleMatch[1]);
    if (style.relaycount !== "1" || !strokeLabels[style.stroke]) continue;
    events.set(eventAttrs.eventid, {
      event: `${Number(style.distance)} ${strokeLabels[style.stroke]}`,
      distance: Number(style.distance),
      sex: eventAttrs.gender === "F" ? "Women" : "Men",
      round: roundLabels[eventAttrs.round] || eventAttrs.round || "Race",
    });
  }

  const references = [];
  let sequence = 0;
  for (const clubMatch of xml.matchAll(/<CLUB\s+([^>]*)>([\s\S]*?)<\/CLUB>/g)) {
    const club = attrs(clubMatch[1]);
    for (const athleteMatch of clubMatch[2].matchAll(/<ATHLETE\s+([^>]*)>([\s\S]*?)<\/ATHLETE>/g)) {
      const athlete = attrs(athleteMatch[1]);
      const birthYear = Number(athlete.birthdate?.slice(0, 4));
      const age = birthYear ? config.year - birthYear : undefined;
      const band = ageBand(age);
      const isMinor = Boolean(age && age < 18);
      const publicName = `${athlete.firstname || ""} ${athlete.lastname || ""}`.trim().replace(/\s+/g, " ");
      for (const resultMatch of athleteMatch[2].matchAll(/<RESULT\s+([^>]*)>([\s\S]*?)<\/RESULT>/g)) {
        const result = attrs(resultMatch[1]);
        const event = events.get(result.eventid);
        const total = seconds(result.swimtime);
        if (!event || !total || result.status) continue;
        const splitRows = [...resultMatch[2].matchAll(/<SPLIT\s+([^>]*)\/>/g)]
          .map((split) => attrs(split[1]))
          .map((split) => ({ distance: Number(split.distance), time: seconds(split.swimtime) }))
          .filter((split) => split.distance > 0 && split.time > 0)
          .sort((a, b) => a.distance - b.distance);
        if (!splitRows.some((split) => split.distance === event.distance)) {
          splitRows.push({ distance: event.distance, time: total });
        }
        const monotonic = splitRows.filter((split, index, all) => !index || split.time > all[index - 1].time);
        if (!monotonic.length || Math.abs(monotonic.at(-1).time - total) > 0.2) continue;
        const points = Number(result.points) || 0;
        const fallback = config.id.includes("world") ? "World Class" : config.id.includes("junior") ? "Sectionals" : "Nationals";
        sequence += 1;
        references.push({
          id: `${config.id}-${result.eventid}-${athlete.athleteid || sequence}-${result.heat || 0}-${sequence}`,
          swimmer: isMinor ? `Verified ${band} swimmer` : publicName || `Verified swimmer ${sequence}`,
          nation: club.nation || club.code,
          age,
          ageBand: band,
          privacy: isMinor ? "anonymized-minor" : "public-senior",
          event: event.event,
          sex: event.sex,
          course,
          meet: config.name,
          date: config.date,
          round: event.round,
          heat: Number(result.heat) || undefined,
          place: Number(result.place) || undefined,
          level: levelFromPoints(points, fallback),
          aquaPoints: points || undefined,
          total: Math.round(total * 100) / 100,
          cumulative: monotonic.map((split) => Math.round(split.time * 100) / 100),
          checkpoints: monotonic.map((split) => split.distance),
          archetype: "Measured race",
          reactionTime: result.reactiontime ? Number(result.reactiontime.replace("+", "")) / 100 : undefined,
          sourceName: config.sourceName,
          sourceUrl: config.sourceUrl,
          verification: "official",
          dataClass: "observed",
          checkpointProvenance: monotonic.map(() => "official"),
          sourceMeetId: config.id,
          notes: isMinor
            ? "Official result with the athlete identity anonymized in LaneLab. Every stored checkpoint is measured by the source timing system."
            : "Official result. Every stored checkpoint is measured by the source timing system.",
        });
      }
    }
  }
  return references;
}

function hytekEventLabel(rawStroke) {
  const clean = rawStroke.trim();
  if (/Relay|Diving|Platform|Meter/i.test(clean)) return null;
  if (/Individual Medley/i.test(clean)) return "IM";
  if (/Freestyle/i.test(clean)) return "Free";
  if (/Backstroke/i.test(clean)) return "Back";
  if (/Breaststroke/i.test(clean)) return "Breast";
  if (/Butterfly/i.test(clean)) return "Fly";
  return null;
}

function parseHytek(config) {
  const lines = fs.readFileSync(config.path, "utf8").replace(/\f/g, "\n").split(/\r?\n/);
  const references = [];
  let currentEvent = null;
  let round = "Final";
  let sequence = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const eventMatch = line.match(/^Event\s+\d+\s+(Men|Women)\s+(\d+)\s+Yard\s+(.+?)\s*$/);
    if (eventMatch) {
      const stroke = hytekEventLabel(eventMatch[3]);
      currentEvent = stroke ? { sex: eventMatch[1], distance: Number(eventMatch[2]), event: `${Number(eventMatch[2])} ${stroke}` } : null;
      round = "Final";
      continue;
    }
    if (/Preliminaries/.test(line)) round = "Heats";
    if (/Championship Final|Consolation Final/.test(line)) round = "Final";
    if (!currentEvent || currentEvent.sex !== config.sex) continue;

    const rowMatch = line.match(/^\s*\*?(\d+)\s+(.+?),\s*(.+?)\s+(FR|SO|JR|SR|5Y)\s+(.+)$/);
    if (!rowMatch || /\b(DQ|DFS|DNS)\b/.test(line)) continue;
    const rowTimes = [...rowMatch[5].matchAll(/(?:\d{1,2}:)?\d{2}\.\d{2}/g)].map((match) => match[0]);
    if (rowTimes.length < 2) continue;
    const total = seconds(rowTimes.at(-1));
    if (!total) continue;

    const detailLines = [];
    let cursor = index + 1;
    while (cursor < lines.length && !/^\s*\*?\d+\s+.+?,\s*.+?\s+(?:FR|SO|JR|SR|5Y)\s+/.test(lines[cursor]) && !/^Event\s+\d+/.test(lines[cursor]) && !/^(?:Preliminaries|Championship Final|Consolation Final)/.test(lines[cursor].trim())) {
      if (/r:\+|\(\d{2}\.\d{2}\)/.test(lines[cursor]) || /(?:\d{1,2}:)?\d{2}\.\d{2}/.test(lines[cursor])) detailLines.push(lines[cursor]);
      cursor += 1;
    }

    const detailText = detailLines.join(" ");
    const reaction = Number(detailText.match(/r:\+(\d+\.\d+)/)?.[1]) || undefined;
    const cumulativeTokens = [...detailText
      .replace(/\([^)]*\)/g, " ")
      .replace(/r:\+\d+\.\d+/g, " ")
      .matchAll(/(?:\d{1,2}:)?\d{2}\.\d{2}/g)]
      .map((match) => seconds(match[0]))
      .filter((value) => value > 0 && value <= total + 0.2);
    const cumulative = cumulativeTokens.filter((value, tokenIndex, all) => !tokenIndex || value > all[tokenIndex - 1]);
    if (!cumulative.length || Math.abs(cumulative.at(-1) - total) > 0.2) cumulative.push(total);
    const checkpoints = cumulative.length === 1
      ? [currentEvent.distance]
      : cumulative.map((_, splitIndex) => Math.round((splitIndex + 1) * currentEvent.distance / cumulative.length));
    const place = Number(rowMatch[1]);
    const level = round === "Final" ? (place <= 8 ? "World Class" : "Trials") : "Nationals";
    const swimmer = `${rowMatch[3]} ${rowMatch[2]}`.trim().replace(/\s+/g, " ");
    sequence += 1;
    references.push({
      id: `${config.id}-${slug(currentEvent.event)}-${round.toLowerCase()}-${place}-${sequence}`,
      swimmer,
      ageBand: "Open",
      privacy: "public-senior",
      event: currentEvent.event,
      sex: config.sex,
      course: "SCY",
      meet: config.name,
      date: config.date,
      round,
      place,
      level,
      total: Math.round(total * 100) / 100,
      cumulative: cumulative.map((value) => Math.round(value * 100) / 100),
      checkpoints,
      archetype: "Measured race",
      reactionTime: reaction,
      sourceName: config.sourceName,
      sourceUrl: config.sourceUrl,
      verification: "official",
      dataClass: "observed",
      checkpointProvenance: cumulative.map(() => "official"),
      sourceMeetId: config.id,
      notes: "Official NCAA championship result. Every stored checkpoint is measured in the published HY-TEK result line.",
    });
    index = Math.max(index, cursor - 1);
  }
  return references;
}

function quantile(sorted, share) {
  if (!sorted.length) return 0.5;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * share))];
}

function withArchetypes(references) {
  const groups = new Map();
  for (const reference of references) {
    const key = `${reference.course}|${reference.event}|${reference.sex}`;
    const halfDistance = Number(reference.event.match(/^\d+/)?.[0] || 0) / 2;
    const halfIndex = reference.checkpoints.findIndex((point) => point === halfDistance);
    if (halfIndex < 0 || reference.total <= 0) continue;
    const metric = reference.cumulative[halfIndex] / reference.total;
    reference.shapeMetric = Math.round(metric * 10000) / 10000;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(metric);
  }
  for (const values of groups.values()) values.sort((a, b) => a - b);

  return references.map((reference) => {
    const distance = Number(reference.event.match(/^\d+/)?.[0] || 0);
    if (!reference.shapeMetric || distance === 50) return { ...reference, archetype: "Pure sprint" };
    const values = groups.get(`${reference.course}|${reference.event}|${reference.sex}`) || [];
    const low = quantile(values, 0.33);
    const high = quantile(values, 0.67);
    const position = reference.shapeMetric <= low ? "front" : reference.shapeMetric >= high ? "back" : "even";
    const labels = reference.event.includes("IM")
      ? { front: "First-half led IM", even: "Balanced IM", back: "Closing IM" }
      : distance === 100
        ? { front: "Front-speed hold", even: "Balanced sprint", back: "Back-half speed" }
        : distance === 200
          ? { front: "Controlled aggression", even: "Even pressure", back: "Back-half build" }
          : { front: "Early pressure", even: "Even pace", back: "Negative build" };
    return { ...reference, archetype: labels[position] };
  });
}

function evenlySample(sorted, limit) {
  if (sorted.length <= limit) return sorted;
  const selected = new Map();
  for (let index = 0; index < limit; index += 1) {
    const sourceIndex = Math.round(index * (sorted.length - 1) / (limit - 1));
    selected.set(sorted[sourceIndex].id, sorted[sourceIndex]);
  }
  return [...selected.values()];
}

function sampleLibrary(references, limitPerCell = 18) {
  const groups = new Map();
  for (const reference of references) {
    const key = `${reference.course}|${reference.event}|${reference.sex}|${reference.level}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(reference);
  }
  return [...groups.values()].flatMap((group) => evenlySample(group.sort((a, b) => a.total - b.total), limitPerCell));
}

const lenexReferences = LENEX_MEETS.flatMap(parseLenex);
const hytekReferences = HYTEK_MEETS.flatMap(parseHytek);
const allReferences = withArchetypes([...lenexReferences, ...hytekReferences]);
const references = sampleLibrary(allReferences, 18)
  .sort((a, b) => a.course.localeCompare(b.course) || a.event.localeCompare(b.event) || a.sex.localeCompare(b.sex) || a.total - b.total);

const countBy = (key) => Object.fromEntries(
  [...references.reduce((map, reference) => map.set(reference[key] || "Unknown", (map.get(reference[key] || "Unknown") || 0) + 1), new Map()).entries()]
    .sort(([a], [b]) => String(a).localeCompare(String(b))),
);

const manifest = {
  generatedAt: new Date().toISOString(),
  selectionRule: "Up to 18 evenly distributed official swims per course × event × category × performance band. World-record profiles are stored separately.",
  rawEligibleSwims: allReferences.length,
  includedSwims: references.length,
  includedOfficialCheckpoints: references.reduce((sum, reference) => sum + reference.checkpoints.length, 0),
  byCourse: countBy("course"),
  byLevel: countBy("level"),
  byMeet: countBy("sourceMeetId"),
  anonymizedMinorSwims: references.filter((reference) => reference.privacy === "anonymized-minor").length,
  sourceFiles: [
    ...LENEX_MEETS.map(({ id, name, sourceName, sourceUrl }) => ({ id, name, sourceName, sourceUrl })),
    ...HYTEK_MEETS.map(({ id, name, sourceName, sourceUrl }) => ({ id, name, sourceName, sourceUrl })),
  ],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "observedRaceLibrary.ts"),
  `import type { RaceReference } from "../raceModel";\n\nexport const OBSERVED_RACE_LIBRARY_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;\n\nexport const OBSERVED_RACE_LIBRARY = JSON.parse(${JSON.stringify(JSON.stringify(references))}) as RaceReference[];\n`,
);
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/RACE_LIBRARY_DATA_MANIFEST.json", `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify(manifest, null, 2));
