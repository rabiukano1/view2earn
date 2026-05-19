import { useState, useMemo, useCallback } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType } from '@/context/MockDataContext';

type AdminTab = 'orders' | 'escrow' | 'logs';

const PLATFORM_ICONS: Record<PlatformType, keyof typeof Ionicons.glyphMap> = {
  facebook: 'logo-facebook',
  tiktok: 'musical-notes',
  telegram: 'paper-plane',
};

export default function AdminPanelScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const [verifyCount, setVerifyCount] = useState('');
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAuth = useCallback(() => {
    if (passcode === '1234' || state.user.email === 'admin@view2earn.com') {
      setAuthenticated(true);
      setPasscode('');
    } else {
      Alert.alert('Access Denied', 'Invalid passcode');
      setPasscode('');
    }
  }, [passcode, state.user.email]);

  const activeOrders = state.orders.filter(o => o.status === 'pending' || o.status === 'in-progress');
  const escrowOrders = state.orders.filter(o => o.status === 'completed');
  const totalEscrow = escrowOrders.reduce((sum, o) => sum + o.cost, 0);

  const handleVerify = useCallback((orderId: string) => {
    setVerifyOrderId(orderId);
    setVerifyCount('');
    setShowVerifyModal(true);
  }, []);

  const handleConfirmVerify = useCallback(() => {
    if (!verifyOrderId) return;
    const count = parseInt(verifyCount, 10);
    if (isNaN(count)) {
      Alert.alert('Error', 'Enter a valid follower count');
      return;
    }
    dispatch({ type: 'ADMIN_VERIFY_ORDER', orderId: verifyOrderId, progress: count >= 100 ? 100 : count });
    setShowVerifyModal(false);
    setVerifyOrderId(null);
    setVerifyCount('');
    Alert.alert('Verified', 'Order has been updated');
  }, [verifyOrderId, verifyCount, dispatch]);

  const handleReleaseEscrow = useCallback(() => {
    dispatch({ type: 'ADMIN_RELEASE_ESCROW' });
    setShowEscrowModal(false);
    Alert.alert('Released', 'All escrow points have been released');
  }, [dispatch]);

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>Admin Panel</ThemedText>
        </View>
        <View style={styles.lockScreen}>
          <Ionicons name="lock-closed" size={60} color={theme.textSecondary} />
          <ThemedText type="smallBold" style={styles.lockTitle}>Access Denied</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.lockSubtitle}>
            Enter admin passcode
          </ThemedText>
          <TextInput
            style={[styles.passcodeInput, { color: theme.text, borderColor: theme.textSecondary + '30' }]}
            placeholder="Passcode"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={passcode}
            onChangeText={setPasscode}
            onSubmitEditing={handleAuth}
          />
          <Pressable onPress={handleAuth} style={styles.unlockBtn}>
            <ThemedText style={styles.unlockBtnText}>Unlock</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.headerTitle}>Admin Panel</ThemedText>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
          <ThemedText style={styles.adminBadgeText}>Admin</ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <View style={styles.statsGrid}>
          <ThemedView type="backgroundElement" style={styles.statCard}>
            <Ionicons name="cart-outline" size={22} color="#3B82F6" />
            <ThemedText style={styles.statNumber}>{activeOrders.length}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Active Orders</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statCard}>
            <Ionicons name="hourglass-outline" size={22} color="#F59E0B" />
            <ThemedText style={styles.statNumber}>
              {state.orders.filter(o => o.status === 'pending').length}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Pending</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statCard}>
            <Ionicons name="lock-closed-outline" size={22} color="#F59E0B" />
            <ThemedText style={styles.statNumber}>{totalEscrow.toLocaleString()}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Escrow PTS</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statCard}>
            <Ionicons name="people-outline" size={22} color="#2ECC71" />
            <ThemedText style={styles.statNumber}>342</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Total Users</ThemedText>
          </ThemedView>
        </View>

        <View style={[styles.tabBar, { borderBottomColor: theme.textSecondary + '20' }]}>
          {([
            { key: 'orders' as AdminTab, label: 'Active Orders' },
            { key: 'escrow' as AdminTab, label: 'Escrow' },
            { key: 'logs' as AdminTab, label: 'History' },
          ]).map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <ThemedText
                type="smallBold"
                style={[
                  styles.tabText,
                  { color: activeTab === tab.key ? '#2ECC71' : theme.textSecondary },
                ]}
              />
              <ThemedText type="smallBold" style={{ color: activeTab === tab.key ? '#2ECC71' : theme.textSecondary }}>
                {tab.label}
              </ThemedText>
              {activeTab === tab.key && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </View>

        {activeTab === 'orders' && (
          activeOrders.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={40} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary">No active orders</ThemedText>
            </ThemedView>
          ) : (
            activeOrders.map((order, index) => (
              <Animated.View key={order.id} entering={FadeInDown.delay(index * 80).springify()}>
                <ThemedView type="backgroundElement" style={styles.adminOrderCard}>
                  <View style={styles.adminOrderHeader}>
                    <View style={styles.adminOrderLeft}>
                      <Ionicons name={PLATFORM_ICONS[order.platform]} size={16} color="#2ECC71" />
                      <View>
                        <ThemedText type="smallBold">#{order.id}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {order.platform} • {order.followers.toLocaleString()} followers • {order.cost.toLocaleString()} PTS
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, {
                      backgroundColor: order.status === 'pending' ? '#F59E0B20' : '#3B82F620',
                    }]}>
                      <ThemedText style={{
                        fontSize: 11, fontWeight: '600',
                        color: order.status === 'pending' ? '#F59E0B' : '#3B82F6',
                      }}>
                        {order.status === 'pending' ? 'Pending' : 'In Progress'}
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleVerify(order.id)}
                    style={styles.verifyBtn}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                    <ThemedText style={styles.verifyBtnText}>Verify Followers</ThemedText>
                  </Pressable>
                </ThemedView>
              </Animated.View>
            ))
          )
        )}

        {activeTab === 'escrow' && (
          escrowOrders.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <Ionicons name="lock-open-outline" size={40} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary">No orders in escrow</ThemedText>
            </ThemedView>
          ) : (
            escrowOrders.map((order, index) => (
              <Animated.View key={order.id} entering={FadeInDown.delay(index * 80).springify()}>
                <ThemedView type="backgroundElement" style={styles.adminOrderCard}>
                  <View style={styles.adminOrderHeader}>
                    <View style={styles.adminOrderLeft}>
                      <Ionicons name={PLATFORM_ICONS[order.platform]} size={16} color="#2ECC71" />
                      <View>
                        <ThemedText type="smallBold">#{order.id}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {order.platform} • {order.cost.toLocaleString()} PTS held
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#2ECC7120' }]}>
                      <ThemedText style={{ fontSize: 11, fontWeight: '600', color: '#2ECC71' }}>
                        Awaiting Release
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.fulfillerList}>
                    <View style={styles.fulfillerRow}>
                      <Ionicons name="person-circle-outline" size={18} color={theme.textSecondary} />
                      <ThemedText type="small" themeColor="textSecondary">@user1 • TikTok</ThemedText>
                      <ThemedText style={styles.fulfillerPoints}>+25 PTS</ThemedText>
                      <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                    </View>
                    <View style={styles.fulfillerRow}>
                      <Ionicons name="person-circle-outline" size={18} color={theme.textSecondary} />
                      <ThemedText type="small" themeColor="textSecondary">@user2 • TikTok</ThemedText>
                      <ThemedText style={styles.fulfillerPoints}>+25 PTS</ThemedText>
                      <View style={styles.pendingDot} />
                    </View>
                  </View>
                </ThemedView>
              </Animated.View>
            ))
          )
        )}

        {activeTab === 'logs' && (
          <ThemedView type="backgroundElement" style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={40} color={theme.textSecondary} />
            <ThemedText themeColor="textSecondary">Transaction log coming soon</ThemedText>
          </ThemedView>
        )}

        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Manual Actions</ThemedText>
          <View style={styles.manualRow}>
            <Ionicons name="refresh-outline" size={18} color="#3B82F6" />
            <ThemedText type="small" style={{ flex: 1 }}>Refund Order</ThemedText>
            <Pressable
              onPress={() => Alert.alert('Refund', 'Enter order ID to refund (mock)')}
              style={styles.manualBtn}
            >
              <ThemedText style={styles.manualBtnText}>Execute</ThemedText>
            </Pressable>
          </View>
          <View style={styles.manualRow}>
            <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
            <ThemedText type="small" style={{ flex: 1 }}>Adjust Points</ThemedText>
            <Pressable
              onPress={() => {
                Alert.alert('Adjust Points', 'Coming soon!');
              }}
              style={styles.manualBtn}
            >
              <ThemedText style={styles.manualBtnText}>Execute</ThemedText>
            </Pressable>
          </View>
          <View style={styles.manualRow}>
            <Ionicons name="ban-outline" size={18} color="#EF4444" />
            <ThemedText type="small" style={{ flex: 1 }}>Suspend User</ThemedText>
            <Pressable
              onPress={() => Alert.alert('Suspend', 'Coming soon!')}
              style={[styles.manualBtn, { borderColor: '#EF444440' }]}
            >
              <ThemedText style={[styles.manualBtnText, { color: '#EF4444' }]}>Execute</ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        <Pressable
          onPress={() => setShowEscrowModal(true)}
          style={styles.releaseAllBtn}
        >
          <Ionicons name="lock-open" size={18} color="#FFFFFF" />
          <ThemedText style={styles.releaseAllText}>Release All Escrow Points</ThemedText>
        </Pressable>
      </ScrollView>

      <Modal visible={showVerifyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={styles.modalContent}>
            <ThemedText type="smallBold" style={styles.modalTitle}>Verify Followers Delivery</ThemedText>
            <View style={styles.modalBody}>
              <ThemedText type="small" themeColor="textSecondary">Order: #{verifyOrderId}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Current Follower Count:</ThemedText>
              <TextInput
                style={[styles.modalInput, { color: theme.text, borderColor: theme.textSecondary + '30' }]}
                placeholder="Enter count"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={verifyCount}
                onChangeText={setVerifyCount}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowVerifyModal(false)} style={styles.modalCancel}>
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={handleConfirmVerify} style={styles.modalConfirm}>
                <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>Mark as Delivered</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <Modal visible={showEscrowModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={styles.modalContent}>
            <ThemedText type="smallBold" style={styles.modalTitle}>Release Escrow Points</ThemedText>
            <View style={styles.modalBody}>
              <ThemedText type="small" themeColor="textSecondary">
                Total held: {totalEscrow.toLocaleString()} PTS
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Orders: {escrowOrders.length}
              </ThemedText>
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowEscrowModal(false)} style={styles.modalCancel}>
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={handleReleaseEscrow} style={styles.modalConfirm}>
                <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>Release All</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
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
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  lockScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  lockTitle: {
    fontSize: 20,
    marginTop: 8,
  },
  lockSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  passcodeInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  unlockBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabActive: {},
  tabText: {},
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2ECC71',
  },
  adminOrderCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  adminOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  adminOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#2ECC7120',
  },
  verifyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ECC71',
  },
  fulfillerList: {
    gap: 8,
    paddingTop: 4,
  },
  fulfillerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fulfillerPoints: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ECC71',
    marginLeft: 'auto',
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  manualBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3B82F640',
  },
  manualBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  releaseAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2ECC71',
    gap: 8,
  },
  releaseAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 28,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
  },
  modalBody: {
    gap: 10,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
