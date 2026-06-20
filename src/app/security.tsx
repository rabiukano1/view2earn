import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SmartHeader } from '@/components/smart-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { biometricsAvailable, hasBiometricHardware, enableBiometrics, disableBiometrics } = useAuth();

  const handleBioToggle = useCallback(() => {
    if (biometricsAvailable) {
      Alert.alert('Disable Biometrics', 'Are you sure you want to remove biometric login?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: () => disableBiometrics() },
      ]);
    } else {
      enableBiometrics().then((ok) => {
        if (ok) {
          Alert.alert('Enabled', 'You can now sign in with your fingerprint or Face ID.');
        } else {
          Alert.alert('Error', 'Failed to enable biometrics. Make sure you are signed in.');
        }
      });
    }
  }, [biometricsAvailable, enableBiometrics, disableBiometrics]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SmartHeader title="Security" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Biometric Login</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionDesc}>
              Use your fingerprint or Face ID to quickly sign in without entering your password.
            </ThemedText>

            {hasBiometricHardware ? (
              <Pressable
                onPress={handleBioToggle}
                style={({ pressed }) => [
                  styles.bioRow,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.bioIconWrap, { backgroundColor: (biometricsAvailable ? '#2ECC71' : theme.textSecondary) + '20' }]}>
                  <Ionicons name="finger-print" size={24} color={biometricsAvailable ? '#2ECC71' : theme.textSecondary} />
                </View>
                <View style={styles.bioInfo}>
                  <ThemedText type="smallBold" style={styles.bioLabel}>Biometric Login</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {biometricsAvailable ? 'Enabled' : 'Disabled'}
                  </ThemedText>
                </View>
                <Ionicons
                  name={biometricsAvailable ? 'toggle' : 'toggle-outline'}
                  size={28}
                  color={biometricsAvailable ? '#2ECC71' : theme.textSecondary}
                />
              </Pressable>
            ) : (
              <ThemedView type="backgroundElement" style={styles.noHardwareCard}>
                <Ionicons name="alert-circle-outline" size={20} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Biometric authentication is not available on this device.
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Account</ThemedText>
            <Pressable
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="person-outline" size={20} color="#3B82F6" />
              </View>
              <ThemedText type="smallBold" style={styles.menuLabel}>Profile</ThemedText>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          </ThemedView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
  },
  sectionDesc: {
    lineHeight: 20,
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  bioIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioInfo: {
    flex: 1,
    gap: 2,
  },
  bioLabel: {
    fontSize: 15,
  },
  noHardwareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
  },
});
