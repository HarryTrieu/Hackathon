// Save the "Resources used" list on your own profile:
// POST { profile_id, resources: [{ url, label, note }] }. Google accounts only.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAs, denied } from "@/lib/actor";
import { MAX_RESOURCES, checkResource } from "@/lib/profile-links";

const Body = z.object({
  profile_id: z.string().min(1).max(80),
  resources: z
    .array(z.object({ url: z.string().max(300), label: z.string().max(100).optional(), note: z.string().max(140).nullable().optional() }))
    .max(MAX_RESOURCES, `Up to ${MAX_RESOURCES} resources.`),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { profile_id, resources } = parsed.data;
  if (!profile_id.startsWith("u-")) {
    return Response.json({ error: "Sign in with Google to edit your own resources." }, { status: 403 });
  }
  const who = await actAs(profile_id);
  if (!who.ok) return denied(who);
  const checked = resources.map(checkResource);
  const bad = checked.find((c) => !c.ok);
  if (bad) return Response.json({ error: bad.error }, { status: 400 });
  const unique = [...new Map(checked.map((c) => [c.resource.url, c.resource])).values()];
  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "Profiles need the database." }, { status: 503 });
  const { error } = await db.from("profiles").update({ resources: unique }).eq("id", profile_id);
  if (error) return Response.json({ error: "Could not save your resources." }, { status: 500 });
  return Response.json({ resources: unique });
}
