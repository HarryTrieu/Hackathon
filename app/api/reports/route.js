// User reports on mentor profiles, AI chats and community posts.
// AI never hides anything; a human resolves these on /review.
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFILES } from "@/lib/seed";

const PROFILE_IDS = PROFILES.map((p) => p.id);

const CreateReport = z.object({
  target_type: z.enum(["mentor", "chat", "post"]),
  target_id: z.string().trim().min(1).max(80),
  reporter_id: z.string().refine((id) => PROFILE_IDS.includes(id), {
    message: "Unknown reporter.",
  }),
  reason: z.string().trim().min(3, "Pick or write a reason.").max(300),
});

const ResolveReport = z.object({
  id: z.string().min(1),
  action: z.literal("resolve"),
});

function memoryStore() {
  globalThis.__soduReports ??= [];
  return globalThis.__soduReports;
}

export async function GET() {
  const db = supabaseAdmin();
  if (db) {
    const { data, error } = await db
      .from("reports")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && Array.isArray(data)) {
      return Response.json({ reports: data, persisted: true });
    }
  }
  return Response.json({
    reports: memoryStore().filter((r) => r.status === "open"),
    persisted: false,
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  if (body.action === "resolve") {
    const parsed = ResolveReport.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const db = supabaseAdmin();
    if (db) {
      const { error } = await db.from("reports").update({ status: "resolved" }).eq("id", parsed.data.id);
      if (!error) return Response.json({ ok: true, persisted: true });
    }
    const store = memoryStore();
    const row = store.find((r) => r.id === parsed.data.id);
    if (row) row.status = "resolved";
    return Response.json({ ok: true, persisted: false });
  }

  const parsed = CreateReport.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const report = {
    ...parsed.data,
    status: "open",
    created_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  if (db) {
    const { data, error } = await db.from("reports").insert(report).select("*").single();
    if (!error && data) return Response.json({ report: data, persisted: true });
  }
  const local = { id: `rep-${parsed.data.reporter_id}-${parsed.data.target_id}`, ...report };
  const store = memoryStore();
  if (!store.some((r) => r.id === local.id && r.status === "open")) store.unshift(local);
  return Response.json({ report: local, persisted: false });
}
