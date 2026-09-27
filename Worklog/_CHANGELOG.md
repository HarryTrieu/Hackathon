# Changelog

Newest entries at the top. No secrets.

### 2026-09-27 13:45 · Lan's resources with YouTube thumbnails
- Did: Lan (p8) gets 6 resources: 3 YouTube videos (4Ps explainer, Accounting Stuff financial statements, McKinsey case interview demo) and 3 sites (Deakin Abroad trimester abroad, DeakinTALENT, HubSpot Academy). New `ResourceLink` card on every profile's Path tab: YouTube watch links show the video thumbnail with a play badge, other links show the site icon (Google favicon service), plus an optional `note` line
- Files: `components/resource-link.jsx`, `app/profile/[id]/page.js`, `lib/seed.js`
- Test: eslint 0; all 3 video IDs confirmed via YouTube oEmbed, thumbnails and icons return 200; `/profile/p8` renders 3 thumbnails + 3 icons; `/profile/p1` 200. Deakin pages 403 to scripts, so their URLs were confirmed via web search, not fetched. Not viewed in a browser

### 2026-09-27 13:05 · PwC referral pinned under Lan's exchange question
- Did: For you places jr6 (James's PwC vacationer referral) directly after lp2 (Lan's "exchange in T1 or T2 vs internship recruiting" question) for every persona; s3 stays pinned at #2
- Files: `lib/rank.js`
- Test: eslint 0; simulated all 6 personas: lp2 then jr6 (Lan #4/#5), 58 posts, no duplicates, #1/#2 unchanged

### 2026-09-27 12:00 · Clear notifications
- Did: "Clear all" and a per-row ✕ on the All tab, with Undo for the last clear. Clearing hides keys for that persona in localStorage (`sodu-notif-cleared:<id>`) and marks them seen; the underlying likes/replies/requests are untouched. A request that changes status gets a new key and reappears. Requests tab is not affected, so pending requests cannot be cleared by accident
- Files: `lib/use-notifications.js`, `app/notifications/page.js`
- Test: eslint 0; `/notifications` 200. Clear / undo flow not browser-tested
- Follow-up: Requests tab gets the same Clear all / ✕ / Undo (`requestKey`, `canClearRequest`). Sent requests clear by id+status, so a status change brings them back; requests to you can only be cleared once answered, pending ones stay until accepted/declined. Undo is per tab

### 2026-09-27 11:50 · Job referral posts + scrollable sidebar lists
- Did: 8 job referral seed posts (jr1-jr8) from alumni and seniors (Google SWE, Canva analyst, startup frontend, Atlassian "what a referral changes", REA UX, PwC vacationer, skincare marketing assistant, a mentee asking how to ask) with photos, plus 6 replies (r18-r23). All model safe practice: apply officially first, reply in-thread, no contact details, a referral is not a pass through interviews. jr9 is a flagged "$150 guaranteed referral" scam post for the moderator queue. Upserted only jr1-jr9 and r18-r23 into live Supabase (existing Helpful counts untouched). Mock tagger knows `referral` and `jobs`. Suggested mentors and Students now list everyone in a scrollable box (about 3.5 rows tall)
- Files: `lib/seed.js`, `lib/enrich.js`, `components/right-sidebar.jsx`
- Test: eslint 0; ranking simulated for all 6 personas: #1 featured post and #2 s3 unchanged, referral posts land #3 to #9 for most; Hot top 5 unchanged; `referral` enters trending tags; live `/api/posts` returns jr1-jr9. Sidebar scroll not browser-tested

### 2026-09-27 11:30 · Faster notifications (and every API route on Vercel)
- Did: functions ran in Vercel's default iad1 (Washington) while Supabase and users are in Australia, so each query crossed the Pacific; `vercel.json` pins functions to syd1. Notifications API: likes and replies inner-join their post filtered on author, so all 5 queries run in one parallel round trip instead of posts-then-the-rest. Client hook: one shared stale-while-revalidate cache per persona (instant render from cache, background refresh after 15s, forced after accept/decline), one request in flight per persona (nav and page used different dedupe keys, so each open fired two identical requests)
- Files: `vercel.json`, `app/api/notifications/route.js`, `lib/use-notifications.js`
- Test: eslint 0; API output byte-identical to the old version for p8, p2, p13, p4, p1; local warm ~85ms to ~50ms; prod before the change 0.8 to 1.9s per call (`x-vercel-id` showed syd1::iad1). Region change and client cache not yet verified on prod or in a browser

### 2026-09-27 10:45 · Notifications + accept/decline session requests
- Did: `/notifications` (All / Requests tabs) and a bell with unread badge in desktop and mobile nav (not for admin). Notifications are derived from existing tables, no new table: Helpful votes and replies on your posts, session requests you received, status changes on requests you sent, your mentor application decisions (non-demo). Mentors can Accept / Decline pending requests; the mentee then sees "accepted/declined". Read state = seen notification keys per persona in localStorage (a status change makes a new key, so it shows unread again)
- API: `GET /api/notifications?profile_id=`, `PATCH /api/session-request` (only a `sent` request owned by that mentor can change; replay → 409)
- Files: `app/api/notifications/route.js`, `app/api/session-request/route.js`, `lib/use-notifications.js`, `app/notifications/page.js`, `components/left-nav.jsx`
- Test: eslint 0; live flow: Aisha like + reply on f5 and Lan → James request show up for Lan / James; accept 200, second decision 409, wrong mentor 409; Lan sees "accepted". Test rows removed afterwards. Seed Helpful counts have no like rows, so only new likes notify. No realtime: refetch on navigation / persona switch

### 2026-09-27 10:00 · Admin-only review
- Did: new "Sodu Moderator" persona (`ADMIN_PROFILE`, role `admin`) in the switcher. Only admin sees Review in the nav; `/review` shows "Moderators only" for mentors/mentees. Admin has no Post button or feed composer. Mentor apply success page no longer links to the review queue. Report buttons unchanged for everyone
- Admin is kept out of `PROFILES`: the DB `profiles.role` check only allows mentor/mentee, and post/reply APIs validate authors against `PROFILES`, so admin cannot post (API returns 400)
- Files: `lib/seed.js` (`ADMIN_PROFILE`, `roleLabel`, `getProfile`), `components/left-nav.jsx`, `app/review/page.js`, `components/feed.jsx`, `components/persona-switcher.jsx`, `app/profile/[id]/page.js`, `app/mentor/apply/page.js`
- Test: eslint 0; default persona: no /review link in nav, `/review` gated, `/profile/admin` 200 with Admin badge, POST /api/posts as admin → 400. Admin queue view not browser-tested. UI gate only: review APIs still have no auth

### 2026-09-27 00:50 · Demo prep: grade privacy fix, Students card, clickable Publish, demo script
- Did: match reasons (mock and Gemini prompt) now use `gradeBand()`, live Gemini had written "an HD student"; prompt forbids exact grades. Mentor view gets a Students card under Suggested mentors. Publish on /mentor/apply is always clickable and lists what is missing. Part B answers need 1 character (no max). Sarah's NeetCode post (s3) pinned to slot 2 in For you with a 5-reply community thread. Lan (p8) is Year 1. Review card no longer asks for an uploaded transcript (we never store one). Word spacing on html. Demo video script in `Docs/demo-video-script.md`
- Files: `lib/mentor-ai.js`, `lib/rank.js`, `lib/seed.js`, `components/right-sidebar.jsx`, `components/mentor-applications.jsx`, `app/mentor/apply/page.js`, `app/api/mentors/route.js`, `app/api/mentor-preview/route.js`, `app/globals.css`, `Docs/demo-video-script.md`
- Test: eslint 0; live Gemini match and mock match both say "Distinction or above"; live Vietnamese post labelled MMK101 with an English summary; assignment and visa refusals correct. Main Gemini model returned 429 (quota), lite fallback answered. Marketplace tables confirmed created in live Supabase. Not browser-tested end to end

### 2026-09-27 00:40 · Persona switch follows your own profile
- Did: switching persona while on `/profile/<current persona>` now navigates to the new persona's profile (dropdown and "Switch to … view" button). Other pages unchanged
- Files: `components/persona-switcher.jsx`
- Test: eslint 0; persona profiles return 200. Switch flow not browser-tested

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
