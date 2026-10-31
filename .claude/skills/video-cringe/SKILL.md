---
name: video-cringe
description: Produces a cringe/embarrassment-themed fake text-message story video (messages sent to the wrong person, "Seen" and "typing…" suspense, and a punchline reply). Use when the user asks for a "cringe" video, "texting the wrong person", "wrong chat", a "text message story", "chat story", "fake chat" or "chat video".
argument-hint: "[scenario or variant name]"
---

# Cringe Text-Message Story

Request: $ARGUMENTS

First apply the **Shared Rules** in `CLAUDE.md` and the `remotion-best-practices` skill.
Reference: `templates/src/CringeChat/` (`Bubble.tsx` = bubble + typing indicator, `CringeChat.tsx` = shake, red flash, final screen, sound timing).

## Inputs
If the request does not specify them, pick a ready-made variant or write a new scenario. Write the on-screen text in English by default; use another language if the user asks for one.
- **Hook (pinned at the top):** e.g. "The moment I realized who I sent it to 💀"
- **Chat partner:** Shown in the chat header. The viewer knows from the start, the character doesn't (dramatic irony).
- **Sent messages:** 4–6 of them, increasingly embarrassing.
- **Reply (punchline):** short, dry, scary or funny.
- **Final screen:** "me right now:" + emoji + a fake progress bar ("… in progress").

## Rules
- Keep the UI generic: do not use WhatsApp, iMessage, etc. logos, names or a one-to-one copy of their design.
- People must be fictional. Do not attribute messages or quotes to real celebrities or real people.
- Keep the humor clean: no sexual content, hate or bullying.

## Steps
1. Under `src/Cringe/<VideoName>/`, reuse (import) the `Bubble`/`Typing` components from the reference, or extend them to fit the variant. Write each message as a separate JSX node with an `appearAt` second.
2. Timing (~20 s):
   - Messages arrive ~1.6 s apart.
   - Then "Seen" (with the record-scratch sound).
   - "typing…" appears, disappears, and appears again (suspense).
   - The reply arrives: vine-boom, shake, zoom and red vignette.
   - Finally the final screen (spongebob-fail or similar).
3. Message sound: `whoosh.wav` (low volume).
4. Register the composition under `<Folder name="Cringe">`.
5. Verification:
   - Run tsc and eslint.
   - Render the frame where all messages are visible, the reply frame and the final frame.
   - Check that the bubbles fit on screen and that the header and the hook do not overlap.
6. Render the MP4 and send it.

## Ready-made variants
- **Family group:** Contact: "Family 👨‍👩‍👧 (Mom, Dad, Aunt +4)". Messages: sweet plans meant for a partner ("my parents are out tonight 🙈"). Reply (Mom): "We're home, sweetie. Your aunt is coming too." Final: "Leaving family group…"
- **Rant to the teacher:** Contact: "Mr. Miller (Math)". Messages: a rant about the exam meant for a friend. Reply: "Exam results come out tomorrow. Do you have a plan B?" Final: "Calculating final grade… 3%"
- **Comment to HR:** Hook: "The biggest mistake I made after a job interview 💀". Contact: "Sarah (HR)". Reply: "Thank you for your feedback 🙂 It has been noted." Final: "Switching LinkedIn to 'Open to work'…"
- **3 AM:** Contact: "Ex 🚫". Messages: "you up?", "just wondering". After a long "typing…", the reply: "This number belongs to my mom now." Final: "Changing phone number… 📵"
