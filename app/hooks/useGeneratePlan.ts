import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/** Calls the generate-weekly-plan Edge Function, which asks Claude to build a
 * full week (bases, weekday meals, Shabbat, groceries, prep, AI suggestions)
 * from the caller's own recipes and household preferences, then refreshes
 * every screen that reads plan data. */
export function useGenerateWeeklyPlan() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-weekly-plan');
      if (error) {
        // supabase-js only gives a generic "non-2xx" message here — the actual
        // reason (e.g. "add a recipe first") is in the function's JSON body.
        const context = (error as { context?: Response }).context;
        let specificMessage: string | null = null;
        if (context) {
          try {
            const body = await context.json();
            specificMessage = body?.error ?? null;
          } catch {
            // response wasn't JSON — fall through to the generic error below
          }
        }
        throw new Error(specificMessage ?? error.message);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async () => {
      await refreshProfile();
      qc.invalidateQueries({ queryKey: ['bases', user?.id] });
      qc.invalidateQueries({ queryKey: ['weekday_meals', user?.id] });
      qc.invalidateQueries({ queryKey: ['shabbat_meals', user?.id] });
      qc.invalidateQueries({ queryKey: ['grocery_items', user?.id] });
      qc.invalidateQueries({ queryKey: ['prep_items', user?.id] });
      qc.invalidateQueries({ queryKey: ['ai_suggestions', user?.id] });
    },
  });
}
