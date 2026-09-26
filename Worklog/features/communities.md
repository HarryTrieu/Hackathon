# Unit communities, replies, mentor sign-up (Feature 3)

## Purpose
One community per unit, derived from existing data: a unit exists when posts
mention it or a profile lists it. Users join units and can volunteer as
mentors for a specific unit. Flat replies make every post a small thread.

## Files
| Path | What |
|------|------|
| `lib/communities.js` | Unit directory derived from seed/DB posts + localStorage membership fallback |
| `app/communities/page.js` | Units grouped by course, member/post/mentor counts |
| `app/unit/[code]/page.js` | Unit hub: join, become a mentor, members, posts |
| `app/api/membership/route.js` | join/leave/mentor/unmentor, `unit_members` table |
| `app/api/replies/route.js` | GET by post, POST create, `replies` table |
| `components/replies.jsx` | Flat reply panel with composer, seed fallback |
| `components/post-card.jsx` | Reply button + panel; unit chips link to `/unit/[code]` |
| `lib/seed.js` | 10 demo replies (`REPLIES`, `getSeedReplies`) |
| `supabase/schema.sql` | added `replies` and `unit_members` tables, RLS |
| `scripts/seed.mjs` | also upserts demo replies |

## Decisions
- Directory is derived, not stored: fewer tables, zero admin, always consistent with posts
- Membership is optimistic: localStorage first, then synced to `unit_members`; honest note when sync fails or DB is absent
- Replies are flat, not nested: enough for the demo, half the complexity
- "Mentor" is per-unit, separate from the profile-level mentor role; profile mentors of a unit are shown as baseline mentors

## Gemini fix (same commit)
`gemini-2.0-flash` was retired by Google; default is now `gemini-flash-latest`
(alias, does not expire) with `gemini-flash-lite-latest` retried on 503, and
failures are logged with `console.warn` instead of being silent.

## How to test
1. Nav → Communities, open a unit, Join, then Become a mentor: chip row updates, note explains persistence
2. Open any post's Replies: seed replies show, new reply appears instantly
3. Switch persona: membership is per-persona
