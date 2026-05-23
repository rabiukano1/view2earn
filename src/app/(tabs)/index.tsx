import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RewardToast } from '@/components/reward-toast';
import { AnnouncementModal } from '@/components/announcement-modal';
import { useTheme } from '@/hooks/use-theme';
import { useAdReward } from '@/hooks/use-ad-reward';
import { useMockData, Announcement } from '@/context/MockDataContext';

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  gradient: string[];
  title: string;
  subtitle: string;
  route: string;
}

const CORE_ACTIONS: QuickAction[] = [
  { icon: 'time-outline', iconColor: '#3B82F6', gradient: ['#3B82F620', '#3B82F605'], title: 'History', subtitle: 'View activity', route: '/follower-orders' },
  { icon: 'gift-outline', iconColor: '#8B5CF6', gradient: ['#8B5CF620', '#8B5CF605'], title: 'Rewards', subtitle: 'Claim bonuses', route: '/follow-to-earn' },
  { icon: 'people-outline', iconColor: '#2ECC71', gradient: ['#2ECC7120', '#2ECC7105'], title: 'Refer', subtitle: 'Invite friends', route: '/' },
  { icon: 'stats-chart', iconColor: '#F59E0B', gradient: ['#F59E0B20', '#F59E0B05'], title: 'Stats', subtitle: 'Analytics', route: '/' },
];

