# Video Prompt Library

Paste the prompts in this file into Claude Code as they are (in this folder, `promo-templates/`).
Fill in the bracketed fields (`[...]`), or use one of the ready-made variants under each section.

Every prompt refers to the **Shared Rules** in `CLAUDE.md`. Claude loads that file automatically, so the prompts can stay short.

---

## Shared Rules

The shared rules live in **`CLAUDE.md`**. Claude Code loads that file automatically in every session in this folder.
The slash command (skill) versions of the same video types are under `.claude/skills/`: `/video-physics`, `/video-puzzle`,
`/video-cringe`, `/video-relaxing`, `/video-ideas`,
and for wordless videos `/video-multiplier`, `/video-chain`, `/video-color-war`, `/video-fill`, `/video-hypnotic`,
`/video-elimination`, `/video-growth`, `/video-slice`, `/video-machine`, `/video-swarm`.

---

## 1. Satisfying Physics Loop
*Reference: `src/BouncingBall` (a ball that grows on every bounce)*

### Template
```
Follow the Shared Rules in CLAUDE.md. Make a new video of the "satisfying physics loop" type.
Study src/BouncingBall as a reference but don't copy it; build a new mechanic.

Mechanic: [MECHANIC]
Hook (first frame): "[HOOK QUESTION]"
On-screen counter: [COUNTER]
Tension: over time [WHAT GROWS/SHRINKS], and a clear finale moment arrives at about [DURATION] s: [FINALE MOMENT]
Sound: a short click on every collision, a punchy effect at the finale.
Closing CTA: "[CTA]"

Physics must be deterministic and seeded. Sweep the parameters in Node so the finale lands
around [DURATION] s. No boring wait before the finale.
```

### Ready-made variants
- **Splitting ball:** Mechanic: a ball bouncing in a square box splits in two on every wall hit. Counter: "ball count". Finale: at 1000 balls the screen turns into a colorful ocean. Hook: "Can 1 ball become 1000?" CTA: "At which second did it fill up? 👇"
- **Escape the circle:** Mechanic: a spinning circle has a narrow gap; the ball inside speeds up on every hit. Counter: "attempt". Finale: the ball escapes through the gap and the circle shatters. Hook: "Will this ball escape? 😮"
- **Color race (Plinko):** Mechanic: 4 colored marbles race down a course full of pegs; every seed produces a different winner. Counter: a ranking list. Finale: a trophy animation for the winning color. Hook: "Pick your color, then watch 👇" CTA: "Which color did you pick?"
- **Layer-breaking ball:** Mechanic: there are 10 nested rings; the ball thins a ring on every hit and a ring breaks after 3 hits. Counter: "rings left". Finale: when the last ring breaks, the ball is free.

---

## 2. Puzzle Solution
*Reference: `src/BallSort` (sorting colored balls into tubes)*

### Template
```
Follow the Shared Rules in CLAUDE.md. Make a new video of the "satisfying puzzle solution" type.
Reference: src/BallSort (study the solver + calculateMetadata structure).

Puzzle: [PUZZLE]
Generate the starting state from the seed, let a real solver (BFS/A*/algorithm) find the solution and
play every move as an animation. Compute the video duration from the solution length with
calculateMetadata.
Rhythm: the first moves are slow, speeding up towards the end.
A short sound on every move, and a glow plus a ding on every completed part.
Show "[COUNTER]" on screen.
Hook: "[HOOK]"
Finale: "[FINALE TEXT]"

Sweep seeds and pick a default seed whose solution is between 12 and 30 moves.
```

### Ready-made variants
- **Water sort:** Puzzle: sorting colored liquids by pouring them between tubes. In the pour animation the tube tilts and the liquid level changes as it flows. Counter: "Move 7/19". Hook: "Don't scroll until it's done 😌"
- **Algorithm race:** Puzzle: the same 40 shuffled colored bars, sorted side by side by Bubble Sort and Quick Sort. A click on every comparison. Counter: the comparison count for each algorithm. Hook: "Which one is faster? 🤔" Finale: the winning algorithm.
- **Maze:** Puzzle: a maze generated from the seed. First BFS spreads like a wave (color gradient), then the shortest path is drawn with a neon line. Counter: "cells searched". Hook: "How many steps does the computer need to find the exit?"
- **15 puzzle:** Puzzle: a 4×4 sliding tile puzzle, solved with A*. Tiles slide smoothly; sorted rows turn green. Finale: confetti when 1–15 are in order.

---

## 3. Cringe Texting Story
*Reference: `src/CringeChat` (texts meant for your partner go to your boss)*

### Template
```
Follow the Shared Rules in CLAUDE.md. Make a new video of the "cringe texting" type.
Reference: src/CringeChat (Bubble/Typing components, shake, red flash, ending screen).

Hook (pinned at the top): "[HOOK]"
Chat partner (shown in the header; the viewer knows from the start, the character doesn't): [PERSON]
Sent messages (4–6, increasingly embarrassing): [MESSAGES or "you write them"]
Tension: "Seen", then "typing…" appears and disappears twice.
Reply (punchline): "[REPLY]". It arrives with a vine-boom, a shake and a zoom.
Ending screen: "[ENDING]"

Keep the interface generic: no real app logo or name. People are fictional.
Message sounds: whoosh; reply: vine-boom; ending: spongebob-fail or similar. Duration ~20 s.
```

