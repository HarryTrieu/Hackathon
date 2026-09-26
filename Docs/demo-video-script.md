# Sodu demo video: workflow and script

Target length: 5:00. Speaking pace is about 150 words a minute, so the spoken lines below total roughly 750 words. Cuts for a 3:00 version are marked **[CUT]**.

Roles used below: **Comms** (business and comms lead), **BA** (business analyst), **SE** (software engineer, drives the screen), **Data** (data analyst).

---

## 0. Before you record (blockers first)

1. **Run `supabase/schema.sql` in the Supabase SQL editor.** Checked 26 Sep: `mentor_profiles`, `mentor_chats`, `session_requests`, `reports`, `demo_events` and `post_likes` do not exist in the live database. The file is `create table if not exists`, so re-running is safe. Without it:
   - Helpful votes look like they work but do not save, so reputation never moves.
   - Lan's session request never reaches Hannah's profile (the section stays hidden).
   - Reports and the funnel live in one server's memory. On Vercel the next click can hit a different instance, so the report may not appear on /review.
2. **Deploy the local changes** (Publish button fix, Students card, NeetCode post in slot 2, Lan in Year 1, grade-band fix in match reasons), and pull the teammate's persona-switch commit first. Or record on `localhost:3000`.
3. **Gemini quota.** On 26 Sep the main model returned 429 on every call, and the lite fallback answered everything. Record the AI scenes early in the day, and do not rehearse repeatedly on the same key right before recording.
4. **The 5-a-day chat limit counts rehearsals.** It is per mentee, per mentor, per Melbourne day, and "Reset demo" does not clear it. Rehearse the chat as a different persona (for example Minh) or with a different mentor, and keep Lan and Hannah fresh for the real take.
5. **Mentor application.** Each take creates `p10-<unit>`. Use a different unit per take, or delete the row between takes.
6. Click **Reset demo** (bottom of the left nav) before each take.
7. Internet on: avatars (Dicebear) and post photos (picsum) are external.
8. Browser: 1440px wide, 110 to 125% zoom, bookmarks bar hidden, light mode to start.
9. Have one image file ready to upload, and the snippets from section 4 in a notes file.

---

## 1. Run sheet

| Time | Segment | Speaker | Screen | Criterion |
|------|---------|---------|--------|-----------|
| 0:00 to 0:30 | Problem and user | Comms, then BA | Title slide, then Lan's home feed | Problem 15% |
| 0:30 to 0:50 | Solution in one breath | Comms | Home hero, 3-step strip | Solution 15% |
| 0:50 to 1:10 | A. Personalised feed | SE | Lan, For you | Prototype 35% |
| 1:10 to 1:40 | B. AI matching | SE | Find a mentor, MMK101 | Prototype |
| 1:40 to 2:15 | C. Mentor profile, AI preview, request | SE | Hannah's profile | Prototype, oversight |
| 2:15 to 2:35 | D. Ask the community in Vietnamese | SE | Post dialog | Prototype, accessibility |
| 2:35 to 2:50 | E. The mentor's side | SE | Hannah persona | Prototype |
| 2:50 to 3:10 | F. Become a mentor | SE | Aisha, /mentor/apply | Prototype, fairness |
| 3:10 to 3:30 | G. Human review | SE | /review | Human oversight |
| 3:30 to 3:50 | How it works | SE | Architecture slide | Prototype and tech |
| 3:50 to 4:05 | Responsible AI | BA | Slide | Solution, evaluation |
| 4:05 to 4:30 | Impact measurement | Data | Slide plus /review funnel line | Evaluation 20% |
| 4:30 to 4:50 | Implementation and Australian context | BA | Slide | Evaluation |
| 4:50 to 5:00 | Close | Comms | Title slide | Pitch 15% |

---

## 2. Script

`DO` = what the SE clicks. `SAY` = voiceover. Where the app shows AI-generated text, **don't read it word for word**: it changes every run. Point at it and paraphrase.

### 0:00 Problem and user

**DO:** Title slide: "Sodu: find the right senior for your Deakin unit."

