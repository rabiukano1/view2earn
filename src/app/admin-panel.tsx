import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Alert, Dimensions, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SmartHeader } from '@/components/smart-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnnouncementModal } from '@/components/announcement-modal';
import { useMockData, PlatformType, UserStatus, FollowTask, Announcement, AdConfig, AIDynamicTask, AIQuiz, AIQuestion, AITaskType } from '@/context/MockDataContext';

// ─── Light theme constants for admin panel ─────────────────────
const C = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceBorder: '#E8EAEE',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#2ECC71',
  accentDark: '#27ae60',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444',
  shadow: 'rgba(0,0,0,0.06)',
  inputBg: '#F0F1F5',
};

type AdminTab = 'dashboard' | 'orders' | 'tasks' | 'users' | 'payouts' | 'settings' | 'audit' | 'announcements' | 'ads' | 'ai';

interface TabDef {
  key: AdminTab;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'dashboard', icon: 'grid-outline', label: 'Dashboard' },
  { key: 'orders', icon: 'cart-outline', label: 'Orders' },
  { key: 'tasks', icon: 'list-outline', label: 'Tasks' },
  { key: 'users', icon: 'people-outline', label: 'Users' },
  { key: 'payouts', icon: 'wallet-outline', label: 'Payouts' },
  { key: 'announcements', icon: 'megaphone-outline', label: 'Announcements' },
  { key: 'ads', icon: 'tv-outline', label: 'Ads' },
  { key: 'settings', icon: 'settings-outline', label: 'Settings' },
  { key: 'audit', icon: 'document-text-outline', label: 'Audit' },
  { key: 'ai', icon: 'sparkles-outline', label: 'AI' },
];

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  tiktok: '#000',
  telegram: '#0088CC',
  youtube: '#FF0000',
};

const PLATFORM_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  facebook: 'logo-facebook',
  tiktok: 'musical-notes',
  telegram: 'paper-plane',
  youtube: 'logo-youtube',
};

const USER_STATUS_COLORS: Record<string, string> = {
  active: C.accent,
  suspended: C.orange,
  banned: C.red,
};

// ─── Shared components ──────────────────────────────────────────

function AdminCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function AdminBadge({ color, text }: { color: string; text: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <AdminText style={[styles.badgeText, { color }]}>{text}</AdminText>
    </View>
  );
}

function AdminText({ children, style, bold }: { children: React.ReactNode; style?: any; bold?: boolean }) {
  return <ThemedText style={[{ color: C.text }, bold && { fontWeight: '700' }, style]}>{children}</ThemedText>;
}

function AdminMuted({ children, style }: { children: React.ReactNode; style?: any }) {
  return <ThemedText style={[{ color: C.textSecondary, fontSize: 12 }, style]}>{children}</ThemedText>;
}

