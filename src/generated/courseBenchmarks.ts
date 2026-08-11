export type CourseSeed = {
  event: string;
  sex: "Men" | "Women";
  swimmer: string;
  nation: string;
  total: number;
  date: string;
  meet: string;
  notes?: string;
};

export type StandardsByEvent = Record<string, { Men: number; Women: number }>;

// Official World Aquatics 2026 short-course points bases. For the current
// validity period these are also the current SCM record benchmark in most
// events. Record totals below were reconciled with the live record catalogue
// on 11 August 2026; newer 2025 records replace the January points base where
// applicable.
export const AQUA_2026_SCM_BASES: StandardsByEvent = {
  "50 Free": { Men: 19.90, Women: 22.83 }, "100 Free": { Men: 44.84, Women: 50.25 },
  "200 Free": { Men: 98.61, Women: 110.31 }, "400 Free": { Men: 212.25, Women: 230.25 },
  "800 Free": { Men: 440.46, Women: 477.42 }, "1500 Free": { Men: 846.88, Women: 908.24 },
  "50 Back": { Men: 22.11, Women: 25.23 }, "100 Back": { Men: 48.33, Women: 54.02 },
  "200 Back": { Men: 105.63, Women: 118.04 }, "50 Breast": { Men: 24.95, Women: 28.37 },
  "100 Breast": { Men: 55.28, Women: 62.36 }, "200 Breast": { Men: 120.16, Women: 132.50 },
  "50 Fly": { Men: 21.32, Women: 23.94 }, "100 Fly": { Men: 47.71, Women: 52.71 },
  "200 Fly": { Men: 106.85, Women: 119.32 }, "100 IM": { Men: 49.28, Women: 55.11 },
  "200 IM": { Men: 108.88, Women: 121.63 }, "400 IM": { Men: 234.81, Women: 255.48 },
};