**SAY (Comms):** "It's week three of trimester. Lan is a first-year Business student at Deakin. English is her second language, MMK101 is her first marketing unit, and she's already behind. Somewhere, a third-year got a Distinction in that exact unit and would happily explain it. Lan just can't find them."

**SAY (BA):** "That's our user: first-year and international students. The help exists, but it's scattered across group chats and word of mouth, and nothing tells you who is good at *explaining*, not just good at the unit. **[BA: one cited figure here. Suggested sources: the latest QILT Student Experience Survey result for learner engagement, or first-year attrition from the Department of Education's Higher Education Statistics. Say the number and the source on screen. Don't estimate.]**"

### 0:30 Solution

**DO:** Lan's home page. Hover over the hero and its three steps: Describe, Preview chat, Contact.

**SAY (Comms):** "Sodu is a peer mentor marketplace for Deakin units. Describe what you need, try a mentor's AI preview, then contact the real person. Around it is a free community feed where helpful answers earn the reputation mentors are ranked on. AI does three narrow jobs: it labels posts, matches mentors, and previews a mentor's teaching style. People make every decision that matters."

### 0:50 A. Personalised feed (persona: Lan Pham, Mentee, Business, Year 1)

**DO:**
1. Scroll For you. First post: James's long post on doing exchange and a consulting program in the same year. Point at the reason line and the "AI summary · AI-generated" box.
2. Second post: Sarah's NeetCode post. Click "Replies · 5".
3. In the right sidebar, click Follow on a trending tag. The Following chips appear at the top.

**SAY (SE):** "Lan's feed is ranked for her. Her goals are exchange and consulting, so a senior's post on doing both comes first, with a line saying why, and an AI summary so she doesn't need to read 400 words. Underneath is a real community thread: a first-year is stuck, and a third-year invites him to a study group in the SIT102 community. **[CUT]** She can follow topics, and the feed uses them."

### 1:10 B. AI matching

**DO:**
1. Left nav: Find a mentor. The university is locked to Deakin. Pick MMK101.
2. Paste snippet 1 and send.
3. "Matching a mentor for you..." shows for 3 seconds, then the results fade in.
4. Point at: Hannah's reason, the "Newer mentor" line on one card, and the budget, language and format filters.

**SAY (SE):** "Lan picks her unit and describes what she wants in her own words. If she's vague, the AI asks one question at a time, about pace, language, budget and so on, and stops once it can rank. She was specific, so it ranks now. Every mentor comes with a reason tied to what she said: Hannah is calm, goes step by step, and speaks Vietnamese. One slot always goes to a newer mentor, so the most-voted people don't take every student."

### 1:40 C. Mentor profile, AI preview chat, session request

**DO:**
1. Open Hannah. Point at "Distinction or above", Deakin verified, the Sample data label, availability, and the preview and contact counts.
2. In the chat, tap a sample question. Then paste snippet 2 (the assignment request). It refuses and offers to work through it with her. Point at "X of 5 left".
3. **[CUT]** Paste snippet 3 (visa). It points to Deakin International Student Support and Home Affairs.
4. Click Request a session, type "Could we go through the positioning map before my presentation?", and send.
5. Click Report on the chat, type a short reason, and submit.

**SAY (SE):** "Grades only ever show as Distinction or above. This chat is an AI preview built from how Hannah answered her application. It's labelled as AI and capped at five messages a day: a taste of her teaching, not a replacement for her. Ask it to write your assignment and it says no and offers to help you do it. Ask about visas or mental health and it hands you to Deakin's support services instead of guessing. When Lan's ready, she requests a session with the real Hannah, and if anything feels off, the report goes to a person."

### 2:15 D. Ask the community in Vietnamese

**DO:**
1. Left nav: Post. The dialog opens. Paste snippet 4 (Vietnamese). Attach the image. Click Post, and it shows "Tagging...".
2. The new card shows tags including MMK101 and an "English summary · AI-generated" box.
3. **[CUT]** Click the tag edit control and fix a tag. Then delete the post from its menu.