### Ready-made variants
- **Family group:** Hook: "The moment I realized I sent it to the family group 💀". Person: "Family 👨‍👩‍👧 (Mom, Dad, Auntie +4)". Messages: sweet, scheming texts meant for a partner ("my parents are out tonight 🙈"). Reply (Mom): "We're home, sweetie. Your aunt is coming too." Ending: "me right now: 🫠 / Leaving family group…"
- **Rant sent to the teacher:** Person: "Mr. Adams (Math)". Messages: jokes meant for a friend, like "this guy's exam is impossible" and "cheating plan". Reply: "Exam results are out tomorrow. Do you have a plan B?" Ending: "Calculating final grade… 3%".
- **Review sent to HR:** Hook: "The biggest mistake I made after a job interview 💀". Person: "Ms. Carter (HR)". Messages: interview commentary meant for a friend ("I could barely keep a straight face when they said the salary"). Reply: "Thank you for your feedback 🙂 It has been noted." Ending: "Switching LinkedIn to 'Open to work'…"
- **3 AM:** Person: "Ex 🚫". Messages: "you up?", "just curious". A long "typing…", then the reply: "This is my mom's number now." Ending: "Changing number… 📵"

---

## 4. Relaxing Guided Exercise
*Reference: `src/Breathe` (4-4-4-4 box breathing)*

### Template
```
Follow the Shared Rules in CLAUDE.md. Make a new video of the "relaxing guided exercise" type.
Reference: src/Breathe (slow gradient background, drifting particles, breathing orb in the center).

Exercise: [EXERCISE]
Steps and durations: [STEPS]
Hook: "[HOOK]" (any duration in the title must match the real exercise duration)
Visual theme: [THEME, e.g. midnight blue / sunset / forest green]
Closing: "[SAVE CTA]"

Rules: no hard cuts, flashes or loud sound effects. Easing is soft (sine) everywhere.
The end of the video matches the start visually, so the seam is invisible when the platform loops it.
```

### Ready-made variants
- **4-7-8 sleep breathing:** Steps: breathe in for 4 s, hold for 7 s, breathe out for 8 s; 3 rounds. Hook: "Can't sleep? Watch this 🌙". Theme: midnight blue and stars. CTA: "Save it to play before bed."
- **20-20-20 eye break:** Steps: "Look away from the screen, at something 20 feet away", a 20 s countdown (circular progress), then a blinking reminder. Hook: "Tired eyes? Give them 20 seconds 👀". Theme: light green and nature tones.
- **5-4-3-2-1 grounding:** Steps: "See 5 things, touch 4 things, hear 3 sounds, 2 smells, 1 taste", 5 s per step with a number animation. Hook: "Try this technique when you feel anxious". Theme: sunset gradient.
- **30 seconds before an exam:** Steps: 2 rounds of box breathing and a "You're ready 💪" closing. Hook: "30 seconds before your exam". CTA: "Save it for exam day, send it to a friend."

---

## 5. Wordless Videos
*Reference: `src/Wordless/MassMachine` (a single ball multiplies into 1500 balls in waves of color)*

No text on screen at all. The hook is visual and the CTA goes in the post caption. The rules are in `CLAUDE.md` → the **Wordless videos** item.

### Template
```
Follow the Shared Rules in CLAUDE.md and the "Wordless videos" item. Make a wordless video of the [TYPE] type.
Study src/Wordless/MassMachine as a reference (deterministic physics + calculateMetadata).

Mechanism: [WHAT HAPPENS]
Visual hook: on the first frame [WHAT IS ALREADY MOVING], first event within 1 s.
Progression: every 2–3 s [VISIBLE EVENT], over time [WHAT GROWS/SPEEDS UP].
Finale (~[DURATION] s): [CLIMAX THAT FILLS THE SCREEN].
Sound: only soft clicks/switches/dings.
Post caption: "[CAPTION + QUESTION]"
```

### Skills and ready-made variants
- **`/video-multiplier` (multiplier machine):** pendulum press, gate tower, splitting pegs, cell division, spinning funnel.
- **`/video-chain` (chain reaction):** domino spiral, branching domino tree, marble run, domino picture.
- **`/video-color-war` (territory war):** 4-color square arena, marbling war, circle pie, team colors.
- **`/video-fill` (fill and complete):** pixel art reveal, layered sand bottle, perfect packing, heart fill.
- **`/video-hypnotic` (seamless loop):** pendulum wave, ring clock, orbit lock, Lissajous grid.
- **`/video-elimination` (last one standing):** classic arena, spiked ring, growing cannibal, team elimination, tournament series.
- **`/video-growth` (procedural growth):** tree, lightning, snowflake, hidden heart, river delta.
- **`/video-slice` (ASMR slicing and crushing):** layered soap, kinetic sand, hydraulic press, rainbow roll, surprise core.
- **`/video-machine` (order from chaos):** Langton's ant, sandpile, multiple ants, Game of Life, Wolfram rules.
- **`/video-swarm` (particle swarm):** sky flock, galaxy, ocean, seasons, kaleidoscope.

---

## Bonus: New Concept Discovery

```
Follow the Shared Rules in CLAUDE.md. Research this week's TikTok/Reels/Shorts trends on the web
(list the sources). For a general social media account (or the app you are promoting), propose 5 new video
concepts that can be produced with code (no filming needed). For each one: the hook line, a 3-sentence flow,
why it would get a high watch rate, and the production difficulty (easy/medium/hard). Make the video once I pick one.
```

```
Follow the Shared Rules in CLAUDE.md. Produce [N] different seeds/variants of the [VIDEO ID] composition,
render them all under out/series/ and send them as a list (file name, result/summary, duration).
```
