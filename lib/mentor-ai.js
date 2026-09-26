// Server-only: mentor listings loader, AI matching and AI mentor persona.
// Every AI path has a deterministic fallback so the demo never dead-ends.
import { z } from "zod";
import { callGemini, parseJson } from "./gemini.js";
import { supabaseAdmin } from "./supabase.js";
import { getProfile, POSTS } from "./seed.js";
import { getUnit } from "./communities.js";
import { MENTEE_QUESTIONS, SEED_MENTORS, reputationFor } from "./mentors.js";

// Seed listings merged with database rows (DB wins on the same id),
// decorated with profile, unit name and helpful-vote reputation.
export async function loadListings({ unitCode = null, includePending = false } = {}) {
  const db = supabaseAdmin();
  let rows = [];
  let posts = POSTS;
  if (db) {
    const [mentorsRes, postsRes] = await Promise.all([
      db.from("mentor_profiles").select("*"),
      db.from("posts").select("author_id, helpful_count, status"),
    ]);
    if (!mentorsRes.error && mentorsRes.data) rows = mentorsRes.data;
    if (!postsRes.error && postsRes.data?.length) posts = postsRes.data;
  }

  const byId = new Map(SEED_MENTORS.map((l) => [l.id, l]));
  for (const row of rows) byId.set(row.id, row);

  return [...byId.values()]
    .filter((l) => !unitCode || l.unit_code === unitCode)
    .filter((l) => includePending || l.status === "approved")
    .map((l) => ({
      ...l,
      profile: getProfile(l.profile_id),
      unit_name: getUnit(l.unit_code)?.name ?? null,
      reputation: reputationFor(l.profile_id, posts),
    }))
    .filter((l) => l.profile)
    .sort((a, b) => b.reputation - a.reputation);
}

// ---------- Matching ----------

// Chip / phrase aliases so mentee answers line up with Part A values.
const PREF_ALIASES = {
  Calm: "Calm and gentle",
  Friendly: "Friendly and casual",
  Energetic: "Energetic and motivating",
  Direct: "Direct and to the point",
  Examples: "Example-driven",
  "Talking it through": "Q&A and discussion",
  Gentle: "Encouraging first, then corrections",
  "Guided questions": "Mostly asking questions so you find the answer yourself",
  Fast: "Fast, focused on key points",
  "Either is fine": null,
  Either: null,
};

// Keyword hints for the offline matcher, keyed by Part A answer.
const HINTS = {
  "Calm and gentle": /calm|gentle|patient|kind|soft|nhẹ nhàng|kiên nhẫn/i,
  "Friendly and casual": /friendly|casual|chill|relaxed|thân thiện/i,
  "Energetic and motivating": /energetic|motivat|hype|push me|năng động/i,
  "Direct and to the point": /direct|blunt|straight|no fluff|thẳng/i,
  "Step-by-step": /step|slowly|one by one|từng bước|basics/i,
  "Big picture first": /big picture|overview|structure|tổng quan/i,
  "Example-driven": /example|real[- ]world|practical|ví dụ|thực tế/i,
  "Q&A and discussion": /discuss|conversation|talking it through|q&a|thảo luận/i,
  "Slow and thorough": /slow|thorough|chậm|kỹ/i,
  Moderate: /\bmoderate\b/i,
  "Fast, focused on key points": /fast|quick|key points|efficient|nhanh/i,
  "Exam preparation": /exam|test|quiz|thi|pass the unit|improve my grade|prepare for an exam/i,
  "Understanding concepts": /understand|concept|explain|hiểu|giải thích|really understand/i,
  "Study planning": /plan|schedule|organi[sz]e|kế hoạch|planning my study/i,
  "Reading and research skills": /reading|research|readings|đọc/i,
  "Career advice related to this field": /career|job|internship|portfolio|việc làm/i,
  "Encouraging first, then corrections": /gentle|encourag/i,
  "Honest and direct": /honest and direct|blunt feedback/i,
  "Mostly asking questions so you find the answer yourself": /guided questions|socratic/i,
  Vietnamese: /vietnamese|tiếng việt/i,
  Mandarin: /mandarin|chinese/i,
  Hindi: /hindi/i,
  Arabic: /arabic/i,
  English: /\benglish\b/i,
  Online: /online|zoom|remote/i,
  "In person": /in person|face to face|on campus|campus/i,
};

function preferencesFrom(text) {
  const fromHints = Object.entries(HINTS)
    .filter(([, re]) => re.test(text))
    .map(([value]) => value);
  const fromAliases = text
    .split(/[\n,]/)
    .map((part) => PREF_ALIASES[part.trim()])
    .filter((v) => typeof v === "string");
  return [...new Set([...fromHints, ...fromAliases])];
}

function listingValues(l) {
  const s = l.style;
  return [s.teaching, s.tone, s.pace, s.feedback, s.format, ...(s.help ?? []), ...(s.languages ?? [])];
}

