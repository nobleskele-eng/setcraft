/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

const safeText = (value: unknown, fallback = "") => typeof value === "string" ? value.trim().slice(0, 12000) : fallback;
const safeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

// Initialize Gemini Client with User-Agent header for telemetry
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("⚠️ GEMINI_API_KEY is not defined. Falling back to local responsive mock responses for AI Copilot.");
}

// Helper to handle prompt with fallback
async function getGeminiResponse(systemPrompt: string, userPrompt: string, fallbackResponse: string) {
  if (!ai) {
    // If no key is set, wait a moment to simulate latency and return the fallback response
    await new Promise(resolve => setTimeout(resolve, 800));
    return fallbackResponse + "\n\n*(Note: Running in offline/simulation mode because GEMINI_API_KEY is not set in Secrets. Enter a secret key to unlock live AI responses!)*";
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || fallbackResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error generating AI response: ${error?.message || "Unknown error"}. \n\n*Falling back to local training recommendations:*\n${fallbackResponse}`;
  }
}

// ---------------------- API ENDPOINTS ----------------------

// 1. Generate swim set
app.post("/api/gemini/generate-set", async (req, res) => {
  const focus = safeText(req.body?.focus, "Aerobic endurance");
  const swimmerLevel = safeText(req.body?.swimmerLevel, "intermediate");
  const targetDistance = safeNumber(req.body?.targetDistance, 1500, 100, 12000);
  const equipment = Array.isArray(req.body?.equipment)
    ? req.body.equipment.map((item: unknown) => safeText(item)).filter(Boolean).slice(0, 12)
    : [];

  const systemPrompt = "You are a swim-workout drafting assistant for qualified coaches. Produce a practical draft, not medical advice or an autonomous prescription. Use LaneLab Quick Write syntax so the result can become editable blocks: headings start with #; set lines look like 8x100 Free @ 1:30 RPE 7 - coaching cue; optional containers use Repeat 3x: followed later by end. Include warm-up/recovery when appropriate, state assumptions, and never invent athlete readiness.";

  const userPrompt = `Generate a swim set for a ${swimmerLevel} swimmer focusing on ${focus}. The target distance for this main block should be around ${targetDistance} meters/yards. Allowed equipment: ${equipment ? equipment.join(", ") : "none"}.`;

  const fallback = `# Main Set
4x200 Free @ 3:15 RPE 6 - even splits, long line${equipment.length ? `, equipment: ${equipment.join(", ")}` : ""}
6x50 Kick @ 1:15 RPE 5 - consistent tempo from the hips
4x100 Choice @ 1:45 RPE 7 - descend 1 to 4
# Recovery
1x200 Choice @ 4:00 RPE 2 - easy reset
Coach note: Offline draft for ${focus}; adjust volume and intervals for the ${swimmerLevel} group.`;

  const text = await getGeminiResponse(systemPrompt, userPrompt, fallback);
  res.json({ text });
});

// 2. Edit or Adapt Swim Set
app.post("/api/gemini/edit-set", async (req, res) => {
  const originalSet = safeText(req.body?.originalSet, "# Main Set\n8x100 Free @ 1:40 RPE 7");
  const modificationRequest = safeText(req.body?.modificationRequest, "Make the set easier while preserving its purpose.");

  const systemPrompt = "You are a swim-workout editing assistant for qualified coaches. Preserve the stated training objective while following the modification request. Return the revised workout in LaneLab Quick Write syntax: headings start with #; set lines look like 8x100 Free @ 1:30 RPE 7 - coaching cue; Repeat 3x: containers end with end. Do not make medical-readiness decisions; flag assumptions for coach review.";

  const userPrompt = `Original Swim Set:
${originalSet}

Modification request:
${modificationRequest}`;

  const fallback = `# Adapted Main Set
3x150 Free @ 2:45 RPE 5 - relaxed aerobic quality; optional fins
4x50 Choice @ 1:05 RPE 4 - technique reset between rounds
# Recovery
1x200 Easy @ 4:00 RPE 2 - easy reset
Coach note: Offline adaptation. Review the athlete restriction and preserve the original training objective before assigning.`;

  const text = await getGeminiResponse(systemPrompt, userPrompt, fallback);
  res.json({ text });
});

// 3. Swim Safety Audit & Warning Flags
app.post("/api/gemini/audit-workout", async (req, res) => {
  const sets = Array.isArray(req.body?.sets) ? req.body.sets.slice(0, 500) : [];

  const systemPrompt = "You are a professional swim coach safety auditor. You will analyze a swim workout and flag issues like: unrealistic pace intervals, lack of warm-up/cool-down, extreme overtraining warnings, or weird structural flow. Return your audit report in JSON with 'isSafe': boolean, 'warnings': string[], and 'recommendations': string[]. Always output clean, parsing-friendly content.";

  const userPrompt = `Audit these swim workout sets for safety and pacing:
${JSON.stringify(sets)}`;

  const fallbackJSON = {
    isSafe: true,
    warnings: [
      "No specific recovery or cool-down block is currently logged in this visual stack.",
      "Verify every send-off against the actual lane completion times so the intended recovery is preserved."
    ],
    recommendations: [
      "Add a coach-selected easy reset when it supports the session objective and available time.",
      "Review equipment, stroke and intensity conflicts against each swimmer's entered restrictions."
    ]
  };

  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 600));
    res.json(fallbackJSON);
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            isSafe: { type: "BOOLEAN" },
            warnings: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            recommendations: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["isSafe", "warnings", "recommendations"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err) {
    console.error("Audit error:", err);
    res.json(fallbackJSON);
  }
});

// 4. Swim AI Coach Chat
app.post("/api/gemini/chat", async (req, res) => {
  const messages = Array.isArray(req.body?.messages)
    ? req.body.messages.slice(-20).map((message: any) => ({
        sender: message?.sender === "user" ? "user" : "copilot",
        text: safeText(message?.text),
      })).filter((message: { text: string }) => message.text)
    : [];
  if (messages.length === 0) {
    res.status(400).json({ error: "At least one chat message is required." });
    return;
  }

  // Format message history
  const chatHistory = messages.map((m: any) => `${m.sender === "user" ? "Coach" : "AI Coach"}: ${m.text}`).join("\n");

  const systemPrompt = "You are Coach Block, the friendly, supportive, yet rigorous AI Swimming Coach at LaneLab. Swimmers of all calibers come to you to ask about training pacing, taper plans, dryland workouts, stroke technique, and motivation. Answer direct, keeping it punchy, practical, and packed with professional swim coaching tips.";

  const userPrompt = `Conversation History:\n${chatHistory}\n\nCoach: ${messages[messages.length - 1].text}`;

  const fallback = "Use the session objective to choose the next step: define the target pace or technical outcome, select a repeat distance that lets the coach observe it, and set recovery from the lane’s real completion time rather than a generic rule. For tapering or return-to-training decisions, use the athlete’s recent work, meet schedule and qualified coach judgment; LaneLab should present options and calculations, not determine readiness.";

  const text = await getGeminiResponse(systemPrompt, userPrompt, fallback);
  res.json({ text });
});


app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "lanelab", aiMode: ai ? "live" : "simulation", model: GEMINI_MODEL });
});

// Central JSON error response for malformed request bodies or unexpected route errors.
app.use((error: any, _req: Request, res: Response, next: NextFunction) => {
  if (!error) return next();
  console.error("LaneLab server error", error);
  res.status(error?.status || 500).json({ error: error?.message || "Unexpected server error." });
});

// ---------------------- VITE / STATIC ROUTING ----------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🏊 LaneLab Server running on port ${PORT}`);
  });
}

startServer();
