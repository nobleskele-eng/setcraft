import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const failures = [];
const required = [
  "app/page.tsx",
  "app/studio/page.tsx",
  "app/login/page.tsx",
  "app/signup/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/terms/page.tsx",
  "app/privacy/page.tsx",
  "app/contact/page.tsx",
  "app/api/gemini/[action]/route.ts",
  "drizzle/0000_lumpy_fantastic_four.sql",
  "drizzle/0001_bent_frightful_four.sql",
  "drizzle/0002_special_fabian_cortez.sql",
  "drizzle/0003_strong_lionheart.sql",
  "public/og-lanelab.png",
  "wrangler.jsonc",
  "scripts/setup-cloudflare.ps1",
];

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) failures.push(`Missing required file: ${relative}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (pkg.name !== "lanelab-swim-studio") failures.push("Unexpected package name.");
if (pkg.version !== "5.0.0") failures.push("Expected the v23 production package version (5.0.0).");

const wrangler = JSON.parse(fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8"));
const db = wrangler.d1_databases?.find((binding) => binding.binding === "DB");
if (!db) failures.push("wrangler.jsonc is missing the DB binding.");
if (db?.migrations_dir !== "drizzle") failures.push("The DB binding is missing its migrations directory.");
for (const host of ["lanelab.studio", "www.lanelab.studio"]) {
  if (!wrangler.routes?.some((route) => route.pattern === host && route.custom_domain === true)) {
    failures.push(`Missing custom domain route: ${host}`);
  }
}
if (!wrangler.assets || !wrangler.images) failures.push("Cloudflare asset or image binding is missing.");

for (const unsafe of [".env", ".env.local", ".dev.vars"]) {
  if (fs.existsSync(path.join(root, unsafe))) failures.push(`Remove local secret file before release: ${unsafe}`);
}

if (failures.length) {
  console.error("LaneLab release validation failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

const placeholder = db.database_id === "00000000-0000-4000-8000-000000000000";
console.log("LaneLab v23 release structure is valid.");
console.log(placeholder
  ? "The D1 ID is intentionally unconfigured; setup-cloudflare.ps1 will create the database and replace it."
  : `D1 is configured for ${db.database_name}.`);
