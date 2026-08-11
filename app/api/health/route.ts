import { NextResponse } from "next/server";

export function GET() {
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const knowledgeConfigured = Boolean(process.env.GEMINI_FILE_SEARCH_STORE?.trim());
  return NextResponse.json({
    ok: true,
    service: "setcraft",
    aiMode: aiConfigured ? "live" : "simulation",
    knowledgeMode: aiConfigured && knowledgeConfigured ? "file-search" : "base-prompts",
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    raceModel: "setcraft.race-analysis.v1",
  });
}
