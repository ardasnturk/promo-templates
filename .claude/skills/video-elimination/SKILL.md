---
name: video-elimination
description: Produces a wordless "last one standing wins" elimination video; colored balls collide in an arena, shrink or lose health on every hit, popped balls are eliminated and a single ball remains. The viewer picks a color at the start and watches to the end. Use when the user asks for an "elimination", "battle royale", "last one standing", "last ball standing", "survival", "which ball wins" or "marble battle" video.
argument-hint: "[ball count / arena / variant name]"
---

# Wordless Elimination (Last One Standing Wins)

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**, and item 7, **Randomness and simulation**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/simulate.ts` (grid-based ball collision, seed, per-frame state array, `calculateMetadata`).

## Why people watch
The viewer picks a color in the first second and is now on its side. They don't leave the video until their color is eliminated or wins. The caption asks for the pick, and in the comments everyone writes their own color.

## The core of the formula
- **First frame:** 8–16 equal-sized balls in different colors, already moving in the arena. The first collision happens within 1 second.
- **Health = size:** There is no health bar or number on screen. Colliding balls shrink. A ball that drops below the threshold size pops and its fragments scatter in its color.
- **Power difference:** In a collision the faster ball shrinks less and the slower one shrinks more. That way the winner depends on motion, not just luck, and the result looks fair.
- **Shrinking arena:** The arena shrinks a little every 6–8 seconds. This both guarantees an ending and increases tension.
- **Final duel:** When 2 balls remain, the arena shrinks very slowly and there is a short slow-motion moment (frame repetition or time scaling in Remotion). The winner grows, pulses and a `ding` plays.

## Inputs
If the request does not specify them, use the defaults and state them.
- **Ball count:** 12 (8–16)
- **Arena:** Circle (or square, hexagon)
- **Target length:** 30–45 s
- **Winner:** Depends on the seed; it is not chosen. For series production, seeds that produce different winners are searched for.
- **Caption:** "Pick your color, then watch 👇 Did it win?"

## Steps
1. Write `src/Wordless/<VideoName>/simulate.ts`.
   - Seeded initial positions and velocities.
   - No gravity; the arena wall is elastic. Keep balls close to a constant speed (after a collision, slowly pull the speed back toward the target); that way the game never slows down.
   - Use only `+ − × ÷` and `Math.sqrt`.
2. Damage rule: in a collision each ball's radius shrinks by `damage × (opponent speed / total speed)`. The same pair must not take damage over consecutive frames (a 6-frame cooldown per pair).
3. Sweep 10–20 seeds in Node and report: winner, duration, elimination times, longest interval without an elimination, the winner's rank in the first 10 seconds.
   - Targets: duration 30–45 s; interval without elimination ≤ 5 s; the winner should not look like the favorite at the start (surprise).
   - Choose the default seed from this table.
4. Visuals:
   - Dark background, thin light-gray arena.
   - Balls are flat colored with a thin dark outline.
   - On collision, a 3-frame white flash and a small shake.
   - When an eliminated ball pops, 10–14 particles scatter in its color and fade.
   - At the bottom of the screen, the colors of eliminated balls line up in order as small dots (a wordless scoreboard).
5. Sound: `mouse-click.wav` on collisions (thinned out to at least 2 frames apart), `switch.wav` on elimination, `ding.wav` for the winner.
6. Register under `<Folder name="Wordless">`; `calculateMetadata` computes the duration. Props: `seed`, `colors` (array), `sound`.
7. Verification: run tsc and eslint. Render these frames: 0, first elimination, last 3 balls and finale. The winner in Node must match the last frame of the render.
8. Render the MP4 and send it. In the summary write the seed table, the props, the caption and suggested hashtags.

## Ready-made variants
- **Classic arena:** 12 colors, circular arena, shrinking ring.
- **Spiked ring:** A ball touching the arena wall takes damage. The balls look like they are bumping into each other trying to escape the wall.
- **Growing cannibal:** Reverse rule: the big ball swallows the small one and grows. A single giant ball remains and fills the screen.
- **Team elimination:** 4 colors with 4 balls each. The last team standing wins; the dots at the bottom of the screen are cleared per team.
- **Tournament series:** 4 separate videos are made with the same engine; each seed produces a different winner. In the final video the winners face each other (series content).
