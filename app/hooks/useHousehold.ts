import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { HouseholdMember } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

export function useHouseholdMembers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['household_members', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_members')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as HouseholdMember[];
    },
  });
}

export function useAddHouseholdMember() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sortOrder: number) => {
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('household_members')
        .insert({ user_id: user.id, name: '', age: '', note: '', sort_order: sortOrder })
        .select()
        .single();
      if (error) throw error;
      return data as HouseholdMember;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household_members', user?.id] }),
  });
}

export function useUpdateHouseholdMember() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<HouseholdMember> }) => {
      const { error } = await supabase.from('household_members').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household_members', user?.id] }),
  });
}

export function useRemoveHouseholdMember() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('household_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household_members', user?.id] }),
  });
}
