# LaneLab AI coaching pack manifest

Version date: 2026-08-11

## What this pack is

This is a retrieval and evaluation pack for the five LaneLab Gemini workflows. It does not alter Gemini model weights. It combines deterministic product guardrails, original LaneLab coaching documents, source and copyright governance, Gemini File Search, live evaluations, and synthetic coverage cases.

## Included coverage

| Area | Folder | Documents |
| --- | --- | ---: |
| Shared rules, evidence, safeguarding | `ai/knowledge/shared/` | 5 |
| Coach Chat | `ai/knowledge/coach-chat/` | 4 |
| Set Generator | `ai/knowledge/set-generator/` | 4 |
| Set Modifier | `ai/knowledge/set-modifier/` | 4 |
| Race Analysis | `ai/knowledge/race-analysis/` | 4 |
| Race Strategy | `ai/knowledge/race-strategy/` | 4 |
| Total | `ai/knowledge/` | 25 |

The pack contains approximately 10,500 original words, 24 direct source links, 8 critical live evaluation cases, 4 deterministic policy tests, and 9,600 synthetic coverage scenarios.

Topics include:

- LCM, SCM, and SCY boundaries;
- freestyle, backstroke, breaststroke, butterfly, and IM;
- sprint, 100, 200, middle-distance, and distance event planning;
- aerobic, threshold/critical-speed-oriented, aerobic-power, race-pace, speed, and recovery structures;
- starts, turns, underwaters, breakouts, finishes, and video review;
- session architecture, lane differentiation, equipment, and quality controls;
- constraint-preserving set modification;
- race segmentation, modeled-data uncertainty, causal restraint, and athlete-profile boundaries;
- event strategy, course-specific planning, and validation sessions;
- athlete development, safeguarding, privacy, source review, and copyright controls.

## Source policy

The pack uses original summaries anchored to official rules/federation material and peer-reviewed reviews. It does not contain copied books, paid articles, entire SwimSwam stories, social-media posts, YouTube transcripts, Instagram archives, or private athlete records.

Media and social sources can enter a human review queue as practitioner perspectives. They should be summarized in LaneLab's own words, attributed, checked against higher-quality evidence, and approved before upload.

## Why it is not a million scraped items

A million duplicated or unverified records would increase retrieval noise, cost, contradiction, privacy risk, and copyright exposure. The correct scale target is coverage plus review quality. The 9,600 synthetic cases cover combinations of course, stroke, event band, level, objective, and constraint without pretending to be real athlete data.

## Upload process

From the LaneLab repository:

```powershell
npm ci
npm run ai:audit-knowledge
npm run ai:setup-rag -- --write-env --prune
npm run dev
```

In a second PowerShell window:

```powershell
npm run test:ai-policy
npm run ai:eval
```

Expected local policy test result: 4/4 passed.

Expected live evaluation result: 8/8 passed when Gemini and File Search are available. The three earlier wording failures are now enforced by deterministic code: planning/meet conversion disclosure, limited modeled-checkpoint disclosure, and SCY planning/U.S. Open language.

## Adding new material

Put original or licensed material into the relevant folder under `ai/knowledge/`. Begin every Markdown document with:

```text
title: Clear document title
review_status: draft
reviewer:
review_date:
applies_to: coach-chat
```

After a qualified reviewer approves it, change `review_status` to `approved`, add the reviewer and date, run the audit, then rerun the File Search setup command.
