-- Tracks which real calendar week the current plan belongs to, so the app
-- can tell when a new week has started (rather than relying on a manual
-- "rebuild" action) and can show real dates on meal cards.
alter table public.profiles
  add column current_week_start date;
