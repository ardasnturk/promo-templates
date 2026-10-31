---
name: video-relaxing
description: Produces a calm, loopable guided relaxation exercise video such as a breathing exercise (box breathing, 4-7-8), an eye break, or a grounding technique. Use when the user asks for a "relaxing", "calming", "breathing", "breathwork", "meditation", "mindfulness", "eye break" or "grounding" video.
argument-hint: "[exercise or variant name]"
---

# Relaxing Guided Exercise

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` and the `remotion-best-practices` skill.
Reference: `templates/src/Breathe/Breathe.tsx` (slow gradient background, drifting particles, breathing orb in the center, phase label and countdown).

## Inputs
If the request does not specify them, pick a ready-made variant and state it.
- **Exercise** and its steps (duration of each step)
- **Hook:** the duration in the title must match the actual exercise length (if it says "in 30 seconds", it really is ~30 s).
- **Visual theme:** midnight blue, sunset, forest green…
- **Closing:** a save CTA ("Save this for when you need it").

## Rules
- No hard cuts, flashes, shakes or loud sound effects. Easing is soft everywhere (`Easing.inOut(Easing.sin)`).
- The end of the video must be in the same visual state as the start, so the seam is invisible when the platform loops it.
- Do not make health claims ("cures anxiety"); use language like "may help you relax".

## Steps
1. Under `src/Relaxing/<VideoName>/`, define the phase table (name, duration) as a single array. The current phase and remaining time are computed from this array.
2. Visual elements:
   - The central object grows and shrinks or fills according to the phase.
   - The phase name and countdown are visible.
   - The background color shifts very slowly.
   - Particles are deterministic (`random()`).
3. Register the composition under `<Folder name="Relaxing">`.
4. Verification:
   - Run tsc and eslint.
   - Render one frame from each phase plus the first/last frames; check that the first and last frames are similar.
5. Render the MP4 and send it. Remind the user that ambient music should be added on the platform.

## Ready-made variants
- **4-7-8 sleep breathing:** Breathe in for 4 s, hold for 7 s, breathe out for 8 s; 3 rounds. Hook: "Can't sleep? Watch this 🌙". Theme: midnight blue and stars.
- **20-20-20 eye break:** "Look away from the screen, at something 20 feet (6 m) away" and a 20 s circular countdown, then a blink reminder. Hook: "Tired eyes? Give them 20 seconds 👀". Theme: light green.
- **5-4-3-2-1 grounding:** See 5 things, touch 4 things, hear 3 sounds, 2 smells, 1 taste; each step 5 s with an animated number. Hook: "Try this technique when you feel anxious". Theme: sunset.
- **30 seconds before an exam:** 2 rounds of box breathing and a "You've got this 💪" closing. CTA: "Save it for exam day and send it to a friend."
