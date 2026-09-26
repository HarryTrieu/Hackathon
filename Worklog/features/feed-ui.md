# Feed UI + seed + persona ranking (Feature 1)

## Purpose
X-style distraction-free feed over seeded demo data. Persona switcher stands in
for auth; ranking and reason lines are plain tag-overlap code, no AI calls yet.

## Files
| Path | Lines (approx) | What |
|------|----------------|------|
| `lib/seed.js` | 1–780 | 12 profiles, 40 posts (4 vi + summary_en, 6 tldr, 2 flagged) |
| `lib/rank.js` | 1–100 | rankForYou (score + reason), rankPopular, trendingTags, suggestedMentors |
| `lib/persona-context.jsx` | 1–20 | personaId state, default p7 (Minh, IT Y1) |
| `components/feed.jsx` | 1–110 | Tabs, composer, skeleton on persona switch, caught-up end |
| `components/post-card.jsx` | 1–190 | Full post card incl. AI summary / English summary boxes |
| `app/profile/[id]/page.js` | 1–200 | Header badges + Posts / Path tabs |

## What we implemented
- Ranking: goals ×3, skills ×2, unit match +3, course match +2.5, mentor/mentee cross-bonus, helpful + recency tiebreaks
- Reason line mirrors strongest signal ("Because your goal is internship" > unit > skill > course)
- Popular tab = helpful_count desc, no personalisation
- Flagged posts show a badge only (never hidden), reason in title tooltip
- Composer is visual only; Ask the author disabled (steps 2 and 4)

## How to test
1. `npm run dev` in `e:\Hackathon\sodu`, open localhost:3000
2. Switch persona Minh → Duc: feed order and reasons change
3. Open /profile/p1 → Path tab; /profile/badid → 404 page

## Depends on
- Nothing external. Fully offline.

## Out of scope
- POST /api/posts (step 2), CV extract (3), connect_requests (4), search (5)
