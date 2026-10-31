# Promo Templates

Vertical video templates for social media (TikTok / Reels / Shorts), generated from code. The Remotion project lives in `templates/`.
[Promo Studio](https://github.com/ardasnturk/promo-studio) uses this repo as its template library; it also works on its own with Claude Code.

## Video skills

Every video type is a project skill (`.claude/skills/`). Invoke it with `/skill-name [request]`:

| Command | Video type | Reference code |
|---|---|---|
| `/video-physics` | Satisfying physics loop | `src/BouncingBall` |
| `/video-puzzle` | Puzzle solution | `src/BallSort` |
| `/video-cringe` | Cringe texting story | `src/CringeChat` |
| `/video-relaxing` | Relaxing guided exercise | `src/Breathe` |
| `/video-multiplier` | Wordless: multiplier machine (a mechanism that multiplies balls) | `src/Wordless/MassMachine` |
| `/video-chain` | Wordless: chain reaction (dominoes, marble run) | `src/Wordless/MassMachine` (structure) |
| `/video-color-war` | Wordless: colors fighting over territory | `src/Wordless/MassMachine` (structure) |
| `/video-fill` | Wordless: fill and complete (silhouette, container, pixel art) | `src/Wordless/MassMachine` (structure) |
| `/video-hypnotic` | Wordless: seamless-loop kinetic art | `src/Breathe` (loop) |
| `/video-elimination` | Wordless: last one standing wins (ball elimination) | `src/Wordless/MassMachine` (structure) |
| `/video-growth` | Wordless: a tree, crystal or lightning bolt growing from a single point | `src/Wordless/MassMachine` (structure) |
| `/video-slice` | Wordless: ASMR slicing and crushing | `src/Wordless/MassMachine` (look) |
| `/video-machine` | Wordless: order from chaos (Langton's ant, sandpile) | `src/Wordless/MassMachine` (structure) |
| `/video-swarm` | Wordless: a particle swarm that morphs into shapes | `src/Wordless/MassMachine` (structure) |
| `/video-ideas` | Trend research and new concept proposals | — |

Copy-paste prompt versions of the skills are in `PROMPTS.md`.

## Shared Rules

These rules apply to every video in this project (whether it is made with a skill or from a free-form request):

1. **Project:** `templates/` (Remotion 4).
   - Do not modify existing compositions and files. For a new video, create a `src/<Category>/<VideoName>/` folder.
   - Register the video in `src/Root.tsx` under the matching `<Folder>`.
   - Load and apply the Remotion skills (`remotion-best-practices`, `remotion-markup`).
2. **Format:**
   - 1080×1920, 30 fps, 15–50 s.
   - Safe area: 80px margin on the sides, 100px at the top and bottom.
   - Main headline ≥ 84px, supporting text ≥ 44px.
3. **Fonts:** Use `src/fonts.ts` for Montserrat. If another font is needed, load it with `@remotion/google-fonts` (with the `latin-ext` subset).
   - Write uppercase text directly in the string (for example Turkish `İ`, `Ş`, `Ğ`). Do not use CSS `text-transform`; it breaks locale-specific letters such as `i/İ`.
4. **Hook and ending:**
   - A hook text that sparks curiosity must be visible on the first frame; the first 3 seconds are critical.
   - End with a CTA that asks for a comment, a save or a guess.
5. **Animation:**
   - Use `useCurrentFrame()` and `interpolate()`; do not use CSS animations or transitions.
   - Wrap editable text in `Interactive.Div`; write fixed text inline.
6. **Sound:**
   - Only use effects from the `sfx.md` list in the `remotion-markup` skill (`https://remotion.media/*.wav`).
   - Do not add copyrighted music; music is added on the platform.
7. **Randomness and simulation:**
   - Use the `random(seed)` function from the `remotion` package, and make `seed` a prop.
   - In chaotic physics or game simulations, use only `+ − × ÷` and `Math.sqrt`. `Math.sin`, `cos`, `hypot` and `atan2` are forbidden; write a polynomial approximation if needed. Otherwise Node, the Studio and the render produce different results.
   - Compute the outcome in Node (`npx tsx`) and verify it against the score or counter on a rendered frame.
   - If the duration depends on the content, use `calculateMetadata`.
8. **Real-world facts:**
   - Facts such as event dates, times, venues, scores and line-ups are never written without verifying them on the web; tell me the sources.
   - Do not use official logos or crests; use team colors and an abbreviation badge (`Badge`).
   - Do not attribute made-up events or quotes to real people; in simulations, show players by number.
   - No brand imitation: no pixel-perfect copy of the WhatsApp or iMessage interface, and no logos or names.
9. **Verification:**
    - `npx tsc --noEmit` and `npx eslint src` must pass without errors.
    - Render stills of the key moments: `npx remotion still <Id> <file>.png --frame=<n> --scale=0.4 --port=3100`. The Studio may be running on port 3000, so use 3100.
    - Check the stills for overflowing text, overlaps and readability.
10. **Wordless videos** (`/video-multiplier`, `/video-chain`, `/video-color-war`, `/video-fill`, `/video-hypnotic`, `/video-elimination`, `/video-growth`, `/video-slice`, `/video-machine`, `/video-swarm`):
    In these videos the text sizes in item 2 and the hook and CTA text in item 4 do not apply. Instead:
    - **No text on screen:** No numbers, emoji, logos or watermarks either. The state must be understood through color, quantity and motion alone.
    - **Visual hook:** The system is already in motion on the first frame, and the viewer wonders "where is this going?". The first trigger or multiplication happens within 1 second.
    - **Clean look:** A dark flat background (a light neutral background if the skill allows it), a single mechanism in shades of gray and 6–12 saturated colors. Keep gradients, glow and particle decoration to a minimum; the viewer's eye should focus on one system.
    - **Constant tension:** No idle waiting. A visible event every 2–3 seconds, and events speed up and grow over time. The finale is a clear climax that fills the screen.
    - **Sound:** Only soft, ASMR-friendly effects such as clicks, switches and dings (`mouse-click`, `switch`, `ding`; a quiet `whoosh` on big transitions). No meme sounds.
    - **Loop:** If possible, make the last frame close to the first, or end on a hard finale; when the platform replays the video, watch time goes up.
    - **Caption:** The hook and CTA go in the post caption, not in the video. On delivery, suggest a one-line caption (like "How many balls do you think it ended with? 👇") and 3–5 hashtags.
    - Location: `src/Wordless/<VideoName>/`, in Root under `<Folder name="Wordless">`.
11. **Delivery:**
    - Render with `npx remotion render <Id> out/<name>.mp4 --port=3100` and send me the MP4.
    - Write a short summary: concept, duration, props editable from the Studio, and known limitations.
