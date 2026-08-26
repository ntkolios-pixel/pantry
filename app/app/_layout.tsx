import 'react-native-gesture-handler';
import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts as useDmSans, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import {
  useFonts as useCormorant,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { colors } from '../constants/theme';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  const [dmLoaded] = useDmSans({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  const [cormorantLoaded] = useCormorant({
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium_Italic,
  });

  if (!dmLoaded || !cormorantLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="meal/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="family" options={{ presentation: 'card' }} />
            <Stack.Screen name="library/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="library/add" options={{ presentation: 'card' }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
