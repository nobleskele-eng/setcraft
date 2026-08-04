import { NextRequest, NextResponse } from "next/server";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 12000) : fallback;
}

function safeNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

async function generate(system: string, prompt: string, fallback: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return `${fallback}\n\n*(Offline SetCraft draft — add GEMINI_API_KEY to enable live generation.)*`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || fallback;
  } catch {
    return `${fallback}\n\n*(Live generation was unavailable; this is the verified offline fallback.)*`;
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  if (action === "generate-set") {
    const focus = safeText(body.focus, "Aerobic endurance");
    const swimmerLevel = safeText(body.swimmerLevel, "intermediate");
    const targetDistance = safeNumber(body.targetDistance, 1500, 100, 12000);
    const equipment = Array.isArray(body.equipment) ? body.equipment.map((item) => safeText(item)).filter(Boolean).slice(0, 12) : [];
    const system = "You are a swim-workout drafting assistant for qualified coaches. Return SetCraft Quick Write syntax: headings begin with # and set lines look like 8x100 Free @ 1:30 RPE 7 - cue. State assumptions and never make athlete-readiness decisions.";
    const prompt = `Draft a ${targetDistance}m/yd main block for a ${swimmerLevel} swimmer. Focus: ${focus}. Equipment: ${equipment.join(", ") || "none"}.`;
    const fallback = `# Main Set\n4x200 Free @ 3:15 RPE 6 - even splits, long line\n6x50 Kick @ 1:15 RPE 5 - consistent tempo from the hips\n4x100 Choice @ 1:45 RPE 7 - descend 1 to 4\n# Recovery\n1x200 Choice @ 4:00 RPE 2 - easy reset\nCoach note: Review distance, intervals and athlete restrictions before assigning.`;
    return NextResponse.json({ text: await generate(system, prompt, fallback) });
  }

  if (action === "edit-set") {
    const original = safeText(body.originalSet, "# Main Set\n8x100 Free @ 1:40 RPE 7");
    const requestText = safeText(body.modificationRequest, "Make the set easier while preserving its purpose.");
    const system = "You edit swim sets for qualified coaches. Preserve the training objective, return SetCraft Quick Write syntax, and flag assumptions for coach review.";
    const fallback = `# Adapted Main Set\n3x150 Free @ 2:45 RPE 5 - relaxed aerobic quality\n4x50 Choice @ 1:05 RPE 4 - technique reset\n# Recovery\n1x200 Easy @ 4:00 RPE 2 - easy reset`;
    return NextResponse.json({ text: await generate(system, `Original:\n${original}\n\nChange:\n${requestText}`, fallback) });
  }

  if (action === "audit-workout") {
    const sets = Array.isArray(body.sets) ? body.sets.slice(0, 500) : [];
    const warnings = sets.length ? [] : ["No workout blocks were supplied for review."];
    return NextResponse.json({
      isSafe: warnings.length === 0,
      warnings: warnings.length ? warnings : ["Verify send-offs against actual lane completion times and entered restrictions."],
      recommendations: ["Confirm warm-up, recovery and cool-down match the session objective.", "A qualified coach must make readiness and return-to-training decisions."],
    });
  }

  if (action === "chat") {
    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) as Array<Record<string, unknown>> : [];
    if (!messages.length) return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
    const history = messages.map((message) => `${message.sender === "user" ? "Coach" : "SetCraft"}: ${safeText(message.text)}`).join("\n");
    const system = "You are SetCraft's concise swimming-coach copilot. Give practical options, calculations and technique cues. Do not make medical or athlete-readiness decisions.";
    const fallback = "Define the target pace or technical outcome first, then choose a repeat distance that lets the coach observe it. Set recovery from the lane's real completion time and preserve the session's purpose.";
    return NextResponse.json({ text: await generate(system, history, fallback) });
  }

  return NextResponse.json({ error: "Unknown SetCraft AI action." }, { status: 404 });
}