function unansweredQuestions(menteeText) {
  return MENTEE_QUESTIONS.filter((q) => {
    if (q.skipWhenUnitKnown) return false;
    return !q.answeredBy.test(menteeText);
  });
}

function budgetScore(listing, text) {
  if (/just browsing|community only/i.test(text)) return listing.reputation * 0.05;
  if (/under \$30/i.test(text)) return listing.rate_per_hour <= 30 ? 1.5 : listing.rate_per_hour <= 35 ? 0.4 : -1;
  if (/\$30/i.test(text)) return listing.rate_per_hour <= 50 ? 1 : -0.3;
  if (/happy to pay|strong fit/i.test(text)) return listing.grade === "HD" ? 1 : 0.2;
  return 0;
}

function mockMatch(candidates, messages) {
  const menteeText = messages.filter((m) => m.role === "mentee").map((m) => m.text).join(" \n ");
  const asked = messages.filter((m) => m.role === "ai").length;
  const prefs = preferencesFrom(menteeText);
  const remaining = unansweredQuestions(menteeText);
  const last = messages.at(-1)?.text ?? "";
  const wantsResults = /show|list|just show|skip|gợi ý|any mentor/i.test(last);
  const askedToInterview = /ask me|not sure/i.test(menteeText);
  const richEnough = prefs.length >= 2 && !askedToInterview;

  if (!wantsResults && !richEnough && remaining.length && asked < 8) {
    const next = remaining[0];
    return { type: "question", question: next.question, suggestions: next.suggestions };
  }

  const communityOnly = /just browsing|community only/i.test(menteeText);
  const scored = candidates.map((l) => {
    const values = listingValues(l);
    const hits = prefs.filter((p) => values.includes(p) || (p === "Both" && values.includes(l.style.format)));
    const score =
      hits.length * 2 +
      (l.grade === "HD" ? 0.5 : 0) +
      Math.log10(l.reputation + 1) +
      budgetScore(l, menteeText);
    const first = l.profile.name.split(" ")[0];
    const reason = hits.length
      ? `${first} matches what you asked for: ${hits.map((h) => h.toLowerCase()).join(", ")}. ${l.grade} in ${l.unit_code}, ${l.reputation} helpful votes in the community${communityOnly ? ", so they already stand out in the free feed" : ""}.`
      : `${first} teaches ${l.style.teaching.toLowerCase()} with a ${l.style.tone.toLowerCase()} tone. ${l.grade} in ${l.unit_code}, ${l.reputation} helpful votes in the community.`;
    return { id: l.id, reason, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    type: "results",
    summary: communityOnly
      ? "Browsing only: mentors ranked by community helpful votes. You can still ask questions in the unit feed for free."
      : prefs.length
        ? `Matched on: ${prefs.map((p) => p.toLowerCase()).join(", ")}.`
        : "Here are the mentors for this unit, strongest community reputation first.",
    matches: scored.map(({ id, reason }) => ({ id, reason })),
  };
}

const MatchSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("question"),
    question: z.string().min(3).max(300),
    suggestions: z.array(z.string().min(1).max(80)).min(2).max(5),
  }),
  z.object({
    type: z.literal("results"),
    summary: z.string().max(400),
    matches: z
      .array(z.object({ id: z.string(), reason: z.string().min(10).max(500) }))
      .min(1),
  }),
]);

