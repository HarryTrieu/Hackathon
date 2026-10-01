-- sponsored-posts: view, click and hide counts for sponsored posts in the feed.
-- Additive only. No viewer id on purpose: advertisers only get totals per ad.

create table if not exists sponsored_events (
  id uuid primary key default gen_random_uuid(),
  ad_id text not null,
  type text not null check (type in ('impression', 'click', 'hide')),
  match text not null check (match in ('unit', 'goal', 'course', 'general')),
  created_at timestamptz not null default now()
);

create index if not exists sponsored_events_ad_id_idx on sponsored_events (ad_id);

-- Same model as every other table: deny-all RLS, only the server (service role) reads and writes.
alter table sponsored_events enable row level security;
