# Contributing to Promo Templates

Thanks for helping! Promo Templates is a small library of Remotion video
templates and the Claude Code skills that produce them. Reading this first
saves everyone a review round.

## Ground rules

* **Everything is code.** Templates render from React components; no stock
  footage, no copyrighted music, no official logos or app UI copies (see
  `CLAUDE.md`, item 8).
* **Renders are deterministic.** All randomness goes through `random(seed)`
  from `remotion`, and `seed` is a prop. Physics and game simulations use only
  `+ − × ÷` and `Math.sqrt` so Node, the Studio and the render agree
  (`CLAUDE.md`, item 7).
* **Keep the repo neutral.** No personal brands, real people or private assets.
  Use neutral examples such as "Acme"; brand kits belong in your own fork.
* **No generated renders in git.** `out/`, MP4s and stills stay local.

## Getting started

```sh
git clone https://github.com/ardasnturk/promo-templates.git && cd promo-templates
npx remotion skills add          # Remotion's official agent skills
cd templates && npm install
npx remotion studio              # http://localhost:3000
```

| Path | What |
|---|---|
| `templates/src/` | Compositions, one folder per template; registered in `src/Root.tsx` |
| `.claude/skills/` | One Claude Code skill per video type (`/video-…`) |
| `CLAUDE.md` | Shared rules every video follows |
| `PROMPTS.md` | Copy-paste prompt versions of the skills |

## Adding a template

1. Create `templates/src/<Category>/<VideoName>/` and register the composition
   in `src/Root.tsx` under the matching `<Folder>`. Do not change existing
   composition IDs; Promo Studio and existing projects refer to them.
2. Follow `CLAUDE.md`: 1080×1920, 30 fps, safe area, hook on the first frame,
   `useCurrentFrame()` + `interpolate()` instead of CSS animation.
3. Expose the useful knobs as props with a Zod schema (at least `seed` for
   anything random), and use `calculateMetadata` when the duration depends on
   the content.
4. Add a row to the templates table in `README.md` (and `README.tr.md` if you
   can).

## Adding a skill

1. Add `.claude/skills/video-<name>/SKILL.md` with an English, kebab-case name
   and a clear `description` so Claude knows when to use it.
2. Point it at a reference composition and at the shared rules in `CLAUDE.md`
   instead of repeating them.
3. List the command in `CLAUDE.md`, `README.md` and `PROMPTS.md`.

## Checks

Run these in `templates/` before opening a PR:

```sh
npx tsc --noEmit
npx eslint src
npx remotion still <Id> out/check.png --frame=<n> --scale=0.4
```

Look at a few stills from the key moments for overflowing text, overlaps and
readability.

## Pull requests

1. Open an issue for anything bigger than a fix, so we can agree on the
   approach first.
2. Keep PRs focused; one template or skill per PR.
3. Describe what you changed and how you checked it (a short screen recording
   or a few stills help).

By contributing you agree that your contribution is licensed under the
[MIT License](LICENSE).
