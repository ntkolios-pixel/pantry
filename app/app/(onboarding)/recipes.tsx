import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radii } from '../../constants/theme';
import { BackLink, PrimaryButton, Screen, StepLabel } from '../../components/ui';
import { RecipeCapture } from '../../components/RecipeCapture';
import { useAuth } from '../../contexts/AuthContext';
import { useRecipes } from '../../hooks/useRecipes';
import { useGenerateWeeklyPlan } from '../../hooks/useGeneratePlan';

export default function Recipes() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const { data: recipes } = useRecipes();
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
              <Text style={styles.addedTitle}>{r.title}</Text>
              <Text style={styles.addedLabel}>Added</Text>
            </View>
          ))}
        </View>
      ) : null}

      <RecipeCapture />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {generatePlan.isPending ? (
        <Text style={styles.hint}>Building your week — reading your recipes and preferences, this can take a moment…</Text>
      ) : null}

      <PrimaryButton label="Start planning" onPress={start} loading={generatePlan.isPending} style={{ marginTop: 6 }} />
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
  addedTitle: { fontSize: 13.5, color: colors.ink, fontFamily: fonts.ui },
  addedLabel: { fontSize: 11, color: colors.inkFaint, fontFamily: fonts.ui },
  error: { color: colors.rust, fontSize: 12.5, fontFamily: fonts.ui },
  hint: { color: colors.inkSoft, fontSize: 12, lineHeight: 17, fontFamily: fonts.ui },
});
