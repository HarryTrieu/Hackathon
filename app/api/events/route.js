import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFILES } from "@/lib/seed";

const PROFILE_IDS = new Set(PROFILES.map((p) => p.id));

const Event = z.object({
  type: z.enum(["preview_started", "contact_clicked"]),
  listing_id: z.string().min(1).max(40),
  mentee_id: z.string().refine((id) => PROFILE_IDS.has(id), "Unknown mentee."),
});

function store() {
  globalThis.__soduEvents ??= [];
  return globalThis.__soduEvents;
}

export async function GET() {
  const db = supabaseAdmin();
  if (db) {
    const { data, error } = await db.from("demo_events").select("type").limit(500);
    if (!error && Array.isArray(data)) {
      return Response.json(summarise(data.map((r) => r.type)));
    }
  }
  return Response.json(summarise(store().map((e) => e.type)));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Event.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const row = { ...parsed.data, created_at: new Date().toISOString() };
  const db = supabaseAdmin();
  if (db) {
    const { error } = await db.from("demo_events").insert({
      type: row.type,
      listing_id: row.listing_id,
      mentee_id: row.mentee_id,
    });
    if (!error) return Response.json({ ok: true, persisted: true });
  }
  store().push(row);
  return Response.json({ ok: true, persisted: false });
}

function summarise(types) {
  const previews = types.filter((t) => t === "preview_started").length;
  const contacts = types.filter((t) => t === "contact_clicked").length;
  return {
    previews,
    contacts,
    conversion: previews ? Math.round((contacts / previews) * 100) : 0,
  };
}
