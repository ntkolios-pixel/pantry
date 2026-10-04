import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants/theme';
import { BackLink, Screen } from '../../components/ui';
import { RecipeCapture } from '../../components/RecipeCapture';

export default function AddRecipe() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 16 }}>
      <View style={styles.headerRow}>
        <BackLink label="← Back" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Add a recipe</Text>
      </View>

      <RecipeCapture onSaved={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  headerTitle: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 18, color: colors.ink },
});
