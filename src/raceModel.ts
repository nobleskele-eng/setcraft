import { SINGLE_AGE_LCM_STANDARDS } from "./generated/singleAgeLcmStandards";
import { WORLDS_2025_FINAL_MEAN_LCM } from "./generated/worlds2025References";
import { AQUA_2026_LCM_BASES, WORLD_RECORD_SEEDS_LCM } from "./generated/worldRecordsLcm";
import {
  AQUA_2026_SCM_BASES,
  NCAA_2027_DI_SCY,
  NCAA_SCM_TO_SCY_FACTORS,
  SECTIONALS_2026_SCY,
  US_OPEN_RECORD_SEEDS_SCY,
  WINTER_JUNIORS_2026_SCY,
  WORLD_RECORD_SEEDS_SCM,
} from "./generated/courseBenchmarks";

export type SexCategory = "Men" | "Women";
export type Course = "LCM" | "SCM" | "SCY";
export type ReferenceLevel = "Sectionals" | "Nationals" | "Trials" | "World Class";

export type RaceReference = {
  id: string;
  swimmer: string;
  nation?: string;
  age?: number;
  event: string;
  sex: SexCategory;
  course: Course;
  meet: string;
  date: string;
  level: ReferenceLevel;
  total: number;
  cumulative: number[];
  checkpoints: number[];
  archetype: string;
  strokeRate?: number;
  reactionTime?: number;
  sourceName: string;
  sourceUrl: string;
  verification: "official" | "secondary" | "manual";
  dataClass?: "observed" | "derived" | "coach" | "world-record";
  benchmarkKind?: "world-record" | "us-open-record" | "course-equivalent";
  checkpointProvenance?: Array<"official" | "secondary" | "estimated" | "coach">;
  recordStatus?: "ratified" | "pending";
  strategyDescription?: string;
  bestFor?: string;
  risk?: string;
  notes?: string;
  ageBand?: string;
  privacy?: "public-senior" | "anonymized-minor" | "coach-private";
  round?: string;
  heat?: number;
  place?: number;
  aquaPoints?: number;
  sourceMeetId?: string;
  shapeMetric?: number;
};

export type StrategyDefinition = {
  id: string;
  name: string;
  description: string;
  bestFor: string;
  risk: string;
  paceFactors: number[];
};

export const EVENTS = [
  "50 Free", "100 Free", "200 Free", "400 Free", "800 Free", "1500 Free",
  "50 Back", "100 Back", "200 Back", "50 Breast", "100 Breast", "200 Breast",
  "50 Fly", "100 Fly", "200 Fly", "200 IM", "400 IM",
] as const;

export const SCM_EVENTS = [...EVENTS.slice(0, 15), "100 IM", "200 IM", "400 IM"] as readonly string[];
export const SCY_EVENTS = [
  "50 Free", "100 Free", "200 Free", "500 Free", "1000 Free", "1650 Free",
  "50 Back", "100 Back", "200 Back", "50 Breast", "100 Breast", "200 Breast",
  "50 Fly", "100 Fly", "200 Fly", "200 IM", "400 IM",
] as readonly string[];

export function eventsForCourse(course: Course): readonly string[] {
  if (course === "SCM") return SCM_EVENTS;
  if (course === "SCY") return SCY_EVENTS;
  return EVENTS;
}

const METRIC_TO_SCY_EVENT: Record<string, string> = {
  "400 Free": "500 Free", "800 Free": "1000 Free", "1500 Free": "1650 Free",
};

export function equivalentEvent(event: string, from: Course, to: Course) {
  if (from === to) return event;
  if (to === "SCY") return METRIC_TO_SCY_EVENT[event] || event;
  if (from === "SCY") {
    const entry = Object.entries(METRIC_TO_SCY_EVENT).find(([, scy]) => scy === event);
    return entry?.[0] || event;
  }
  return event;
}

export function courseUnit(course: Course) {
  return course === "SCY" ? "yd" : "m";
}

type StandardsByEvent = Record<string, { Men: number; Women: number }>;

export const SECTIONALS_2026_LCM: StandardsByEvent = {
  "50 Free": { Men: 25.29, Women: 28.09 }, "100 Free": { Men: 54.79, Women: 60.69 },
  "200 Free": { Men: 120.49, Women: 130.99 }, "400 Free": { Men: 255.79, Women: 275.29 },
  "800 Free": { Men: 529.99, Women: 567.39 }, "1500 Free": { Men: 1016.49, Women: 1086.09 },
  "50 Back": { Men: 28.69, Women: 31.49 }, "100 Back": { Men: 61.99, Women: 67.89 },
  "200 Back": { Men: 133.79, Women: 146.99 }, "50 Breast": { Men: 31.99, Women: 35.59 },
  "100 Breast": { Men: 69.69, Women: 77.19 }, "200 Breast": { Men: 150.89, Women: 166.69 },
  "50 Fly": { Men: 27.39, Women: 30.29 }, "100 Fly": { Men: 59.59, Women: 65.79 },
  "200 Fly": { Men: 131.79, Women: 145.09 }, "200 IM": { Men: 135.19, Women: 148.49 },
  "400 IM": { Men: 287.59, Women: 312.99 },
};

export const NATIONALS_2026_OPEN_LCM: StandardsByEvent = {
  "50 Free": { Men: 22.69, Women: 25.69 }, "100 Free": { Men: 49.69, Women: 55.89 },
  "200 Free": { Men: 109.89, Women: 121.19 }, "400 Free": { Men: 235.59, Women: 256.89 },
  "800 Free": { Men: 487.59, Women: 526.79 }, "1500 Free": { Men: 937.69, Women: 1009.19 },
  "50 Back": { Men: 25.49, Women: 28.59 }, "100 Back": { Men: 55.69, Women: 62.19 },
  "200 Back": { Men: 122.09, Women: 134.59 }, "50 Breast": { Men: 28.29, Women: 32.29 },
  "100 Breast": { Men: 62.09, Women: 70.29 }, "200 Breast": { Men: 136.09, Women: 152.39 },
  "50 Fly": { Men: 24.39, Women: 27.59 }, "100 Fly": { Men: 53.49, Women: 60.19 },
  "200 Fly": { Men: 120.89, Women: 134.59 }, "200 IM": { Men: 122.89, Women: 136.89 },
  "400 IM": { Men: 264.69, Women: 291.79 },
};

export const NATIONALS_2026_18U_LCM: StandardsByEvent = {
  "50 Free": { Men: 23.19, Women: 26.19 }, "100 Free": { Men: 51.09, Women: 56.69 },
  "200 Free": { Men: 112.09, Women: 123.19 }, "400 Free": { Men: 238.39, Women: 259.89 },
  "800 Free": { Men: 496.99, Women: 537.89 }, "1500 Free": { Men: 952.69, Women: 1030.79 },
  "50 Back": { Men: 26.39, Women: 29.69 }, "100 Back": { Men: 56.89, Women: 63.19 },
  "200 Back": { Men: 123.59, Women: 136.69 }, "50 Breast": { Men: 29.19, Women: 33.29 },
  "100 Breast": { Men: 63.29, Women: 71.29 }, "200 Breast": { Men: 138.09, Women: 154.19 },
  "50 Fly": { Men: 24.99, Women: 28.09 }, "100 Fly": { Men: 54.69, Women: 61.39 },
  "200 Fly": { Men: 122.89, Women: 137.59 }, "200 IM": { Men: 124.69, Women: 138.19 },
  "400 IM": { Men: 265.39, Women: 292.69 },
};

export const TRIALS_2024_LCM: StandardsByEvent = {
  "50 Free": { Men: 22.79, Women: 25.69 }, "100 Free": { Men: 49.99, Women: 55.79 },
  "200 Free": { Men: 109.99, Women: 120.89 }, "400 Free": { Men: 235.59, Women: 255.49 },
  "800 Free": { Men: 489.69, Women: 525.79 }, "1500 Free": { Men: 939.89, Women: 1005.69 },
  "100 Back": { Men: 55.69, Women: 61.89 }, "200 Back": { Men: 121.69, Women: 133.59 },
  "100 Breast": { Men: 62.19, Women: 70.29 }, "200 Breast": { Men: 135.99, Women: 151.69 },
  "100 Fly": { Men: 53.59, Women: 60.19 }, "200 Fly": { Men: 120.49, Women: 133.69 },
  "200 IM": { Men: 123.49, Women: 136.09 }, "400 IM": { Men: 265.19, Women: 289.89 },
};

