import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, kosherStyle, radii } from '../../constants/theme';
import { BackLink, Card, PrimaryButton, Screen, Tag } from '../../components/ui';
import { useRecipe, useRemoveRecipe, useUpdateRecipe } from '../../hooks/useRecipes';

export default function LibraryDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe } = useRecipe(id);
  const removeRecipe = useRemoveRecipe();
  const updateRecipe = useUpdateRecipe();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setBody(recipe.body);
    }
  }, [recipe?.id]);

  if (!recipe) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;

  const k = kosherStyle[recipe.kosher];

  function confirmDelete() {
    Alert.alert('Delete this recipe?', `"${recipe!.title}" will be removed from your library.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeRecipe.mutate(recipe!.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  function saveEdit() {
    if (!title.trim()) return;
    updateRecipe.mutate(
      { id: recipe!.id, patch: { title: title.trim(), body } },
      { onSuccess: () => setEditing(false) }
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 16, gap: 14 }}>
      <View style={styles.headerRow}>
        <BackLink label="← Back to library" onPress={() => router.back()} />
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {editing ? null : (
            <Pressable onPress={() => setEditing(true)} hitSlop={8}>
              <Text style={styles.editLabel}>Edit</Text>
            </Pressable>
          )}
          <Pressable onPress={confirmDelete} hitSlop={8}>
            <Text style={styles.deleteLabel}>Delete</Text>
          </Pressable>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Tag bg={k.bg} fg={k.fg} label={k.label} />
        <Tag bg={colors.line} fg={colors.inkSoft} label={recipe.both_audiences ? 'Family + kids' : 'Everyone'} />
      </View>

      {editing ? (
        <View style={{ gap: 10 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Recipe title"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Ingredients and steps"
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={8}
            style={[styles.input, styles.textarea]}
          />
          <PrimaryButton label="Save changes" onPress={saveEdit} loading={updateRecipe.isPending} />
        </View>
      ) : (
        <>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.body ? (
            <Card>
              <Text style={styles.body}>{recipe.body}</Text>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editLabel: { fontSize: 13, color: colors.inkSoft, fontFamily: fonts.ui },
  deleteLabel: { fontSize: 13, color: colors.rust, fontFamily: fonts.ui },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 24, color: colors.ink, lineHeight: 29 },
  body: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 20, fontFamily: fonts.ui },
  input: {
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
  textarea: { textAlignVertical: 'top', minHeight: 140 },
});
