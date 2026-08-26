import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Recipe, RecipeSource } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

export function useRecipes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recipes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Recipe[];
    },
  });
}

export function useRecipe(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recipes', user?.id, id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('recipes').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Recipe;
    },
  });
}

export interface NewRecipeInput {
  title: string;
  body?: string;
  source: RecipeSource;
  image_url?: string | null;
}

export function useAddRecipe() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewRecipeInput) => {
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: input.title,
          body: input.body ?? '',
          source: input.source,
          image_url: input.image_url ?? null,
          kosher: 'parve',
          both_audiences: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Recipe;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', user?.id] }),
  });
}
