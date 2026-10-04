import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { PrimaryButton, StepLabel } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import {
  useAddHouseholdMember,
  useHouseholdMembers,
  useRemoveHouseholdMember,
  useUpdateHouseholdMember,
} from '../../hooks/useHousehold';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';

interface Row {
  id: string;
  name: string;
  age: string;
}

export default function Household() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { data: members } = useHouseholdMembers();
  const addMember = useAddHouseholdMember();
  const updateMember = useUpdateHouseholdMember();
  const removeMember = useRemoveHouseholdMember();

  const [rows, setRows] = useState<Row[]>([]);
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current && members) {
      seeded.current = true;
      setRows(members.map((m) => ({ id: m.id, name: m.name, age: m.age })));
      if (members.length === 0) {
        addMember.mutate(0, {
          onSuccess: (m) => setRows((prev) => [...prev, { id: m.id, name: '', age: '' }]),
        });
      }
    }
  }, [members]);

  const debouncedUpdate = useDebouncedCallback((id: string, patch: Partial<Row>) => {
    updateMember.mutate({ id, patch });
  }, 500);

  function setField(id: string, field: 'name' | 'age', value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    debouncedUpdate(id, { [field]: value });
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    removeMember.mutate(id);
  }

  function addRow() {
    addMember.mutate(rows.length, {
      onSuccess: (m) => setRows((prev) => [...prev, { id: m.id, name: '', age: '' }]),
    });
  }

  async function continueOn() {
    await updateProfile({ onboarding_stage: 'setup' });
    router.replace('/(onboarding)/setup');
  }

  return (
    <View style={styles.wrap}>
      <View>
        <StepLabel step={2} of={4} />
        <Text style={styles.title}>Who are you cooking for?</Text>
        <Text style={styles.body}>Add everyone in your household — we'll ask about their preferences next.</Text>
      </View>

      <View style={{ gap: 10 }}>
        {rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <TextInput
              value={row.name}
              onChangeText={(v) => setField(row.id, 'name', v)}
              placeholder="Name"
              placeholderTextColor={colors.inkFaint}
              style={[styles.input, { flex: 2 }]}
            />
            <TextInput
              value={row.age}
              onChangeText={(v) => setField(row.id, 'age', v)}
              placeholder="Age"
              placeholderTextColor={colors.inkFaint}
              style={[styles.input, { flex: 1 }]}
            />
            <Pressable onPress={() => removeRow(row.id)} style={styles.removeButton} hitSlop={8}>
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={addRow} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add family member</Text>
        </Pressable>
      </View>

      <View style={styles.kosherRow}>
        <Text style={styles.kosherLabel}>Do you keep kosher?</Text>
        <Pressable
          onPress={() => updateProfile({ kosher: !profile?.kosher })}
          style={[styles.toggleTrack, { backgroundColor: profile?.kosher ? colors.ink : colors.line }]}
        >
          <View style={[styles.toggleThumb, { left: profile?.kosher ? 20 : 2 }]} />
        </Pressable>
      </View>

      <PrimaryButton label="Continue" onPress={continueOn} style={{ marginTop: 4 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', padding: 32, paddingHorizontal: 28, gap: spacing.xl },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 24, color: colors.ink, marginBottom: 6 },
  body: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 19, fontFamily: fonts.ui },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
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
  removeButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.inkFaint, fontSize: 18 },
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
  kosherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kosherLabel: { fontSize: 12.5, color: colors.inkSoft, fontFamily: fonts.ui },
  toggleTrack: { width: 42, height: 24, borderRadius: 999, justifyContent: 'center' },
  toggleThumb: { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.paper },
});
