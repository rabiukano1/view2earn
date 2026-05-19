import { useState, useMemo, useCallback } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInRight, SlideInLeft } from 'react-native-reanimated';

import { SmartHeader } from '@/components/smart-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, FollowerOrder, PlatformType, OrderStatus } from '@/context/MockDataContext';

type TabKey = 'active' | 'completed' | 'all';

const PLATFORM_ICONS: Record<PlatformType, keyof typeof Ionicons.glyphMap> = {
  facebook: 'logo-facebook',
  tiktok: 'musical-notes',
  telegram: 'paper-plane',
  youtube: 'logo-youtube',
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#F59E0B20' },
  'in-progress': { label: 'In Progress', color: '#3B82F6', bg: '#3B82F620' },
  completed: { label: 'Completed', color: '#2ECC71', bg: '#2ECC7120' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#EF444420' },
};

function OrderCard({ order, index }: { order: FollowerOrder; index: number }) {
  const theme = useTheme();
  const { dispatch } = useMockData();
  const statusCfg = STATUS_CONFIG[order.status];
  const createdDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const handleCancel = useCallback(() => {
    Alert.alert('Cancel Order', `Cancel order ${order.id}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => dispatch({ type: 'CANCEL_ORDER', id: order.id }),
      },
    ]);
  }, [order.id, dispatch]);

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <ThemedView type="backgroundElement" style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.platformBadge, { backgroundColor: '#2ECC7120' }]}>
              <Ionicons name={PLATFORM_ICONS[order.platform]} size={16} color="#2ECC71" />
            </View>
            <View>
              <View style={styles.orderTitleRow}>
                <ThemedText type="smallBold">
                  {order.platform.charAt(0).toUpperCase() + order.platform.slice(1)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">#{order.id}</ThemedText>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
            <ThemedText style={[styles.statusLabel, { color: statusCfg.color }]}>
              {statusCfg.label}
            </ThemedText>
          </View>
        </View>

        {order.status !== 'cancelled' && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <ThemedText type="small" themeColor="textSecondary">
                {Math.floor(order.progress * order.followers / 100)}/{order.followers.toLocaleString()} followers
              </ThemedText>
              <ThemedText type="small" style={{ color: '#2ECC71' }}>{order.progress}%</ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.textSecondary + '20' }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${order.progress}%`, backgroundColor: order.progress >= 100 ? '#2ECC71' : '#3B82F6' },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {order.followers.toLocaleString()} followers
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {order.cost.toLocaleString()} PTS
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {order.status === 'completed' ? `Delivered ${createdDate}` : `Est. ${new Date(order.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </ThemedText>
          </View>
        </View>

        {(order.status === 'pending' || order.status === 'in-progress') && (
          <Pressable onPress={handleCancel} style={styles.cancelOrderBtn}>
            <ThemedText style={styles.cancelOrderText}>Cancel Order</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </Animated.View>
  );
}

export default function FollowerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state } = useMockData();
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ];

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return state.orders.filter(o => o.status === 'pending' || o.status === 'in-progress');
      case 'completed':
        return state.orders.filter(o => o.status === 'completed' || o.status === 'cancelled');
      default:
        return state.orders;
    }
  }, [activeTab, state.orders]);

  const emptyMessages: Record<TabKey, { title: string; subtitle: string }> = {
    active: { title: 'No active orders', subtitle: 'Buy followers to get started!' },
    completed: { title: 'No completed orders yet', subtitle: 'Complete orders will appear here' },
    all: { title: 'No orders yet', subtitle: 'Your order history will appear here' },
  };

  const isEmpty = filteredOrders.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SmartHeader
        title="My Orders"
        subtitle="Track your follower purchases"
        rightContent={
          <Pressable
            onPress={() => router.push('/buy-followers')}
            style={styles.addButton}
          >
            <Ionicons name="add" size={22} color="#2ECC71" />
          </Pressable>
        }
      />

      <View style={[styles.tabBar, { borderBottomColor: theme.textSecondary + '20' }]}>
        {tabs.map(tab => (
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
            >
              {tab.label}
            </ThemedText>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        {isEmpty ? (
          <Animated.View
            entering={activeTab === 'active' ? SlideInLeft : activeTab === 'completed' ? SlideInRight : FadeInDown}
            style={styles.emptyState}
          >
            <Ionicons name="receipt-outline" size={60} color={theme.textSecondary} />
            <ThemedText type="smallBold" style={styles.emptyTitle}>
              {emptyMessages[activeTab].title}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
              {emptyMessages[activeTab].subtitle}
            </ThemedText>
            {activeTab === 'active' && (
              <Pressable
                onPress={() => router.push('/buy-followers')}
                style={styles.buyBtn}
              >
                <ThemedText style={styles.buyBtnText}>Buy Followers</ThemedText>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          filteredOrders.map((order, index) => (
            <OrderCard key={order.id} order={order} index={index} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2ECC7120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2ECC71',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  platformBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  orderDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelOrderBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF444440',
  },
  cancelOrderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  buyBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#2ECC71',
  },
  buyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
