import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';

const { width } = Dimensions.get('window');
const GREEN = '#2ECC71';
const GREEN_DARK = '#27ae60';

export default function Splash2() {
  return (
    <LinearGradient colors={['#000000', '#0a0a0f', '#000000']} style={styles.container}>
      <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.skipWrap}>
        <Pressable onPress={() => router.replace('/(auth)/sign-up')}>
          <ThemedText style={styles.skip}>Skip</ThemedText>
        </Pressable>
      </Animated.View>

      <View style={styles.topSection}>
        <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.iconWrap}>
          <LinearGradient colors={[GREEN, GREEN_DARK]} style={styles.iconBg}>
            <Ionicons name="share-social" size={48} color="#000" />
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.bottomSection}>
        <Animated.View entering={FadeInUp.delay(500).duration(800).springify()}>
          <ThemedText style={styles.title}>Connect{'\n'}Your Accounts</ThemedText>
          <ThemedText style={styles.subtitle}>
            Link your social media profiles and unlock more earning opportunities. The more you connect, the more you earn.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).duration(600)} style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.buttonRow}>
          <Pressable onPress={() => router.push('/(splash)/splash-3')}>
            <LinearGradient
              colors={[GREEN, GREEN_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <ThemedText style={styles.buttonText}>Next</ThemedText>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipWrap: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skip: {
    color: '#8B949E',
    fontSize: 15,
    fontWeight: 600,
  },
  topSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    borderRadius: 100,
    padding: 4,
  },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    width: 24,
    backgroundColor: GREEN,
  },
  buttonRow: {
    gap: 12,
    alignItems: 'center',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: width * 0.7,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 700,
  },
});
