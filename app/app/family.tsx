import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, personTints, radii } from '../constants/theme';
import { BackLink, Screen } from '../components/ui';
import {
  useAddHouseholdMember,
  useHouseholdMembers,
  useRemoveHouseholdMember,
  useUpdateHouseholdMember,
} from '../hooks/useHousehold';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

export default function Family() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: members } = useHouseholdMembers();
  const addMember = useAddHouseholdMember();
  const updateMember = useUpdateHouseholdMember();
  const removeMember = useRemoveHouseholdMember();

  const [names, setNames] = useState<Record<string, string>>({});
  const [ages, setAges] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current && members) {
      seeded.current = true;
      setNames(Object.fromEntries(members.map((m) => [m.id, m.name])));
      setAges(Object.fromEntries(members.map((m) => [m.id, m.age])));
      setNotes(Object.fromEntries(members.map((m) => [m.id, m.note])));
    }
  }, [members]);

  const debouncedUpdate = useDebouncedCallback((id: string, patch: { name?: string; age?: string; note?: string }) => {
    updateMember.mutate({ id, patch });
  }, 500);

  function setName(id: string, value: string) {
    setNames((prev) => ({ ...prev, [id]: value }));
    debouncedUpdate(id, { name: value });
  }

  function setAge(id: string, value: string) {
    setAges((prev) => ({ ...prev, [id]: value }));
    debouncedUpdate(id, { age: value });
  }

  function setNote(id: string, value: string) {
    setNotes((prev) => ({ ...prev, [id]: value }));
    debouncedUpdate(id, { note: value });
  }

  function addPerson() {
    addMember.mutate((members ?? []).length, {
      onSuccess: (m) => {
        setNames((prev) => ({ ...prev, [m.id]: '' }));
        setAges((prev) => ({ ...prev, [m.id]: '' }));
        setNotes((prev) => ({ ...prev, [m.id]: '' }));
      },
    });
  }

  function removePerson(id: string) {
    removeMember.mutate(id);
  }

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 16, gap: 14 }}>
      <BackLink label="← Home" onPress={() => router.push('/(tabs)/home')} />
      <View style={{ gap: 14 }}>
        {(members ?? []).map((m, i) => {
          const tint = personTints[i % personTints.length];
          const initial = (names[m.id] || '?').trim().charAt(0).toUpperCase() || '?';
          return (
            <View key={m.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: tint.circle }]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <TextInput
                  value={names[m.id] ?? ''}
                  onChangeText={(v) => setName(m.id, v)}
                  placeholder="Name"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.nameInput}
                />
                <TextInput
                  value={ages[m.id] ?? ''}
                  onChangeText={(v) => setAge(m.id, v)}
                  placeholder="Age"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.ageInput}
                />
                <Pressable onPress={() => removePerson(m.id)} style={styles.removeButton} hitSlop={8}>
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
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
        <Pressable onPress={addPerson} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add family member</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: radii.lg, padding: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12.5, fontWeight: '700', color: colors.ink, fontFamily: fonts.uiBold },
  nameInput: {
    flex: 2,
    fontFamily: fonts.ui,
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.ink,
    paddingVertical: 4,
  },
  ageInput: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 12.5,
    color: colors.inkFaint,
    paddingVertical: 4,
  },
  removeButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.inkFaint, fontSize: 17 },
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
  addButton: {
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  addButtonText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft, fontFamily: fonts.uiSemiBold },
});
