# Changelog

Newest entries at the top. No secrets.

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