function AdminInput({ label, value, onChange, placeholder, multiline, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  multiline?: boolean; keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View>
      <AdminText bold style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>{label}</AdminText>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function EmptyState({ icon, title, subtitle }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string;
}) {
  return (
    <Animated.View entering={FadeInUp.springify()}>
      <AdminCard style={styles.emptyCard}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name={icon} size={48} color={C.textMuted} />
        </View>
        <AdminText bold style={styles.emptyTitle}>{title}</AdminText>
        <AdminMuted>{subtitle}</AdminMuted>
      </AdminCard>
    </Animated.View>
  );
}

// ─── Lock Screen ────────────────────────────────────────────────
function LockScreen({ passcode, setPasscode, handleAuth }: {
  passcode: string; setPasscode: (v: string) => void; handleAuth: () => void;
}) {
  return (
    <View style={styles.lockRoot}>
      <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.lockContent}>
        <View style={styles.lockIconWrap}>
          <LinearGradient colors={[C.accent, C.accentDark]} style={styles.lockIconGradient}>
            <Ionicons name="shield-checkmark" size={40} color="#fff" />
          </LinearGradient>
        </View>
        <AdminText bold style={styles.lockTitle}>Admin Access</AdminText>
        <AdminMuted style={styles.lockSub}>Enter passcode to continue</AdminMuted>
        <TextInput
          style={styles.passcodeInput}
          placeholder="••••"
          placeholderTextColor={C.textMuted}
          secureTextEntry
          value={passcode}
          onChangeText={setPasscode}
          onSubmitEditing={handleAuth}
          autoFocus
        />
        <Pressable onPress={handleAuth} style={({ pressed }) => [
          styles.unlockBtn, pressed && { opacity: 0.85 },
        ]}>
          <LinearGradient colors={[C.accent, C.accentDark]} style={styles.unlockGradient}>
            <Ionicons name="lock-open" size={18} color="#fff" />
            <AdminText style={styles.unlockBtnText}>Unlock Panel</AdminText>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Tab Bar ────────────────────────────────────────────────────
function TabBar({ tabs, activeTab, onSelect }: {
  tabs: TabDef[]; activeTab: AdminTab; onSelect: (k: AdminTab) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const tabPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    if (scrollRef.current && tabPositions.current[activeTab] !== undefined) {
      scrollRef.current.scrollTo({ x: tabPositions.current[activeTab] - 16, animated: true });
    }
  }, [activeTab]);

  return (
    <View style={styles.tabBarWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              onLayout={(e) => { tabPositions.current[tab.key] = e.nativeEvent.layout.x; }}
              style={({ pressed }) => [
                styles.tabItem,
                active && styles.tabItemActive,
                pressed && !active && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={active ? '#fff' : C.textSecondary}
              />
              <AdminText style={[
                styles.tabLabel,
                active && styles.tabLabelActive,
              ]}>
                {tab.label}
              </AdminText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Analytics Dashboard Tab ────────────────────────────────────

function MetricCard({ icon, value, label, trend, color }: {
  icon: keyof typeof Ionicons.glyphMap; value: string; label: string;
  trend: number; color: string;
}) {
  const up = trend >= 0;
  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.metricCard}>
      <View style={styles.metricTop}>
        <View style={[styles.metricIconBox, { backgroundColor: color + '12' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Ionicons name={up ? 'trending-up' : 'trending-down'} size={16} color={up ? C.accent : C.red} />
      </View>
      <AdminText bold style={styles.metricValue}>{value}</AdminText>
      <AdminMuted style={{ fontSize: 11 }}>{label}</AdminMuted>
      <AdminText style={{ fontSize: 12, fontWeight: '700', color: up ? C.accent : C.red }}>
        {up ? '+' : ''}{trend.toFixed(1)}%
      </AdminText>
    </Animated.View>
  );
}

function PlatformBar({ platform, count, total }: {
  platform: string; count: number; total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const color = PLATFORM_COLORS[platform] || C.textMuted;
  return (
    <View style={styles.platformBarRow}>
      <View style={styles.platformBarLabel}>
        <Ionicons name={PLATFORM_ICONS[platform] || 'globe-outline'} size={14} color={color} />
        <AdminText style={{ fontSize: 12, textTransform: 'capitalize' }}>{platform}</AdminText>
      </View>
      <View style={styles.platformBarTrack}>
        <View style={[styles.platformBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.platformBarRight}>
        <AdminText bold style={{ fontSize: 12, color: C.text }}>{count}</AdminText>
        <AdminMuted style={{ fontSize: 10, width: 36, textAlign: 'right' }}>{pct.toFixed(0)}%</AdminMuted>
      </View>
    </View>
  );
}

function InsightBlock({ value, label, color, icon }: {
  value: string; label: string; color: string; icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.insightBlock, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Ionicons name={icon} size={13} color={color} />
      <AdminText bold style={[styles.insightBlockValue, { color }]}>{value}</AdminText>
      <AdminMuted style={styles.insightBlockLabel}>{label}</AdminMuted>
    </View>
  );
}

function DashboardTab({ state, dispatch }: { state: any; dispatch: any }) {
  const [period, setPeriod] = useState<'7d' | '30d' | 'custom' | 'all'>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const now = Date.now();

  const periodMs = period === '7d' ? 7 * 86400000 : period === '30d' ? 30 * 86400000 : Infinity;

  const customStartMs = customStart ? new Date(customStart + 'T00:00:00').getTime() : 0;
  const customEndMs = customEnd ? new Date(customEnd + 'T23:59:59').getTime() : Infinity;

  const inPeriod = (dt: string) => {
    const t = new Date(dt).getTime();
    if (period === 'all') return true;
    if (period === 'custom') return t >= customStartMs && t <= customEndMs;
    return (now - t) < periodMs;
  };
  const inPrevPeriod = (dt: string) => {
    if (period === 'all' || period === 'custom') return false;
    const t = new Date(dt).getTime();
    return (now - t) >= periodMs && (now - t) < periodMs * 2;
  };

  const periodLabel = period === '7d' ? '7 days'
    : period === '30d' ? '30 days'
    : period === 'custom' ? customStart && customEnd ? `${customStart} to ${customEnd}` : 'custom'
    : 'all time';

  const allUsers = state.mockUsers;
  const periodUsers = allUsers.filter((u: any) => inPeriod(u.createdAt));
  const activeUsers = periodUsers.filter((u: any) => u.status === 'active');
  const suspendedUsers = periodUsers.filter((u: any) => u.status === 'suspended');
  const bannedUsers = periodUsers.filter((u: any) => u.status === 'banned');

  const allOrders = state.orders;
  const periodOrders = allOrders.filter((o: any) => inPeriod(o.createdAt));
  const pendingOrders = periodOrders.filter((o: any) => o.status === 'pending');
  const progressOrders = periodOrders.filter((o: any) => o.status === 'in-progress');
  const completedOrders = periodOrders.filter((o: any) => o.status === 'completed');
  const cancelledOrders = periodOrders.filter((o: any) => o.status === 'cancelled');

  const periodRevenue = periodOrders.reduce((s: number, o: any) => s + o.cost, 0);
  const prevRevenue = allOrders
    .filter((o: any) => inPrevPeriod(o.createdAt))
    .reduce((s: number, o: any) => s + o.cost, 0);
  const revenueGrowth = prevRevenue > 0 ? ((periodRevenue - prevRevenue) / prevRevenue) * 100 : periodRevenue > 0 ? 100 : 0;

  const periodPayouts = state.payoutRequests.filter((p: any) => inPeriod(p.createdAt));
  const pendingPayouts = periodPayouts.filter((p: any) => p.status === 'pending');

  const prevUsers = allUsers.filter((u: any) => inPrevPeriod(u.createdAt));
  const prevActiveUsers = prevUsers.filter((u: any) => u.status === 'active');
  const userGrowth = prevActiveUsers.length > 0
    ? ((activeUsers.length - prevActiveUsers.length) / prevActiveUsers.length) * 100
    : activeUsers.length > 0 ? 100 : 0;

  const prevActiveOrders = allOrders
    .filter((o: any) => inPrevPeriod(o.createdAt) && (o.status === 'pending' || o.status === 'in-progress'));
  const activeOrders = pendingOrders.concat(progressOrders);
  const orderGrowth = prevActiveOrders.length > 0
    ? ((activeOrders.length - prevActiveOrders.length) / prevActiveOrders.length) * 100
    : activeOrders.length > 0 ? 100 : 0;

  const followTasks = state.followTasks;
  const totalTasks = followTasks.length;
  const platformCounts: Record<string, number> = {};
  followTasks.forEach((t: any) => {
    platformCounts[t.platform] = (platformCounts[t.platform] || 0) + 1;
  });
  const allPlatforms = ['tiktok', 'youtube', 'facebook', 'telegram'];

  const recentAudits = state.auditLog.filter((e: any) => inPeriod(e.timestamp)).slice(0, 4);

  function buildChartData(): { label: string; data: { label: string; value: number }[] } {
    if (period === '7d') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const buckets = Array(7).fill(0);
      allOrders.forEach((o: any) => {
        if (inPeriod(o.createdAt)) buckets[new Date(o.createdAt).getDay()] += o.cost;
      });
      return { label: 'Daily Revenue', data: days.map((l, i) => ({ label: l, value: buckets[i] })) };
    }
    if (period === '30d') {
      const buckets = Array(4).fill(0);
      allOrders.forEach((o: any) => {
        if (inPeriod(o.createdAt)) {
          const week = Math.min(Math.floor((now - new Date(o.createdAt).getTime()) / (7 * 86400000)), 3);
          buckets[week] += o.cost;
        }
      });
      return { label: 'Weekly Revenue', data: buckets.map((v, i) => ({ label: `W${i + 1}`, value: v })) };
    }
    if (period === 'custom') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const buckets = Array(7).fill(0);
      allOrders.forEach((o: any) => {
        if (inPeriod(o.createdAt)) buckets[new Date(o.createdAt).getDay()] += o.cost;
      });
      return { label: 'Period Revenue', data: days.map((l, i) => ({ label: l, value: buckets[i] })) };
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets = Array(12).fill(0);
    allOrders.forEach((o: any) => {
      buckets[new Date(o.createdAt).getMonth()] += o.cost;
    });
    const nonZero = buckets.reduce((a: { label: string; value: number }[], v: number, i: number) => v > 0 ? a.concat({ label: months[i], value: v }) : a, []);
    return { label: 'Monthly Revenue', data: nonZero.length > 0 ? nonZero : months.slice(0, 6).map((l, i) => ({ label: l, value: buckets[i] })) };
  }

  const { label: chartLabel, data: chartData } = buildChartData();
  const maxChart = Math.max(...chartData.map(d => d.value), 1);

  const orderCompletionRate = periodOrders.length > 0
    ? (completedOrders.length / periodOrders.length) * 100
    : 0;

  const applyCustom = () => {
    if (!customStart || !customEnd) { Alert.alert('Error', 'Enter both start and end dates'); return; }
    if (new Date(customEnd) < new Date(customStart)) { Alert.alert('Error', 'End must be after start'); return; }
    setShowDateModal(false);
  };

  return (
    <>
      <View style={styles.segmentWrap}>
        <View style={styles.segmentRow}>
          {(['7d', '30d', 'custom', 'all'] as const).map(p => (
            <Pressable
              key={p}
              onPress={() => {
                if (p === 'custom') { setShowDateModal(true); return; }
                setPeriod(p);
              }}
              style={({ pressed }) => [
                styles.segmentBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[
                  styles.segmentBg,
                  (period === p || (p === 'custom' && showDateModal)) && styles.segmentBgActive,
                ]}
              >
                <Ionicons
                  name={p === '7d' ? 'calendar-outline' : p === '30d' ? 'calendar' : p === 'custom' ? 'options-outline' : 'infinite-outline'}
                  size={13}
                  color={period === p || (p === 'custom' && showDateModal) ? '#fff' : C.textSecondary}
                />
                <AdminText style={[
                  styles.segmentText,
                  (period === p || (p === 'custom' && showDateModal)) && styles.segmentTextActive,
                ]}>
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === 'custom' ? 'Custom' : 'All'}
                </AdminText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {period === 'custom' && customStart && customEnd && (
        <View style={styles.customDateBadge}>
          <Ionicons name="calendar" size={13} color={C.accent} />
          <AdminText style={{ fontSize: 12, color: C.accent, fontWeight: '600' }}>
            {customStart} → {customEnd}
          </AdminText>
          <Pressable onPress={() => { setCustomStart(''); setCustomEnd(''); setPeriod('30d'); }}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </Pressable>
        </View>
      )}

      <View style={styles.metricsGrid}>
        <MetricCard icon="people-outline" value={String(activeUsers.length)} label={`New Users (${periodLabel})`} trend={+userGrowth.toFixed(1)} color={C.accent} />
        <MetricCard icon="cart-outline" value={String(activeOrders.length)} label={`Active Orders (${periodLabel})`} trend={+orderGrowth.toFixed(1)} color={C.blue} />
        <MetricCard icon="diamond" value={periodRevenue.toLocaleString()} label={`Revenue (${periodLabel})`} trend={+revenueGrowth.toFixed(1)} color={C.purple} />
        <MetricCard icon="wallet-outline" value={pendingPayouts.length.toLocaleString()} label={`Pending Payouts (${periodLabel})`} trend={pendingPayouts.length > 0 ? -8.4 : 0} color={C.orange} />
      </View>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: C.blue + '12' }]}>
            <Ionicons name="layers-outline" size={16} color={C.blue} />
          </View>
          <AdminText bold style={{ fontSize: 15 }}>Platform Distribution</AdminText>
        </View>
        {allPlatforms.map(p => (
          <PlatformBar key={p} platform={p} count={platformCounts[p] || 0} total={totalTasks} />
        ))}
        {totalTasks === 0 && (
          <AdminMuted style={{ textAlign: 'center', paddingVertical: 12 }}>No tasks created yet</AdminMuted>
        )}
      </AdminCard>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: C.purple + '12' }]}>
            <Ionicons name="bar-chart-outline" size={16} color={C.purple} />
          </View>
          <AdminText bold style={{ fontSize: 15 }}>{chartLabel} (PTS)</AdminText>
        </View>
        <View style={styles.chartRow}>
          {chartData.map((d, i) => (
            <View key={i} style={styles.chartCol}>
              <Animated.View
                entering={FadeInUp.delay(i * 50).springify()}
                style={[styles.chartBar, {
                  height: `${(d.value / maxChart) * 100}%`,
                  backgroundColor: d.value === maxChart && maxChart > 0 ? C.accent : C.accent + '70',
                }]}
              />
              <AdminMuted style={{ fontSize: 8, marginTop: 3 }}>{d.label}</AdminMuted>
            </View>
          ))}
        </View>
        <View style={styles.chartFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: C.accent }} />
            <AdminMuted style={{ fontSize: 11 }}>Total this period</AdminMuted>
          </View>
          <AdminText bold style={{ color: C.accent, fontSize: 15 }}>{periodRevenue.toLocaleString()} PTS</AdminText>
        </View>
      </AdminCard>

      <View style={styles.insightGrid}>
        <AdminCard style={{ flex: 1 }}>
          <View style={styles.sectionHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: C.accent + '12' }]}>
              <Ionicons name="checkmark-done-outline" size={16} color={C.accent} />
            </View>
            <AdminText bold style={{ fontSize: 14 }}>Orders</AdminText>
          </View>
          <View style={styles.flowRow}>
            <View style={styles.flowStep}>
              <View style={[styles.flowDot, { backgroundColor: C.orange }]} />
              <View style={{ alignItems: 'center' }}>
                <AdminText bold style={{ fontSize: 15, color: C.orange }}>{pendingOrders.length}</AdminText>
                <AdminMuted style={{ fontSize: 9 }}>Pending</AdminMuted>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={13} color={C.textMuted} />
            <View style={styles.flowStep}>
              <View style={[styles.flowDot, { backgroundColor: C.blue }]} />
              <View style={{ alignItems: 'center' }}>
                <AdminText bold style={{ fontSize: 15, color: C.blue }}>{progressOrders.length}</AdminText>
                <AdminMuted style={{ fontSize: 9 }}>Active</AdminMuted>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={13} color={C.textMuted} />
            <View style={styles.flowStep}>
              <View style={[styles.flowDot, { backgroundColor: C.accent }]} />
              <View style={{ alignItems: 'center' }}>
                <AdminText bold style={{ fontSize: 15, color: C.accent }}>{completedOrders.length}</AdminText>
                <AdminMuted style={{ fontSize: 9 }}>Done</AdminMuted>
              </View>
            </View>
            {cancelledOrders.length > 0 && (
              <>
                <View style={styles.flowDivider} />
                <View style={styles.flowStep}>
                  <View style={[styles.flowDot, { backgroundColor: C.red }]} />
                  <View style={{ alignItems: 'center' }}>
                    <AdminText bold style={{ fontSize: 15, color: C.red }}>{cancelledOrders.length}</AdminText>
                    <AdminMuted style={{ fontSize: 9 }}>Cancelled</AdminMuted>
                  </View>
                </View>
              </>
            )}
          </View>
          <View style={styles.insightProgressTrack}>
            <View style={[styles.insightProgressFill, { width: `${orderCompletionRate}%` }]} />
          </View>
          <AdminMuted style={{ fontSize: 10, textAlign: 'center', marginTop: 4 }}>
            {orderCompletionRate.toFixed(0)}% completion ({(pendingOrders.length + progressOrders.length)} active)
          </AdminMuted>
        </AdminCard>

        <AdminCard style={{ flex: 1 }}>
          <View style={styles.sectionHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: C.orange + '12' }]}>
              <Ionicons name="people-outline" size={16} color={C.orange} />
            </View>
            <AdminText bold style={{ fontSize: 14 }}>Users</AdminText>
          </View>
          <View style={styles.insightRow}>
            <InsightBlock value={String(activeUsers.length)} label="Active" color={C.accent} icon="checkmark-circle" />
            <InsightBlock value={String(suspendedUsers.length)} label="Suspended" color={C.orange} icon="pause-circle" />
            <InsightBlock value={String(bannedUsers.length)} label="Banned" color={C.red} icon="ban" />
            <InsightBlock value={String(periodUsers.length)} label="Total" color={C.blue} icon="people" />
          </View>
          <View style={styles.insightProgressTrack}>
            <View style={[styles.insightProgressFill, { width: `${(activeUsers.length / (periodUsers.length || 1)) * 100}%`, backgroundColor: C.accent }]} />
          </View>
          <AdminMuted style={{ fontSize: 10, textAlign: 'center', marginTop: 4 }}>
            {((activeUsers.length / (periodUsers.length || 1)) * 100).toFixed(0)}% active rate
          </AdminMuted>
        </AdminCard>
      </View>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: C.accent + '12' }]}>
            <Ionicons name="timer-outline" size={16} color={C.accent} />
          </View>
          <AdminText bold style={{ fontSize: 15 }}>Recent Activity</AdminText>
        </View>
        {recentAudits.length === 0 ? (
          <AdminMuted style={{ textAlign: 'center', paddingVertical: 16 }}>No recent activity</AdminMuted>
        ) : (
          recentAudits.map((entry: any, i: number) => (
            <Animated.View key={entry.id} entering={FadeInDown.delay(i * 60).springify()}>
              <View style={[styles.activityRow, i < recentAudits.length - 1 && styles.activityBorder]}>
                <View style={[styles.activityDot, {
                  backgroundColor: entry.action.includes('order') ? C.blue
                    : entry.action.includes('escrow') ? C.purple
                    : entry.action.includes('user') ? C.orange : C.accent,
                }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AdminText bold style={{ fontSize: 13, textTransform: 'capitalize' }}>
                    {entry.action.replace(/_/g, ' ')}
                  </AdminText>
                  <AdminMuted style={{ fontSize: 11 }}>{entry.details}</AdminMuted>
                </View>
                <AdminMuted style={{ fontSize: 10 }}>
                  {new Date(entry.timestamp).toLocaleDateString()}
                </AdminMuted>
              </View>
            </Animated.View>
          ))
        )}
      </AdminCard>

      <Modal visible={showDateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300).springify()}>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { backgroundColor: C.blue + '08' }]}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: C.blue }]}>
                  <Ionicons name="calendar" size={24} color="#fff" />
                </View>
                <AdminText bold style={{ fontSize: 18 }}>Custom Date Range</AdminText>
                <AdminMuted style={{ textAlign: 'center' }}>Select start and end dates (YYYY-MM-DD)</AdminMuted>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.dateFieldRow}>
                  <View style={{ flex: 1 }}>
                    <AdminMuted style={{ fontSize: 11, marginBottom: 4 }}>Start Date</AdminMuted>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="2025-01-01"
                      placeholderTextColor={C.textMuted}
                      value={customStart}
                      onChangeText={setCustomStart}
                      maxLength={10}
                    />
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={C.textMuted} style={{ marginTop: 24 }} />
                  <View style={{ flex: 1 }}>
                    <AdminMuted style={{ fontSize: 11, marginBottom: 4 }}>End Date</AdminMuted>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="2025-12-31"
                      placeholderTextColor={C.textMuted}
                      value={customEnd}
                      onChangeText={setCustomEnd}
                      maxLength={10}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={() => setShowDateModal(false)}
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnOutline, pressed && { opacity: 0.8 }]}>
                  <AdminText style={{ fontWeight: '600', color: C.textSecondary }}>Cancel</AdminText>
                </Pressable>
                <Pressable onPress={() => {
                  if (!customStart || !customEnd) { Alert.alert('Error', 'Enter both dates'); return; }
                  if (new Date(customEnd) < new Date(customStart)) { Alert.alert('Error', 'End must be after start'); return; }
                  setPeriod('custom');
                  setShowDateModal(false);
                }}
                  style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                  <LinearGradient colors={[C.blue, '#2563EB']} style={styles.modalBtnSolid}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <AdminText style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}>Apply</AdminText>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// ─── Orders Tab ─────────────────────────────────────────────────
function OrdersTab({ state, dispatch, handleVerify }: {
  state: any; dispatch: any; handleVerify: (id: string) => void;
}) {
  const activeOrders = state.orders.filter((o: any) => o.status === 'pending' || o.status === 'in-progress');
  if (activeOrders.length === 0) {
    return <EmptyState icon="checkmark-circle-outline" title="All Clear" subtitle="No active orders to review" />;
  }

  return activeOrders.map((order: any, index: number) => (
    <Animated.View key={order.id} entering={FadeInDown.delay(index * 80).springify()}>
      <AdminCard>
        <View style={styles.orderTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.platformIcon, { backgroundColor: PLATFORM_COLORS[order.platform] + '12' }]}>
              <Ionicons name={PLATFORM_ICONS[order.platform]} size={18} color={PLATFORM_COLORS[order.platform]} />
            </View>
            <View style={{ gap: 2 }}>
              <AdminText bold style={{ fontSize: 14 }}>#{order.id}</AdminText>
              <AdminMuted>{order.followers.toLocaleString()} followers</AdminMuted>
            </View>
          </View>
          <View style={[styles.orderStatusBadge, {
            backgroundColor: order.status === 'pending' ? C.orange + '15' : C.blue + '15',
          }]}>
            <Ionicons
              name={order.status === 'pending' ? 'time-outline' : 'sync-outline'}
              size={12}
              color={order.status === 'pending' ? C.orange : C.blue}
            />
            <AdminText style={[styles.orderStatusText, {
              color: order.status === 'pending' ? C.orange : C.blue,
            }]}>
              {order.status === 'pending' ? 'Pending' : `${order.progress}%`}
            </AdminText>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {
              width: `${order.progress}%`,
              backgroundColor: order.progress >= 100 ? C.accent : C.orange,
            }]} />
          </View>
          <AdminText style={styles.progressLabel}>{order.progress}%</AdminText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
          <AdminMuted style={{ fontSize: 10 }}>
            {new Date(order.createdAt).toLocaleDateString()} est. {new Date(order.estimatedDelivery).toLocaleDateString()}
          </AdminMuted>
        </View>

        <View style={styles.orderFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="diamond" size={14} color={C.accent} />
            <AdminText bold style={{ color: C.accent }}>{order.cost.toLocaleString()} PTS</AdminText>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Pressable
              onPress={() => dispatch({ type: 'CANCEL_ORDER', id: order.id })}
              style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="close-circle" size={14} color={C.red} />
              <AdminText style={{ fontSize: 12, color: C.red, fontWeight: '600' }}>Cancel</AdminText>
            </Pressable>
            <Pressable
              onPress={() => handleVerify(order.id)}
              style={({ pressed }) => [styles.verifyBtn, pressed && { opacity: 0.85 }]}>
              <LinearGradient colors={[C.accent, C.accentDark]} style={styles.verifyGradient}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <AdminText style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Verify</AdminText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </AdminCard>
    </Animated.View>
  ));
}

