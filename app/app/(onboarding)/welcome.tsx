import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, personTints, radii, spacing } from '../../constants/theme';
import { PrimaryButton, TextLink } from '../../components/ui';

const FEATURES = ['A week of dinners, built around your recipes', "A grocery list of only what you're missing", "Every eater's likes and dislikes remembered"];

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Text style={styles.title}>Welcome to Pantry</Text>
        <Text style={styles.body}>Plan the week. Shop what's missing. Cook what your family loves.</Text>
      </View>

      <View style={styles.featureList}>
        {FEATURES.map((label, i) => (
          <View key={label} style={styles.featureRow}>
            <View style={[styles.featureBadge, { backgroundColor: personTints[i % personTints.length].circle }]}>
              <Text style={styles.featureBadgeText}>{i + 1}</Text>
            </View>
            <Text style={styles.featureLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton
        label="Get started"
        onPress={() => router.push({ pathname: '/(onboarding)/signup', params: { mode: 'signup' } })}
        style={{ marginTop: 14, width: '100%' }}
      />
      <TextLink
        label="I already have an account"
        onPress={() => router.push({ pathname: '/(onboarding)/signup', params: { mode: 'login' } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    paddingVertical: 48,
    gap: 34,
  },
  title: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 32,
    color: colors.ink,
    lineHeight: 36,
    textAlign: 'center',
  },
  body: { fontSize: 14, color: colors.inkSoft, lineHeight: 21, maxWidth: 260, textAlign: 'center', fontFamily: fonts.ui },
  featureList: {
    width: '100%',
    backgroundColor: colors.line,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    overflow: 'hidden',
    gap: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.onAccent,
  },
  featureBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureBadgeText: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 14, color: colors.ink },
  featureLabel: { fontSize: 12.5, color: colors.inkSoft, flex: 1, fontFamily: fonts.ui },
});
