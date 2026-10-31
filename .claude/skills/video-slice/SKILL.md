---
name: video-slice
description: Produces a wordless ASMR cutting / crushing video; layered colored blocks are cut into thin slices that curl as they fall, a hydraulic press crushes objects, kinetic sand is sliced, soap cubes are diced. Fully drawn in code, no filming needed. Use when the user asks for an "ASMR", "cutting", "slicing", "soap cutting", "kinetic sand", "hydraulic press", "crushing" or "satisfying cutting" video.
argument-hint: "[material / tool / variant name]"
---

# Wordless ASMR Cutting and Crushing

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/MassMachine.tsx` (plain dark background, gray metal look, sound timing). This genre is mostly timed (kinematic) animation, not a physics simulation.

## Why people watch
Tactile satisfaction: the blade entering the material, the slice curling and the neat stacking create a "click" feeling in the brain. Each cut is a little different from the previous one (color, thickness, curl), so the viewer waits for the next one. It is one of the most loop-friendly genres.

## The core of the formula
- **First frame:** The blade or press is right above the material and already moving. The first cut happens within 0.5 seconds.
- **Material:** Layered, patterned or surprise-colored-inside blocks. The inside is revealed when cut; the outside is plain, the inside vivid ("what's inside?").
- **Rhythm:** Cuts start at a steady rhythm (≈ 1 cut/s), then speed up (2–3 cuts/s). Every so often there is a "big cut" (the block splits in half, revealing its inside).
- **Material behavior:** After being cut, a slice curls or tips over and stacks on top of the previous slices. A crushed object bulges out at the sides. The behavior is soft and believable.
- **Finale:** When the block is finished, the stack briefly settles into a neat pattern and a `ding` plays. Or, for a loop, a new block slides into place and connects to the first frame.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state it.
- **Material** and its inner pattern (layers, stripes, polka dots, gradient)
- **Tool:** Knife, wire cutter, cube cutter or hydraulic press
- **Ending:** Loop or finale
- **Target length:** 15–30 s
- **Caption:** "Which color was the most satisfying? 👇" or "Watch with sound 🔊"

## Steps
1. Under `src/Wordless/<VideoName>/`, define the cut schedule as a single array: `[startFrame, thickness, type]`.
   - Cut intervals and thickness variety are determined with `random(seed)`.
2. Write the animation:
   - **Blade descent:** Fast descent (4–6 frames) and a short pause; `Easing.in(Easing.cubic)` then `Easing.out`.
   - **Slice curl:** Draw the slice as a strip of 6–10 segments. Each segment's angle bends along a curve that increases with the slice's age (roll effect).
   - **Stacking:** A slice settles where it falls on top of the height of the previous slices; compute the height from the array.
   - **Crushing:** While the object is pressed vertically it widens horizontally (preserve the area: `width × height` constant). Past a certain threshold, crack lines and colorful inner overflow appear.
   - If the cutting or crushing is not chaotic physics, `interpolate` and `spring` are enough. If fragments need to scatter, use only `+ − × ÷` and `Math.sqrt`.
3. Report the rhythm in Node (cut times, gaps between cuts). Targets: first cut < 0.5 s; no gap longer than 1.5 seconds; the speed at least doubles in the last third.
4. Visuals:
   - Dark or very light neutral background (ASMR videos also work on a light background).
   - Material colors are pastel or saturated and the cut surface is drawn 1 shade lighter; this gives a sense of depth.
   - The tool is gray metal with a thin highlight line along its edge. A light shadow is allowed.
5. Sound: `mouse-click.wav` or `switch.wav` on every cut. Vary the sound and volume by cut type; the same sound must not repeat more than 3 times in a row. `whoosh.wav` at a low level on a big cut. `ding.wav` on completion.
6. Register under `<Folder name="Wordless">`; `calculateMetadata` computes the duration from the cut schedule. Props: `seed`, `palette`, `loop` (boolean), `sound`.
7. Verification: run tsc and eslint. Render these frames: 0, a slice mid-curl, a big cut and the finale (or, for a loop, 0 and the last frame). If a loop was chosen, there must be no jump between the last frame and the first frame.
8. Render the MP4 and send it. In the summary write the cut schedule, the props, the caption and suggested hashtags.

## Ready-made variants
- **Layered soap:** An 8-layer pastel block is cut into thin slices; the slices roll up and line up side by side.
- **Kinetic sand:** A square sand mold is cut into a grid with a wire. The little cubes spread slightly and a core of a different color shows inside them.
- **Hydraulic press:** Colorful objects arriving one after another (sphere, cube, layered cylinder; no brands or real products) are crushed into colorful discs. The discs form a tower on the side.
- **Rainbow roll:** A long strip is cut into 12 colors; the pieces curl and line up into a rainbow arc.
- **Surprise core:** Plain gray spheres are cut in half and each one reveals a core with a different pattern. The last sphere has the brightest pattern inside.
