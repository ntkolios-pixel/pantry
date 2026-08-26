import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../constants/theme';
import { Header } from '../../components/Header';
import { BackLink, ChecklistRow, PillToggle, Screen, SectionLabel } from '../../components/ui';
import { useGroceryItems, useToggleGroceryItem } from '../../hooks/useGroceries';
import type { GroceryListType } from '../../lib/database.types';

export default function Groceries() {
  const router = useRouter();
  const [view, setView] = useState<GroceryListType>('weekday');
  const { data: items } = useGroceryItems(view);
  const toggle = useToggleGroceryItem();

  const toBuy = (items ?? []).filter((i) => !i.have).length;
  const groups = groupBy(items ?? [], (i) => i.aisle);
  const timingLabel = view === 'weekday' ? 'Buy Sunday, before you prep' : 'Buy Thursday or Friday morning';

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="Groceries" />
      <Screen>
        <BackLink label="← Home" onPress={() => router.push('/(tabs)/home')} />
        <View style={{ height: 14 }} />
        <PillToggle
          options={[
            { key: 'weekday', label: 'Weekday' },
            { key: 'shabbat', label: 'Shabbat & guests' },
          ]}
          value={view}
          onChange={(v) => setView(v as GroceryListType)}
        />
        <Text style={{ fontSize: 12, color: colors.inkSoft, marginBottom: 4, fontFamily: fonts.ui }}>
          {toBuy} item{toBuy === 1 ? '' : 's'} to buy · tap what you already have
        </Text>
        <Text style={{ fontSize: 11, color: colors.marigoldInk, marginBottom: 12, fontFamily: fonts.ui }}>
          {timingLabel}
        </Text>
        <View style={{ gap: 16 }}>
          {groups.map(([aisle, aisleItems]) => (
            <View key={aisle}>
              <SectionLabel style={{ marginBottom: 6 }}>{aisle}</SectionLabel>
              <View>
                {aisleItems.map((item) => (
                  <ChecklistRow
                    key={item.id}
                    label={item.name}
                    done={item.have}
                    onPress={() => toggle.mutate({ id: item.id, have: !item.have })}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </Screen>
    </View>
  );
}

function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return Array.from(map.entries());
}
