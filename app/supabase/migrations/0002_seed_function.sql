-- Seeds a brand-new account with the same starter week the Claude Design
-- prototype shipped with (WEEKDAY_MEALS / SHABBAT_MEALS / groceries / prep /
-- discover feed in project/PhoneApp.dc.html), so the app is immediately
-- explorable right after onboarding instead of opening to empty lists.
-- Runs as the calling user (not security definer) — RLS's own "owner rw"
-- policies are what make every insert land with user_id = auth.uid().
create function public.seed_starter_data()
returns void
language plpgsql
security invoker
as $$
declare
  uid uuid := auth.uid();
  fri_id uuid;
  sat_id uuid;
begin
  if uid is null then
    raise exception 'seed_starter_data() must be called by an authenticated user';
  end if;

  -- idempotent: skip if this user already has a plan
  if exists (select 1 from public.weekday_meals where user_id = uid) then
    return;
  end if;

  insert into public.bases (user_id, key, label) values
    (uid, 'b1', 'Roasted chicken (Sunday batch)'),
    (uid, 'b2', 'Big-batch rice'),
    (uid, 'b3', 'Roasted root veg'),
    (uid, 'b4', 'Tahini-yogurt sauce');

  insert into public.weekday_meals
    (user_id, day_key, day_label, kosher, family_desc, kids_desc, stealth_veg, is_leftover, base_key, sort_order)
  values
    (uid, 'sun', 'Sun', 'parve', 'Pan-seared salmon, roasted broccoli & rice', 'Salmon nuggets, rice, cucumber sticks', 'Cauliflower blended into the rice', false, 'b3', 0),
    (uid, 'mon', 'Mon', 'meat', 'Chicken shawarma bowls, tahini, pickles', 'Plain shawarma chicken, pita, cucumber', null, false, 'b4', 1),
    (uid, 'tue', 'Tue', 'meat', 'Leftovers: Friday roast chicken & rice', 'Leftovers: Friday roast chicken & rice', null, true, 'b1', 2),
    (uid, 'wed', 'Wed', 'parve', 'Tofu veggie stir-fry, soy-ginger sauce', 'Same veg, noodles instead of rice, sauce on the side', 'Shredded zucchini folded into the noodles', false, 'b2', 3),
    (uid, 'thu', 'Thu', 'dairy', 'Pasta, butternut alfredo, parmesan', '"Mac and cheese" — same hidden-squash sauce', 'Butternut squash blended into the sauce', false, null, 4);

  insert into public.shabbat_meals (user_id, meal_key, day_label, has_guests, kosher, sort_order)
  values (uid, 'fri', 'Fri night', true, 'meat', 0)
  returning id into fri_id;

  insert into public.shabbat_courses (user_id, shabbat_meal_id, course_name, family_desc, kids_desc, stealth_veg, sort_order) values
    (uid, fri_id, 'Wine & grape juice', 'Kiddush wine', 'Grape juice, same toast', null, 0),
    (uid, fri_id, 'Challah & dips', 'Fresh challah, hummus, matbucha, techina', null, null, 1),
    (uid, fri_id, 'Mains', 'Herb-roasted chicken, crispy skin', 'Same chicken, deboned and cut small', null, 2),
    (uid, fri_id, 'Starch sides', 'Roasted potatoes & rice', null, null, 3),
    (uid, fri_id, 'Veg sides', 'Roasted carrots & sweet potatoes in the pan gravy', null, 'Carrot & sweet potato puréed right into the gravy', 4),
    (uid, fri_id, 'Salads', 'Israeli salad, cabbage slaw', null, null, 5),
    (uid, fri_id, 'Dessert', 'Chocolate babka bites', null, null, 6);

  insert into public.shabbat_meals (user_id, meal_key, day_label, has_guests, kosher, sort_order)
  values (uid, 'sat', 'Sat lunch', false, 'meat', 1)
  returning id into sat_id;

  insert into public.shabbat_courses (user_id, shabbat_meal_id, course_name, family_desc, kids_desc, stealth_veg, sort_order) values
    (uid, sat_id, 'Wine & grape juice', 'Kiddush wine', 'Grape juice', null, 0),
    (uid, sat_id, 'Challah & dips', 'Leftover challah, hummus', null, null, 1),
    (uid, sat_id, 'Mains', 'Cholent with flanken', 'Cholent potatoes & meat only, no beans', null, 2),
    (uid, sat_id, 'Starch sides', 'Potato kugel', null, null, 3),
    (uid, sat_id, 'Veg sides', 'Roasted cauliflower', null, null, 4),
    (uid, sat_id, 'Salads', 'Israeli salads, pickles', null, null, 5),
    (uid, sat_id, 'Dessert', 'Fruit platter', null, null, 6);

  insert into public.grocery_items (user_id, list_type, aisle, name, sort_order) values
    (uid, 'weekday', 'Produce', 'Broccoli', 0),
    (uid, 'weekday', 'Produce', 'Cauliflower', 1),
    (uid, 'weekday', 'Produce', 'Cucumbers', 2),
    (uid, 'weekday', 'Produce', 'Zucchini', 3),
    (uid, 'weekday', 'Produce', 'Butternut squash', 4),
    (uid, 'weekday', 'Meat & fish', 'Salmon fillets', 5),
    (uid, 'weekday', 'Meat & fish', 'Chicken thighs (shawarma cut)', 6),
    (uid, 'weekday', 'Dairy', 'Parmesan', 7),
    (uid, 'weekday', 'Pantry', 'Rice', 8),
    (uid, 'weekday', 'Pantry', 'Egg noodles', 9),
    (uid, 'weekday', 'Pantry', 'Tahini', 10),
    (uid, 'weekday', 'Pantry', 'Pasta', 11),
    (uid, 'weekday', 'Pantry', 'Firm tofu', 12),
    (uid, 'shabbat', 'Produce', 'Carrots', 0),
    (uid, 'shabbat', 'Produce', 'Sweet potatoes', 1),
    (uid, 'shabbat', 'Produce', 'Potatoes', 2),
    (uid, 'shabbat', 'Produce', 'Tomatoes & cucumbers (salads)', 3),
    (uid, 'shabbat', 'Meat & fish', 'Whole chicken x2', 4),
    (uid, 'shabbat', 'Meat & fish', 'Cholent meat (flanken)', 5),
    (uid, 'shabbat', 'Pantry', 'Challah', 6),
    (uid, 'shabbat', 'Pantry', 'Cholent beans & barley', 7),
    (uid, 'shabbat', 'Pantry', 'Kugel noodles', 8);

  insert into public.prep_items (user_id, list_type, section, label, minutes, sort_order) values
    (uid, 'sunday', 'Chop & prep', 'Dice 2 onions', 5, 0),
    (uid, 'sunday', 'Chop & prep', 'Peel & cube butternut squash', 8, 1),
    (uid, 'sunday', 'Chop & prep', 'Shred zucchini & carrots', 6, 2),
    (uid, 'sunday', 'Chop & prep', 'Wash & cut cucumbers for the week', 5, 3),
    (uid, 'sunday', 'Marinate', 'Shawarma spice rub on chicken (Mon)', 5, 4),
    (uid, 'sunday', 'Cook now, use later', 'Roast squash for Thu''s sauce', 25, 5),
    (uid, 'sunday', 'Cook now, use later', 'Cook a double batch of rice, freeze half', 20, 6),
    (uid, 'sunday', 'Cook now, use later', 'Roast a tray of root veg — base for the week', 30, 7),
    (uid, 'sunday', 'Cook now, use later', 'Whisk tahini-yogurt sauce', 5, 8),
    (uid, 'sunday', 'Freeze & portion', 'Shape & freeze kids'' salmon nuggets', 10, 9),
    (uid, 'sunday', 'Freeze & portion', 'Portion stir-fry veg into containers', 5, 10),
    (uid, 'shabbat', 'Thursday · get ahead', 'Start the cholent base', 15, 0),
    (uid, 'shabbat', 'Thursday · get ahead', 'Herb rub on the Friday chicken', 8, 1),
    (uid, 'shabbat', 'Thursday · get ahead', 'Peel potatoes & sweet potatoes', 10, 2),
    (uid, 'shabbat', 'Thursday · get ahead', 'Make matbucha & salads, chill overnight', 25, 3),
    (uid, 'shabbat', 'Friday · cook & finish', 'Roast the chicken', 70, 4),
    (uid, 'shabbat', 'Friday · cook & finish', 'Roast the root vegetables', 40, 5),
    (uid, 'shabbat', 'Friday · cook & finish', 'Cook rice for the table', 20, 6),
    (uid, 'shabbat', 'Friday · cook & finish', 'Warm challah, plate dips', 10, 7),
    (uid, 'shabbat', 'Friday · cook & finish', 'Set out kiddush wine & grape juice', 2, 8);

  insert into public.discover_recipes (user_id, creator, title, note, match_pct, sort_order) values
    (uid, '@kitchen.by.leah', 'Sheet-pan harissa salmon', 'Uses the salmon + broccoli you already buy', 92, 0),
    (uid, '@noshwithdana', 'Butternut mac, one pot', 'Same hidden-squash trick as your Thursday pasta', 88, 1),
    (uid, '@simplyshabbat', 'Slow-cooker cholent, 15-min prep', 'Swaps in your usual cholent meat cut', 81, 2);

  insert into public.ai_suggestions (user_id, title, base_line, note, sort_order) values
    (uid, 'Chicken & rice stuffed peppers', 'Roasted chicken + big-batch rice', 'A different way to use Tuesday''s leftovers', 0),
    (uid, 'Tahini-roasted veg grain bowl', 'Roasted root veg + tahini sauce', 'Parve, kid-friendly deconstructed on the side', 1),
    (uid, 'Squash & chickpea flatbread', 'Roasted butternut squash', 'Stealth veg built right in', 2);

  insert into public.recipes (user_id, title, kosher, both_audiences, source) values
    (uid, 'Pan-seared salmon', 'parve', true, 'seed'),
    (uid, 'Roasted broccoli', 'parve', false, 'seed'),
    (uid, 'Chicken shawarma', 'meat', true, 'seed'),
    (uid, 'Quick tahini sauce', 'parve', false, 'seed'),
    (uid, 'Tofu veggie stir-fry', 'parve', true, 'seed'),
    (uid, 'Butternut alfredo pasta', 'dairy', true, 'seed'),
    (uid, 'Herb-roasted chicken', 'meat', true, 'seed'),
    (uid, 'Classic challah', 'parve', false, 'seed'),
    (uid, 'Roasted root vegetables', 'parve', false, 'seed'),
    (uid, 'Cholent with flanken', 'meat', true, 'seed'),
    (uid, 'Potato kugel', 'meat', false, 'seed');
end;
$$;

grant execute on function public.seed_starter_data() to authenticated;
