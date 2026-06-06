import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { MockDataProvider } from '@/context/MockDataContext';

export default function RootLayout() {
  return (
    <MockDataProvider>
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
      </Stack>
      <StatusBar style="light" />
    </MockDataProvider>
  );
}
