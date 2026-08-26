import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../constants/theme';
import { Header } from '../../components/Header';
import { BackLink, ChecklistRow, PillToggle, Screen, SectionLabel } from '../../components/ui';
import { usePrepItems, useTogglePrepItem } from '../../hooks/usePrep';
import type { PrepListType } from '../../lib/database.types';

export default function Prep() {
  const router = useRouter();
  const [view, setView] = useState<PrepListType>('sunday');
  const { data: items } = usePrepItems(view);
  const toggle = useTogglePrepItem();

  const groups = groupBy(items ?? [], (i) => i.section);
  const timingLabel = view === 'sunday' ? 'For your Sun–Thu weekday meals' : 'For Shabbat + guests — not on Sunday';

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="Sunday prep" />
      <Screen>
        <BackLink label="← Home" onPress={() => router.push('/(tabs)/home')} />
        <View style={{ height: 14 }} />
        <PillToggle
          options={[
            { key: 'sunday', label: 'Sunday · the week' },
            { key: 'shabbat', label: 'Thu/Fri · Shabbat' },
          ]}
          value={view}
          onChange={(v) => setView(v as PrepListType)}
        />
        <Text style={{ fontSize: 11.5, color: colors.marigoldInk, fontWeight: '700', marginBottom: 14, fontFamily: fonts.uiBold }}>
          {timingLabel}
        </Text>
        <View style={{ gap: 18 }}>
          {groups.map(([section, sectionItems]) => (
            <View key={section}>
              <SectionLabel style={{ marginBottom: 6 }}>{section}</SectionLabel>
              <View>
                {sectionItems.map((item) => (
                  <ChecklistRow
                    key={item.id}
                    label={item.label}
                    meta={item.minutes ? `${item.minutes} min` : undefined}
                    done={item.done}
                    onPress={() => toggle.mutate({ id: item.id, done: !item.done })}
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
