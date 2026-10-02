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