**SAY (SE):** "Lan can also ask the community in Vietnamese. The AI detects the language, tags the unit, and adds an English summary so any senior can help. Every AI output is labelled, and the author can correct the tags. The AI never hides or deletes a post: if it sees contact details or exam answers for sale, it flags the post for a human."

### 2:35 E. The mentor's side (persona: Hannah Vo, Mentor)

**DO:**
1. Left nav persona switcher: pick Hannah Vo.
2. Open her profile. Under Session requests is Lan's message.
3. Home: the right sidebar now shows Students below Suggested mentors. For you leads with Lan's MMK101 presentation post.

**SAY (SE):** "Now as Hannah. Lan's request is waiting on her profile. Her feed surfaces first-years asking MMK101 questions, so answering for free builds the reputation that brings paid sessions."

### 2:50 F. Become a mentor (persona: Aisha Khan, Data Science, Year 2)

**DO:** (Speed up 3 to 4x in the edit. The form is long.)
1. Switch to Aisha. Left nav: Become a mentor. Point at the data notice.
2. Pick unit SIT103. Click Credit and show the warning. Then pick High Distinction: it displays as "Distinction or above". Point at "Transcript not stored".
3. Part A: click one chip per question. Part B: paste snippet 5 into each box.
4. Run the preview. Edit one sample answer.
5. Tick the code of conduct. Click Publish AI mentor for review. It shows the pending message.

**SAY (SE):** "Any student can apply to mentor a unit they got a Distinction or above in. Below that, we point them to helping for free in the community. We keep a verified flag, not the transcript. They set their style, write in their own voice, and preview and correct their AI before anyone sees it. And Publish doesn't publish: it goes to review."

### 3:10 G. Human review

**DO:**
1. Left nav: Review. Point at the funnel line: "Demo funnel: X preview chats started, Y contact requests (Z% conversion)".
2. Mentor applications: Aisha, SIT103, "High Distinction (claimed)". Click Approve mentor, and it shows "their AI mentor is now live".
3. User reports: the chat report from scene C. Resolve it.
4. AI-flagged posts: the SIT191 notes-for-sale post. Click Remove from feed.

**SAY (SE):** "This is the human layer. A reviewer checks every mentor before their AI goes live. User reports land here. Posts the AI flagged wait for a person to approve or remove. And at the top are the numbers we'd track in a pilot."

### 3:30 How it works

**DO:** Architecture slide: Browser, then Next.js server routes (Vercel), which call Supabase Postgres (RLS deny-all), Gemini (server only) and Cloudinary (signed uploads).

**SAY (SE):** "Next.js on Vercel and Supabase Postgres. Row-level security denies all browser access, so every read and write goes through our server routes, validated with Zod. Every AI call is server-side through one Gemini helper: a 15-second timeout, a fallback model, then a deterministic fallback, so the app never dead-ends. No API key reaches the browser. Feed ranking isn't a black box: it's weighted scoring on tags you follow, goals, skills, unit and course, which is why every post and mentor can tell you why it's there."

### 3:50 Responsible AI

**DO:** One slide, five rows.

| | What the prototype does |
|---|---|
| Privacy | Keeps a verified flag, not the email or transcript. Grades show as a band. The AI never shares contact details. |
| Fairness | A newer-mentor slot. One vote per person per post. Budget filter. The free community tier works with no payment. |
| Accessibility | English summaries of non-English posts, plain language, dark mode, accessible component primitives |
| Security | Server-only secrets, input validation, author-only edit and delete, private hosts blocked in link previews |
| Oversight | People approve mentors, resolve reports and decide on flags. The AI only flags. |

**SAY (BA):** "AI speeds things up. Every decision that affects a person, a mentor going live, a post coming down, a report, is made by a human."

### 4:05 Impact measurement

**DO:** Slide with the metrics. Cut back to the /review funnel line for one second.

**SAY (Data):** "We won't claim results from a 48-hour build. In a one-trimester pilot we'd measure five things, and the app already logs the first:
- how many preview chats turn into contact requests;
- time from landing to a matched mentor;
- helpful votes and replies per unit community;
- mentor applications and approval time;
- reports per hundred chats and time to resolve.

