import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DiscoverRecipe } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

export function useDiscoverRecipes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['discover_recipes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_recipes')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as DiscoverRecipe[];
    },
  });
}

export function useToggleDiscoverSaved() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, saved }: { id: string; saved: boolean }) => {
      const { error } = await supabase.from('discover_recipes').update({ saved }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover_recipes', user?.id] }),
  });
}

export function useAddDiscoverToLibrary() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recipe: DiscoverRecipe) => {
      if (!user) throw new Error('Not signed in');
      const { error: insertErr } = await supabase.from('recipes').insert({
        user_id: user.id,
        title: recipe.title,
        source: 'discover',
        kosher: 'parve',
        both_audiences: true,
      });
      if (insertErr) throw insertErr;
      const { error: updateErr } = await supabase
        .from('discover_recipes')
        .update({ added_to_library: true })
        .eq('id', recipe.id);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discover_recipes', user?.id] });
      qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
    },
  });
}
