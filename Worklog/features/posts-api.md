# Posts API, Supabase wiring, review page (Feature 2)

## Purpose
Publishing becomes real: Zod validation, one Gemini call for labels (tags,
unit codes, topic, TL;DR, English summary, flag reason), Supabase persistence,
and a human review page. Every external dependency has a mock fallback.

## Files
| Path | Lines (approx) | What |
|------|----------------|------|
| `app/api/posts/route.js` | 1–115 | GET feed data, POST create with Zod + enrich |
| `app/api/review/route.js` | 1–50 | approve/remove flagged posts, never deletes |
| `lib/enrich.js` | 1–150 | Gemini REST call + deterministic mock (unit regex, tag vocab, phone/exam flags) |
| `lib/supabase.js` | 1–15 | server-only client, null when env missing |
| `supabase/schema.sql` | 1–60 | profiles, posts, connect_requests; RLS deny-all |
| `scripts/seed.mjs` | 1–75 | upserts 12 profiles + 40 posts, `npm run seed` |
| `app/review/page.js` | 1–150 | flagged queue with Approve / Remove |
| `components/feed.jsx` | 1–120 | fetches DB posts, seed fallback, For you / Hot / New |
| `components/composer.jsx` | 1–215 | real publish, spinner, mock/persist status notes |

## What we implemented
- POST /api/posts: 400s for bad JSON, empty text, unknown author, >2000 chars; 200 with `mocked`/`persisted` flags otherwise
- Mock enrichment is deterministic: unit codes by regex, tags from the seed vocabulary, phone numbers and exam-material phrases produce `flag_reason`
- TL;DR only over 280 chars, `summary_en` only for non-English, enforced server-side even against model output
- Feed header badge switches "Demo data" / "Live data" by source
- Hot = helpful weighted by recency gravity; New = newest first
- `type: module` added to package.json so `scripts/seed.mjs` can import `lib/seed.js`

## How to test
1. Post from the composer with no keys: mock labels, "Mock AI" badge, session-only note
2. Post text containing a phone number: instant flag, visible in /review
3. With Supabase env set: run SQL editor schema.sql, `npm run seed`, reload, badge says "Live data"

## Depends on
- Optional: `GEMINI_API_KEY` (+ `GEMINI_MODEL` override), `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Out of scope
- Personalize/CV extract (step 3), connect requests (step 4), search (step 5), communities