// ─── Tasks Tab ──────────────────────────────────────────────────
function TasksTab({ state, dispatch }: { state: any; dispatch: any }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<FollowTask | null>(null);
  const [taskPlatform, setTaskPlatform] = useState<PlatformType>('tiktok');
  const [taskName, setTaskName] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskReward, setTaskReward] = useState('');
  const [taskFollowers, setTaskFollowers] = useState('');
  const [taskUrl, setTaskUrl] = useState('');

  const defaultReward = state.settings?.platforms?.[taskPlatform]?.rewardPerFollow ?? 25;

  useEffect(() => {
    const plat = state.settings?.platforms?.[taskPlatform];
    if (plat && !editTask) {
      setTaskReward(String(plat.rewardPerFollow));
    }
  }, [taskPlatform, state.settings]);

  const resetForm = () => {
    setTaskPlatform('tiktok'); setTaskName(''); setTaskCategory('');
    setTaskReward(String(defaultReward)); setTaskFollowers(''); setTaskUrl('');
  };

  const openEdit = (task: FollowTask) => {
    setEditTask(task);
    setTaskPlatform(task.platform);
    setTaskName(task.channelName);
    setTaskCategory(task.category);
    setTaskReward(String(task.reward));
    setTaskFollowers(task.followers);
    setTaskUrl(task.pageUrl || '');
    setShowCreate(true);
  };

  const isValidPlatformUrl = (url: string, platform: PlatformType): boolean => {
    const patterns: Record<PlatformType, RegExp> = {
      tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@.+/i,
      facebook: /^https?:\/\/(www\.)?(facebook|fb)\.com\/.+/i,
      telegram: /^https?:\/\/(t\.me|telegram\.me)\/.+/i,
      youtube: /^https?:\/\/(www\.)?(youtube\.com\/@|youtube\.com\/channel\/|youtu\.be\/).+/i,
    };
    return patterns[platform].test(url);
  };

  const handleSave = () => {
    if (!taskName.trim() || !taskReward || !taskUrl.trim()) {
      Alert.alert('Error', 'Channel name, reward, and page URL are required');
      return;
    }
    if (!isValidPlatformUrl(taskUrl.trim(), taskPlatform)) {
      const hints: Record<PlatformType, string> = {
        tiktok: 'https://www.tiktok.com/@username',
        facebook: 'https://www.facebook.com/page',
        telegram: 'https://t.me/username',
        youtube: 'https://www.youtube.com/@channel',
      };
      Alert.alert('Invalid URL', `Page URL must be a valid ${taskPlatform} URL.\n\nExpected format:\n${hints[taskPlatform]}`);
      return;
    }
    const task: FollowTask = {
      id: editTask?.id || `task-admin-${Date.now()}`,
      platform: taskPlatform,
      channelName: taskName.trim(),
      category: taskCategory.trim() || 'General',
      reward: parseInt(taskReward, 10) || defaultReward,
      followers: taskFollowers || '1K',
      pageUrl: taskUrl.trim(),
    };
    if (editTask) dispatch({ type: 'ADMIN_UPDATE_TASK', task });
    else dispatch({ type: 'ADD_FOLLOW_TASKS', tasks: [task] });
    setShowCreate(false);
    setEditTask(null);
    resetForm();
  };

  const handleDelete = (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'ADMIN_REMOVE_TASK', taskId }) },
    ]);
  };

  const platforms: PlatformType[] = ['tiktok', 'facebook', 'telegram', 'youtube'];

  return (
    <>
      <Pressable
        onPress={() => { setEditTask(null); resetForm(); setShowCreate(true); }}
        style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
        <LinearGradient colors={[C.accent, C.accentDark]} style={styles.primaryGradient}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <AdminText style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Create Task</AdminText>
        </LinearGradient>
      </Pressable>

      {state.followTasks.map((task: FollowTask, i: number) => (
        <Animated.View key={task.id} entering={FadeInDown.delay(i * 50).springify()}>
          <AdminCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.platformIcon, { backgroundColor: PLATFORM_COLORS[task.platform] + '12' }]}>
                <Ionicons name={PLATFORM_ICONS[task.platform]} size={16} color={PLATFORM_COLORS[task.platform]} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText bold>{task.channelName}</AdminText>
                <AdminMuted>{task.category} • {task.followers} followers</AdminMuted>
              </View>
              <View style={[styles.rewardBadge, { backgroundColor: C.accent + '12' }]}>
                <AdminText bold style={{ color: C.accent, fontSize: 13 }}>+{task.reward}</AdminText>
              </View>
            </View>
            <View style={styles.rowActions}>
              <Pressable onPress={() => openEdit(task)}
                style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                <Ionicons name="create-outline" size={14} color={C.blue} />
                <AdminText style={{ fontSize: 12, color: C.blue, fontWeight: '600' }}>Edit</AdminText>
              </Pressable>
              <Pressable onPress={() => handleDelete(task.id)}
                style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                <Ionicons name="trash-outline" size={14} color={C.red} />
                <AdminText style={{ fontSize: 12, color: C.red, fontWeight: '600' }}>Delete</AdminText>
              </Pressable>
            </View>
          </AdminCard>
        </Animated.View>
      ))}

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300).springify()}>
            <View style={styles.modalContent}>
              <LinearGradient colors={[C.accent + '15', '#fff']} style={styles.modalHeader}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: C.accent }]}>
                  <Ionicons name={editTask ? 'create-outline' : 'add-circle-outline'} size={24} color="#fff" />
                </View>
                <AdminText bold style={{ fontSize: 18 }}>{editTask ? 'Edit Task' : 'New Task'}</AdminText>
              </LinearGradient>
              <View style={styles.modalBody}>
                <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Platform</AdminMuted>
                <View style={styles.platformPicker}>
                  {platforms.map(p => (
                    <Pressable key={p} onPress={() => setTaskPlatform(p)}
                      style={[styles.platformOption, taskPlatform === p && { backgroundColor: PLATFORM_COLORS[p] + '15', borderColor: PLATFORM_COLORS[p] }]}>
                      <Ionicons name={PLATFORM_ICONS[p]} size={18} color={taskPlatform === p ? PLATFORM_COLORS[p] : C.textMuted} />
                    </Pressable>
                  ))}
                </View>
                <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Channel Name</AdminMuted>
                <TextInput style={styles.modalInput} placeholder="e.g. Tech Reviews" placeholderTextColor={C.textMuted} value={taskName} onChangeText={setTaskName} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Category</AdminMuted>
                    <TextInput style={styles.modalInput} placeholder="Tech" placeholderTextColor={C.textMuted} value={taskCategory} onChangeText={setTaskCategory} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Reward</AdminMuted>
                    <TextInput style={styles.modalInput} placeholder="25" placeholderTextColor={C.textMuted} keyboardType="number-pad" value={taskReward} onChangeText={setTaskReward} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Followers</AdminMuted>
                    <TextInput style={styles.modalInput} placeholder="1K" placeholderTextColor={C.textMuted} value={taskFollowers} onChangeText={setTaskFollowers} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Page URL</AdminMuted>
                    <TextInput style={styles.modalInput} placeholder="e.g. https://tiktok.com/@channel" placeholderTextColor={C.textMuted} value={taskUrl} onChangeText={setTaskUrl} />
                  </View>
                </View>
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={() => { setShowCreate(false); setEditTask(null); }}
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnOutline, pressed && { opacity: 0.8 }]}>
                  <AdminText style={{ fontWeight: '600', color: C.textSecondary }}>Cancel</AdminText>
                </Pressable>
                <Pressable onPress={handleSave}
                  style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                  <LinearGradient colors={[C.accent, C.accentDark]} style={styles.modalBtnSolid}>
                    <AdminText style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}>{editTask ? 'Update' : 'Create'}</AdminText>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// ─── Users Tab ──────────────────────────────────────────────────
