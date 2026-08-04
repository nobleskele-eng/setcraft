export type WorldRecordSeed = {
  event: string;
  sex: "Men" | "Women";
  swimmer: string;
  nation: string;
  total: number;
  date: string;
  meet: string;
  knownSplits?: Record<number, number>;
  knownSplitClass?: "official" | "secondary";
  notes?: string;
  pendingRatification?: boolean;
};

// Current individual long-course records checked against the World Aquatics
// record catalogue on 2026-08-04. A checkpoint is included here only when a
// result/race-analysis source was available with sufficient confidence. The
// Race Lab fills every other requested checkpoint with a visibly estimated,
// event-normal race shape; it never relabels those estimates as official.
export const WORLD_RECORD_SEEDS_LCM: WorldRecordSeed[] = [
  { event: "50 Free", sex: "Men", swimmer: "Cameron McEvoy", nation: "AUS", total: 20.88, date: "2026-03-20", meet: "China Open", knownSplits: { 15: 5.05, 25: 9.36, 35: 13.89, 50: 20.88 }, knownSplitClass: "secondary" },
  { event: "100 Free", sex: "Men", swimmer: "Pan Zhanle", nation: "CHN", total: 46.40, date: "2024-07-31", meet: "Paris Olympic Games", knownSplits: { 50: 22.28, 100: 46.40 }, knownSplitClass: "official" },
  { event: "200 Free", sex: "Men", swimmer: "Paul Biedermann", nation: "GER", total: 102.00, date: "2009-07-28", meet: "Rome World Championships", knownSplits: { 50: 24.23, 100: 50.12, 150: 76.30, 200: 102.00 }, knownSplitClass: "official", notes: "Polyurethane-era performance context." },
  { event: "400 Free", sex: "Men", swimmer: "Lukas Märtens", nation: "GER", total: 219.96, date: "2025-04-12", meet: "Swim Open Stockholm", knownSplits: { 50: 24.75, 100: 51.90, 150: 79.65, 200: 107.55, 250: 135.83, 300: 164.01, 350: 192.19, 400: 219.96 }, knownSplitClass: "secondary" },
  { event: "800 Free", sex: "Men", swimmer: "Zhang Lin", nation: "CHN", total: 452.12, date: "2009-07-29", meet: "Rome World Championships", notes: "Polyurethane-era performance context." },
  { event: "1500 Free", sex: "Men", swimmer: "Bobby Finke", nation: "USA", total: 870.67, date: "2024-08-04", meet: "Paris Olympic Games" },
  { event: "50 Back", sex: "Men", swimmer: "Kliment Kolesnikov", nation: "RUS", total: 23.55, date: "2023-07-27", meet: "Russian Cup" },
  { event: "100 Back", sex: "Men", swimmer: "Thomas Ceccon", nation: "ITA", total: 51.60, date: "2022-06-20", meet: "Budapest World Championships", knownSplits: { 50: 25.14, 100: 51.60 }, knownSplitClass: "official" },
  { event: "200 Back", sex: "Men", swimmer: "Aaron Peirsol", nation: "USA", total: 111.92, date: "2009-07-31", meet: "Rome World Championships", knownSplits: { 50: 26.58, 100: 55.14, 150: 83.59, 200: 111.92 }, knownSplitClass: "official", notes: "Polyurethane-era performance context." },
  { event: "50 Breast", sex: "Men", swimmer: "Adam Peaty", nation: "GBR", total: 25.95, date: "2017-07-25", meet: "Budapest World Championships" },
  { event: "100 Breast", sex: "Men", swimmer: "Adam Peaty", nation: "GBR", total: 56.88, date: "2019-07-21", meet: "Gwangju World Championships", knownSplits: { 50: 26.63, 100: 56.88 }, knownSplitClass: "official" },
  { event: "200 Breast", sex: "Men", swimmer: "Qin Haiyang", nation: "CHN", total: 125.48, date: "2023-07-28", meet: "Fukuoka World Championships", knownSplits: { 50: 28.03, 100: 59.78, 150: 92.10, 200: 125.48 }, knownSplitClass: "official" },
  { event: "50 Fly", sex: "Men", swimmer: "Andrii Govorov", nation: "UKR", total: 22.27, date: "2018-07-01", meet: "Sette Colli Trophy" },
  { event: "100 Fly", sex: "Men", swimmer: "Caeleb Dressel", nation: "USA", total: 49.45, date: "2021-07-31", meet: "Tokyo Olympic Games", knownSplits: { 50: 23.00, 100: 49.45 }, knownSplitClass: "official" },
  { event: "200 Fly", sex: "Men", swimmer: "Kristóf Milák", nation: "HUN", total: 110.34, date: "2022-06-21", meet: "Budapest World Championships", knownSplits: { 50: 24.19, 100: 52.39, 150: 80.91, 200: 110.34 }, knownSplitClass: "official" },
  { event: "200 IM", sex: "Men", swimmer: "Léon Marchand", nation: "FRA", total: 112.69, date: "2025-07-30", meet: "Singapore World Championships semifinal", knownSplits: { 50: 24.10, 100: 52.56, 150: 85.35, 200: 112.69 }, knownSplitClass: "official" },
  { event: "400 IM", sex: "Men", swimmer: "Léon Marchand", nation: "FRA", total: 242.50, date: "2023-07-23", meet: "Fukuoka World Championships" },

  { event: "50 Free", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 23.55, date: "2026-06-28", meet: "Sette Colli Trophy", pendingRatification: true, notes: "Displayed by World Aquatics as pending ratification on the 2026-08-04 check." },
  { event: "100 Free", sex: "Women", swimmer: "Marrit Steenbergen", nation: "NED", total: 51.68, date: "2026-06-27", meet: "Sette Colli Trophy" },
  { event: "200 Free", sex: "Women", swimmer: "Ariarne Titmus", nation: "AUS", total: 112.23, date: "2024-06-12", meet: "Australian Olympic Trials", knownSplits: { 50: 26.64, 100: 55.70, 150: 84.95, 200: 112.23 }, knownSplitClass: "official" },
  { event: "400 Free", sex: "Women", swimmer: "Summer McIntosh", nation: "CAN", total: 234.18, date: "2025-06-07", meet: "Canadian Trials" },
  { event: "800 Free", sex: "Women", swimmer: "Katie Ledecky", nation: "USA", total: 484.12, date: "2025-05-03", meet: "Fort Lauderdale Pro Swim Series" },
  { event: "1500 Free", sex: "Women", swimmer: "Katie Ledecky", nation: "USA", total: 920.48, date: "2018-05-16", meet: "Indianapolis Pro Swim Series" },
  { event: "50 Back", sex: "Women", swimmer: "Kaylee McKeown", nation: "AUS", total: 26.86, date: "2023-10-20", meet: "Budapest World Cup" },
  { event: "100 Back", sex: "Women", swimmer: "Regan Smith", nation: "USA", total: 57.13, date: "2024-06-18", meet: "U.S. Olympic Trials", knownSplits: { 50: 27.94, 100: 57.13 }, knownSplitClass: "official" },
  { event: "200 Back", sex: "Women", swimmer: "Kaylee McKeown", nation: "AUS", total: 123.14, date: "2023-03-10", meet: "NSW State Championships" },
  { event: "50 Breast", sex: "Women", swimmer: "Rūta Meilutytė", nation: "LTU", total: 29.16, date: "2023-07-30", meet: "Fukuoka World Championships" },
  { event: "100 Breast", sex: "Women", swimmer: "Lilly King", nation: "USA", total: 64.13, date: "2017-07-25", meet: "Budapest World Championships", knownSplits: { 50: 30.54, 100: 64.13 }, knownSplitClass: "official" },
  { event: "200 Breast", sex: "Women", swimmer: "Evgeniia Chikunova", nation: "RUS", total: 137.55, date: "2023-04-21", meet: "Russian Championships" },
  { event: "50 Fly", sex: "Women", swimmer: "Sarah Sjöström", nation: "SWE", total: 24.43, date: "2014-07-05", meet: "Swedish Championships" },
  { event: "100 Fly", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 54.33, date: "2026-05-02", meet: "Fort Lauderdale Open" },
  { event: "200 Fly", sex: "Women", swimmer: "Summer McIntosh", nation: "CAN", total: 121.65, date: "2026-07-05", meet: "Canadian Trials", pendingRatification: true },
  { event: "200 IM", sex: "Women", swimmer: "Summer McIntosh", nation: "CAN", total: 125.70, date: "2025-06-09", meet: "Canadian Trials" },
  { event: "400 IM", sex: "Women", swimmer: "Summer McIntosh", nation: "CAN", total: 263.65, date: "2025-06-11", meet: "Canadian Trials" },
];

export const AQUA_2026_LCM_BASES: Record<string, { Men: number; Women: number }> = {
  "50 Free": { Men: 20.91, Women: 23.61 },
  "100 Free": { Men: 46.40, Women: 51.71 },
  "200 Free": { Men: 102.00, Women: 112.23 },
  "400 Free": { Men: 219.96, Women: 234.18 },
  "800 Free": { Men: 452.12, Women: 484.12 },
  "1500 Free": { Men: 870.67, Women: 920.48 },
  "50 Back": { Men: 23.55, Women: 26.86 },
  "100 Back": { Men: 51.60, Women: 57.13 },
  "200 Back": { Men: 111.92, Women: 123.14 },
  "50 Breast": { Men: 25.95, Women: 29.16 },
  "100 Breast": { Men: 56.88, Women: 64.13 },
  "200 Breast": { Men: 125.48, Women: 137.55 },
  "50 Fly": { Men: 22.27, Women: 24.43 },
  "100 Fly": { Men: 49.45, Women: 54.60 },
  "200 Fly": { Men: 110.34, Women: 121.81 },
  "200 IM": { Men: 112.69, Women: 125.70 },
  "400 IM": { Men: 242.50, Women: 263.65 },
};