const SOCIAL_ACTIONS: QuickAction[] = [
  { icon: 'trending-up', iconColor: '#2ECC71', gradient: ['#2ECC7120', '#2ECC7105'], title: 'Buy Followers', subtitle: 'Grow your audience', route: '/buy-followers' },
  { icon: 'cash-outline', iconColor: '#F59E0B', gradient: ['#F59E0B20', '#F59E0B05'], title: 'Follow & Earn', subtitle: 'Earn PTS by following', route: '/follow-to-earn' },
  { icon: 'globe-outline', iconColor: '#3B82F6', gradient: ['#3B82F620', '#3B82F605'], title: 'Connect Accounts', subtitle: 'Link social channels', route: '/social-connect' },
  { icon: 'clipboard-outline', iconColor: '#8B5CF6', gradient: ['#8B5CF620', '#8B5CF605'], title: 'My Orders', subtitle: 'Track purchases', route: '/follower-orders' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();
  const [adsLeft, setAdsLeft] = useState(3);
  const [showReward, setShowReward] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);
  const slideScrollRef = useRef<ScrollView>(null);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeAnnouncements = state.announcements.filter(a => a.active);

  useEffect(() => {
    if (activeAnnouncements.length < 2) return;
    slideTimer.current = setInterval(() => {
      setSlideIndex(prev => {
        const next = (prev + 1) % activeAnnouncements.length;
        slideScrollRef.current?.scrollTo({ x: next * (320 + 12), animated: true });
        return next;
      });
    }, 4500);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [activeAnnouncements.length]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const streakIndex = useRef(3);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200 }),
        withTiming(0.2, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const rewardAmount = state.settings?.watchReward ?? 25;

  const earnReward = useCallback(() => {
    setAdsLeft(prev => prev - 1);
    dispatch({ type: 'SET_BALANCE', balance: state.balance + rewardAmount });
    setShowReward(true);
  }, [dispatch, state.balance, rewardAmount]);

  const { showAd, adOverlay } = useAdReward(earnReward, rewardAmount);

  const handleWatchAd = useCallback(() => {
    if (adsLeft <= 0) return;
    showAd();
  }, [adsLeft, showAd]);

  const renderActionGrid = (actions: QuickAction[], title?: string) => (
    <View style={styles.section}>
      {title && (
        <ThemedText type="smallBold" style={styles.sectionTitle}>{title}</ThemedText>
      )}
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <Animated.View
            key={action.title}
            entering={FadeInDown.delay(index * 80).springify().damping(15)}
            style={styles.gridItem}
          >
            <Pressable
              onPress={() => router.push(action.route as any)}
              style={({ pressed }) => [
                styles.actionCard,
                { backgroundColor: theme.backgroundElement },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.iconColor + '18' }]}>
                <Ionicons name={action.icon} size={22} color={action.iconColor} />
              </View>
              <ThemedText type="smallBold" style={styles.actionTitle}>{action.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.actionSub}>
                {action.subtitle}
              </ThemedText>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeInUp.springify().damping(15)}>
        <View style={[styles.topBarWrapper, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={['rgba(46,204,113,0.12)', 'transparent']}
            style={styles.headerGlow}
          />
          <View style={styles.topBar}>
            <View>
              <ThemedText style={styles.greeting}>
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.greetingSub}>
                Ready to earn today?
              </ThemedText>
            </View>
            <View style={styles.topRight}>
              <Pressable style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                <View style={styles.notifDot} />
              </Pressable>
              <Pressable onPress={() => router.push('/profile')} style={styles.avatar}>
                <LinearGradient
                  colors={['#2ECC71', '#27ae60']}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="person" size={14} color="#000" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 8, paddingBottom: 100 },
        ]}
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
                <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
              </View>
              <Pressable style={styles.withdrawBtn} onPress={() => router.push('/wallet')}>
                <ThemedText style={styles.withdrawText}>Withdraw</ThemedText>
              </Pressable>
            </View>
            <View style={styles.balanceRow}>
              <ThemedText style={styles.balanceAmount}>
                {(state.balance ?? state.user.balance).toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.balanceUnit}>PTS</ThemedText>
            </View>
            <View style={styles.balanceBottom}>
              <View style={styles.usdRow}>
                <Ionicons name="cash-outline" size={14} color="#2ECC71" />
                <ThemedText style={styles.usdText}>
                  ≈ ${((state.balance ?? state.user.balance) / 1000).toFixed(2)} USD
                </ThemedText>
              </View>
              <View style={styles.followerHint}>
                <Ionicons name="people-outline" size={14} color="#2ECC7180" />
                <ThemedText style={styles.followerHintText}>
                  {Math.floor((state.balance ?? state.user.balance) / 5)} followers
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {activeAnnouncements.length > 0 && (
          <Animated.View entering={FadeInUp.delay(120).springify().damping(15)}>
            <ScrollView
              ref={slideScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.slideRow}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (320 + 12));
                setSlideIndex(idx);
              }}
              snapToInterval={320 + 12}
              decelerationRate="fast"
            >
              {activeAnnouncements.map((ann, i) => {
                const color = ann.color || '#2ECC71';
                return (
                  <Pressable
                    key={ann.id}
                    onPress={() => setSelectedAnn(ann)}
                    style={({ pressed }) => [
                      styles.slideCard,
                      { backgroundColor: color + '12', borderColor: color + '25' },
                      pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <LinearGradient colors={[color + '18', 'transparent']} style={StyleSheet.absoluteFill} />
                    {ann.imageUrl && (
                      <Image source={{ uri: ann.imageUrl }} style={styles.slideImage} />
                    )}
                    <View style={styles.slideTop}>
                      <View style={[styles.slideIcon, { backgroundColor: color + '20' }]}>
                        <Ionicons name="megaphone" size={16} color={color} />
                      </View>
                      <ThemedText style={[styles.slideTag, { color }]}>Announcement</ThemedText>
                    </View>
                    <ThemedText style={styles.slideTitle} numberOfLines={2}>{ann.title}</ThemedText>
                    {ann.subtitle && (
                      <ThemedText style={styles.slideSub} numberOfLines={1}>{ann.subtitle}</ThemedText>
                    )}
                    {ann.cta && (
                      <View style={[styles.slideCta, { backgroundColor: color + '20' }]}>
                        <ThemedText style={[styles.slideCtaText, { color }]}>{ann.cta}</ThemedText>
                        <Ionicons name="arrow-forward" size={12} color={color} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            {activeAnnouncements.length > 1 && (
              <View style={styles.dotsRow}>
                {activeAnnouncements.map((_, i) => (
                  <View key={i} style={[styles.dot, i === slideIndex && { backgroundColor: '#2ECC71', width: 20 }]} />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {renderActionGrid(CORE_ACTIONS)}

        {renderActionGrid(SOCIAL_ACTIONS, 'Grow Your Channel')}

        <Animated.View entering={FadeInUp.delay(300).springify().damping(15)}>
          <ThemedView type="backgroundElement" style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View style={styles.streakTitleRow}>
                <View style={styles.flameWrap}>
                  <Ionicons name="flame" size={18} color="#F59E0B" />
                </View>
                <ThemedText type="smallBold">Weekly Streak</ThemedText>
              </View>
              <View style={styles.streakBadge}>
                <ThemedText style={styles.streakBadgeText}>2x speed</ThemedText>
              </View>
            </View>
            <View style={styles.streakRow}>
              {WEEK_DAYS.map((day, i) => {
                const active = i < streakIndex.current;
                return (
                  <View key={day} style={styles.streakDay}>
                    <View style={[
                      styles.streakDot,
                      active
                        ? styles.streakDotActive
                        : styles.streakDotInactive,
                    ]}>
                      {active && (
                        <Ionicons name="checkmark" size={13} color="#000" />
                      )}
                    </View>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={[styles.streakLabel, active && styles.streakLabelActive]}
                    >
                      {day}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </ThemedView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify().damping(15)}>
          <ThemedView type="backgroundElement" style={styles.adCard}>
            <View style={styles.adTop}>
              <View style={styles.adInfo}>
                <View style={styles.adTitleRow}>
                  <Ionicons name="play-circle" size={18} color="#2ECC71" />
                  <ThemedText type="smallBold" style={styles.adTitle}>Daily Ad Boost</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  +{rewardAmount} PTS per ad • {adsLeft} left today
                </ThemedText>
              </View>
              <View style={styles.adCountWrap}>
                <ThemedText style={styles.adCountNum}>{adsLeft}</ThemedText>
              </View>
            </View>

            <Animated.View style={[styles.glowWrap, glowStyle]}>
              <View style={styles.glow} />
            </Animated.View>

            <Animated.View style={pulseStyle}>
              <Pressable
                onPress={handleWatchAd}
                disabled={adsLeft <= 0}
                style={({ pressed }) => [
                  styles.watchBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <LinearGradient
                  colors={adsLeft <= 0 ? ['#333', '#555'] : ['#2ECC71', '#27ae60']}
                  style={styles.watchGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {adsLeft <= 0 ? (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <ThemedText style={[styles.watchText, { color: '#fff' }]}>All Done!</ThemedText>
                    </>
                  ) : (
                    <>
                      <Ionicons name="play" size={20} color="#000" />
                      <ThemedText style={styles.watchText}>WATCH NOW</ThemedText>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </ThemedView>
        </Animated.View>

      </ScrollView>
      <RewardToast
        visible={showReward}
        points={rewardAmount}
        onDismiss={() => setShowReward(false)}
      />
      <AnnouncementModal
        visible={!!selectedAnn}
        announcement={selectedAnn}
        onClose={() => setSelectedAnn(null)}
        onCta={(link) => {
          setSelectedAnn(null);
          if (link) router.push(link as any);
        }}
      />
      {adOverlay}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 20 },

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
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: '#fff' },
  greetingSub: { fontSize: 13, marginTop: 2, color: '#8B949E' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  avatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  withdrawBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: '#2ECC7140',
  },
  withdrawText: { fontSize: 12, fontWeight: '700', color: '#2ECC71' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  balanceAmount: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  balanceUnit: { fontSize: 20, fontWeight: '700', color: '#2ECC71' },
  balanceBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  usdText: { fontSize: 13, fontWeight: '600', color: '#2ECC71CC' },
  followerHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  followerHintText: { fontSize: 12, fontWeight: '500', color: '#2ECC7180' },

  // Action Sections
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  actionCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { fontSize: 14 },
  actionSub: { fontSize: 11, lineHeight: 16 },

  // Streak Card
  streakCard: { borderRadius: 20, padding: 18, gap: 16 },
  streakHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  streakTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flameWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F59E0B18', alignItems: 'center', justifyContent: 'center',
  },
  streakBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: '#2ECC7120',
  },
  streakBadgeText: { fontSize: 11, fontWeight: '700', color: '#2ECC71' },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between' },
  streakDay: { alignItems: 'center', gap: 6 },
  streakDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  streakDotActive: { backgroundColor: '#2ECC71' },
  streakDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  streakLabel: { fontSize: 10 },
  streakLabelActive: { color: '#2ECC71', fontWeight: '700' },

  // Slideshow Carousel
  slideRow: {
    gap: 12,
    paddingRight: 16,
  },
  slideCard: {
    width: 320,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 4,
  },
  slideTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slideIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slideTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
  slideSub: {
    fontSize: 13,
    color: '#8B949E',
  },
  slideCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  slideCtaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Ad Card
  adCard: { borderRadius: 20, padding: 18, gap: 16, overflow: 'hidden' },
  adTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  adInfo: { gap: 6, flex: 1 },
  adTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adTitle: { fontSize: 15 },
  adCountWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#2ECC7115', alignItems: 'center', justifyContent: 'center',
  },
  adCountNum: { fontSize: 18, fontWeight: '800', color: '#2ECC71' },
  glowWrap: { position: 'absolute', top: -30, right: -30 },
  glow: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#2ECC7120',
  },
  watchBtn: { borderRadius: 28, overflow: 'hidden' },
  watchGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  watchText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
