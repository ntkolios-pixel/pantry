import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { GearIcon } from './ui';

export function Header({ title, showSubtitle = true }: { title: string; showSubtitle?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const firstName = profile?.name.trim().split(' ')[0] || 'Your';
  const avatarLetter = firstName === 'Your' ? 'N' : firstName[0]?.toUpperCase() || 'N';
  const subtitle = `${firstName}${firstName === 'Your' ? '' : '’s'} Pantry`;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 14 }]}>
      <Pressable onPress={() => router.push('/(tabs)/home')} style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarLetter}</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {showSubtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable onPress={() => router.push('/family')} style={styles.gearButton} hitSlop={8}>
        <GearIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cream,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.line,
    borderStyle: 'dashed',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.syrup,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: colors.onAccent, fontFamily: fonts.display, fontSize: 19 },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 25, color: colors.ink, lineHeight: 29 },
  subtitle: { fontSize: 11.5, color: colors.inkSoft, marginTop: 4, fontFamily: fonts.ui },
  gearButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
