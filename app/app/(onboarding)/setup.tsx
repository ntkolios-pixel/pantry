import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, personTints, radii, spacing } from '../../constants/theme';
import { PrimaryButton, Screen, StepLabel } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useHouseholdMembers, useUpdateHouseholdMember } from '../../hooks/useHousehold';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';

export default function Setup() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const { data: members } = useHouseholdMembers();
  const updateMember = useUpdateHouseholdMember();

  const [notes, setNotes] = useState<Record<string, string>>({});
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current && members) {
      seeded.current = true;
      setNotes(Object.fromEntries(members.map((m) => [m.id, m.note])));
    }
  }, [members]);

  const debouncedUpdate = useDebouncedCallback((id: string, note: string) => {
    updateMember.mutate({ id, patch: { note } });
  }, 500);

  function setNote(id: string, value: string) {
    setNotes((prev) => ({ ...prev, [id]: value }));
    debouncedUpdate(id, value);
  }

  async function continueOn() {
    await updateProfile({ onboarding_stage: 'recipes' });
    router.replace('/(onboarding)/recipes');
  }

  return (
    <Screen contentStyle={{ paddingTop: 56, gap: 22 }}>
      <View>
        <StepLabel step={3} of={4} />
        <Text style={styles.title}>Tell us about your eaters</Text>
        <Text style={styles.body}>Likes, dislikes, allergies — anything that helps us plan well for everyone.</Text>
      </View>

      <View style={{ gap: 14 }}>
        {(members ?? []).map((m, i) => {
          const tint = personTints[i % personTints.length];
          const initial = (m.name || '?').trim().charAt(0).toUpperCase() || '?';
          return (
            <View key={m.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: tint.circle }]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <Text style={styles.name}>{m.name || 'Unnamed'}</Text>
                <Text style={styles.age}>{m.age}</Text>
              </View>
              <View style={styles.cardBody}>
                <TextInput
                  value={notes[m.id] ?? ''}
                  onChangeText={(v) => setNote(m.id, v)}
                  placeholder="Likes, dislikes, allergies…"
                  placeholderTextColor={colors.inkFaint}
                  multiline
                  numberOfLines={3}
                  style={styles.textarea}
                />
              </View>
            </View>
          );
        })}
      </View>

      <PrimaryButton label="Continue" onPress={continueOn} style={{ marginTop: 6 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 24, color: colors.ink, marginBottom: 6 },
  body: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 19, fontFamily: fonts.ui },
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: radii.xl, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: colors.onAccent,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 15, fontWeight: '600', color: colors.ink },
  name: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 17, color: colors.ink },
  age: { marginLeft: 'auto', fontSize: 10.5, fontWeight: '600', color: colors.inkFaint, fontFamily: fonts.uiSemiBold },
  cardBody: { padding: 13, paddingTop: 12 },
  textarea: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 19,
    backgroundColor: colors.linen,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
