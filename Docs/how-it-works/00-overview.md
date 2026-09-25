# How The App Works

> Product behaviour for humans + Agent. No secrets. Code is source of truth; this is the flow map.
> Short implementation history lives in `/Worklog/` (not under Docs).

## User Flow

1. User opens Sodu → Home shows the "For you" feed for the active demo persona (default: Minh, IT Year 1 mentee)
2. Each post card shows: author badges (Mentor, course · year, verified), original text (clamped at 4 lines), an "AI summary" TL;DR box on long posts, an English summary under Vietnamese posts, tag chips, a reason line ("Because your goal is internship"), and Helpful / Save / Ask-the-author actions
3. Switching persona in the left-nav card re-ranks the feed client-side (brief skeleton, then new order + reasons). No requests leave the browser in Feature 1 — everything is seeded data

## Server Workflow

1. No API routes yet. Feature 1 is static/client only
2. Ranking is plain code in `lib/rank.js`: goal overlap ×3, skill overlap ×2, shared unit code +3, same course +2.5, mentor↔mentee cross-bonus +1.5, small helpful/recency tiebreaks
3. The reason line always mirrors the highest-scoring signal, so the UI never claims a match the score didn't use
4. Flagged posts (2 in seed) render a "Flagged for review" badge with the reason in the tooltip; they are never hidden or deleted
5. From build step 2: POST /api/posts adds Zod validation + Gemini tags/TL;DR with mock JSON fallback

## Main Files

| Path | Owns |
|------|------|
| `app/page.js` → `components/feed.jsx` | Feed tabs, composer, caught-up state |
| `components/post-card.jsx` | All post rendering incl. AI-labelled boxes |
| `lib/seed.js` | Demo profiles + posts (labelled `is_demo`) |
| `lib/rank.js` | Ranking, reasons, trending, mentor suggestions |
| `lib/persona-context.jsx` | Demo persona switcher state (replaces auth) |
| `app/profile/[id]/page.js` | Profile header, Posts tab, Path tab (units/resources/outcome) |

## What we do not store or build

- Auth (persona switcher instead), chat, groups, voting, infinite scroll, PDF parsing
- AI never deletes or hides posts; flags go to human review
- Secrets in the client or in these docs

## Feature docs

| Doc | Summary |
|-----|---------|
| `features/feed-ui.md` | Feed + ranking + persona flow (Feature 1) |
