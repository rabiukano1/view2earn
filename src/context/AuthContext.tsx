import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { supabase } from '@/lib/supabase';

const BIO_ACCESS_TOKEN_KEY = 'bio_access_token';
const BIO_REFRESH_TOKEN_KEY = 'bio_refresh_token';

let _ss: { getItemAsync: (k: string) => Promise<string | null>; setItemAsync: (k: string, v: string) => Promise<void>; deleteItemAsync: (k: string) => Promise<void> } | null = null;
function getSecureStore() {
  if (_ss) return _ss;
  const native = requireOptionalNativeModule('ExpoSecureStore');
  if (!native) return null;
  if (typeof native.getItemAsync === 'function') {
    _ss = {
      getItemAsync: (k: string) => native.getItemAsync(k, {}),
      setItemAsync: (k: string, v: string) => native.setItemAsync(k, v, {}),
      deleteItemAsync: (k: string) => native.deleteItemAsync(k, {}),
    };
    return _ss;
  }
  if (typeof native.getValueWithKeyAsync === 'function') {
    _ss = {
      getItemAsync: (k: string) => native.getValueWithKeyAsync(k, {}),
      setItemAsync: (k: string, v: string) => native.setValueWithKeyAsync(v, k, {}),
      deleteItemAsync: (k: string) => native.deleteValueWithKeyAsync(k, {}),
    };
    return _ss;
  }
  return null;
}

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  kyc_status?: string;
  country?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isRestoring: boolean;
  biometricsAvailable: boolean;
  hasBiometricHardware: boolean;
  biometricLoading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signInWithBiometrics: () => Promise<void>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isRestoring: true,
  biometricsAvailable: false,
  hasBiometricHardware: false,
  biometricLoading: false,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signInWithGoogle: async () => {},
  signInWithBiometrics: async () => {},
  enableBiometrics: async () => false,
  disableBiometrics: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[Auth] fetchProfile error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Auth] fetchProfile exception:', err);
    return null;
  }
}

function getUserFullName(user: User): string {
  return user.user_metadata?.full_name
    ?? user.user_metadata?.name
    ?? user.email?.split('@')[0]
    ?? 'User';
}

