import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PrepItem, PrepListType } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

export function usePrepItems(listType: PrepListType) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['prep_items', user?.id, listType],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prep_items')
        .select('*')
        .eq('list_type', listType)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PrepItem[];
    },
  });
}

/** All Sunday prep items regardless of section — used for the Home tab's remaining-task count. */
export function useAllSundayPrepItems() {
  return usePrepItems('sunday');
}

export function useTogglePrepItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from('prep_items').update({ done }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prep_items', user?.id] }),
  });
}
