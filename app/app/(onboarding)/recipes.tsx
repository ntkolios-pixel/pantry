import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { PrimaryButton, Screen, StepLabel } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useAddRecipe, useRecipes } from '../../hooks/useRecipes';
import { useGenerateWeeklyPlan } from '../../hooks/useGeneratePlan';

export default function Recipes() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const { data: recipes } = useRecipes();
  const addRecipe = useAddRecipe();
  const generatePlan = useGenerateWeeklyPlan();

  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    addRecipe.mutate({ title: trimmed, source: 'manual' });
    setTitle('');
  }

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
    <Screen scroll={false} contentStyle={{ justifyContent: 'center', gap: 22 }}>
      <View>
        <StepLabel step={4} of={4} />
        <Text style={styles.title}>Add a few recipes</Text>
        <Text style={styles.body}>
          Start your library so we can build a plan around meals you already make. Add more anytime.
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {(recipes ?? [])
          .filter((r) => r.source === 'manual')
          .map((r) => (
            <View key={r.id} style={styles.addedRow}>
              <Text style={styles.addedTitle}>{r.title}</Text>
              <Text style={styles.addedLabel}>Added</Text>
            </View>
          ))}
        <View style={styles.inputRow}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Recipe title"
            placeholderTextColor={colors.inkFaint}
            onSubmitEditing={submit}
            style={styles.input}
          />
          <Pressable onPress={submit} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

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
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    backgroundColor: colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: colors.paper, fontSize: 19, fontWeight: '600' },
  error: { color: colors.rust, fontSize: 12.5, fontFamily: fonts.ui },
  hint: { color: colors.inkSoft, fontSize: 12, lineHeight: 17, fontFamily: fonts.ui },
});
