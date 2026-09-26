// Unit community membership: join, leave, become or stop being a mentor.
// Without Supabase everything returns ok+mocked and the client keeps the
// state in localStorage, so the demo works identically offline.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFILES } from "@/lib/seed";

const PROFILE_IDS = new Set(PROFILES.map((p) => p.id));

const Action = z.object({
  profile_id: z.string().refine((id) => PROFILE_IDS.has(id), "Unknown profile."),
  unit_code: z.string().regex(/^[A-Z]{3}\d{5}$/, "Invalid unit code."),
  action: z.enum(["join", "leave", "mentor", "unmentor"]),
});

export async function GET(request) {
  const profileId = new URL(request.url).searchParams.get("profile_id");
  if (!profileId) {
    return Response.json({ error: "profile_id is required." }, { status: 400 });
  }

  const db = supabaseAdmin();
  if (!db) return Response.json({ memberships: null, mocked: true });

  const { data, error } = await db
    .from("unit_members")
    .select("unit_code, role")
    .eq("profile_id", profileId);
  if (error) return Response.json({ memberships: null, mocked: true });

  return Response.json({ memberships: data, mocked: false });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = Action.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { profile_id, unit_code, action } = parsed.data;

  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: true, mocked: true });

  let error;
  if (action === "leave") {
    ({ error } = await db
      .from("unit_members")
      .delete()
      .eq("profile_id", profile_id)
      .eq("unit_code", unit_code));
  } else {
    const role = action === "mentor" ? "mentor" : "member";
    ({ error } = await db
      .from("unit_members")
      .upsert({ unit_code, profile_id, role }));
  }

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, mocked: false });
}
