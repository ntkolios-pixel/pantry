import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { AiSuggestion, Base, ShabbatCourse, ShabbatMeal, WeekdayMeal } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

export function useBases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bases', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('bases').select('*');
      if (error) throw error;
      return data as Base[];
    },
  });
}

export function useWeekdayMeals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['weekday_meals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekday_meals')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as WeekdayMeal[];
    },
  });
}

export function useWeekdayMeal(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['weekday_meals', user?.id, id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('weekday_meals').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as WeekdayMeal;
    },
  });
}

export function useSetMealSkip() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, skipLabel }: { id: string; skipLabel: string | null }) => {
      const { error } = await supabase
        .from('weekday_meals')
        .update({ is_skipped: !!skipLabel, skip_label: skipLabel })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekday_meals', user?.id] }),
  });
}

export interface ShabbatMealWithCourses extends ShabbatMeal {
  courses: ShabbatCourse[];
}

export function useShabbatMeals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['shabbat_meals', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ShabbatMealWithCourses[]> => {
      const [{ data: meals, error: mealsErr }, { data: courses, error: coursesErr }] = await Promise.all([
        supabase.from('shabbat_meals').select('*').order('sort_order', { ascending: true }),
        supabase.from('shabbat_courses').select('*').order('sort_order', { ascending: true }),
      ]);
      if (mealsErr) throw mealsErr;
      if (coursesErr) throw coursesErr;
      return (meals as ShabbatMeal[]).map((m) => ({
        ...m,
        courses: (courses as ShabbatCourse[]).filter((c) => c.shabbat_meal_id === m.id),
      }));
    },
  });
}

export function useUpdateShabbatCourse() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, family_desc }: { id: string; family_desc: string }) => {
      const { error } = await supabase.from('shabbat_courses').update({ family_desc }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shabbat_meals', user?.id] }),
  });
}

export function useAiSuggestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai_suggestions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as AiSuggestion[];
    },
  });
}
