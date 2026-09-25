# Feed, persona switcher, ranking (Feature 1)

## Purpose
Show the right seeded advice to the right persona with an explainable reason line, fully offline.

## User workflow
1. Open Home → "For you" tab, composer on top, ranked post cards below
2. Read a long post → "Show more" expands; "AI summary" box gives the TL;DR
3. Vietnamese post → "English summary · AI-generated" box underneath
4. Switch persona (left nav card, or bottom nav → profile on mobile) → feed re-ranks
5. "Popular" tab → same cards ordered by Helpful count, no reason lines
6. Scroll to the end → "You're all caught up" (no infinite scroll, by design)

## Files and responsibilities
- `components/feed.jsx` — tabs, skeleton-on-switch, caught-up state
- `components/post-card.jsx` — card UI; local Helpful/Save toggles
- `lib/rank.js` — scoring + reason line (priority: goal > unit > skill > course > role)
- `lib/seed.js` — data source until Supabase lands in step 2

## Data flow and dependencies
Seed arrays → `rankForYou(POSTS, persona)` in the client → rendered list. Persona lives in React context (`lib/persona-context.jsx`), resets on full page reload. No env vars, no network.

## How to test
1. `npm run dev`, open localhost:3000
2. Minh (IT Y1): internship/beginner posts on top. Duc (CS Y3 mentor): mentee questions rise
3. Check flagged posts (Aisha's notes-for-sale, Chris's exam questions) show the badge but stay visible

## Out of scope
- Publishing posts, CV extraction, connect requests, search (build steps 2–5)
