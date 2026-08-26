# Backend setup (Supabase)

This app's backend is a single Supabase project (Postgres + Auth + Storage). No
project has been provisioned in this environment — there's no Docker/Supabase
CLI available in this sandbox to spin one up, and provisioning a live cloud
project requires your own Supabase account. Do this once, from your machine:

## 1. Create the project

1. Create a project at https://supabase.com (or run `supabase start` locally
   with the Supabase CLI + Docker if you'd rather develop against a local
   Postgres instance).
2. In the SQL editor, run the migrations in `supabase/migrations/` **in
   order** (`0001_init.sql`, then `0002_seed_function.sql`). If you have the
   Supabase CLI linked to the project, `supabase db push` does this for you.

## 2. Configure auth providers

Email/password is on by default. For Google and Apple sign-in:

- **Google**: Supabase dashboard → Authentication → Providers → Google. You'll
  need an OAuth client ID/secret from the Google Cloud Console (Web
  application type) — set the authorized redirect URI to the one Supabase
  shows on that page.
- **Apple**: Authentication → Providers → Apple, using a Services ID + key
  from your Apple Developer account. Native "Sign in with Apple" (iOS) also
  needs `usesAppleSignIn: true` in `app.json` (already set) and a paid Apple
  Developer account to test on a real device.

## 3. Point the app at your project

Copy `.env.example` to `.env` and fill in your project's URL + anon key
(Project Settings → API):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Without these set, the app runs but every screen that reads/writes data will
fail — `lib/supabase.ts` logs a warning at startup if they're missing.

## Schema overview

- `profiles` — one row per user (name, kosher toggle, onboarding stage, guest
  count, AI-pick cursor). Auto-created by a trigger on `auth.users` insert.
- `household_members` — family members + their notes (the "Family &
  Preferences" screen).
- `recipes` — the Library.
- `bases`, `weekday_meals`, `shabbat_meals`, `shabbat_courses` — the weekly
  Plan.
- `grocery_items`, `prep_items` — Groceries and Prep checklists.
- `discover_recipes`, `ai_suggestions` — the Discover feed and the Plan tab's
  "AI pick" card.

Every table is scoped by `user_id` with row-level security (`auth.uid() =
user_id`), so one Postgres database safely serves every account.

`seed_starter_data()` is a Postgres RPC the app calls once, right after
onboarding, to populate a new account with the same starter week the design
prototype shipped with — see `app/(onboarding)/recipes.tsx`.
