---
name: video-hypnotic
description: Produces a wordless, perfectly looping kinetic art video such as a pendulum wave, aligning rotating rings, rhythmic orbits, or Lissajous patterns. When the video ends it loops back to the start seamlessly. Use when the user asks for a "hypnotic", "loop", "perfect loop", "seamless loop", "pendulum wave", "kinetic art" or "oddly satisfying geometry" video.
argument-hint: "[pattern or variant name]"
---

# Wordless Hypnotic Loop

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` (especially item 10, **Wordless videos**) and the `remotion-best-practices` skill.
Reference: `templates/src/Breathe/` (soft easing, loop-friendly ending). This skill produces closed-form animation, not a physics simulation.

## The core of the formula
- **Closed form:** Each object's position is computed directly with `f(frame)`. There is no chaos, so `Math.sin` and `Math.cos` are allowed (the ban in CLAUDE.md applies only to chaotic simulations).
- **Hidden order:** The objects look disordered at first. At certain moments they all align in a line, a star or a wave, and the viewer catches the "wait… now!" moment.
- **Perfect loop:** All frequencies divide the video length exactly. Last frame + 1 = first frame; when the platform replays it the seam is invisible and watch time multiplies.
- **Satisfaction points:** At alignment moments there is a sound and a short flash. There are 3–5 distinct alignments over the loop.

## Inputs
If the request does not specify them, pick one of the ready-made variants and state it.
- **Pattern**
- **Object count:** 12–40
- **Loop length:** 15–30 s (common period)
- **Palette:** Rainbow gradient, shades of a single color, or two contrasting colors
- **Caption:** "How many times did you watch it? 🔁" or "Catch the moment it lines up 👀".

## Steps
1. Under `src/Wordless/<VideoName>/`, define the periods as integer ratios.
   - Example pendulum wave: `N` pendulums, loop length `T` frames, pendulum `i` makes `K + i` full swings per loop → `angle_i = A * cos(2π (K + i) frame / T)`.
2. Verify the loop: in Node compute all positions for `frame = 0` and `frame = T` and show that the difference is < 0.01 px. List the alignment moments (frames where all phases coincide).
3. Visuals:
   - Dark flat background; objects are flat colored circles, lines or rings.
   - A short trail (semi-transparent copies of the last 6–10 frames) may be used. The trail must also be continuous at the start of the loop: compute the trail frame with `(frame - k + T) % T`.
   - The camera stays fixed; the only motion is the pattern itself.
4. Sound: play `mouse-click.wav` when each object crosses the center line or a ring aligns. If that is too frequent, use `switch.wav` only at alignment moments. The sound timing must also fit the loop (no sound cut off between the last frame and the first frame).
5. Register under `<Folder name="Wordless">`; duration = `T` (loop length). Props: `count`, `loopSeconds`, `palette`, `sound`.
6. Verification: run tsc and eslint. Render frames 0, `T-1` and the alignment frames. Between 0 and `T-1` there should be a one-step difference; no jump.
7. Render the MP4 and send it. In the summary write the alignment moments, the props, and the caption with suggested hashtags.

## Ready-made variants
- **Pendulum wave:** 24 colored balls swing side by side. They first form a snake, then two and three lines, and at the end of the loop they meet in a single line again.
- **Ring clock:** 20 nested rings each have a gap and rotate at different speeds. At certain moments the gaps form a vertical corridor, a ball drops to the center and the loop starts over.
- **Orbit lock:** 12 points rotate around the center at 1:2:3… ratios. The lines between them draw a flower pattern, and at every alignment the pattern simplifies into a star.
- **Lissajous grid:** In each of the 6×6 cells a curve with a different frequency ratio is drawn. They all close at the same time at the end of the loop.
