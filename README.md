<p align="center"><img src="docs/icon.png" width="128" height="128" alt="Promo Templates icon"></p>

<h1 align="center">Promo Templates</h1>

<p align="center">Vertical videos <b>generated from code</b>, and the <b>Claude Code skills</b> that make new ones.</p>

<p align="center">
  <a href="https://github.com/ardasnturk/promo-templates/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/ardasnturk/promo-templates?label=release"></a>
  <img alt="Remotion 4" src="https://img.shields.io/badge/Remotion-4-blue">
  <img alt="Format" src="https://img.shields.io/badge/format-1080%C3%971920%20%C2%B7%2030%20fps-blueviolet">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-green"></a>
</p>

<p align="center"><a href="https://github.com/ardasnturk/promo-studio">Promo Studio</a> · <b>English</b> · <a href="README.tr.md">Türkçe</a></p>

> **Promo Templates is built with Remotion and Claude Code.** It is an
> independent open-source project and is **not affiliated with, endorsed by or
> sponsored by Remotion or Anthropic**. Remotion has its own license (see
> [License](#license)).

Promo Templates is a [Remotion](https://www.remotion.dev) project of short
vertical videos for TikTok, Reels and Shorts — physics loops, puzzles, wordless
machines, relaxing exercises and chat stories — written as React components, so
nothing is filmed. Every kind of video is also a **Claude Code skill**: you
write a request, Claude codes a new video, checks it and renders it.

It works on its own with Claude Code, and it is the template library of
[Promo Studio](https://github.com/ardasnturk/promo-studio), which installs it,
keeps it up to date, finds ideas and posts the videos.

## Features

* **Code, not footage** — every frame comes from React and `useCurrentFrame()`;
  change a prop and render again.
* **Real simulations** — puzzles are solved by real solvers (BFS, A*), physics
  is simulated, and the same `seed` gives the same video in the Studio and in
  the render.
* **15 skills** — `/video-physics`, `/video-puzzle`, `/video-cringe`,
  `/video-relaxing`, ten wordless formats and `/video-ideas` for trend research.
* **Shared rules** — `CLAUDE.md` keeps every video in the same format: safe
  areas, hook and ending, sound, verified facts, a check before rendering.
* **Your brand** — add `src/<YourApp>/` and Promo Studio uses it as the brand
  kit of your promo films.

## Contents

* [Quick start](#quick-start)
* [Templates](#templates)
* [Making new videos with Claude Code](#making-new-videos-with-claude-code)
* [With Promo Studio](#with-promo-studio)
* [Templates for your own app](#templates-for-your-own-app)
* [Notes](#notes)
* [Contributing](#contributing)
* [License](#license)

## Quick start

```sh
git clone https://github.com/ardasnturk/promo-templates.git && cd promo-templates
npx remotion skills add          # Remotion's official agent skills (.agents/skills)
cd templates && npm install
npx remotion studio              # opens http://localhost:3000
```

To get an MP4, use **Render** in the Studio, or:

```sh
npx remotion render <CompositionId> out/<name>.mp4
```

Render output (`out/`) is not committed. You need Node.js 20 or later; for the
skills, [Claude Code](https://claude.com/claude-code) signed in with your own
account.

## Templates

| Folder (Studio) | Composition | What you see | Code |
|---|---|---|---|
| Satisfying | `BouncingBall` | A ball that grows on every bounce tries to fill the circle | `src/BouncingBall` |
| Satisfying | `BallSort` | Colored balls get sorted into tubes (BFS solver, `seed` prop) | `src/BallSort` |
| Satisfying | `FifteenPuzzle` | A 15 puzzle solved in the fewest moves (A*, `seed` prop) | `src/Satisfying/FifteenPuzzle` |
| Wordless | `MassMachine` | No text: a pendulum machine that multiplies balls (`seed`, `maxBalls`) | `src/Wordless/MassMachine` |
| Relaxing | `Breathe` | 4-4-4-4 box breathing | `src/Breathe` |
| Cringe | `CringeChat` | Texts meant for your partner go to your boss | `src/CringeChat` |

## Making new videos with Claude Code

Open Claude Code in this folder; `CLAUDE.md` (the shared rules) loads
automatically. Then:

| Command | What it makes |
|---|---|
| `/video-physics [mechanic]` | Satisfying physics loop |
| `/video-puzzle [puzzle]` | Puzzle solution, with a real solver |
| `/video-cringe [scenario]` | Cringe texting story |
| `/video-relaxing [exercise]` | Relaxing guided exercise |
| `/video-multiplier`, `/video-chain`, `/video-color-war`, `/video-fill`, `/video-hypnotic`, `/video-elimination`, `/video-growth`, `/video-slice`, `/video-machine`, `/video-swarm` | Wordless videos (`CLAUDE.md` item 10) |
| `/video-ideas [focus]` | Trend research and new concepts |

Example: `/video-puzzle ball sort with 8 tubes, hard level`

Claude writes the composition, type-checks it, renders stills to check the
frames and then the video. Prefer copy-paste? The same prompts are in
[PROMPTS.md](PROMPTS.md).

## With Promo Studio

[Promo Studio](https://github.com/ardasnturk/promo-studio) offers to install
this library on first launch (or **Templates → Add Library…** for an existing
clone). In the library screen you can:

* **Generate…** — pick a skill and write a request; Promo Studio runs Claude
  Code here, imports the rendered video and writes a caption.
* **Research Trends** — `/video-ideas` proposes concepts; **Generate This**
  starts the matching skill.
* **Render again** with changed props, without Claude.
* **Update** — Promo Studio compares your copy with the latest release and
  updates it with git when it has no local changes.

## Templates for your own app

For patterns specific to one app (brand colors, logo, intro animation), add
`src/<AppName>/` and `public/<appname>/` (for example `src/Acme/` and
`public/acme/`). If Promo Studio has a project with the same name, Claude reads
this folder as the brand kit when it writes a promo film. Keep personal or
confidential brand assets in your own private fork.

## Notes

* Sound effects are downloaded from `https://remotion.media/` while rendering,
  so rendering needs an internet connection. Music is added on the platform.
* Simulations are deterministic: the same `seed` gives the same result in the
  Studio and in the render.
* Releases are published on GitHub Releases; the version is the `version`
  field of `templates/package.json`.

## Contributing

New templates and skills are welcome — please read
[CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

[MIT](LICENSE) © 2026 Arda Şentürk. The templates use
[Remotion](https://www.remotion.dev), which has its own license: free for
individuals, non-profits and companies with up to 3 employees; larger companies
need a [company license](https://www.remotion.dev/license).

"Claude" and "Claude Code" are trademarks of Anthropic, PBC; "Remotion" of
Remotion AG; "TikTok", "Instagram" and "YouTube" of their owners. They are used
here only to describe compatibility.
