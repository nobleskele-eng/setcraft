import assert from "node:assert/strict";
import test from "node:test";
import { applyPolicyGuardrails } from "../src/aiPolicyGuardrails";

test("course-conversion answers always disclose planning and meet boundary", () => {
  const output = applyPolicyGuardrails(
    "chat",
    "Convert this SCM time to SCY for my meet entry.",
    "The estimated converted result is 52.10.",
  );
  assert.match(output, /planning/i);
  assert.match(output, /meet/i);
});

test("modeled race checkpoints always receive a limitation disclosure", () => {
  const output = applyPolicyGuardrails(
    "analyze-race",
    "The 50 and 150 checkpoints are modeled.",
    "The middle race appears less stable.",
  );
  assert.match(output, /modeled/i);
  assert.match(output, /limited/i);
});

test("SCY strategy uses U.S. Open and planning language", () => {
  const output = applyPolicyGuardrails(
    "strategy",
    "SCY 100 Freestyle, U.S. Open benchmark, conversion is planning-only.",
    "Compare the goal with the SCY world record.",
  );
  assert.doesNotMatch(output, /SCY world record/i);
  assert.match(output, /U\.S\. Open/i);
  assert.match(output, /planning/i);
});

test("unrelated answers are unchanged", () => {
  const input = "Use two rounds with a coach-defined pace window.";
  assert.equal(applyPolicyGuardrails("generate-set", "Draft an aerobic set.", input), input);
});
