---
name: video-physics
description: Produces a satisfying physics loop video such as bouncing, growing or splitting balls, a ball escaping a rotating circle, or a Plinko/marble race. Use when the user asks for a "satisfying video", "oddly satisfying", "physics video", "physics simulation", "bouncing ball", "ball escape", "Plinko" or "marble race" video.
argument-hint: "[mechanic or variant name] — if left empty, a variant is picked"
---

# Satisfying Physics Loop

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` and the `remotion-best-practices` skill.
Reference: `templates/src/BouncingBall/` (simulation `simulate.ts`, visuals `BouncingBall.tsx`). Study the structure, but do not copy the mechanic.

## Inputs
If the request does not specify them, pick a suitable variant from the ready-made variants below and state your choice in one sentence.
- **Mechanic:** what is happening?
- **Hook (first frame):** a question like "Will it make it? 🤔".
- **Counter:** a value that keeps changing on screen (bounces, ball count, rings left…).
- **Tension:** something that increases over time (speed, size, count).
- **Final moment:** a clear climax and a target length of ~15–25 s.
- **CTA:** something like "What was your guess? 👇".

## Steps
1. Write `simulate.ts` under `src/Satisfying/<VideoName>/`.
   - The simulation must be deterministic and seeded.
   - In chaotic computations use only `+ − × ÷` and `Math.sqrt`.
2. Run the simulation in Node (`npx tsx`). Sweep the parameters so the finale lands on the target second and there is no boring wait before it. Report the sweep results as a short table.
3. Write the visuals:
   - Dark background, neon colors, glow.
   - Short trail, flash on collision.
   - The counter "pops" on every increment.
4. Add sounds: `mouse-click.wav` or `switch.wav` on every collision (with very frequent collisions, thin them out to at least 2–3 frames apart), and `anime-wow.wav` / `yippee.wav` / `vine-boom.wav` at the finale.
5. Register the composition in `src/Root.tsx` under `<Folder name="Satisfying">`. If the duration depends on the simulation, use `calculateMetadata`.
6. Verification: run tsc and eslint. Render the start, middle and final frames with `remotion still … --port=3100` and inspect them. Compare the final frame from Node with the counter in the render.
7. Render the MP4 (`out/<name>.mp4`) and send it. Write a summary and the props that can be changed in Studio (seed, etc.).

## Ready-made variants
- **Splitting ball:** A ball bouncing in a square box splits in two on every wall hit. When it reaches 1000 balls the screen turns into a colorful ocean. Hook: "Can 1 ball become 1000?" Counter: ball count.
- **Circle escape:** A rotating circle has a narrow gap; the ball inside speeds up on every hit. When the ball escapes, the circle shatters. Hook: "Will this ball escape? 😮"
- **Color race (Plinko):** 4 colored marbles race down a pegged course; every seed produces a different winner. Hook: "Pick your color, then watch 👇" CTA: "Which color did you pick?"
- **Layer-breaking ball:** There are 10 nested rings; every hit thins a ring and a ring breaks after 3 hits. When the last ring breaks, the ball is free. Counter: rings left.
