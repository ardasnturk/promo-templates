---
name: video-ideas
description: Researches current TikTok/Reels/Shorts trends on the web and proposes new video concepts that can be produced in code (no filming needed); then produces the chosen concept with the matching video skill. Use when the user says "new idea", "video ideas", "trends", "what's trending", "what should we post", "content ideas" or "suggest a concept".
argument-hint: "[focus: general / app name / a specific topic]"
---

# New Video Concept Discovery

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md`.

## Steps
1. Research this week's/month's short-video trends on the web (formats, sounds, meme templates, current events). Give the sources as links; note that marketing blogs have limited reliability.
2. Propose **5 concepts** that can be produced in code (no filming needed). If the focus is an app or brand, at least 3 of them should relate to it. For each concept:
   - Hook line (first frame)
   - A 3-sentence flow
   - Why it would get a high watch, comment or save rate
   - Which video type/skill it builds on (`/video-physics`, `/video-puzzle`, `/video-cringe`, `/video-relaxing`, wordless: `/video-multiplier`, `/video-chain`, `/video-color-war`, `/video-fill`, `/video-hypnotic`, `/video-elimination`, `/video-growth`, `/video-slice`, `/video-machine`, `/video-swarm`) or whether it is completely new
   - Production difficulty (easy / medium / hard)
3. Do not re-propose an idea that already exists among the videos in the project repository (look under `templates/src/`).
4. When the user picks a concept, produce the video by following the steps of the matching skill. Do not start production before a choice is made.
