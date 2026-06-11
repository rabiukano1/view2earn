import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey= process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

const map = new Map<string, string>();

const storageAdapter = (() => {
  try {
    if (typeof window === 'undefined') throw new Error('SSR');
    if (Platform.OS === 'web') throw new Error('Web');
    const SecureStore = require('expo-secure-store');
    if (typeof SecureStore.getItemAsync !== 'function') throw new Error();
    return {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };
  } catch {
    return {
      getItem: async (key: string) => map.get(key) ?? null,
      setItem: async (key: string, value: string) => { map.set(key, value); },
      removeItem: async (key: string) => { map.delete(key); },
    };
  }
})();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
