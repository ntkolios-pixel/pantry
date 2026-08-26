import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { PrimaryButton, SecondaryButton, StepLabel, TextLink } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

export default function Signup() {
  const router = useRouter();
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();
  const { signUpWithEmail, signInWithEmail, signInWithGoogle, signInWithApple } = useAuth();

  const [mode, setMode] = useState<'signup' | 'login'>(initialMode === 'login' ? 'login' : 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const isSignup = mode === 'signup';

  async function submit() {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (isSignup && !name.trim()) {
      setError('Tell us your name.');
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { needsEmailConfirmation } = await signUpWithEmail(name.trim(), email.trim(), password);
        if (needsEmailConfirmation) {
          setInfo('Check your email to confirm your account, then log in.');
          setMode('login');
        }
        // else: session is set, root redirect gate takes it from here
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function withOauth(provider: 'google' | 'apple', fn: () => Promise<void>) {
    setError(null);
    setOauthLoading(provider);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setOauthLoading(null);
    }
  }

  return (
    <View style={styles.wrap}>
      {isSignup ? <StepLabel step={1} of={4} /> : null}
      <Text style={styles.title}>{isSignup ? 'Create your account' : 'Welcome back'}</Text>

      {isSignup ? (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />
      ) : null}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.inkFaint}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.inkFaint}
        secureTextEntry
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <PrimaryButton
        label={isSignup ? 'Create account' : 'Log in'}
        onPress={submit}
        loading={loading}
        style={{ marginTop: 8 }}
      />

      {isSignup ? (
        <Text style={styles.terms}>By continuing you agree to keep it kosher — and to our Terms.</Text>
      ) : null}

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <SecondaryButton
        label={oauthLoading === 'google' ? 'Connecting…' : 'Continue with Google'}
        onPress={() => withOauth('google', signInWithGoogle)}
      />
      <SecondaryButton
        label={oauthLoading === 'apple' ? 'Connecting…' : 'Continue with Apple'}
        onPress={() => withOauth('apple', signInWithApple)}
        style={{ marginTop: 8 }}
      />

      <TextLink
        label={isSignup ? 'I already have an account' : "I don't have an account yet"}
        onPress={() => {
          setError(null);
          setInfo(null);
          setMode(isSignup ? 'login' : 'signup');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', padding: 28, gap: 14 },
  title: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 24, color: colors.ink, marginBottom: 6 },
  input: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: { color: colors.rust, fontSize: 12.5, fontFamily: fonts.ui },
  info: { color: colors.sage, fontSize: 12.5, fontFamily: fonts.ui },
  terms: { textAlign: 'center', fontSize: 11.5, color: colors.inkFaint, marginTop: 4, fontFamily: fonts.ui },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { fontSize: 11.5, color: colors.inkFaint, fontFamily: fonts.ui },
});
