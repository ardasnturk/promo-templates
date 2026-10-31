---
name: video-growth
description: Produces a wordless procedural growth video; from a single point a tree, coral, crystal, lightning bolt, river delta, snowflake or city network grows by itself and fills the screen. The viewer watches to the end wondering "what will it become?". Use when the user asks for a "growth", "growing tree", "tree growing", "crystal", "coral", "fractal", "generative art", "procedural growth" or "from a single point" video.
argument-hint: "[growing structure / algorithm / variant name]"
---

# Wordless Procedural Growth

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**, and item 7, **Randomness and simulation**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/simulate.ts` (seeded deterministic simulation, precomputation in Node, `calculateMetadata`).

## Why people watch
The structure starts as a single point and it is not clear what it will become. Every second it takes a bit more shape, but the whole is only visible at the end. The final frame stands alone like a poster, which raises the save rate.

## The core of the formula
- **First frame:** A single bright seed point at the bottom or center of the screen. The first branches appear within 0.5 seconds.
- **Accelerating growth:** Branches appear one by one at first, then there is an explosion of forking. The growth rate is not constant but accelerating (the number of steps per frame increases over time).
- **Color = age:** Old parts are dark and saturated, new tips are bright and light. The growth front is always visible.
- **Boundary and finale:** The structure stops when it reaches the defined silhouette or the screen safe area. In the last 1 second the whole structure lights up with a wave of light from root to tip.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state it.
- **Structure and algorithm** (from the variants below)
- **Hidden silhouette (optional):** Growth happens only inside a mask (heart, circle, tree crown); the shape becomes clear at the end. The silhouette should be a simple shape you draw yourself.
- **Target length:** 20–35 s
- **Caption:** "At which second did you figure out what it would become? 👀"

## Steps
1. Write `src/Wordless/<VideoName>/simulate.ts`. Choose the algorithm according to the variant:
   - **Space colonization (tree, veins):** Target points are scattered with the seed. Each branch tip grows toward the nearest targets, and a target that is approached is removed.
   - **DLA (coral, crystal, lightning):** Randomly walking particles stick when they touch the existing structure. For speed, start each particle from a ring around the structure.
   - **L-system (plant, snowflake):** Expand the rule string and draw it. Use 6-fold symmetry for the snowflake.
   - **Forking path (river, lightning, city network):** The tip advances, forks with a certain probability and stops when it touches an existing path.
2. Rule compliance:
   - Use only `+ − × ÷` and `Math.sqrt`; if angles are needed, work with unit vectors (vector addition and normalization instead of a rotation matrix).
   - For randomness use `random(\`${seed}-${i}\`)`.
3. Output: a list of `[x1, y1, x2, y2, birthFrame, depth]` for each segment. During rendering draw only the segments with `birthFrame ≤ frame`; a new segment appears by extending over 4–6 frames.
4. Report the growth curve second by second in Node (segment count, percentage of area covered).
   - Targets: a visible shape in the first 3 seconds; no slow section longer than 2 seconds in the middle; the finale lands on the target length; segment count ≤ 20,000 (for render speed).
5. Visuals:
   - Dark flat background. Line thickness decreases with depth (thick trunk, thin tips).
   - The palette is a 2–3 color gradient (by age).
   - With many segments, use `<canvas>` instead of SVG and redraw from scratch every frame (with `useCurrentFrame`).
6. Sound: sparse `mouse-click.wav` on big forks, `switch.wav` when growth reaches the halfway point, `ding.wav` on the final glow. Keep sound minimal; this genre works better close to silence.
7. Register under `<Folder name="Wordless">`; `calculateMetadata` computes the duration. Props: `seed`, `variant`, `palette`, `sound`.
8. Verification: run tsc and eslint. Render these frames: 0, 25%, 75% and finale. If a silhouette is used, the shape must be readable in the final frame. Note the render time.
9. Render the MP4 and send it. In the summary write the growth table, the props, the caption and suggested hashtags.

## Ready-made variants
- **Tree (space colonization):** The trunk and branches grow toward targets scattered in the crown area. At the end, leaf dots bloom pink and green all at once.
- **Lightning (DLA):** A purple-white network growing from the top downward. The moment it touches the ground, the whole path flashes white.
- **Snowflake (L-system):** A 6-fold symmetric crystal grows outward from the center. Each layer is one shade lighter blue.
- **Hidden heart (DLA + mask):** Coral grows inside a heart mask; the heart shape becomes clear in the last 20%.
- **River delta:** A branch flowing from the top forks and covers the screen like veins. The color shifts from dark navy to turquoise.
