# LaneLab Gemini setup and coaching-knowledge guide

LaneLab now has two separate AI layers:

1. **Gemini connection:** the private API key in `.env` lets the server call Gemini 3.6 Flash.
2. **Coaching knowledge:** reviewed documents in `ai/knowledge/` are indexed in Gemini File Search and retrieved when relevant.

This second layer is retrieval-augmented generation (RAG). It is the supported Gemini Developer API approach for LaneLab. It does not change Gemini’s model weights. Google AI Studio and the Gemini Developer API do not currently provide a tunable Gemini model.

## Step 1 — Confirm the private environment file

From the LaneLab repository in PowerShell:

```powershell
cd "C:\Users\shaya\Downloads\LaneLab_Swim\with git\lanelab"
notepad .env
```

The file should contain:

```env
GEMINI_API_KEY=your_real_google_ai_studio_key
GEMINI_MODEL=gemini-3.6-flash
GEMINI_FILE_SEARCH_STORE=
```

Rules:

- Do not put quotes around the key.
- Do not use `VITE_GEMINI_API_KEY`; a `VITE_` variable can be exposed to browser code.
- Do not paste `.env` into chat, screenshots or GitHub.
- `.env` and `.env.local` are ignored by Git. `.env.example` is the safe template.
- If the key has ever been exposed, revoke it in Google AI Studio and create a new authorization key.

## Step 2 — Start LaneLab and verify Gemini

```powershell
npm ci
npm run dev
```

Open the local address printed by the terminal, then open **Coach Block AI**. The first status badge should say `Gemini configured · gemini-3.6-flash`. Send one test prompt. A successful real response changes it to `Gemini verified`; an invalid or unavailable key changes it to the safe-fallback status.

You can also open this local status endpoint:

```text
http://localhost:5173/api/health
```

Expected before knowledge upload:

```json
{
  "aiMode": "live",
  "knowledgeMode": "base-prompts",
  "model": "gemini-3.6-flash"
}
```

If it still says `simulation`, stop the server with `Ctrl+C`, confirm the key name is exactly `GEMINI_API_KEY`, save `.env`, and restart `npm run dev`.

## Step 3 — Review the five knowledge areas

LaneLab has one Gemini connection and five controlled workflows:

| Workflow | Knowledge folder | Responsibility |
| --- | --- | --- |
| Coach Chat | `ai/knowledge/coach-chat/` | Coaching explanations and decision frameworks |
| Set Generator | `ai/knowledge/set-generator/` | Structured workout drafts |
| Set Modifier | `ai/knowledge/set-modifier/` | Constraint-preserving workout changes |
| Race Analysis | `ai/knowledge/race-analysis/` | Explanations of locked LaneLab race calculations |
| Race Strategy | `ai/knowledge/race-strategy/` | Explanations of locked goal splits and strategy plans |

Shared terminology and safety rules live in `ai/knowledge/shared/`.

The expanded LaneLab baseline includes 25 focused documents across all six folders, a source register, a knowledge audit, deterministic boundary tests, and 9,600 synthetic coverage scenarios. See `docs/AI_TRAINING_PACK_MANIFEST.md` for the inventory.

The supplied `approved_sample` files are conservative starter rules. Open them, edit the guidance to match LaneLab’s actual coaching philosophy, and have a qualified coach review them. New documents should start with metadata like:

```text
title: Sprint freestyle race playbook
review_status: draft
reviewer:
review_date:
applies_to: race-strategy
```

After review, change `review_status: draft` to `review_status: approved`, add the reviewer and date, then save the file.

Accepted knowledge file types are `.md`, `.txt`, `.csv` and `.pdf`. A PDF is treated as a draft by the setup script unless its reviewed content is converted to an approved text/Markdown file. This prevents accidental uploading of private or unreviewed PDFs.

Never upload:

- athlete names, dates of birth, contact information or identifiable records about minors;
- medical records or unnecessary health information;
- copyrighted coaching books or paid material LaneLab does not have permission to use;
- changing record tables, cuts, points or conversions that belong in LaneLab’s deterministic data.

## Step 4 — Upload and index the approved knowledge

