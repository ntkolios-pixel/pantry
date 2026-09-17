// Generates a full week's plan (Sunday-prep bases, weekday dinners, Shabbat
// courses, groceries, and prep checklists) tailored to the caller's own
// recipe library and household preferences, using Claude to find ways to
// batch-cook one component and reuse it across multiple meals in different
// forms during the week.
//
// Deploy: supabase functions deploy generate-weekly-plan
// Requires the ANTHROPIC_API_KEY secret — see supabase/README.md.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function nullable(schema: Record<string, unknown>) {
  return { anyOf: [schema, { type: 'null' }] };
}

const KOSHER_ENUM = { type: 'string', enum: ['meat', 'dairy', 'parve'] };

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    bases: {
      type: 'array',
      description:
        "4-6 components to batch-cook once (e.g. Sunday) and reuse across multiple meals in different forms during the week — the heart of this plan.",
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'short slug, e.g. "b1"' },
          label: { type: 'string', description: 'e.g. "Roasted chicken (Sunday batch)"' },
        },
        required: ['key', 'label'],
        additionalProperties: false,
      },
    },
    weekday_meals: {
      type: 'array',
      description: '4-6 weekday dinners (Sun-Thu). At least half should reuse a base_key, each in a different form.',
      items: {
        type: 'object',
        properties: {
          day_key: { type: 'string', description: 'e.g. "sun", "mon"' },
          day_label: { type: 'string', description: 'e.g. "Sun"' },
          kosher: KOSHER_ENUM,
          family_desc: { type: 'string', description: "The full family's version of the meal." },
          kids_desc: {
            type: 'string',
            description:
              "The kid-friendly version — identical text to family_desc if there is no meaningful difference.",
          },
          stealth_veg: nullable({
            type: 'string',
            description: 'A vegetable hidden/blended into the dish for picky eaters, if applicable.',
          }),
          is_leftover: { type: 'boolean', description: 'True if this slot is simply reheating an earlier meal.' },
          base_key: nullable({ type: 'string', description: 'A key from bases[], if this meal reuses one.' }),
        },
        required: ['day_key', 'day_label', 'kosher', 'family_desc', 'kids_desc', 'stealth_veg', 'is_leftover', 'base_key'],
        additionalProperties: false,
      },
    },
    shabbat_meals: {
      type: 'array',
      description: 'Exactly 2 entries: Friday night (has_guests true) and Saturday lunch (has_guests false).',
      items: {
        type: 'object',
        properties: {
          meal_key: { type: 'string', description: 'e.g. "fri" or "sat"' },
          day_label: { type: 'string', description: 'e.g. "Fri night" or "Sat lunch"' },
          has_guests: { type: 'boolean' },
          kosher: KOSHER_ENUM,
          courses: {
            type: 'array',
            description:
              'Wine & grape juice, Challah & dips, Mains, Starch sides, Veg sides, Salads, Dessert — in that order.',
            items: {
              type: 'object',
              properties: {
                course_name: { type: 'string' },
                family_desc: { type: 'string' },
                kids_desc: nullable({ type: 'string' }),
                stealth_veg: nullable({ type: 'string' }),
              },
              required: ['course_name', 'family_desc', 'kids_desc', 'stealth_veg'],
              additionalProperties: false,
            },
          },
        },
        required: ['meal_key', 'day_label', 'has_guests', 'kosher', 'courses'],
        additionalProperties: false,
      },
    },
    grocery_items: {
      type: 'array',
      description:
        'Every ingredient the meals above actually need, grouped into aisles, split into weekday vs. shabbat lists. Reused bases should appear once, not once per meal that uses them.',
      items: {
        type: 'object',
        properties: {
          list_type: { type: 'string', enum: ['weekday', 'shabbat'] },
          aisle: { type: 'string', description: 'e.g. "Produce", "Meat & fish", "Dairy", "Pantry"' },
          name: { type: 'string' },
        },
        required: ['list_type', 'aisle', 'name'],
        additionalProperties: false,
      },
    },
    prep_items: {
      type: 'array',
      description:
        'Sunday prep tasks (for the weekday meals, grouped by technique like "Chop & prep" / "Cook now, use later" / "Freeze & portion") and Thu/Fri prep tasks (for Shabbat, grouped by day).',
      items: {
        type: 'object',
        properties: {
          list_type: { type: 'string', enum: ['sunday', 'shabbat'] },
          section: { type: 'string' },
          label: { type: 'string' },
          minutes: nullable({ type: 'integer' }),
        },
        required: ['list_type', 'section', 'label', 'minutes'],
        additionalProperties: false,
      },
    },
    ai_suggestions: {
      type: 'array',
      description: '2-3 extra meal ideas that also remix the same bases, for future weeks.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          base_line: { type: 'string', description: 'Which base(s) this idea reuses.' },
          note: { type: 'string' },
        },
        required: ['title', 'base_line', 'note'],
        additionalProperties: false,
      },
    },
  },
  required: ['bases', 'weekday_meals', 'shabbat_meals', 'grocery_items', 'prep_items', 'ai_suggestions'],
  additionalProperties: false,
};

