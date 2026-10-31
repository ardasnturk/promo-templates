---
name: video-swarm
description: Produces a wordless particle swarm video; thousands of particles flow and scatter like a flock of birds or a school of fish, then gather into a shape on their own (heart, star, spiral, planet, butterfly), scatter again and morph into the next one. Use when the user asks for a "swarm", "flock", "boids", "particles", "particle morph", "dots forming shapes", "shape morphing" or "murmuration" video.
argument-hint: "[shape sequence / swarm behavior / variant name]"
---

# Wordless Particle Swarm and Morph

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**, and item 7, **Randomness and simulation**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/simulate.ts` (neighbor search with a grid, seed, per-frame position array, `calculateMetadata`).

## Why people watch
Swarm motion is the hypnotic movement seen in starling murmurations in nature. Particles gathering from a scattered flow into a shape and dispersing again keep the viewer in the video wondering "what's the next shape?". Every morph is like a small reward.

## The core of the formula
- **First frame:** 1500–4000 particles flowing across the screen as a swarm. In the first 2 seconds the swarm curls once, and at second 4 the first shape starts to appear.
- **Cycle:** Flow (2–3 s) → gathering (1.5 s) → shape (1 s, breathes slightly) → burst or dispersal (0.5 s) → flow again. 5–7 shapes.
- **Shape order:** From easy to surprising (circle → star → spiral → butterfly → final shape). The final shape is the most complex and stays the longest.
- **Color:** Particle color changes with the shape, or with speed (fast = warm, slow = cool). When a shape settles, the colors align into a gradient.
- **Finale:** The final shape settles and glows, and a `ding` plays. Or, for a loop, the swarm returns to the flow of the first frame.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state it.
- **Shape sequence:** Simple silhouettes you draw yourself. Do not use logos, brands, letters or digits (wordless rule).
- **Particle count:** 2500
- **Target length:** 25–40 s
- **Caption:** "Which shape was your favorite? 👇" or "Guess the last one 👀"

## Steps
1. Write `src/Wordless/<VideoName>/simulate.ts`.
   - **Boids rules:** Separation, alignment and cohesion; search for neighbors with a uniform grid (as in the reference).
   - **Target attraction:** In the gathering phase each particle is assigned to a sampled point of the shape and pulled toward it with a spring force. The force weight rises from 0 to 1 over the phase; that way the swarm "flows" into the shape.
   - **Assignment:** Assign each particle to the target point by nearest position. Simple approach: sort both the particles and the targets along a single axis (e.g. by `y` then `x` instead of by angle) and pair them. This reduces crossings.
   - Use only `+ − × ÷` and `Math.sqrt` (no angles, work with vectors).
2. **Shape sampling:** Each silhouette is converted from a pixel mask (`string[]`) or a closed path into seeded, evenly spaced points. The number of points equals the particle count.
3. Report in Node: each shape's settle frame and the average distance to target at the shape moment (px). Targets: average distance at settle time < 4 px (so the shape reads clearly); during the flow phase the swarm does not leave the screen (safe area).
4. Visuals:
   - Dark background; particles are 2–3 px flat colored dots.
   - Use `<canvas>` for many particles.
   - Short motion trail: draw the dots of the previous 3 frames with decreasing opacity.
   - When a shape settles, all dots grow slightly over 6 frames and return (breathing).
5. Sound: `switch.wav` when each shape settles, `whoosh.wav` at a low level on dispersal, `ding.wav` at the finale. No sound during the flow phase.
6. Register under `<Folder name="Wordless">`; `calculateMetadata` computes the duration from the shape sequence. Props: `seed`, `count`, `shapes` (order), `palette`, `sound`.
7. Verification: run tsc and eslint. Render each shape's settle frame and two flow frames. Each shape must be readable when viewed on its own.
8. Render the MP4 and send it. In the summary write the shape table, the props, the caption and suggested hashtags.

## Ready-made variants
- **Sky murmuration:** Black dots like a starling flock on a sunset gradient background (a light background is allowed in this variant). Bird, heart, infinity sign and a large bird silhouette.
- **Galaxy:** Blue-purple particles. Cloud → spiral galaxy → ringed planet → exploding star → new galaxy (loop).
- **Ocean:** A school of fish in turquoise tones. It morphs between whale, octopus and wave silhouettes.
- **Seasons:** Leaf-colored particles. Seed → sprout → flower → tree → snowflake; with each shape the color shifts to the season.
- **Kaleidoscope:** The swarm is mirrored with 6-fold symmetry; each shape opens up like a mandala.
