-- community-plus: saved post translations and interest communities.
-- Additive only, safe to run more than once.

-- A post translated once into a language is reused for everyone.
create table if not exists post_translations (
  post_id text not null references posts(id) on delete cascade,
  lang text not null,
  text text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, lang)
);
alter table post_translations enable row level security;

-- Joining an interest community (Gaming, Photography...), like unit_members.
create table if not exists interest_members (
  slug text not null,
  profile_id text not null references profiles(id),
  created_at timestamptz not null default now(),
  primary key (slug, profile_id)
);
alter table interest_members enable row level security;
