import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";

type HealthEnv = {
  GEMINI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_FILE_SEARCH_STORE?: string;
};

export function GET() {
  const config = env as unknown as HealthEnv;
  const aiConfigured = Boolean(config.GEMINI_API_KEY || config.GOOGLE_API_KEY);
  const knowledgeConfigured = Boolean(config.GEMINI_FILE_SEARCH_STORE?.trim());
  return NextResponse.json({
    ok: true,
    service: "lanelab",
    aiMode: aiConfigured ? "live" : "simulation",
    knowledgeMode: aiConfigured && knowledgeConfigured ? "file-search" : "base-prompts",
    model: config.GEMINI_MODEL || "gemini-3.6-flash",
    raceModel: "lanelab.race-analysis.v1",
  });
}
