import React, { useRef, useState } from 'react';
import { Alert, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, kosherStyle, radii, spacing } from '../../constants/theme';
import { Header } from '../../components/Header';
import { BackLink, Card, PrimaryButton, Screen, SectionLabel, Tag } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import {
  useAiSuggestions,
  useBases,
  useSetMealSkip,
  useShabbatMeals,
  useUpdateShabbatCourse,
  useWeekdayMeals,
} from '../../hooks/usePlan';
import type { WeekdayMeal } from '../../lib/database.types';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { useGenerateWeeklyPlan } from '../../hooks/useGeneratePlan';

export default function Plan() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { data: weekdayMeals } = useWeekdayMeals();
  const { data: bases } = useBases();
  const { data: shabbatMeals } = useShabbatMeals();
  const { data: aiSuggestions } = useAiSuggestions();
  const setSkip = useSetMealSkip();
  const updateCourse = useUpdateShabbatCourse();
  const generatePlan = useGenerateWeeklyPlan();
  const [rebuildError, setRebuildError] = useState<string | null>(null);

  const baseLabel = (key: string | null) => (key ? bases?.find((b) => b.key === key)?.label ?? null : null);

  const aiIndex = profile?.ai_index ?? 0;
  const ai = aiSuggestions && aiSuggestions.length > 0 ? aiSuggestions[aiIndex % aiSuggestions.length] : null;
  const aiAdded = profile?.ai_added ?? false;

  const [guestCountText, setGuestCountText] = useState(String(profile?.guest_count ?? 4));
  const debouncedGuestUpdate = useDebouncedCallback((value: string) => {
    const n = parseInt(value, 10);
    if (!Number.isNaN(n)) updateProfile({ guest_count: n });
  }, 500);

  function confirmRebuild() {
    setRebuildError(null);
    Alert.alert(
      'Rebuild this week?',
      'This replaces your current plan, groceries, and prep checklist with a new AI-generated week based on your library and preferences. Any checked-off items or edits will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rebuild',
          style: 'destructive',
          onPress: () => generatePlan.mutate(undefined, { onError: (e) => setRebuildError(e.message) }),
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="Your Pantry, this week" showSubtitle={false} />
      <Screen contentStyle={{ gap: 14 }}>
        <View style={styles.topRow}>
          <BackLink label="← Home" onPress={() => router.push('/(tabs)/home')} />
          <Pressable onPress={confirmRebuild} disabled={generatePlan.isPending} hitSlop={8}>
            <Text style={styles.rebuildLink}>{generatePlan.isPending ? 'Rebuilding…' : '✦ Rebuild my week'}</Text>
          </Pressable>
        </View>
        {rebuildError ? <Text style={styles.rebuildError}>{rebuildError}</Text> : null}

        <SectionLabel>Weekday · Sun–Thu</SectionLabel>
        {(weekdayMeals ?? []).map((m) => (
          <WeekdayCard
            key={m.id}
            meal={m}
            baseLabel={baseLabel(m.base_key)}
            onOpenDetail={() => router.push(`/meal/${m.id}`)}
            onSkip={() => setSkip.mutate({ id: m.id, skipLabel: 'Skipping this night' })}
            onUndoSkip={() => setSkip.mutate({ id: m.id, skipLabel: null })}
          />
        ))}

        {ai ? (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiPickLabel}>✦ AI PICK</Text>
              <Text style={styles.aiFromLabel}>from your Sunday bases</Text>
            </View>
            <Text style={styles.aiTitle}>{ai.title}</Text>
            <Text style={styles.aiUses}>Uses: {ai.base_line}</Text>
            <Text style={styles.aiNote}>{ai.note}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() =>
                  updateProfile({ ai_index: (aiIndex + 1) % (aiSuggestions?.length ?? 1), ai_added: false })
                }
                style={styles.aiSecondaryButton}
              >
                <Text style={styles.aiSecondaryText}>Suggest another</Text>
              </Pressable>
              <Pressable
                onPress={() => updateProfile({ ai_added: !aiAdded })}
                style={[styles.aiPrimaryButton, { backgroundColor: aiAdded ? colors.inkSoft : colors.syrup }]}
              >
                <Text style={styles.aiPrimaryText}>{aiAdded ? '✓ Added' : '+ Add to plan'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.guestHeaderRow}>
          <SectionLabel>Shabbat · hosting {profile?.guest_count ?? 4}</SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={styles.guestLabel}>Guests</Text>
            <TextInput
              value={guestCountText}
              onChangeText={(v) => {
                setGuestCountText(v);
                debouncedGuestUpdate(v);
              }}
              keyboardType="number-pad"
              style={styles.guestInput}
            />
          </View>
        </View>

        {(shabbatMeals ?? []).map((sm) => {
          const k = kosherStyle[sm.kosher];
          const day = sm.has_guests ? `${sm.day_label} · ${profile?.guest_count ?? 4} guests` : sm.day_label;
          return (
            <Card key={sm.id}>
              <View style={styles.mealHeader}>
                <Text style={styles.dayLabel}>{day}</Text>
                <Tag bg={k.bg} fg={k.fg} label={k.label} />
              </View>
              <View style={{ gap: 9 }}>
                {sm.courses.map((c) => (
                  <ShabbatCourseRow key={c.id} course={c} onCommit={(text) => updateCourse.mutate({ id: c.id, family_desc: text })} />
                ))}
              </View>
            </Card>
          );
        })}
      </Screen>
    </View>
  );
}

