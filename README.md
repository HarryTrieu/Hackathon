# Sodu

A distraction-free social feed where students and seniors share study experience.
AI tags every post, writes a TL;DR, and the feed delivers the right advice to the
right student at the right stage. Built for Track 2, Education and Student Success.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables are required: the app runs
entirely from labelled seed data, and every route that touches a third party falls
back to mock data.

## Demo path

1. Home shows the "For you" feed for the active persona, each post with a reason
   line such as "Because your goal is internship"
2. Switch persona in the left nav and the feed re-ranks with new reason lines
3. Open a profile and check the "Path" tab: units taken, resources used, outcome
4. In the composer, paste a link to see it unfurl, or attach an image

## Stack

Next.js App Router (JavaScript) · Tailwind v4 · shadcn/ui · Lucide · Vercel.
Supabase, Zod and Gemini land in the next build step.

## Environment

Copy `.env.example` to `.env.local`. Every value is optional.

| Name | Scope | Missing means |
|------|-------|---------------|
| `CLOUDINARY_CLOUD_NAME` | server | uploads return a mock image |
| `CLOUDINARY_API_KEY` | server | uploads return a mock image |
| `CLOUDINARY_API_SECRET` | server | uploads return a mock image |

Secrets are never read in client components and never prefixed with `NEXT_PUBLIC_`.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Feed, For you and Popular tabs |
| `/profile/[id]` | Profile header, Posts and Path tabs |
| `/search` | Placeholder, build step 5 |
| `GET /api/link-preview?url=` | OpenGraph unfurl, rejects private hosts, falls back to a domain card |
| `POST /api/upload` | One image to Cloudinary, mock image without keys |

## Not built yet

`POST /api/posts` with Gemini tagging and TL;DR, CV extraction into a profile,
"Ask the author" connect requests, and the search page. Deliberately out of scope:
auth, chat, groups, voting, infinite scroll.

## Notes

- Seed profiles and posts are fictional demo data, flagged with `is_demo`
- AI never deletes or hides a post; flagged posts show a badge for human review
- Docs: `Worklog/_ARCHITECTURE.md` for the file map, `Docs/how-it-works/` for product flow
