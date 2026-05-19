import { useState, useCallback, useMemo } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType, FollowerOrder } from '@/context/MockDataContext';

interface Package {
  id: string;
  followers: number;
  cost: number;
  deliveryTime: string;
  badge?: 'popular' | 'best-value';
}

const PACKAGES: Package[] = [
  { id: 'pkg-1', followers: 100, cost: 500, deliveryTime: '~24h' },
  { id: 'pkg-2', followers: 250, cost: 1000, deliveryTime: '~24h', badge: 'popular' },
  { id: 'pkg-3', followers: 500, cost: 1800, deliveryTime: '~48h', badge: 'best-value' },
  { id: 'pkg-4', followers: 1000, cost: 3000, deliveryTime: '~48h' },
  { id: 'pkg-5', followers: 2500, cost: 6000, deliveryTime: '~72h' },
  { id: 'pkg-6', followers: 5000, cost: 10000, deliveryTime: '~72h' },
];

const PLATFORM_ICONS: Record<PlatformType, keyof typeof Ionicons.glyphMap> = {
  facebook: 'logo-facebook',
  tiktok: 'musical-notes',
  telegram: 'paper-plane',
};

export default function BuyFollowersScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(
    state.connectedAccounts.length > 0 ? state.connectedAccounts[0].platform : null
  );
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const connectedPlatforms = state.connectedAccounts.filter(a => a.isConnected);

  const selectedPkg = PACKAGES.find(p => p.id === selectedPackage);
  const customNum = parseInt(customAmount, 10) || 0;
  const totalFollowers = selectedPkg ? selectedPkg.followers : customNum;
  const totalCost = selectedPkg ? selectedPkg.cost : customNum * 5;
  const hasSufficient = state.balance >= totalCost;
  const canOrder = totalFollowers > 0 && selectedPlatform && hasSufficient;

  const handlePlaceOrder = useCallback(() => {
    if (!selectedPlatform || totalFollowers <= 0) return;

    Alert.alert(
      'Confirm Order',
      `Buy ${totalFollowers} followers on ${selectedPlatform} for ${totalCost} PTS?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: () => {
            const now = new Date();
            const delivery = new Date(now.getTime() + 48 * 60 * 60 * 1000);
            const order: FollowerOrder = {
              id: `V2E-${Math.floor(100000 + Math.random() * 900000)}`,
              platform: selectedPlatform,
              followers: totalFollowers,
              cost: totalCost,
              status: 'pending',
              createdAt: now.toISOString(),
              estimatedDelivery: delivery.toISOString(),
              progress: 0,
            };
            dispatch({ type: 'PLACE_ORDER', order });
            Alert.alert('Success!', 'Your order has been placed.', [
              { text: 'View Orders', onPress: () => router.push('/follower-orders') },
              { text: 'OK', style: 'cancel' },
            ]);
          },
        },
      ]
    );
  }, [selectedPlatform, totalFollowers, totalCost, dispatch]);

  const handlePackageSelect = (id: string) => {
    setSelectedPackage(id);
    setCustomAmount('');
  };

  const handleCustomChange = (text: string) => {
    setCustomAmount(text.replace(/[^0-9]/g, ''));
    setSelectedPackage(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>Buy Followers</ThemedText>
          <View style={styles.balanceChip}>
            <Ionicons name="wallet-outline" size={16} color="#2ECC71" />
            <ThemedText style={styles.balanceText}>{state.balance.toLocaleString()} PTS</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Select Platform</ThemedText>
          {connectedPlatforms.length === 0 ? (
            <View style={styles.noPlatform}>
              <Ionicons name="alert-circle-outline" size={20} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary" style={styles.noPlatformText}>
                Connect a social account first
              </ThemedText>
              <Pressable
                onPress={() => router.push('/social-connect')}
                style={({ pressed }) => [styles.connectBtn, pressed && { opacity: 0.8 }]}
              >
                <ThemedText style={styles.connectBtnText}>Go to Connect</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.chipsRow}>
              {connectedPlatforms.map(acc => (
                <Pressable
                  key={acc.platform}
                  onPress={() => setSelectedPlatform(acc.platform)}
                  style={[
                    styles.chip,
                    selectedPlatform === acc.platform && styles.chipSelected,
                  ]}
                >
                  <Ionicons
                    name={PLATFORM_ICONS[acc.platform]}
                    size={16}
                    color={selectedPlatform === acc.platform ? '#2ECC71' : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    themeColor={selectedPlatform === acc.platform ? undefined : 'textSecondary'}
                    style={selectedPlatform === acc.platform ? { color: '#2ECC71' } : undefined}
                  >
                    {acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Follower Packages</ThemedText>
          {PACKAGES.map((pkg, index) => (
            <Animated.View
              key={pkg.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <Pressable
                onPress={() => handlePackageSelect(pkg.id)}
                style={[
                  styles.packageCard,
                  selectedPackage === pkg.id && styles.packageCardSelected,
                  { borderColor: selectedPackage === pkg.id ? '#2ECC71' : theme.textSecondary + '20' },
                ]}
              >
                <View style={styles.radioOuter}>
                  {selectedPackage === pkg.id && <View style={styles.radioInner} />}
                </View>
                <View style={styles.packageInfo}>
                  <View style={styles.packageHeader}>
                    <ThemedText type="smallBold" style={styles.followersCount}>
                      {pkg.followers.toLocaleString()} followers
                    </ThemedText>
                    {pkg.badge && (
                      <View style={[
                        styles.badge,
                        pkg.badge === 'popular' ? styles.popularBadge : styles.bestValueBadge,
                      ]}>
                        <ThemedText style={[
                          styles.badgeText,
                          { color: pkg.badge === 'popular' ? '#F59E0B' : '#8B5CF6' },
                        ]}>
                          {pkg.badge === 'popular' ? 'POPULAR' : 'BEST VALUE'}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {pkg.deliveryTime} delivery
                  </ThemedText>
                </View>
                <ThemedText style={styles.costText}>{pkg.cost.toLocaleString()} PTS</ThemedText>
              </Pressable>
            </Animated.View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Custom Amount</ThemedText>
          <View style={[styles.customInput, { borderColor: theme.textSecondary + '30' }]}>
            <TextInput
              style={[styles.customField, { color: theme.text }]}
              placeholder="Enter follower count"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={handleCustomChange}
            />
            <ThemedText type="small" themeColor="textSecondary">followers</ThemedText>
          </View>
          {customNum > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Cost: ~{totalCost.toLocaleString()} PTS ({customNum} × 5 PTS)
            </ThemedText>
          )}
        </ThemedView>
      </ScrollView>

      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16, backgroundColor: theme.backgroundElement }]}>
        <View style={styles.summaryRow}>
          <ThemedText type="small" themeColor="textSecondary">Platform</ThemedText>
          <ThemedText type="smallBold">
            {selectedPlatform ? selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1) : '—'}
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText type="small" themeColor="textSecondary">Followers</ThemedText>
          <ThemedText type="smallBold">{totalFollowers.toLocaleString() || '—'}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText type="small" themeColor="textSecondary">Cost</ThemedText>
          <ThemedText type="smallBold" style={{ color: '#2ECC71' }}>{totalCost.toLocaleString()} PTS</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <ThemedText type="small" themeColor="textSecondary">Your Balance</ThemedText>
          <ThemedText type="smallBold">{state.balance.toLocaleString()} PTS</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText type="small" themeColor="textSecondary">After Purchase</ThemedText>
          <ThemedText
            type="smallBold"
            style={{ color: hasSufficient ? theme.text : '#EF4444' }}
          >
            {hasSufficient ? (state.balance - totalCost).toLocaleString() + ' PTS' : 'Insufficient Balance'}
          </ThemedText>
        </View>
        <Pressable
          onPress={handlePlaceOrder}
          disabled={!canOrder}
          style={[
            styles.placeOrderBtn,
            { opacity: canOrder ? 1 : 0.4 },
          ]}
        >
          <ThemedText style={styles.placeOrderText}>Place Order</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <ThemedText themeColor="textSecondary" type="small">Cancel</ThemedText>
        </Pressable>
      </View>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC7120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ECC71',
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
  noPlatform: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  noPlatformText: {
    fontSize: 13,
  },
  connectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#2ECC7120',
  },
  connectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ECC71',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  chipSelected: {
    borderColor: '#2ECC71',
    backgroundColor: '#2ECC7120',
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  packageCardSelected: {
    backgroundColor: '#2ECC7110',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2ECC71',
  },
  packageInfo: {
    flex: 1,
    gap: 4,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followersCount: {
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularBadge: {
    backgroundColor: '#F59E0B20',
  },
  bestValueBadge: {
    backgroundColor: '#8B5CF620',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  costText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2ECC71',
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  customField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
  placeOrderBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
