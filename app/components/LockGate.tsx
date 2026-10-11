import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../constants/theme';
import { PrimaryButton } from './ui';
import { useAuth } from '../contexts/AuthContext';

/** Shown in place of the app whenever a restored session still needs a
 * Face ID / Touch ID / passcode check — see AuthContext's `locked`/`unlock`. */
export function LockGate({ children }: { children: React.ReactNode }) {
  const { locked, unlock } = useAuth();

  if (!locked) return <>{children}</>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.body}>Unlock to get back into Pantry.</Text>
      <PrimaryButton label="Unlock" onPress={unlock} style={{ marginTop: 20, width: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 26, color: colors.ink, marginBottom: 8 },
  body: { fontSize: 13.5, color: colors.inkSoft, textAlign: 'center', fontFamily: fonts.ui },
});