interface RecipeRow {
  title: string;
  body: string | null;
  kosher: string;
  both_audiences: boolean;
}
interface MemberRow {
  name: string;
  age: string;
  note: string;
}

function buildPrompt(recipes: RecipeRow[], members: MemberRow[], kosher: boolean) {
  const recipeList = recipes
    .map((r) => `- ${r.title} (${r.kosher}${r.both_audiences ? '' : ', family-only'})${r.body ? `: ${r.body}` : ''}`)
    .join('\n');
  const memberList = members.length
    ? members.map((m) => `- ${m.name || 'Unnamed'} (${m.age || 'age unknown'}): ${m.note || 'no notes yet'}`).join('\n')
    : '- No household preferences recorded yet.';

  return `You are planning one week of home cooking for a family. Your main job is to find real opportunities to batch-cook a component once and reuse it in different forms across multiple meals during the week — e.g. a big batch of rice on Sunday becomes a side Monday and gets fried into a stir-fry Wednesday; a roasted chicken becomes Tuesday's dinner and Thursday's soup base. This reuse is the whole point of the plan, not a decoration — at least half the weekday dinners should draw on a shared base.

Household eats ${kosher ? 'kosher (tag every meal meat/dairy/parve, and never mix meat and dairy in the same dish)' : 'no kosher restrictions — still fill in a meat/dairy/parve tag for consistency, defaulting to parve when it does not apply'}.

Household members and their preferences/allergies/dislikes:
${memberList}

Recipes already in their library (prefer these; you may also invent close variations or new ideas, especially for remixing a base into a new form):
${recipeList || '- (empty — invent a reasonable starter set)'}

Build:
1. bases: 4-6 batch-cook components for Sunday.
2. weekday_meals: 4-6 dinners (Sun-Thu), reusing bases across at least half of them in genuinely different forms (not the same dish twice). Give a family version and, where the household includes children, a simpler kid version with a stealth-vegetable idea where natural — otherwise repeat family_desc as kids_desc and leave stealth_veg null.
3. shabbat_meals: Friday night (with guests) and Saturday lunch, each broken into courses.
4. grocery_items: exactly what those meals need, grouped by aisle, split weekday vs. shabbat — do not list a reused base's ingredients more than once.
5. prep_items: the Sunday batch-cooking steps and the Thursday/Friday Shabbat-cooking steps implied by the meals above.
6. ai_suggestions: 2-3 more ideas reusing the same bases, for next time.

Respect any allergies or dislikes noted above. Keep descriptions concrete (name the actual dish), not generic.`;
}

