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
| `lib/seed.js` | Demo data: 12 profiles, 40 posts, PERSONA_IDS |
| `lib/rank.js` | Tag-overlap ranking, reason lines, trending, mentors (no AI) |
| `lib/persona-context.jsx` | Client context for demo persona switcher |
| `components/feed.jsx` | Tabs For you / Popular, skeleton on switch, caught-up state |
| `components/post-card.jsx` | Post UI: badges, clamp, AI boxes, chips, actions, flag |
| `components/composer.jsx` | Visual composer (API wired in step 2) |
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

None yet (Feature 1 is fully offline seed data). Coming in step 2+:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only), `GEMINI_API_KEY` (server only)

## Feature docs

| Feature doc | Summary |
|-------------|---------|
| `features/feed-ui.md` | Feature 1: seed + feed + persona switcher + ranking |
