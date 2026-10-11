import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as aesjs from 'aes-js';
import Constants from 'expo-constants';

// A Supabase session (access token + refresh token + account info) is
// usually too big for a single expo-secure-store item — iOS Keychain
// enforces a small practical size limit there, and SecureStore writes over
// it fail. So the actual session is encrypted and written to a plain file
// (expo-file-system — a core Expo module, unlike the community
// @react-native-async-storage/async-storage package that caused a native
// module linking error earlier); only the small AES key lives in
// SecureStore, which is small enough to fit and is itself encrypted at rest
// in the device Keychain/Keystore.
const sessionDir = new Directory(Paths.document, 'session');

function sessionFile(key: string): File {
  return new File(sessionDir, `${encodeURIComponent(key)}.bin`);
}

function keyStorageName(key: string) {
  return `${key}-enc-key`;
}

async function getOrCreateEncryptionKey(key: string): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(keyStorageName(key));
  if (existing) return aesjs.utils.hex.toBytes(existing);
  const bytes = await Crypto.getRandomBytesAsync(32);
  await SecureStore.setItemAsync(keyStorageName(key), aesjs.utils.hex.fromBytes(bytes));
  return bytes;
}

const secureStorage = {
  getItem: async (key: string) => {
    try {
      const file = sessionFile(key);
      if (!file.exists) {
        console.log('[secureStorage] getItem: no file for', key);
        return null;
      }
      const encryptedHex = file.textSync();
      const encryptionKey = await SecureStore.getItemAsync(keyStorageName(key));
      if (!encryptionKey) {
        console.log('[secureStorage] getItem: file exists but no encryption key for', key);
        return null;
      }
      const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKey), new aesjs.Counter(1));
      const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(encryptedHex));
      const value = aesjs.utils.utf8.fromBytes(decryptedBytes);
      console.log('[secureStorage] getItem: restored', key, 'len=', value.length);
      return value;
    } catch (err) {
      console.warn('[secureStorage] getItem FAILED for', key, err);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      const encryptionKey = await getOrCreateEncryptionKey(key);
      const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
      const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
      const file = sessionFile(key);
      file.create({ intermediates: true, overwrite: true });
      file.write(aesjs.utils.hex.fromBytes(encryptedBytes));
      console.log('[secureStorage] setItem: wrote', key, 'len=', value.length, 'exists now=', file.exists);
    } catch (err) {
      console.warn('[secureStorage] setItem FAILED for', key, err);
    }
  },
  removeItem: async (key: string) => {
    try {
      const file = sessionFile(key);
      if (file.exists) file.delete();
      await SecureStore.deleteItemAsync(keyStorageName(key));
      console.log('[secureStorage] removeItem:', key);
    } catch (err) {
      console.warn('[secureStorage] removeItem FAILED for', key, err);
    }
  },
};

const extra = Constants.expoConfig?.extra ?? {};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? (extra.supabaseUrl as string | undefined);
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? (extra.supabaseAnonKey as string | undefined);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
      'Copy .env.example to .env and fill in your Supabase project credentials — see supabase/README.md.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
