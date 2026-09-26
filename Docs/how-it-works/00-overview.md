# How The App Works

> Product behaviour for humans + Agent. No secrets. Code is source of truth; this is the flow map.
> Short implementation history lives in `/Worklog/` (not under Docs).

## User Flow

1. User opens Sodu, Home shows the "For you" feed for the active demo persona (default: Minh, IT Year 1 mentee)
2. Each post card shows: author badges (Mentor, course and year, verified), original text (clamped at 4 lines), an attached image or link preview card when present, an "AI summary" TL;DR box on long posts, tag chips, a reason line ("Because your goal is internship"), and Helpful / Save / Ask-the-author actions
3. Switching persona in the left-nav card re-ranks the feed client-side and fades the new order in. No requests leave the browser for ranking, it is all seeded data
4. In the composer, pasting a link fetches a preview card after a short pause, and attaching an image uploads it and shows a thumbnail

## Server Workflow

1. Two routes exist so far. Ranking has no route, it is plain client code
2. `GET /api/link-preview?url=` validates the URL (http/https only, private and loopback hosts rejected with 400), fetches the page with a 3 second timeout, parses OpenGraph and Twitter meta tags, and resolves a relative image URL against the page
3. `POST /api/upload` accepts one image (400 for missing/non-image/empty, 413 over 4MB), signs the request server-side with the Cloudinary secret, and returns the hosted URL
4. Mock behaviour: without Cloudinary keys the upload returns `/demo/upload-placeholder.svg` with `mocked: true` and HTTP 200. A blocked or dead link returns a domain-only preview card, also 200. The demo never shows a failure screen because a third party was slow
5. Ranking is plain code in `lib/rank.js`: goal overlap x3, skill overlap x2, shared unit code +3, same course +2.5, mentor/mentee cross-bonus +1.5, small helpful and recency tiebreaks. The reason line always mirrors the highest-scoring signal, so the UI never claims a match the score did not use
6. Flagged posts render a "Flagged for review" badge with the reason in the tooltip. They are never hidden or deleted
7. From build step 2: `POST /api/posts` adds Zod validation plus Gemini tags, TL;DR, and an English summary for non-English posts, all with mock fallback

## Main Files

| Path | Owns |
|------|------|
| `app/page.js` to `components/feed.jsx` | Feed tabs, composer, caught-up state |
| `components/post-card.jsx` | Post rendering incl. image, link card, AI-labelled boxes |
| `components/link-preview.jsx` | Link card used by both feed and composer |
| `app/api/link-preview/route.js` | Unfurling pasted links |
| `app/api/upload/route.js` | Image upload and mock fallback |
| `lib/seed.js` | Demo profiles and posts (labelled `is_demo`, English only) |
| `lib/rank.js` | Ranking, reasons, trending, mentor suggestions |
| `lib/persona-context.jsx` | Demo persona switcher state (replaces auth) |
| `app/profile/[id]/page.js` | Profile header, Posts tab, Path tab (units/resources/outcome) |

## What we do not store or build

- Auth (persona switcher instead), chat, groups, voting, infinite scroll, PDF parsing
- AI never deletes or hides posts; flags go to human review
- Uploaded images are not yet attached to a saved post, that needs build step 2
- Secrets in the client or in these docs

## Feature docs

| Doc | Summary |
|-----|---------|
| `features/feed-ui.md` | Feed, ranking, persona flow |
| `features/post-media.md` | Images, link previews, upload behaviour |
