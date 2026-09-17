import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { Header } from '../../components/Header';
import { ChevronRight, PrimaryButton, Screen, SecondaryButton, SectionLabel } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useRecipes } from '../../hooks/useRecipes';
import { useHouseholdMembers } from '../../hooks/useHousehold';
import { useWeekdayMeals } from '../../hooks/usePlan';
import { useGroceryItems } from '../../hooks/useGroceries';
import { useAllSundayPrepItems } from '../../hooks/usePrep';
import { useGenerateWeeklyPlan } from '../../hooks/useGeneratePlan';
import { formatWeekOf, getCurrentWeekStart } from '../../lib/dates';

export default function Home() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { data: recipes } = useRecipes();
  const { data: members } = useHouseholdMembers();
  const { data: weekdayMeals } = useWeekdayMeals();
  const { data: weekdayGroceries } = useGroceryItems('weekday');
  const { data: sundayPrep } = useAllSundayPrepItems();
  const generatePlan = useGenerateWeeklyPlan();
  const [buildError, setBuildError] = useState<string | null>(null);
  const [newWeekDismissed, setNewWeekDismissed] = useState(false);

  const firstName = profile?.name.trim().split(' ')[0] || 'Your';
  const isFirstHome = !profile?.first_home_seen;
  const currentWeekStart = getCurrentWeekStart();
  const isNewWeek = !isFirstHome && profile?.current_week_start !== currentWeekStart;

  async function buildFirstWeek() {
    setBuildError(null);
    try {
      await generatePlan.mutateAsync();
      await updateProfile({ first_home_seen: true });
      router.push('/(tabs)/plan');
    } catch (e) {
      setBuildError(e instanceof Error ? e.message : 'Something went wrong building your week.');
    }
  }

  async function buildNewWeek() {
    setBuildError(null);
    try {
      await generatePlan.mutateAsync();
    } catch (e) {
      setBuildError(e instanceof Error ? e.message : 'Something went wrong building your week.');
    }
  }

  if (isFirstHome) {
    const recipeCount = recipes?.length ?? 0;
    const memberCount = members?.length ?? 0;
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <Header title={`Good evening, ${firstName === 'Your' ? 'there' : firstName}`} />
        <Screen>
          <Text style={styles.firstTitle}>
            You&apos;re all set up{profile?.name.trim() ? `, ${firstName}` : ''}
          </Text>
          <Text style={styles.firstSummary}>
            Your library has {recipeCount} recipe{recipeCount === 1 ? '' : 's'} and {memberCount} eater
            {memberCount === 1 ? '' : 's'} with preferences saved. Ready to put together your first week?
          </Text>
          {buildError ? <Text style={styles.buildError}>{buildError}</Text> : null}
          {generatePlan.isPending ? (
            <Text style={styles.buildHint}>Building your week — this can take a moment…</Text>
          ) : null}
          <PrimaryButton
            label="Build my first week"
            onPress={buildFirstWeek}
            loading={generatePlan.isPending}
            style={{ marginTop: 8 }}
          />
          <SecondaryButton label="Add more recipes first" onPress={() => router.push('/(tabs)/library')} />
        </Screen>
      </View>
    );
  }

  const nextMeal = (weekdayMeals ?? []).find((m) => !m.is_skipped);
  const toBuy = (weekdayGroceries ?? []).filter((g) => !g.have).length;
  const prepDone = (sundayPrep ?? []).filter((p) => p.done).length;
  const prepTotal = (sundayPrep ?? []).length;
  const prepRemaining = prepTotal - prepDone;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title={`Good evening, ${firstName === 'Your' ? 'there' : firstName}`} />
      <Screen>
        {isNewWeek && !newWeekDismissed ? (
          <View style={styles.newWeekCard}>
            <Text style={styles.newWeekTitle}>It's a new week</Text>
            <Text style={styles.newWeekBody}>
              Ready to build your plan for the {formatWeekOf(currentWeekStart)}?
            </Text>
            {buildError ? <Text style={styles.buildError}>{buildError}</Text> : null}
            {generatePlan.isPending ? (
              <Text style={styles.buildHint}>Building your week — this can take a moment…</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Pressable onPress={() => setNewWeekDismissed(true)} style={styles.newWeekDismiss} hitSlop={8}>
                <Text style={styles.newWeekDismissText}>Not now</Text>
              </Pressable>
              <PrimaryButton
                label="Build this week's plan"
                onPress={buildNewWeek}
                loading={generatePlan.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={() => nextMeal && router.push(`/meal/${nextMeal.id}`)}
          style={styles.tonightCard}
        >
          <View style={styles.tonightHeader}>
            <Text style={styles.tonightLabel}>Tonight</Text>
            <Text style={styles.tonightChevron}>{'›'}</Text>
          </View>
          <Text style={styles.tonightMeal}>{nextMeal ? nextMeal.family_desc : 'All set — nothing planned yet'}</Text>
        </Pressable>

        <View style={styles.statRow}>
          <Pressable onPress={() => router.push('/(tabs)/groceries')} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.rustSoft }]}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.rust} strokeWidth={1.75}>
                <Circle cx={9} cy={21} r={1} />
                <Circle cx={19} cy={21} r={1} />
                <Path
                  d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L22 6H6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View>
              <Text style={styles.statNumber}>{toBuy}</Text>
              <Text style={styles.statLabel}>Item{toBuy === 1 ? '' : 's'} to buy {'→'}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/prep')} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.slateSoft }]}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={1.75}>
                <Path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <View>
              <Text style={styles.statNumber}>{prepRemaining}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Sunday prep tasks {'→'}</Text>
            </View>
          </Pressable>
        </View>

        <View>
          <SectionLabel style={{ marginBottom: 2 }}>Browse</SectionLabel>
          <View>
            <BrowseRow label="This week's menu" onPress={() => router.push('/(tabs)/plan')} />
            <BrowseRow label="Recipe library" onPress={() => router.push('/(tabs)/library')} />
            <BrowseRow label="Discover more" onPress={() => router.push('/(tabs)/discover')} />
            <BrowseRow label="Eating preferences" onPress={() => router.push('/family')} last />
          </View>
        </View>
      </Screen>
    </View>
  );
}

