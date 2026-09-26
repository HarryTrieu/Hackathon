# Feature 4: AI mentor marketplace

Built from the teammate's spec (Vietnamese, translated). Students who scored D or HD in a Deakin unit become mentors for that unit. Each mentor gets an AI version of themselves that mentees can chat with before paying for a real session.

## Flows

1. **Find a mentor** (`/mentors` → `/mentors/[unit]`)
   - The mentee describes what they need. They can use starter prompts or tap "Skip, show mentors".
   - `/api/match` either asks one follow-up question (tone first, then teaching style, at most 2) or returns a ranked list. Every result must include a reason.
   - Gemini ranks candidates from their Part A answers, Part B voice, grade and reputation. The mock uses a keyword map (English + Vietnamese) scored against Part A.
2. **AI mentor chat** (`/mentors/[unit]/[id]`)
   - The chat opens with an intro message ("Hi, I'm ...") and sample question chips.
   - Each mentor allows 5 messages per mentee per day, counted by Melbourne date. The 6th message gets a 429 with a "request a session or try another mentor" message.
   - The persona prompt is built from Part A + Part B. It labels itself as an AI preview, refuses assessment answers (academic integrity), and stays under 120 words.
   - "Request a session" records a request with the mentor's rate. Self-booking is blocked.
3. **Become a mentor** (`/mentor/apply`)
   - Unit + grade (HD/D only) + Deakin email check (skipped for seeded verified personas) + optional transcript upload.
   - Part A: 7 chip questions. Part B: 4 free-text answers, 20 characters minimum.
   - Rate per hour, plus an optional work experience list with a show/hide toggle.
   - Preview: `/api/mentor-preview` generates 3 sample answers in the mentor's voice (one is a "write my assignment" trap). The mentor must approve the current draft before submitting; editing the draft invalidates the approval.
   - Code of conduct checkbox, then submit. The listing is created as `pending`, and a human approves it on `/review`.
4. **Reputation**: Helpful votes persist in `post_likes`. A mentor's reputation is the sum of helpful votes on their posts, and it sorts listings and feeds matching.
5. **Tag editing**: the post author sees "Edit tags" and can fix AI tags (PATCH `/api/posts`, lowercase kebab-case, max 6, author only).

## Files

- Shared: `lib/mentors.js` (questions, seed listings, intro, local fallbacks), `lib/gemini.js` (shared Gemini REST helper)
- Server: `lib/mentor-ai.js` (listings loader, matcher, persona, preview)
- APIs: `app/api/mentors`, `app/api/mentors/review`, `app/api/match`, `app/api/mentor-chat`, `app/api/mentor-preview`, `app/api/session-request`, `app/api/helpful`, PATCH in `app/api/posts`
- UI: `app/mentors/**`, `app/mentor/apply/page.js`, `components/mentor-card.jsx`, `components/mentor-chat.jsx`, `components/mentor-applications.jsx`, `components/mentor-section.jsx`, `lib/use-liked.js`, `components/post-card.jsx`
- Schema: `mentor_profiles`, `mentor_chats`, `session_requests`, `post_likes` in `supabase/schema.sql`

## Fallbacks

- No Gemini key, or Gemini 503/429 on both models: deterministic mock matcher, mock mentor replies built from Part B, mock preview answers.
- New tables missing in Supabase:
  - Applications save to localStorage.
  - The chat limit is counted in server memory. It resets per Vercel instance, so it is weak in prod.
  - Likes stay session only.

## Demo script

1. Persona Lan (p8) → Find a mentor → MMK101 → "I'm lost before the exam, explain slowly, Vietnamese ok" → the matcher returns a ranked list with reasons (Hannah first).
2. Open Hannah → the intro message appears → tap a sample question → she answers in her voice → ask "write my assignment" → she refuses and offers to teach instead. Point at the counter (5/day).
3. Request a session → the rate is shown → the request is recorded.
4. Switch to Chloe (p10) → Become a mentor → fill in the form → Preview → approve → submit → the listing is pending.
5. /review → approve → it shows up in the unit's mentor list.
6. Mark a post Helpful → the author's reputation goes up. As the author, edit a wrong AI tag.

## Known gaps

- Email verification is a domain check only. No code is sent.
- Switching personas resets the chat limit (no auth).
- The `helpful_count` update is read-modify-write, so concurrent votes can race.
- The post-card "Ask X's AI" link only knows seeded listings.
