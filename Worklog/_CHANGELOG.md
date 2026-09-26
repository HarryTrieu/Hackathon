# Changelog

Newest entries at the top. No secrets.

### 2026-09-27 00:40 · Demo prep: grade privacy fix, Students card, clickable Publish, demo script
- Did: match reasons (mock and Gemini prompt) now use `gradeBand()`, live Gemini had written "an HD student"; prompt forbids exact grades. Mentor view gets a Students card under Suggested mentors. Publish on /mentor/apply is always clickable and lists what is missing. Part B answers need 1 character (no max). Sarah's NeetCode post (s3) pinned to slot 2 in For you with a 5-reply community thread. Lan (p8) is Year 1. Review card no longer asks for an uploaded transcript (we never store one). Word spacing on html. Demo video script in `Docs/demo-video-script.md`
- Files: `lib/mentor-ai.js`, `lib/rank.js`, `lib/seed.js`, `components/right-sidebar.jsx`, `components/mentor-applications.jsx`, `app/mentor/apply/page.js`, `app/api/mentors/route.js`, `app/api/mentor-preview/route.js`, `app/globals.css`, `Docs/demo-video-script.md`
- Test: eslint 0; live Gemini match and mock match both say "Distinction or above"; live Vietnamese post labelled MMK101 with an English summary; assignment and visa refusals correct. Main Gemini model returned 429 (quota), lite fallback answered. Marketplace tables confirmed created in live Supabase. Not browser-tested end to end

### 2026-09-27 00:20 · Featured long posts for the AI summary demo
- Did: 5 long seed posts (f1-f5) with an AI summary, a photo (picsum.photos) and a link preview, each tuned to rank first in For you for one persona: f1 Lan (p8), f2 Aisha (p10), f3 Minh (p7), f4 Duc/Sarah (p2/p1), f5 Hannah (p13). Upserted only f1-f5 into live Supabase (did not re-run the full seed, so live Helpful counts are untouched)
- Files: `lib/seed.js`
- Test: eslint 0; ranking simulated on live `/api/posts`: every persona gets an f-post at #1. Images are external (picsum.photos), so they need internet during the demo

### 2026-09-27 00:00 · Per-tab scroll on the home feed
- Did: switching For you / Hot / New kept the shared window scroll, so the new tab opened mid-list. Tabs are now controlled; each tab remembers its scroll offset, a first visit starts at the top, a return restores the old offset
- Files: `components/feed.jsx`
- Test: eslint 0; `/` returns 200. Scroll behaviour not browser-tested

### 2026-09-26 23:45 · Hot: most Helpful first
- Did: `rankHot` sorts by `helpful_count` descending (newer post breaks ties) instead of helpful-with-recency-gravity
- Files: `lib/rank.js`
- Test: eslint 0; live data top order s3 (156), s1 (124), l5 (103), s2 (98), d2 (91)

### 2026-09-26 23:30 · For you: media posts first
- Did: `rankForYou` now puts posts with an image or link preview above text-only posts; tag/goal/unit score still orders posts inside each group. Hot and New unchanged
- Files: `lib/rank.js`
- Test: eslint 0; `/` returns 200. Order not checked in a browser

### 2026-09-26 23:00 · Left-nav Post opens a "Create post" popup
- Did: replaced scroll-to-composer / `?compose=1` with a Facebook-style modal on every page. Reuses `Composer` (`inDialog`), closes on publish, and the home feed prepends the new post via a `sodu:post-published` window event
- Files: `components/post-dialog.jsx`, `components/ui/dialog.jsx` (shadcn, base-ui, no new deps), `components/composer.jsx`, `components/left-nav.jsx`, `components/feed.jsx`
- Test: eslint 0; `/`, `/mentors`, `/profile/p8` return 200. Open → post → close flow not browser-tested