function BrowseRow({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.browseRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.browseLabel}>{label}</Text>
      <ChevronRight />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  firstTitle: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 23, color: colors.ink, lineHeight: 29, marginBottom: 16 },
  firstSummary: { fontSize: 13, color: colors.inkSoft, lineHeight: 20, marginBottom: 16, fontFamily: fonts.ui },
  buildError: { color: colors.rust, fontSize: 12.5, marginBottom: 10, fontFamily: fonts.ui },
  buildHint: { color: colors.inkSoft, fontSize: 12, lineHeight: 17, marginBottom: 10, fontFamily: fonts.ui },
  newWeekCard: {
    backgroundColor: colors.marigoldSoft,
    borderRadius: radii.xxl,
    padding: 18,
    marginBottom: spacing.xxl,
  },
  newWeekTitle: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 20, color: colors.ink, marginBottom: 4 },
  newWeekBody: { fontSize: 13, color: colors.inkSoft, lineHeight: 19, marginBottom: 10, fontFamily: fonts.ui },
  newWeekDismiss: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  newWeekDismissText: { fontSize: 13, color: colors.inkSoft, fontFamily: fonts.uiSemiBold, fontWeight: '600' },
  tonightCard: { backgroundColor: colors.sageSoft, borderRadius: radii.xxl, padding: 18, marginBottom: spacing.xxl },
  tonightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  tonightLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.marigoldInk, fontFamily: fonts.uiBold },
  tonightChevron: { color: colors.marigoldInk, fontSize: 15 },
  tonightMeal: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 23, color: colors.ink, lineHeight: 29 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.xxl },
  statCard: {
    flex: 1,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 20, fontWeight: '600', color: colors.ink, lineHeight: 23, fontFamily: fonts.uiSemiBold },
  statLabel: { fontSize: 11, color: colors.inkSoft, marginTop: 2, fontFamily: fonts.ui },
  browseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderStyle: 'dashed',
  },
  browseLabel: { fontSize: 14, color: colors.ink, fontFamily: fonts.ui },
});
