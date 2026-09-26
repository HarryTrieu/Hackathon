# Agent rules (hackathon)

You are helping a **48-hour student hackathon**. Ship a demo that runs. You are not building a startup platform.

## Hard rules
- NEVER write API keys, tokens, or DB URLs as string literals. Use `process.env.*` only.
- NEVER put secrets in `NEXT_PUBLIC_*` or any client bundle.
- NEVER commit `.env`, `.env.local`, or real keys.
- If Gemini / OpenAI / DB env is missing, return **mock JSON** and keep the UI working. Do not crash the demo.
- Follow **Ponytail** (`.cursor/rules/02-ponytail.mdc`): YAGNI ladder, smallest diff, no new deps unless asked.
- Follow **Approval gate** (`.cursor/rules/03-approval-gate.mdc`): plan first → wait for user **go** → implement → list **Your next steps**.
- Follow **Deliberate** (`.cursor/rules/05-deliberate.mdc`): take your time; prefer a correct small decision over a rushed wrong scaffold. Do not pad with extra features.
- Follow **Reviewer mode** (`.cursor/rules/06-reviewer-mode.mdc`): before ## Done, hostile self-check (demo path, empty/invalid input, mock vs live, secrets). End with **Still risky** for what you did not prove.
- Follow **Worklog** (`.cursor/rules/04-worklog.mdc`): after implement, update `Worklog/_ARCHITECTURE.md`, `Worklog/_CHANGELOG.md`, and `Worklog/features/<slug>.md` (short; paths + line ranges; no code dumps; no secrets).
- Follow **How-it-works** (`.cursor/rules/07-how-it-works.mdc`): after meaningful behaviour changes, update `Docs/how-it-works/00-overview.md` and `Docs/how-it-works/features/<slug>.md`. Keep `Worklog/` at repo root (never `Docs/Worklog/`).
- Do not add auth, payments, new pages, or new npm packages unless the user explicitly asks.
- Prefer **JavaScript** unless the repo is already TypeScript.
- Ask before deleting files.
- New chat: read `@Worklog/_ARCHITECTURE.md` (and one feature doc if relevant). Add `@Docs/how-it-works/00-overview.md` only when you need product flow. Do not load entire `Worklog/` or `Docs/` every time.

## Stack default (unless team chose otherwise)
Next.js App Router + Tailwind + Vercel. API routes in `app/api/**/route.js`. UI in `app/**/page.jsx`. Helpers in `lib/`.

## UI
- Prefer Tailwind + **shadcn/ui** when the team wants polished components. Use the Cursor **shadcn** plugin/skill when working on UI.
- Follow `.cursor/rules/20-ui.mdc`: one accent, big type, loading/empty/error, no purple AI slop.
- Human how-to (browse components, prompts): see `Build-Guide.md` section **Make the UI look good**.

## Not in scope this weekend
Extra AI tooling (Graphify, etc.). Keep the repo tiny.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