Stop the development server with `Ctrl+C`, then run:

```powershell
npm run ai:setup-rag -- --write-env
```

This command:

- reads the private key from `.env` or `.env.local`;
- creates or reuses the `LaneLab Coaching Knowledge` File Search store;
- uploads only `approved` and `approved_sample` documents;
- skips unchanged files and replaces changed files;
- writes `GEMINI_FILE_SEARCH_STORE` into your ignored `.env` file;
- never prints or moves the API key into browser code.

After it finishes, restart:

```powershell
npm run dev
```

Before the first request, the Coach Block status badges should now say:

- `Gemini configured · gemini-3.6-flash`
- `Coaching knowledge configured`

Send one relevant test question. A successful grounded response changes both badges to `verified`.

The local health endpoint should report `"knowledgeMode": "file-search"`.

### Updating the knowledge later

After editing or approving documents, run the same setup command again. Unchanged files are skipped; changed files are replaced.

To remove remotely indexed LaneLab documents that no longer exist locally:

```powershell
npm run ai:setup-rag -- --write-env --prune
```

To deliberately delete and rebuild the entire LaneLab knowledge store:

```powershell
npm run ai:setup-rag -- --reset --write-env
```

Use `--reset` only when you intentionally want a clean replacement store.

For this expanded pack, the recommended update command is:

```powershell
npm run ai:audit-knowledge
npm run ai:setup-rag -- --write-env --prune
```

The audit reports uploadable documents, words, source links, and workflow coverage. `--prune` removes older LaneLab-managed remote documents that no longer exist locally while preserving the current store.

## Step 5 — Evaluate all five workflows

Keep `npm run dev` running in the first PowerShell window. Open a second PowerShell window in the same repository and run:

```powershell
npm run ai:eval
```

The evaluator sends the cases in `ai/evals/lanelab-evals.jsonl` through the real website routes. It checks course language, locked numbers, estimated-split disclosure, workout constraints, conversion boundaries and physiology/medical boundaries.

The latest detailed report is written locally to:

```text
ai/eval-results/latest.json
```

That folder is ignored by Git because responses may contain test context. A failed evaluation is not automatically a model problem. Review whether the prompt, knowledge document, expected phrase or deterministic input needs correction.

Run the deterministic policy tests as well:

```powershell
npm run test:ai-policy
```

These tests make the three previously missed boundaries non-probabilistic: conversion answers must include planning and meet-entry verification, modeled race analysis must say it is limited, and SCY strategy must use planning and correct U.S. Open benchmark language.

To regenerate the broad scenario inventory:

```powershell
npm run ai:generate-coverage
```

This writes 9,600 synthetic combinations to `ai/datasets/lanelab-coverage-cases.jsonl`. They are test-design cases, not real athlete records and not direct model-weight training.

## Step 6 — Improve LaneLab safely

Use this repeatable cycle:

1. Add or revise one focused coaching document.
2. Have a qualified coach approve it.
3. Run `npm run ai:setup-rag -- --write-env`.
4. Restart `npm run dev`.
5. Run `npm run ai:eval`.
6. Compare the full evaluation results, not one impressive answer.
7. Release only when there are zero critical factual-lock or safety failures.

Start with roughly 25–50 high-quality approved examples or rules for each workflow, plus difficult incomplete-input cases. Quality, coverage and review matter more than thousands of repetitive examples.

## What Gemini is allowed to do

Gemini may explain, organize, compare, draft and coach within the supplied boundaries. It does not own:

- split math or missing-split calculations;
- AQUA points and LaneLab scoring;
- records, qualifying standards or course conversions;
- reference-race filtering;
- locked target checkpoints;
- medical, readiness or return-to-sport decisions.

Those remain deterministic LaneLab calculations or qualified human decisions. The server route passes them to Gemini as immutable facts.

## Deployment note

Your local `.env` is intentionally not committed or pushed. When LaneLab is deployed, add `GEMINI_API_KEY`, `GEMINI_MODEL` and `GEMINI_FILE_SEARCH_STORE` as private server-side environment variables in the hosting service. Never hard-code them in the repository.