export const WORLD_RECORD_SEEDS_SCM: CourseSeed[] = [
  { event: "50 Free", sex: "Men", swimmer: "Jordan Crooks", nation: "CAY", total: 19.90, date: "2024-12-14", meet: "World Aquatics Championships (25m)" },
  { event: "100 Free", sex: "Men", swimmer: "Kyle Chalmers", nation: "AUS", total: 44.84, date: "2021-10-29", meet: "FINA Swimming World Cup" },
  { event: "200 Free", sex: "Men", swimmer: "Luke Hobson", nation: "USA", total: 98.61, date: "2024-12-15", meet: "World Aquatics Championships (25m)" },
  { event: "400 Free", sex: "Men", swimmer: "Yannick Agnel", nation: "FRA", total: 212.25, date: "2012-11-15", meet: "French Championships" },
  { event: "800 Free", sex: "Men", swimmer: "Daniel Wiffen", nation: "IRL", total: 440.46, date: "2023-12-10", meet: "European Short Course Championships" },
  { event: "1500 Free", sex: "Men", swimmer: "Florian Wellbrock", nation: "GER", total: 846.88, date: "2021-12-21", meet: "World Championships (25m)" },
  { event: "50 Back", sex: "Men", swimmer: "Kliment Kolesnikov", nation: "RUS", total: 22.11, date: "2022-11-23", meet: "Solidarity Games" },
  { event: "100 Back", sex: "Men", swimmer: "Hubert Kós", nation: "HUN", total: 48.16, date: "2025-10-25", meet: "World Aquatics Swimming World Cup" },
  { event: "200 Back", sex: "Men", swimmer: "Hubert Kós", nation: "HUN", total: 105.12, date: "2025-10-23", meet: "World Aquatics Swimming World Cup" },
  { event: "50 Breast", sex: "Men", swimmer: "Emre Sakci", nation: "TUR", total: 24.95, date: "2021-12-27", meet: "Turkish Championships" },
  { event: "100 Breast", sex: "Men", swimmer: "Ilya Shymanovich", nation: "NAA", total: 55.28, date: "2021-12-03", meet: "International Swimming League" },
  { event: "200 Breast", sex: "Men", swimmer: "Caspar Corbeau", nation: "NED", total: 119.52, date: "2025-10-25", meet: "World Aquatics Swimming World Cup" },
  { event: "50 Fly", sex: "Men", swimmer: "Noe Ponti", nation: "SUI", total: 21.32, date: "2024-12-11", meet: "World Aquatics Championships (25m)" },
  { event: "100 Fly", sex: "Men", swimmer: "Josh Liendo", nation: "CAN", total: 47.68, date: "2025-10-23", meet: "World Aquatics Swimming World Cup" },
  { event: "200 Fly", sex: "Men", swimmer: "Tomoru Honda", nation: "JPN", total: 106.85, date: "2022-10-22", meet: "Japan Short Course Championships" },
  { event: "100 IM", sex: "Men", swimmer: "Caeleb Dressel", nation: "USA", total: 49.28, date: "2020-11-22", meet: "International Swimming League" },
  { event: "200 IM", sex: "Men", swimmer: "Leon Marchand", nation: "FRA", total: 108.88, date: "2024-11-01", meet: "World Aquatics Swimming World Cup" },
  { event: "400 IM", sex: "Men", swimmer: "Daiya Seto", nation: "JPN", total: 234.81, date: "2019-12-20", meet: "International Swimming League" },

  { event: "50 Free", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 22.83, date: "2024-12-15", meet: "World Aquatics Championships (25m)" },
  { event: "100 Free", sex: "Women", swimmer: "Kate Douglass", nation: "USA", total: 49.93, date: "2025-10-25", meet: "World Aquatics Swimming World Cup" },
  { event: "200 Free", sex: "Women", swimmer: "Mollie O'Callaghan", nation: "AUS", total: 109.36, date: "2025-10-24", meet: "World Aquatics Swimming World Cup" },
  { event: "400 Free", sex: "Women", swimmer: "Summer McIntosh", nation: "CAN", total: 230.25, date: "2024-12-10", meet: "World Aquatics Championships (25m)" },
  { event: "800 Free", sex: "Women", swimmer: "Lani Pallister", nation: "AUS", total: 474.00, date: "2025-10-25", meet: "World Aquatics Swimming World Cup" },
  { event: "1500 Free", sex: "Women", swimmer: "Katie Ledecky", nation: "USA", total: 908.24, date: "2022-11-05", meet: "FINA Swimming World Cup" },
  { event: "50 Back", sex: "Women", swimmer: "Regan Smith", nation: "USA", total: 25.23, date: "2024-12-13", meet: "World Aquatics Championships (25m)" },
  { event: "100 Back", sex: "Women", swimmer: "Regan Smith", nation: "USA", total: 54.02, date: "2024-12-13", meet: "World Aquatics Championships (25m)" },
  { event: "200 Back", sex: "Women", swimmer: "Kaylee McKeown", nation: "AUS", total: 117.33, date: "2025-10-25", meet: "World Aquatics Swimming World Cup" },
  { event: "50 Breast", sex: "Women", swimmer: "Ruta Meilutyte", nation: "LTU", total: 28.37, date: "2022-12-17", meet: "World Championships (25m)" },
  { event: "100 Breast", sex: "Women", swimmer: "Ruta Meilutyte / Alia Atkinson", nation: "LTU/JAM", total: 62.36, date: "2022-12-15", meet: "World Championships (25m) · joint record" },
  { event: "200 Breast", sex: "Women", swimmer: "Kate Douglass", nation: "USA", total: 132.50, date: "2024-12-13", meet: "World Aquatics Championships (25m)" },
  { event: "50 Fly", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 23.94, date: "2024-12-14", meet: "World Aquatics Championships (25m)" },
  { event: "100 Fly", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 52.71, date: "2024-12-13", meet: "World Aquatics Championships (25m)" },
  { event: "200 Fly", sex: "Women", swimmer: "Summer McIntosh", nation: "CAN", total: 119.32, date: "2024-12-12", meet: "World Aquatics Championships (25m)" },
  { event: "100 IM", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 55.11, date: "2024-12-13", meet: "World Aquatics Championships (25m)" },
  { event: "200 IM", sex: "Women", swimmer: "Kate Douglass", nation: "USA", total: 121.63, date: "2024-10-31", meet: "World Aquatics Swimming World Cup" },
  { event: "400 IM", sex: "Women", swimmer: "Summer McIntosh", nation: "CAN", total: 255.48, date: "2024-12-14", meet: "World Aquatics Championships (25m)" },
];

