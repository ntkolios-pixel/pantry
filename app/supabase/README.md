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
   order** (`0001_init.sql`, then `0002_seed_function.sql`, then
   `0003_storage.sql`). If you have the Supabase CLI linked to the project,
   `supabase db push` does this for you.

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

## 3. Deploy the weekly-plan Edge Function

"Build my first week" / "Rebuild my week" call an Edge Function
(`supabase/functions/generate-weekly-plan`) that asks Claude to build a real
week's plan from your own recipes and household notes — finding places to
batch-cook one thing and reuse it across multiple meals — instead of loading
a fixed demo.

1. Get an API key from https://console.anthropic.com (Settings → API Keys).
2. Deploy the function and set the key as a secret:
   ```
   supabase functions deploy generate-weekly-plan
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
   (Needs the [Supabase CLI](https://supabase.com/docs/guides/cli), linked to
   your project with `supabase link`.)
3. **Cost**: each generation is one Claude API call (model `claude-opus-5`,
   priced at $5/$25 per million input/output tokens) — typically a few cents
   to around $0.10 depending on how large your recipe library is. There's no
   other charge; Supabase Edge Functions have a generous free tier.

Without this secret set, tapping "Build my first week" shows an error asking
you to finish this step — nothing else in the app depends on it.

## 4. Point the app at your project

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
  Plan, populated by `generate-weekly-plan` (see above).
- `grocery_items`, `prep_items` — Groceries and Prep checklists, generated
  alongside the plan so they stay consistent with it.
- `discover_recipes`, `ai_suggestions` — the Discover feed and the Plan tab's
  "AI pick" card.

Every table is scoped by `user_id` with row-level security (`auth.uid() =
user_id`), so one Postgres database safely serves every account.

`seed_starter_data()` is a Postgres RPC that fills an account with the same
fixed demo week the design prototype shipped with. The app no longer calls it
by default (real plans come from `generate-weekly-plan` instead) — it's kept
around as a free, no-API-key fallback you can call manually from the SQL
editor (`select seed_starter_data();` while authenticated as that user) if
you want to explore the app without setting up step 3.

