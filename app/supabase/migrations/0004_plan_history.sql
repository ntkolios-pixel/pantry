-- Remembers a short summary of each past generated week so
-- generate-weekly-plan can ask Claude for variety instead of regenerating
-- the same rotation every time "Rebuild my week" is pressed.
create table public.plan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  generated_at timestamptz not null default now(),
  -- { bases: string[], weekday_meals: string[], shabbat_meals: string[] } —
  -- just the dish descriptions, not a full plan snapshot.
  summary jsonb not null
);

alter table public.plan_history enable row level security;
create policy "plan_history owner rw" on public.plan_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index on public.plan_history (user_id, generated_at desc);