function WeekdayCard({
  meal,
  baseLabel,
  onOpenDetail,
  onSkip,
  onUndoSkip,
}: {
  meal: WeekdayMeal;
  baseLabel: string | null;
  onOpenDetail: () => void;
  onSkip: () => void;
  onUndoSkip: () => void;
}) {
  const k = kosherStyle[meal.kosher];
  const hasBoth = !meal.is_leftover && meal.family_desc !== meal.kids_desc;
  const startX = useRef<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: (evt) => {
        startX.current = evt.nativeEvent.pageX;
      },
      onPanResponderRelease: (evt, gesture) => {
        if (gesture.dx < -60) onSkip();
        startX.current = null;
      },
    })
  ).current;

  return (
    <Card>
      <View style={styles.mealHeader}>
        <Text style={styles.dayLabel}>{meal.day_label}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {meal.is_leftover ? <Tag bg={colors.slateSoft} fg={colors.slate} label="Leftovers" /> : null}
          <Tag bg={k.bg} fg={k.fg} label={k.label} />
        </View>
      </View>

      {meal.is_skipped ? (
        <View style={styles.skippedRow}>
          <Text style={styles.skippedLabel}>{meal.skip_label}</Text>
          <Pressable onPress={onUndoSkip} hitSlop={8}>
            <Text style={styles.undoLabel}>Undo</Text>
          </Pressable>
        </View>
      ) : (
        <View {...panResponder.panHandlers}>
          <Pressable onPress={onOpenDetail}>
            <Text style={styles.familyDesc}>{meal.family_desc}</Text>
          </Pressable>
          {hasBoth ? (
            <View style={styles.kidsBox}>
              <Text style={styles.kidsLabel}>KIDS GET</Text>
              <Text style={styles.kidsText}>{meal.kids_desc}</Text>
            </View>
          ) : null}
          {baseLabel ? (
            <View style={styles.baseRow}>
              <Tag bg={colors.line} fg={colors.inkSoft} label="♻ SUNDAY PREP" />
              <Text style={styles.baseText}>{baseLabel}</Text>
            </View>
          ) : null}
          {meal.stealth_veg ? (
            <View style={styles.stealthRow}>
              <Text style={styles.stealthLabel}>✦ STEALTH VEG</Text>
              <Text style={styles.stealthText}>{meal.stealth_veg}</Text>
            </View>
          ) : null}
          <Text style={styles.swipeHint}>← Swipe to skip this night</Text>
        </View>
      )}
    </Card>
  );
}

