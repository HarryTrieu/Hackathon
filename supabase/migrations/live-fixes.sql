-- live-fixes: saved posts follow your account across devices (they lived in
-- each browser before). Additive only, safe to run more than once.
create table if not exists saved_posts (
  profile_id text not null references profiles(id),
  post_id text not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);
alter table saved_posts enable row level security;

-- Links on your profile (LinkedIn, GitHub, portfolio...): [{ url, label }].
alter table profiles add column if not exists links jsonb not null default '[]';