// SCY has no World Aquatics world-record category. These are current U.S. Open
// records / fastest recognized performances achieved in U.S. 25-yard pools.
export const US_OPEN_RECORD_SEEDS_SCY: CourseSeed[] = [
  { event: "50 Free", sex: "Men", swimmer: "Caeleb Dressel", nation: "USA", total: 17.63, date: "2018-03-22", meet: "NCAA Division I Championships" },
  { event: "100 Free", sex: "Men", swimmer: "Jordan Crooks", nation: "CAY", total: 39.83, date: "2025-03-29", meet: "NCAA Division I Championships" },
  { event: "200 Free", sex: "Men", swimmer: "Luke Hobson", nation: "USA", total: 88.33, date: "2025-03-26", meet: "NCAA Division I Championships" },
  { event: "500 Free", sex: "Men", swimmer: "Leon Marchand", nation: "FRA", total: 242.31, date: "2023-03-23", meet: "NCAA Division I Championships" },
  { event: "1000 Free", sex: "Men", swimmer: "Luka Mijatovic", nation: "USA", total: 512.83, date: "2025-12-06", meet: "Texas Hall of Fame Invitational" },
  { event: "1650 Free", sex: "Men", swimmer: "Ahmed Jaouadi", nation: "TUN", total: 850.03, date: "2025-03-29", meet: "NCAA Division I Championships" },
  { event: "100 Back", sex: "Men", swimmer: "Hubert Kos", nation: "HUN", total: 42.61, date: "2025-03-28", meet: "NCAA Division I Championships" },
  { event: "200 Back", sex: "Men", swimmer: "Hubert Kos", nation: "HUN", total: 94.13, date: "2025-03-29", meet: "NCAA Division I Championships" },
  { event: "100 Breast", sex: "Men", swimmer: "Julian Smith", nation: "USA", total: 49.51, date: "2025-03-28", meet: "NCAA Division I Championships" },
  { event: "200 Breast", sex: "Men", swimmer: "Leon Marchand", nation: "FRA", total: 106.35, date: "2023-03-25", meet: "NCAA Division I Championships" },
  { event: "100 Fly", sex: "Men", swimmer: "Josh Liendo", nation: "CAN", total: 42.49, date: "2025-03-28", meet: "NCAA Division I Championships" },
  { event: "200 Fly", sex: "Men", swimmer: "Luca Urlando", nation: "USA", total: 96.41, date: "2025-03-29", meet: "NCAA Division I Championships" },
  { event: "200 IM", sex: "Men", swimmer: "Leon Marchand", nation: "FRA", total: 96.34, date: "2023-03-23", meet: "NCAA Division I Championships" },
  { event: "400 IM", sex: "Men", swimmer: "Leon Marchand", nation: "FRA", total: 208.82, date: "2023-03-24", meet: "NCAA Division I Championships" },

  { event: "50 Free", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 20.37, date: "2025-03-20", meet: "NCAA Division I Championships" },
  { event: "100 Free", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 44.71, date: "2025-03-22", meet: "NCAA Division I Championships" },
  { event: "200 Free", sex: "Women", swimmer: "Missy Franklin", nation: "USA", total: 99.10, date: "2015-03-20", meet: "NCAA Division I Championships" },
  { event: "500 Free", sex: "Women", swimmer: "Katie Ledecky", nation: "USA", total: 264.06, date: "2017-02-01", meet: "Pac-12 Championships" },
  { event: "1000 Free", sex: "Women", swimmer: "Katie Ledecky", nation: "USA", total: 539.65, date: "2015-11-20", meet: "Art Adamson Invitational" },
  { event: "1650 Free", sex: "Women", swimmer: "Katie Ledecky", nation: "USA", total: 899.62, date: "2017-11-18", meet: "Art Adamson Invitational" },
  { event: "100 Back", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 48.10, date: "2025-03-21", meet: "NCAA Division I Championships" },
  { event: "200 Back", sex: "Women", swimmer: "Claire Curzan", nation: "USA", total: 106.09, date: "2024-03-23", meet: "NCAA Division I Championships" },
  { event: "100 Breast", sex: "Women", swimmer: "Lilly King", nation: "USA", total: 55.73, date: "2019-03-22", meet: "NCAA Division I Championships" },
  { event: "200 Breast", sex: "Women", swimmer: "Kate Douglass", nation: "USA", total: 121.29, date: "2023-03-18", meet: "NCAA Division I Championships" },
  { event: "100 Fly", sex: "Women", swimmer: "Gretchen Walsh", nation: "USA", total: 46.97, date: "2025-03-21", meet: "NCAA Division I Championships" },
  { event: "200 Fly", sex: "Women", swimmer: "Regan Smith", nation: "USA", total: 108.33, date: "2024-12-06", meet: "U.S. Open" },
  { event: "200 IM", sex: "Women", swimmer: "Kate Douglass", nation: "USA", total: 108.37, date: "2023-03-16", meet: "NCAA Division I Championships" },
  { event: "400 IM", sex: "Women", swimmer: "Ella Eastin", nation: "USA", total: 234.60, date: "2018-03-16", meet: "NCAA Division I Championships" },
];