async function ensureProfile(user: User): Promise<UserProfile | null> {
  const existing = await fetchProfile(user.id);
  if (existing) return existing;

  const fullName = getUserFullName(user);

  console.log('[Auth] Creating profile for user:', user.id);
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
    })
    .select()
    .single();

  if (error) {
    console.warn('[Auth] ensureProfile insert error:', error.message);
    return { id: user.id, email: user.email, full_name: fullName };
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(true);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const hasRestored = useRef(false);

  const checkBiometricsAvailable = useCallback(async () => {
    try {
      const SS = getSecureStore();
      if (!SS) { setBiometricsAvailable(false); return; }
      const at = await SS.getItemAsync(BIO_ACCESS_TOKEN_KEY);
      const rt = await SS.getItemAsync(BIO_REFRESH_TOKEN_KEY);
      setBiometricsAvailable(!!(at && rt));
    } catch {
      setBiometricsAvailable(false);
    }
  }, []);

  const tryAutoBiometricLogin = useCallback(async (): Promise<boolean> => {
    const SS = getSecureStore();
    if (!SS) return false;

    const accessToken = await SS.getItemAsync(BIO_ACCESS_TOKEN_KEY);
    const refreshToken = await SS.getItemAsync(BIO_REFRESH_TOKEN_KEY);
    if (!accessToken || !refreshToken) return false;

    setBiometricLoading(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        await disableBiometrics();
        setBiometricLoading(false);
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock View2Earn',
        fallbackLabel: 'Use password instead',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.warn('[Auth] Biometric setSession failed:', error.message);
          await disableBiometrics();
          setBiometricLoading(false);
          return false;
        }
        console.log('[Auth] Biometric auto-login successful');
        setBiometricLoading(false);
        return true;
      }

      setBiometricLoading(false);
      return false;
    } catch (e) {
      console.warn('[Auth] Biometric auto-login error:', e);
      setBiometricLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    console.log('[Auth] Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    console.log('[Auth] Initializing auth provider...');

    checkBiometricsAvailable();

    (async () => {
      try {
        const hw = await LocalAuthentication.hasHardwareAsync();
        setHasBiometricHardware(hw);
      } catch { setHasBiometricHardware(false); }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] onAuthStateChange event: ${event}, session:`, session?.user?.email ?? 'null');

      setSession(session);
      setUser(session?.user ?? null);

      // Keep biometric tokens perfectly in sync to prevent AuthSessionMissingError
      // when the session auto-refreshes in the background.
      if (session) {
        try {
          const SS = getSecureStore();
          if (SS) {
            const hasBio = await SS.getItemAsync(BIO_ACCESS_TOKEN_KEY).catch(() => null);
            if (hasBio) {
              await SS.setItemAsync(BIO_ACCESS_TOKEN_KEY, session.access_token);
              await SS.setItemAsync(BIO_REFRESH_TOKEN_KEY, session.refresh_token);
            }
          }
        } catch (err) {
          console.warn('[Auth] Sync biometrics error:', err);
        }
      }

      if (!hasRestored.current) {
        console.log('[Auth] First auth state change during restoration');
        setIsRestoring(false);
        setLoading(false);
        hasRestored.current = true;
      }

      if (session?.user) {
        console.log('[Auth] Ensuring profile exists for user...');
        const p = await ensureProfile(session.user).catch(() => null);
        setProfile(p);
        console.log('[Auth] Profile set:', p?.full_name);
      } else {
        setProfile(null);
      }
    });

    (async () => {
      try {
        const biometricUsed = await tryAutoBiometricLogin();

        if (!biometricUsed) {
          let session: Session | null = null;
          try {
            const result = await supabase.auth.getSession();
            session = result.data.session;
          } catch (err) {
            console.warn('[Auth] getSession error:', err);
          }

          const SS = getSecureStore();
          const hasStoredTokens = SS
            ? !!(await SS.getItemAsync(BIO_ACCESS_TOKEN_KEY).catch(() => null)) && !!(await SS.getItemAsync(BIO_REFRESH_TOKEN_KEY).catch(() => null))
            : false;

          if (hasStoredTokens) {
            console.log('[Auth] Biometric tokens exist but auth failed/cancelled — routing to sign-in');
            await supabase.auth.signOut().catch(() => {});
            setSession(null);
            setUser(null);
            setProfile(null);
          } else if (session) {
            console.log('[Auth] getSession result: Session found for', session.user.email);
            setSession(session);
            setUser(session.user);
            const p = await ensureProfile(session.user);
            setProfile(p);
          } else {
            console.log('[Auth] getSession result: No session');
          }
        }
      } catch (err) {
        console.error('[Auth] Restoration error:', err);
      } finally {
        if (!hasRestored.current) {
          hasRestored.current = true;
          setIsRestoring(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      console.log('[Auth] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [tryAutoBiometricLogin, checkBiometricsAvailable]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('[Auth] signUp called for:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: fullName ? { data: { full_name: fullName } } : undefined,
    });
    console.log('[Auth] signUp result:', error ? error.message : 'success');
    return { error: error?.message };
  };

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn called for:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[Auth] signIn result:', error ? error.message : 'success');
    if (!error) {
      checkBiometricsAvailable();
    }
    return { error: error?.message };
  };

  const enableBiometrics = async () => {
    try {
      // Prompt user to verify fingerprint/Face ID before enabling
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to enable biometric login',
        disableDeviceFallback: true, // Force biometric if possible
      });

      if (!authResult.success) {
        console.warn('[Auth] User failed or cancelled biometric verification during setup');
        return false;
      }

      const SS = getSecureStore();
      if (!SS) throw new Error('SecureStore unavailable');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) throw new Error('No active session');
      await SS.setItemAsync(BIO_ACCESS_TOKEN_KEY, currentSession.access_token);
      await SS.setItemAsync(BIO_REFRESH_TOKEN_KEY, currentSession.refresh_token);
      setBiometricsAvailable(true);
      console.log('[Auth] Biometric session tokens saved');
      return true;
    } catch (e) {
      console.warn('[Auth] Failed to save biometric session tokens:', e);
      return false;
    }
  };

  const disableBiometrics = async () => {
    try {
      const SS = getSecureStore();
      if (SS) {
        await SS.deleteItemAsync(BIO_ACCESS_TOKEN_KEY);
        await SS.deleteItemAsync(BIO_REFRESH_TOKEN_KEY);
      }
    } catch {}
    setBiometricsAvailable(false);
    console.log('[Auth] Biometric credentials cleared');
  };

  const signInWithBiometrics = async () => {
    console.log('[Auth] signInWithBiometrics called');
    const SS = getSecureStore();
    if (!SS) throw new Error('SecureStore unavailable');
    try {
      const accessToken = await SS.getItemAsync(BIO_ACCESS_TOKEN_KEY);
      const refreshToken = await SS.getItemAsync(BIO_REFRESH_TOKEN_KEY);
      if (!accessToken || !refreshToken) {
        setBiometricsAvailable(false);
        throw new Error('No biometric credentials saved');
      }
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        await disableBiometrics();
        throw error;
      }
      console.log('[Auth] Biometric sign-in successful');
    } catch (e) {
      console.error('[Auth] Biometric sign-in failed:', e);
      throw e;
    }
  };

  const signOut = async () => {
    console.log('[Auth] signOut called');
    setProfile(null);
    
    // We intercept global.fetch to silently drop the Supabase /logout request.
    // This is the ONLY foolproof way to ensure the session remains perfectly valid
    // on the backend server so the user can log back in using their biometric tokens.
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input && 'url' in input ? input.url : '');
      if (typeof url === 'string' && url.includes('/logout')) {
        console.log('[Auth] Dropped /logout request to preserve biometric session on server.');
        return {
          ok: true,
          status: 200,
          json: async () => ({}),
          text: async () => '{}',
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      }
      return originalFetch(input, init);
    };

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Auth] signOut warning:', e);
    } finally {
      global.fetch = originalFetch;
    }
    
    console.log('[Auth] signOut complete');
  };

  const signInWithGoogle = async () => {
    console.log('[Auth] signInWithGoogle called');

    const redirectUrl = Platform.OS === 'web'
      ? window.location.origin
      : Linking.createURL('/auth/callback');

    console.log('[Auth] MUST ADD THIS redirectUrl TO SUPABASE ALLOW LIST:', redirectUrl);

    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (!data?.url) {
      console.error('[Auth] No OAuth URL returned from Supabase');
      return;
    }

    console.log('[Auth] OAuth URL generated, opening browser...');

    if (Platform.OS === 'web') {
      console.log('[Auth] Web OAuth: navigating to:', data.url);
      window.location.href = data.url;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      console.log('[Auth] WebBrowser result type:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('[Auth] OAuth redirect URL received:', result.url);

        const urlStr = result.url;
        const hashIdx = urlStr.indexOf('#');
        const queryIdx = urlStr.indexOf('?');
        
        let hashParamsStr = '';
        let queryParamsStr = '';

        if (hashIdx !== -1) {
          hashParamsStr = urlStr.substring(hashIdx + 1);
        }
        if (queryIdx !== -1) {
          const endIdx = hashIdx !== -1 && hashIdx > queryIdx ? hashIdx : urlStr.length;
          queryParamsStr = urlStr.substring(queryIdx + 1, endIdx);
        }

        const fragmentParams = new URLSearchParams(hashParamsStr);
        const queryParams = new URLSearchParams(queryParamsStr);

        const accessToken = fragmentParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token') || queryParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[Auth] Setting session from OAuth redirect tokens...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('[Auth] setSession error:', error.message);
          } else {
            console.log('[Auth] Session successfully set from OAuth redirect');
          }
        } else {
          const code = fragmentParams.get('code') || queryParams.get('code');
          if (code) {
            console.log('[Auth] Exchanging authorization code for session (PKCE flow)...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('[Auth] exchangeCodeForSession error:', error.message);
            } else {
              console.log('[Auth] Session successfully set from PKCE exchange');
            }
          } else {
            console.log('[Auth] No auth tokens or code found in redirect URL, relying on onAuthStateChange');
          }
        }
      }
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading, isRestoring, biometricsAvailable,
      hasBiometricHardware, biometricLoading,
      signUp, signIn, signInWithGoogle, signInWithBiometrics,
      enableBiometrics, disableBiometrics, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
