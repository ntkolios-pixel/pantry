import { supabase } from './supabase';

/** Calls a Supabase Edge Function and throws with the function's own JSON
 * error message when available, since supabase-js only gives a generic
 * "non-2xx status code" message by default. */
export async function invokeEdgeFunction<T = unknown>(name: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, body ? { body } : undefined);
  if (error) {
    const context = (error as { context?: Response }).context;
    let specificMessage: string | null = null;
    if (context) {
      try {
        const errBody = await context.json();
        specificMessage = errBody?.error ?? null;
      } catch {
        // response wasn't JSON — fall through to the generic error below
      }
    }
    throw new Error(specificMessage ?? error.message);
  }
  if ((data as { error?: string } | null)?.error) throw new Error((data as { error: string }).error);
  return data as T;
}
