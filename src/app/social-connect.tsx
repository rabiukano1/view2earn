import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType } from '@/context/MockDataContext';

const PLATFORM_CONFIG: Record<PlatformType, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  facebook: { color: '#1877F2', icon: 'logo-facebook' },
  tiktok: { color: '#000000', icon: 'musical-notes' },
  telegram: { color: '#0088CC', icon: 'paper-plane' },
};

const PLATFORMS: { key: PlatformType; label: string; subtitle: string }[] = [
  { key: 'facebook', label: 'Connect Facebook', subtitle: 'Link your Facebook page' },
  { key: 'tiktok', label: 'Connect TikTok', subtitle: 'Link your TikTok channel' },
  { key: 'telegram', label: 'Connect Telegram', subtitle: 'Link your Telegram channel' },
];

export default function SocialConnectScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();
  const { connectedAccounts } = state;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleConnect = useCallback((platform: PlatformType) => {
    Alert.alert(
      'Connect Account',
      `This will simulate connecting your ${platform} account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            dispatch({ type: 'CONNECT_ACCOUNT', platform });
            Alert.alert('Success', `${platform} account connected!`);
          },
        },
      ]
    );
  }, [dispatch]);

  const handleDisconnect = useCallback((id: string, name: string) => {
    Alert.alert(
      'Disconnect Account',
      `Disconnect ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => dispatch({ type: 'DISCONNECT_ACCOUNT', id }) },
      ]
    );
  }, [dispatch]);

  const totalFollowers = connectedAccounts.reduce((sum, a) => sum + a.followersCount, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerText}>
          <ThemedText type="subtitle" style={styles.headerTitle}>Connect Social Accounts</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
            Link your channels to start earning and growing
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Connected Accounts</ThemedText>

          {connectedAccounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={40} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No accounts connected yet
              </ThemedText>
            </View>
          ) : (
            connectedAccounts.map((account, index) => (
              <Animated.View
                key={account.id}
                entering={FadeInDown.delay(index * 100).springify()}
              >
                <View style={[styles.accountCard, { borderColor: theme.textSecondary + '30' }]}>
                  <View style={[styles.platformIcon, { backgroundColor: PLATFORM_CONFIG[account.platform].color + '20' }]}>
                    <Ionicons
                      name={PLATFORM_CONFIG[account.platform].icon}
                      size={22}
                      color={PLATFORM_CONFIG[account.platform].color}
                    />
                  </View>
                  <View style={styles.accountInfo}>
                    <ThemedText type="smallBold">{account.displayName}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      @{account.username} • {account.followersCount.toLocaleString()} followers
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#2ECC7120' }]}>
                    <View style={styles.statusDot} />
                    <ThemedText style={styles.statusText}>Connected</ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleDisconnect(account.id, account.displayName)}
                    style={styles.disconnectBtn}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </Animated.View>
            ))
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Add Account</ThemedText>

          {PLATFORMS.map((platform, index) => (
            <Animated.View
              key={platform.key}
              entering={FadeInDown.delay(200 + index * 100).springify()}
            >
              <Pressable
                onPress={() => handleConnect(platform.key)}
                style={({ pressed }) => [
                  styles.addCard,
                  { backgroundColor: PLATFORM_CONFIG[platform.key].color + '15', borderColor: PLATFORM_CONFIG[platform.key].color + '30' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name={PLATFORM_CONFIG[platform.key].icon}
                  size={28}
                  color={PLATFORM_CONFIG[platform.key].color}
                />
                <View style={styles.addCardText}>
                  <ThemedText type="smallBold">{platform.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{platform.subtitle}</ThemedText>
                </View>
                <Ionicons name="add-circle" size={24} color={PLATFORM_CONFIG[platform.key].color} />
              </Pressable>
            </Animated.View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Ionicons name="stats-chart" size={20} color="#2ECC71" />
            <ThemedText type="smallBold" style={styles.statsTitle}>Account Summary</ThemedText>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{connectedAccounts.length}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Connected</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{totalFollowers.toLocaleString()}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Total Followers</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>500</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">PTS Earned</ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 14,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ECC71',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2ECC71',
  },
  disconnectBtn: {
    padding: 4,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  addCardText: {
    flex: 1,
    gap: 2,
  },
  statsCard: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsTitle: {
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
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
});
