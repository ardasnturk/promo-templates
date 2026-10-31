---
name: video-multiplier
description: Produces a wordless "multiplier machine" video; a mechanism multiplies balls exponentially and every generation switches to a new color (pendulum press, ×2 gates, splitting pegs, cell division). A single ball turns into an ocean that fills the screen. Use when the user asks for "multiplying balls", "mass effect", "multiplier", "ball multiplication", "wordless satisfying", "no-text satisfying" or "turn 1 ball into 1000" videos.
argument-hint: "[mechanism or variant name] — if left empty, a variant is picked"
---

# Wordless Multiplier Machine

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**) and the `remotion-best-practices` skill.
Reference: `templates/src/Wordless/MassMachine/` (simulation `simulate.ts`, visuals `MassMachine.tsx`). In a new variant, change the mechanism; the physics skeleton (grid-based ball collision, contact with a rotating body, `calculateMetadata`) can stay the same.

## The core of the formula
- **Start:** 1 ball and a gray machine already in motion. The first multiplication comes within 1 second.
- **Generation = color:** Each multiplication wave switches to a single new color. The viewer reads the count from the color waves; there are no numbers on screen.
- **Exponential growth:** A wave comes every 2 seconds and the ball count doubles or triples. It reaches the cap (1000–1500 balls) in 20–30 seconds.
- **Finale:** An ocean of color filling the screen and a single `ding`. After reaching the cap, wait 2 seconds and end.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state your choice in one sentence.
- **Mechanism:** What triggers the multiplication?
- **Multiplier:** ×2 or ×3 per trigger.
- **Cap:** Ball count (prop, default 1000–1500).
- **Caption:** something like "How many balls do you think it ended with? 👇".

## Steps
1. Write `src/Wordless/<VideoName>/simulate.ts`.
   - Seeded and deterministic. Use only `+ − × ÷` and `Math.sqrt`; for rotating parts use polynomial sin/cos (`sinA`/`cosA` in the reference).
2. **For clean color waves, base the trigger on the event, not on contact.** The lesson from the reference: a rule like "a ball that touches the box splits" is not enough, because the box always pushes the same front balls, never touches the ones behind, and growth stalls. Instead:
   - Tie the multiplication to a specific moment (press moment, passing a gate, dropping into a slot). At that moment all *previous-generation* balls in the zone multiply.
   - Spread a wave over several frames (give a per-frame budget). That way the pile swells instead of exploding in a single frame.
   - If no ball multiplied, do not skip the color; retry with the same generation.
3. Run the simulation in Node (`npx tsx`) with at least 4 seeds and report every wave (second, generation, balls born). Targets: first wave < 1 s, gap between waves ≤ 3 s, cap at 18–30 s. If they are not met, diagnose the cause (contact coverage, energy loss, pile jamming). Do not turn parameters blindly.
4. Visuals:
   - `#0B0D18` background, thin light-gray arena line, gray metal machine (edge highlight and 2–3 dark details).
   - Balls are flat colored; no glow.
   - At the press or trigger moment, the machine edge briefly lights up in the new generation's color.
   - Color palette: 12 saturated colors. When it cycles, the starting color must not come back.
5. Sound: `switch.wav` on every wave, `ding.wav` when the cap is reached.
6. Register the composition under `<Folder name="Wordless">`; `calculateMetadata` computes the duration from the simulation. Props: `seed`, `maxBalls`, `sound`.
7. Verification: run tsc and eslint. Render and inspect these frames: 0, first wave, middle, cap and last frame. The cap frame in Node must match the cap frame in the render.
8. Render the MP4 and send it. In the summary include: the wave table, the Studio props, the caption and suggested hashtags.

## Ready-made variants
- **Pendulum press** (reference): An arm hanging from the center drags a box along the floor, pushing the pile to one side. When the box stops at the end, the old balls next to it become ×3.
- **Gate tower:** Balls pour from the top and pass through horizontally sliding gates. At a gate the ball changes color and splits in 2. The gate's value is shown not with text but with 2 or 3 notches on top. The bin at the bottom fills up and overflows.
- **Splitting pegs:** A Plinko-like course. A ball hitting a gray peg splits only once (one generation per peg). The rain of balls coming down gets denser and denser.
- **Cell division:** In a round petri dish, droplets grow and split in two. Each generation is a new color and the dish fills completely (no hard physics; push-pull forces are enough).
- **Rotating funnel:** In the middle is a slowly rotating funnel with two mouths. A ball entering the funnel comes out of the other mouth as 2 balls; as the funnel speeds up, the flow speeds up too.
