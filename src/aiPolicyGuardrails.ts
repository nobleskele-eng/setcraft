export type AiWorkflow = "chat" | "generate-set" | "edit-set" | "analyze-race" | "strategy";

function appendGuardrail(text: string, requiredPhrase: string, sentence: string) {
  return text.toLowerCase().includes(requiredPhrase.toLowerCase())
    ? text
    : `${text.trim()}\n\n${sentence}`;
}

/**
 * Safety-critical product boundaries must not depend on probabilistic wording.
 * Gemini still writes the coaching explanation; LaneLab appends a concise,
 * deterministic disclosure whenever the supplied request triggers one.
 */
export function applyPolicyGuardrails(workflow: AiWorkflow, prompt: string, generatedText: string) {
  const normalizedPrompt = prompt.toLowerCase();
  let text = generatedText.trim();

  if (
    workflow === "chat" &&
    /convert|conversion/.test(normalizedPrompt) &&
    /meet|entry/.test(normalizedPrompt)
  ) {
    text = appendGuardrail(
      text,
      "planning",
      "Conversion boundary: treat the converted result as a planning estimate and verify the specific meet rules before using any time for entry.",
    );
  }

  if (
    workflow === "analyze-race" &&
    /modeled|estimated/.test(normalizedPrompt)
  ) {
    text = appendGuardrail(
      text,
      "limited",
      "Evidence boundary: this interpretation is limited wherever checkpoints are modeled or estimated rather than measured.",
    );
  }

  if (workflow === "strategy" && normalizedPrompt.includes("scy")) {
    text = text.replace(/SCY world record/gi, "SCY benchmark");
    if (/planning-only|conversion/.test(normalizedPrompt)) {
      text = appendGuardrail(
        text,
        "planning",
        "Course boundary: this conversion is for planning only; confirm the governing meet's entry rules separately.",
      );
    }
    if (normalizedPrompt.includes("u.s. open")) {
      text = appendGuardrail(
        text,
        "u.s. open",
        "Benchmark label: use the supplied U.S. Open benchmark, not world-record language, for this SCY comparison.",
      );
    }
  }

  return text;
}
