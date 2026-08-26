import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { GroceryItem, GroceryListType } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

export function useGroceryItems(listType: GroceryListType) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['grocery_items', user?.id, listType],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('list_type', listType)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as GroceryItem[];
    },
  });
}

export function useToggleGroceryItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, have }: { id: string; have: boolean }) => {
      const { error } = await supabase.from('grocery_items').update({ have }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grocery_items', user?.id] }),
  });
}
