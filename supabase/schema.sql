-- Sodu schema. Run once in the Supabase SQL editor.
-- All access goes through Next.js server routes using the service role key,
-- so RLS simply denies the public role everything.

create table if not exists profiles (
  id text primary key,
  name text not null,
  handle text not null,
  role text not null check (role in ('mentor', 'mentee')),
  course text not null,
  year int,
  verified boolean not null default false,
  skills text[] not null default '{}',
  goals text[] not null default '{}',
  outcome text,
  units jsonb not null default '[]',
  resources jsonb not null default '[]',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id text primary key,
  author_id text not null references profiles(id),
  lang text not null default 'en',
  text text not null,
  tldr text,
  summary_en text,
  tags text[] not null default '{}',
  unit_codes text[] not null default '{}',
  topic text not null default 'study-tips',
  helpful_count int not null default 0,
  image_url text,
  link_preview jsonb,
  flag_reason text,
  -- 'visible' | 'approved' | 'removed'. Review actions never delete rows.
  status text not null default 'visible',
  is_demo boolean not null default false,
  mocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists connect_requests (
  id uuid primary key default gen_random_uuid(),
  post_id text references posts(id),
  from_profile text not null references profiles(id),
  to_profile text not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists replies (
  id text primary key,
  post_id text not null references posts(id) on delete cascade,
  author_id text not null references profiles(id),
  text text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Joining a unit community, optionally as a mentor for that unit.
create table if not exists unit_members (
  unit_code text not null,
  profile_id text not null references profiles(id),
  role text not null default 'member' check (role in ('member', 'mentor')),
  created_at timestamptz not null default now(),
  primary key (unit_code, profile_id)
);

alter table profiles enable row level security;
alter table posts enable row level security;
alter table connect_requests enable row level security;
alter table replies enable row level security;
alter table unit_members enable row level security;
-- No policies on purpose: anon/publishable keys can read nothing.
-- The server routes use the service role key, which bypasses RLS.
