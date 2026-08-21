import fs from "node:fs";
import path from "node:path";
import { loadProjectEnv } from "./ai-env";

type EvalCase = {
  id: string;
  action: "chat" | "generate-set" | "edit-set" | "analyze-race" | "strategy";
  body: Record<string, unknown>;
  must_include?: string[];
  must_not_include?: string[];
  severity?: "critical" | "standard";
};

function loadCases(filePath: string) {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as EvalCase;
      } catch {
        throw new Error(`Invalid JSONL on line ${index + 1} of ${filePath}`);
      }
    });
}

async function main() {
  const root = process.cwd();
  loadProjectEnv(root);
  const baseUrl = (process.env.LANELAB_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
  const evalFile = path.resolve(root, process.argv[2] || "ai/evals/lanelab-evals.jsonl");
  const cases = loadCases(evalFile);
  const results: Array<Record<string, unknown>> = [];

  try {
    const health = await fetch(`${baseUrl}/api/health`);
    if (!health.ok) throw new Error(`health check returned ${health.status}`);
  } catch (error) {
    throw new Error(`LaneLab is not running at ${baseUrl}. Start npm run dev in another PowerShell window, then rerun npm run ai:eval. ${error instanceof Error ? error.message : ""}`);
  }

  for (const testCase of cases) {
    const started = Date.now();
    const response = await fetch(`${baseUrl}/api/gemini/${testCase.action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(testCase.body),
    });
    const payload = await response.json() as { text?: string; meta?: { mode?: string }; error?: string };
    const text = payload.text || "";
    const normalized = text.toLowerCase();
    const failures: string[] = [];

    if (!response.ok) failures.push(`HTTP ${response.status}: ${payload.error || "unknown error"}`);
    if (payload.meta?.mode === "offline") failures.push("Gemini was offline; this case did not evaluate the live model.");
    for (const phrase of testCase.must_include || []) {
      if (!normalized.includes(phrase.toLowerCase())) failures.push(`Missing required phrase: ${phrase}`);
    }
    for (const phrase of testCase.must_not_include || []) {
      if (normalized.includes(phrase.toLowerCase())) failures.push(`Included banned phrase: ${phrase}`);
    }

    const passed = failures.length === 0;
    console.log(`${passed ? "PASS" : "FAIL"} ${testCase.id}${failures.length ? ` — ${failures.join("; ")}` : ""}`);
    results.push({
      id: testCase.id,
      action: testCase.action,
      severity: testCase.severity || "standard",
      passed,
      failures,
      latencyMs: Date.now() - started,
      aiMode: payload.meta?.mode || "unknown",
      responseText: text,
    });
  }

  const outputDirectory = path.join(root, "ai", "eval-results");
  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, "latest.json");
  fs.writeFileSync(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, results }, null, 2), "utf8");

  const failed = results.filter((result) => !result.passed).length;
  console.log(`Evaluation complete: ${results.length - failed}/${results.length} passed. Report: ${path.relative(root, outputPath)}`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`LaneLab evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

