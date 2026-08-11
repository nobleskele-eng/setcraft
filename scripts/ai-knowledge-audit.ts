import fs from "node:fs";
import path from "node:path";

const REQUIRED = ["title", "review_status", "reviewer", "review_date", "applies_to"] as const;
const ALLOWED_STATUSES = new Set(["draft", "approved", "approved_sample"]);

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function metadata(text: string, key: string) {
  return text.match(new RegExp(`^${key}:\\s*(.+)$`, "im"))?.[1]?.trim() || "";
}

function main() {
  const root = process.cwd();
  const knowledgeRoot = path.join(root, "ai", "knowledge");
  const files = walk(knowledgeRoot).filter((file) => file.endsWith(".md") && path.basename(file) !== "README.md");
  const failures: string[] = [];
  let words = 0;
  let approved = 0;
  let sourceLinks = 0;
  const byWorkflow = new Map<string, number>();

  for (const file of files) {
    const relative = path.relative(root, file).replace(/\\/g, "/");
    const text = fs.readFileSync(file, "utf8");
    words += text.split(/\s+/).filter(Boolean).length;
    sourceLinks += text.match(/https:\/\//g)?.length || 0;
    const status = metadata(text, "review_status");
    if (!ALLOWED_STATUSES.has(status)) failures.push(`${relative}: invalid review_status '${status || "missing"}'`);
    if (status === "approved" || status === "approved_sample") approved += 1;

    for (const key of REQUIRED) {
      if (!metadata(text, key)) failures.push(`${relative}: missing ${key}`);
    }

    const workflow = metadata(text, "applies_to") || "unknown";
    byWorkflow.set(workflow, (byWorkflow.get(workflow) || 0) + 1);

    if (/\bwill guarantee\b|\bguaranteed (?:safe|result|performance|improvement)\b/i.test(text)) {
      failures.push(`${relative}: review unqualified guarantee language`);
    }
    if (/VITE_(?:GEMINI|GOOGLE).*KEY/i.test(text)) {
      failures.push(`${relative}: browser-exposed key name detected`);
    }
  }

  console.log(`Knowledge audit: ${files.length} documents, ${approved} uploadable, ${words.toLocaleString()} words, ${sourceLinks} source links.`);
  for (const [workflow, count] of [...byWorkflow.entries()].sort()) console.log(`  ${workflow}: ${count}`);

  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log("Knowledge audit passed.");
}

main();
