// Save the links on your own profile: POST { profile_id, links: [url] }.
// Real (Google) accounts only: demo profiles are shared by everyone.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { actAs, denied } from "@/lib/actor";
import { MAX_LINKS, checkLink } from "@/lib/profile-links";

const Body = z.object({
  profile_id: z.string().min(1).max(80),
  links: z.array(z.string().max(300)).max(MAX_LINKS, `Up to ${MAX_LINKS} links.`),
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
  const { profile_id, links } = parsed.data;
  if (!profile_id.startsWith("u-")) {
    return Response.json({ error: "Sign in with Google to add links to your own profile." }, { status: 403 });
  }
  const who = await actAs(profile_id);
  if (!who.ok) return denied(who);

  const checked = links.filter((l) => l.trim()).map(checkLink);
  const bad = checked.find((c) => !c.ok);
  if (bad) return Response.json({ error: bad.error }, { status: 400 });
  const unique = [...new Map(checked.map((c) => [c.link.url, c.link])).values()];

  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "Profiles need the database." }, { status: 503 });
  const { error } = await db.from("profiles").update({ links: unique }).eq("id", profile_id);
  if (error?.code === "42703" || error?.code === "PGRST204") {
    return Response.json({ error: "Profile links need the live-fixes migration." }, { status: 503 });
  }
  if (error) return Response.json({ error: "Could not save your links." }, { status: 500 });
  return Response.json({ links: unique });
}
