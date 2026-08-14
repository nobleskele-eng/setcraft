/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, RefreshCw, User, HelpCircle, Dumbbell, AlertTriangle, PlayCircle } from "lucide-react";
import { AIChatMessage, AISuggestion } from "../types";

const SUGGESTIONS: AISuggestion[] = [
  { title: "Race-pace validation", description: "Build a coach-controlled validation set for a specific course and goal split.", prompt: "Build a 100 Freestyle SCM race-pace validation set for an advanced swimmer. Ask me for the goal time and lane constraints before finalizing it." },
  { title: "Taper decision framework", description: "Compare taper options without pretending to assess readiness remotely.", prompt: "Give me a two-week taper decision framework for a qualified coach, including what athlete feedback and training evidence to review." },
  { title: "Technique progression", description: "Turn one observed technical problem into cues, drills and validation checks.", prompt: "My coach observed a dropped elbow in freestyle. Give me three drill progressions with snorkel and a measurable check for each." }
];

interface AICopilotProps {
  onOpenGeneratedSet?: (text: string, title: string, focus: string) => void;
}

type AiHealth = {
  aiMode: "live" | "simulation";
  knowledgeMode: "file-search" | "base-prompts";
  model: string;
};

type AiResponseMode = "rag" | "live" | "offline";

