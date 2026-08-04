import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "setcraft",
    aiMode: process.env.GEMINI_API_KEY ? "live" : "simulation",
    raceModel: "setcraft.race-analysis.v1",
  });
}
