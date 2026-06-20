import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

if (Platform.OS !== 'web') {
  try {
    const QuickCrypto = require('react-native-quick-crypto');
    if (QuickCrypto && !QuickCrypto.subtle?.digest) {
      globalThis.crypto = QuickCrypto;
      if (QuickCrypto.subtle) (globalThis.crypto as { subtle?: typeof QuickCrypto.subtle }).subtle = QuickCrypto.subtle;
      console.log('[Supabase] WebCrypto polyfill installed for native');
    } else {
      console.log('[Supabase] WebCrypto already available natively');
    }
  } catch (e) {
    console.log('[Supabase] WebCrypto polyfill skipped:', (e as Error)?.message ?? 'not available');
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

const isWeb = Platform.OS === 'web';

function createSecureStoreAdapter() {
  if (isWeb) {
    if (typeof window === 'undefined' || !window.localStorage) throw new Error('No localStorage');
    console.log('[Supabase] Using localStorage for web');
    return {
      getItem: async (key: string) => window.localStorage.getItem(key),
      setItem: async (key: string, value: string) => { window.localStorage.setItem(key, value); },
      removeItem: async (key: string) => { window.localStorage.removeItem(key); },
    };
  }

  const native = requireOptionalNativeModule('ExpoSecureStore');
  if (native) {
    const hasNewAPI = typeof native.getItemAsync === 'function';
    if (hasNewAPI) {
      console.log('[Supabase] Using expo-secure-store for native');
      return {
        getItem: (key: string) => native.getItemAsync(key),
        setItem: (key: string, value: string) => native.setItemAsync(key, value),
        removeItem: (key: string) => native.deleteItemAsync(key),
      };
    }
    const hasOldAPI = typeof native.getValueWithKeyAsync === 'function';
    if (hasOldAPI) {
      console.log('[Supabase] Using expo-secure-store native module directly');
      return {
        getItem: (key: string) => native.getValueWithKeyAsync(key),
        setItem: (key: string, value: string) => native.setValueWithKeyAsync(value, key),
        removeItem: (key: string) => native.deleteValueWithKeyAsync(key),
      };
    }
  }

  console.warn('[Supabase] SecureStore unavailable, using in-memory storage');
  const map = new Map<string, string>();
  return {
    getItem: async (key: string) => map.get(key) ?? null,
    setItem: async (key: string, value: string) => { map.set(key, value); },
    removeItem: async (key: string) => { map.delete(key); },
  };
}

const storageAdapter = createSecureStoreAdapter();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});