export const SECTIONALS_2026_SCY: StandardsByEvent = {
  "50 Free": { Men: 21.69, Women: 24.49 }, "100 Free": { Men: 47.39, Women: 53.09 }, "200 Free": { Men: 103.79, Women: 113.79 },
  "500 Free": { Men: 282.19, Women: 305.09 }, "1000 Free": { Men: 582.99, Women: 628.79 }, "1650 Free": { Men: 984.39, Women: 1045.69 },
  "50 Back": { Men: 24.49, Women: 27.29 }, "100 Back": { Men: 53.39, Women: 58.99 }, "200 Back": { Men: 114.89, Women: 127.19 },
  "50 Breast": { Men: 27.19, Women: 30.69 }, "100 Breast": { Men: 59.19, Women: 66.89 }, "200 Breast": { Men: 129.69, Women: 144.69 },
  "50 Fly": { Men: 23.69, Women: 26.69 }, "100 Fly": { Men: 52.09, Women: 58.19 }, "200 Fly": { Men: 115.09, Women: 128.89 },
  "200 IM": { Men: 117.09, Women: 129.29 }, "400 IM": { Men: 251.19, Women: 273.39 },
};

export const WINTER_JUNIORS_2026_SCY: StandardsByEvent = {
  "50 Free": { Men: 20.49, Women: 23.29 }, "100 Free": { Men: 44.89, Women: 50.39 }, "200 Free": { Men: 98.39, Women: 109.09 },
  "500 Free": { Men: 268.19, Women: 293.59 }, "1000 Free": { Men: 562.69, Women: 611.49 }, "1650 Free": { Men: 940.39, Women: 1022.19 },
  "100 Back": { Men: 49.19, Women: 55.09 }, "200 Back": { Men: 107.79, Women: 119.39 }, "100 Breast": { Men: 55.49, Women: 63.09 },
  "200 Breast": { Men: 121.59, Women: 131.19 }, "100 Fly": { Men: 48.69, Women: 54.69 }, "200 Fly": { Men: 109.09, Women: 121.69 },
  "200 IM": { Men: 109.59, Women: 122.19 }, "400 IM": { Men: 236.49, Women: 261.69 },
};

export const NCAA_2027_DI_SCY: StandardsByEvent = {
  "50 Free": { Men: 19.22, Women: 22.26 }, "100 Free": { Men: 42.33, Women: 48.55 }, "200 Free": { Men: 93.29, Women: 105.39 },
  "500 Free": { Men: 256.64, Women: 284.93 }, "1650 Free": { Men: 903.96, Women: 994.79 },
  "100 Back": { Men: 45.84, Women: 52.59 }, "200 Back": { Men: 101.11, Women: 115.16 }, "100 Breast": { Men: 52.18, Women: 60.41 },
  "200 Breast": { Men: 114.08, Women: 131.08 }, "100 Fly": { Men: 45.59, Women: 52.60 }, "200 Fly": { Men: 103.10, Women: 117.38 },
  "200 IM": { Men: 103.99, Women: 118.66 }, "400 IM": { Men: 224.39, Women: 253.32 },
};

export const NCAA_SCM_TO_SCY_FACTORS: Record<string, number> = {
  "400 Free": 1.153, "800 Free": 1.153, "1500 Free": 1.013,
};

