"use client";

import { useEffect } from "react";
import { browserSupabase } from "@/lib/supabase-browser";
import { usePersona } from "@/lib/persona-context";
import { refreshInbox } from "@/lib/use-inbox";
import { refreshNotifications } from "@/lib/use-notifications";

// Listens for "something changed for you" pings (lib/realtime.js) and
// refreshes right away: the nav badges, and any open chat (pages listen for
// the "sodu:changed" window event). Polling stays as the fallback.
export function RealtimeListener() {
  const { persona } = usePersona();
  const id = persona.id;

  useEffect(() => {
    if (!id) return;
    let supabase = null;
    let channel = null;
    let cancelled = false;
    Promise.all([
      browserSupabase(),
      fetch(`/api/realtime?profile_id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((res) =>
        res.ok ? res.json() : null
      ),
    ])
      .then(([client, data]) => {
        supabase = client;
        if (cancelled || !supabase || !data?.topic) return;
        channel = supabase
          .channel(data.topic)
          .on("broadcast", { event: "changed" }, ({ payload }) => {
            refreshNotifications(id);
            refreshInbox();
            window.dispatchEvent(new CustomEvent("sodu:changed", { detail: payload }));
          })
          .subscribe();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (channel) supabase?.removeChannel(channel);
    };
  }, [id]);

  return null;
}
