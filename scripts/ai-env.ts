import fs from "node:fs";
import path from "node:path";

function decodeEnvValue(rawValue: string) {
  const value = rawValue.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    const unquoted = value.slice(1, -1);
    return value.startsWith('"')
      ? unquoted.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\"/g, '"')
      : unquoted;
  }
  return value.replace(/\s+#.*$/, "").trim();
}

export function parseEnvFile(contents: string) {
  const values: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separator = normalized.indexOf("=");
    if (separator < 1) continue;
    const key = normalized.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    values[key] = decodeEnvValue(normalized.slice(separator + 1));
  }
  return values;
}

export function loadProjectEnv(root = process.cwd()) {
  const protectedKeys = new Set(Object.keys(process.env));
  const loadedFiles: string[] = [];
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) continue;
    const values = parseEnvFile(fs.readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(values)) {
      if (!protectedKeys.has(key)) process.env[key] = value;
    }
    loadedFiles.push(filePath);
  }
  return loadedFiles;
}

export function upsertEnvValue(filePath: string, key: string, value: string) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const line = `${key}=${value}`;
  const matcher = new RegExp(`^${key}=.*$`, "m");
  const next = matcher.test(existing)
    ? existing.replace(matcher, line)
    : `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}${line}\n`;
  fs.writeFileSync(filePath, next, "utf8");
}

