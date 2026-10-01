-- google-login: link a Sodu profile to the Google account (Supabase Auth
-- user) that owns it. Additive only; seeded demo profiles keep null here.
-- Safe to run more than once.
alter table profiles add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;
alter table profiles add column if not exists avatar_url text;
