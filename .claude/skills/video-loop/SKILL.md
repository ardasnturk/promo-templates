---
name: video-loop
description: Produces an "endless" satisfying video whose last frame flows straight into its first, so the viewer cannot tell where it replays; items keep arriving on a conveyor and get chopped into cubes, squished, sliced or stamped while big counters tick up. Cute, smooth, ASMR-style; fully drawn in code. Use when the user asks for an "endless", "infinite", "seamless loop", "never-ending", "loop video", "chopping cubes", "dicing", "satisfying counter" or "cute squishy" video.
argument-hint: "[object / action / variant name]"
---

# Endless Loop (Seamless Satisfying Video)

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 12, **Endless loop videos**) and the `remotion-best-practices` skill.
References: `templates/src/Loop/DiceLoop` (pseudo-3D cubes, two counters), `templates/src/Loop/JellySquish` (cute characters, press), `templates/src/Loop/RibbonSlice` (curling slices). Shared helpers: `templates/src/Loop/loop.ts` and `templates/src/Loop/Counter.tsx`; reuse them, do not copy them.

## Why people watch
Nothing starts and nothing ends: the platform replays the video and the viewer keeps watching without noticing. Watch time goes over 100 %. A steady ASMR rhythm (a cut or squish every ~0.5 s), a counter that pops on every action and a cute, soft material keep the eye on the screen.

## The core of the formula
- **Endless timeline:** The video is a window onto an endless conveyor. Items `n = …, -1, 0, 1, …` arrive in order; item `n` uses `materials[n mod M]`. Every position is a function of `g - itemStart(n)` only, so frame `T` is exactly frame 0 (`T` = sum of the item durations).
- **Seam in the middle of the action:** Frame 0 is a few steps into an item (`START_STEP`), never at an item boundary. The counters reset on screen several times during the video, so the reset at the seam is not special.
- **Rhythm:** One step every 15–27 frames: action (chop / press), then the belt moves one step. No idle frames.
- **Counters:** Big number + label, like "41 CUTS / 1,042 CUBES". They count the item under the tool and pop on every change. Between items they hold the last total for a moment. A counter that only grows is forbidden: it would jump at the seam.
- **Cute and soft:** Pastel or food colors, rounded shapes, small expressions (eyes, blush), wobble and squash with area conservation. Shadows are soft; no gore, no brands.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state it.
- **Object and action** (dice, squish, slice, stamp, roll, pour…)
- **Materials:** 3–5 items that cycle (colors, inner pattern, flavor names)
- **Step length:** 15–27 frames; the loop length `T` must come out at 15–30 s
- **Counter labels:** for example `CUTS` + `CUBES`, a flavor name, `SLICES`
- **Caption:** "Did you notice when it started over? 🔁" or "How many cubes in total? 👇"

## Steps
1. Under `src/Loop/<VideoName>/`, define the materials array and the step timing (`stepFrames`, the action point inside a step, the belt move window). Use `makeCycle`, `locate` and `itemStart` from `../loop` when items have different lengths.
2. Draw the scene in SVG:
   - Pseudo-3D like `DiceLoop`: oblique projection `screen = (x + z·DX, ground − y − z·DY)`, three faces per cube (top light, side base, front dark) with `shade()`, painter's sort by `-x + y - z`.
   - Side view like `JellySquish` / `RibbonSlice` when the object is flat or soft.
   - Draw only what can be seen (only the outer faces of an uncut block) to keep the frame cheap.
3. Loop safety rules:
   - Any random value is keyed by the material index (`n mod M`), never by `n` or the frame.
   - Idle motion (`Math.sin` breathing, wobble) uses the item's local time, not `g`.
   - `Math.sin`, `cos` and `exp` are allowed: this is closed-form animation, not a chaotic simulation.
4. Sound: a soft `mouse-click` / `switch` on every action (the same sound at most 3 times in a row, small volume variation), a quiet `ding` when an item is finished. Pass the events through `loopSounds()` so a sound near the end also plays its tail before frame 0.
5. Register under `<Folder name="Loop">`; `calculateMetadata` returns `T`. Props: `seed`, the step length, the materials or palettes, the counter labels, `sound`.
6. Verification: run tsc and eslint. Render frames 0, 1, `T-1` and an action frame. The pixel difference between `T-1` and 0 must be about the same as between 0 and 1 (measure it with PIL). Check that the counters and the tool do not overlap.
7. Render the MP4 and send it. In the summary write the loop length, the materials, the props, a one-line caption and 3–5 hashtags.

## Ready-made variants
- **Dicing board (`DiceLoop`):** Cucumber, carrot, layered soap and watermelon blocks on a wooden belt; a cleaver dices them into cubes that tumble into a pile. Counters: `CUTS` / `CUBES`.
- **Jelly press (`JellySquish`):** Cute jelly blobs with faces ride a belt; a press squishes them (`> <`), they wobble back happy (`^ ^`) with sparkles. Counter: presses per flavor, label = flavor name.
- **Soap curls (`RibbonSlice`):** Layered pastel bars are sliced; every slice curls into a striped spiral and rides away. Counter: `SLICES`.
- **Cookie stamp:** Dough discs get stamped into stars and hearts; the stamped shape pops out with a squash. Counter: `COOKIES`.
- **Paint pour:** Cups pour colored layers into a jar that slides on; the next jar arrives as the first one leaves. Counter: `LAYERS`.
- **Sushi roll:** A rolled log is cut into rounds that tip over and line up. Counters: `CUTS` / `PIECES`.
