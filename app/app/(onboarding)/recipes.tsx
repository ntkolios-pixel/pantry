import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii } from '../../constants/theme';
import { BackLink, Card, PrimaryButton, Screen, SecondaryButton, StepLabel } from '../../components/ui';
import { RecipeCapture } from '../../components/RecipeCapture';
import { useAuth } from '../../contexts/AuthContext';
import { useRecipes, useRemoveRecipe, useUpdateRecipe } from '../../hooks/useRecipes';
import { useGenerateWeeklyPlan } from '../../hooks/useGeneratePlan';
import type { Recipe } from '../../lib/database.types';

function AddedRecipeRow({ recipe }: { recipe: Recipe }) {
  const updateRecipe = useUpdateRecipe();
  const removeRecipe = useRemoveRecipe();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(recipe.title);
  const [body, setBody] = useState(recipe.body);

  function save() {
    if (!title.trim()) return;
    updateRecipe.mutate(
      { id: recipe.id, patch: { title: title.trim(), body } },
      { onSuccess: () => setEditing(false) }
    );
  }

  function cancel() {
    setTitle(recipe.title);
    setBody(recipe.body);
    setEditing(false);
  }

  if (editing) {
    return (
      <View style={[styles.addedRow, { flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe title"
          placeholderTextColor={colors.inkFaint}
          style={styles.editInput}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Ingredients and steps"
          placeholderTextColor={colors.inkFaint}
          multiline
          numberOfLines={4}
          style={[styles.editInput, styles.editTextarea]}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SecondaryButton label="Cancel" onPress={cancel} style={{ flex: 1 }} />
          <SecondaryButton label="Save" onPress={save} loading={updateRecipe.isPending} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.addedRow}>
      <Pressable style={{ flex: 1 }} onPress={() => setEditing(true)}>
        <Text style={styles.addedTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
      </Pressable>
      <Pressable onPress={() => setEditing(true)} hitSlop={8}>
        <Text style={styles.editLabel}>Edit</Text>
      </Pressable>
      <Pressable onPress={() => removeRecipe.mutate(recipe.id)} hitSlop={8}>
        <Text style={styles.removeLabel}>×</Text>
      </Pressable>
    </View>
  );
}

export default function Recipes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <Screen contentStyle={{ paddingTop: insets.top + 24, gap: 22 }}>
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
            <AddedRecipeRow key={r.id} recipe={r} />
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
  addedTitle: { fontSize: 13.5, color: colors.ink, fontFamily: fonts.ui },
  editLabel: { color: colors.inkSoft, fontSize: 12.5, fontFamily: fonts.ui },
  removeLabel: { color: colors.inkFaint, fontSize: 17 },
  editInput: {
    fontFamily: fonts.ui,
    fontSize: 13.5,
    color: colors.ink,
    backgroundColor: colors.linen,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editTextarea: { textAlignVertical: 'top', minHeight: 70 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.inkFaint, fontFamily: fonts.uiBold },
  error: { color: colors.rust, fontSize: 12.5, fontFamily: fonts.ui },
  hint: { color: colors.inkSoft, fontSize: 12, lineHeight: 17, fontFamily: fonts.ui },
});
