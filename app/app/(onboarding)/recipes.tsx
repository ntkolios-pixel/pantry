import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radii } from '../../constants/theme';
import { BackLink, Card, PrimaryButton, Screen, StepLabel } from '../../components/ui';
import { RecipeCapture } from '../../components/RecipeCapture';
import { useAuth } from '../../contexts/AuthContext';
import { useRecipes, useRemoveRecipe } from '../../hooks/useRecipes';
import { useGenerateWeeklyPlan } from '../../hooks/useGeneratePlan';

export default function Recipes() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const { data: recipes } = useRecipes();
  const removeRecipe = useRemoveRecipe();
  const generatePlan = useGenerateWeeklyPlan();

  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    try {
      await generatePlan.mutateAsync();
      await updateProfile({ onboarding_stage: 'app' });
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong building your week.');
    }
  }

  return (
    <Screen contentStyle={{ gap: 22 }}>
      <View>
        <BackLink label="← Back" onPress={() => router.replace('/(onboarding)/setup')} />
        <View style={{ height: 10 }} />
        <StepLabel step={4} of={4} />
        <Text style={styles.title}>Add a few recipes</Text>
        <Text style={styles.body}>
          Start your library so we can build a plan around meals you already make. Add more anytime.
        </Text>
      </View>

      {(recipes ?? []).length > 0 ? (
        <View style={{ gap: 8 }}>
          {(recipes ?? []).map((r) => (
            <View key={r.id} style={styles.addedRow}>
              <Text style={styles.addedTitle} numberOfLines={1}>
                {r.title}
              </Text>
              <Pressable onPress={() => removeRecipe.mutate(r.id)} hitSlop={8}>
                <Text style={styles.removeLabel}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Card style={{ gap: 16 }}>
        <Text style={styles.cardLabel}>Add a recipe</Text>
        <RecipeCapture embedded />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {generatePlan.isPending ? (
        <Text style={styles.hint}>Building your week — reading your recipes and preferences, this can take a moment…</Text>
      ) : null}

      <PrimaryButton label="Start planning" onPress={start} loading={generatePlan.isPending} style={{ marginTop: 14 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 24, color: colors.ink, marginBottom: 6 },
  body: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 19, fontFamily: fonts.ui },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
  },
  addedTitle: { flex: 1, fontSize: 13.5, color: colors.ink, fontFamily: fonts.ui },
  removeLabel: { color: colors.inkFaint, fontSize: 17 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.inkFaint, fontFamily: fonts.uiBold },
  error: { color: colors.rust, fontSize: 12.5, fontFamily: fonts.ui },
  hint: { color: colors.inkSoft, fontSize: 12, lineHeight: 17, fontFamily: fonts.ui },
});
