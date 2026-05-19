import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType } from '@/context/MockDataContext';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: 'send-outline', iconColor: '#2ECC71', label: 'Send Points', route: '/' },
  { icon: 'wallet-outline', iconColor: '#3B82F6', label: 'Wallet', route: '/' },
  { icon: 'time-outline', iconColor: '#8B5CF6', label: 'History', route: '/follower-orders' },
  { icon: 'help-circle-outline', iconColor: '#F59E0B', label: 'Help Center', route: '/' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state } = useMockData();
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAvatarPress = useCallback(() => {
    Alert.alert('Change Avatar', 'Avatar upload coming soon!');
  }, []);

  const handleCopy = useCallback((label: string, value: string) => {
    Alert.alert('Copied', `${label}: ${value}`);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/(tabs)') },
    ]);
  }, []);

  const handleAdminTap = useCallback(() => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount >= 7) {
      setAdminTapCount(0);
      router.push('/admin-panel');
    }
  }, [adminTapCount]);

  const activeOrders = state.orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.headerTitle}>Profile</ThemedText>
        <Pressable onPress={() => {}} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <ThemedView type="backgroundElement" style={styles.profileCard}>
            <Pressable onPress={handleAvatarPress} style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={theme.textSecondary} />
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </View>
            </Pressable>
            <ThemedText type="smallBold" style={styles.profileName}>{state.user.fullName}</ThemedText>
            <Pressable onPress={() => handleCopy('UID', state.user.id)} style={styles.copyChip}>
              <ThemedText type="small" themeColor="textSecondary">{state.user.id.slice(0, 8)}</ThemedText>
              <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleCopy('Email', state.user.email)} style={styles.copyChip}>
              <Ionicons name="mail-outline" size={14} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">{state.user.email}</ThemedText>
            </Pressable>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{state.balance.toLocaleString()}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Points</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>7</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Streak</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{state.completedFollowTasks.length}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Tasks</ThemedText>
              </View>
            </View>
          </ThemedView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Social Media</ThemedText>
            <Pressable
              onPress={() => router.push('/social-connect')}
              style={({ pressed }) => [styles.socialRow, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="globe-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.socialInfo}>
                <ThemedText type="smallBold">Connected Accounts</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {state.connectedAccounts.length} connected
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/follower-orders')}
              style={({ pressed }) => [styles.socialRow, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="clipboard-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.socialInfo}>
                <ThemedText type="smallBold">Active Orders</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {activeOrders} {activeOrders === 1 ? 'order' : 'orders'} in progress
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/follow-to-earn')}
              style={({ pressed }) => [styles.socialRow, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="cash-outline" size={20} color="#F59E0B" />
              </View>
              <View style={styles.socialInfo}>
                <ThemedText type="smallBold">Follow Tasks Completed</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {state.completedFollowTasks.length} tasks done
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          </ThemedView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Account</ThemedText>
            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  if (item.route.startsWith('/')) {
                    router.push(item.route as any);
                  } else {
                    Alert.alert(item.label, 'Coming soon!');
                  }
                }}
                style={({ pressed }) => [
                  styles.menuRow,
                  index < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.textSecondary + '15' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '20' }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <ThemedText type="smallBold" style={styles.menuLabel}>{item.label}</ThemedText>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Pressable>
            ))}
          </ThemedView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <Pressable onPress={handleLogout} style={styles.logoutRow}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <ThemedText style={styles.logoutText}>Log Out</ThemedText>
            </Pressable>
            <Pressable onPress={handleAdminTap} style={styles.versionRow}>
              <ThemedText type="small" themeColor="textSecondary">VIEW2EARN v1.0.0</ThemedText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#070B14',
  },
  profileName: {
    fontSize: 20,
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialInfo: {
    flex: 1,
    gap: 2,
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
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
