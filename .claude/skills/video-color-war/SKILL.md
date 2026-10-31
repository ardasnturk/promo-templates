---
name: video-color-war
description: Produces a wordless color territory war video; balls of 2–6 colors on a grid-split arena bounce through rival territory and paint cells their own color until only one color is left. Every seed produces a different winner. Use when the user asks for a "color war", "territory war", "territory battle", "which color wins", "color battle" or "wordless race" video.
argument-hint: "[number of colors / arena shape / variant name]"
---

# Wordless Color Territory War

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**, and item 7, **Randomness and simulation**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/simulate.ts` (seeded deterministic physics, per-frame state array, `calculateMetadata`).

## The core of the formula
- **First frame:** The arena is split into equal territories, and in each territory a ball of a rival color is moving. The viewer immediately picks a color; the caption asks for it too: "Pick your color, then watch 👇".
- **Rule:** A ball paints the rival cell it touches its own color and bounces back. Cells of its own color are not walls for the ball; it passes through them.
- **Balanced chaos:** The leading color keeps changing, and the lead changes hands at least 2–3 times. Eliminated colors disappear from the screen one by one.
- **Finale:** When the last rival cell is painted, the arena becomes a single color. The winning color pulses briefly and a `ding` plays.
- **Leaderboard bar (wordless):** A thin horizontal bar at the top shows the color shares as proportions. No text.

## Inputs
If the request does not specify them, use the defaults and state them.
- **Number of colors:** 4 (2–6)
- **Arena:** Square grid (24×24), or circle or hexagon
- **Target length:** 25–45 s
- **Determining the winner:** Depends on the seed; the winner is not chosen, it is searched for. For series production, a seed can be found for each color.

## Steps
1. Write `src/Wordless/<VideoName>/simulate.ts`.
   - The cell grid is a `Uint8Array`; balls move in continuous coordinates.
   - At every substep check which cell the ball entered; if it entered a rival cell, paint the cell and reflect the ball on the axis it entered on.
   - Use only `+ − × ÷` and `Math.sqrt`. Choose the initial angles with `random(seed)` and keep the speed constant.
2. **Guarantee an ending:** Add a rule that strengthens over time. For example, every 8 seconds each color gets one more ball, or the ball of a color close to elimination speeds up. That way an endless balance cannot form. Keep the rule simple and visible.
3. Sweep 8–10 seeds in Node and report: winner, duration, number of lead changes, longest stagnant interval. Targets: duration 25–45 s, lead changes ≥ 2, no stagnation longer than 3 seconds. Choose the default seed from this table.
4. Visuals:
   - Cells are flat colored, with a 2px gap between cells.
   - Balls are a light tint of their cell color, with a thin white outline.
   - A painted cell "pops" from small to full size over 4–6 frames.
   - When an eliminated color's last cell disappears, there is a short flash.
5. Sound: `mouse-click.wav` on paints (thinned out to at least 3 frames apart), `switch.wav` on elimination, `ding.wav` at the finale.
6. Register under `<Folder name="Wordless">`; `calculateMetadata` computes the duration. Props: `seed`, `colors` (array), `gridSize`, `sound`.
7. Verification: run tsc and eslint. Render these frames: 0, first lead change, an elimination and the finale. The winner in Node must match the last frame of the render.
8. Render the MP4 and send it. In the summary write the seed table, the props, and the caption with suggested hashtags.

## Ready-made variants
- **4 colors, square arena:** The classic variant; 4 territories in the corners with 1 ball in each.
- **Marbling war:** 2 colors with 6 balls each. The border turns into a swirling marbled-paper pattern; the winner doesn't matter, it is relaxing to watch (40 s).
- **Circle pie:** The circle is split into 6 slices; balls spawn from the center and the slices eat each other.
- **Team colors:** Uses the colors of 2 teams but no names or crests. Suitable for a general-audience account; the caption asks "Blue or orange?".
