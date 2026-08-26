-- Meal Planner schema
-- One row per user per domain object; every table is scoped by user_id/auth.uid()
-- via row-level security, so a single Postgres database safely serves every account.

create extension if not exists pgcrypto;

create type kosher_type as enum ('meat', 'dairy', 'parve');

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on signup (trigger
-- below). Tracks onboarding progress and the handful of cross-tab settings
-- (kosher toggle, Shabbat guest count, AI-pick cursor) that live outside any
-- single list.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  kosher boolean not null default true,
  onboarding_stage text not null default 'household'
    check (onboarding_stage in ('household', 'setup', 'recipes', 'app')),
  first_home_seen boolean not null default false,
  guest_count integer not null default 4,
  ai_index integer not null default 0,
  ai_added boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- New auth users automatically get a profile row (name comes from whatever
-- was passed as signUp() metadata / OAuth display name).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Generic "owned by user" helper: every remaining table follows the same
-- shape (user_id + RLS policy), so this macro-by-copy keeps them consistent.
-- ---------------------------------------------------------------------------

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  age text not null default '',
  note text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null default '',
  kosher kosher_type not null default 'parve',
  both_audiences boolean not null default true,
  source text not null default 'manual'
    check (source in ('manual', 'link', 'photo', 'email', 'discover', 'seed')),
  image_url text,
  created_at timestamptz not null default now()
);

create table public.bases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  label text not null,
  unique (user_id, key)
);

create table public.weekday_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_key text not null,
  day_label text not null,
  kosher kosher_type not null,
  family_desc text not null,
  kids_desc text not null,
  stealth_veg text,
  is_leftover boolean not null default false,
  base_key text,
  is_skipped boolean not null default false,
  skip_label text,
  sort_order integer not null default 0
);

create table public.shabbat_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_key text not null,
  day_label text not null,
  has_guests boolean not null default false,
  kosher kosher_type not null,
  sort_order integer not null default 0
);

create table public.shabbat_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shabbat_meal_id uuid not null references public.shabbat_meals (id) on delete cascade,
  course_name text not null,
  family_desc text not null,
  kids_desc text,
  stealth_veg text,
  sort_order integer not null default 0
);

create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  list_type text not null check (list_type in ('weekday', 'shabbat')),
  aisle text not null,
  name text not null,
  have boolean not null default false,
  sort_order integer not null default 0
);

create table public.prep_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  list_type text not null check (list_type in ('sunday', 'shabbat')),
  section text not null,
  label text not null,
  minutes integer,
  done boolean not null default false,
  sort_order integer not null default 0
);

create table public.discover_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  creator text not null,
  title text not null,
  note text not null,
  match_pct integer not null,
  saved boolean not null default false,
  added_to_library boolean not null default false,
  sort_order integer not null default 0
);

create table public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  base_line text not null,
  note text not null,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- RLS: every table below is a strict "owner can CRUD their own rows" table.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'household_members', 'recipes', 'bases', 'weekday_meals', 'shabbat_meals',
      'shabbat_courses', 'grocery_items', 'prep_items', 'discover_recipes', 'ai_suggestions'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%1$s owner rw" on public.%1$s for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;

create index on public.household_members (user_id);
create index on public.recipes (user_id);
create index on public.weekday_meals (user_id);
create index on public.shabbat_meals (user_id);
create index on public.shabbat_courses (shabbat_meal_id);
create index on public.grocery_items (user_id, list_type);
create index on public.prep_items (user_id, list_type);
create index on public.discover_recipes (user_id);
