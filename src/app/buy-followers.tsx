import { useState, useCallback, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { SmartHeader } from '@/components/smart-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { KeyboardAvoidingWrapper } from '@/components/keyboard-avoiding-wrapper';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType, FollowerOrder, FollowTask } from '@/context/MockDataContext';

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

const PLATFORM_CONFIG: Record<PlatformType, { icon: keyof typeof Ionicons.glyphMap; color: string; gradient: readonly [string, string]; domains: readonly string[]; urlPattern: string }> = {
  facebook: { icon: 'logo-facebook', color: '#1877F2', gradient: ['#1877F2', '#0D65D9'] as const, domains: ['facebook.com', 'fb.com'], urlPattern: 'facebook.com/[username]' },
  tiktok: { icon: 'musical-notes', color: '#000', gradient: ['#2D2D2D', '#000'] as const, domains: ['tiktok.com'], urlPattern: 'tiktok.com/@[username]' },
  telegram: { icon: 'paper-plane', color: '#0088CC', gradient: ['#0088CC', '#006699'] as const, domains: ['t.me', 'telegram.me'], urlPattern: 't.me/[username]' },
  youtube: { icon: 'logo-youtube', color: '#FF0000', gradient: ['#FF0000', '#CC0000'] as const, domains: ['youtube.com', 'youtu.be'], urlPattern: 'youtube.com/@[username]' },
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
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);
  const dropdownHeight = useSharedValue(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const connectedPlatforms = state.connectedAccounts.filter(a => a.isConnected);

  const urlValidation = useCallback(() => {
    if (!selectedPlatform || !channelUrl.trim()) {
      return { valid: false, error: '', ownershipError: '' };
    }
    const cfg = PLATFORM_CONFIG[selectedPlatform];
    const url = channelUrl.trim().toLowerCase();
    const matchedDomain = cfg.domains.find(d => url.includes(d));
    if (!matchedDomain) {
      return { valid: false, error: `Enter a valid ${selectedPlatform} URL (${cfg.urlPattern})`, ownershipError: '' };
    }
    const username = (() => {
      const after = url.split(matchedDomain)[1] || '';
      const cleaned = after.replace(/^[\/:]+/, '').replace(/^@/, '');
      return cleaned.split(/[\/?#]/)[0];
    })();
    const account = state.connectedAccounts.find(a => a.platform === selectedPlatform && a.isConnected);
    if (account && username && !account.username.toLowerCase().includes(username) && !username.includes(account.username.toLowerCase().replace('@', ''))) {
      return { valid: true, error: '', ownershipError: `@${username} doesn't match your connected ${selectedPlatform} account (@${account.username}). Connect the owner account first.` };
    }
    return { valid: true, error: '', ownershipError: '' };
  }, [selectedPlatform, channelUrl, state.connectedAccounts]);

  const { valid: urlValid, error: urlError, ownershipError } = urlValidation();

  const selectedPkg = PACKAGES.find(p => p.id === selectedPackage);
  const customNum = parseInt(customAmount, 10) || 0;
  const totalFollowers = selectedPkg ? selectedPkg.followers : customNum;
  const totalCost = selectedPkg ? selectedPkg.cost : customNum * 5;
  const hasSufficient = state.balance >= totalCost;
  const canOrder = totalFollowers > 0 && selectedPlatform && hasSufficient && urlValid && !ownershipError;
  const afterBalance = state.balance - totalCost;

  const handlePlaceOrder = useCallback(() => {
    if (!selectedPlatform || totalFollowers <= 0) return;

    const now = new Date();
    const delivery = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const fbAccount = selectedPlatform === 'facebook'
      ? state.connectedAccounts.find(a => a.platform === 'facebook' && a.isConnected)
      : null;
    const order: FollowerOrder = {
      id: `V2E-${Math.floor(100000 + Math.random() * 900000)}`,
      platform: selectedPlatform,
      followers: totalFollowers,
      cost: totalCost,
      status: 'pending',
      createdAt: now.toISOString(),
      estimatedDelivery: delivery.toISOString(),
      progress: 0,
      pageId: fbAccount?.pageId,
      pageUrl: fbAccount?.pageUrl,
    };

    dispatch({ type: 'PLACE_ORDER', order });

    if (fbAccount && fbAccount.pageUrl) {
      const task: FollowTask = {
        id: `task-order-${Date.now()}`,
        platform: 'facebook',
        channelName: fbAccount.displayName,
        category: 'Business',
        reward: 5,
        followers: fbAccount.followersCount.toLocaleString(),
        pageUrl: fbAccount.pageUrl,
      };
      dispatch({ type: 'ADD_FOLLOW_TASKS', tasks: [task] });
    }

    setOrderSuccess(true);
    setTimeout(() => {
      setOrderSuccess(false);
      router.push('/follower-orders');
    }, 1500);
  }, [selectedPlatform, totalFollowers, totalCost, state.connectedAccounts, dispatch]);

  const handlePlatformSelect = useCallback((platform: PlatformType) => {
    setSelectedPlatform(platform);
    setChannelUrl('');
    setUrlTouched(false);
    setPlatformDropdownOpen(false);
  }, []);

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
      <SmartHeader
        title="Buy Followers"
        subtitle="Grow your audience fast"
        showBalance
      />

      <KeyboardAvoidingWrapper>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 220 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="globe-outline" size={16} color="#2ECC71" />
              <ThemedText type="smallBold" style={styles.sectionTitle}>Select Platform</ThemedText>
            </View>
            {connectedPlatforms.length === 0 ? (
              <View style={styles.noPlatform}>
                <Ionicons name="add-circle-outline" size={32} color={theme.textSecondary} />
                <ThemedText themeColor="textSecondary" style={styles.noPlatformText}>
                  No accounts connected
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/social-connect')}
                  style={({ pressed }) => [styles.connectBtn, pressed && { opacity: 0.8 }]}
                >
                  <ThemedText style={styles.connectBtnText}>Connect Now</ThemedText>
                </Pressable>
              </View>
            ) : (
              <>
                <Animated.View entering={FadeInDown.springify()}>
                  <Pressable
                    onPress={() => {
                      dropdownHeight.value = 0;
                      setPlatformDropdownOpen(o => !o);
                    }}
                    style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                  >
                    <LinearGradient
                      colors={selectedPlatform ? PLATFORM_CONFIG[selectedPlatform].gradient : ['#333', '#555']}
                      style={styles.dropdownTrigger}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {selectedPlatform ? (
                        <>
                          <Ionicons name={PLATFORM_CONFIG[selectedPlatform].icon} size={20} color="#fff" />
                          <ThemedText style={styles.dropdownSelected}>
                            {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
                          </ThemedText>
                          <View style={styles.dropdownMeta}>
                            <ThemedText style={styles.dropdownMetaText}>
                              {connectedPlatforms.find(a => a.platform === selectedPlatform)?.followersCount?.toLocaleString()} followers
                            </ThemedText>
                          </View>
                          <View style={styles.dropdownArrow}>
                            <Ionicons
                              name={platformDropdownOpen ? 'chevron-up' : 'chevron-down'}
                              size={18}
                              color="#fff"
                            />
                          </View>
                        </>
                      ) : (
                        <>
                          <Ionicons name="globe-outline" size={20} color={theme.textSecondary} />
                          <ThemedText style={[styles.dropdownSelected, { color: theme.textSecondary }]}>
                            Select platform
                          </ThemedText>
                          <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

                {platformDropdownOpen && (
                  <Animated.View
                    entering={FadeInDown.springify().damping(18)}
                    exiting={FadeInUp.duration(150)}
                    style={styles.dropdownList}
                  >
                    {connectedPlatforms.map((acc, i) => {
                      const cfg = PLATFORM_CONFIG[acc.platform];
                      const isSelected = selectedPlatform === acc.platform;
                      return (
                        <Animated.View key={acc.platform} entering={FadeInDown.delay(i * 50).springify()}>
                          <Pressable
                            onPress={() => handlePlatformSelect(acc.platform)}
                            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                          >
                            <View style={[styles.dropdownItem, isSelected && { backgroundColor: cfg.color + '15' }]}>
                              <LinearGradient
                                colors={cfg.gradient}
                                style={styles.dropdownItemIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              >
                                <Ionicons name={cfg.icon} size={16} color="#fff" />
                              </LinearGradient>
                              <View style={styles.dropdownItemInfo}>
                                <View style={styles.dropdownItemTop}>
                                  <ThemedText style={styles.dropdownItemName}>
                                    {acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1)}
                                  </ThemedText>
                                  {isSelected && <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />}
                                </View>
                                <ThemedText type="small" themeColor="textSecondary">
                                  @{acc.username} · {acc.followersCount.toLocaleString()} followers
                                </ThemedText>
                              </View>
                            </View>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </Animated.View>
                )}
              </>
            )}
          </ThemedView>
        </Animated.View>

        {selectedPlatform && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <ThemedView type="backgroundElement" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="link-outline" size={16} color="#2ECC71" />
                <ThemedText type="smallBold" style={styles.sectionTitle}>Channel URL</ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.urlHint}>
                Enter your {selectedPlatform} profile URL to verify ownership
              </ThemedText>
              <View style={[styles.urlInput, { borderColor: urlTouched && urlError ? '#EF4444' : urlTouched && urlValid && !ownershipError ? '#2ECC71' : theme.textSecondary + '20' }]}>
                <View style={[styles.urlDomain, { backgroundColor: PLATFORM_CONFIG[selectedPlatform].color + '20' }]}>
                  <Ionicons name={PLATFORM_CONFIG[selectedPlatform].icon} size={14} color={PLATFORM_CONFIG[selectedPlatform].color} />
                  <ThemedText style={[styles.urlDomainText, { color: PLATFORM_CONFIG[selectedPlatform].color }]}>
                    {PLATFORM_CONFIG[selectedPlatform].domains[0]}
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.urlField, { color: theme.text }]}
                  placeholder="/your-profile"
                  placeholderTextColor={theme.textSecondary + '60'}
                  value={channelUrl}
                  onChangeText={(text) => { setChannelUrl(text); if (!urlTouched) setUrlTouched(true); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {channelUrl.trim().length > 0 && (
                  <Pressable onPress={() => setChannelUrl('')} style={styles.urlClear}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>
              {urlTouched && urlError && (
                <View style={styles.validationRow}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <ThemedText style={styles.validationError}>{urlError}</ThemedText>
                </View>
              )}
              {urlTouched && ownershipError && (
                <View style={[styles.validationRow, styles.ownershipRow]}>
                  <Ionicons name="warning" size={14} color="#F59E0B" />
                  <ThemedText style={styles.ownershipText}>{ownershipError}</ThemedText>
                </View>
              )}
              {urlTouched && urlValid && !ownershipError && channelUrl.trim().length > 0 && (
                <View style={styles.validationRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#2ECC71" />
                  <ThemedText style={styles.validationSuccess}>Ownership verified</ThemedText>
                </View>
              )}
            </ThemedView>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="layers-outline" size={16} color="#2ECC71" />
              <ThemedText type="smallBold" style={styles.sectionTitle}>Choose Package</ThemedText>
            </View>
            <View style={styles.packagesGrid}>
              {PACKAGES.map((pkg, index) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <Animated.View
                    key={pkg.id}
                    entering={FadeInDown.delay(150 + index * 60).springify()}
                    style={styles.packageItem}
                  >
                    <Pressable
                      onPress={() => handlePackageSelect(pkg.id)}
                      style={({ pressed }) => [
                        styles.packageCard,
                        isSelected && styles.packageCardSelected,
                        { transform: [{ scale: pressed ? 0.97 : 1 }] },
                      ]}
                    >
                      {pkg.badge && (
                        <LinearGradient
                          colors={pkg.badge === 'popular' ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#6D28D9']}
                          style={styles.pkgBadge}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <ThemedText style={styles.pkgBadgeText}>
                            {pkg.badge === 'popular' ? '★ Popular' : '✦ Best Value'}
                          </ThemedText>
                        </LinearGradient>
                      )}
                      <View style={[styles.pkgIconWrap, { backgroundColor: '#2ECC7120' }]}>
                        <Ionicons name="people" size={20} color="#2ECC71" />
                      </View>
                      <ThemedText style={styles.pkgFollowers}>
                        {pkg.followers.toLocaleString()}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.pkgLabel}>followers</ThemedText>
                      <View style={styles.pkgDivider} />
                      <View style={styles.pkgPriceRow}>
                        <Ionicons name="diamond" size={12} color="#2ECC71" />
                        <ThemedText style={styles.pkgCost}>{pkg.cost.toLocaleString()} PTS</ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.pkgDelivery}>
                        {pkg.deliveryTime}
                      </ThemedText>
                      {isSelected && (
                        <Animated.View entering={FadeInUp.springify()} style={styles.selectedRing} />
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            <View style={styles.customSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="options-outline" size={16} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">Custom amount</ThemedText>
              </View>
              <View style={[styles.customInput, { borderColor: customNum > 0 ? '#2ECC71' : theme.textSecondary + '20' }]}>
                <TextInput
                  style={[styles.customField, { color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  value={customAmount}
                  onChangeText={handleCustomChange}
                />
                <ThemedText type="small" themeColor="textSecondary" style={styles.customSuffix}>followers</ThemedText>
                {customNum > 0 && (
                  <View style={styles.customBadge}>
                    <ThemedText style={styles.customBadgeText}>~{(customNum * 5).toLocaleString()} PTS</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </ThemedView>
        </Animated.View>

      </ScrollView>
      </KeyboardAvoidingWrapper>

      <LinearGradient
        colors={[theme.background + '00', theme.background]}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + 16 }]}
      >
        <ThemedView type="backgroundElement" style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryCol}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.summaryLabel}>Followers</ThemedText>
              <ThemedText style={styles.summaryValue}>{totalFollowers.toLocaleString() || '—'}</ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.summaryLabel}>Cost</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#2ECC71' }]}>
                {totalCost > 0 ? `${totalCost.toLocaleString()} PTS` : '—'}
              </ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.summaryLabel}>Balance</ThemedText>
              <ThemedText style={[styles.summaryValue, !hasSufficient && { color: '#EF4444' }]}>
                {hasSufficient ? `${afterBalance.toLocaleString()} PTS` : 'Insufficient'}
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={handlePlaceOrder}
            disabled={!canOrder || orderSuccess}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={canOrder && !orderSuccess ? ['#2ECC71', '#27ae60'] : ['#333', '#555']}
              style={styles.orderBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {orderSuccess ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                  <ThemedText style={styles.orderBtnText}>Order Placed!</ThemedText>
                </>
              ) : !canOrder ? (
                <>
                  <Ionicons name="lock-closed" size={18} color="#fff" />
                  <ThemedText style={[styles.orderBtnText, { color: '#fff' }]}>
                    {!selectedPlatform ? 'Select a platform' : !urlValid ? 'Enter valid channel URL' : ownershipError ? 'Ownership not verified' : !hasSufficient ? 'Insufficient Balance' : 'Enter amount'}
                  </ThemedText>
                </>
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#000" />
                  <ThemedText style={styles.orderBtnText}>Buy {totalFollowers.toLocaleString()} Followers</ThemedText>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </ThemedView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  sectionCard: {
    borderRadius: 24, padding: 18, gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  sectionTitle: { fontSize: 15 },
  noPlatform: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  noPlatformText: { fontSize: 13 },
  connectBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#2ECC71',
  },
  connectBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 18, gap: 10,
  },
  dropdownSelected: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  dropdownMeta: {
    backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  dropdownMetaText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  dropdownArrow: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  dropdownList: {
    borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dropdownItemIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  dropdownItemInfo: { flex: 1, gap: 2 },
  dropdownItemTop: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  dropdownItemName: { fontSize: 15, fontWeight: '700' },
  packagesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  packageItem: { width: '46%' },
  packageCard: {
    borderRadius: 20, padding: 16, gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', position: 'relative', overflow: 'hidden',
  },
  packageCardSelected: {
    borderColor: '#2ECC71',
    backgroundColor: '#2ECC7108',
  },
  pkgBadge: {
    position: 'absolute', top: 8, right: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  pkgBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  pkgIconWrap: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  pkgFollowers: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  pkgLabel: { fontSize: 11, marginTop: -4 },
  pkgDivider: {
    width: 40, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 6,
  },
  pkgPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pkgCost: { fontSize: 14, fontWeight: '700', color: '#2ECC71' },
  pkgDelivery: { fontSize: 10, marginTop: 2 },
  selectedRing: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 22, borderWidth: 2, borderColor: '#2ECC71',
  },
  customSection: { gap: 10, paddingTop: 4 },
  customInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  customField: { flex: 1, fontSize: 18, fontWeight: '700' },
  customSuffix: { fontSize: 13 },
  customBadge: {
    backgroundColor: '#2ECC7120', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  customBadgeText: { fontSize: 11, fontWeight: '700', color: '#2ECC71' },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 24, paddingHorizontal: 16,
  },
  summaryCard: {
    borderRadius: 24, padding: 18, gap: 14,
  },
  summaryTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  summaryCol: { alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.06)' },
  orderBtn: {
    height: 54, borderRadius: 27,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  orderBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },

  // URL Section
  urlHint: { fontSize: 12, lineHeight: 16 },
  urlInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 4, paddingVertical: 4, gap: 6,
  },
  urlDomain: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  urlDomainText: { fontSize: 12, fontWeight: '700' },
  urlField: { flex: 1, fontSize: 14, fontWeight: '600', paddingVertical: 8 },
  urlClear: { padding: 8 },
  validationRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
  },
  validationError: { fontSize: 12, color: '#EF4444', flex: 1, lineHeight: 16 },
  validationSuccess: { fontSize: 12, color: '#2ECC71', fontWeight: '600' },
  ownershipRow: {
    backgroundColor: '#F59E0B10', borderRadius: 12, padding: 10,
  },
  ownershipText: { fontSize: 12, color: '#F59E0B', flex: 1, lineHeight: 16 },
});