The outcome measure is a pre and post survey on confidence in the unit. With consent and ethics approval, we'd also compare pass rates in aggregate, knowing students who opt in aren't a random sample."

### 4:30 Implementation and Australian context

**SAY (BA):** "It's built for Deakin: real unit codes, trimesters, Melbourne time for the chat limit, rates in dollars, and referrals to Deakin's support services. It respects Australia's academic integrity law, which made commercial cheating services illegal in 2020 **[BA: verify and cite the TEQSA Act amendment]**, and that's why the AI won't write assignments. The next steps are:
1. Deakin single sign-on, staff-verified grades, and a privacy impact assessment under the Privacy Act.
2. A pilot in three first-year units with a faculty or student association partner.
3. Payments only once the pilot shows demand.

It runs on free tiers today, and we'd measure pilot costs rather than guess them."

### 4:50 Close

**SAY (Comms):** "Sodu helps a first-year find the right senior in minutes instead of weeks. AI sorts, people decide. Thank you."

---

## 3. Submission items: where each one lives

| Required item | In the video | Owner |
|---|---|---|
| Problem statement | 0:00 to 0:30 | BA |
| Proposed solution | 0:30 to 0:50, plus responsible AI 3:50 | Comms |
| Prototype | Scenes A to G | SE |
| Tech overview | 3:30 | SE |
| Implementation plan | 4:30 | BA |
| Impact measurement | 4:05 | Data |
| Final pitch | Whole video, close at 4:50 | Comms |

---

## 4. Snippets to paste

1. Match: `I want a mentor who talks gently and explains MMK101 simply, step by step. English is my second language, Vietnamese is fine.`
2. Assignment trap: `Can you just write my case study assignment for me?`
3. Visa: `Will failing this unit affect my student visa?`
4. Vietnamese post (tested live on 26 Sep: tagged MMK101, English summary generated): `Mình đang học MMK101 và thấy phần positioning map rất khó hiểu. Có anh chị nào giải thích giúp mình bằng ví dụ thực tế không? Mình cũng muốn biết nên đọc tài liệu nào trước kỳ thi để không bị quá tải, vì tiếng Anh của mình chưa tốt lắm.`
5. Part B answer (reuse in each box, then edit one to sound natural): `I start from what the student already knows, then build one step at a time with a real example.`

---

## 5. If something breaks on camera

- **AI shows a "Mock AI" badge, or a plain template reply.** Both Gemini models failed and the fallback took over. Keep going and say "that's the fallback, so the demo never dead-ends", or retake later.
- **The matcher asks a question instead of ranking.** Tap one chip. It's a feature worth showing anyway.
- **"You've used your 5 messages".** The daily limit was burned in rehearsal. Pick another mentor, or switch to a mentee persona that hasn't chatted with Hannah.
- **Session requests missing on Hannah's profile, or the report missing on /review.** The tables weren't created (see blocker 1).

---

## 6. Judge Q&A prep (honest answers)

- **"Doesn't the AI mentor replace the real mentor?"** No. It's capped at five messages a day, labelled as AI, and built to end in a session request with the person.
- **"How do you verify grades?"** In the prototype it's a self-claim plus a verified-email flag, checked by a human reviewer. In a real rollout, grades are verified by staff or through Deakin records. We don't pretend the mock is real verification.
- **"Why use AI at all?"** For three jobs a person can't do at scale: labelling and summarising posts (including translation), turning a vague need into a ranked shortlist, and previewing teaching style before anyone pays. Ranking, reputation and moderation decisions don't use a model.
- **"What about the data?"** Every profile and post is fictional seed data, labelled Sample data. No real students.
- **"What if Gemini is down?"** A second model, then deterministic fallbacks. We saw this during testing: the main model hit quota and the fallback answered.
- **"Known gaps?"**
  - A persona switcher instead of login.
  - Mock verification.
  - No payments or calendar.
  - The chat limit falls back to server memory if the database is unavailable.
  - No full accessibility audit yet.
