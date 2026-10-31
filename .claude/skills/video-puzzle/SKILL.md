---
name: video-puzzle
description: Produces a satisfying puzzle/solution video such as color sort, water sort, a sorting-algorithm race, a maze, or the 15 puzzle. A real solver finds the moves and the video plays them back. Use when the user asks for a "puzzle", "sorting", "sort", "ball sort", "water sort", "sorting algorithm", "maze", "15 puzzle" or "satisfying solution" video.
argument-hint: "[puzzle type or variant name]"
---

# Puzzle Solution

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` and the `remotion-best-practices` skill.
Reference: `templates/src/BallSort/` (`solver.ts` = shuffle + BFS solver + move timing, `BallSort.tsx` = `calculateMetadata` + drawing).

## Inputs
If the request does not specify them, pick a ready-made variant and state it.
- **Puzzle type** and its rules
- **Counter:** e.g. "Move 7/19"
- **Hook:** e.g. "Don't scroll until it's done 😌"
- **Final text:** e.g. "PERFECT ✨"

## Steps
1. `src/Satisfying/<VideoName>/solver.ts`:
   - The initial state is generated from the seed.
   - A real solver (BFS / A* / the algorithm itself) produces all the moves.
   - The frames per move decrease from start to finish so it speeds up (e.g. 22 → 12 frames).
2. Sweep seeds in Node and pick a default seed whose solution is between 12 and 30 moves. Solver time must be under 1 s.
3. Visuals:
   - Every move animation (lift → move → drop, or pour/slide) is eased.
   - A completed piece glows in its color.
   - The counter is visible, and there is a celebration at the end.
4. Sounds: `switch.wav` at the end of every move, `ding.wav` on a completed piece, `yippee.wav` at the finale.
5. Compute the duration from the solution length with `calculateMetadata`. Make `seed` a prop (so a new puzzle can be generated from Studio).
6. Verification:
   - Run tsc and eslint.
   - Render the start, a mid-move and the final frames and inspect them.
   - Check that the puzzle is actually solved in the last frame.
7. Render the MP4 and send it.

## Ready-made variants
- **Water sort:** Colored liquids are sorted by pouring between tubes. The tube tilts and the liquid level changes as it flows.
- **Algorithm race:** Bubble Sort and Quick Sort sort the same shuffled 40 colored bars side by side. Every comparison makes a click and the counters show the number of comparisons. Hook: "Which one is faster? 🤔"
- **Maze:** In a maze generated from the seed, BFS spreads like a wave (color gradient), then the shortest path is drawn as a neon line.
- **15 puzzle:** A 4×4 sliding tile puzzle is solved with A*. Sorted rows turn green, with confetti at the end.
