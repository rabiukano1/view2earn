import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Announcement } from '@/context/MockDataContext';

interface Props {
  visible: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onCta?: (link?: string) => void;
}

export function AnnouncementModal({ visible, announcement, onClose, onCta }: Props) {
  const theme = useTheme();
  if (!announcement) return null;

  const color = announcement.color || '#2ECC71';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.wrap}>
          <View style={[styles.banner, { backgroundColor: color + '15' }]}>
            <LinearGradient colors={[color + '20', 'transparent']} style={StyleSheet.absoluteFill} />
            {announcement.imageUrl ? (
              <Image source={{ uri: announcement.imageUrl }} style={styles.bannerImage} />
            ) : (
              <View style={[styles.bannerIcon, { backgroundColor: color }]}>
                <Ionicons name="megaphone" size={28} color="#fff" />
              </View>
            )}
            <ThemedText style={[styles.bannerTitle, { color }]}>{announcement.title}</ThemedText>
            {announcement.subtitle && (
              <ThemedText style={styles.bannerSub}>{announcement.subtitle}</ThemedText>
            )}
          </View>

          <View style={styles.body}>
            <ThemedText style={styles.content}>{announcement.content}</ThemedText>
          </View>

          <View style={styles.actions}>
            {announcement.cta && (
              <Pressable
                onPress={() => onCta?.(announcement.link)}
                style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient colors={[color, color + 'cc']} style={styles.ctaGradient}>
                  <ThemedText style={styles.ctaText}>{announcement.cta}</ThemedText>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  wrap: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    overflow: 'hidden',
  },
  banner: {
    padding: 28,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  bannerSub: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },
  body: {
    padding: 24,
    paddingTop: 20,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#E1E1E1',
  },
  actions: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  ctaBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
