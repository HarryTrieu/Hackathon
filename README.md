# Sodu

A study community and peer-mentor marketplace for Deakin University students.
Students post questions and advice by unit, and AI tags, summarises and
moderates each post. When they want one-on-one help, an AI interview matches
them with a senior who got a Distinction or High Distinction in that unit.
They can chat with an AI preview of that mentor's teaching style, then book a
real session.

Live: https://sodu-three.vercel.app

## What it does

- **Feed.** For you (ranked by your units, goals and the topics you follow, with a reason on every post), Hot and New. Posts can have images, PDFs and link previews.
- **AI on every post.** Gemini adds tags, a TL;DR, and an English summary for posts in other languages. It also flags scams, spam, harassment, violence, sexual content, contact details and selling assessment answers. A flag only hides the post until a moderator decides; the AI never deletes anything. Self-harm posts get support contacts, not a penalty.
- **Translation.** Any post can be translated into 11 languages. Each translation is saved, so it's only made once.
- **Communities.** Every unit has its own feed, and interest communities cover life outside study (international students, startups, fitness, gaming and more).
- **Find a mentor.** An AI interview asks how you like to learn, then ranks the unit's mentors with a reason for each. Mentors are ranked by performance (completed sessions weighted by rating, plus Helpful votes), never by what they pay.
- **AI mentor preview.** Chat with an AI trained on a mentor's own questionnaire answers before booking. It refuses graded work, says it's an AI, and points visa and crisis questions to the right Deakin services.
- **Sessions.** Request, accept, a private session room, then the student ends the session and rates it. A session ends by itself 5 days after it's accepted, so nobody can keep one open to avoid paying.
- **Mentor hub.** Membership (A$25 a trimester, money back if no student asks for a session in 30 days), incoming requests, demand in your units, and Mentor another unit.
- **Study plans.** A trimester plan for a unit and a target grade. It is built only from the unit outline, checked resources and community tips, and never gives answers.
- **Messages and notifications.** Direct messages, block and report, and live updates through Supabase Realtime.
- **Moderation.** A review queue for flagged posts, reports and mentor applications, with a badge and an instant alert for moderators.
- **Accounts.** Google sign-in with a short setup form, Edit profile and Delete my account, plus a plain-language privacy page at `/privacy`. Demo personas let anyone try every role without signing in.
- **Sponsored posts.** Employer opportunities matched only by the units, course and goals on your profile. They're labelled, can be hidden, and advertisers only get totals.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in what you have; see Environment
npm run dev
```

Open http://localhost:3000. With no keys, Sodu runs on labelled demo data, and every AI feature falls back to a simple built-in version. Google sign-in, messages, sessions and anything else saved per person need Supabase.

### Database

1. Create a Supabase project. Run `supabase/schema.sql`, then the files in `supabase/migrations/` in this order: `google-login`, `sponsored-posts`, `session-journey`, `study-plan`, `live-fixes`, `community-plus`. Every migration only adds tables and columns, and each is safe to run again.
2. Load the demo data with `npm run seed`.
3. Turn on Google as an auth provider in Supabase, with `/auth/callback` as the redirect.

## Environment

| Name | Used for | Missing means |
|------|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database, sign-in, realtime | Demo data only, no sign-in |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sign-in and realtime in the browser (the public anon key, never a secret key) | No sign-in or live updates |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database access | Nothing is saved |
| `GEMINI_API_KEY` | Tagging, moderation, matching, the AI mentor, study plans, translation | Built-in fallbacks, no translation |
| `GEMINI_MODEL` | Optional model override (default `gemini-flash-latest`) | Default model |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image and PDF uploads | Uploads return a placeholder |
| `DEMO_MODE` | Set to `false` to switch off the demo personas (real accounts only) | Demo personas on |

Secret keys are only read on the server and never prefixed with `NEXT_PUBLIC_`. Row level security denies all direct access; the browser only reaches data through the API routes, which check who is asking.

## Tests

```bash
npm test                  # 43 unit tests: session, money, ranking and safety rules (seconds, no keys)
npm run test:permissions  # 37 private actions tried by the wrong person; needs the app running on :3107
npm run test:ai           # 32 real Gemini cases; needs GEMINI_API_KEY, writes tests/ai-report.md
```

To test another copy of the app, set `SODU_URL`, for example `SODU_URL=https://sodu-three.vercel.app npm run test:permissions`. The permission tests only send requests that must be refused, so they never change data.

## Stack

Next.js 16 (App Router, JavaScript) and React 19, with Tailwind v4, shadcn/ui on Base UI, and Lucide icons. Supabase handles Postgres, Google auth and Realtime. Gemini does the AI, called over REST from the server only, with zod-validated output. Cloudinary stores uploads. The app is hosted on Vercel in Sydney (`syd1`).

## Where things are

| Path | What's there |
|------|--------------|
| `app/` | Pages: Home, `unit/[code]` (feed and study plan), `communities`, `interest/[slug]`, `mentors/[unit]` (matching and the mentor page), `mentor` (hub and apply), `sessions/[id]`, `messages`, `notifications`, `profile/[id]`, `search`, `review`, `welcome`, `privacy` |
| `app/api/` | One folder per API route. Each checks who is asking through `lib/actor.js` and validates input with zod |
| `lib/` | Shared rules: `rank.js` (feed), `sessions.js` (session states), `membership.js` (fees and guarantee), `enrich.js` (post AI and moderation), `mentor-ai.js` (matching and the AI mentor), `study-plan.js`, `sponsored.js`, `seed.js` (demo data) |
| `components/` | UI components |
| `supabase/` | `schema.sql` and the migrations |
| `tests/` | Unit, permission and AI test sets |
| `Docs/`, `Worklog/` | How it works, the architecture file map, and the change log |

## Notes

- Demo profiles, posts and advertisers are made up and labelled as demo data. Real accounts have `u-` ids; demo personas have `p1` to `p14`.
- Unit outlines and study tasks are samples; a pilot would use the real unit guides.
- Mentor membership payments are a demo step: nothing is charged yet.