// Mean time of the eight finalists at Paris 2024. This is a stable, auditable
// definition of "world class" rather than an arbitrary percentage of a record.
export const PARIS_2024_FINAL_MEAN_LCM: StandardsByEvent = {
  "50 Free": { Men: 21.52, Women: 24.19 }, "100 Free": { Men: 47.54, Women: 52.57 },
  "200 Free": { Men: 105.23, Women: 114.99 }, "400 Free": { Men: 223.71, Women: 241.34 },
  "800 Free": { Men: 462.61, Women: 496.98 }, "1500 Free": { Men: 880.95, Women: 951.84 },
  "100 Back": { Men: 52.51, Women: 58.59 }, "200 Back": { Men: 115.22, Women: 126.63 },
  "100 Breast": { Men: 59.29, Women: 65.81 }, "200 Breast": { Men: 128.45, Women: 142.61 },
  "100 Fly": { Men: 50.59, Women: 56.47 }, "200 Fly": { Men: 113.42, Women: 126.36 },
  "200 IM": { Men: 116.15, Women: 128.22 }, "400 IM": { Men: 249.73, Women: 276.18 },
};

export const OFFICIAL_SOURCES = [
  { name: "2026 Speedo Sectionals maximum standards", url: "https://www.usaswimming.org/docs/default-source/timesdocuments/time-standards/2026/2026_speedosectionals_timestandards_max.pdf", detail: "Official USA Swimming maximum LCM and SCY qualifying standards." },
  { name: "2026 Toyota National Championships standards", url: "https://www.usaswimming.org/docs/default-source/timesdocuments/time-standards/2026/18077640025_events_2026_toyotanationalchampionships_timestandards.pdf", detail: "Official open and 18-and-under standards." },
  { name: "2024 U.S. Olympic Team Trials meet information", url: "https://swimswam.com/wp-content/uploads/2024/06/meet-information-book-12-2-23_a7cea0a7-83b6-4aa9-aaa8-fd049229fddd.pdf", detail: "Archived meet book containing the official Trials cuts; 2028 cuts are not yet published." },
  { name: "USA Swimming 2024–2028 single-age standards", url: "https://www.usaswimming.org/docs/default-source/timesdocuments/time-standards/2025/2028-motivational-standards-single-age.pdf", detail: "B through AAAA by exact age, sex, event and course." },
  { name: "World Aquatics Paris 2024 Results Report", url: "https://resources.fina.org/fina/document/2024/10/03/fbd120cc-9c34-4a55-ac29-ad778d159b0e/Paris-2024-Swimming-Results-Report.pdf", detail: "Official race-analysis statistics retained for historical comparison." },
  { name: "Omega 2025 Worlds men's 200 free summary", url: "https://www.omegatiming.com/File/00011900010101EE0101FFFFFFFFFF01.pdf", detail: "Official world-record and world-junior-record checkpoint splits." },
  { name: "Omega 2024 U.S. Olympic Trials men's 200 free final", url: "https://www.omegatiming.com/File/00011800030101EE0104FFFFFFFFFF01.pdf", detail: "Official final ranking, reaction times and cumulative 50 m checkpoints for all eight finalists." },
  { name: "Omega 2025 Toyota Nationals men's 200 free final", url: "https://www.omegatiming.com/File/00011900040101EE0104FFFFFFFFFF01.pdf", detail: "Official A-final ranking, reaction times and cumulative 50 m checkpoints for all eight finalists." },
  { name: "2025 Central Zone North Speedo Sectionals Friday finals", url: "https://recwell.umn.edu/sites/recwell.umn.edu/files/2025-07/friday_finals_results_1.pdf", detail: "Official HY-TEK results with ages and cumulative 50 m checkpoints for the men's 200 free A-final." },
  { name: "Omega 2025 World Championships results book", url: "https://www.omegatiming.com/File/0001190001FFFFFFFFFFFFFFFFFFFF22.pdf", detail: "Official Singapore 2025 final rankings, reaction times and split lines." },
  { name: "Omega 2025 World Championships Lenex results", url: "https://www.omegatiming.com/File/0001190001FFFFFFFFFFFFFFFFFFFFC0.lef", detail: "Machine-readable official results used for 99 recent medal-race profiles across every individual event category." },
  { name: "World Aquatics current LCM records", url: "https://www.worldaquatics.com/swimming/records?pool=LCM&recordCode=WR", detail: "Governing-body record catalogue reviewed 11 August 2026; pending ratification is preserved where shown." },
  { name: "World Aquatics 2026 LCM points — men", url: "https://resources.fina.org/fina/document/2026/03/02/2ff83c61-de9d-4b14-8e66-dafd60974e07/World-Aquatics-Points-LCM_2026_Male-1-.pdf", detail: "Official 2026 male base times and point table, valid 1 January–31 December 2026." },
  { name: "World Aquatics 2026 LCM points — women", url: "https://resources.fina.org/fina/document/2026/03/02/ae522afa-e03f-417e-9169-c39e868af9a6/World-Aquatics-Points-LCM_2026_Female-1-.pdf", detail: "Official 2026 female base times and point table, valid 1 January–31 December 2026." },
  { name: "World Aquatics points formula", url: "https://www.worldaquatics.com/swimming/points", detail: "Official P = 1000 × (B/T)³ formula; calculated values are truncated to an integer." },
  { name: "MySwimSplits world-record race analysis", url: "https://myswimsplits.com/swimming-world-records-mens-long-course/", detail: "Secondary checkpoint source used only where an official result line was unavailable; every such checkpoint is labeled secondary." },
  { name: "Single-age swimming performance percentiles", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9206680/", detail: "Peer-reviewed age- and sex-specific performance trajectories used to support cautious age interpretation." },
  { name: "Swimming race-analysis review", url: "https://www.mdpi.com/1660-4601/18/1/69", detail: "Peer-reviewed review of start, clean-swimming, turning and finishing race phases." },
  { name: "Dry-land strength and turn performance review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8431432/", detail: "Systematic review informing the cautious, optional interpretation of strength and turn-related inputs." },
  { name: "Start, turn and finish performance study", url: "https://www.jssm.org/researchjssm-19-397.xml.xml", detail: "Race-phase evidence supporting measured 15 m and turn analysis instead of assumptions from self-ratings." },
  { name: "World Aquatics current SCM records", url: "https://www.worldaquatics.com/swimming/records?pool=SCM&recordCode=WR", detail: "Governing-body short-course record catalogue reviewed 11 August 2026." },
  { name: "World Aquatics 2026 SCM and LCM points bases", url: "https://resources.fina.org/fina/document/2026/01/27/3886f5b2-5bcf-464e-a626-059be2ed4567/Points-Base-times-SCM-and-LCM-2026_01.2026.pdf", detail: "Official annual short- and long-course base times and validity periods." },
  { name: "USA Swimming 2026 Winter Junior standards", url: "https://www.usaswimming.org/docs/default-source/timesdocuments/time-standards/2026/11320828118_events_timestandards_2026_speedowinterjrs.pdf", detail: "Official 2026 SCY individual qualifying standards." },
  { name: "2027 NCAA Division I qualifying standards", url: "https://ncaaorg.s3.amazonaws.com/championships/sports/swimdive/d1/2026-27D1XSW_QUALSTANDARDS.pdf", detail: "Official SCY standards and published NCAA SCM-to-SCY conversion factors." },
  { name: "USA Swimming time standards hub", url: "https://www.usaswimming.org/times/time-standards", detail: "Current national, junior, Futures and Sectionals time-standard index." },
];

export const SWIMCLOUD_REQUEST = {
  url: "https://www.swimcloud.com/results/351189/event/18/?id=182868342#time182868342",
  status: "Awaiting manual verification",
  note: "The page blocks automated retrieval. No values from it are treated as verified until a coach imports or confirms the result.",
};

const MEN_200_FREE_WORLD_REFERENCES: RaceReference[] = [
  { id: "biedermann-2009", swimmer: "Paul Biedermann", nation: "GER", event: "200 Free", sex: "Men", course: "LCM", meet: "2009 World Championships", date: "2009-07-28", level: "World Class", total: 102.00, cumulative: [24.23, 50.12, 76.30, 102.00], checkpoints: [50,100,150,200], archetype: "Front-half pressure", sourceName: "Omega official record splits", sourceUrl: OFFICIAL_SOURCES[5].url, verification: "official", notes: "Historical world record; polyurethane-era suit is a material context flag." },
  { id: "popovici-2022", swimmer: "David Popovici", nation: "ROU", age: 17, event: "200 Free", sex: "Men", course: "LCM", meet: "2022 European Championships", date: "2022-08-15", level: "World Class", total: 102.97, cumulative: [24.10, 50.35, 76.96, 102.97], checkpoints: [50,100,150,200], archetype: "Sustained speed", sourceName: "Omega official record splits", sourceUrl: OFFICIAL_SOURCES[5].url, verification: "official", notes: "World-junior-record checkpoint line in the official results." },
  { id: "popovici-2024", swimmer: "David Popovici", nation: "ROU", age: 19, event: "200 Free", sex: "Men", course: "LCM", meet: "Paris 2024 Olympic Final", date: "2024-07-29", level: "World Class", total: 104.72, cumulative: [24.10, 51.12, 77.98, 104.72], checkpoints: [50,100,150,200], archetype: "Late closer", strokeRate: 44.6, sourceName: "Paris 2024 race analysis", sourceUrl: OFFICIAL_SOURCES[4].url, verification: "official" },
  { id: "richards-2024", swimmer: "Matthew Richards", nation: "GBR", event: "200 Free", sex: "Men", course: "LCM", meet: "Paris 2024 Olympic Final", date: "2024-07-29", level: "World Class", total: 104.74, cumulative: [24.16, 50.92, 77.99, 104.74], checkpoints: [50,100,150,200], archetype: "Balanced", strokeRate: 40.9, sourceName: "Paris 2024 race analysis", sourceUrl: OFFICIAL_SOURCES[4].url, verification: "official" },
  { id: "hobson-2024", swimmer: "Luke Hobson", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "Paris 2024 Olympic Final", date: "2024-07-29", level: "World Class", total: 104.79, cumulative: [24.70, 51.37, 78.00, 104.79], checkpoints: [50,100,150,200], archetype: "Back-half build", strokeRate: 40.3, sourceName: "Paris 2024 race analysis", sourceUrl: OFFICIAL_SOURCES[4].url, verification: "official" },
  { id: "scott-2024", swimmer: "Duncan Scott", nation: "GBR", event: "200 Free", sex: "Men", course: "LCM", meet: "Paris 2024 Olympic Final", date: "2024-07-29", level: "World Class", total: 104.87, cumulative: [24.46, 51.21, 78.10, 104.87], checkpoints: [50,100,150,200], archetype: "Balanced", strokeRate: 45.5, sourceName: "Paris 2024 race analysis", sourceUrl: OFFICIAL_SOURCES[4].url, verification: "official" },
  { id: "martens-2024", swimmer: "Lukas Märtens", nation: "GER", event: "200 Free", sex: "Men", course: "LCM", meet: "Paris 2024 Olympic Final", date: "2024-07-29", level: "World Class", total: 105.46, cumulative: [24.05, 50.52, 77.61, 105.46], checkpoints: [50,100,150,200], archetype: "Aggressive opener", strokeRate: 44.2, sourceName: "Paris 2024 race analysis", sourceUrl: OFFICIAL_SOURCES[4].url, verification: "official" },
  { id: "rapsys-2024", swimmer: "Danas Rapšys", nation: "LTU", event: "200 Free", sex: "Men", course: "LCM", meet: "Paris 2024 Olympic Final", date: "2024-07-29", level: "World Class", total: 105.46, cumulative: [24.67, 51.23, 78.37, 105.46], checkpoints: [50,100,150,200], archetype: "Controlled build", strokeRate: 42.4, sourceName: "Paris 2024 race analysis", sourceUrl: OFFICIAL_SOURCES[4].url, verification: "official" },
  { id: "giuliani-2024", swimmer: "Maximillian Giuliani", nation: "AUS", event: "200 Free", sex: "Men", course: "LCM", meet: "Paris 2024 Olympic Final", date: "2024-07-29", level: "World Class", total: 105.57, cumulative: [24.61, 51.66, 78.51, 105.57], checkpoints: [50,100,150,200], archetype: "Back-half build", strokeRate: 42.2, sourceName: "Paris 2024 race analysis", sourceUrl: OFFICIAL_SOURCES[4].url, verification: "official" },
  { id: "matsumoto-2024", swimmer: "Katsuhiro Matsumoto", nation: "JPN", event: "200 Free", sex: "Men", course: "LCM", meet: "Paris 2024 Olympic Final", date: "2024-07-29", level: "World Class", total: 106.26, cumulative: [24.36, 51.12, 78.87, 106.26], checkpoints: [50,100,150,200], archetype: "Early speed / hold", strokeRate: 38.4, sourceName: "Paris 2024 race analysis", sourceUrl: OFFICIAL_SOURCES[4].url, verification: "official" },
];

const MEN_200_FREE_TRIALS_REFERENCES: RaceReference[] = [
  { id: "hobson-trials-2024", swimmer: "Luke Hobson", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2024 U.S. Olympic Team Trials Final", date: "2024-06-17", level: "Trials", total: 104.89, cumulative: [24.67, 51.16, 77.77, 104.89], checkpoints: [50,100,150,200], archetype: "Controlled sustain", sourceName: "Omega official Trials final", sourceUrl: OFFICIAL_SOURCES[6].url, verification: "official" },
  { id: "guiliano-trials-2024", swimmer: "Chris Guiliano", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2024 U.S. Olympic Team Trials Final", date: "2024-06-17", level: "Trials", total: 105.38, cumulative: [24.10, 50.77, 78.23, 105.38], checkpoints: [50,100,150,200], archetype: "Aggressive opener / rebound", sourceName: "Omega official Trials final", sourceUrl: OFFICIAL_SOURCES[6].url, verification: "official" },
  { id: "kibler-trials-2024", swimmer: "Drew Kibler", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2024 U.S. Olympic Team Trials Final", date: "2024-06-17", level: "Trials", total: 105.60, cumulative: [24.41, 50.72, 78.03, 105.60], checkpoints: [50,100,150,200], archetype: "Early speed / hold", sourceName: "Omega official Trials final", sourceUrl: OFFICIAL_SOURCES[6].url, verification: "official" },
  { id: "smith-trials-2024", swimmer: "Kieran Smith", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2024 U.S. Olympic Team Trials Final", date: "2024-06-17", level: "Trials", total: 105.61, cumulative: [24.59, 51.14, 78.25, 105.61], checkpoints: [50,100,150,200], archetype: "Balanced progression", sourceName: "Omega official Trials final", sourceUrl: OFFICIAL_SOURCES[6].url, verification: "official" },
  { id: "curry-trials-2024", swimmer: "Brooks Curry", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2024 U.S. Olympic Team Trials Final", date: "2024-06-17", level: "Trials", total: 105.89, cumulative: [24.37, 51.25, 78.74, 105.89], checkpoints: [50,100,150,200], archetype: "Finish rebound", sourceName: "Omega official Trials final", sourceUrl: OFFICIAL_SOURCES[6].url, verification: "official" },
  { id: "pieroni-trials-2024", swimmer: "Blake Pieroni", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2024 U.S. Olympic Team Trials Final", date: "2024-06-17", level: "Trials", total: 106.09, cumulative: [24.80, 51.35, 78.43, 106.09], checkpoints: [50,100,150,200], archetype: "Middle-race pressure", sourceName: "Omega official Trials final", sourceUrl: OFFICIAL_SOURCES[6].url, verification: "official" },
  { id: "mitchell-trials-2024", swimmer: "Jake Mitchell", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2024 U.S. Olympic Team Trials Final", date: "2024-06-17", level: "Trials", total: 106.48, cumulative: [24.53, 51.47, 78.43, 106.48], checkpoints: [50,100,150,200], archetype: "Controlled middle / fade", sourceName: "Omega official Trials final", sourceUrl: OFFICIAL_SOURCES[6].url, verification: "official" },
  { id: "shackell-trials-2024", swimmer: "Aaron Shackell", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2024 U.S. Olympic Team Trials Final", date: "2024-06-17", level: "Trials", total: 107.37, cumulative: [24.82, 51.44, 79.37, 107.37], checkpoints: [50,100,150,200], archetype: "Front-half pressure", sourceName: "Omega official Trials final", sourceUrl: OFFICIAL_SOURCES[6].url, verification: "official" },
];

const MEN_200_FREE_NATIONALS_REFERENCES: RaceReference[] = [
  { id: "hobson-nationals-2025", swimmer: "Luke Hobson", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Toyota National Championships Final", date: "2025-06-04", level: "Nationals", total: 103.73, cumulative: [24.05, 50.05, 76.34, 103.73], checkpoints: [50,100,150,200], archetype: "Aggressive sustained speed", sourceName: "Omega official Nationals final", sourceUrl: OFFICIAL_SOURCES[7].url, verification: "official", notes: "U.S. Open and championship record in the official result file." },
  { id: "jett-nationals-2025", swimmer: "Gabriel Jett", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Toyota National Championships Final", date: "2025-06-04", level: "Nationals", total: 104.70, cumulative: [24.57, 50.80, 77.82, 104.70], checkpoints: [50,100,150,200], archetype: "Back-half close", sourceName: "Omega official Nationals final", sourceUrl: OFFICIAL_SOURCES[7].url, verification: "official" },
  { id: "maurer-nationals-2025", swimmer: "Rex Maurer", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Toyota National Championships Final", date: "2025-06-04", level: "Nationals", total: 105.13, cumulative: [24.65, 51.27, 78.22, 105.13], checkpoints: [50,100,150,200], archetype: "Balanced close", sourceName: "Omega official Nationals final", sourceUrl: OFFICIAL_SOURCES[7].url, verification: "official" },
  { id: "mcfadden-nationals-2025", swimmer: "Henry McFadden", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Toyota National Championships Final", date: "2025-06-04", level: "Nationals", total: 105.22, cumulative: [24.64, 51.39, 78.48, 105.22], checkpoints: [50,100,150,200], archetype: "Late closer", sourceName: "Omega official Nationals final", sourceUrl: OFFICIAL_SOURCES[7].url, verification: "official" },
  { id: "foster-nationals-2025", swimmer: "Carson Foster", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Toyota National Championships Final", date: "2025-06-04", level: "Nationals", total: 105.45, cumulative: [24.64, 51.48, 78.68, 105.45], checkpoints: [50,100,150,200], archetype: "Late closer", sourceName: "Omega official Nationals final", sourceUrl: OFFICIAL_SOURCES[7].url, verification: "official" },
  { id: "smith-nationals-2025", swimmer: "Kieran Smith", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Toyota National Championships Final", date: "2025-06-04", level: "Nationals", total: 105.72, cumulative: [24.64, 51.35, 78.52, 105.72], checkpoints: [50,100,150,200], archetype: "Controlled build", sourceName: "Omega official Nationals final", sourceUrl: OFFICIAL_SOURCES[7].url, verification: "official" },
  { id: "guiliano-nationals-2025", swimmer: "Chris Guiliano", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Toyota National Championships Final", date: "2025-06-04", level: "Nationals", total: 105.73, cumulative: [24.07, 50.98, 77.99, 105.73], checkpoints: [50,100,150,200], archetype: "Aggressive opener", sourceName: "Omega official Nationals final", sourceUrl: OFFICIAL_SOURCES[7].url, verification: "official" },
  { id: "mijatovic-nationals-2025", swimmer: "Luka Mijatovic", nation: "USA", event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Toyota National Championships Final", date: "2025-06-04", level: "Nationals", total: 106.39, cumulative: [25.24, 52.28, 79.34, 106.39], checkpoints: [50,100,150,200], archetype: "Steady-state finish", sourceName: "Omega official Nationals final", sourceUrl: OFFICIAL_SOURCES[7].url, verification: "official" },
];

const MEN_200_FREE_SECTIONALS_REFERENCES: RaceReference[] = [
  { id: "goettsch-sectionals-2025", swimmer: "Maximus Goettsch", nation: "USA", age: 18, event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Central Zone North Speedo Sectionals A-final", date: "2025-07-11", level: "Sectionals", total: 109.75, cumulative: [25.67, 53.32, 81.78, 109.75], checkpoints: [50,100,150,200], archetype: "Finish rebound", sourceName: "Official HY-TEK Sectionals results", sourceUrl: OFFICIAL_SOURCES[8].url, verification: "official" },
  { id: "vatev-sectionals-2025", swimmer: "Luke Vatev", nation: "USA", age: 16, event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Central Zone North Speedo Sectionals A-final", date: "2025-07-11", level: "Sectionals", total: 112.73, cumulative: [25.81, 53.87, 83.16, 112.73], checkpoints: [50,100,150,200], archetype: "Early speed / hold", sourceName: "Official HY-TEK Sectionals results", sourceUrl: OFFICIAL_SOURCES[8].url, verification: "official" },
  { id: "hansen-sectionals-2025", swimmer: "Tyler Hansen", nation: "USA", age: 20, event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Central Zone North Speedo Sectionals A-final", date: "2025-07-11", level: "Sectionals", total: 113.36, cumulative: [26.29, 54.86, 83.81, 113.36], checkpoints: [50,100,150,200], archetype: "Controlled progression", sourceName: "Official HY-TEK Sectionals results", sourceUrl: OFFICIAL_SOURCES[8].url, verification: "official" },
  { id: "guo-sectionals-2025", swimmer: "Henry Guo", nation: "USA", age: 18, event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Central Zone North Speedo Sectionals A-final", date: "2025-07-11", level: "Sectionals", total: 113.62, cumulative: [26.28, 54.47, 83.79, 113.62], checkpoints: [50,100,150,200], archetype: "Front-half pressure", sourceName: "Official HY-TEK Sectionals results", sourceUrl: OFFICIAL_SOURCES[8].url, verification: "official" },
  { id: "schutten-sectionals-2025", swimmer: "Ethan Schutten", nation: "USA", age: 18, event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Central Zone North Speedo Sectionals A-final", date: "2025-07-11", level: "Sectionals", total: 113.94, cumulative: [26.10, 53.93, 83.76, 113.94], checkpoints: [50,100,150,200], archetype: "Aggressive front half", sourceName: "Official HY-TEK Sectionals results", sourceUrl: OFFICIAL_SOURCES[8].url, verification: "official" },
  { id: "edmonson-sectionals-2025", swimmer: "Jayden Edmonson", nation: "USA", age: 19, event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Central Zone North Speedo Sectionals A-final", date: "2025-07-11", level: "Sectionals", total: 114.38, cumulative: [27.05, 55.80, 85.31, 114.38], checkpoints: [50,100,150,200], archetype: "Late close", sourceName: "Official HY-TEK Sectionals results", sourceUrl: OFFICIAL_SOURCES[8].url, verification: "official" },
  { id: "mychalowych-sectionals-2025", swimmer: "Luke Mychalowych", nation: "USA", age: 19, event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Central Zone North Speedo Sectionals A-final", date: "2025-07-11", level: "Sectionals", total: 116.20, cumulative: [26.20, 55.50, 85.67, 116.20], checkpoints: [50,100,150,200], archetype: "Aggressive opener / fade", sourceName: "Official HY-TEK Sectionals results", sourceUrl: OFFICIAL_SOURCES[8].url, verification: "official" },
  { id: "terrazas-sectionals-2025", swimmer: "Aadin Terrazas", nation: "USA", age: 16, event: "200 Free", sex: "Men", course: "LCM", meet: "2025 Central Zone North Speedo Sectionals A-final", date: "2025-07-11", level: "Sectionals", total: 118.52, cumulative: [26.82, 56.60, 87.17, 118.52], checkpoints: [50,100,150,200], archetype: "Progressive fatigue", sourceName: "Official HY-TEK Sectionals results", sourceUrl: OFFICIAL_SOURCES[8].url, verification: "official" },
];

export const MEN_200_FREE_REFERENCES: RaceReference[] = [
  ...MEN_200_FREE_WORLD_REFERENCES,
  ...MEN_200_FREE_TRIALS_REFERENCES,
  ...MEN_200_FREE_NATIONALS_REFERENCES,
  ...MEN_200_FREE_SECTIONALS_REFERENCES,
];

// AAAA, AAA, AA, A, BB and B for the men's 200 free LCM. The complete
// standards PDF remains the source of truth; this seed makes the first model useful offline.
export const MEN_200_FREE_LCM_SINGLE_AGE: Record<number, number[]> = {
  10: [151.99,159.19,166.39,173.69,195.39,217.09], 11: [142.39,149.09,155.89,162.69,176.19,189.79],
  12: [134.39,140.79,147.19,153.59,166.39,179.19], 13: [127.49,133.59,139.69,145.69,157.89,169.99],
  14: [122.99,128.89,134.69,140.59,152.29,163.99], 15: [119.99,125.79,131.49,137.19,148.59,159.99],
  16: [117.99,123.59,129.19,134.79,145.99,157.29], 17: [116.59,122.19,127.69,133.29,144.39,155.49],
  18: [115.19,120.69,126.19,131.59,142.59,153.59],
};

export const WOMEN_200_FREE_LCM_SINGLE_AGE: Record<number, number[]> = {
  10: [155.09,163.49,171.99,180.39,205.69,230.99], 11: [144.79,151.69,158.49,165.39,179.19,192.99],
  12: [140.09,146.79,153.49,160.09,173.49,186.79], 13: [135.29,141.79,148.19,154.69,167.59,180.39],
  14: [131.59,137.89,144.19,150.39,162.99,175.49], 15: [129.39,135.49,141.69,147.79,160.19,172.49],
  16: [127.09,133.19,139.29,145.29,157.39,169.49], 17: [127.09,133.09,139.19,145.19,157.29,169.39],
  18: [126.99,132.99,139.09,145.09,157.19,169.29],
};

export function timeToSeconds(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const clean = value.trim();
  if (!clean) return 0;
  const parts = clean.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function formatTime(seconds: number, hundredths = true): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  const tail = secs.toFixed(hundredths ? 2 : 1).padStart(hundredths ? 5 : 4, "0");
  return mins ? `${mins}:${tail}` : tail;
}

export function segmentsFromCumulative(values: number[]): number[] {
  return values.map((value, index) => index ? value - values[index - 1] : value);
}

export function getStandard(level: ReferenceLevel, event: string, sex: SexCategory, age: number, course: Course = "LCM"): number | null {
  if (course === "SCY") {
    if (level === "Sectionals") return SECTIONALS_2026_SCY[event]?.[sex] ?? null;
    if (level === "Nationals") return WINTER_JUNIORS_2026_SCY[event]?.[sex] ?? null;
    if (level === "Trials") return NCAA_2027_DI_SCY[event]?.[sex] ?? null;
    const record = getRecordBenchmark(event, sex, course);
    return record ? Math.round(record.total * 1.055 * 100) / 100 : null;
  }
  if (course === "SCM") {
    const lcmEvent = equivalentEvent(event, "SCM", "LCM");
    const lcmCut = getStandard(level, lcmEvent, sex, age, "LCM");
    return lcmCut == null ? null : convertCourseTime(lcmCut, lcmEvent, sex, "LCM", "SCM").time;
  }
  if (level === "Sectionals") return SECTIONALS_2026_LCM[event]?.[sex] ?? null;
  if (level === "Nationals") return (age <= 18 ? NATIONALS_2026_18U_LCM : NATIONALS_2026_OPEN_LCM)[event]?.[sex] ?? null;
  if (level === "Trials") return TRIALS_2024_LCM[event]?.[sex] ?? null;
  return WORLDS_2025_FINAL_MEAN_LCM[event]?.[sex] ?? PARIS_2024_FINAL_MEAN_LCM[event]?.[sex] ?? null;
}

export function classifyAbsolute(time: number, event: string, sex: SexCategory, age: number, course: Course = "LCM") {
  const descending: ReferenceLevel[] = ["World Class", "Trials", "Nationals", "Sectionals"];
  const achieved = descending.find((level) => {
    const cut = getStandard(level, event, sex, age, course);
    return cut != null && time <= cut;
  });
  const ascending: ReferenceLevel[] = ["Sectionals", "Nationals", "Trials", "World Class"];
  const achievedIndex = achieved ? ascending.indexOf(achieved) : -1;
  const next = ascending.slice(achievedIndex + 1).find((level) => {
    const cut = getStandard(level, event, sex, age, course);
    return cut != null && time > cut;
  }) ?? null;
  return { achieved: achieved ?? "Pre-Sectionals", next, nextCut: next ? getStandard(next, event, sex, age, course) : null };
}

export function getAgeBand(time: number, age: number, sex: SexCategory, event: string, course: Course = "LCM") {
  const normalizedAge = Math.max(10, Math.min(18, Math.round(age)));
  const lcmEvent = equivalentEvent(event, course, "LCM");
  const lcmTime = course === "LCM" ? time : convertCourseTime(time, event, sex, course, "LCM").time;
  const standards = SINGLE_AGE_LCM_STANDARDS[normalizedAge]?.[sex]?.[lcmEvent];
  if (!standards) return { label: age < 10 || age > 18 ? "Open" : "Not offered", index: -1, source: age < 10 || age > 18 ? "Exact-age standards apply to ages 10–18." : `USA Swimming does not publish an equivalent exact-age event for age ${normalizedAge}.` };
  const labels = ["AAAA", "AAA", "AA", "A", "BB", "B"];
  const index = standards.findIndex((cut) => lcmTime <= cut);
  return { label: index >= 0 ? labels[index] : "Below B", index, source: course === "LCM" ? `USA Swimming 2024–2028 single-age ${normalizedAge} LCM standard` : `Course-normalized to USA Swimming single-age ${normalizedAge} LCM standard` };
}

export function scaledModel(reference: RaceReference, targetTotal: number): number[] {
  return reference.cumulative.map((split) => split / reference.total * targetTotal);
}

export function closestReference(cumulative: number[], total: number, references = MEN_200_FREE_REFERENCES) {
  if (cumulative.length < 2 || !total) return references[3];
  let best = references[0];
  let score = Infinity;
  references.forEach((reference) => {
    if (reference.cumulative.length !== cumulative.length) return;
    const current = cumulative.map((value) => value / total);
    const target = reference.cumulative.map((value) => value / reference.total);
    const error = current.reduce((sum, value, index) => sum + Math.abs(value - target[index]), 0);
    if (error < score) { score = error; best = reference; }
  });
  return best;
}

export function parseCumulativeSplits(value: string, total: number): number[] {
  const parsed = value.split(/[;,\n]+/).map((item) => timeToSeconds(item)).filter((item) => item > 0);
  if (parsed.length && total && Math.abs(parsed[parsed.length - 1] - total) > 0.11) parsed.push(total);
  return parsed;
}

export function defaultCheckpoints(event: string, course: Course = "LCM"): number[] {
  void course;
  const distance = Number(event.match(/^\d+/)?.[0] || 200);
  if (distance === 50) return [15, 25, 35, 50];
  if (distance === 100) return [25, 50, 75, 100];
  return Array.from({ length: Math.max(1, distance / 50) }, (_, index) => (index + 1) * 50);
}

function segmentDistances(checkpoints: number[]) {
  return checkpoints.map((point, index) => point - (checkpoints[index - 1] || 0));
}

function normalizeFactors(checkpoints: number[], factors: number[], total: number) {
  const distances = segmentDistances(checkpoints);
  const weighted = distances.map((distance, index) => distance * (factors[index] ?? 1));
  const scale = total / weighted.reduce((sum, value) => sum + value, 0);
  let running = 0;
  return weighted.map((value, index) => {
    running += value * scale;
    return index === weighted.length - 1 ? total : Math.round(running * 100) / 100;
  });
}

function distanceFactors(length: number, mode: "front" | "even" | "back" | "surge") {
  return Array.from({ length }, (_, index) => {
    const progress = length === 1 ? 1 : index / (length - 1);
    if (mode === "front") return 0.93 + progress * 0.12 - (index === length - 1 ? 0.06 : 0);
    if (mode === "back") return 1.04 - progress * 0.08 - (index === length - 1 ? 0.05 : 0);
    if (mode === "surge") return 1 + (index % 4 === 3 ? -0.035 : index % 4 === 1 ? 0.025 : 0) - (index === length - 1 ? 0.045 : 0);
    return 0.98 + progress * 0.04 - (index === length - 1 ? 0.04 : 0);
  });
}

export function strategyDefinitions(event: string): StrategyDefinition[] {
  const distance = Number(event.match(/^\d+/)?.[0] || 200);
  const checkpoints = defaultCheckpoints(event);
  if (event.includes("IM")) {
    const repeats = distance === 400 ? 2 : 1;
    const base = [0.88, 1.00, 1.23, 0.92].flatMap((value) => Array(repeats).fill(value));
    const adjust = (stroke: number, amount: number) => base.map((value, index) => value * (Math.floor(index / repeats) === stroke ? amount : 1));
    return [
      { id: "fly-led", name: "Fly-led pressure", description: "Uses butterfly to establish position, then protects the middle strokes.", bestFor: "Efficient butterfly swimmers with controlled breaststroke", risk: "Breaststroke can unravel if the first quarter is forced.", paceFactors: adjust(0, 0.94) },
      { id: "breast-built", name: "Breaststroke build", description: "Keeps fly and back controlled, then creates separation in breaststroke.", bestFor: "Breaststroke-dominant IM swimmers", risk: "Requires enough free speed to defend the lead.", paceFactors: adjust(2, 0.93) },
      { id: "free-close", name: "Freestyle close", description: "Protects energy through the first three strokes and attacks the final quarter.", bestFor: "Strong aerobic freestylers and reliable turn swimmers", risk: "Can surrender too much position before freestyle.", paceFactors: adjust(3, 0.91) },
    ];
  }
  if (distance === 50) return [
    { id: "underwater", name: "Start + underwater", description: "Wins the first 15 m and carries breakout velocity through 25 m.", bestFor: "Powerful starters with a fast, legal breakout", risk: "A rushed breakout can stall surface speed.", paceFactors: [0.76, 0.95, 1.04, 1.10] },
    { id: "balanced-power", name: "Balanced power", description: "Fast start, stable middle 20 m and limited speed decay into the wall.", bestFor: "Most sprint specialists", risk: "Needs clean transition timing; no phase can be merely average.", paceFactors: [0.82, 0.96, 1.02, 1.07] },
    { id: "surface-finish", name: "Surface-speed finish", description: "Keeps the start controlled enough to preserve maximal surface velocity after 25 m.", bestFor: "High-tempo swimmers with elite closing mechanics", risk: "May give away decisive water before 15 m.", paceFactors: [0.88, 0.99, 1.00, 0.97] },
  ];
  if (distance === 100) return [
    { id: "front-speed", name: "Front-speed hold", description: "Commits to the first 50 and manages controlled decay through the final 25.", bestFor: "Start- and speed-dominant sprinters", risk: "The last 15 m becomes expensive if the opening 50 exceeds sustainable speed.", paceFactors: [0.87, 0.98, 1.08, 1.13] },
    { id: "balanced-sprint", name: "Balanced sprint", description: "Uses the start without overspending and holds a narrow speed-loss curve.", bestFor: "Technically consistent all-round sprinters", risk: "Can lack separation if the field opens aggressively.", paceFactors: [0.91, 0.99, 1.05, 1.09] },
    { id: "back-half", name: "Back-half speed", description: "Controls the first 50 and builds tempo through the third and fourth 25s.", bestFor: "Aerobic sprinters and strong finishers", risk: "Requires enough first-lap speed to stay connected.", paceFactors: [0.95, 1.01, 1.03, 1.01] },
  ];
  if (distance === 200) return [
    { id: "controlled-aggression", name: "Controlled aggression", description: "Establishes position over the opening 100, then limits third-lap damage.", bestFor: "Speed-endurance swimmers", risk: "The third 50 exposes over-pacing immediately.", paceFactors: [0.91, 0.99, 1.06, 1.05] },
    { id: "even-pressure", name: "Even pressure", description: "Builds a compact split range with steady tempo and clean walls.", bestFor: "Technically repeatable swimmers", risk: "May not exploit exceptional top-end speed.", paceFactors: [0.94, 1.00, 1.03, 1.03] },
    { id: "back-half-build", name: "Back-half build", description: "Controls the first 100 and raises pressure from 100 to 175 m.", bestFor: "Aerobic athletes with a reliable finish", risk: "Leaving too much for the final 50 is tactically costly.", paceFactors: [0.97, 1.01, 1.02, 1.00] },
  ];
  const count = checkpoints.length;
  if (distance >= 800) return [
    { id: "even-economy", name: "Even economy", description: "Minimizes 50-to-50 variation and saves a controlled finishing change.", bestFor: "Rhythmic distance swimmers", risk: "Can become passive without a clear field-position plan.", paceFactors: distanceFactors(count, "even") },
    { id: "negative-build", name: "Negative build", description: "Keeps early lactate cost low and progressively increases pressure.", bestFor: "Endurance-dominant closers", risk: "The early pace cannot be so slow that the race is already lost.", paceFactors: distanceFactors(count, "back") },
    { id: "surge-control", name: "Surge control", description: "Uses planned pace changes every 200 m while returning to an economical base.", bestFor: "Tactical racers who tolerate speed changes", risk: "Unplanned surges waste energy and distort stroke mechanics.", paceFactors: distanceFactors(count, "surge") },
  ];
  return [
    { id: "early-pressure", name: "Early pressure", description: "Claims position through the opening half and protects the final quarter.", bestFor: "Speed-oriented middle-distance swimmers", risk: "Small early excess becomes large late-race decay.", paceFactors: distanceFactors(count, "front") },
    { id: "even-pace", name: "Even pace", description: "Holds a narrow split band with a planned last-50 change.", bestFor: "Aerobically stable swimmers", risk: "Requires confidence when others attack early.", paceFactors: distanceFactors(count, "even") },
    { id: "negative-split", name: "Negative split", description: "Controls the opening speed and builds continuously through the back half.", bestFor: "Endurance-dominant closers", risk: "Too conservative an opening creates an unreachable gap.", paceFactors: distanceFactors(count, "back") },
  ];
}

export function modelStandard(level: ReferenceLevel, event: string, sex: SexCategory, age: number, course: Course = "LCM") {
  const official = getStandard(level, event, sex, age, course);
  if (official != null) return { time: official, official: course === "LCM" || (course === "SCY" && level !== "World Class") };
  if (level === "Trials") {
    const national = getStandard("Nationals", event, sex, age, course);
    const world = getStandard("World Class", event, sex, age, course);
    if (national && world) return { time: Math.round((world + (national - world) * 0.52) * 100) / 100, official: false };
  }
  return { time: null, official: false };
}

export function getDerivedReferences(event: string, sex: SexCategory, age: number, course: Course = "LCM"): RaceReference[] {
  const levels: ReferenceLevel[] = ["Sectionals", "Nationals", "Trials", "World Class"];
  const checkpoints = defaultCheckpoints(event);
  return levels.flatMap((level) => {
    const standard = modelStandard(level, event, sex, age, course);
    if (!standard.time) return [];
    return strategyDefinitions(event).map((strategy) => ({
      id: `model-${course.toLowerCase()}-${level.toLowerCase().replace(" ", "-")}-${sex.toLowerCase()}-${event.toLowerCase().replace(" ", "-")}-${strategy.id}`,
      swimmer: `${course} ${level} strategy model`, event, sex, course,
      meet: standard.official ? "Official standard · modeled race shape" : "LaneLab equivalent · modeled race shape",
      date: level === "Trials" ? "2024 cycle" : level === "World Class" ? "2025 Worlds" : "2026 standards",
      level, total: standard.time,
      cumulative: normalizeFactors(checkpoints, strategy.paceFactors, standard.time),
      checkpoints, archetype: strategy.name,
      sourceName: course === "SCY" ? (level === "Sectionals" ? "2026 Speedo Sectionals SCY standards" : level === "Nationals" ? "2026 Winter Junior Championships SCY standards" : level === "Trials" ? "2027 NCAA Division I SCY standards" : "Current U.S. Open benchmark") : course === "SCM" ? "LaneLab record-ratio course equivalent" : level === "Sectionals" ? OFFICIAL_SOURCES[0].name : level === "Nationals" ? OFFICIAL_SOURCES[1].name : level === "Trials" ? (standard.official ? OFFICIAL_SOURCES[2].name : OFFICIAL_SOURCES[10].name) : OFFICIAL_SOURCES[10].name,
      sourceUrl: course === "SCY" ? (level === "Sectionals" ? "https://www.usaswimming.org/docs/default-source/timesdocuments/time-standards/2026/2026_speedosectionals_timestandards_max.pdf" : level === "Nationals" ? "https://www.usaswimming.org/docs/default-source/timesdocuments/time-standards/2026/11320828118_events_timestandards_2026_speedowinterjrs.pdf" : level === "Trials" ? "https://ncaaorg.s3.amazonaws.com/championships/sports/swimdive/d1/2026-27D1XSW_QUALSTANDARDS.pdf" : "https://www.usaswimming.org/times/otherorganizations/ncaa-division-i") : course === "SCM" ? "https://www.worldaquatics.com/swimming/records?pool=SCM&recordCode=WR" : level === "Sectionals" ? OFFICIAL_SOURCES[0].url : level === "Nationals" ? OFFICIAL_SOURCES[1].url : level === "Trials" ? (standard.official ? OFFICIAL_SOURCES[2].url : OFFICIAL_SOURCES[10].url) : OFFICIAL_SOURCES[10].url,
      verification: "secondary" as const, dataClass: "derived" as const,
      strategyDescription: strategy.description, bestFor: strategy.bestFor, risk: strategy.risk,
      notes: standard.official ? "Final-time anchor is official; intermediate checkpoints are a normalized LaneLab strategy model, not an observed athlete split." : course === "SCM" ? "Final-time anchor is a transparent record-ratio conversion from the matching LCM comparison. It is not an official qualifying time." : "This clearly labeled comparison is modeled; it is not an observed athlete split or official qualifying time.",
    }));
  });
}

export function genericCumulativeModel(event: string, total: number): number[] {
  const checkpoints = defaultCheckpoints(event);
  if (event.includes("IM")) {
    const distance = Number(event.match(/^\d+/)?.[0] || 200);
    const repeats = distance === 400 ? 2 : 1;
    return normalizeFactors(checkpoints, [0.88, 1.00, 1.23, 0.92].flatMap((factor) => Array(repeats).fill(factor)), total);
  }
  const strategies = strategyDefinitions(event);
  const balancedIds = new Set(["balanced-power", "balanced-sprint", "even-pressure", "even-pace", "even-economy"]);
  const balanced = strategies.find((strategy) => balancedIds.has(strategy.id)) || strategies[0];
  return normalizeFactors(checkpoints, balanced.paceFactors, total);
}

function fillCheckpointAnchors(event: string, total: number, anchors: Record<number, number>) {
  const checkpoints = defaultCheckpoints(event);
  const base = genericCumulativeModel(event, total);
  const values = Array(checkpoints.length).fill(0) as number[];
  const provenance = Array(checkpoints.length).fill("estimated") as Array<"official" | "secondary" | "estimated" | "coach">;
  const indexedAnchors = checkpoints.map((distance, index) => ({ distance, index, value: anchors[distance] }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0);
  if (!indexedAnchors.some((item) => item.index === checkpoints.length - 1)) indexedAnchors.push({ distance: checkpoints.at(-1) || 0, index: checkpoints.length - 1, value: total });
  indexedAnchors.sort((a, b) => a.index - b.index);
  let previousIndex = -1;
  let previousValue = 0;
  let previousBase = 0;
  indexedAnchors.forEach((anchor) => {
    const anchorBase = base[anchor.index];
    for (let index = previousIndex + 1; index <= anchor.index; index += 1) {
      if (index === anchor.index) values[index] = anchor.value;
      else {
        const baseShare = (base[index] - previousBase) / Math.max(0.001, anchorBase - previousBase);
        values[index] = Math.round((previousValue + baseShare * (anchor.value - previousValue)) * 100) / 100;
      }
    }
    previousIndex = anchor.index;
    previousValue = anchor.value;
    previousBase = anchorBase;
  });
  values[values.length - 1] = total;
  return { values, provenance };
}

const LCM_WORLD_RECORD_REFERENCES: RaceReference[] = WORLD_RECORD_SEEDS_LCM.map((seed) => {
  const checkpoints = defaultCheckpoints(seed.event);
  const completed = fillCheckpointAnchors(seed.event, seed.total, { ...(seed.knownSplits || {}), [checkpoints.at(-1) || 0]: seed.total });
  const checkpointProvenance = checkpoints.map((distance, index) => {
    if (distance === checkpoints.at(-1)) return seed.pendingRatification ? "secondary" as const : "official" as const;
    return seed.knownSplits?.[distance] != null ? (seed.knownSplitClass || "official") : completed.provenance[index];
  });
  const estimateNote = checkpointProvenance.includes("estimated")
    ? "Estimated checkpoints are event-normal balanced-race estimates and are not official timing marks."
    : "Every displayed checkpoint is sourced; see each checkpoint badge for official or secondary provenance.";
  return {
    id: `wr-${seed.sex.toLowerCase()}-${seed.event.toLowerCase().replaceAll(" ", "-")}`,
    swimmer: seed.swimmer, nation: seed.nation, event: seed.event, sex: seed.sex, course: "LCM",
    meet: seed.meet, date: seed.date, level: "World Class", total: seed.total,
    cumulative: completed.values, checkpoints, archetype: "Current world record",
    sourceName: "World Aquatics current LCM records", sourceUrl: OFFICIAL_SOURCES[11].url,
    verification: "official", dataClass: "world-record", checkpointProvenance,
    benchmarkKind: "world-record",
    recordStatus: seed.pendingRatification ? "pending" : "ratified",
    notes: [seed.notes, "Record total checked 11 August 2026.", estimateNote].filter(Boolean).join(" "),
  } satisfies RaceReference;
});

function buildCourseBenchmarks(course: "SCM" | "SCY", seeds: typeof WORLD_RECORD_SEEDS_SCM, benchmarkKind: "world-record" | "us-open-record") {
  return seeds.map((seed) => {
    const checkpoints = defaultCheckpoints(seed.event, course);
    const completed = fillCheckpointAnchors(seed.event, seed.total, { [checkpoints.at(-1) || 0]: seed.total });
    return {
      id: `${course.toLowerCase()}-${benchmarkKind}-${seed.sex.toLowerCase()}-${seed.event.toLowerCase().replaceAll(" ", "-")}`,
      swimmer: seed.swimmer, nation: seed.nation, event: seed.event, sex: seed.sex, course,
      meet: seed.meet, date: seed.date, level: "World Class" as const, total: seed.total,
      cumulative: completed.values, checkpoints,
      archetype: benchmarkKind === "world-record" ? "Current SCM world record" : "Current SCY U.S. Open benchmark",
      sourceName: benchmarkKind === "world-record" ? "World Aquatics current SCM records" : "U.S. Open / NCAA SCY record tracker",
      sourceUrl: benchmarkKind === "world-record" ? "https://www.worldaquatics.com/swimming/records?pool=SCM&recordCode=WR" : "https://www.usaswimming.org/times/otherorganizations/ncaa-division-i",
      verification: "official" as const, dataClass: "world-record" as const, benchmarkKind,
      checkpointProvenance: checkpoints.map((_, index) => index === checkpoints.length - 1 ? "official" as const : "estimated" as const),
      recordStatus: "ratified" as const,
      notes: [seed.notes, benchmarkKind === "world-record" ? "SCM record total checked 11 August 2026." : "SCY has no World Aquatics world-record category; this is a U.S. Open benchmark in a 25-yard pool.", "Intermediate checkpoints are visibly modeled unless an official split is supplied."].filter(Boolean).join(" "),
    } satisfies RaceReference;
  });
}

export const SCM_WORLD_RECORD_REFERENCES = buildCourseBenchmarks("SCM", WORLD_RECORD_SEEDS_SCM, "world-record");
export const SCY_RECORD_REFERENCES = buildCourseBenchmarks("SCY", US_OPEN_RECORD_SEEDS_SCY, "us-open-record");
export const WORLD_RECORD_REFERENCES: RaceReference[] = [...LCM_WORLD_RECORD_REFERENCES, ...SCM_WORLD_RECORD_REFERENCES, ...SCY_RECORD_REFERENCES];

export function getRecordBenchmark(event: string, sex: SexCategory, course: Course = "LCM") {
  return WORLD_RECORD_REFERENCES.find((record) => record.event === event && record.sex === sex && record.course === course) || null;
}

export function getWorldRecord(event: string, sex: SexCategory, course: Course = "LCM") {
  return getRecordBenchmark(event, sex, course);
}

export type CourseConversion = {
  time: number;
  event: string;
  from: Course;
  to: Course;
  method: "same-course" | "record-ratio" | "ncaa-factor" | "two-step-estimate";
  factor: number;
  officialEntryTime: false;
  note: string;
};

export function convertCourseTime(time: number, event: string, sex: SexCategory, from: Course, to: Course): CourseConversion {
  const targetEvent = equivalentEvent(event, from, to);
  if (!time || from === to) return { time, event: targetEvent, from, to, method: "same-course", factor: 1, officialEntryTime: false, note: "No course conversion applied." };

  if ((from === "SCM" && to === "SCY") || (from === "SCY" && to === "SCM")) {
    const metricEvent = from === "SCM" ? event : equivalentEvent(event, "SCY", "SCM");
    const scmToScy = NCAA_SCM_TO_SCY_FACTORS[metricEvent] || 0.906;
    const factor = from === "SCM" ? scmToScy : 1 / scmToScy;
    return {
      time: Math.trunc(time * factor * 100) / 100, event: targetEvent, from, to,
      method: "ncaa-factor", factor, officialEntryTime: false,
      note: "Uses the published NCAA SCM↔SCY conversion factor and truncates beyond hundredths. Meet-entry acceptance still depends on the governing meet.",
    };
  }

  if ((from === "LCM" && to === "SCY") || (from === "SCY" && to === "LCM")) {
    const first = convertCourseTime(time, event, sex, from, "SCM");
    const second = convertCourseTime(first.time, first.event, sex, "SCM", to);
    return {
      ...second, from, method: "two-step-estimate", factor: time ? second.time / time : 0,
      note: "Two-step planning estimate: current LCM↔SCM record ratio, then the published NCAA SCM↔SCY factor. It is not an official meet-entry conversion.",
    };
  }

  const source = getRecordBenchmark(event, sex, from);
  const target = getRecordBenchmark(targetEvent, sex, to);
  if (source && target) {
    const factor = target.total / source.total;
    return {
      time: Math.round(time * factor * 100) / 100, event: targetEvent, from, to,
      method: "record-ratio", factor, officialEntryTime: false,
      note: "Performance estimate scaled by the current same-sex course-record ratio. It is not an official meet-entry conversion.",
    };
  }

  return { time, event: targetEvent, from, to, method: "two-step-estimate", factor: 1, officialEntryTime: false, note: "No exact course benchmark was available. The source time is retained and must not be used for meet entry." };
}

export type AthleteStrategyProfile = {
  age?: number; weightKg?: number; heightCm?: number;
  speed?: number; aerobic?: number; lactateTolerance?: number;
  power?: number; strength?: number; turns?: number; underwater?: number; technique?: number; mobility?: number;
};

export function rankStrategies(event: string, profile: AthleteStrategyProfile = {}) {
  const distance = Number(event.match(/^\d+/)?.[0] || 200);
  const p = (key: keyof AthleteStrategyProfile, fallback = 5.5) => Math.max(1, Math.min(10, Number(profile[key]) || fallback));
  return strategyDefinitions(event).map((strategy) => {
    let fit = 64;
    const id = strategy.id;
    if (/underwater|front|early|fly-led|controlled-aggression/.test(id)) fit += (p("power") + p("strength") + p("speed") + p("underwater") - 22) * 2.25;
    if (/balanced|even/.test(id)) fit += (p("technique") + p("turns") + p("aerobic") + p("mobility") - 22) * 1.9;
    if (/back|negative|free-close/.test(id)) fit += (p("aerobic") + p("lactateTolerance") + p("technique") - 16.5) * 3;
    if (/surge|breast-built/.test(id)) fit += (p("lactateTolerance") + p("turns") - 11) * 2.5;
    if (distance >= 400) fit += (p("aerobic") - 5.5) * 2;
    if (distance <= 100) fit += (p("speed") - 5.5) * 2;
    return { ...strategy, fit: Math.max(30, Math.min(98, Math.round(fit))) };
  }).sort((a, b) => b.fit - a.fit);
}

export function coursePoints2026(time: number, event: string, sex: SexCategory, course: Course = "LCM") {
  const base = course === "LCM" ? AQUA_2026_LCM_BASES[event]?.[sex] : course === "SCM" ? AQUA_2026_SCM_BASES[event]?.[sex] : getRecordBenchmark(event, sex, "SCY")?.total;
  if (!base || !time) return { points: 0, base: null };
  return { points: Math.trunc(1000 * Math.pow(base / time, 3)), base, official: course !== "SCY" };
}

export function aquaPoints2026(time: number, event: string, sex: SexCategory, course: Course = "LCM") {
  const result = coursePoints2026(time, event, sex, course);
  return { points: result.points, base: result.base };
}

export function agePerformanceScore(time: number, age: number, sex: SexCategory, event: string, course: Course = "LCM") {
  const normalizedAge = Math.max(10, Math.min(18, Math.round(age)));
  const lcmEvent = equivalentEvent(event, course, "LCM");
  const lcmTime = course === "LCM" ? time : convertCourseTime(time, event, sex, course, "LCM").time;
  const cuts = SINGLE_AGE_LCM_STANDARDS[normalizedAge]?.[sex]?.[lcmEvent];
  if (!cuts?.length || age < 10 || age > 18 || !time) return null;
  const scores = [90, 80, 70, 60, 45, 30];
  const record = getWorldRecord(lcmEvent, sex, "LCM")?.total || cuts[0] * 0.75;
  if (lcmTime <= cuts[0]) {
    const span = Math.max(0.01, cuts[0] - record);
    return Math.round(Math.max(90, Math.min(100, 100 - ((lcmTime - record) / span) * 10)));
  }
  for (let index = 1; index < cuts.length; index += 1) {
    if (lcmTime <= cuts[index]) {
      const share = (lcmTime - cuts[index - 1]) / Math.max(0.01, cuts[index] - cuts[index - 1]);
      return Math.round(scores[index - 1] + share * (scores[index] - scores[index - 1]));
    }
  }
  return Math.round(Math.max(0, 30 * (1 - (lcmTime - cuts.at(-1)!) / (cuts.at(-1)! * 0.5))));
}

export function performanceScores(time: number, age: number, sex: SexCategory, event: string, goalTime: number, course: Course = "LCM") {
  const aqua = aquaPoints2026(time, event, sex, course);
  const ageScore = agePerformanceScore(time, age, sex, event, course);
  const goalReadiness = goalTime > 0 && time > 0 ? Math.round(Math.min(100, 100 * Math.pow(goalTime / time, 3))) : 0;
  const aquaAsHundred = Math.min(100, aqua.points / 10);
  const setcraft = ageScore == null
    ? Math.round(aquaAsHundred * 0.8 + goalReadiness * 0.2)
    : Math.round(aquaAsHundred * 0.6 + ageScore * 0.25 + goalReadiness * 0.15);
  const record = getWorldRecord(event, sex, course);
  return { aquaPoints: aqua.points, aquaBase: aqua.base, ageScore, goalReadiness, setcraftScore: Math.max(0, Math.min(100, setcraft)), liveWorldRecord: record?.total || null, worldRecordGapPct: record && time ? ((time - record.total) / record.total) * 100 : null };
}

export type CompletedSplitInput = {
  values: number[];
  enteredMask: boolean[];
  estimatedMask: boolean[];
  issues: string[];
};

export function completeCumulativeSplits(value: string, total: number, event: string, preferredModel?: number[], course: Course = "LCM"): CompletedSplitInput {
  const checkpoints = defaultCheckpoints(event, course);
  const base = preferredModel?.length === checkpoints.length ? preferredModel.map((item) => item / preferredModel.at(-1)! * total) : genericCumulativeModel(event, total);
  const rawTokens = value.trim() ? value.split(/[;,\n]/).map((item) => item.trim()) : [];
  const enteredMask = checkpoints.map((_, index) => Boolean(rawTokens[index] && timeToSeconds(rawTokens[index]) > 0));
  const issues: string[] = [];
  const anchors: Array<{ index: number; value: number }> = [{ index: -1, value: 0 }];
  let lastValue = 0;
  checkpoints.forEach((_, index) => {
    const parsed = enteredMask[index] ? timeToSeconds(rawTokens[index]) : 0;
    if (!parsed) return;
    if (parsed <= lastValue || (index < checkpoints.length - 1 && parsed >= total)) {
      enteredMask[index] = false;
      issues.push(`Checkpoint ${checkpoints[index]} ${courseUnit(course)} was not monotonic and was estimated instead.`);
      return;
    }
    anchors.push({ index, value: parsed });
    lastValue = parsed;
  });
  if (!anchors.some((item) => item.index === checkpoints.length - 1)) anchors.push({ index: checkpoints.length - 1, value: total });
  else if (Math.abs(anchors.at(-1)!.value - total) > 0.11) {
    anchors[anchors.length - 1] = { index: checkpoints.length - 1, value: total };
    enteredMask[checkpoints.length - 1] = false;
    issues.push("The final split did not match the final time and was replaced by the final time.");
  }
  const values = Array(checkpoints.length).fill(0) as number[];
  for (let anchorIndex = 1; anchorIndex < anchors.length; anchorIndex += 1) {
    const left = anchors[anchorIndex - 1];
    const right = anchors[anchorIndex];
    const leftBase = left.index >= 0 ? base[left.index] : 0;
    const rightBase = base[right.index];
    for (let index = left.index + 1; index <= right.index; index += 1) {
      if (index === right.index) values[index] = right.value;
      else {
        const share = (base[index] - leftBase) / Math.max(0.001, rightBase - leftBase);
        values[index] = Math.round((left.value + share * (right.value - left.value)) * 100) / 100;
      }
    }
  }
  values[values.length - 1] = total;
  return { values, enteredMask, estimatedMask: enteredMask.map((entered) => !entered), issues };
}

export type TimingStatus = "official" | "self-reported" | "training";

export function splitTokens(value: string, count: number) {
  const tokens = value ? value.split(/[;,\n]/).map((item) => item.trim()) : [];
  return Array.from({ length: count }, (_, index) => tokens[index] || "");
}

export function inputQualityScore(input: {
  event: string; course: Course; total: number; cumulative: number[]; enteredMask: boolean[];
  age: number; goalTime: number; timingStatus: TimingStatus; physiologyEnabled: boolean;
  activePhysiologyValues: number[];
}) {
  const checkpoints = defaultCheckpoints(input.event, input.course);
  const monotonic = input.cumulative.every((item, index) => item > 0 && (!index || item > input.cumulative[index - 1]));
  const raceTime = input.total > 0 ? 25 : 0;
  const integrity = monotonic && Math.abs((input.cumulative.at(-1) || 0) - input.total) < 0.11 ? 10 : 0;
  const splitCertainty = checkpoints.reduce((sum, _, index) => sum + (input.enteredMask[index] ? 1 : 0.25), 0) / checkpoints.length * 35;
  const context = (input.age >= 5 && input.age <= 100 ? 2.5 : 0) + (input.goalTime > 0 ? 2.5 : 0);
  const provenance = input.timingStatus === "official" ? 25 : input.timingStatus === "self-reported" ? 16 : 10;
  const earned = raceTime + integrity + splitCertainty + context + provenance;
  return {
    score: Math.round(earned),
    breakdown: { raceTime, integrity, splitCertainty: Math.round(splitCertainty), context, provenance, profile: 0 },
    enteredSplits: input.enteredMask.filter(Boolean).length,
    estimatedSplits: input.enteredMask.filter((entered) => !entered).length,
  };
}

export function confidenceScore(event: string, course: Course, cumulative: number[], total: number) {
  const enteredMask = defaultCheckpoints(event).map((_, index) => cumulative[index] != null);
  return inputQualityScore({ event, course, cumulative, total, enteredMask, age: 15, goalTime: total, timingStatus: "self-reported", physiologyEnabled: false, activePhysiologyValues: [] }).score;
}
