import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Modal, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from './themed-text';

interface Props {
  visible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  reward?: number;
  adUnitId?: string;
}

export function RewardedAdOverlay({ visible, onComplete, onDismiss, reward }: Props) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowLoading(false);
      return;
    }

    setShowLoading(true);

    const timer = setTimeout(() => {
      setShowLoading(false);
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [visible, onComplete]);

  if (!visible || !showLoading) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.container}
      >
        <LinearGradient
          colors={['#0a0a0f', '#1a1a2e']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <View style={styles.brandCircle}>
            <Ionicons name="flash" size={44} color="#2ECC71" />
          </View>
          <ThemedText style={styles.brandName}>VIEW2EARN</ThemedText>
          <ActivityIndicator size="large" color="#2ECC71" style={{ marginTop: 24 }} />
          <ThemedText style={styles.loadingText}>
            {reward ? `Earning ${reward} coins…` : 'Loading…'}
          </ThemedText>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  brandCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#2ECC71',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
});
