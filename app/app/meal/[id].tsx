import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, kosherStyle } from '../../constants/theme';
import { BackLink, Card, PrimaryButton, Screen, Tag } from '../../components/ui';
import { useBases, useWeekdayMeal } from '../../hooks/usePlan';
import { useAuth } from '../../contexts/AuthContext';
import { formatWeekdayDate } from '../../lib/dates';

export default function MealDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: meal } = useWeekdayMeal(id);
  const { data: bases } = useBases();
  const { profile } = useAuth();

  if (!meal) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;

  const k = kosherStyle[meal.kosher];
  const hasBoth = !meal.is_leftover && meal.family_desc !== meal.kids_desc;
  const baseLabel = meal.base_key ? bases?.find((b) => b.key === meal.base_key)?.label ?? null : null;
  const dayLabel = formatWeekdayDate(profile?.current_week_start, meal.day_key, meal.day_label);

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 16 }}>
      <BackLink label="← Back to plan" onPress={() => router.back()} />
      <View style={styles.headerRow}>
        <Text style={styles.dayLabel}>{dayLabel}</Text>
        <Tag bg={k.bg} fg={k.fg} label={k.label} />
      </View>
      <Text style={styles.title}>{meal.family_desc}</Text>

      {hasBoth ? (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Kids get</Text>
          <Text style={styles.sectionBody}>{meal.kids_desc}</Text>
        </View>
      ) : null}
      {baseLabel ? (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>♻ Sunday prep</Text>
          <Text style={styles.sectionBody}>{baseLabel}</Text>
        </View>
      ) : null}
      {meal.stealth_veg ? (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.ink }]}>✦ Stealth veg</Text>
          <Text style={styles.sectionBody}>{meal.stealth_veg}</Text>
        </View>
      ) : null}

      <Card style={{ marginTop: 8 }}>
        <Text style={styles.libraryNote}>Full ingredients and steps for this recipe live in your Library.</Text>
        <PrimaryButton label="Open in Library" onPress={() => router.push('/(tabs)/library')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6 },
  dayLabel: { fontSize: 12, fontWeight: '700', color: colors.inkSoft, fontFamily: fonts.uiBold },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 24, color: colors.ink, lineHeight: 29, marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.marigoldInk,
    marginBottom: 5,
    fontFamily: fonts.uiBold,
  },
  sectionBody: { fontSize: 14, color: colors.inkSoft, lineHeight: 20, fontFamily: fonts.ui },
  libraryNote: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 18, marginBottom: 10, fontFamily: fonts.ui },
});
