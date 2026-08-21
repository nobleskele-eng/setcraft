# LaneLab research and formula notes

This document records the product patterns and mathematical assumptions used in the final research build. It is not a coaching certification curriculum or a universal training prescription.

## Workout-writing workflow

U.S. Masters Swimming's workout-writing guidance emphasizes establishing the purpose of a workout, using simple and consistent terminology, distinguishing send-off intervals from fixed rest, estimating set duration, and adapting repetition count or send-off by lane while preserving the session goal. LaneLab reflects those ideas through Project Setup, explicit timing modes, recursive duration estimates, lane-specific overrides, and deck-sheet coaching points.

Source:

- U.S. Masters Swimming, “How to Write a Swimming Workout”  
  https://www.usms.org/fitness-and-training/articles-and-videos/articles/how-to-write-a-swimming-workout

## Visual programming research

Blockly's workspace model separates a toolbox, flyout, workspace, zoom controls, and configurable UI components. Scratch's custom-block pattern demonstrates why users should be able to define reusable abstractions rather than repeatedly rebuilding the same sequence. LaneLab adapts these interaction principles to training blocks rather than programming commands.

Sources:

- Blockly, Workspace Anatomy  
  https://docs.blockly.com/guides/get-started/workspace-anatomy
- Scratch Foundation, My Blocks / custom blocks learning materials  
  https://scratchfoundation.org/learn/learning-library/my-blocks-custom-blocks

## Existing swim-planning product patterns

Public product pages from MakoSets and Commit Swimming demonstrate demand for reusable set libraries, structured workout construction, automatic volume calculations, multiple-group planning, and readable delivery. LaneLab does not claim to invent those general categories. Its narrower differentiation is nested executable block logic, transparent AI-to-block conversion, deterministic validation, and lane-specific set overrides inside one visual graph.

Sources:

- MakoSets  
  https://makoswim.io/makosets/
- Commit Swimming Workout Builder  
  https://www.commitswimming.com/features/workout-builder

## Workout-library research

The editable library includes transformed, attributed templates inspired by public coaching articles as well as original LaneLab workouts. Source attribution is stored with the relevant library items. Coaches should still modify every practice for age, ability, current readiness, training history, facilities, and supervision.

Sources used for inspiration and category coverage include:

- YourSwimLog swimming workouts  
  https://www.yourswimlog.com/swimming-workouts/
- YourSwimLog articles  
  https://www.yourswimlog.com/articles/
- SwimSwam competitive swimming workouts  
  https://swimswam.com/competitive-swimming-workouts/

## Calculator formulas

### 1. Pace table

For a recorded time `T` over distance `D`, the neutral pace estimate for target distance `d` is:

```text
pace(d) = T × d / D
```

This assumes constant average velocity. Starts, turns, fatigue, and event-specific pacing can make short and long split projections differ in practice.

### 2. Split planner

LaneLab distributes the entered total time across split distances using normalized weighting patterns:

- even
- negative split
- positive split
- fast finish

The weights are normalized so the unrounded split seconds add exactly to the entered total. They are planning patterns, not predicted race outcomes.

### 3. Send-off and lane cycle

For a target pace per 100 and a repetition distance:

```text
swim time = pace per 100 × repeat distance / 100
exact cycle = swim time + desired rest
send-off = exact cycle rounded upward to the selected clock increment
expected rest = send-off − swim time
```

The UI warns when an entered send-off is faster than the modeled completion time.

### 4. Critical swim speed

The two-trial distance-time relationship is implemented as:

```text
critical speed = (D_long − D_short) / (T_long − T_short)
pace per 100 = 100 / critical speed
```

Critical-velocity research commonly models a linear relationship between swimming distance and time across maximal trials. LaneLab reports the result as a field estimate for coach interpretation, not a medical threshold or guaranteed prescription.

Research source:

- Wakayoshi et al./related critical velocity literature indexed by J-STAGE, “A simple method for determining critical swimming velocity as swimming fatigue threshold in competitive swimming”  
  https://www.jstage.jst.go.jp/article/jjbse/6/2/6_2002_004/_article/-char/en

### 5. Stroke metrics

For distance `D`, time `T`, and counted stroke cycles `C`:

```text
velocity = D / T
stroke rate = C / T × 60
Distance per cycle = D / C
stroke index = velocity × distance per cycle
```

Users must count cycles consistently. A “cycle” is not necessarily the same as one hand entry, depending on the stroke and coaching convention.

### 6. Set math

```text
total repetitions = repetitions × rounds
total distance = total repetitions × repeat distance
swim time per repeat = pace per 100 × repeat distance / 100
cycle time = max(swim time, send-off)  [send-off mode]
cycle time = swim time + fixed rest     [rest mode]
total time = total repetitions × cycle time
work-to-rest ratio = total swim time / total rest time
```

When a send-off is impossible, LaneLab does not invent negative rest; it uses at least the modeled swim time for duration and displays a warning.

### 7. Metre/yard conversion

Exact length conversion uses:

```text
1 yard = 0.9144 metres
metres to yards = metres / 0.9144
yards to metres = yards × 0.9144
```

The same-velocity time estimate only scales for distance. It is not an official SCM/SCY/LCM conversion because starts, turns, underwater distance, pool geometry, and athlete strengths materially affect performance.

## AI model integration

The server uses a configurable `GEMINI_MODEL` environment variable and defaults to `gemini-3.6-flash` in this build. Model availability changes over time; deployments should verify the selected model against current Google AI documentation.

Source:

- Google AI for Developers, Gemini 3.6 Flash model documentation  
  https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash

## Safety and product limits

- The coach approves the final workout.
- Athlete restrictions are constraints entered by a human, not diagnoses generated by LaneLab.
- High-intensity labels are configurable planning categories, not universal prescriptions.
- The app does not determine medical readiness.
- Deterministic checks catch supported structural and timing errors but cannot guarantee that a session is appropriate for every athlete.
