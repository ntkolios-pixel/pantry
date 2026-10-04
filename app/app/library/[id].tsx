import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, kosherStyle } from '../../constants/theme';
import { BackLink, Card, Screen, Tag } from '../../components/ui';
import { useRecipe, useRemoveRecipe } from '../../hooks/useRecipes';

export default function LibraryDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe } = useRecipe(id);
  const removeRecipe = useRemoveRecipe();

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

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 16, gap: 14 }}>
      <View style={styles.headerRow}>
        <BackLink label="← Back to library" onPress={() => router.back()} />
        <Pressable onPress={confirmDelete} hitSlop={8}>
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Tag bg={k.bg} fg={k.fg} label={k.label} />
        <Tag bg={colors.line} fg={colors.inkSoft} label={recipe.both_audiences ? 'Family + kids' : 'Everyone'} />
      </View>
      <Text style={styles.title}>{recipe.title}</Text>
      {recipe.body ? (
        <Card>
          <Text style={styles.body}>{recipe.body}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deleteLabel: { fontSize: 13, color: colors.rust, fontFamily: fonts.ui },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 24, color: colors.ink, lineHeight: 29 },
  body: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 20, fontFamily: fonts.ui },
});
