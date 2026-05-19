import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from './themed-text';

interface Props {
  visible: boolean;
  points: number;
  onDismiss: () => void;
}

export function RewardToast({ visible, points, onDismiss }: Props) {
  const progress = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    progress.value = 1;
    progress.value = withTiming(0, { duration: 3000 });
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1a3a2a', '#0f1f18']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#2ECC71', '#27ae60']}
              style={styles.iconGradient}
            >
              <Ionicons name="diamond" size={18} color="#000" />
            </LinearGradient>
          </View>
          <View style={styles.textWrap}>
            <ThemedText style={styles.title}>Reward Earned!</ThemedText>
            <ThemedText style={styles.subtitle}>
              +{points} PTS added to your balance
            </ThemedText>
          </View>
          <View style={styles.pointsBadge}>
            <ThemedText style={styles.pointsText}>+{points}</ThemedText>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 999,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  gradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  pointsBadge: {
    backgroundColor: '#2ECC7120',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2ECC71',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
  },
});
