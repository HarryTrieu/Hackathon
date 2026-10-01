import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { MATCH_KINDS, SPONSORED, SPONSORED_IDS } from "@/lib/sponsored";

// Views, clicks and hides on sponsored posts. Rows deliberately have no
// viewer id: advertisers only ever get totals per ad.
const Event = z.object({
  ad_id: z.enum(SPONSORED_IDS),
  type: z.enum(["impression", "click", "hide"]),
  match: z.enum(MATCH_KINDS),
});

// Used when Supabase is not configured or the migration has not been run.
function memory() {
  globalThis.__soduSponsoredEvents ??= [];
  return globalThis.__soduSponsoredEvents;
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

  const db = supabaseAdmin();
  if (db) {
    const { error } = await db.from("sponsored_events").insert(parsed.data);
    if (!error) return Response.json({ ok: true, persisted: true });
  }
  memory().push(parsed.data);
  return Response.json({ ok: true, persisted: false });
}

export async function GET() {
  const db = supabaseAdmin();
  if (db) {
    const { data, error } = await db
      .from("sponsored_events")
      .select("ad_id, type")
      .limit(10000);
    if (!error && Array.isArray(data)) {
      return Response.json({ ...summarise(data), persisted: true });
    }
  }
  return Response.json({ ...summarise(memory()), persisted: false });
}

function summarise(rows) {
  const ads = SPONSORED.map((ad) => {
    const mine = rows.filter((r) => r.ad_id === ad.id);
    const impressions = mine.filter((r) => r.type === "impression").length;
    const clicks = mine.filter((r) => r.type === "click").length;
    const hides = mine.filter((r) => r.type === "hide").length;
    return {
      id: ad.id,
      advertiser: ad.advertiser,
      headline: ad.headline,
      impressions,
      clicks,
      hides,
      ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
    };
  });
  const impressions = ads.reduce((sum, a) => sum + a.impressions, 0);
  const clicks = ads.reduce((sum, a) => sum + a.clicks, 0);
  return {
    ads,
    totals: {
      impressions,
      clicks,
      ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
    },
  };
}
