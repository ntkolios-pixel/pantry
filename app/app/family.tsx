import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, personTints, radii } from '../constants/theme';
import { BackLink, Screen } from '../components/ui';
import { useHouseholdMembers, useUpdateHouseholdMember } from '../hooks/useHousehold';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

export default function Family() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 16, gap: 14 }}>
      <BackLink label="← Home" onPress={() => router.push('/(tabs)/home')} />
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
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: radii.lg, padding: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12.5, fontWeight: '700', color: colors.ink, fontFamily: fonts.uiBold },
  name: { fontSize: 14.5, fontWeight: '600', color: colors.ink, fontFamily: fonts.uiSemiBold },
  age: { fontSize: 11, color: colors.inkFaint, fontFamily: fonts.ui },
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
