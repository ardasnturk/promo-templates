---
name: video-machine
description: Produces a wordless "order out of chaos" video; it shows simple-rule cellular automata such as Langton's ant, the abelian sandpile, the Game of Life, Wolfram rules or multiple ants looking chaotic for a long time and then suddenly turning into a surprising pattern. Use when the user asks for a "cellular automaton", "Langton's ant", "Game of Life", "Conway", "sandpile", "Wolfram rule", "emergence" or "simple rules, complex patterns" video.
argument-hint: "[automaton / rule / variant name]"
---

# Wordless Order Out of Chaos (Cellular Automaton)

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**, and item 7, **Randomness and simulation**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/simulate.ts` (frame states precomputed in Node, `calculateMetadata`).

## Why people watch
At first it looks like random chaos and the viewer waits, wondering "does this mean anything?". At some point the pattern suddenly reveals itself: a highway, a fractal, a mandala. This "aha" moment starts an "at which second?" debate in the comments and gets rewatches.

## The core of the formula
- **First frame:** A single cell, a single ant or a single pile of sand. The rule can be sensed from the motion in the first seconds; no explanation is needed.
- **Speed ramp:** Step by step at first (so the viewer understands the rule), then tens or thousands of steps per frame. The speed curve is exponential; slow down a little at the moment order emerges.
- **Aha moment:** The moment order appears lands between the middle and the last third of the video. The camera can zoom in smoothly on that area.
- **Finale:** The pattern completes or fills the screen, with a short flash and a `ding`.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state it.
- **Automaton and rule**
- **Grid size:** 200×350 (cell 4–5 px), smaller for the sandpile
- **Target length:** 25–45 s
- **Caption:** "At which second did you notice the pattern? 🤯"

## Steps
1. Write `src/Wordless/<VideoName>/simulate.ts`.
   - Keep the state as a `Uint8Array` grid; use integer arithmetic (no floating point, determinism guaranteed).
   - If the initial state involves randomness (Game of Life seed, multiple ant positions), generate it with `random(seed)`.
2. **Step plan:** A `steps(frame)` function returns how many simulation steps to take per frame (exponential ramp). The total step count must be enough to reveal the pattern. Example: Langton's ant starts its highway at ≈ 10,000 steps; in the sandpile, 2^n grains are added to the center.
3. **Memory and speed:** Do not store the full grid for every frame.
   - **Lean approach:** For each frame store only the cells that changed in that frame as `[index, newValue]`; during rendering build the frame's grid by rolling forward from the nearest keyframe (a full copy every 30 frames).
   - Draw the grid on a `<canvas>` with `ImageData`.
4. Report in Node: total steps, the frame of the aha moment (the step where the highway starts, the moment the sandpile settles into symmetry), canvas draw time. Targets: aha moment at 45–75% of the video; no section without visual change longer than 3 seconds in the middle.
5. Visuals:
   - Dark background and a 3–5 color palette (one color per cell state).
   - The ant or active cell is bright white and leaves a short trail.
   - For the sandpile, colors go from cool to warm tones.
   - No grid lines; cells are adjacent.
6. Sound: `mouse-click.wav` on every step during the first steps; once it speeds up, only on specific events (a pile toppled, the ant entered a new area). `switch.wav` at the aha moment, `ding.wav` at the finale.
7. Register under `<Folder name="Wordless">`; `calculateMetadata` computes the duration. Props: `seed`, `variant`, `palette`, `sound`.
8. Verification: run tsc and eslint. Render these frames: 0, second 3, the aha moment and the finale. The step count in Node must be consistent with the pattern in the rendered frame (for example, the frame where the highway starts).
9. Render the MP4 and send it. In the summary write the step table, the props, the caption and suggested hashtags.

## Ready-made variants
- **Langton's ant:** A single ant creates a chaotic blob for ~10,000 steps, then suddenly starts building a diagonal highway. That is exactly the aha moment.
- **Sandpile:** Sand is dropped grain by grain onto the center, and a cell that reaches 4 topples onto its neighbors. In the end a 4-color, perfectly symmetric fractal mandala emerges.
- **Multiple ants (colored rule):** A 4-color Langton rule (e.g. RLLR) and 3 ants. Symmetrically growing square patterns form.
- **Game of Life seed:** A small starting pattern (e.g. the R-pentomino) explodes and grows over hundreds of generations, then settles into a stable, blinking city.
- **Wolfram Rule 30 / 90:** A pattern growing downward row by row from a single cell. With Rule 90, the Sierpinski triangle appears.
