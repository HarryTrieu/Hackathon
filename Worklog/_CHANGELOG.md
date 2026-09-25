# Changelog

Newest entries at the top. No secrets.

### 2026-09-26 09:40 — Feature 1: scaffold + feed UI + persona ranking
- Did: create-next-app (JS, Tailwind v4), shadcn init (base-nova) + 11 components, copied starter rules pack
- Did: seed data, tag-overlap ranking with reason lines, 3-column X-style layout, mobile bottom nav
- Files: `lib/seed.js`, `lib/rank.js`, `lib/persona-context.jsx`, `components/*.jsx`, `app/layout.js`, `app/page.js`, `app/profile/[id]/page.js`, `app/search/page.js`, `app/loading.js`, `app/globals.css` (accent)
- Feature doc: `Worklog/features/feed-ui.md`
- Test: `npm run build` clean; smoke-tested /, /profile/p1, /search (200 + expected content); unknown profile renders 404 page (but HTTP status is 200, see Still risky)

### Template

```markdown
### YYYY-MM-DD HH:MM — short title
- Did: …
- Files: `path` (lines a–b)
- Feature doc: `Worklog/features/<slug>.md`
- Test: …
```
