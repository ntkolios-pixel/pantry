import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../constants/theme';
import { Header } from '../../components/Header';
import { BackLink, Card, Screen, Tag } from '../../components/ui';
import { useDiscoverRecipes, useToggleDiscoverSaved } from '../../hooks/useDiscover';

function matchTier(pct: number) {
  if (pct >= 90) return { bg: colors.successSoft, fg: colors.success };
  if (pct >= 85) return { bg: colors.skySoft, fg: colors.sky };
  return { bg: colors.line, fg: colors.inkSoft };
}

export default function Discover() {
  const router = useRouter();
  const { data: recipes } = useDiscoverRecipes();
  const toggleSaved = useToggleDiscoverSaved();

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="Discover" />
      <Screen contentStyle={{ gap: 12 }}>
        <BackLink label="← Home" onPress={() => router.push('/(tabs)/home')} />
        {(recipes ?? []).map((rc) => {
          const tier = matchTier(rc.match_pct);
          return (
            <Card key={rc.id}>
              <View style={styles.topRow}>
                <Text style={styles.creator}>{rc.creator}</Text>
                <Tag bg={tier.bg} fg={tier.fg} label={`${rc.match_pct}% FITS`} />
              </View>
              <Text style={styles.title}>{rc.title}</Text>
              <Text style={styles.note}>{rc.note}</Text>
              <Pressable onPress={() => toggleSaved.mutate({ id: rc.id, saved: !rc.saved })} hitSlop={6}>
                <Text style={[styles.saveLabel, { color: rc.saved ? colors.success : colors.ink }]}>
                  {rc.saved ? '✓ Saved to library' : '+ Save to library'}
                </Text>
              </Pressable>
            </Card>
          );
        })}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  creator: { fontSize: 12, color: colors.inkSoft, fontFamily: fonts.ui },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 19, color: colors.ink, marginBottom: 4 },
  note: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 17, marginBottom: 11, fontFamily: fonts.ui },
  saveLabel: { fontSize: 12.5, fontWeight: '700', fontFamily: fonts.uiBold },
});
