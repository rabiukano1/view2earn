import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { MockDataProvider } from '@/context/MockDataContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, isRestoring, biometricLoading } = useAuth();
  const hasRouted = useRef(false);

  useEffect(() => {
    if (loading || isRestoring || biometricLoading) {
      console.log('[AuthGate] Loading/restoring, skipping redirect');
      return;
    }

    if (hasRouted.current) return;
    hasRouted.current = true;

    if (session) {
      console.log('[AuthGate] Session found, routing to tabs');
      router.replace('/(tabs)');
    } else {
      console.log('[AuthGate] No session, routing to splash');
      router.replace('/(splash)');
    }
  }, [session, loading, isRestoring, biometricLoading]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log(`[AuthGate] onAuthStateChange event: ${event}`);
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      }
      if (event === 'SIGNED_IN') {
        console.log('[AuthGate] SIGNED_IN, navigating to tabs');
        hasRouted.current = false;
        router.replace('/(tabs)');
      }
      if (event === 'SIGNED_OUT') {
        console.log('[AuthGate] SIGNED_OUT, navigating to splash');
        hasRouted.current = false;
        router.replace('/(splash)');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading || biometricLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MockDataProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(splash)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="social-connect"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="buy-followers"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="follow-to-earn"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="follower-orders"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="profile"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="admin-panel"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="daily-challenges"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="security"
              options={{ animation: 'slide_from_right' }}
            />
          </Stack>
          <StatusBar style="light" />
        </AuthGate>
      </MockDataProvider>
    </AuthProvider>
  );
}
