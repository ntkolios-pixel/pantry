import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeEdgeFunction } from '../lib/invokeEdgeFunction';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentWeekStart } from '../lib/dates';

/** Calls the generate-weekly-plan Edge Function, which asks Claude to build a
 * full week (bases, weekday meals, Shabbat, groceries, prep, AI suggestions)
 * from the caller's own recipes and household preferences, then refreshes
 * every screen that reads plan data. Tags the new plan with the current
 * real-world week (Sunday's date) so the app can later tell when a new week
 * has started. */
export function useGenerateWeeklyPlan() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => invokeEdgeFunction('generate-weekly-plan', { week_start: getCurrentWeekStart() }),
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
