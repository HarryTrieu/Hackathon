// One AI job: post text in, labels out. Falls back to a deterministic mock
// when GEMINI_API_KEY is missing or the call fails, so posting always works.
import { z } from "zod";

// Override with GEMINI_MODEL if this name 404s on your key.
const DEFAULT_MODEL = "gemini-2.0-flash";

const TOPICS = [
  "study-tips",
  "unit-review",
  "careers",
  "projects",
  "resources",
  "wellbeing",
];

const ResultSchema = z.object({
  lang: z.string().min(2).max(8),
  tags: z.array(z.string().min(1).max(40)).max(6),
  unit_codes: z.array(z.string().min(4).max(12)).max(6),
  topic: z.enum(TOPICS).catch("study-tips"),
  tldr: z.string().max(400).nullable(),
  summary_en: z.string().max(600).nullable(),
  flag_reason: z.string().max(300).nullable(),
});

const UNIT_CODE = /\b[A-Z]{3}\d{5}\b/g;

// Vocabulary shared with the seed so mock tags match the ranking data.
const KNOWN_TAGS = [
  "interviews", "algorithms", "internship", "portfolio", "projects", "python",
  "java", "javascript", "react", "sql", "pandas", "statistics", "tableau",
  "excel", "figma", "ui-design", "ux-research", "cybersecurity",
  "certifications", "networking", "exchange", "consulting", "presentations",
  "kaggle", "game-development", "web-development", "study-tips", "wellbeing",
  "exams", "beginners", "resources", "tutoring", "resume",
];

function mockEnrich(text) {
  const lower = text.toLowerCase();
  const hasVietnamese = /[\u00C0-\u1EF9]/.test(text);
  const lang = hasVietnamese ? "vi" : "en";

  const tags = KNOWN_TAGS.filter((t) =>
    lower.includes(t.replaceAll("-", " ")) || lower.includes(t)
  ).slice(0, 4);
  if (tags.length === 0) tags.push("study-tips");

  let topic = "study-tips";
  if (/(intern|job|career|interview|resume|offer)/.test(lower)) topic = "careers";
  else if (/(built|project|made|deploy)/.test(lower)) topic = "projects";
  else if (/review\b/.test(lower)) topic = "unit-review";
  else if (/(stress|burnout|feel|anxious|behind)/.test(lower)) topic = "wellbeing";
  else if (/(course|tutorial|youtube|book|link)/.test(lower)) topic = "resources";

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const flag =
    /(\b0\d{9}\b|\d{4}\s?\d{3}\s?\d{3})/.test(text)
      ? "Contains what looks like personal contact info. Needs human review."
      : /(exam (answers|questions)|assignment solutions)/.test(lower)
        ? "Possible sharing of exam material. Academic integrity concern, needs human review."
        : null;

  return {
    lang,
    tags,
    unit_codes: [...new Set(text.match(UNIT_CODE) ?? [])],
    topic,
    tldr: text.length > 280 ? sentences.slice(0, 2).join(" ").slice(0, 220) : null,
    summary_en:
      lang === "en"
        ? null
        : "Post is not in English. Add GEMINI_API_KEY for a real translation (mock mode).",
    flag_reason: flag,
    mocked: true,
  };
}

export async function enrichPost(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return mockEnrich(text);

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const prompt = `You label posts for a student study-experience feed. Reply with ONLY a JSON object, no markdown:
{
  "lang": "ISO 639-1 code of the post language",
  "tags": [2 to 4 lowercase kebab-case topic tags],
  "unit_codes": [university unit codes mentioned, uppercase like "COS10009", empty array if none],
  "topic": one of ${JSON.stringify(TOPICS)},
  "tldr": "if the post is longer than 280 characters, a 1-2 sentence English summary, else null",
  "summary_en": "if lang is not en, a faithful English summary of the whole post, else null",
  "flag_reason": "short reason if the post shares exam answers or solutions for sale, personal contact info, or harassment; else null"
}

Post:
"""${text.slice(0, 4000)}"""`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!res.ok) return mockEnrich(text);

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return mockEnrich(text);

    const parsed = ResultSchema.parse(JSON.parse(raw));
    return {
      ...parsed,
      // Enforce the product rules regardless of what the model decides.
      tldr: text.length > 280 ? parsed.tldr : null,
      summary_en: parsed.lang === "en" ? null : parsed.summary_en,
      tags: parsed.tags.map((t) => t.toLowerCase()),
      unit_codes: parsed.unit_codes.map((u) => u.toUpperCase()),
      mocked: false,
    };
  } catch {
    return mockEnrich(text);
  }
}