// messages: [{ role: "mentee" | "ai", text }]
export async function matchMentors(candidates, messages) {
  if (candidates.length === 0) {
    return { type: "results", summary: "No mentors for this unit yet.", matches: [], mocked: false };
  }
  const asked = messages.filter((m) => m.role === "ai").length;
  const menteeText = messages.filter((m) => m.role === "mentee").map((m) => m.text).join(" \n ");
  const remaining = unansweredQuestions(menteeText);
  const mustAnswer = asked >= 8 || remaining.length === 0;

  const brief = candidates.map((l) => ({
    id: l.id,
    name: l.profile.name,
    grade: l.grade,
    rate_per_hour_aud: l.rate_per_hour,
    helpful_votes: l.reputation,
    style: l.style,
    strengths: l.voice.topics,
    experience: l.show_experience ? l.experience : "hidden by mentor",
  }));

  const bank = remaining.map((q) => `- ${q.question} [${q.suggestions.join(" / ")}]`).join("\n");

  const system = `You match Deakin University students with peer mentors for one unit.
The unit is already known. Never ask which unit.
Candidates (the ONLY mentors you may recommend, never invent facts about them):
${JSON.stringify(brief)}

Mentee interview bank. Ask the NEXT unanswered question only, never two at once. Skip anything the mentee already said.
Unanswered right now:
${bank || "(none)"}

Reply with ONLY JSON, one of:
{"type":"question","question":"one short follow-up question","suggestions":["2-5 short quick replies"]}
{"type":"results","summary":"one sentence on what you matched on","matches":[{"id":"candidate id","reason":"1-2 sentences citing the student's stated preferences and concrete facts about this mentor"}]}

Rules:
- If the first description already covers how they like to be taught (tone or teaching style) AND at least one other preference, return results now. Every match MUST include a specific reason.
- If they are unsure, ask the next unanswered bank question, using that question's suggestions as chips.
- If they ask to see mentors, skip, or say they are only browsing the community, return results now.
- ${mustAnswer ? "You have already asked enough questions: return results now." : "Stop asking as soon as you can rank mentors with reasons."}
- Results: rank ALL candidates best first, every one with a specific reason.
- Write in the same language the student uses.`;

  const contents = messages.map((m) => ({
    role: m.role === "ai" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  const parsed = MatchSchema.safeParse(
    parseJson(await callGemini({ contents, system, json: true, temperature: 0.3 }))
  );
  if (parsed.success) {
    const result = parsed.data;
    if (result.type === "question" && !mustAnswer) return { ...result, mocked: false };
    if (result.type === "results") {
      const ids = new Set(candidates.map((c) => c.id));
      const matches = result.matches.filter((m) => ids.has(m.id));
      if (matches.length) return { ...result, matches, mocked: false };
    }
  }
  const fallback = mockMatch(candidates, messages);
  if (mustAnswer && fallback.type === "question") {
    return { ...mockMatch(candidates, [...messages, { role: "mentee", text: "show" }]), mocked: true };
  }
  return { ...fallback, mocked: true };
}

// ---------- AI mentor persona ----------

export function personaPrompt(listing) {
  const first = listing.profile.name.split(" ")[0];
  return `You are an AI preview of ${listing.profile.name}, a Deakin University peer mentor for ${listing.unit_code}${listing.unit_name ? ` (${listing.unit_name})` : ""}. Students chat with you to see whether ${first}'s teaching style suits them before booking a paid session with the real ${first}.

${first}'s questionnaire answers:
- Teaching style: ${listing.style.teaching}
- Tone: ${listing.style.tone}
- Pace: ${listing.style.pace}
- Helps most with: ${(listing.style.help ?? []).join(", ")}
- Feedback style: ${listing.style.feedback}
- Languages: ${(listing.style.languages ?? []).join(", ")}; format: ${listing.style.format}
- Grade in the unit: ${listing.grade}
- Strengths and common struggles: ${listing.voice.topics}
- About: ${listing.voice.about}

Voice samples (imitate this voice closely):
Explaining a concept: """${listing.voice.explain}"""
Student is stressed before the exam: """${listing.voice.lost}"""

Rules:
- Speak in first person as ${first}'s mentoring style. If asked whether you are human or the real ${first}, say you are an AI preview trained on ${first}'s answers.
- Keep replies under 120 words, conversational.
- Academic integrity: never write assessment answers, assignment text or exam solutions. Teach concepts, give examples, and ask guiding questions instead.
- Do not invent personal facts, availability or prices beyond what is listed. For booking, point to the "Request a session" button.
- Stay on studying, the unit and mentoring. Reply in the student's language if ${first} speaks it, otherwise English.`;
}

// Offline reply that still sounds like the mentor: reuse their own answers.
export function mockMentorReply(listing, text) {
  const t = text.toLowerCase();
  const first = listing.profile.name.split(" ")[0];
  if (/lost|exam|stress|panic|behind|help/.test(t)) return listing.voice.lost;
  if (/explain|what is|how does|concept|understand|hard topic/.test(t)) return listing.voice.explain;
  if (/who are you|about you|yourself|why do you/.test(t)) return listing.voice.about;
  if (/struggle|difficult|hardest|common/.test(t)) return listing.voice.topics;
  if (/feedback|draft|review my/.test(t)) {
    return `My feedback style is: ${listing.style.feedback.toLowerCase()}. Send me something you have written and I will show you in a session.`;
  }
  if (/assignment|answer|solution|write (it|my)/.test(t)) {
    return `I can't write assessment work for you, that's an academic integrity line. What I can do is explain the concept behind it and check your thinking. Which part is confusing?`;
  }
  return `Good question. I usually teach ${listing.style.teaching.toLowerCase()}, at a ${listing.style.pace.toLowerCase()} pace. ${listing.voice.topics} If you want to go deeper, you can request a session with ${first}.`;
}

export async function mentorReply(listing, history, text) {
  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.role === "mentor" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text }] },
  ];
  const reply = await callGemini({ contents, system: personaPrompt(listing), temperature: 0.7 });
  if (reply) return { reply: reply.trim(), mocked: false };
  return { reply: mockMentorReply(listing, text), mocked: true };
}

export const PREVIEW_QUESTIONS = [
  "Can you explain the hardest topic in this unit to me?",
  "I'm lost and the exam is next week. What should I do?",
  "Can you just give me the answers to the assignment?",
];

// Sample answers the mentor approves before their AI goes public.
export async function previewAnswers(listing) {
  const samples = [];
  let mocked = false;
  for (const q of PREVIEW_QUESTIONS) {
    const { reply, mocked: m } = await mentorReply(listing, [], q);
    mocked ||= m;
    samples.push({ question: q, answer: reply });
  }
  return { samples, mocked };
}
