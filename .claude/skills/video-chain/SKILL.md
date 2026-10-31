---
name: video-chain
description: Produces a wordless chain reaction video such as a domino spiral, a marble run, a Rube Goldberg machine, or falling cards. A single touch starts a reaction that travels across the whole screen. Use when the user asks for a "domino", "dominoes", "chain reaction", "marble run", "Rube Goldberg", "toppling cards" or "wordless contraption" video.
argument-hint: "[contraption or variant name]"
---

# Wordless Chain Reaction

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/` (simulation + `calculateMetadata` + scene structure). The mechanic can be completely different.

## The core of the formula
- **First frame:** The whole contraption is visible and the first touch (releasing the marble, pushing the first tile) starts within 0.5 seconds. The viewer wonders "will it make it to the end?".
- **Followable path:** The reaction progresses along a single line on screen. The camera stays fixed or follows the reaction smoothly (pan/zoom with `interpolate`).
- **Acceleration:** The reaction proceeds one piece at a time at first, then branching and in parallel. In the last 3 seconds everything happens at once.
- **Finale:** The last piece triggers a big event: a pattern or a bloom of color covering the screen, or a bell ringing.
- **Suspense (optional):** In the middle there is a momentary "is it going to stop?" slowdown, and then the reaction continues. This slowdown must actually happen in the simulation, not be faked.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state it.
- **Contraption type** and number of pieces
- **Color design:** Every toppled or triggered piece changes color; a pattern emerges in the finished contraption.
- **Target length:** 20–40 s
- **Caption:** something like "At which second did you think it would stop? 👇".

## Steps
1. Under `src/Wordless/<VideoName>/`, define the contraption as data (list of pieces: position, angle, type).
   - The path generator is seeded (spiral, zigzag, branching).
2. Compute the timing:
   - **Dominoes and cards:** No real rigid-body simulation is needed. Compute each tile's topple time with a closed form like `t[i] = t[i-1] + spacing / speed`. Draw the topple angle with an eased curve around that moment. Speed depends on tile spacing.
   - **Marble run:** Use 1-dimensional motion along track segments (gravity component + friction). If there is free flight and collision, use only `+ − × ÷` and `Math.sqrt`.
3. Output the event timeline in Node (`npx tsx`) and report it (first event, branchings, finale). Check: no gap without events longer than 2 seconds, the finale lands on the target length.
4. Visuals:
   - Dark flat background. Pieces are gray before toppling and take their palette color after toppling.
   - The colors form a gradient or pattern along the path; the final frame stands alone like a poster.
   - A light shadow is allowed; no glow.
5. Sound: `mouse-click.wav` on every topple. With frequent events, thin them out to at least 2 frames apart and lower the volume. `ding.wav` at the finale.
6. Register under `<Folder name="Wordless">`; `calculateMetadata` computes the duration. Props: `seed`, `pieces`, `sound`.
7. Verification: run tsc and eslint. Render these frames: 0, first branching, suspense moment and finale. Check that tiles or marbles do not overlap each other.
8. Render the MP4 and send it. In the summary write the event table, the props, and the caption with suggested hashtags.

## Ready-made variants
- **Domino spiral:** 300 tiles winding from the outside in, with each ring in a different color. The last tile in the center opens a bloom of color.
- **Branching domino tree:** A single line splits in two every 40 tiles; in the end 16 branches reach the bottom edge at the same time.
- **Marble run:** Zigzag tracks, an elevator, a switch and a bell. At every station the marble releases the next marble, and in the end 10 marbles come down together.
- **Domino picture:** Tiles arranged in a grid reveal a simple pixel pattern (heart, smiley face, wave) on their backs as they topple.
