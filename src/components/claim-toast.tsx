import { StyleSheet, View, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { ThemedText } from './themed-text';
import { PlatformType } from '@/context/MockDataContext';

const PLATFORM_ICONS: Record<PlatformType, keyof typeof Ionicons.glyphMap> = {
  facebook: 'logo-facebook',
  tiktok: 'musical-notes',
  telegram: 'paper-plane',
  youtube: 'logo-youtube',
};

const PLATFORM_COLORS: Record<PlatformType, string> = {
  facebook: '#1877F2',
  tiktok: '#000000',
  telegram: '#0088CC',
  youtube: '#FF0000',
};

interface Props {
  visible: boolean;
  channelName: string;
  platform: PlatformType;
  reward: number;
  pageUrl?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClaimToast({ visible, channelName, platform, reward, pageUrl, onConfirm, onCancel }: Props) {
  if (!visible) return null;

  const platformColor = PLATFORM_COLORS[platform];
  const platformIcon = PLATFORM_ICONS[platform];

  const handleOpenInApp = () => {
    if (!pageUrl) return;

    if (platform === 'facebook') {
      const fbDeepLink = `fb://facewebmodal/f?href=${encodeURIComponent(pageUrl)}`;
      Linking.openURL(fbDeepLink).catch(() => Linking.openURL(pageUrl));
    } else if (platform === 'telegram') {
      const match = pageUrl.match(/t\.me\/(.+)/);
      if (match) {
        const tgDeepLink = `tg://resolve?domain=${match[1]}`;
        Linking.openURL(tgDeepLink).catch(() => Linking.openURL(pageUrl));
      } else {
        Linking.openURL(pageUrl);
      }
    } else {
      Linking.openURL(pageUrl);
    }
  };

  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      style={styles.overlay}
    >
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <Animated.View
        entering={FadeInUp.duration(400).springify().damping(18)}
        style={styles.container}
      >
        <LinearGradient
          colors={['#1a3a2a', '#0f1f18']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.platformWrap}>
              <LinearGradient
                colors={[platformColor, platformColor + '99']}
                style={styles.platformGradient}
              >
                <Ionicons name={platformIcon} size={22} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.rewardBadge}>
              <ThemedText style={styles.rewardText}>+{reward}</ThemedText>
              <ThemedText style={styles.rewardLabel}>PTS</ThemedText>
            </View>
          </View>

          <View style={styles.body}>
            <ThemedText style={styles.title}>Follow to Earn</ThemedText>
            <ThemedText style={styles.subtitle}>
              Open {platformLabel} and follow{' '}
              <ThemedText style={styles.channelName}>{channelName}</ThemedText>{' '}
              to claim your reward!
            </ThemedText>
          </View>

          {pageUrl && (
            <Pressable onPress={handleOpenInApp} style={({ pressed }) => [
              styles.openBtn,
              { borderColor: platformColor + '40' },
              pressed && { opacity: 0.85 },
            ]}>
              <LinearGradient
                colors={[platformColor + '20', platformColor + '05']}
                style={styles.openGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={platformIcon} size={18} color={platformColor} />
                <ThemedText style={[styles.openText, { color: platformColor }]}>
                  Open in {platformLabel}
                </ThemedText>
                <Ionicons name="open-outline" size={16} color={platformColor} />
              </LinearGradient>
            </Pressable>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.confirmBtn}>
              <LinearGradient
                colors={['#2ECC71', '#27ae60']}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark" size={16} color="#000" />
                <ThemedText style={styles.confirmText}>I Followed</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    margin: 16,
    marginBottom: 100,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  gradient: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
  },
  platformGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBadge: {
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2ECC71',
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2ECC71',
  },
  body: {
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  channelName: {
    color: '#2ECC71',
    fontWeight: '700',
  },
  openBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  openGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  openText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});
