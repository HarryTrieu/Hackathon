// Interest communities: membership and counts.
//   GET  ?profile_id=X       { joined: [slug], counts: { slug: members } }
//   POST { profile_id, slug, join }
// Before the community-plus migration: counts are empty and joining says so.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAsAuthor, denied } from "@/lib/actor";
import { INTEREST_SLUGS } from "@/lib/interests";

const NO_STORE = { "Cache-Control": "private, no-store" };
const missingTable = (error) => ["PGRST205", "42P01"].includes(error?.code);

export async function GET(request) {
  const me = new URL(request.url).searchParams.get("profile_id");
  const db = supabaseAdmin();
  if (!db) return Response.json({ joined: [], counts: {} }, { headers: NO_STORE });
  const { data, error } = await db.from("interest_members").select("slug, profile_id").limit(5000);
  if (error) return Response.json({ joined: [], counts: {}, ready: !missingTable(error) }, { headers: NO_STORE });
  const counts = {};
  for (const row of data) counts[row.slug] = (counts[row.slug] ?? 0) + 1;
  const joined = me ? data.filter((r) => r.profile_id === me).map((r) => r.slug) : [];
  return Response.json({ joined, counts, ready: true }, { headers: NO_STORE });
}

const Body = z.object({
  profile_id: z.string().min(1).max(80),
  slug: z.enum(INTEREST_SLUGS),
  join: z.boolean(),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Unknown community." }, { status: 400 });
  const { profile_id, slug, join } = parsed.data;
  if (profile_id === "admin") return Response.json({ error: "The moderator account doesn't join communities." }, { status: 400 });
  const who = await actAsAuthor(profile_id);
  if (!who.ok) return denied(who);
  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "Communities need the database." }, { status: 503 });
  const { error } = join
    ? await db.from("interest_members").upsert({ slug, profile_id })
    : await db.from("interest_members").delete().eq("slug", slug).eq("profile_id", profile_id);
  if (missingTable(error)) return Response.json({ error: "Interest communities need the community-plus migration." }, { status: 503 });
  if (error) return Response.json({ error: "Could not update that." }, { status: 500 });
  return Response.json({ ok: true });
}