export default function AICopilot({ onOpenGeneratedSet }: AICopilotProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "generator" | "modifier">("chat");

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: "m1",
      sender: "copilot",
      text: "I'm **Coach Block**, SetCraft's evidence-aware coaching copilot. I can draft sets, explain race strategy, compare course demands and revise workouts. Give me the course, event, athlete level and objective for the strongest answer.",
      timestamp: "05:47 AM"
    }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Generator state
  const [genFocus, setGenFocus] = useState("Lactate Threshold");
  const [genLevel, setGenLevel] = useState("advanced");
  const [genDist, setGenDist] = useState(1500);
  const [genEquip, setGenEquip] = useState<string[]>(["Paddles", "Fins"]);
  const [genResult, setGenResult] = useState<string>("");
  const [loadingGen, setLoadingGen] = useState(false);

  // Modifier state
  const [modOriginal, setModOriginal] = useState(
    `### Main Set
* 8 x 100m Free on a 1:40 cycle interval (RPE 8/10)
* 4 x 50m Kick on 1:15 cycle interval (RPE 5/10)`
  );
  const [modRequest, setModRequest] = useState("Remove paddles and butterfly for an athlete with a coach-entered shoulder restriction; preserve the aerobic purpose and flag assumptions.");
  const [modResult, setModResult] = useState<string>("");
  const [loadingMod, setLoadingMod] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [aiHealth, setAiHealth] = useState<AiHealth | null>(null);
  const [lastAiMode, setLastAiMode] = useState<AiResponseMode | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("AI status unavailable")))
      .then((health: AiHealth) => {
        if (!cancelled) setAiHealth(health);
      })
      .catch(() => {
        if (!cancelled) setAiHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 1. Submit Chat
  const handleChatSubmit = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMsg: AIChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setLoadingChat(true);
    setRequestError("");

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...chatMessages, userMsg] })
      });
      if (!response.ok) throw new Error(`AI request failed (${response.status})`);
      const data = await response.json();
      if (data.meta?.mode) setLastAiMode(data.meta.mode as AiResponseMode);

      const copilotMsg: AIChatMessage = {
        id: `c-${Date.now()}`,
        sender: "copilot",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, copilotMsg]);
    } catch (err) {
      console.error(err);
      setRequestError(err instanceof Error ? err.message : "Could not reach the AI service.");
    } finally {
      setLoadingChat(false);
    }
  };

  // 2. Submit Generator
  const handleGenerateSet = async () => {
    setLoadingGen(true);
    setGenResult("");
    setRequestError("");
    try {
      const response = await fetch("/api/gemini/generate-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: genFocus,
          swimmerLevel: genLevel,
          targetDistance: genDist,
          equipment: genEquip
        })
      });
      if (!response.ok) throw new Error(`AI request failed (${response.status})`);
      const data = await response.json();
      if (data.meta?.mode) setLastAiMode(data.meta.mode as AiResponseMode);
      setGenResult(data.text || "");
    } catch (err) {
      console.error(err);
      setRequestError(err instanceof Error ? err.message : "Could not generate the set.");
    } finally {
      setLoadingGen(false);
    }
  };

  // 3. Submit Modifier
  const handleModifySet = async () => {
    setLoadingMod(true);
    setModResult("");
    setRequestError("");
    try {
      const response = await fetch("/api/gemini/edit-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalSet: modOriginal,
          modificationRequest: modRequest
        })
      });
      if (!response.ok) throw new Error(`AI request failed (${response.status})`);
      const data = await response.json();
      if (data.meta?.mode) setLastAiMode(data.meta.mode as AiResponseMode);
      setModResult(data.text || "");
    } catch (err) {
      console.error(err);
      setRequestError(err instanceof Error ? err.message : "Could not modify the set.");
    } finally {
      setLoadingMod(false);
    }
  };

  const toggleEquip = (eq: string) => {
    if (genEquip.includes(eq)) {
      setGenEquip(genEquip.filter(e => e !== eq));
    } else {
      setGenEquip([...genEquip, eq]);
    }
  };

  return (
    <div className="mx-auto max-w-[1540px] space-y-6" id="ai-copilot-workspace">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[30px] border border-surface-raised bg-surface px-7 py-8 text-white shadow-md shadow-surface/15 md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,.28),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,.18),transparent_35%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-disabled"><Sparkles className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[.2em]">SetCraft AI workspace v13</span></div>
          <h2 className="mt-3 text-4xl font-display font-black tracking-tight md:text-5xl">
            Coach Block AI
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-disabled md:text-base">
            Evidence-aware coaching chat, structured set generation and constraint-preserving workout edits—ready for your Gemini knowledge system.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide">
            <span className={`rounded-full border px-3 py-1.5 ${lastAiMode === "live" || lastAiMode === "rag" ? "border-accent-hover/20 bg-accent-hover/10 text-disabled" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
              {lastAiMode === "rag"
                ? `Gemini verified · ${aiHealth?.model || "configured model"} · knowledge`
                : lastAiMode === "live"
                  ? `Gemini verified · ${aiHealth?.model || "configured model"}`
                  : lastAiMode === "offline"
                    ? "Gemini unavailable · safe fallback used"
                    : aiHealth?.aiMode === "live"
                      ? `Gemini configured · ${aiHealth.model}`
                      : "Offline-safe mode"}
            </span>
            <span className={`rounded-full border px-3 py-1.5 ${aiHealth?.knowledgeMode === "file-search" ? "border-accent-hover/20 bg-accent-hover/10 text-disabled" : "border-white/10 bg-white/[.06] text-disabled"}`}>
              {lastAiMode === "rag" ? "Coaching knowledge verified" : aiHealth?.knowledgeMode === "file-search" ? "Coaching knowledge configured" : "Base prompts only"}
            </span>
            <span className="rounded-full border border-accent-hover/20 bg-accent-hover/10 px-3 py-1.5 text-disabled">Coach review required</span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex max-w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/[.07] p-1.5 text-xs backdrop-blur">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "chat" ? "bg-white text-surface shadow" : "text-disabled hover:bg-white/10 hover:text-white"
            }`}
          >
            Coach Chat
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "generator" ? "bg-white text-surface shadow" : "text-disabled hover:bg-white/10 hover:text-white"
            }`}
          >
            AI Set Generator
          </button>
          <button
            onClick={() => setActiveTab("modifier")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "modifier" ? "bg-white text-surface shadow" : "text-disabled hover:bg-white/10 hover:text-white"
            }`}
          >
            AI Set Modifier
          </button>
        </div>
        </div>
      </div>

      {requestError && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{requestError}</div>}

      {/* CHAT TAB */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 gap-6 rounded-[26px] border border-hairline-on-canvas bg-white p-5 shadow-sm lg:grid-cols-12 md:p-7" id="copilot-chat-grid">
          {/* Messages block (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-[520px] bg-canvas/50 rounded-2xl border border-hairline-on-canvas overflow-hidden">
            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.sender === "user" ? "bg-surface-raised text-white" : "bg-accent text-white"
                  }`}>
                    {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                    m.sender === "user" ? "bg-surface text-ink" : "bg-white border border-hairline-on-canvas/80 text-surface-raised"
                  }`}>
                    {/* Markdown emulation for simple formats */}
                    <div className="whitespace-pre-wrap">
                      {m.text.split("**").map((chunk, idx) => 
                        idx % 2 === 1 ? <strong key={idx} className="font-bold text-surface">{chunk}</strong> : chunk
                      )}
                    </div>
                    <span className="text-[9px] text-ink-muted-on-canvas font-mono block text-right mt-2">{m.timestamp}</span>
                  </div>
                </div>
              ))}
              {loadingChat && (
                <div className="flex items-center gap-2 text-xs text-ink-muted-on-canvas italic pl-11">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent-active" />
                  Coach is drafting recommendations...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input box */}
            <div className="border-t border-hairline-on-canvas/80 p-4 bg-white flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder="Ask about swim mechanics, energy systems, tapered cycles..."
                className="flex-1 bg-canvas border border-hairline-on-canvas text-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-hairline-on-canvas font-sans"
              />
              <button
                onClick={() => handleChatSubmit()}
                className="bg-surface hover:bg-surface-raised text-white rounded-xl px-5 flex items-center justify-center font-bold text-xs transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick recommendations panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-[10px] text-ink-muted-on-canvas font-mono uppercase tracking-wider">Coach Quick Presets</h3>
            <div className="space-y-3.5">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChatSubmit(s.prompt)}
                  className="w-full text-left bg-white hover:bg-canvas border border-hairline-on-canvas p-4 rounded-xl transition hover:border-disabled shadow-2xs flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-surface-raised flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-ink-muted-on-canvas" />
                    {s.title}
                  </span>
                  <p className="text-[11px] text-ink-muted-on-canvas mt-2 leading-relaxed">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GENERATOR TAB */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="copilot-generator-grid">
          {/* Controls form (5 cols) */}
          <div className="lg:col-span-5 bg-canvas/50 p-6 rounded-2xl border border-hairline-on-canvas space-y-4">
            <h3 className="text-[10px] text-ink-muted-on-canvas font-mono uppercase tracking-wider">Configure Parameters</h3>

            <div>
              <label className="text-xs text-ink-muted-on-canvas block mb-1.5 font-medium">Target Training Focus</label>
              <select
                value={genFocus}
                onChange={(e) => setGenFocus(e.target.value)}
                className="bg-white border border-hairline-on-canvas text-surface-raised text-xs rounded-lg p-2.5 w-full focus:outline-none focus:ring-1 focus:ring-disabled shadow-xs"
              >
                <option>Lactate Threshold builders</option>
                <option>Aerobic Capacity base</option>
                <option>Sprint Cycle / USRPT</option>
                <option>Active Stroke Recovery</option>
                <option>Kick-heavy leg burn</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-ink-muted-on-canvas block mb-1.5 font-medium">Target Volume (m/yd)</label>
              <input
                type="number"
                step="100"
                value={genDist}
                onChange={(e) => setGenDist(Math.max(100, parseInt(e.target.value) || 0))}
                className="bg-white border border-hairline-on-canvas text-surface-raised text-xs rounded-lg p-2.5 w-full font-mono focus:outline-none focus:ring-1 focus:ring-disabled shadow-xs"
              />
            </div>

            <div>
              <label className="text-xs text-ink-muted-on-canvas block mb-1.5 font-medium">Swimmer Skill Class</label>
              <div className="grid grid-cols-3 gap-2">
                {["beginner", "intermediate", "advanced"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setGenLevel(lvl)}
                    className={`py-2 px-3 text-[10px] rounded-lg border font-bold capitalize transition shadow-2xs ${
                      genLevel === lvl ? "bg-canvas text-accent-active border-hairline-on-canvas" : "bg-white text-ink-muted-on-canvas border-hairline-on-canvas hover:bg-canvas"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-ink-muted-on-canvas block mb-2 font-medium">Permitted Equipment</label>
              <div className="flex flex-wrap gap-1.5">
                {["Fins", "Paddles", "Kickboard", "Snorkel", "Pull Buoy"].map((eq) => {
                  const active = genEquip.includes(eq);
                  return (
                    <button
                      key={eq}
                      onClick={() => toggleEquip(eq)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition shadow-2xs font-medium ${
                        active ? "bg-surface text-white border-surface" : "bg-white text-ink-muted-on-canvas border-hairline-on-canvas hover:bg-canvas"
                      }`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerateSet}
              disabled={loadingGen}
              className="w-full bg-surface hover:bg-surface-raised text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loadingGen ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Formulating Workout...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Custom Set
                </>
              )}
            </button>
          </div>

          {/* Output block (7 cols) */}
          <div className="lg:col-span-7 bg-canvas/50 p-6 rounded-2xl border border-hairline-on-canvas flex flex-col min-h-[300px]">
            <span className="text-[10px] text-ink-muted-on-canvas font-mono uppercase tracking-wider mb-3 block">AI PRODUCED TRAINING SET</span>
            {genResult ? (
              <div className="text-xs text-ink-on-canvas leading-relaxed overflow-y-auto space-y-3 prose max-h-[380px] bg-white p-5 rounded-xl border border-hairline-on-canvas shadow-xs">
                {/* Parse lines of markdown simply */}
                {genResult.split("\n").map((line, i) => {
                  if (line.startsWith("###")) return <h4 key={i} className="text-sm font-bold text-surface mt-3">{line.replace("###", "")}</h4>;
                  if (line.startsWith("**")) return <strong key={i} className="text-surface block mt-3">{line.replace(/\*\*/g, "")}</strong>;
                  if (line.startsWith("*")) return <div key={i} className="pl-3 py-0.5 text-ink-muted-on-canvas font-medium">── {line.replace("*", "")}</div>;
                  return <p key={i} className="mt-1 text-ink-muted-on-canvas">{line}</p>;
                })}
                {onOpenGeneratedSet && <button type="button" onClick={() => onOpenGeneratedSet(genResult, `AI — ${genFocus}`, genFocus)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent-active"><PlayCircle className="h-4 w-4" /> Convert to editable Studio blocks</button>}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-muted-on-canvas">
                <Dumbbell className="w-8 h-8 text-disabled mb-2" />
                <p className="text-xs italic">No workout formulated yet.</p>
                <p className="text-[10px] text-ink-muted-on-canvas mt-1 max-w-xs leading-relaxed">Configure your training focus and block size on the left, then click generate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODIFIER TAB */}
      {activeTab === "modifier" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="copilot-modifier-grid">
          {/* Controls form (5 cols) */}
          <div className="lg:col-span-5 bg-canvas/50 p-6 rounded-2xl border border-hairline-on-canvas space-y-4">
            <h3 className="text-[10px] text-ink-muted-on-canvas font-mono uppercase tracking-wider">Tune Swim Blocks</h3>

            <div>
              <label className="text-xs text-ink-muted-on-canvas block mb-1.5 font-medium">Paste Original Swim Set Structure</label>
              <textarea
                value={modOriginal}
                onChange={(e) => setModOriginal(e.target.value)}
                rows={5}
                className="bg-white border border-hairline-on-canvas text-surface-raised text-xs rounded-lg p-2.5 w-full font-mono focus:outline-none focus:ring-1 focus:ring-disabled shadow-xs"
              />
            </div>

            <div>
              <label className="text-xs text-ink-muted-on-canvas block mb-1.5 font-medium">Describe Modification Request</label>
              <input
                type="text"
                value={modRequest}
                onChange={(e) => setModRequest(e.target.value)}
                placeholder="e.g. Reduce distance and preserve the threshold objective..."
                className="bg-white border border-hairline-on-canvas text-surface-raised text-xs rounded-lg p-2.5 w-full focus:outline-none focus:ring-1 focus:ring-disabled shadow-xs"
              />
            </div>

            <button
              onClick={handleModifySet}
              disabled={loadingMod}
              className="w-full bg-surface hover:bg-surface-raised text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loadingMod ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Adapting Set...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Adapt Swim Set
                </>
              )}
            </button>
          </div>

          {/* Output block (7 cols) */}
          <div className="lg:col-span-7 bg-canvas/50 p-6 rounded-2xl border border-hairline-on-canvas flex flex-col min-h-[300px]">
            <span className="text-[10px] text-ink-muted-on-canvas font-mono uppercase tracking-wider mb-3 block">REVISED AI SWIM BLOCK</span>
            {modResult ? (
              <div className="text-xs text-ink-on-canvas leading-relaxed overflow-y-auto space-y-3 prose max-h-[380px] bg-white p-5 rounded-xl border border-hairline-on-canvas shadow-xs">
                {modResult.split("\n").map((line, i) => {
                  if (line.startsWith("###")) return <h4 key={i} className="text-sm font-bold text-surface mt-3">{line.replace("###", "")}</h4>;
                  if (line.startsWith("**")) return <strong key={i} className="text-surface block mt-3">{line.replace(/\*\*/g, "")}</strong>;
                  if (line.startsWith("*")) return <div key={i} className="pl-3 py-0.5 text-ink-muted-on-canvas font-medium">── {line.replace("*", "")}</div>;
                  return <p key={i} className="mt-1 text-ink-muted-on-canvas">{line}</p>;
                })}
                {onOpenGeneratedSet && <button type="button" onClick={() => onOpenGeneratedSet(modResult, "AI-modified swim set", "AI set modification")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent-active"><PlayCircle className="h-4 w-4" /> Open revised set as Studio blocks</button>}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-muted-on-canvas">
                <PlayCircle className="w-8 h-8 text-disabled mb-2" />
                <p className="text-xs italic">Set has not been revised yet.</p>
                <p className="text-[10px] text-ink-muted-on-canvas mt-1 max-w-xs leading-relaxed">Paste your original workout block and state your goal on the left to see adaptation splits.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
