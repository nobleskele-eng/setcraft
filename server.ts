/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

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
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
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
  const { focus, swimmerLevel, targetDistance, equipment } = req.body;

  const systemPrompt = "You are an elite, Olympic-caliber swim coach and training programmer. Your goal is to write a highly realistic, specific swim set that athletes can do in a pool. Format the output in clean, readable markdown with a clear set title, repeat structures, intervals, equipment tags, and the physiological reason (energy system) for this set. Keep your explanation concise and direct.";
  
  const userPrompt = `Generate a swim set for a ${swimmerLevel} swimmer focusing on ${focus}. The target distance for this main block should be around ${targetDistance} meters/yards. Allowed equipment: ${equipment ? equipment.join(", ") : "none"}.`;
  
  const fallback = `### ${focus.toUpperCase()} Focus Set
  
**Main Set: Aerobic Endurance Builders**
*   **4 x 200m Free** on a 3:15 interval
    *   *Intensity*: Aerobic (RPE 6/10)
    *   *Equipment*: Snorkel / Pull Buoy optional
    *   *Focus*: Even split paces on each 100m. Keep head down and alignment pristine.
*   **6 x 50m Kick** on a 1:15 interval
    *   *Intensity*: Active recovery (RPE 4/10)
    *   *Equipment*: Kickboard
    *   *Focus*: Consistent vertical flutter kick, focusing on hip rotation.

**Physiological Purpose:**
This set builds aerobic base capacity (A1/A2 threshold) by maintaining a steady heart rate, strengthening cardiovascular output, and reinforcing high elbow pull positioning over long intervals.`;

  const text = await getGeminiResponse(systemPrompt, userPrompt, fallback);
  res.json({ text });
});

// 2. Edit or Adapt Swim Set
app.post("/api/gemini/edit-set", async (req, res) => {
  const { originalSet, modificationRequest } = req.body;

  const systemPrompt = "You are an expert swim coach. You will be given a swim set and a request to modify it (e.g., adapt for a beginner, adjust distance, focus on pull, etc.). Return the revised set in clean markdown, highlighting what was modified and why.";
  
  const userPrompt = `Original Swim Set:
${originalSet}

Modification request:
${modificationRequest}`;

  const fallback = `### Adapted Swim Set

**Revised Set Structure:**
*   **3 x 150m Free** on a 2:45 interval (Reduced from 4x200m to lower physical stress)
    *   *RPE Focus*: 5/10 (Relaxed Aerobic)
    *   *Equipment*: Optional fins to assist body position and reduce fatigue.

**Why this modification works:**
Reduced overall distance and reps slightly while adding fin options to assist alignment and keep heart rate controlled, meeting your request for a beginner-safe version of the aerobic set.`;

  const text = await getGeminiResponse(systemPrompt, userPrompt, fallback);
  res.json({ text });
});

// 3. Swim Safety Audit & Warning Flags
app.post("/api/gemini/audit-workout", async (req, res) => {
  const { sets } = req.body;

  const systemPrompt = "You are a professional swim coach safety auditor. You will analyze a swim workout and flag issues like: unrealistic pace intervals, lack of warm-up/cool-down, extreme overtraining warnings, or weird structural flow. Return your audit report in JSON with 'isSafe': boolean, 'warnings': string[], and 'recommendations': string[]. Always output clean, parsing-friendly content.";
  
  const userPrompt = `Audit these swim workout sets for safety and pacing:
${JSON.stringify(sets)}`;

  const fallbackJSON = {
    isSafe: true,
    warnings: [
      "No specific cool-down block is currently logged in this visual stack.",
      "Check that your threshold send-offs allow for at least 10-15 seconds of rest per rep."
    ],
    recommendations: [
      "Add a 200m easy active recovery set at the end to flush out lactic acid.",
      "Consider grouping the 50m kick reps with fins to prevent calf cramping."
    ]
  };

  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 600));
    res.json(fallbackJSON);
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
  const { messages } = req.body;
  
  // Format message history
  const chatHistory = messages.map((m: any) => `${m.sender === "user" ? "Athlete" : "AI Coach"}: ${m.text}`).join("\n");

  const systemPrompt = "You are Coach Block, the friendly, supportive, yet rigorous AI Swimming Coach at SetCraft. Swimmers of all calibers come to you to ask about training pacing, taper plans, dryland workouts, stroke technique, and motivation. Answer direct, keeping it punchy, practical, and packed with professional swim coaching tips.";

  const userPrompt = `Conversation History:\n${chatHistory}\n\nAthlete: ${messages[messages.length - 1].text}`;

  const fallback = "That is a great swimming question! To swim efficiently, focus on keeping your head down, hips high at the surface, and pulling with a high elbow (Early Vertical Forearm). If you are looking to taper for a meet, reduce your weekly volume by 20-30% each week leading up, but maintain a few short race-pace sprints to keep your central nervous system primed!";

  const text = await getGeminiResponse(systemPrompt, userPrompt, fallback);
  res.json({ text });
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
    console.log(`🏊 SetCraft Server running on port ${PORT}`);
  });
}

startServer();
