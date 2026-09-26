# Feed, persona switcher, ranking (Feature 1)

## Purpose
Show the right seeded advice to the right persona with an explainable reason line, fully offline.

## User workflow
1. Open Home, "For you" tab, composer on top, ranked post cards below
2. Read a long post, "Show more" expands, the "AI summary" box gives the TL;DR
3. Switch persona (left nav card, or bottom nav on mobile) and the feed re-ranks with new reason lines
4. "Popular" tab shows the same cards ordered by Helpful count, no reason lines
5. Scroll to the end for "You're all caught up" (no infinite scroll, by design)

## Files and responsibilities
- `components/feed.jsx` owns the tabs and the caught-up state
- `components/post-card.jsx` owns card UI and the local Helpful/Save toggles
- `lib/rank.js` owns scoring and the reason line (priority: goal, unit, skill, course, role)
- `lib/seed.js` is the data source until Supabase lands in step 2

## Data flow and dependencies
Seed arrays go through `rankForYou(POSTS, persona)` in the client and render as a list.
Persona lives in React context (`lib/persona-context.jsx`) and resets on a full page
reload. No env vars, no network.

## How to test
1. `npm run dev`, open localhost:3000
2. Minh (IT Y1) puts internship and beginner posts on top. Duc (CS Y3 mentor) lifts mentee questions
3. Flagged posts (Aisha's notes-for-sale, Chris's exam questions) show the badge but stay visible

## Notes
- Seed text is English only. `lang` and `summary_en` remain in the schema so a live
  post written in another language still gets an AI English summary.
- The artificial 350ms skeleton on persona switch was removed; a 500ms fade plus the
  changed reason lines communicate the re-rank without faking a loading state.

## Out of scope
- Publishing posts, CV extraction, connect requests, search (build steps 2 to 5)
