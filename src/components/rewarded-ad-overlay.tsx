import { useEffect, useState, useRef } from 'react';
import { Pressable, StyleSheet, View, Modal } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from './themed-text';

const BRANDS = [
  { name: 'STARGEAR', tagline: 'Next-Gen Audio', color: '#FF6B35', gradient: ['#FF6B35', '#E04E1A'] as const },
  { name: 'VELORA', tagline: 'Premium Skincare', color: '#D4A5E8', gradient: ['#D4A5E8', '#B388D6'] as const },
  { name: 'NOVA', tagline: 'Smart Home Solutions', color: '#4FC3F7', gradient: ['#4FC3F7', '#0288D1'] as const },
  { name: 'PULSE', tagline: 'Fitness Redefined', color: '#2ECC71', gradient: ['#2ECC71', '#1B8A4A'] as const },
];

interface Props {
  visible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  reward?: number;
}

export function RewardedAdOverlay({ visible, onComplete, onDismiss, reward }: Props) {
  const [countdown, setCountdown] = useState(10);
  const [canSkip, setCanSkip] = useState(false);
  const brand = useRef(BRANDS[Math.floor(Math.random() * BRANDS.length)]).current;
  const completedRef = useRef(false);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    completedRef.current = false;
    setCountdown(10);
    setCanSkip(false);

    progress.value = 1;
    progress.value = withTiming(0, { duration: 10000 });

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    const skipTimer = setTimeout(() => setCanSkip(true), 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(skipTimer);
    };
  }, [visible, progress]);

  useEffect(() => {
    if (!visible) return;
    if (countdown > 0 || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [countdown, visible, onComplete]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={styles.container}
      >
        <LinearGradient
          colors={['#0a0a0f', '#1a1a2e']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topBar}>
          <View style={styles.adBadge}>
            <ThemedText style={styles.adBadgeText}>SPONSORED</ThemedText>
          </View>
          {canSkip && (
            <Pressable onPress={onDismiss} style={styles.skipBtn}>
              <ThemedText style={styles.skipText}>Skip</ThemedText>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.brandCircle}>
            <Ionicons name="flash" size={40} color={brand.color} />
          </View>
          <ThemedText style={[styles.brandName, { color: brand.color }]}>
            {brand.name}
          </ThemedText>
          <ThemedText style={styles.brandTagline}>{brand.tagline}</ThemedText>

          <View style={styles.ctaArea}>
            <LinearGradient
              colors={brand.gradient}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <ThemedText style={styles.ctaText}>Watch Ad</ThemedText>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <ThemedText style={styles.countdownText}>
            Ad ends in {countdown}s
          </ThemedText>
          <View style={styles.rewardBadge}>
            <Ionicons name="diamond" size={16} color="#2ECC71" />
            <ThemedText style={styles.rewardText}>+{reward ?? 25} PTS on completion</ThemedText>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  brandCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  ctaArea: {
    marginTop: 32,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bottomSection: {
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 2,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2ECC7115',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ECC71',
  },
});
