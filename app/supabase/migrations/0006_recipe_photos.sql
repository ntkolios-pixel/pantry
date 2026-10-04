-- Recipes can now be captured from several photos at once (e.g. a multi-page
-- handwritten recipe card), so photos are stored as an array going forward.
alter table public.recipes add column image_urls text[] not null default '{}';