### 2026-09-26 22:30 · Saved posts on profile
- Did: Save on a post card was local state only (lost on reload, shown nowhere). Now persisted per persona in localStorage as post snapshots, and your own profile gets a "Saved" tab (hidden on other people's profiles, empty state when none)
- Files: `lib/use-saved-posts.js`, `components/saved-posts.jsx`, `components/post-card.jsx`, `app/profile/[id]/page.js`
- Test: eslint 0; `/profile/p8` (active persona) renders the Saved tab, `/profile/p1` does not. Save → profile click flow not browser-tested. Device-only: saves do not sync across browsers

### 2026-09-26 22:00 · Fix left-nav Post button
- Did: Post button did nothing outside Home (composer only lives on the feed) and gave no visible feedback on Home. Now scrolls to and focuses the composer on Home; elsewhere goes to `/?compose=1`, which focuses the composer once and strips the param
- Files: `components/left-nav.jsx`, `components/composer.jsx` (`focusComposer`)
- Test: eslint 0; `/`, `/?compose=1`, `/mentors`, `/communities` return 200. Click flow not browser-tested

### 2026-09-26 21:20 · Checklist catch-up, tags, avatars, Times, helpful fix
- Did: match 3s reveal + card hover/gradient; follow/filter tags; most seed posts get media; delete own post; helpful -1 bug (cache mutation); Dicebear avatars; Times New Roman; home CTAs + 3-step; reset demo + switch role; availability, sample labels, stats, visa/MH refusals, filters, 3 extra mentors (12 listings), event funnel
- Test: eslint 0. Mock hard-chat 5/5 correct. Matcher: calm+VN → Hannah, exam+direct → James, ask-me → follow-up. Production build not run this pass.

### 2026-09-26 20:10 · Spec catch-up: 10 mentee questions, reports, dark mode
- Did: matcher now walks the 10-question mentee bank one at a time and skips answers already in the description; Report buttons on mentor profile, AI chat and posts, queue on /review; dark mode with teal accent kept
- Files: `lib/mentors.js`, `lib/mentor-ai.js`, `lib/theme.jsx`, `components/report-button.jsx`, `components/theme-toggle.jsx`, `app/api/reports/route.js`, nav, review, post-card, mentor chat, globals.css
- Test: eslint 0. Live matcher: vague "ask me" gets the hardest-right-now question with chips; a specific calm + Vietnamese description returns ranked results with a Hannah reason; one chip ("Calm") asks the next unanswered question; "Just show me the mentors" returns 3 matches. Report POST 200, short reason 400, GET lists the open report. Production build not re-run this pass (last page compile hung)

### 2026-09-26 18:30 · Feature 4: AI mentor marketplace
- Did: conversational mentor matching with reasons, AI mentor chat (5/day), become-a-mentor application with AI preview approval, human approval on /review, session requests, persisted Helpful votes as mentor reputation, author tag editing, MMK101 + 2 Business mentors
- Did: shared `lib/gemini.js`; nav gets "Find a mentor", Search removed from nav (route kept)
- Files: see `Worklog/features/mentor-marketplace.md`
- Test: eslint 0, build clean (24 routes), live probes: vague input gets a follow-up, specific input gets a ranked list with reasons, AI refuses assignment writing, validation 400s (grade C, no conduct, gmail, short answers, bad option, bad id), tag edit 403/400, chat limit 429 on message 6 (bug found and fixed: HEAD count on a missing table returns null with no error). New tables not yet created in the live Supabase

### 2026-09-26 15:40 · Scope to Deakin University
- Did: all seed unit codes mapped to real Deakin units (verified on deakin.edu.au handbook pages), official titles, Deakin wording (trimester, CloudDeakin, SplashKit); unit-code format now 3 letters + 3 digits in mock AI, Gemini prompt, and membership API; communities seeded from a 12-unit Deakin catalog, non-Deakin codes ignored
- Files: `lib/seed.js`, `lib/communities.js`, `lib/enrich.js`, `app/api/membership/route.js`, `app/communities/page.js`, `public/demo/webpage.svg`
- Test: eslint 0, build clean, re-seeded Supabase (no old codes left), live Gemini post extracted SIT221 + SIT102 and was persisted, membership mentor/leave round-trip against live `unit_members`, old-format code rejected 400

### 2026-09-26 14:10 · Feature 3: unit communities, replies, per-unit mentors + Gemini model fix
- Did: `/communities` + `/unit/[code]` pages, join and become-a-mentor per persona, flat replies on every post, unit chips link to their community, Review + Units added to mobile nav
- Did: fixed retired `gemini-2.0-flash` → `gemini-flash-latest` default with lite fallback on 503; live-verified real tags and Vietnamese → English summary
- Files: see `Worklog/features/communities.md`
- Test: eslint exit 0, build clean (13 routes), curl probes on replies/membership APIs (validation 400s, mock paths); membership insert against live Supabase pending schema re-run

### 2026-09-26 13:50 · Feature 2: posts API with AI labels, Supabase, review page
- Did: `POST /api/posts` (Zod + Gemini with deterministic mock), `GET /api/posts` (DB with seed fallback), `/review` page + `/api/review`, Hot and New feed tabs, composer publishes for real
- Did: `supabase/schema.sql`, `scripts/seed.mjs` (`npm run seed`), server-only Supabase client, deps `@supabase/supabase-js` + `zod`, package.json `type: module`
- Files: see `Worklog/features/posts-api.md`
- Test: eslint and build clean (9 routes); curl probes on mock paths all correct (validation 400s, phone-number flag, unit-code extraction, TL;DR threshold). Live Gemini/Supabase untested: `.env.local` was empty on disk at build time

### 2026-09-26 10:20 · Post media, link previews, calmer hover, English-only seed
- Did: attached images to 5 seeded posts, link preview cards on 3, all seed text now English (translation path kept for live posts)
- Did: calmed hover (dimmer tints, 300ms ease-out, 150ms delay on chips), removed the fake 350ms re-rank skeleton
- Did: new `POST /api/upload` (Cloudinary signed upload, mock image when keys missing) and `GET /api/link-preview` (OpenGraph parse, SSRF guard, domain-only fallback)
- Did: shared `UserAvatar` with deterministic tints, replacing duplicated `initials()` in 5 files
- Files: `lib/seed.js`, `components/post-card.jsx`, `components/composer.jsx`, `components/feed.jsx`, `components/link-preview.jsx` (new), `components/user-avatar.jsx` (new), `app/api/upload/route.js` (new), `app/api/link-preview/route.js` (new), `public/demo/*.svg` (7 new), `.env.example` (new)
- Feature doc: `Worklog/features/post-media.md`
- Test: `npx eslint .` clean (it also caught 2 pre-existing errors from the first session that the IDE linter missed), `npm run build` clean, API edge cases probed with curl: missing file 400, non-image 400, no keys 200 mocked, bad URL 400, localhost and 169.254 blocked 400, dead domain 200 fallback, real OG parse verified against github.com and theodinproject.com

### 2026-09-26 09:40 · Feature 1: scaffold + feed UI + persona ranking
- Did: create-next-app (JS, Tailwind v4), shadcn init (base-nova) + 11 components, copied starter rules pack
- Did: seed data, tag-overlap ranking with reason lines, 3-column X-style layout, mobile bottom nav
- Files: `lib/seed.js`, `lib/rank.js`, `lib/persona-context.jsx`, `components/*.jsx`, `app/layout.js`, `app/page.js`, `app/profile/[id]/page.js`, `app/search/page.js`, `app/loading.js`, `app/globals.css` (accent)
- Feature doc: `Worklog/features/feed-ui.md`
- Test: `npm run build` clean; smoke-tested /, /profile/p1, /search (200 + expected content); unknown profile renders 404 page but HTTP status is 200
