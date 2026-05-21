import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData } from '@/context/MockDataContext';

interface RedeemOption {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  desc: string;
}

const REDEEM_OPTIONS: RedeemOption[] = [
  { icon: 'phone-portrait-outline', color: '#3498DB', label: 'Mobile Airtime', desc: 'MTN, Glo, Airtel, 9mobile' },
  { icon: 'logo-paypal', color: '#003087', label: 'PayPal Transfer', desc: 'Send to your PayPal account' },
  { icon: 'logo-bitcoin', color: '#F1C40F', label: 'Crypto / SDA Token', desc: 'BTC, ETH, USDT, SDA' },
  { icon: 'card-outline', color: '#E67E22', label: 'Amazon Gift Card', desc: 'E-gift code delivered instantly' },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state } = useMockData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const balance = state.balance ?? state.user.balance;
  const usdValue = (balance / 1000).toFixed(2);

  const handleRedeem = (option: RedeemOption) => {
    Alert.alert(
      option.label,
      `Redeem your points for ${option.label}.\n\nThis feature will be available soon. Processing takes 24-48 hours.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeInUp.springify().damping(15)}>
        <View style={[styles.topBarWrapper, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={['rgba(46,204,113,0.12)', 'transparent']}
            style={styles.headerGlow}
          />
          <View style={styles.topBar}>
            <ThemedText style={styles.pageTitle}>Wallet</ThemedText>
            <Pressable style={styles.historyBtn}>
              <Ionicons name="receipt-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <Animated.View entering={FadeInUp.delay(80).springify().damping(15)}>
          <LinearGradient
            colors={['#1a3a2a', '#0f1f18']}
            style={styles.balanceCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.balanceTop}>
              <View style={styles.balanceLabelRow}>
                <View style={styles.balanceDot} />
                <ThemedText style={styles.balanceLabel}>Total Balance</ThemedText>
              </View>
              <View style={styles.statsBadge}>
                <Ionicons name="trending-up" size={12} color="#2ECC71" />
                <ThemedText style={styles.statsBadgeText}>+12%</ThemedText>
              </View>
            </View>
            <View style={styles.balanceRow}>
              <ThemedText style={styles.balanceAmount}>
                {balance.toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.balanceUnit}>PTS</ThemedText>
            </View>
            <View style={styles.usdRow}>
              <Ionicons name="cash-outline" size={14} color="#2ECC71" />
              <ThemedText style={styles.usdText}>
                ≈ ${usdValue} USD
              </ThemedText>
            </View>
            <View style={styles.balanceActions}>
              <Pressable style={styles.actionBtn}>
                <LinearGradient
                  colors={['#2ECC71', '#27ae60']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="arrow-up" size={16} color="#000" />
                  <ThemedText style={styles.actionBtnText}>Transfer</ThemedText>
                </LinearGradient>
              </Pressable>
              <Pressable style={[styles.actionBtnOutline]}>
                <Ionicons name="download-outline" size={16} color="#2ECC71" />
                <ThemedText style={styles.actionOutlineText}>Deposit</ThemedText>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).springify().damping(15)}>
          <View style={styles.statsRow}>
            <ThemedView type="backgroundElement" style={styles.statCard}>
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              <ThemedText type="small" themeColor="textSecondary">Monthly</ThemedText>
              <ThemedText type="smallBold" style={{ color: '#3B82F6' }}>+4,250 PTS</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.statCard}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <ThemedText type="small" themeColor="textSecondary">Pending</ThemedText>
              <ThemedText type="smallBold" style={{ color: '#F59E0B' }}>150 PTS</ThemedText>
            </ThemedView>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(240).springify().damping(15)}>
          <ThemedText type="smallBold" style={styles.sectionLabel}>Redeem Points</ThemedText>
          <View style={styles.redeemGrid}>
            {REDEEM_OPTIONS.map((option, index) => (
              <Animated.View
                key={option.label}
                entering={FadeInDown.delay(300 + index * 60).springify()}
                style={styles.redeemItem}
              >
                <Pressable
                  onPress={() => handleRedeem(option)}
                  style={({ pressed }) => [
                    styles.redeemCard,
                    { backgroundColor: theme.backgroundElement },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <LinearGradient
                    colors={[option.color + '25', option.color + '10']}
                    style={styles.redeemIconWrap}
                  >
                    <Ionicons name={option.icon} size={24} color={option.color} />
                  </LinearGradient>
                  <ThemedText type="smallBold" style={styles.redeemLabel}>{option.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.redeemDesc}>
                    {option.desc}
                  </ThemedText>
                  <View style={[styles.redeemArrow, { backgroundColor: option.color + '20' }]}>
                    <Ionicons name="arrow-forward" size={12} color={option.color} />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).springify().damping(15)}>
          <ThemedView type="backgroundElement" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={18} color="#8B949E" />
              <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
                1,000 PTS = $1.00 USD • Redemptions processed within 24-48 hours
              </ThemedText>
            </View>
          </ThemedView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 16 },

  // Top Bar
  topBarWrapper: {
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46,204,113,0.08)',
  },
  headerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: '#fff' },
  historyBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // Balance Card
  balanceCard: {
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71' },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: '#2ECC71', letterSpacing: 0.3 },
  statsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: '#2ECC7120',
  },
  statsBadgeText: { fontSize: 11, fontWeight: '700', color: '#2ECC71' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  balanceAmount: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  balanceUnit: { fontSize: 20, fontWeight: '700', color: '#2ECC71' },
  usdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  usdText: { fontSize: 13, fontWeight: '600', color: '#2ECC71CC' },
  balanceActions: {
    flexDirection: 'row', gap: 12, marginTop: 4,
  },
  actionBtn: {
    flex: 1, height: 44, borderRadius: 16, overflow: 'hidden',
  },
  actionGradient: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  actionBtnOutline: {
    flex: 1, height: 44, borderRadius: 16,
    borderWidth: 1, borderColor: '#2ECC7140',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionOutlineText: { fontSize: 13, fontWeight: '700', color: '#2ECC71' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, borderRadius: 20, padding: 16, gap: 6,
  },

  // Redeem
  sectionLabel: { fontSize: 16, paddingTop: 4 },
  redeemGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  redeemItem: { width: '47%' },
  redeemCard: {
    borderRadius: 20, padding: 16, gap: 8,
  },
  redeemIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  redeemLabel: { fontSize: 13 },
  redeemDesc: { fontSize: 10, lineHeight: 14 },
  redeemArrow: {
    position: 'absolute', top: 12, right: 12,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  // Info
  infoCard: { borderRadius: 16, padding: 14 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoText: { flex: 1, lineHeight: 18 },
});
