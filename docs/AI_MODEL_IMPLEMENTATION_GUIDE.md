# SetCraft AI implementation and training guide

## Recommended production architecture

SetCraft should not start by “training one chatbot on everything.” Use three layers with different responsibilities:

1. **Deterministic tools** own record times, points, conversions, standards, split math and strategy ranking. These values are already implemented in `src/raceModel.ts` and supplied to Gemini as immutable facts.
2. **Retrieval-augmented generation (RAG)** supplies your coaching language, club philosophy, drill library, workout rules, terminology and approved educational references at request time.
3. **Supervised fine-tuning (SFT)** is optional later. Use it only after real evaluations show that retrieval plus prompts cannot consistently produce your desired structure or tone.

This separation is essential: facts that change, such as records and qualifying standards, belong in versioned data—not in model weights.

## Where to build it

### Fast pilot: Google AI Studio + Gemini API File Search

Use Google AI Studio to create/test the API key and prompts. Upload the approved knowledge files to a Gemini File Search store. This is the quickest path for a private SetCraft coaching corpus and requires no model training. The app already uses server routes under `app/api/gemini/[action]/route.ts`; add retrieval there before calling `generateContent`.

Recommended store collections:

- `coaching_principles`: your coaching philosophy, intensity definitions, progression rules and safety language.
- `workout_library`: reviewed sets with level, course, phase, focus, volume, equipment, constraints and rationale.
- `technique_library`: fault, observation evidence, cues, drills, progression, contraindications and validation checks.
- `race_playbooks`: course/event/athlete-archetype strategies with checkpoints, risks and validation sessions.
- `policies`: minor-data handling, medical boundaries, approval workflow and banned claims.

### Production tuning: Vertex AI

Use Vertex AI supervised fine-tuning only after the RAG pilot has an evaluation baseline. Export reviewed examples from the JSONL templates in `ai/datasets/`. Keep two separate training/evaluation views even if one Gemini endpoint is used:

- **Coach assistant:** workout generation, modification and coaching chat.
- **Performance explainer:** race analysis and race-strategy narrative over locked SetCraft calculations.

Do not include live record tables or annually changing cuts in SFT examples. Retrieve or calculate them at runtime.

## Data preparation workflow

1. Export only coach-approved examples that you have the right to use.
2. Remove names, dates of birth, medical data, contact data and any unnecessary details about minors.
3. Convert each example to one user request and one ideal assistant answer. State course, event, level, objective and constraints explicitly.
4. Add source metadata outside the model text: reviewer, approval date, version, domain and allowed audience.
5. Split by athlete/session—not random message—into approximately 80% training, 10% validation and 10% holdout evaluation. This prevents nearly identical sets from leaking across splits.
6. Have two qualified reviewers approve high-risk examples involving taper, maximal testing, pain, return to training or athlete restrictions.
7. Version the corpus (`setcraft-coach-corpus-v1`, `v2`, etc.) and keep a changelog.

## Evaluation gate

Run the cases in `ai/evals/setcraft-evals.sample.jsonl` before every prompt, retrieval, model or data change. Score at least:

- factual lock compliance (no changed records, points, cuts or splits);
- course terminology (never “SCY world record”);
- calculation consistency;
- constraint preservation in workout edits;
- disclosure of estimated splits and planning conversions;
- coaching usefulness and actionability;
- medical/safety boundary compliance;
- citation/retrieval grounding when knowledge files are used.

Block release if any critical fact changes, a planning conversion is presented as an accepted entry time, or the model diagnoses lactate/readiness/injury from self-reported inputs.

## Connecting a trained or retrieved model to SetCraft

1. Put the server key and chosen model name in `.env.local` using `.env.example`.
2. For File Search, add the store ID as `GEMINI_FILE_SEARCH_STORE` and attach the File Search tool/store in the server-side `generate` function.
3. Keep the action-specific system contracts in `app/api/gemini/[action]/route.ts`. Do not move secrets or RAG calls into `src/` browser code.
4. If Vertex AI is adopted, replace the `generate` transport with the Vertex AI endpoint/service account while preserving the same route inputs and locked-fact contracts. The UI will not need to change.
5. Log prompt version, corpus version, model, latency, refusal/safety outcome and reviewer feedback—never raw personal or medical athlete details by default.

## Minimum go-live checklist

- 200+ approved coaching examples across strokes, levels, courses and session types.
- 50+ race-analysis examples and 50+ strategy examples with locked numerical facts.
- At least 100 holdout evaluations, including adversarial requests.
- Zero critical factual-lock or safety failures on the release candidate.
- Human review path visible in the product.
- A documented process to refresh record/standards data independently of the model.