function UsersTab({ state, dispatch }: { state: any; dispatch: any }) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');

  const filtered = state.mockUsers.filter((u: any) => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    all: state.mockUsers.length,
    active: state.mockUsers.filter((u: any) => u.status === 'active').length,
    suspended: state.mockUsers.filter((u: any) => u.status === 'suspended').length,
    banned: state.mockUsers.filter((u: any) => u.status === 'banned').length,
  };

  const handleStatus = (userId: string, status: UserStatus) => {
    const label = status === 'suspended' ? 'Suspend' : status === 'banned' ? 'Ban' : 'Reactivate';
    Alert.alert(`${label} User`, `Are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: label, style: 'destructive', onPress: () => dispatch({ type: 'ADMIN_SET_USER_STATUS', userId, status }) },
    ]);
  };

  const handleAdjust = () => {
    if (!selectedUser || !adjustAmount) return;
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount)) { Alert.alert('Error', 'Enter a valid amount'); return; }
    dispatch({ type: 'ADMIN_ADJUST_USER_BALANCE', userId: selectedUser.id, amount });
    setSelectedUser(null);
    setAdjustAmount('');
    Alert.alert('Done', `Balance adjusted by ${amount} PTS`);
  };

  return (
    <>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={C.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search users by name or email..." placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} />
        {search ? <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={C.textMuted} /></Pressable> : null}
      </View>

      <View style={styles.userFilterRow}>
        {(['all', 'active', 'suspended', 'banned'] as const).map(s => {
        const filterColor = s === 'all' ? C.blue : s === 'active' ? C.accent : s === 'suspended' ? C.orange : C.red;
        const isActive = statusFilter === s;
        return (
          <Pressable
            key={s}
            onPress={() => setStatusFilter(s)}
            style={({ pressed }) => [
              styles.userFilterBtn,
              isActive && styles.userFilterBtnActive,
              isActive && { backgroundColor: filterColor, borderColor: filterColor },
              pressed && { opacity: 0.8 },
            ]}
          >
            <AdminText style={[
              styles.userFilterText,
              statusFilter === s && { color: '#fff' },
            ]}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </AdminText>
            <View style={[styles.userFilterCount, {
              backgroundColor: statusFilter === s ? 'rgba(255,255,255,0.25)' : C.inputBg,
            }]}>
              <AdminText style={[styles.userFilterCountText, {
                color: statusFilter === s ? '#fff' : C.textSecondary,
              }]}>{(statusCounts as any)[s]}</AdminText>
            </View>
          </Pressable>
        );
      })}
      </View>

      {filtered.map((user: any, i: number) => {
        const statusColor = user.status === 'active' ? C.accent : user.status === 'suspended' ? C.orange : C.red;
        const statusIcon = user.status === 'active' ? 'checkmark-circle' as const : user.status === 'suspended' ? 'pause-circle' as const : 'ban' as const;
        return (
        <Animated.View key={user.id} entering={FadeInDown.delay(i * 50).springify()}>
          <AdminCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LinearGradient
                colors={[statusColor + '20', statusColor + '08']}
                style={styles.userAvatar}>
                <AdminText bold style={{ fontSize: 16, color: statusColor }}>
                  {user.fullName.charAt(0)}
                </AdminText>
              </LinearGradient>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AdminText bold>{user.fullName}</AdminText>
                  <View style={[styles.userStatusTag, { backgroundColor: statusColor + '15' }]}>
                    <Ionicons name={statusIcon} size={10} color={statusColor} />
                    <AdminText style={{ fontSize: 9, fontWeight: '700', color: statusColor, textTransform: 'capitalize' }}>
                      {user.status || 'active'}
                    </AdminText>
                  </View>
                </View>
                <AdminMuted>{user.email}</AdminMuted>
              </View>
              <View style={styles.userBalanceBox}>
                <Ionicons name="diamond" size={12} color={C.accent} />
                <AdminText bold style={{ color: C.accent, fontSize: 14 }}>{user.balance.toLocaleString()}</AdminText>
              </View>
            </View>

            <View style={styles.userStatsRow}>
              <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                <AdminText bold style={{ fontSize: 13 }}>{(user.totalEarned || 0).toLocaleString()}</AdminText>
                <AdminMuted style={{ fontSize: 10 }}>Earned</AdminMuted>
              </View>
              <View style={styles.statDivider} />
              <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                <AdminText bold style={{ fontSize: 13 }}>{(user.totalSpent || 0).toLocaleString()}</AdminText>
                <AdminMuted style={{ fontSize: 10 }}>Spent</AdminMuted>
              </View>
              <View style={styles.statDivider} />
              <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                <AdminText bold style={{ fontSize: 13 }}>{new Date(user.createdAt).toLocaleDateString()}</AdminText>
                <AdminMuted style={{ fontSize: 10 }}>Joined</AdminMuted>
              </View>
            </View>

            <View style={styles.rowActions}>
              {user.status === 'active' ? (
                <Pressable onPress={() => handleStatus(user.id, 'suspended')}
                  style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="pause-circle-outline" size={14} color={C.orange} />
                  <AdminText style={{ fontSize: 12, color: C.orange, fontWeight: '600' }}>Suspend</AdminText>
                </Pressable>
              ) : (
                <Pressable onPress={() => handleStatus(user.id, 'active')}
                  style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={C.accent} />
                  <AdminText style={{ fontSize: 12, color: C.accent, fontWeight: '600' }}>Reactivate</AdminText>
                </Pressable>
              )}
              <Pressable onPress={() => { setSelectedUser(user); setAdjustAmount(''); }}
                style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                <Ionicons name="wallet-outline" size={14} color={C.blue} />
                <AdminText style={{ fontSize: 12, color: C.blue, fontWeight: '600' }}>Adjust</AdminText>
              </Pressable>
              {user.status !== 'banned' && (
                <Pressable onPress={() => handleStatus(user.id, 'banned')}
                  style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="ban-outline" size={14} color={C.red} />
                  <AdminText style={{ fontSize: 12, color: C.red, fontWeight: '600' }}>Ban</AdminText>
                </Pressable>
              )}
            </View>
          </AdminCard>
        </Animated.View>
        );
      })}

      <Modal visible={!!selectedUser} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300).springify()}>
            <View style={styles.modalContent}>
              <LinearGradient colors={[C.blue + '12', '#fff']} style={styles.modalHeader}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: C.blue }]}>
                  <Ionicons name="wallet-outline" size={24} color="#fff" />
                </View>
                <AdminText bold style={{ fontSize: 18 }}>Adjust Balance</AdminText>
                <AdminMuted style={{ textAlign: 'center' }}>{selectedUser?.fullName} • {selectedUser?.balance.toLocaleString()} PTS current</AdminMuted>
              </LinearGradient>
              <View style={styles.modalBody}>
                <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Amount (use - prefix for deduction)</AdminMuted>
                <TextInput style={styles.modalInput} placeholder="e.g. 500 or -200" placeholderTextColor={C.textMuted} keyboardType="number-pad" value={adjustAmount} onChangeText={setAdjustAmount} />
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={() => { setSelectedUser(null); setAdjustAmount(''); }}
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnOutline, pressed && { opacity: 0.8 }]}>
                  <AdminText style={{ fontWeight: '600', color: C.textSecondary }}>Cancel</AdminText>
                </Pressable>
                <Pressable onPress={handleAdjust}
                  style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                  <LinearGradient colors={[C.blue, '#2563EB']} style={styles.modalBtnSolid}>
                    <AdminText style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}>Apply</AdminText>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// ─── Payouts Tab ────────────────────────────────────────────────
function PayoutsTab({ state, dispatch }: { state: any; dispatch: any }) {
  const payouts = state.payoutRequests;
  if (payouts.length === 0) {
    return <EmptyState icon="wallet-outline" title="No Payouts" subtitle="No withdrawal requests yet" />;
  }

  return payouts.map((p: any, i: number) => (
    <Animated.View key={p.id} entering={FadeInDown.delay(i * 60).springify()}>
      <AdminCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LinearGradient colors={[C.accent + '18', C.accent + '08']} style={styles.userAvatar}>
              <AdminText bold style={{ color: C.accent, fontSize: 14 }}>{p.userName.charAt(0)}</AdminText>
            </LinearGradient>
            <View style={{ gap: 2 }}>
              <AdminText bold>{p.userName}</AdminText>
              <AdminMuted>{p.method} • {p.address}</AdminMuted>
            </View>
          </View>
          <AdminBadge
            color={p.status === 'pending' ? C.orange : p.status === 'approved' ? C.accent : C.red}
            text={p.status}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="diamond" size={16} color={C.accent} />
          <AdminText bold style={{ color: C.accent, fontSize: 20, flex: 1 }}>{p.amount.toLocaleString()} PTS</AdminText>
          <AdminMuted style={{ fontSize: 10 }}>{new Date(p.createdAt).toLocaleDateString()}</AdminMuted>
        </View>
        {p.status === 'pending' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => dispatch({ type: 'ADMIN_REJECT_PAYOUT', payoutId: p.id })}
              style={({ pressed }) => [{ flex: 1, borderRadius: 14, overflow: 'hidden' }, pressed && { opacity: 0.85 }]}>
              <LinearGradient colors={[C.red, '#DC2626']} style={{ height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="close" size={16} color="#fff" />
                <AdminText style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Reject</AdminText>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => dispatch({ type: 'ADMIN_APPROVE_PAYOUT', payoutId: p.id })}
              style={({ pressed }) => [{ flex: 1, borderRadius: 14, overflow: 'hidden' }, pressed && { opacity: 0.85 }]}>
              <LinearGradient colors={[C.accent, C.accentDark]} style={{ height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <AdminText style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Approve</AdminText>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </AdminCard>
    </Animated.View>
  ));
}

// ─── Settings Tab ───────────────────────────────────────────────
const PLATFORMS: PlatformType[] = ['facebook', 'tiktok', 'telegram', 'youtube'];

const PLATFORM_LABELS: Record<PlatformType, string> = {
  facebook: 'Facebook',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  youtube: 'YouTube',
};

const PLAT_SETTING_FIELDS = [
  { key: 'rewardPerFollow', label: 'Reward per Follow', suffix: 'PTS' },
  { key: 'dailyFollowLimit', label: 'Daily Follow Limit', suffix: 'tasks' },
  { key: 'bonusAtTasks', label: 'Bonus at Tasks', suffix: 'completed' },
  { key: 'bonusAmount', label: 'Bonus Amount', suffix: 'PTS' },
] as const;

const GLOBAL_SETTING_FIELDS = [
  { key: 'minWithdrawal', label: 'Min Withdrawal', suffix: 'PTS' },
  { key: 'exchangeRate', label: 'Exchange Rate', suffix: 'PTS = $1' },
  { key: 'newUserBonus', label: 'New User Bonus', suffix: 'PTS' },
  { key: 'watchReward', label: 'Reward per Watch', suffix: 'PTS' },
] as const;

function SettingsTab({ state, dispatch }: { state: any; dispatch: any }) {
  const s = state.settings;
  const [editSettings, setEditSettings] = useState(false);
  const [form, setForm] = useState<any>(null);

  const initForm = () => {
    const plat: Record<string, any> = {};
    PLATFORMS.forEach(p => {
      plat[p] = { ...(s.platforms as any)?.[p] };
    });
    setForm({
      platforms: plat,
      minWithdrawal: s.minWithdrawal,
      exchangeRate: s.exchangeRate,
      newUserBonus: s.newUserBonus,
      watchReward: s.watchReward,
    });
  };

  const handleSave = () => {
    if (!form) return;
    dispatch({ type: 'ADMIN_UPDATE_SETTINGS', settings: form });
    setEditSettings(false);
    Alert.alert('Saved', 'Platform settings updated');
  };

  const setPlatVal = (plat: PlatformType, key: string, v: string) => {
    setForm({
      ...form,
      platforms: { ...(form as any)?.platforms, [plat]: { ...(form as any)?.platforms?.[plat], [key]: parseInt(v, 10) || 0 } },
    });
  };

  const setGlobalVal = (key: string, v: string) => {
    setForm({ ...form, [key]: parseInt(v, 10) || 0 });
  };

  const renderPlatCard = (plat: PlatformType) => {
    const color = PLATFORM_COLORS[plat] || C.textMuted;
    return editSettings ? (
      <AdminCard key={plat}>
        <View style={styles.sectionHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: color + '12' }]}>
            <Ionicons name={PLATFORM_ICONS[plat] || 'globe-outline'} size={16} color={color} />
          </View>
          <AdminText bold style={{ fontSize: 15 }}>{PLATFORM_LABELS[plat]}</AdminText>
        </View>
        {PLAT_SETTING_FIELDS.map(f => (
          <View key={f.key} style={{ gap: 4, paddingVertical: 6 }}>
            <AdminText style={{ fontSize: 12, color: C.text }}>{f.label}</AdminText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput style={styles.settingInput}
                value={String((form?.platforms as any)?.[plat]?.[f.key] ?? 0)}
                onChangeText={(v) => setPlatVal(plat, f.key, v)}
                keyboardType="number-pad" />
              <AdminMuted>{f.suffix}</AdminMuted>
            </View>
          </View>
        ))}
      </AdminCard>
    ) : (
      <AdminCard key={plat}>
        <View style={styles.sectionHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: color + '12' }]}>
            <Ionicons name={PLATFORM_ICONS[plat] || 'globe-outline'} size={16} color={color} />
          </View>
          <AdminText bold style={{ fontSize: 15 }}>{PLATFORM_LABELS[plat]}</AdminText>
        </View>
        {PLAT_SETTING_FIELDS.map((f, i) => (
          <View key={f.key} style={[styles.settingRow, i < PLAT_SETTING_FIELDS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.surfaceBorder }]}>
            <AdminText style={{ flex: 1, fontSize: 13, color: C.text }}>{f.label}</AdminText>
            <AdminText bold style={{ color }}>{(s.platforms as any)?.[plat]?.[f.key] ?? '-'} {f.suffix}</AdminText>
          </View>
        ))}
      </AdminCard>
    );
  };

  const renderGlobalCard = (editing: boolean) => {
    if (editing) {
      return (
        <AdminCard>
          <View style={styles.sectionHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: C.accent + '12' }]}>
              <Ionicons name="globe-outline" size={16} color={C.accent} />
            </View>
            <AdminText bold style={{ fontSize: 15 }}>Global Settings</AdminText>
          </View>
          {GLOBAL_SETTING_FIELDS.map(f => (
            <View key={f.key} style={{ gap: 4, paddingVertical: 6 }}>
              <AdminText style={{ fontSize: 12, color: C.text }}>{f.label}</AdminText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput style={styles.settingInput}
                  value={String(form?.[f.key] ?? 0)}
                  onChangeText={(v) => setGlobalVal(f.key, v)}
                  keyboardType="number-pad" />
                <AdminMuted>{f.suffix}</AdminMuted>
              </View>
            </View>
          ))}
        </AdminCard>
      );
    }
    return (
      <AdminCard>
        <View style={styles.sectionHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: C.purple + '12' }]}>
            <Ionicons name="globe-outline" size={16} color={C.purple} />
          </View>
          <AdminText bold style={{ fontSize: 15 }}>Global Settings</AdminText>
        </View>
        {GLOBAL_SETTING_FIELDS.map((f, i) => (
          <View key={f.key} style={[styles.settingRow, i < GLOBAL_SETTING_FIELDS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.surfaceBorder }]}>
            <AdminText style={{ flex: 1, fontSize: 13, color: C.text }}>{f.label}</AdminText>
            <AdminText bold style={{ color: C.accent }}>{(s as any)[f.key]} {f.suffix}</AdminText>
          </View>
        ))}
      </AdminCard>
    );
  };

  return (
    <>
      {!editSettings ? (
        <>
          {PLATFORMS.map(renderPlatCard)}
          {renderGlobalCard(false)}
          <Pressable onPress={() => { initForm(); setEditSettings(true); }}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
            <LinearGradient colors={[C.blue, '#2563EB']} style={styles.primaryGradient}>
              <Ionicons name="create-outline" size={18} color="#fff" />
              <AdminText style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Edit Settings</AdminText>
            </LinearGradient>
          </Pressable>
        </>
      ) : (
        <>
          {PLATFORMS.map(renderPlatCard)}
          {renderGlobalCard(true)}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => { setEditSettings(false); setForm(null); }}
              style={({ pressed }) => [{ flex: 1, height: 50, borderRadius: 25, borderWidth: 1, borderColor: C.surfaceBorder, alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.8 }]}>
              <AdminText style={{ fontWeight: '600', color: C.textSecondary }}>Cancel</AdminText>
            </Pressable>
            <Pressable onPress={handleSave}
              style={({ pressed }) => [{ flex: 1, borderRadius: 25, overflow: 'hidden' }, pressed && { opacity: 0.9 }]}>
              <LinearGradient colors={[C.accent, C.accentDark]} style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AdminText style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Save Changes</AdminText>
              </LinearGradient>
            </Pressable>
          </View>
        </>
      )}
    </>
  );
}

// ─── Ads Control Tab ─────────────────────────────────────────────
function AdsControlTab({ state, dispatch }: { state: any; dispatch: any }) {
  const adConfig = state.adConfig as AdConfig;
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<AdConfig | null>(null);

  const initForm = () => setForm({
    admob: { ...adConfig.admob },
    unityAds: { ...adConfig.unityAds },
    audienceNetwork: { ...adConfig.audienceNetwork },
  });

  const setField = (section: keyof AdConfig, field: string, value: string) => {
    if (!form) return;
    setForm({
      ...form,
      [section]: { ...(form[section] as any), [field]: value },
    });
  };

  const handleSave = () => {
    if (!form) return;
    dispatch({ type: 'ADMIN_UPDATE_AD_CONFIG', adConfig: form });
    setEditMode(false);
    Alert.alert('Saved', 'Ad configuration updated across the platform');
  };

  const getSectionStatus = (section: keyof AdConfig) => {
    const config = adConfig[section] as Record<string, string>;
    const values = Object.values(config);
    const setCount = values.filter(v => v).length;
    if (setCount === 0) return { label: 'Not Configured', color: C.textMuted, icon: 'alert-circle-outline' as const };
    if (setCount === values.length) return { label: 'Fully Configured', color: C.accent, icon: 'checkmark-circle' as const };
    return { label: 'Partial', color: C.orange, icon: 'alert-circle' as const };
  };

  const renderSection = (title: string, icon: keyof typeof Ionicons.glyphMap, color: string, section: keyof AdConfig, fields: { key: string; label: string; placeholder: string }[]) => {
    const status = getSectionStatus(section);
    if (!editMode) {
      const config = adConfig[section] as Record<string, string>;
      return (
        <AdminCard key={title}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={[styles.cardIconBox, { backgroundColor: color + '12' }]}>
              <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <AdminText bold style={{ fontSize: 15 }}>{title}</AdminText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name={status.icon} size={11} color={status.color} />
                <AdminMuted style={{ fontSize: 10, color: status.color }}>{status.label}</AdminMuted>
              </View>
            </View>
          </View>
          {fields.map((f, i) => (
            <View key={f.key} style={[styles.idRow, i < fields.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.surfaceBorder }]}>
              <AdminText style={{ fontSize: 12, color: C.textSecondary, minWidth: 110 }}>{f.label}</AdminText>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {config[f.key] ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: color + '10', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <AdminText style={{ color, fontSize: 11, fontFamily: 'monospace' }}>{config[f.key]}</AdminText>
                    </View>
                  </View>
                ) : (
                  <AdminMuted style={{ fontSize: 11, fontStyle: 'italic' }}>Not set</AdminMuted>
                )}
              </View>
            </View>
          ))}
        </AdminCard>
      );
    }
    return (
      <AdminCard key={title}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={[styles.cardIconBox, { backgroundColor: color + '12' }]}>
            <Ionicons name={icon} size={18} color={color} />
          </View>
          <AdminText bold style={{ fontSize: 15 }}>{title}</AdminText>
        </View>
        {fields.map(f => (
          <View key={f.key} style={{ gap: 4, paddingVertical: 5 }}>
            <AdminText style={{ fontSize: 12, color: C.textSecondary }}>{f.label}</AdminText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput style={[styles.modalInput, { flex: 1 }]}
                value={(form?.[section] as any)?.[f.key] ?? ''}
                onChangeText={(v) => setField(section, f.key, v)}
                placeholder={f.placeholder}
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {(form?.[section] as any)?.[f.key] ? (
                <Pressable onPress={() => setField(section, f.key, '')}
                  style={{ padding: 6, borderRadius: 8, backgroundColor: C.inputBg }}>
                  <Ionicons name="close-circle" size={16} color={C.textMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </AdminCard>
    );
  };

  const allConfigured = useMemo(() => {
    return Object.values(adConfig).every(section =>
      Object.values(section as Record<string, string>).some(v => v)
    );
  }, [adConfig]);

  return (
    <>
      <Animated.View entering={FadeInDown.springify()}>
        <AdminCard style={{ gap: 4 }}>
          <View style={styles.sectionHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: C.purple + '12' }]}>
              <Ionicons name="tv-outline" size={18} color={C.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <AdminText bold style={{ fontSize: 15 }}>Ad Network Configuration</AdminText>
              <AdminMuted style={{ fontSize: 11 }}>Single source of truth for all ad unit IDs</AdminMuted>
            </View>
            <View style={{ backgroundColor: allConfigured ? C.accent + '15' : C.orange + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: allConfigured ? C.accent : C.orange }} />
                <AdminText style={{ fontSize: 10, fontWeight: '600', color: allConfigured ? C.accent : C.orange }}>
                  {allConfigured ? 'All Set' : 'Incomplete'}
                </AdminText>
              </View>
            </View>
          </View>
          <AdminMuted style={{ fontSize: 11, lineHeight: 16 }}>
            Changes take effect immediately across the entire platform. Ad IDs can only be changed from here.
          </AdminMuted>
        </AdminCard>
      </Animated.View>

      {renderSection('AdMob', 'logo-google', C.red, 'admob', [
        { key: 'appOpenId', label: 'App Open Ad ID', placeholder: 'ca-app-pub-xxx/yyy' },
        { key: 'interstitialId', label: 'Interstitial ID', placeholder: 'ca-app-pub-xxx/yyy' },
        { key: 'bannerId', label: 'Banner ID', placeholder: 'ca-app-pub-xxx/yyy' },
        { key: 'rewardedId', label: 'Rewarded ID', placeholder: 'ca-app-pub-xxx/yyy' },
      ])}

      {renderSection('Unity Ads', 'game-controller', C.blue, 'unityAds', [
        { key: 'gameId', label: 'Game ID', placeholder: '1234567' },
      ])}

      {renderSection('Meta Audience Network', 'logo-facebook', '#1877F2', 'audienceNetwork', [
        { key: 'appId', label: 'App ID', placeholder: '123456789012345' },
        { key: 'interstitialPlacementId', label: 'Interstitial Placement ID', placeholder: 'IMG_XX_XXXXXXXX' },
        { key: 'bannerPlacementId', label: 'Banner Placement ID', placeholder: 'BANNER_XX_XXXXXXXX' },
        { key: 'rewardedPlacementId', label: 'Rewarded Placement ID', placeholder: 'REWARDED_XX_XXXXXXXX' },
      ])}

      {!editMode ? (
        <Pressable onPress={() => { initForm(); setEditMode(true); }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
          <LinearGradient colors={[C.purple, '#6D28D9']} style={styles.primaryGradient}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <AdminText style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Edit Ad Config</AdminText>
          </LinearGradient>
        </Pressable>
      ) : (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => { setEditMode(false); setForm(null); }}
            style={({ pressed }) => [{ flex: 1, height: 50, borderRadius: 25, borderWidth: 1, borderColor: C.surfaceBorder, alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.8 }]}>
            <AdminText style={{ fontWeight: '600', color: C.textSecondary }}>Cancel</AdminText>
          </Pressable>
          <Pressable onPress={handleSave}
            style={({ pressed }) => [{ flex: 1, borderRadius: 25, overflow: 'hidden' }, pressed && { opacity: 0.9 }]}>
            <LinearGradient colors={[C.accent, C.accentDark]} style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AdminText style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Save Changes</AdminText>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </>
  );
}

// ─── AI Content Generator Tab ─────────────────────────────────────
const AI_ICONS: { key: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'videocam', icon: 'videocam-outline' },
  { key: 'star', icon: 'star-outline' },
  { key: 'share-social', icon: 'share-social-outline' },
  { key: 'clipboard', icon: 'clipboard-outline' },
  { key: 'people', icon: 'people-outline' },
  { key: 'bulb', icon: 'bulb-outline' },
  { key: 'trophy', icon: 'trophy-outline' },
  { key: 'rocket', icon: 'rocket-outline' },
];

const AI_TASK_TYPES: { key: AITaskType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'challenge', label: 'Challenge' },
];

function AITab({ state, dispatch }: { state: any; dispatch: any }) {
  const [section, setSection] = useState<'tasks' | 'quizzes'>('tasks');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editTask, setEditTask] = useState<AIDynamicTask | null>(null);
  const [editQuiz, setEditQuiz] = useState<AIQuiz | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskType, setTaskType] = useState<AITaskType>('daily');
  const [taskReward, setTaskReward] = useState('30');
  const [taskInstructions, setTaskInstructions] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskIcon, setTaskIcon] = useState('star');

  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizReward, setQuizReward] = useState('75');
  const [quizPassing, setQuizPassing] = useState('2');
  const [quizQuestions, setQuizQuestions] = useState<{ text: string; options: string[]; correct: number }[]>([]);

  const resetTaskForm = () => {
    setTaskTitle(''); setTaskDesc(''); setTaskType('daily'); setTaskReward('30');
    setTaskInstructions(''); setTaskLink(''); setTaskIcon('star'); setEditTask(null);
  };
  const resetQuizForm = () => {
    setQuizTitle(''); setQuizDesc(''); setQuizReward('75'); setQuizPassing('2');
    setQuizQuestions([]); setEditQuiz(null);
  };

  const openEditTask = (t: AIDynamicTask) => {
    setEditTask(t); setTaskTitle(t.title); setTaskDesc(t.description); setTaskType(t.type);
    setTaskReward(String(t.reward)); setTaskInstructions(t.instructions || ''); setTaskLink(t.linkUrl || '');
    setTaskIcon(t.icon || 'star'); setShowTaskForm(true);
  };

  const openEditQuiz = (q: AIQuiz) => {
    setEditQuiz(q); setQuizTitle(q.title); setQuizDesc(q.description);
    setQuizReward(String(q.reward)); setQuizPassing(String(q.passingScore));
    setQuizQuestions(q.questions.map(qq => ({ text: qq.text, options: [...qq.options], correct: qq.correctIndex })));
    setShowQuizForm(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (editTask) {
      dispatch({ type: 'ADMIN_UPDATE_AI_TASK', task: { ...editTask, title: taskTitle, description: taskDesc, type: taskType, reward: parseInt(taskReward) || 0, instructions: taskInstructions || undefined, linkUrl: taskLink || undefined, icon: taskIcon } });
    } else {
      dispatch({ type: 'ADMIN_ADD_AI_TASK', task: { id: `ai-task-${Date.now()}`, title: taskTitle, description: taskDesc, type: taskType, reward: parseInt(taskReward) || 0, instructions: taskInstructions || undefined, linkUrl: taskLink || undefined, icon: taskIcon, createdAt: new Date().toISOString(), active: true } });
    }
    setShowTaskForm(false); resetTaskForm();
  };

  const handleSaveQuiz = () => {
    if (!quizTitle.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (quizQuestions.length === 0) { Alert.alert('Error', 'Add at least one question'); return; }
    const questions: AIQuestion[] = quizQuestions.map((q, i) => ({ id: `q-${Date.now()}-${i}`, text: q.text, options: q.options, correctIndex: q.correct }));
    if (editQuiz) {
      dispatch({ type: 'ADMIN_UPDATE_QUIZ', quiz: { ...editQuiz, title: quizTitle, description: quizDesc, questions, reward: parseInt(quizReward) || 0, passingScore: parseInt(quizPassing) || 1 } });
    } else {
      dispatch({ type: 'ADMIN_ADD_QUIZ', quiz: { id: `quiz-${Date.now()}`, title: quizTitle, description: quizDesc, questions, reward: parseInt(quizReward) || 0, passingScore: parseInt(quizPassing) || 1, createdAt: new Date().toISOString(), active: true } });
    }
    setShowQuizForm(false); resetQuizForm();
  };

  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'ADMIN_REMOVE_AI_TASK', taskId: id }) },
    ]);
  };

  const deleteQuiz = (id: string) => {
    Alert.alert('Delete Quiz', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'ADMIN_REMOVE_QUIZ', quizId: id }) },
    ]);
  };

  const toggleActive = (item: AIDynamicTask | AIQuiz, type: 'task' | 'quiz') => {
    if (type === 'task') {
      dispatch({ type: 'ADMIN_UPDATE_AI_TASK', task: { ...(item as AIDynamicTask), active: !(item as AIDynamicTask).active } });
    } else {
      dispatch({ type: 'ADMIN_UPDATE_QUIZ', quiz: { ...(item as AIQuiz), active: !(item as AIQuiz).active } });
    }
  };

  return (
    <>
      <View style={[styles.section, { marginTop: 4 }]}>
        <View style={styles.aiHeader}>
          <View style={styles.aiHeaderLeft}>
            <View style={[styles.aiIconWrap, { backgroundColor: C.purple + '15' }]}>
              <Ionicons name="sparkles" size={22} color={C.purple} />
            </View>
            <View>
              <AdminText bold style={{ fontSize: 18 }}>AI Content Generator</AdminText>
              <AdminMuted>Create dynamic tasks and quizzes</AdminMuted>
            </View>
          </View>
        </View>

        <View style={styles.aiToggleRow}>
          <Pressable
            onPress={() => setSection('tasks')}
            style={[styles.aiToggle, section === 'tasks' && { backgroundColor: C.accent + '15', borderColor: C.accent }]}
          >
            <Ionicons name="list-outline" size={18} color={section === 'tasks' ? C.accent : C.textSecondary} />
            <AdminText style={[section === 'tasks' && { color: C.accent, fontWeight: '700' }]}>Tasks ({state.aiTasks.length})</AdminText>
          </Pressable>
          <Pressable
            onPress={() => setSection('quizzes')}
            style={[styles.aiToggle, section === 'quizzes' && { backgroundColor: C.blue + '15', borderColor: C.blue }]}
          >
            <Ionicons name="help-circle-outline" size={18} color={section === 'quizzes' ? C.blue : C.textSecondary} />
            <AdminText style={[section === 'quizzes' && { color: C.blue, fontWeight: '700' }]}>Quizzes ({state.aiQuizzes.length})</AdminText>
          </Pressable>
        </View>
      </View>

      {section === 'tasks' ? (
        <View style={styles.section}>
          <View style={styles.aiToolbar}>
            <AdminText bold style={{ fontSize: 15, color: C.text }}>AI Tasks</AdminText>
            <Pressable
              onPress={() => { resetTaskForm(); setShowTaskForm(true); }}
              style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <AdminText style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>New Task</AdminText>
            </Pressable>
          </View>
          <View style={{ gap: 10 }}>
            {state.aiTasks.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
                <Ionicons name="sparkles-outline" size={40} color={C.textMuted} />
                <AdminMuted>No AI tasks yet. Create your first one!</AdminMuted>
              </View>
            ) : state.aiTasks.map((t: AIDynamicTask) => (
              <View key={t.id} style={[styles.aiCard, { borderLeftColor: !t.active ? C.textMuted : t.type === 'daily' ? C.accent : t.type === 'weekly' ? C.blue : C.purple, borderLeftWidth: 3 }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name={(t.icon || 'star') as any} size={16} color={C.text} />
                    <AdminText bold style={{ fontSize: 14, flex: 1 }}>{t.title}</AdminText>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <Pressable onPress={() => openEditTask(t)} style={{ padding: 4 }}><Ionicons name="create-outline" size={16} color={C.blue} /></Pressable>
                      <Pressable onPress={() => deleteTask(t.id)} style={{ padding: 4 }}><Ionicons name="trash-outline" size={16} color={C.red} /></Pressable>
                    </View>
                  </View>
                  <AdminMuted numberOfLines={2}>{t.description}</AdminMuted>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <View style={[styles.aiBadge, { backgroundColor: t.type === 'daily' ? C.accent + '15' : t.type === 'weekly' ? C.blue + '15' : C.purple + '15' }]}>
                      <AdminText style={{ fontSize: 10, fontWeight: '700', color: t.type === 'daily' ? C.accent : t.type === 'weekly' ? C.blue : C.purple, textTransform: 'uppercase' }}>{t.type}</AdminText>
                    </View>
                    <AdminText bold style={{ fontSize: 12, color: C.accent }}>+{t.reward} PTS</AdminText>
                    <Pressable onPress={() => toggleActive(t, 'task')} style={{ marginLeft: 'auto' }}>
                      <Ionicons name={t.active ? 'checkmark-circle' : 'close-circle'} size={18} color={t.active ? C.accent : C.textMuted} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.aiToolbar}>
            <AdminText bold style={{ fontSize: 15, color: C.text }}>AI Quizzes</AdminText>
            <Pressable
              onPress={() => { resetQuizForm(); setShowQuizForm(true); }}
              style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <AdminText style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>New Quiz</AdminText>
            </Pressable>
          </View>
          <View style={{ gap: 10 }}>
            {state.aiQuizzes.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
                <Ionicons name="help-circle-outline" size={40} color={C.textMuted} />
                <AdminMuted>No quizzes yet. Create your first one!</AdminMuted>
              </View>
            ) : state.aiQuizzes.map((q: AIQuiz) => (
              <View key={q.id} style={[styles.aiCard, { borderLeftColor: !q.active ? C.textMuted : C.blue, borderLeftWidth: 3 }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="help-circle" size={16} color={C.blue} />
                    <AdminText bold style={{ fontSize: 14, flex: 1 }}>{q.title}</AdminText>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <Pressable onPress={() => openEditQuiz(q)} style={{ padding: 4 }}><Ionicons name="create-outline" size={16} color={C.blue} /></Pressable>
                      <Pressable onPress={() => deleteQuiz(q.id)} style={{ padding: 4 }}><Ionicons name="trash-outline" size={16} color={C.red} /></Pressable>
                    </View>
                  </View>
                  <AdminMuted numberOfLines={2}>{q.description}</AdminMuted>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <AdminText style={{ fontSize: 11, color: C.textSecondary }}>{q.questions.length} questions</AdminText>
                    <AdminText style={{ fontSize: 11, color: C.textSecondary }}>•</AdminText>
                    <AdminText style={{ fontSize: 11, color: C.textSecondary }}>Pass: {q.passingScore}/{q.questions.length}</AdminText>
                    <AdminText bold style={{ fontSize: 12, color: C.accent, marginLeft: 'auto' }}>+{q.reward} PTS</AdminText>
                    <Pressable onPress={() => toggleActive(q, 'quiz')}>
                      <Ionicons name={q.active ? 'checkmark-circle' : 'close-circle'} size={18} color={q.active ? C.accent : C.textMuted} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <Modal visible={showTaskForm} transparent animationType="fade" onRequestClose={() => { setShowTaskForm(false); resetTaskForm(); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <AdminText bold style={{ fontSize: 18 }}>{editTask ? 'Edit AI Task' : 'Create AI Task'}</AdminText>
              <Pressable onPress={() => { setShowTaskForm(false); resetTaskForm(); }}><Ionicons name="close" size={24} color={C.text} /></Pressable>
            </View>
            <ScrollView style={{ gap: 12 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
              <AdminInput label="Title" value={taskTitle} onChange={setTaskTitle} placeholder="e.g. Watch Tech Review" />
              <AdminInput label="Description" value={taskDesc} onChange={setTaskDesc} placeholder="Brief description of the task" multiline />
              <View>
                <AdminText bold style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>Type</AdminText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {AI_TASK_TYPES.map(tt => (
                    <Pressable key={tt.key} onPress={() => setTaskType(tt.key)} style={[styles.aiTypeBtn, taskType === tt.key && { backgroundColor: tt.key === 'daily' ? C.accent + '15' : tt.key === 'weekly' ? C.blue + '15' : C.purple + '15', borderColor: tt.key === 'daily' ? C.accent : tt.key === 'weekly' ? C.blue : C.purple }]}>
                      <AdminText style={{ fontSize: 12, fontWeight: '700', color: taskType === tt.key ? (tt.key === 'daily' ? C.accent : tt.key === 'weekly' ? C.blue : C.purple) : C.textSecondary }}>{tt.label}</AdminText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <AdminInput label={`Reward (PTS)`} value={taskReward} onChange={setTaskReward} placeholder="30" keyboardType="numeric" />
              <AdminInput label="Instructions (optional)" value={taskInstructions} onChange={setTaskInstructions} placeholder="What the user needs to do" multiline />
              <AdminInput label="Link URL (optional)" value={taskLink} onChange={setTaskLink} placeholder="https://..." />
              <View>
                <AdminText bold style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>Icon</AdminText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {AI_ICONS.map(ic => (
                      <Pressable key={ic.key} onPress={() => setTaskIcon(ic.key)} style={[styles.aiIconPicker, taskIcon === ic.key && { backgroundColor: C.accent + '15', borderColor: C.accent }]}>
                        <Ionicons name={ic.icon} size={20} color={taskIcon === ic.key ? C.accent : C.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.surfaceBorder }}>
                <Pressable onPress={() => { setShowTaskForm(false); resetTaskForm(); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.surfaceBorder }}>
                  <AdminText style={{ fontWeight: '600' }}>Cancel</AdminText>
                </Pressable>
                <Pressable onPress={handleSaveTask} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: C.accent }}>
                  <AdminText style={{ color: '#fff', fontWeight: '700' }}>{editTask ? 'Update' : 'Create'}</AdminText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showQuizForm} transparent animationType="fade" onRequestClose={() => { setShowQuizForm(false); resetQuizForm(); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <AdminText bold style={{ fontSize: 18 }}>{editQuiz ? 'Edit Quiz' : 'Create Quiz'}</AdminText>
              <Pressable onPress={() => { setShowQuizForm(false); resetQuizForm(); }}><Ionicons name="close" size={24} color={C.text} /></Pressable>
            </View>
            <ScrollView style={{ gap: 12 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
              <AdminInput label="Title" value={quizTitle} onChange={setQuizTitle} placeholder="e.g. Social Media Knowledge" />
              <AdminInput label="Description" value={quizDesc} onChange={setQuizDesc} placeholder="Quiz description" multiline />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><AdminInput label="Reward (PTS)" value={quizReward} onChange={setQuizReward} placeholder="75" keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><AdminInput label="Passing Score" value={quizPassing} onChange={setQuizPassing} placeholder="2" keyboardType="numeric" /></View>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: C.surfaceBorder, paddingTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <AdminText bold style={{ fontSize: 14 }}>Questions ({quizQuestions.length})</AdminText>
                  <Pressable onPress={() => setQuizQuestions([...quizQuestions, { text: '', options: ['', '', '', ''], correct: 0 }])} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blue + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Ionicons name="add" size={16} color={C.blue} />
                    <AdminText style={{ fontSize: 12, fontWeight: '700', color: C.blue }}>Add Question</AdminText>
                  </Pressable>
                </View>
                {quizQuestions.length === 0 && <AdminMuted style={{ textAlign: 'center', paddingVertical: 20 }}>No questions yet. Add one above.</AdminMuted>}
                {quizQuestions.map((qq, qi) => (
                  <View key={qi} style={{ backgroundColor: C.inputBg, borderRadius: 12, padding: 12, marginBottom: 10, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <AdminText bold style={{ fontSize: 12, color: C.blue }}>Question {qi + 1}</AdminText>
                      <Pressable onPress={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qi))}><Ionicons name="close" size={18} color={C.red} /></Pressable>
                    </View>
                    <TextInput
                      style={[styles.input, { fontSize: 13 }]}
                      value={qq.text}
                      onChangeText={txt => { const q = [...quizQuestions]; q[qi] = { ...q[qi], text: txt }; setQuizQuestions(q); }}
                      placeholder="Enter question..."
                      placeholderTextColor={C.textMuted}
                    />
                    {qq.options.map((opt, oi) => (
                      <View key={oi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Pressable onPress={() => { const q = [...quizQuestions]; q[qi] = { ...q[qi], correct: oi }; setQuizQuestions(q); }} style={[styles.radioBtn, qq.correct === oi && { backgroundColor: C.accent, borderColor: C.accent }]}>
                          {qq.correct === oi && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </Pressable>
                        <TextInput
                          style={[styles.input, { flex: 1, fontSize: 13 }]}
                          value={opt}
                          onChangeText={txt => { const q = [...quizQuestions]; q[qi].options[oi] = txt; setQuizQuestions(q); }}
                          placeholder={`Option ${oi + 1}`}
                          placeholderTextColor={C.textMuted}
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.surfaceBorder }}>
                <Pressable onPress={() => { setShowQuizForm(false); resetQuizForm(); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.surfaceBorder }}>
                  <AdminText style={{ fontWeight: '600' }}>Cancel</AdminText>
                </Pressable>
                <Pressable onPress={handleSaveQuiz} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: C.blue }}>
                  <AdminText style={{ color: '#fff', fontWeight: '700' }}>{editQuiz ? 'Update' : 'Create'}</AdminText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Announcements Tab ──────────────────────────────────────────
function AnnouncementsTab({ state, dispatch }: { state: any; dispatch: any }) {
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annSub, setAnnSub] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCta, setAnnCta] = useState('');
  const [annLink, setAnnLink] = useState('');
  const [annColor, setAnnColor] = useState('#2ECC71');
  const [annImageUrl, setAnnImageUrl] = useState<string | undefined>(undefined);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAnn, setPreviewAnn] = useState<Announcement | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const LIMITS = { title: 80, subtitle: 120, content: 500 } as const;

  const livePreview = useMemo((): Announcement => ({
    id: 'live',
    title: annTitle || 'Your Title',
    subtitle: annSub || undefined,
    imageUrl: annImageUrl,
    content: annContent || 'Your announcement content...',
    cta: annCta || undefined,
    link: annLink || undefined,
    color: annColor,
    active: true,
    createdAt: new Date().toISOString(),
  }), [annTitle, annSub, annImageUrl, annContent, annCta, annLink, annColor]);

  const anns = state.announcements;

  const resetForm = () => {
    setAnnTitle(''); setAnnSub(''); setAnnContent('');
    setAnnCta(''); setAnnLink(''); setAnnColor('#2ECC71');
    setAnnImageUrl(undefined);
  };

  const pickImage = useCallback(async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to upload a picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setAnnImageUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Unavailable', 'Photo upload is not available on this device.');
    }
  }, []);

  const openEdit = (a: Announcement) => {
    setEditAnn(a);
    setAnnTitle(a.title);
    setAnnSub(a.subtitle || '');
    setAnnContent(a.content);
    setAnnCta(a.cta || '');
    setAnnLink(a.link || '');
    setAnnColor(a.color || '#2ECC71');
    setAnnImageUrl(a.imageUrl || undefined);
    setShowCreate(true);
  };

  const handleSave = () => {
    if (!annTitle.trim() || !annContent.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }
    const announcement: Announcement = {
      id: editAnn?.id || `ann-${Date.now()}`,
      title: annTitle.trim(),
      subtitle: annSub.trim() || undefined,
      imageUrl: annImageUrl,
      content: annContent.trim(),
      cta: annCta.trim() || undefined,
      link: annLink.trim() || undefined,
      color: annColor,
      active: true,
      createdAt: editAnn?.createdAt || new Date().toISOString(),
    };
    if (editAnn) dispatch({ type: 'ADMIN_UPDATE_ANNOUNCEMENT', announcement });
    else dispatch({ type: 'ADMIN_CREATE_ANNOUNCEMENT', announcement });
    setShowCreate(false);
    setEditAnn(null);
    resetForm();
  };

  const handlePreview = useCallback(() => {
    if (!annTitle.trim() || !annContent.trim()) {
      Alert.alert('Incomplete', 'Title and content are needed for preview.');
      return;
    }
    setPreviewAnn({
      id: 'preview',
      title: annTitle.trim(),
      subtitle: annSub.trim() || undefined,
      imageUrl: annImageUrl,
      content: annContent.trim(),
      cta: annCta.trim() || undefined,
      link: annLink.trim() || undefined,
      color: annColor,
      active: true,
      createdAt: new Date().toISOString(),
    });
    setShowPreview(true);
  }, [annTitle, annSub, annImageUrl, annContent, annCta, annLink, annColor]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'ADMIN_REMOVE_ANNOUNCEMENT', id }) },
    ]);
  };

  const toggleActive = (ann: Announcement) => {
    dispatch({ type: 'ADMIN_UPDATE_ANNOUNCEMENT', announcement: { ...ann, active: !ann.active } });
  };

  const colorOptions = ['#2ECC71', '#3B82F6', '#8B5CF6', '#F59E0B', '#FF0000', '#EF4444', '#EC4899', '#06B6D4'];
  const screenHeight = Dimensions.get('window').height;

  return (
    <>
      <Pressable
        onPress={() => { setEditAnn(null); resetForm(); setShowCreate(true); }}
        style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
        <LinearGradient colors={[C.accent, C.accentDark]} style={styles.primaryGradient}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <AdminText style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>New Announcement</AdminText>
        </LinearGradient>
      </Pressable>

      {anns.length === 0 ? (
        <EmptyState icon="megaphone-outline" title="No Announcements" subtitle="Create your first announcement" />
      ) : (
        anns.map((ann: Announcement, i: number) => {
          const color = ann.color || C.accent;
          return (
            <Animated.View key={ann.id} entering={FadeInDown.delay(i * 50).springify()}>
              <AdminCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.platformIcon, { backgroundColor: color + '15' }]}>
                    <Ionicons name="megaphone" size={18} color={color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ flex: 1, color: C.text, fontWeight: '700' }} numberOfLines={1}>{ann.title}</Text>
                      <AdminBadge color={ann.active ? C.accent : C.textMuted} text={ann.active ? 'Active' : 'Inactive'} />
                    </View>
                    {ann.subtitle && <Text style={{ color: C.textSecondary, fontSize: 12 }} numberOfLines={1}>{ann.subtitle}</Text>}
                  </View>
                </View>
                <Text style={{ color: C.textSecondary, fontSize: 12 }} numberOfLines={2}>{ann.content}</Text>
                <View style={styles.rowActions}>
                  <Pressable onPress={() => toggleActive(ann)}
                    style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                    <Ionicons name={ann.active ? 'eye-off-outline' : 'eye-outline'} size={14} color={C.blue} />
                    <AdminText style={{ fontSize: 12, color: C.blue, fontWeight: '600' }}>
                      {ann.active ? 'Hide' : 'Show'}
                    </AdminText>
                  </Pressable>
                  <Pressable onPress={() => openEdit(ann)}
                    style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                    <Ionicons name="create-outline" size={14} color={C.blue} />
                    <AdminText style={{ fontSize: 12, color: C.blue, fontWeight: '600' }}>Edit</AdminText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(ann.id)}
                    style={({ pressed }) => [styles.rowAction, pressed && { opacity: 0.7 }]}>
                    <Ionicons name="trash-outline" size={14} color={C.red} />
                    <AdminText style={{ fontSize: 12, color: C.red, fontWeight: '600' }}>Delete</AdminText>
                  </Pressable>
                </View>
              </AdminCard>
            </Animated.View>
          );
        })
      )}

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300).springify()} style={{ maxHeight: screenHeight - Math.max(40, insets.top + 20) - insets.bottom - 20, marginHorizontal: 24, marginTop: Math.max(40, insets.top + 20) }}>
            <View style={[styles.modalContent, { maxHeight: '100%' }]}>
              <LinearGradient colors={[C.purple + '15', '#fff']} style={styles.modalHeader}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: C.purple }]}>
                  <Ionicons name="megaphone" size={24} color="#fff" />
                </View>
                <AdminText bold style={{ fontSize: 18 }}>{editAnn ? 'Edit Announcement' : 'New Announcement'}</AdminText>
                <AdminMuted>Create engaging announcements for users</AdminMuted>
              </LinearGradient>
              <ScrollView style={[styles.modalBody, { flexShrink: 1 }]} contentContainerStyle={{ paddingBottom: 16, gap: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* ─── Live Preview Card ─── */}
                {(annTitle || annSub || annImageUrl || annContent) && (
                  <Animated.View entering={FadeInUp.duration(250)} style={[styles.livePreviewCard, { borderColor: annColor + '40' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.livePreviewDot, { backgroundColor: annColor }]} />
                      <AdminText style={{ fontSize: 11, fontWeight: '700', color: annColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>Live Preview</AdminText>
                    </View>
                    {annImageUrl && (
                      <Image source={{ uri: annImageUrl }} style={styles.livePreviewImage} />
                    )}
                    <AdminText bold style={{ fontSize: 15, color: C.text }}>{annTitle || 'Untitled'}</AdminText>
                    {annSub ? <AdminMuted style={{ fontSize: 12 }}>{annSub}</AdminMuted> : null}
                    <AdminMuted style={{ fontSize: 12 }}>{annContent || 'No content yet'}</AdminMuted>
                  </Animated.View>
                )}

                {/* ─── Content Section ─── */}
                <View>
                  <View style={styles.sectionLabel}>
                    <Ionicons name="document-text-outline" size={14} color={C.purple} />
                    <AdminText style={{ fontSize: 12, fontWeight: '700', color: C.purple, textTransform: 'uppercase', letterSpacing: 0.5 }}>Content</AdminText>
                  </View>
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldRow}>
                      <AdminMuted style={{ fontSize: 12 }}>Title *</AdminMuted>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.charBarOuter, { width: 40 }]}>
                          <View style={[styles.charBarInner, {
                            width: `${Math.min((annTitle.length / LIMITS.title) * 100, 100)}%`,
                            backgroundColor: annTitle.length > LIMITS.title * 0.8 ? (annTitle.length >= LIMITS.title ? C.red : C.orange) : C.accent,
                          }]} />
                        </View>
                        <AdminMuted style={{ fontSize: 10 }}>{annTitle.length}/{LIMITS.title}</AdminMuted>
                      </View>
                    </View>
                    <TextInput
                      style={[styles.modalInput, focusedField === 'title' && styles.modalInputFocused]}
                      placeholder="Big announcement title"
                      placeholderTextColor={C.textMuted}
                      value={annTitle} onChangeText={setAnnTitle}
                      maxLength={LIMITS.title}
                      onFocus={() => setFocusedField('title')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldRow}>
                      <AdminMuted style={{ fontSize: 12 }}>Subtitle</AdminMuted>
                      <AdminMuted style={{ fontSize: 10 }}>{annSub.length}/{LIMITS.subtitle}</AdminMuted>
                    </View>
                    <TextInput
                      style={[styles.modalInput, focusedField === 'sub' && styles.modalInputFocused]}
                      placeholder="Short tagline"
                      placeholderTextColor={C.textMuted}
                      value={annSub} onChangeText={setAnnSub}
                      maxLength={LIMITS.subtitle}
                      onFocus={() => setFocusedField('sub')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldRow}>
                      <AdminMuted style={{ fontSize: 12 }}>Content *</AdminMuted>
                      <AdminMuted style={{ fontSize: 10, color: annContent.length > LIMITS.content * 0.9 ? C.orange : C.textMuted }}>{annContent.length}/{LIMITS.content}</AdminMuted>
                    </View>
                    <TextInput
                      style={[styles.modalInput, styles.modalInputMultiline, focusedField === 'content' && styles.modalInputFocused]}
                      placeholder="Full announcement details..."
                      placeholderTextColor={C.textMuted}
                      multiline value={annContent} onChangeText={setAnnContent}
                      maxLength={LIMITS.content}
                      onFocus={() => setFocusedField('content')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* ─── Appearance Section ─── */}
                <View>
                  <View style={styles.sectionLabel}>
                    <Ionicons name="color-palette-outline" size={14} color={C.purple} />
                    <AdminText style={{ fontSize: 12, fontWeight: '700', color: C.purple, textTransform: 'uppercase', letterSpacing: 0.5 }}>Appearance</AdminText>
                  </View>
                  <View style={styles.fieldGroup}>
                    <AdminMuted style={{ fontSize: 12, marginBottom: 8 }}>Accent Color</AdminMuted>
                    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                      {colorOptions.map(c => (
                        <Pressable key={c} onPress={() => setAnnColor(c)}
                          style={[styles.colorOption, {
                            backgroundColor: c,
                            borderWidth: annColor === c ? 3 : 0,
                            borderColor: annColor === c ? '#fff' : undefined,
                            transform: annColor === c ? [{ scale: 1.15 }] : [],
                          }]}>
                          {annColor === c && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={styles.fieldGroup}>
                    <AdminMuted style={{ fontSize: 12, marginBottom: 8 }}>Banner Image</AdminMuted>
                    <Pressable
                      onPress={pickImage}
                      style={({ pressed }) => [{
                        borderRadius: 16,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: annImageUrl ? annColor : C.surfaceBorder,
                        borderStyle: annImageUrl ? 'solid' : 'dashed',
                        opacity: pressed ? 0.85 : 1,
                      }]}>
                      {annImageUrl ? (
                        <View>
                          <Image source={{ uri: annImageUrl }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 }} />
                          <View style={{ position: 'absolute', bottom: 10, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="image" size={14} color="#fff" />
                              <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>Tap to change</Text>
                            </View>
                            <Pressable onPress={() => setAnnImageUrl(undefined)}
                              style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.7 : 1 })}>
                              <Ionicons name="close-circle" size={22} color="#fff" />
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={{ height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: C.inputBg, gap: 6 }}>
                          <Ionicons name="cloud-upload-outline" size={24} color={C.blue} />
                          <AdminText style={{ fontSize: 13, color: C.blue, fontWeight: '600' }}>Tap to upload image</AdminText>
                          <AdminMuted style={{ fontSize: 11 }}>16:9 recommended</AdminMuted>
                        </View>
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* ─── Link Section ─── */}
                <View>
                  <View style={styles.sectionLabel}>
                    <Ionicons name="link-outline" size={14} color={C.purple} />
                    <AdminText style={{ fontSize: 12, fontWeight: '700', color: C.purple, textTransform: 'uppercase', letterSpacing: 0.5 }}>Call to Action</AdminText>
                  </View>
                  <View style={styles.fieldGroup}>
                    <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Button Text</AdminMuted>
                    <TextInput
                      style={[styles.modalInput, focusedField === 'cta' && styles.modalInputFocused]}
                      placeholder="Learn More"
                      placeholderTextColor={C.textMuted}
                      value={annCta} onChangeText={setAnnCta}
                      onFocus={() => setFocusedField('cta')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Link (optional)</AdminMuted>
                    <TextInput
                      style={[styles.modalInput, focusedField === 'link' && styles.modalInputFocused]}
                      placeholder="https:// or /route"
                      placeholderTextColor={C.textMuted}
                      value={annLink} onChangeText={setAnnLink}
                      onFocus={() => setFocusedField('link')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </ScrollView>

              {/* ─── Actions ─── */}
              <View style={styles.modalActions}>
                <Pressable onPress={handlePreview}
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnOutline, pressed && { opacity: 0.8 }]}>
                  <Ionicons name="eye-outline" size={16} color={C.blue} />
                  <AdminText style={{ fontWeight: '600', color: C.blue, marginLeft: 4 }}>Preview</AdminText>
                </Pressable>
                <Pressable onPress={() => { setShowCreate(false); setEditAnn(null); }}
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnOutline, pressed && { opacity: 0.8 }]}>
                  <AdminText style={{ fontWeight: '600', color: C.textSecondary }}>Cancel</AdminText>
                </Pressable>
                <Pressable onPress={handleSave}
                  style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                  <LinearGradient colors={[C.purple, '#7C3AED']} style={styles.modalBtnSolid}>
                    <AdminText style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}>{editAnn ? 'Update' : 'Create'}</AdminText>
                  </LinearGradient>
                </Pressable>
              </View>

              <AnnouncementModal
                visible={showPreview}
                announcement={previewAnn}
                onClose={() => setShowPreview(false)}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// ─── Audit Tab ──────────────────────────────────────────────────
function AuditTab({ state }: { state: any }) {
  const logs = state.auditLog;
  if (logs.length === 0) {
    return <EmptyState icon="document-text-outline" title="No Logs" subtitle="No admin actions recorded yet" />;
  }

  return logs.map((entry: any, i: number) => (
    <Animated.View key={entry.id} entering={FadeInDown.delay(i * 40).springify()}>
      <AdminCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.auditIconBox, {
            backgroundColor: entry.action.includes('order') ? C.blue + '12'
              : entry.action.includes('escrow') ? C.purple + '12'
              : entry.action.includes('user') ? C.orange + '12'
              : C.accent + '12',
          }]}>
            <Ionicons name={
              entry.action.includes('order') ? 'cart-outline'
                : entry.action.includes('escrow') ? 'lock-open-outline'
                : entry.action.includes('user') ? 'people-outline'
                : entry.action.includes('payout') ? 'wallet-outline' : 'settings-outline'
            } size={16} color={C.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AdminText bold style={{ fontSize: 13, textTransform: 'capitalize' }}>
              {entry.action.replace(/_/g, ' ')}
            </AdminText>
            <AdminMuted style={{ fontSize: 11 }}>{entry.details}</AdminMuted>
          </View>
        </View>
        <AdminMuted style={{ fontSize: 10, marginTop: 4 }}>
          {new Date(entry.timestamp).toLocaleString()}
        </AdminMuted>
      </AdminCard>
    </Animated.View>
  ));
}

// ─── Main Screen ────────────────────────────────────────────────
export default function AdminPanelScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useMockData();
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const [verifyCount, setVerifyCount] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);

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

  const handleVerify = useCallback((orderId: string) => {
    setVerifyOrderId(orderId);
    setVerifyCount('');
    setShowVerifyModal(true);
  }, []);

  const handleConfirmVerify = useCallback(() => {
    if (!verifyOrderId) return;
    const count = parseInt(verifyCount, 10);
    if (isNaN(count)) { Alert.alert('Error', 'Enter a valid follower count'); return; }
    dispatch({ type: 'ADMIN_VERIFY_ORDER', orderId: verifyOrderId, progress: count >= 100 ? 100 : count });
    dispatch({ type: 'ADMIN_LOG_ACTION', entry: {
      id: `audit-${Date.now()}`,
      action: 'order_verified',
      adminId: state.user.id,
      details: `Verified order ${verifyOrderId} (${count}% delivered)`,
      timestamp: new Date().toISOString(),
    } });
    setShowVerifyModal(false);
    setVerifyOrderId(null);
    setVerifyCount('');
    Alert.alert('Verified', 'Order has been updated');
  }, [verifyOrderId, verifyCount, dispatch, state.user.id]);

  const handleReleaseEscrow = useCallback(() => {
    dispatch({ type: 'ADMIN_RELEASE_ESCROW' });
    dispatch({ type: 'ADMIN_LOG_ACTION', entry: {
      id: `audit-${Date.now()}`,
      action: 'escrow_released',
      adminId: state.user.id,
      details: 'Released all escrow points',
      timestamp: new Date().toISOString(),
    } });
    setShowEscrowModal(false);
    Alert.alert('Released', 'All escrow points have been released');
  }, [dispatch, state.user.id]);

  const escrowOrders = state.orders.filter((o: any) => o.status === 'completed');
  const totalEscrow = escrowOrders.reduce((s: number, o: any) => s + o.cost, 0);

  const TabContent = useMemo(() => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab state={state} dispatch={dispatch} />;
      case 'orders': return <OrdersTab state={state} dispatch={dispatch} handleVerify={handleVerify} />;
      case 'tasks': return <TasksTab state={state} dispatch={dispatch} />;
      case 'users': return <UsersTab state={state} dispatch={dispatch} />;
      case 'payouts': return <PayoutsTab state={state} dispatch={dispatch} />;
      case 'announcements': return <AnnouncementsTab state={state} dispatch={dispatch} />;
      case 'ads': return <AdsControlTab state={state} dispatch={dispatch} />;
      case 'settings': return <SettingsTab state={state} dispatch={dispatch} />;
      case 'audit': return <AuditTab state={state} />;
      case 'ai': return <AITab state={state} dispatch={dispatch} />;
    }
  }, [activeTab, state, dispatch, handleVerify]);

  if (!authenticated) {
    return <LockScreen passcode={passcode} setPasscode={setPasscode} handleAuth={handleAuth} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SmartHeader
        title="Admin Panel"
        subtitle="Full platform control"
        rightContent={
          <View style={[styles.badge, { backgroundColor: C.orange + '15' }]}>
            <Ionicons name="shield-checkmark" size={14} color={C.orange} />
            <AdminText style={{ fontSize: 12, fontWeight: '700', color: C.orange }}>Admin</AdminText>
          </View>
        }
      />

      <TabBar tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />}
      >
        {TabContent}

        {activeTab === 'orders' && escrowOrders.length > 0 && (
          <Pressable
            onPress={() => setShowEscrowModal(true)}
            style={({ pressed }) => [{ borderRadius: 27, overflow: 'hidden' }, pressed && { opacity: 0.9 }]}>
            <LinearGradient colors={[C.purple, '#6D28D9']} style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="lock-open" size={20} color="#fff" />
              <AdminText style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>
                Release Escrow ({totalEscrow.toLocaleString()} PTS)
              </AdminText>
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={showVerifyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300).springify()}>
            <View style={styles.modalContent}>
              <LinearGradient colors={[C.accent + '12', '#fff']} style={styles.modalHeader}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: C.accent }]}>
                  <Ionicons name="checkmark-done" size={24} color="#fff" />
                </View>
                <AdminText bold style={{ fontSize: 18 }}>Verify Delivery</AdminText>
                <AdminMuted style={{ textAlign: 'center' }}>Order #{verifyOrderId}</AdminMuted>
              </LinearGradient>
              <View style={styles.modalBody}>
                <AdminMuted style={{ fontSize: 12, marginBottom: 4 }}>Follower count delivered (%)</AdminMuted>
                <TextInput style={styles.modalInput} placeholder="e.g. 50, 100" placeholderTextColor={C.textMuted} keyboardType="number-pad" value={verifyCount} onChangeText={setVerifyCount} />
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={() => setShowVerifyModal(false)}
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnOutline, pressed && { opacity: 0.8 }]}>
                  <AdminText style={{ fontWeight: '600', color: C.textSecondary }}>Cancel</AdminText>
                </Pressable>
                <Pressable onPress={handleConfirmVerify}
                  style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                  <LinearGradient colors={[C.accent, C.accentDark]} style={styles.modalBtnSolid}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <AdminText style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}>Mark Delivered</AdminText>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showEscrowModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300).springify()}>
            <View style={styles.modalContent}>
              <LinearGradient colors={[C.purple + '12', '#fff']} style={styles.modalHeader}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: C.purple }]}>
                  <Ionicons name="lock-open" size={24} color="#fff" />
                </View>
                <AdminText bold style={{ fontSize: 18 }}>Release Escrow</AdminText>
                <AdminMuted style={{ textAlign: 'center' }}>{escrowOrders.length} orders awaiting release</AdminMuted>
              </LinearGradient>
              <View style={styles.modalBody}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 16, padding: 16, gap: 16 }}>
                  <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                    <AdminMuted style={{ fontSize: 12 }}>Total Held</AdminMuted>
                    <AdminText bold style={{ fontSize: 22 }}>{totalEscrow.toLocaleString()} PTS</AdminText>
                  </View>
                  <View style={{ width: 1, height: 36, backgroundColor: C.surfaceBorder }} />
                  <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                    <AdminMuted style={{ fontSize: 12 }}>Orders</AdminMuted>
                    <AdminText bold style={{ fontSize: 22 }}>{escrowOrders.length}</AdminText>
                  </View>
                </View>
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={() => setShowEscrowModal(false)}
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnOutline, pressed && { opacity: 0.8 }]}>
                  <AdminText style={{ fontWeight: '600', color: C.textSecondary }}>Cancel</AdminText>
                </Pressable>
                <Pressable onPress={handleReleaseEscrow}
                  style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                  <LinearGradient colors={[C.purple, '#6D28D9']} style={styles.modalBtnSolid}>
                    <Ionicons name="lock-open" size={18} color="#fff" />
                    <AdminText style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}>Release All</AdminText>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 12 },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },

  // Badge
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  // Lock Screen
  lockRoot: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  lockContent: { alignItems: 'center', paddingHorizontal: 40, gap: 16, width: '100%' },
  lockIconWrap: { width: 88, height: 88, borderRadius: 44, overflow: 'hidden', marginBottom: 8 },
  lockIconGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockTitle: { fontSize: 24, marginTop: 8 },
  lockSub: { marginBottom: 8 },
  passcodeInput: {
    width: '100%', height: 54, borderRadius: 16,
    borderWidth: 1, borderColor: C.surfaceBorder,
    paddingHorizontal: 20, fontSize: 22, textAlign: 'center',
    backgroundColor: C.surface, color: C.text, letterSpacing: 8,
  },
  unlockBtn: { width: '100%', borderRadius: 27, overflow: 'hidden' },
  unlockGradient: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  unlockBtnText: { color: '#fff', fontWeight: '700' },

  // Analytics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48%', backgroundColor: C.surface, borderRadius: 20,
    padding: 16, gap: 4,
    borderWidth: 1, borderColor: C.surfaceBorder,
  },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metricIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 22, fontWeight: '800' },

  // Period Selector (modern segmented control)
  segmentWrap: {
    backgroundColor: C.surface, borderRadius: 16,
    marginHorizontal: 0,
    borderWidth: 1, borderColor: C.surfaceBorder,
  },
  segmentRow: { flexDirection: 'row', padding: 4, gap: 2 },
  segmentBtn: { flex: 1, borderRadius: 13, overflow: 'hidden' },
  segmentBg: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 13,
  },
  segmentBgActive: { backgroundColor: C.accent },
  segmentText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  segmentTextActive: { color: '#fff' },

  // Platform Bars
  platformBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  platformBarLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 85 },
  platformBarTrack: {
    flex: 1, height: 8, borderRadius: 4,
    backgroundColor: C.inputBg, overflow: 'hidden',
  },
  platformBarFill: { height: '100%', borderRadius: 4 },
  platformBarRight: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 70, justifyContent: 'flex-end' },

  // Chart
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 110, paddingTop: 8 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '65%', borderRadius: 4, minHeight: 3 },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: C.surfaceBorder },

  // Insight Cards (orders + users mini cards)
  insightGrid: { flexDirection: 'row', gap: 10 },
  insightRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  insightBlock: { flex: 1, alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 10, padding: 8, gap: 2, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  insightBlockValue: { fontSize: 15, fontWeight: '800' },
  insightBlockLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  insightProgressTrack: { height: 4, borderRadius: 2, backgroundColor: C.inputBg, overflow: 'hidden', marginTop: 4 },
  insightProgressFill: { height: '100%', borderRadius: 2, backgroundColor: C.accent },

  // Order flow pipeline
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6, paddingVertical: 4 },
  flowStep: { flex: 1, alignItems: 'center', gap: 2 },
  flowDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  flowDivider: { width: 1, height: 24, backgroundColor: C.surfaceBorder, marginHorizontal: 2 },

  // Custom date badge
  customDateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: C.accent + '10', borderRadius: 12,
  },

  // Date field row
  dateFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Card helper
  cardIconBox: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Tab Bar
  tabBarWrap: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  tabRow: {
    flexDirection: 'row', gap: 8,
  },
  tabItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.surfaceBorder,
  },
  tabItemActive: {
    backgroundColor: C.accent, borderColor: C.accent,
  },
  tabLabel: {
    fontSize: 13, fontWeight: '600', color: C.textSecondary,
  },
  tabLabelActive: {
    color: '#fff', fontWeight: '700',
  },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },

  // Activity
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: C.surfaceBorder },
  activityDot: { width: 8, height: 8, borderRadius: 4 },

  // (quick actions removed)

  // Orders
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  platformIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  progressSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.inputBg, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: C.inputBg },
  verifyBtn: { borderRadius: 14, overflow: 'hidden' },
  verifyGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  orderStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  orderStatusText: { fontSize: 11, fontWeight: '700' },

  // Row Actions
  rowActions: { flexDirection: 'row', gap: 10, paddingTop: 6 },
  rowAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.inputBg },

  // Primary Button
  primaryBtn: { borderRadius: 27, overflow: 'hidden' },
  primaryGradient: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },

  // Reward Badge
  rewardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

  // Users
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, paddingHorizontal: 14,
    backgroundColor: C.surface, height: 46,
    borderWidth: 1, borderColor: C.surfaceBorder,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  userAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  userBalanceBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  userStatsRow: { flexDirection: 'row', backgroundColor: C.inputBg, borderRadius: 14, padding: 12, marginTop: 4 },
  statDivider: { width: 1, height: 28, backgroundColor: C.surfaceBorder },
  userFilterRow: { flexDirection: 'row', gap: 6 },
  userFilterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.surfaceBorder,
  },
  userFilterBtnActive: { borderWidth: 1 },
  userFilterText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  userFilterCount: {
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
    minWidth: 20, alignItems: 'center',
  },
  userFilterCountText: { fontSize: 10, fontWeight: '700' },
  userStatusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },

  // Empty
  emptyCard: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, marginTop: 4 },

  // ID Row (Ad Config)
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },

  // Settings
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  settingInput: {
    flex: 1, height: 42, borderRadius: 12,
    borderWidth: 1, borderColor: C.surfaceBorder,
    paddingHorizontal: 12, fontSize: 15, color: C.text,
    backgroundColor: C.inputBg,
  },

  // (watch reward styles removed — now part of settings list)

  // Audit
  auditIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' },
  modalContent: { backgroundColor: C.surface, borderRadius: 28, overflow: 'hidden' },
  modalHeader: { padding: 24, gap: 8, alignItems: 'center' },
  modalHeaderIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24, gap: 12 },
  input: {
    height: 50, borderRadius: 14,
    borderWidth: 1, borderColor: C.surfaceBorder,
    paddingHorizontal: 14, fontSize: 16, color: C.text,
    backgroundColor: C.inputBg,
  },
  modalInput: {
    height: 50, borderRadius: 14,
    borderWidth: 1, borderColor: C.surfaceBorder,
    paddingHorizontal: 14, fontSize: 16, color: C.text,
    backgroundColor: C.inputBg,
  },
  modalActions: { flexDirection: 'row', gap: 12, padding: 24, paddingTop: 0 },
  modalBtn: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  modalBtnOutline: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.surfaceBorder },
  modalBtnSolid: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },

  // Platform Picker
  platformPicker: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  platformOption: {
    width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.surfaceBorder, backgroundColor: C.inputBg,
  },
  colorOption: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  // Modern Announcements Form
  livePreviewCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  livePreviewDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  livePreviewImage: {
    width: '100%', height: 100, borderRadius: 12,
  },
  sectionLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  charBarOuter: {
    height: 4, borderRadius: 2, backgroundColor: C.surfaceBorder, overflow: 'hidden',
  },
  charBarInner: {
    height: '100%', borderRadius: 2,
  },
  modalInputFocused: {
    borderColor: C.purple,
    backgroundColor: C.surface,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  modalInputMultiline: {
    height: 90, textAlignVertical: 'top', paddingTop: 12,
  },
});
