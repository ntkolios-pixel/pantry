// Suggests a handful of new recipe ideas based on the caller's own library
// and household preferences, using Claude. Replaces any previously
// generated (but not saved) suggestions each time it runs.
//
// Deploy: supabase functions deploy generate-discover
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

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      description: '5 new recipe ideas this household does not already have in their library.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          note: { type: 'string', description: 'One sentence on why this fits their tastes.' },
          match_pct: { type: 'integer', description: 'Your own honest estimate, 70-98, of how well this fits them.' },
        },
        required: ['title', 'note', 'match_pct'],
        additionalProperties: false,
      },
    },
  },
  required: ['suggestions'],
  additionalProperties: false,
};

interface RecipeRow {
  title: string;
  kosher: string;
}
interface MemberRow {
  name: string;
  age: string;
  note: string;
}

function buildPrompt(recipes: RecipeRow[], members: MemberRow[], kosher: boolean) {
  const recipeList = recipes.map((r) => `- ${r.title} (${r.kosher})`).join('\n') || '- (library is empty)';
  const memberList = members.length
    ? members.map((m) => `- ${m.name || 'Unnamed'} (${m.age || 'age unknown'}): ${m.note || 'no notes yet'}`).join('\n')
    : '- No household preferences recorded yet.';

  return `Suggest 5 new recipe ideas for this household to discover — dishes they do NOT already have in their library, but that fit their tastes and cooking style based on what's there.

Household eats ${kosher ? 'kosher' : 'no kosher restrictions'}.

Household members and preferences:
${memberList}

Recipes already in their library:
${recipeList}

For each suggestion give a specific, appetizing title, a one-sentence note on why it fits, and your own honest estimate (70-98) of how well it matches their tastes.`;
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
      max_tokens: 3000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }
  const data = await response.json();
  if (data.stop_reason === 'refusal') throw new Error('The model declined to generate suggestions.');
  const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === 'text');
  if (!textBlock) throw new Error('No text content in Claude response.');
  return JSON.parse(textBlock.text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    if (!ANTHROPIC_API_KEY) {
      return json({ error: 'ANTHROPIC_API_KEY is not set for this project. See supabase/README.md.' }, 500);
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
      supabase.from('recipes').select('title, kosher'),
      supabase.from('household_members').select('name, age, note').order('sort_order'),
      supabase.from('profiles').select('kosher').eq('id', user.id).single(),
    ]);

    const prompt = buildPrompt((recipes ?? []) as RecipeRow[], (members ?? []) as MemberRow[], profile?.kosher ?? true);
    const { suggestions } = await callClaude(prompt);

    // Clear out old, unsaved suggestions so the feed doesn't just keep growing.
    await supabase.from('discover_recipes').delete().eq('saved', false);

    if (suggestions?.length) {
      await supabase.from('discover_recipes').insert(
        suggestions.map((s: { title: string; note: string; match_pct: number }, i: number) => ({
          user_id: user.id,
          creator: 'Pantry AI',
          title: s.title,
          note: s.note,
          match_pct: s.match_pct,
          sort_order: i,
        }))
      );
    }

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error generating suggestions.' }, 500);
  }
});
