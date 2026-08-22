# LaneLab Design Token Rationale

Proposal only — [tokens.css](tokens.css) is not imported anywhere yet.

## Palette

| Token | Hex | Role |
|---|---|---|
| `--color-surface` | `#0B2A3F` | Base app background |
| `--color-surface-raised` | `#123A54` | Cards, panels, toolbars |
| `--color-ink` | `#EAF3F7` | Primary text/icons |
| `--color-ink-muted` | `#85A3B4` | Secondary text, labels, timestamps |
| `--color-accent` | `#1AD1E0` | Primary actions, active state, links |
| `--color-accent-hover` | `#0FAEBB` | Accent pressed/hover |
| `--color-signal-warn` | `#FF5A36` | Validation states only — errors, invalid sets, over-distance warnings |
| `--color-hairline` | `#234B63` | Borders, dividers, table rules |

Indigo-600 (`#4F46E5`) is fully retired — no token here derives from it, and no purple/indigo hue survives anywhere in the ramp.

## Type

**Pairing A (chosen):** Display — Big Shoulders Display · Body — IBM Plex Sans · Mono — IBM Plex Mono.

**Pairing B (alternative):** Display — Fraunces · Body — Public Sans · Mono — JetBrains Mono.

Pairing A wins because Big Shoulders Display is a *condensed* athletic grotesk — it reads like scoreboard and pool-deck lane signage, not a tech-startup wordmark, and stays legible condensed at the top of a printed practice sheet. Fraunces (Pairing B) is a strong face but its serif warmth pulls toward editorial/hospitality, which undersells the timing-critical, technical nature of a practice-writing tool. IBM Plex Sans was built by IBM's design team specifically for dense, technical software UI — it holds up at 14px in table cells better than Public Sans, which is optimized for long-form government content. Both mono candidates are fine typographically; IBM Plex Mono was picked to keep the body/mono pairing as one type family with a shared design language, reducing visual noise on a screen that already mixes a lot of numbers and words.

## Spacing & Radius

4px base scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Radius is a single 6px token.

## Why this belongs to swimming, not to "a dashboard"

Pool-tile blue was chosen as the surface colour because it's the literal ambient colour of the room the product describes — the tile glaze and water depth a coach stares at on deck — rather than an arbitrary "dark mode" grey-navy that any SaaS product could ship. Cyan is the single bright accent because it's the colour of chlorinated water catching light and of reflective lane-rope tape, and keeping it to exactly one bright hue (no blue→cyan gradient) means it can do real interface work — marking the one actionable thing on screen — instead of being ambient decoration. The warm red/yellow signal colour is deliberately borrowed from lane-rope and backstroop-flag colour coding, so when a coach sees that hue on a set they already have a trained reflex for "attention" from the pool deck itself, not from having learned a generic app's error-red. Tabular mono for every number is non-negotiable specifically because this tool exists to produce interval times, rest, and splits that a coach reads in columns at a glance mid-practice — a generic analytics dashboard has no equivalent constraint, since its numbers aren't being scanned for alignment under time pressure. The tight 6px radius echoes the hard, tiled architecture of a pool deck rather than the soft rounded corners of a consumer app, and the 4px spacing scale is generous enough (jumping to 24/32/48 quickly) to stay scannable from arm's length on a deck, in wet-hands, low-attention conditions — density that a desk-bound analytics dashboard would never need to account for.
