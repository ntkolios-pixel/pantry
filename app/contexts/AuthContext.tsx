import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../lib/database.types';
import { signInWithGoogle, signInWithApple } from '../lib/oauth';

interface AuthContextValue {
  isSupabaseConfigured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True when a session was restored from a previous app launch and still
   * needs a Face ID / Touch ID / passcode check before the app is usable. */
  locked: boolean;
  unlock: () => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Races a promise against a timeout so a slow/hung native call (e.g. a flaky
 * AsyncStorage read on-device) can't block the app on the loading screen
 * forever — falls back to `fallback` instead. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`[auth] timed out after ${ms}ms — continuing without a restored session`);
      resolve(fallback);
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        console.warn('[auth] getSession() failed — continuing without a restored session', err);
        resolve(fallback);
      }
    );
  });
}

async function fetchProfileWithRetry(userId: string, attempts = 5): Promise<Profile | null> {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) return data as Profile;
    if (error) throw error;
    // the handle_new_user trigger runs async right after signUp — give it a moment
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locked, setLocked] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    const p = await fetchProfileWithRetry(userId);
    setProfile(p);
  }, []);

  const unlock = useCallback(async () => {
    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (!hasHardware || !isEnrolled) {
        // No Face ID/Touch ID/passcode set up on this device — don't trap
        // the user behind a lock screen they have no way to open.
        setLocked(false);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Pantry' });
      if (result.success) setLocked(false);
    } catch (err) {
      console.warn('[auth] biometric unlock failed, letting the user in', err);
      setLocked(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    withTimeout(supabase.auth.getSession(), 8000, { data: { session: null } } as Awaited<
      ReturnType<typeof supabase.auth.getSession>
    >).then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
        // A session restored from a previous launch needs a fresh unlock —
        // a session just created by an interactive sign-in (below) does not.
        setLocked(true);
        unlock();
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile, unlock]);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const TIMED_OUT = Symbol('timed-out');
    const result = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 12000, TIMED_OUT as any);
    if (result === (TIMED_OUT as any)) {
      throw new Error(
        'Log in is taking too long to reach the server. Check your internet connection and try again.'
      );
    }
    const { error } = result as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', session.user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data as Profile);
    },
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      locked,
      unlock,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [loading, session, profile, locked, unlock, signUpWithEmail, signInWithEmail, signOut, refreshProfile, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
