import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, kosherStyle, radii } from '../../constants/theme';
import { Header } from '../../components/Header';
import { BackLink, Screen, Tag } from '../../components/ui';
import { useRecipes } from '../../hooks/useRecipes';

export default function Library() {
  const router = useRouter();
  const { data: recipes } = useRecipes();
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = (recipes ?? []).filter((r) => !q || r.title.toLowerCase().includes(q));

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="Library" />
      <Screen>
        <BackLink label="← Home" onPress={() => router.push('/(tabs)/home')} />
        <View style={{ height: 14 }} />
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your recipes"
            placeholderTextColor={colors.inkFaint}
            style={styles.searchInput}
          />
          <Pressable onPress={() => router.push('/library/add')} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
        <View>
          {filtered.map((r) => {
            const k = kosherStyle[r.kosher];
            return (
              <Pressable key={r.id} onPress={() => router.push(`/library/${r.id}`)} style={styles.row}>
                <Text style={styles.rowTitle}>{r.title}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Tag bg={k.bg} fg={k.fg} label={k.label} />
                  <Tag bg={colors.line} fg={colors.inkSoft} label={r.both_audiences ? 'Family + kids' : 'Everyone'} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchInput: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 13.5,
    color: colors.ink,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: colors.paper, fontSize: 19, fontWeight: '600' },
  row: {
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderStyle: 'dashed',
  },
  rowTitle: { fontSize: 14, color: colors.ink, lineHeight: 20, fontFamily: fonts.ui },
});
