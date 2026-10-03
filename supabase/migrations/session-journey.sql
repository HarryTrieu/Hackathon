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

-- Ending a session: the student ends it (with their rating); the mentor can
-- only ask them to ("Mark as done"). A session also ends by itself 5 days
-- after it was accepted (worked out in the app, no column needed).
alter table session_requests add column if not exists ended_at timestamptz;
alter table session_requests add column if not exists end_requested_at timestamptz;

-- Each session has its own conversation, separate from Messages. It opens
-- when the mentor accepts and becomes read-only once the session ends; the
-- two people can still message each other in Messages.
create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references session_requests(id) on delete cascade,
  sender_id text not null references profiles(id),
  text text not null check (char_length(text) between 1 and 2000),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists session_messages_session_created on session_messages (session_id, created_at);
alter table session_messages enable row level security;
alter table session_requests add column if not exists last_message_at timestamptz;
alter table session_requests add column if not exists last_sender_id text;
alter table session_requests add column if not exists mentor_read_at timestamptz;
alter table session_requests add column if not exists mentee_read_at timestamptz;

-- The demo Moderator can post (announcements). Posts need an author row in
-- profiles. Its role is stored as 'mentee' only because the role check
-- allows mentor/mentee; the app shows it as "Sodu Moderator" (Admin) from
-- lib/seed.js. Adds the row once, changes nothing if it exists.
insert into profiles (id, name, handle, role, course, verified, is_demo)
values ('admin', 'Sodu Moderator', 'sodu-mod', 'mentee', 'Sodu Team', true, true)
on conflict (id) do nothing;
