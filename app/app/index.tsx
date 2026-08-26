import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { colors, fonts } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { isSupabaseConfigured, loading, session, profile } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Backend not configured</Text>
        <Text style={styles.body}>
          This app needs a Supabase project to run. Copy .env.example to .env with your project URL and anon key,
          then reload — see supabase/README.md for the full setup.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (profile.onboarding_stage !== 'app') {
    return <Redirect href={`/(onboarding)/${profile.onboarding_stage}`} />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 22, color: colors.ink },
  body: { fontSize: 13, color: colors.inkSoft, textAlign: 'center', lineHeight: 20, fontFamily: fonts.ui },
});
