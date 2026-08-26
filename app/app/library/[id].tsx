import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, kosherStyle } from '../../constants/theme';
import { BackLink, Card, Screen, Tag } from '../../components/ui';
import { useRecipe } from '../../hooks/useRecipes';

export default function LibraryDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe } = useRecipe(id);

  if (!recipe) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;

  const k = kosherStyle[recipe.kosher];

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 16, gap: 14 }}>
      <BackLink label="← Back to library" onPress={() => router.back()} />
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
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 24, color: colors.ink, lineHeight: 29 },
  body: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 20, fontFamily: fonts.ui },
});
