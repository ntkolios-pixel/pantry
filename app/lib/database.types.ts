export type KosherType = 'meat' | 'dairy' | 'parve';
export type OnboardingStage = 'household' | 'setup' | 'recipes' | 'app';
export type RecipeSource = 'manual' | 'link' | 'photo' | 'email' | 'discover' | 'seed';
export type GroceryListType = 'weekday' | 'shabbat';
export type PrepListType = 'sunday' | 'shabbat';

export interface Profile {
  id: string;
  name: string;
  kosher: boolean;
  onboarding_stage: OnboardingStage;
  first_home_seen: boolean;
  guest_count: number;
  ai_index: number;
  ai_added: boolean;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  user_id: string;
  name: string;
  age: string;
  note: string;
  sort_order: number;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  body: string;
  kosher: KosherType;
  both_audiences: boolean;
  source: RecipeSource;
  image_url: string | null;
  created_at: string;
}

export interface Base {
  id: string;
  user_id: string;
  key: string;
  label: string;
}

export interface WeekdayMeal {
  id: string;
  user_id: string;
  day_key: string;
  day_label: string;
  kosher: KosherType;
  family_desc: string;
  kids_desc: string;
  stealth_veg: string | null;
  is_leftover: boolean;
  base_key: string | null;
  is_skipped: boolean;
  skip_label: string | null;
  sort_order: number;
}

export interface ShabbatMeal {
  id: string;
  user_id: string;
  meal_key: string;
  day_label: string;
  has_guests: boolean;
  kosher: KosherType;
  sort_order: number;
}

export interface ShabbatCourse {
  id: string;
  user_id: string;
  shabbat_meal_id: string;
  course_name: string;
  family_desc: string;
  kids_desc: string | null;
  stealth_veg: string | null;
  sort_order: number;
}

export interface GroceryItem {
  id: string;
  user_id: string;
  list_type: GroceryListType;
  aisle: string;
  name: string;
  have: boolean;
  sort_order: number;
}

export interface PrepItem {
  id: string;
  user_id: string;
  list_type: PrepListType;
  section: string;
  label: string;
  minutes: number | null;
  done: boolean;
  sort_order: number;
}

export interface DiscoverRecipe {
  id: string;
  user_id: string;
  creator: string;
  title: string;
  note: string;
  match_pct: number;
  saved: boolean;
  added_to_library: boolean;
  sort_order: number;
}

export interface AiSuggestion {
  id: string;
  user_id: string;
  title: string;
  base_line: string;
  note: string;
  sort_order: number;
}

// Note: these interfaces are used as plain domain types (hooks cast query
// results to them explicitly) rather than wired into createClient<Database>().
// The installed @supabase/postgrest-js has a much stricter generic
// type-inference system (RejectExcessProperties, select-query-parser) than
// earlier versions; a hand-written schema here isn't worth chasing its exact
// structural requirements when every call site already casts its result.
