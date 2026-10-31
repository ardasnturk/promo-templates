# Promo Templates

**English** · [Türkçe](README.tr.md)

Vertical video templates for social media (TikTok / Reels / Shorts) that are **generated from code** (1080×1920, 30 fps).
Videos are written as React components with [Remotion](https://www.remotion.dev); no filming needed. Every template
type is a Claude Code skill: you write a request, Claude codes a new video, checks it and renders it.

[Promo Studio](https://github.com/ardasnturk/promo-studio) uses this repo as its template library (finding ideas,
producing with skills, sharing and update checks). It also works on its own, with nothing but Claude Code.

## Install

```bash
git clone https://github.com/ardasnturk/promo-templates.git
cd promo-templates
npx remotion skills add          # Remotion's official agent skills (.agents/skills)
cd templates
npm install
npx remotion studio
```

The Studio opens at http://localhost:3000. To get an MP4, use the **Render** button in the Studio, or:

```bash
npx remotion render <CompositionId> out/<name>.mp4
```

Render output (`out/`) is not committed to git.

**With Promo Studio:** Promo Studio → sidebar → **Templates → Add library…** and pick this folder. If no library is
connected, Promo Studio offers to set one up, and it tells you about new releases.

## Templates

| Folder (Studio) | Composition | Description | Code |
|---|---|---|---|
| Satisfying | `BouncingBall` | A ball that grows on every bounce tries to fill the circle | `src/BouncingBall` |
| Satisfying | `BallSort` | Colored balls get sorted into tubes (BFS solver, `seed` prop) | `src/BallSort` |
| Satisfying | `FifteenPuzzle` | A 15 puzzle solved with the shortest solution (`seed` prop) | `src/Satisfying/FifteenPuzzle` |
| Wordless | `MassMachine` | No text: a pendulum machine that multiplies balls (`seed`, `maxBalls` props) | `src/Wordless/MassMachine` |
| Relaxing | `Breathe` | 4-4-4-4 box breathing | `src/Breathe` |
| Cringe | `CringeChat` | Texts meant for your partner go to your boss | `src/CringeChat` |

## Making new videos with Claude Code

When you open Claude Code in this folder, `CLAUDE.md` (the shared rules) is loaded automatically. Commands:

| Command | What it makes |
|---|---|
| `/video-physics [mechanic]` | Satisfying physics loop |
| `/video-puzzle [puzzle]` | Puzzle solution (with a real solver) |
| `/video-cringe [scenario]` | Cringe texting story |
| `/video-relaxing [exercise]` | Relaxing guided exercise |
| `/video-multiplier`, `/video-chain`, `/video-color-war`, `/video-fill`, `/video-hypnotic`, `/video-elimination`, `/video-growth`, `/video-slice`, `/video-machine`, `/video-swarm` | Wordless videos (see `CLAUDE.md` item 10) |
| `/video-ideas [focus]` | Trend research and new concept proposals |

Example: `/video-puzzle ball sort with 8 tubes, hard level`

If you prefer copy-paste over commands, the same content is in `PROMPTS.md`.

## Templates for your own app

For patterns specific to one app (brand colors, logo, intro animation), create `src/<AppName>/` and
`public/<appname>/` folders (for example `src/Acme/` and `public/acme/`). If Promo Studio has a project with the same
name, Claude reads this folder as the brand kit when it writes a promo film. Keeping personal or confidential brand
assets in your own (private) fork is recommended.

## Notes

- Sound effects are downloaded from `https://remotion.media/` during rendering, so an internet connection is required. Music is added on the platform.
- Simulations are deterministic: the same `seed` gives the same result in the Studio and in the render.
- Releases are published on GitHub Releases; the version number is the `version` field in `templates/package.json`.

## Contributing

New templates and skills are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT (see `LICENSE`). Remotion, which the templates use, has its own license: it is free for individuals, non-profits
and companies with up to 3 employees; larger companies need a company license
(https://www.remotion.dev/license).
