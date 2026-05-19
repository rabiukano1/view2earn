import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useMockData } from '@/context/MockDataContext';

interface SmartHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightContent?: ReactNode;
  showBalance?: boolean;
  animated?: boolean;
}

export function SmartHeader({
  title,
  subtitle,
  showBack = true,
  rightContent,
  showBalance = false,
  animated = true,
}: SmartHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state } = useMockData();

  const Root = animated ? Animated.View : View;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(46,204,113,0.12)', 'transparent']}
        style={styles.glow}
      />
      <Root entering={animated ? FadeInDown.springify().damping(15) as any : undefined}>
        <View style={styles.row}>
          {showBack && (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
          )}
          <View style={styles.textWrap}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {subtitle && (
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            )}
          </View>
          {rightContent || (
            showBalance ? (
              <LinearGradient colors={['#2ECC71', '#27ae60']} style={styles.balanceChip}>
                <Ionicons name="wallet-outline" size={12} color="#000" />
                <ThemedText style={styles.balanceText}>{state.balance.toLocaleString()}</ThemedText>
              </LinearGradient>
            ) : (
              <Pressable onPress={() => router.push('/profile')} style={styles.avatar}>
                <LinearGradient colors={['#2ECC71', '#27ae60']} style={styles.avatarGradient}>
                  <Ionicons name="person" size={14} color="#000" />
                </LinearGradient>
              </Pressable>
            )
          )}
        </View>
      </Root>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46,204,113,0.08)',
  },
  glow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  textWrap: { flex: 1, gap: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, color: '#fff' },
  subtitle: { fontSize: 11, lineHeight: 15, color: '#8B949E' },
  balanceChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, gap: 5,
  },
  balanceText: { fontSize: 12, fontWeight: '800', color: '#000' },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarGradient: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
});
