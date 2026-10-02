-- session-journey: the steps after a session request (A2). Additive only,
-- safe to run more than once. Old requests keep nulls in every new column.
alter table session_requests add column if not exists proposed_time timestamptz;
alter table session_requests add column if not exists proposed_place text;
alter table session_requests add column if not exists decided_at timestamptz;
-- Mentee's rating after the session (one per request).
alter table session_requests add column if not exists rating int check (rating between 1 and 5);
alter table session_requests add column if not exists helped boolean;
alter table session_requests add column if not exists rating_comment text;
alter table session_requests add column if not exists rated_at timestamptz;
-- Mentor's answer to "Did the session happen?".
alter table session_requests add column if not exists held boolean;
alter table session_requests add column if not exists held_at timestamptz;

-- In-app messaging. Anyone can message anyone; a person can block another.
-- No AI reads messages; moderators only see a message someone reported.
-- One conversation per pair of profiles, stored with a_id < b_id.
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  a_id text not null references profiles(id),
  b_id text not null references profiles(id),
  a_read_at timestamptz,
  b_read_at timestamptz,
  last_message_at timestamptz,
  last_sender_id text,
  created_at timestamptz not null default now(),
  check (a_id < b_id),
  unique (a_id, b_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id text not null references profiles(id),
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_created on messages (conversation_id, created_at);

create table if not exists blocks (
  blocker_id text not null references profiles(id),
  blocked_id text not null references profiles(id),
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table conversations enable row level security;
alter table messages enable row level security;
alter table blocks enable row level security;

-- Deleting your own message: it shows as "This message was deleted" to both
-- people. The text is kept only so a moderator can still read it if the
-- chat is reported.
alter table messages add column if not exists deleted_at timestamptz;

-- Mentor membership: mentors pay A$15 per trimester (120 days) to be listed in
-- Find a mentor, with a money-back guarantee if no student requests a session
-- in the first 30 days. Payments are demo only (no card is charged).
-- Seeded demo mentors don't need a row.
create table if not exists mentor_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references profiles(id),
  amount_cents int not null,
  paid_at timestamptz not null default now(),
  ends_at timestamptz not null,
  guarantee_until timestamptz not null,
  refunded_at timestamptz,
  demo boolean not null default true
);
create index if not exists mentor_memberships_profile on mentor_memberships (profile_id, paid_at desc);
alter table mentor_memberships enable row level security;
