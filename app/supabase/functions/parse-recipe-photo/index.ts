// Reads one or more photos of a recipe (e.g. a handwritten card, a cookbook
// page, a screenshot) and extracts a clean title + ingredients/steps, using
// Claude's vision. Photos are expected to already be uploaded (public URLs
// in the recipe-photos storage bucket) by the time this runs.
//
// Deploy: supabase functions deploy parse-recipe-photo
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

async function imageUrlToBase64(url: string): Promise<{ data: string; mediaType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download a photo (${res.status}).`);
  const mediaType = res.headers.get('content-type') || 'image/jpeg';
  const buf = await res.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { data: btoa(binary), mediaType };
}

async function callClaude(images: { data: string; mediaType: string }[]) {
  const content = [
    ...images.map((img) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    })),
    {
      type: 'text',
      text:
        images.length > 1
          ? 'These photos are pages of one recipe (a handwritten card, a cookbook page, or a screenshot). Read all of them together and produce one clean recipe: a short specific title, and the ingredients and steps as readable plain text.'
          : 'This photo shows a recipe (a handwritten card, a cookbook page, or a screenshot). Read it and produce a clean recipe: a short specific title, and the ingredients and steps as readable plain text.',
    },
  ];

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
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }
  const data = await response.json();
  if (data.stop_reason === 'refusal') throw new Error('The model declined to read this photo.');
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
    const imageUrls: string[] = Array.isArray(body?.image_urls) ? body.image_urls : [];
    if (!imageUrls.length) return json({ error: 'No photos provided.' }, 400);

    const images = await Promise.all(imageUrls.map(imageUrlToBase64));
    const result = await callClaude(images);
    return json(result);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error reading those photos.' }, 500);
  }
});