function ShabbatCourseRow({
  course,
  onCommit,
}: {
  course: { id: string; course_name: string; family_desc: string; kids_desc: string | null; stealth_veg: string | null };
  onCommit: (text: string) => void;
}) {
  const [text, setText] = useState(course.family_desc);
  const debouncedCommit = useDebouncedCallback(onCommit, 600);
  return (
    <View>
      <Text style={styles.courseName}>{course.course_name}</Text>
      <TextInput
        value={text}
        onChangeText={(v) => {
          setText(v);
          debouncedCommit(v);
        }}
        style={styles.courseInput}
      />
      {course.kids_desc ? (
        <View style={styles.courseKidsBox}>
          <Text style={styles.courseKidsLabel}>KIDS</Text>
          <Text style={styles.courseKidsText}>{course.kids_desc}</Text>
        </View>
      ) : null}
      {course.stealth_veg ? (
        <View style={styles.courseStealthRow}>
          <Text style={styles.courseStealthLabel}>✦ STEALTH</Text>
          <Text style={styles.courseStealthText}>{course.stealth_veg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rebuildLink: { fontSize: 12.5, fontWeight: '700', color: colors.marigold, fontFamily: fonts.uiBold },
  rebuildError: { color: colors.rust, fontSize: 12.5, fontFamily: fonts.ui },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 },
  dayLabel: { fontSize: 12.5, fontWeight: '700', color: colors.ink, fontFamily: fonts.uiBold },
  skippedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  skippedLabel: { fontSize: 13.5, color: colors.ink, fontFamily: fonts.ui },
  undoLabel: { fontSize: 11.5, fontWeight: '700', color: colors.inkSoft, fontFamily: fonts.uiBold },
  familyDesc: {
    fontSize: 14.5,
    color: colors.inkSoft,
    lineHeight: 21,
    marginBottom: 8,
    textDecorationLine: 'underline',
    textDecorationColor: colors.line,
    fontFamily: fonts.ui,
  },
  kidsBox: { flexDirection: 'row', gap: 8, backgroundColor: colors.marigoldSoft, borderRadius: radii.sm, padding: 9, alignItems: 'flex-start' },
  kidsLabel: { fontSize: 10.5, fontWeight: '700', color: colors.marigoldInk, fontFamily: fonts.uiBold, flexShrink: 0 },
  kidsText: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 17, flex: 1, fontFamily: fonts.ui },
  baseRow: { marginTop: 9, flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  baseText: { fontSize: 12, color: colors.inkSoft, lineHeight: 17, flex: 1, fontFamily: fonts.ui },
  stealthRow: { marginTop: 9, flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  stealthLabel: { fontSize: 10, fontWeight: '700', color: colors.ink, fontFamily: fonts.uiBold },
  stealthText: { fontSize: 12, color: colors.inkSoft, lineHeight: 17, flex: 1, fontFamily: fonts.ui },
  swipeHint: { fontSize: 10.5, color: colors.inkFaint, marginTop: 11, fontFamily: fonts.ui },
  aiCard: { backgroundColor: colors.marigoldSoft, borderWidth: 1, borderColor: colors.line, borderRadius: radii.xl, padding: 15 },
  aiHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  aiPickLabel: { fontSize: 12, fontWeight: '700', color: colors.marigold, fontFamily: fonts.uiBold },
  aiFromLabel: { fontSize: 11.5, color: colors.inkSoft, fontFamily: fonts.ui },
  aiTitle: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 19, color: colors.ink, marginBottom: 4 },
  aiUses: { fontSize: 12, color: colors.inkSoft, marginBottom: 6, fontFamily: fonts.ui },
  aiNote: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 17, marginBottom: 13, fontFamily: fonts.ui },
  aiSecondaryButton: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radii.sm, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  aiSecondaryText: { fontSize: 12.5, fontWeight: '600', color: colors.inkSoft, fontFamily: fonts.uiSemiBold },
  aiPrimaryButton: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radii.sm },
  aiPrimaryText: { fontSize: 12.5, fontWeight: '700', color: colors.paper, fontFamily: fonts.uiBold },
  guestHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  guestLabel: { fontSize: 10.5, color: colors.inkFaint, fontFamily: fonts.ui },
  guestInput: {
    width: 32,
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.ink,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 3,
    textAlign: 'center',
  },
  courseName: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.inkFaint, marginBottom: 2, fontFamily: fonts.uiBold },
  courseInput: {
    fontFamily: fonts.ui,
    fontSize: 13.5,
    color: colors.ink,
    lineHeight: 19,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderStyle: 'dashed',
    paddingVertical: 4,
  },
  courseKidsBox: { flexDirection: 'row', gap: 7, backgroundColor: colors.marigoldSoft, borderRadius: 7, padding: 8, marginTop: 4, alignItems: 'flex-start' },
  courseKidsLabel: { fontSize: 10, fontWeight: '700', color: colors.marigoldInk, fontFamily: fonts.uiBold },
  courseKidsText: { fontSize: 12, color: colors.inkSoft, lineHeight: 16, flex: 1, fontFamily: fonts.ui },
  courseStealthRow: { marginTop: 4, flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  courseStealthLabel: { fontSize: 9.5, fontWeight: '700', color: colors.ink, fontFamily: fonts.uiBold },
  courseStealthText: { fontSize: 11.5, color: colors.inkSoft, lineHeight: 16, flex: 1, fontFamily: fonts.ui },
});
