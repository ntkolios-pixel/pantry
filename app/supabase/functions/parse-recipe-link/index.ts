// Turns a pasted link or pasted recipe text into a clean title +
// ingredients/steps, using Claude to read and restructure whatever was
// pasted. For a bare link, fetches the page server-side first (Claude can't
// browse the web itself) and hands Claude the page's text content.
//
// Deploy: supabase functions deploy parse-recipe-link
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
    title: { type: 'string', description: 'A short, specific recipe title.' },
    body: { type: 'string', description: 'Ingredients and steps, formatted as readable plain text.' },
  },
  required: ['title', 'body'],
  additionalProperties: false,
};

function looksLikeBareUrl(text: string) {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length === 1 && /^https?:\/\//i.test(lines[0]);
}

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PantryApp/1.0)' } });
  if (!res.ok) throw new Error(`Could not open that link (${res.status}). It may require a login or block automated requests.`);
  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) throw new Error('That page had no readable text — it may need a login or be rendered entirely in-app (common for Instagram).');
  return text.slice(0, 20000);
}

async function callClaude(sourceText: string, isUrl: boolean) {
  const prompt = isUrl
    ? `Here is the raw text content of a web page that should contain a recipe (it may include navigation, ads, and other clutter — ignore that). Pull out the actual recipe: a short specific title, and the ingredients and steps as clean, readable plain text. If multiple recipes are present, pick the main one on the page.\n\nPage content:\n${sourceText}`
    : `Here is text a user pasted that should contain a recipe (e.g. copied from a caption, a chat, or typed notes). Turn it into a short specific title, and clean, readable ingredients and steps as plain text. If it's messy or informal, tidy it up but keep all the actual recipe information.\n\nPasted text:\n${sourceText}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-5',
      max_tokens: 4000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }
  const data = await response.json();
  if (data.stop_reason === 'refusal') throw new Error('The model declined to read this content.');
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

    const body = await req.json().catch(() => null);
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) return json({ error: 'No text or link provided.' }, 400);

    const isUrl = looksLikeBareUrl(text);
    const sourceText = isUrl ? await fetchPageText(text) : text;

    const result = await callClaude(sourceText, isUrl);
    return json(result);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error reading that recipe.' }, 500);
  }
});
