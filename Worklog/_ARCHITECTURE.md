# Architecture

> Agent + human memory. Keep short. No secrets. Code is source of truth; this is the map.

## Folder map

| Path | Role |
|------|------|
| `app/layout.js` | 3-column shell: LeftNav, main, RightSidebar, MobileNav, PersonaProvider |
| `app/page.js` | Home feed (renders `components/feed.jsx`) |
| `app/profile/[id]/page.js` | Profile: header + Posts / Path tabs |
| `app/search/page.js` | Stub (build step 5) |
| `app/loading.js` | Route-level skeleton |
| `app/api/upload/route.js` | Cloudinary image upload, mock fallback |
| `app/api/link-preview/route.js` | OpenGraph unfurl for pasted links |
| `app/api/posts/route.js` | GET feed data, POST publish (Zod + AI labels) |
| `app/api/replies/route.js` | Flat replies on posts |
| `app/api/membership/route.js` | Unit community join/leave/mentor |
| `app/communities/page.js` | Unit directory grouped by course |
| `app/unit/[code]/page.js` | Unit hub: members, mentors, posts |
| `lib/communities.js` | Derived unit directory + membership storage |
| `app/mentors/**` | Find a mentor: unit list, AI matcher, mentor page + AI chat |
| `app/mentor/apply/page.js` | Mentor application with AI preview approval |
| `lib/mentors.js` | Mentor questions, seed listings, intro, local fallbacks |
| `lib/mentor-ai.js` | Server: listings loader, matcher, persona chat, preview |
| `lib/gemini.js` | Server: shared Gemini REST call with lite fallback |
| `lib/theme.jsx` | Dark mode toggle (localStorage + system preference) |
| `app/api/mentors`, `match`, `mentor-chat`, `mentor-preview`, `session-request`, `helpful`, `reports` | Mentor marketplace APIs |
| `app/api/review/route.js` | Human review actions on flagged posts |
| `app/review/page.js` | Flagged-post queue, approve or remove |
| `lib/enrich.js` | Gemini labelling + deterministic mock |
| `lib/supabase.js` | Server-only Supabase client (null without env) |
| `supabase/schema.sql` | Tables + RLS deny-all (service role only) |
| `scripts/seed.mjs` | Push seed data to Supabase (`npm run seed`) |
| `public/demo/*.svg` | Offline demo images and link thumbnails |
| `lib/seed.js` | Demo data: 12 profiles, 40 posts, PERSONA_IDS |
| `lib/rank.js` | Tag-overlap ranking, reason lines, trending, mentors (no AI) |
| `lib/persona-context.jsx` | Client context for demo persona switcher |
| `components/feed.jsx` | Tabs For you / Popular, skeleton on switch, caught-up state |
| `components/post-card.jsx` | Post UI: badges, clamp, image, link card, AI boxes, chips, flag |
| `components/link-preview.jsx` | Shared link preview card |
| `components/user-avatar.jsx` | Deterministic tinted avatar + `initials()` |
| `components/composer.jsx` | Composer: image upload, live unfurl (publishing in step 2) |
| `components/left-nav.jsx` | Desktop nav + mobile bottom nav |
| `components/right-sidebar.jsx` | Trending tags, suggested mentors |
| `components/ui/` | shadcn (base-nova style, Base UI primitives) |
| `Worklog/` | Session changelog + per-feature notes |

## Stack

Next.js 16 App Router · JavaScript · Tailwind v4 · shadcn/ui (base-nova) · Lucide · (Supabase, Zod, Gemini from step 2) · Vercel

## Demo path

1. Home shows "For you" feed: reason lines, AI TL;DR boxes, English summaries under Vietnamese posts, flagged badges
2. Switch persona in the left-nav card → skeleton flash → feed reorders with new reasons
3. Click a name → profile → Path tab (units, resources, outcome). Feed ends with "You're all caught up"

## Env (names only)

All optional. Every route falls back to mock data when a key is missing. See `.env.example`.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (server only)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (step 2)
- `SUPABASE_SERVICE_ROLE_KEY` (server only, step 2), `GEMINI_API_KEY` (server only, step 2)

## Feature docs

| Feature doc | Summary |
|-------------|---------|
| `features/feed-ui.md` | Feature 1: seed + feed + persona switcher + ranking |
| `features/post-media.md` | Feature 1.5: images, link previews, upload, hover polish |
| `features/posts-api.md` | Feature 2: publish with AI labels, Supabase, review queue |
| `features/communities.md` | Feature 3: unit communities, replies, per-unit mentors |
| `features/mentor-marketplace.md` | Feature 4: AI mentor matching, chat, applications, reputation |
