---
name: video-fill
description: Produces a wordless "fill it up" video; colored balls or sand grains pour into a silhouette, container or grid and fill it to the brim, and when it is full a hidden shape or pattern is revealed (pixel art, layered sand, perfect packing). Use when the user asks for a "fill", "filling", "fill it up", "sand art", "pixel art reveal", "perfect fit" or "fits perfectly" video.
argument-hint: "[silhouette / container / variant name]"
---

# Wordless Fill It Up

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/simulate.ts` (grid-based ball collision, deterministic pouring, `calculateMetadata`).

## The core of the formula
- **First frame:** An empty container or silhouette and the first grains already pouring. The container shape hints at what it will become but does not give the result away.
- **Fill progress:** As the level rises, curiosity grows ("will it overflow?", "what will be revealed?"). The flow rate increases over time.
- **Full moment:** The last grain settles into place. If needed, the overflowing excess is trimmed or erased and the shape completes with a "click".
- **Reveal:** When finished, the grain colors form a pattern, picture or gradient. This final frame should work on its own as a poster.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state it.
- **Container or silhouette:** A simple, royalty-free shape you draw yourself (heart, heartbeat, house, tree, planet; not a number). Do not use brand or character silhouettes.
- **Color design:** Layered (a different color every minute), target picture (each grain takes the color of the cell it will settle in) or gradient.
- **Target length:** 20–35 s
- **Caption:** something like "At which second did you figure out what it was? 👀".

## Steps
1. Under `src/Wordless/<VideoName>/`, define the container as data: edge segments or a cell mask (`string[]` pixel map).
2. Physics:
   - **Balls and sand:** Use grid-based collision (as in the reference) or a cellular sand automaton (each frame: down, down-left, down-right rule). The automaton is cheaper and fills exactly.
   - **Target picture:** Color the grain according to its target cell, not at the moment it lands. That way the picture appears from the bottom up.
   - Use only `+ − × ÷` and `Math.sqrt`; the pour point and color order are determined with `random(seed)`.
3. Report the fill ratio second by second in Node. Targets: 10% is reached within 3 seconds, 100% lands on the target length, the last 10% is the fastest part (increase the flow rate), and there is no slow section longer than 2 seconds in the middle.
4. Visuals:
   - Dark background and a thin light-gray container line.
   - Grains are flat colored; for sand, 1 cell = a 6–8 px square.
   - When complete, the container line disappears and the picture grows slightly over 0.5 seconds (`spring` or `interpolate`).
5. Sound: very sparse, quiet `mouse-click.wav` on grain drops (a rhythm, not a flow sound). `switch.wav` at 25%, 50% and 75% full, `ding.wav` on completion.
6. Register under `<Folder name="Wordless">`; `calculateMetadata` computes the duration. Props: `seed`, `shape` (pixel map or preset shape name), `palette`, `sound`.
7. Verification: run tsc and eslint. Render these frames: 0, 25%, 75% and finale. No empty cell may remain in the final picture; verify in Node that the empty cell count is 0.
8. Render the MP4 and send it. In the summary write the fill table, the props, and the caption with suggested hashtags.

## Ready-made variants
- **Pixel art reveal:** A 48×48 cell mask. Sand pours from the top and, because each grain takes its target color, the picture (your own design: cat face, mountain landscape, sunset) appears from the bottom up.
- **Layered sand bottle:** A bottle silhouette; 8 colors pour in sequence and wavy layers form as the pour point shifts left and right.
- **Perfect packing:** Circles of different sizes drop into a box and the last circle fits exactly into the remaining gap. The sizes are solved in advance and verified in Node.
- **Heart fill:** A heart silhouette fills with grains in a red-to-pink gradient; when complete, the heart "beats" once.