async function callClaude(prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-5',
      max_tokens: 12000,
      // Medium effort: this is one-shot JSON generation, not long-horizon
      // agentic work, and Edge Functions have a wall-clock budget — high/max
      // effort's extra thinking time risks the function timing out.
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: PLAN_SCHEMA } },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (data.stop_reason === 'refusal') {
    throw new Error('The model declined to generate a plan for this request.');
  }
  if (data.stop_reason === 'max_tokens') {
    throw new Error('The generated plan was too long and got cut off — please try again.');
  }
  const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === 'text');
  if (!textBlock) throw new Error('No text content in Claude response.');
  return JSON.parse(textBlock.text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    if (!ANTHROPIC_API_KEY) {
      return json(
        { error: 'ANTHROPIC_API_KEY is not set for this project. See supabase/README.md.' },
        500
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Not authenticated' }, 401);

    const [{ data: recipes }, { data: members }, { data: profile }] = await Promise.all([
      supabase.from('recipes').select('title, body, kosher, both_audiences'),
      supabase.from('household_members').select('name, age, note').order('sort_order'),
      supabase.from('profiles').select('kosher').eq('id', user.id).single(),
    ]);

    if (!recipes || recipes.length === 0) {
      return json(
        { error: 'Add at least one recipe to your library before building a week — Claude uses it as a starting point.' },
        400
      );
    }

    const prompt = buildPrompt(recipes as RecipeRow[], (members ?? []) as MemberRow[], profile?.kosher ?? true);
    const plan = await callClaude(prompt);

    // Replace any previously generated plan. RLS already scopes every table
    // to this user, so "match everything" here only ever touches their rows.
    const { data: existingShabbatMeals } = await supabase.from('shabbat_meals').select('id');
    if (existingShabbatMeals?.length) {
      await supabase
        .from('shabbat_courses')
        .delete()
        .in('shabbat_meal_id', existingShabbatMeals.map((m: { id: string }) => m.id));
    }
    await Promise.all([
      supabase.from('shabbat_meals').delete().not('id', 'is', null),
      supabase.from('weekday_meals').delete().not('id', 'is', null),
      supabase.from('bases').delete().not('id', 'is', null),
      supabase.from('grocery_items').delete().not('id', 'is', null),
      supabase.from('prep_items').delete().not('id', 'is', null),
      supabase.from('ai_suggestions').delete().not('id', 'is', null),
    ]);

    const validBaseKeys = new Set((plan.bases ?? []).map((b: { key: string }) => b.key));
    const safeBaseKey = (key: string | null) => (key && validBaseKeys.has(key) ? key : null);

    if (plan.bases?.length) {
      await supabase.from('bases').insert(plan.bases.map((b: { key: string; label: string }) => ({ ...b, user_id: user.id })));
    }

    if (plan.weekday_meals?.length) {
      await supabase.from('weekday_meals').insert(
        plan.weekday_meals.map((m: Record<string, unknown>, i: number) => ({
          user_id: user.id,
          day_key: m.day_key,
          day_label: m.day_label,
          kosher: m.kosher,
          family_desc: m.family_desc,
          kids_desc: m.kids_desc,
          stealth_veg: m.stealth_veg,
          is_leftover: m.is_leftover,
          base_key: safeBaseKey(m.base_key as string | null),
          sort_order: i,
        }))
      );
    }

    for (let i = 0; i < (plan.shabbat_meals ?? []).length; i++) {
      const m = plan.shabbat_meals[i];
      const { data: inserted, error: insertErr } = await supabase
        .from('shabbat_meals')
        .insert({
          user_id: user.id,
          meal_key: m.meal_key,
          day_label: m.day_label,
          has_guests: m.has_guests,
          kosher: m.kosher,
          sort_order: i,
        })
        .select('id')
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error('Failed to insert shabbat meal');

      if (m.courses?.length) {
        await supabase.from('shabbat_courses').insert(
          m.courses.map((c: Record<string, unknown>, j: number) => ({
            user_id: user.id,
            shabbat_meal_id: inserted.id,
            course_name: c.course_name,
            family_desc: c.family_desc,
            kids_desc: c.kids_desc,
            stealth_veg: c.stealth_veg,
            sort_order: j,
          }))
        );
      }
    }

    if (plan.grocery_items?.length) {
      await supabase.from('grocery_items').insert(
        plan.grocery_items.map((g: Record<string, unknown>, i: number) => ({ ...g, user_id: user.id, sort_order: i }))
      );
    }
    if (plan.prep_items?.length) {
      await supabase.from('prep_items').insert(
        plan.prep_items.map((p: Record<string, unknown>, i: number) => ({ ...p, user_id: user.id, sort_order: i }))
      );
    }
    if (plan.ai_suggestions?.length) {
      await supabase.from('ai_suggestions').insert(
        plan.ai_suggestions.map((a: Record<string, unknown>, i: number) => ({ ...a, user_id: user.id, sort_order: i }))
      );
    }

    // Fresh plan means the AI-pick cursor and any per-item edits (skips,
    // guest count, course text) from the old plan no longer apply.
    await supabase
      .from('profiles')
      .update({ ai_index: 0, ai_added: false, guest_count: 4 })
      .eq('id', user.id);

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error generating the plan.' }, 500);
  }
});
