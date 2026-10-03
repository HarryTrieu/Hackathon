-- study-plan: AI study plans per student per unit. Additive only, safe to
-- run more than once. The newest plan for a unit is the one shown; done holds
-- the ids of the steps the student ticked off.
create table if not exists study_plans (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references profiles(id),
  unit_code text not null,
  inputs jsonb not null,
  plan jsonb not null,
  done text[] not null default '{}',
  mocked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists study_plans_profile_unit on study_plans (profile_id, unit_code, created_at desc);
alter table study_plans enable row level security;
