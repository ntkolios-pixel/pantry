import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/** Parses the tokens Supabase appends to the OAuth redirect (as a #fragment) and starts the session. */
async function createSessionFromUrl(url: string) {
  const hashPart = url.split('#')[1] ?? '';
  const params = new URLSearchParams(hashPart);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) {
    throw new Error('No session tokens found in OAuth redirect URL');
  }
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
}

/** Google sign-in via Supabase's hosted OAuth flow (works on web + native). */
export async function signInWithGoogle() {
  const redirectTo = AuthSession.makeRedirectUri();

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success' && result.url) {
    await createSessionFromUrl(result.url);
  }
}

/** Apple sign-in. Native devices use the OS-level Sign in with Apple sheet; web falls back to Supabase's hosted OAuth flow. */
export async function signInWithApple() {
  if (Platform.OS === 'web') {
    const redirectTo = AuthSession.makeRedirectUri();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    });
    if (error) throw error;
    return;
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('No identity token returned from Apple');

  const fullName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
    : undefined;

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  if (fullName) {
    await supabase.auth.updateUser({ data: { name: fullName } });
  }
}
