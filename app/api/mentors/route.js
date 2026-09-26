// Mentor listings (GET) and mentor applications (POST).
// Applications start as 'pending' and only appear in search after a human
// approves them in /review.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { loadListings } from "@/lib/mentor-ai";
import { STYLE_QUESTIONS, mentorId } from "@/lib/mentors";
import { getProfile, PROFILES } from "@/lib/seed";

const PROFILE_IDS = new Set(PROFILES.map((p) => p.id));
const optionsOf = (id) => STYLE_QUESTIONS.find((q) => q.id === id).options;
const one = (id) => z.enum(optionsOf(id));
const many = (id) => z.array(z.enum(optionsOf(id))).min(1);
const answer = z.string().trim().min(20, "Please answer every Part B question in a few sentences.").max(1500);

const Application = z.object({
  profile_id: z.string().refine((id) => PROFILE_IDS.has(id), "Unknown profile."),
  unit_code: z.string().regex(/^[A-Z]{3}\d{3}$/, "Invalid unit code."),
  email: z.string().trim().max(200).optional(),
  grade: z.enum(["HD", "D", "C", "P"]),
  transcript_url: z.string().max(500).nullable().optional(),
  rate_per_hour: z.number().int().min(10).max(200),
  show_experience: z.boolean(),
  experience: z
    .array(
      z.object({
        company: z.string().trim().min(1).max(80),
        role: z.string().trim().min(1).max(80),
        current: z.boolean(),
      })
    )
    .max(5),
  style: z.object({
    teaching: one("teaching"),
    tone: one("tone"),
    pace: one("pace"),
    help: many("help"),
    feedback: one("feedback"),
    languages: many("languages"),
    format: one("format"),
  }),
  voice: z.object({ topics: answer, explain: answer, lost: answer, about: answer }),
  code_of_conduct: z.literal(true, { message: "You must accept the mentor code of conduct." }),
});

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const unit = params.get("unit");
  const includePending = params.get("include") === "pending";
  const mentors = await loadListings({ unitCode: unit, includePending });
  return Response.json({ mentors });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Application.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const app = parsed.data;

  if (!["HD", "D"].includes(app.grade)) {
    return Response.json(
      { error: "Mentors need a Distinction (D) or High Distinction (HD) in the unit." },
      { status: 400 }
    );
  }

  // Seeded verified students skip the email step; everyone else needs a
  // Deakin address. Only the verified flag is stored, never the address.
  const profile = getProfile(app.profile_id);
  const emailOk = /^[^\s@]+@deakin\.edu\.au$/i.test(app.email ?? "");
  if (!profile.verified && !emailOk) {
    return Response.json(
      { error: "Use your Deakin student email (ending in @deakin.edu.au)." },
      { status: 400 }
    );
  }

  const row = {
    id: mentorId(app.profile_id, app.unit_code),
    profile_id: app.profile_id,
    unit_code: app.unit_code,
    grade: app.grade,
    status: "pending",
    email_verified: true,
    transcript_url: app.transcript_url ?? null,
    rate_per_hour: app.rate_per_hour,
    show_experience: app.show_experience,
    experience: app.experience,
    style: app.style,
    voice: app.voice,
    is_demo: false,
    created_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  let persisted = false;
  if (db) {
    const { error } = await db.from("mentor_profiles").upsert(row);
    persisted = !error;
  }
  return Response.json({ application: row, persisted });
}
