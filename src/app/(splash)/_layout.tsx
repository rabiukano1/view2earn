import { Stack } from 'expo-router';

export default function SplashLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
      <Stack.Screen name="splash-2" />
      <Stack.Screen name="splash-3" />
    </Stack>
  );
}
