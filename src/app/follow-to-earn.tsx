import { useState, useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { SmartHeader } from '@/components/smart-header';
import { ClaimToast } from '@/components/claim-toast';
import { TikTokVerificationModal } from '@/components/tiktok-verification-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType, PerPlatformSettings } from '@/context/MockDataContext';

const PLATFORMS: PlatformType[] = ['facebook', 'tiktok', 'telegram', 'youtube'];

const PLATFORM_ICONS: Record<PlatformType, keyof typeof Ionicons.glyphMap> = {
  facebook: 'logo-facebook',
  tiktok: 'musical-notes',
  telegram: 'paper-plane',
  youtube: 'logo-youtube',
};

const PLATFORM_COLORS: Record<PlatformType, string> = {
  facebook: '#1877F2',
  tiktok: '#000000',
  telegram: '#0088CC',
  youtube: '#FF0000',
};

const PLATFORM_NAMES: Record<PlatformType, string> = {
  facebook: 'Facebook',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  youtube: 'YouTube',
};

export default function FollowToEarnScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [claimTask, setClaimTask] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [tikTokVerification, setTikTokVerification] = useState<{
    taskId: string;
    targetUsername: string;
    targetProfileUrl: string;
    reward: number;
  } | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const availableTasks = useMemo(
    () => state.followTasks.filter(t => !state.completedFollowTasks.includes(t.id)),
    [state.followTasks, state.completedFollowTasks]
  );

  const completedTasks = useMemo(
    () => state.followTasks.filter(t => state.completedFollowTasks.includes(t.id)),
    [state.followTasks, state.completedFollowTasks]
  );

  const totalDailyEarnings = useMemo(
    () => state.followTasks
      .filter(t => state.completedFollowTasks.includes(t.id))
      .reduce((sum, t) => sum + t.reward, 0),
    [state.followTasks, state.completedFollowTasks]
  );

  const tiktokAccount = useMemo(
    () => state.connectedAccounts.find(a => a.platform === 'tiktok'),
    [state.connectedAccounts]
  );

  const handleClaim = useCallback((taskId: string) => {
    const task = state.followTasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.platform === 'tiktok') {
      const targetName =
        task.channelName.toLowerCase().replace(/\s+/g, '');
      setTikTokVerification({
        taskId,
        targetUsername: targetName,
        targetProfileUrl: task.pageUrl || `https://www.tiktok.com/@${targetName}`,
        reward: task.reward,
      });
    } else {
      setLoadingTask(taskId);
      setTimeout(() => {
        setLoadingTask(null);
        setClaimTask(taskId);
      }, 1500);
    }
  }, [state.followTasks]);

  const handleTikTokComplete = useCallback((verified: boolean) => {
    setTikTokVerification(null);
  }, []);

  const handleTikTokClose = useCallback(() => {
    setTikTokVerification(null);
  }, []);

  const currentClaim = claimTask ? state.followTasks.find(t => t.id === claimTask) : null;

  const platProgress = useMemo(() => {
    return PLATFORMS.map(p => {
      const completed = state.completedFollowTasksPerPlatform?.[p]?.length ?? 0;
      const platSet: PerPlatformSettings = state.settings.platforms[p];
      const bonusAt = platSet?.bonusAtTasks ?? 10;
      const bonusAmt = platSet?.bonusAmount ?? 50;
      const earnedBonus = completed >= bonusAt && bonusAt > 0;
      return { platform: p, completed, bonusAt, bonusAmt, earnedBonus };
    });
  }, [state.completedFollowTasksPerPlatform, state.settings.platforms]);

  const totalCompleted = state.completedFollowTasks.length;
  const nextBonus = platProgress.find(p => !p.earnedBonus && p.bonusAt > 0);

  const tasksByPlatform = useMemo(() => {
    const grouped: Record<PlatformType, typeof availableTasks> = {
      facebook: [],
      tiktok: [],
      telegram: [],
      youtube: [],
    };
    for (const task of availableTasks) {
      grouped[task.platform]?.push(task);
    }
    return grouped;
  }, [availableTasks]);

  const completedByPlatform = useMemo(() => {
    const grouped: Record<PlatformType, typeof completedTasks> = {
      facebook: [],
      tiktok: [],
      telegram: [],
      youtube: [],
    };
    for (const task of completedTasks) {
      grouped[task.platform]?.push(task);
    }
    return grouped;
  }, [completedTasks]);

  const renderTaskItem = (task: typeof availableTasks[number], isCompleted = false) => (
    <View key={task.id} style={styles.taskRow}>
      <View style={styles.taskPlatformIcon}>
        <Ionicons
          name={PLATFORM_ICONS[task.platform]}
          size={16}
          color={PLATFORM_COLORS[task.platform]}
        />
      </View>

      <View style={styles.taskRowBody}>
        <View style={styles.taskRowInfo}>
          <ThemedText style={[styles.taskRowName, isCompleted && styles.completedText]} numberOfLines={1}>
            {task.channelName}
          </ThemedText>
          <View style={styles.taskRowMeta}>
            <View style={styles.taskRowCategory}>
              <ThemedText style={styles.taskRowCategoryText}>{task.category}</ThemedText>
            </View>
            <ThemedText style={styles.taskRowFollowers}>
              {task.followers} followers
            </ThemedText>
          </View>
        </View>

        {isCompleted ? (
          <View style={styles.taskRowCompleted}>
            <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
          </View>
        ) : (
          <View style={styles.taskRowAction}>
            <View style={styles.taskRowReward}>
              <ThemedText style={styles.taskRowRewardValue}>+{task.reward}</ThemedText>
            </View>
            <Pressable
              onPress={() => handleClaim(task.id)}
              disabled={loadingTask === task.id}
              style={({ pressed }) => [
                styles.taskRowBtn,
                loadingTask === task.id && styles.taskRowBtnLoading,
                pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
              ]}
            >
              <ThemedText style={styles.taskRowBtnText}>
                {loadingTask === task.id ? '...' : 'Claim'}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  const renderPlatformSection = (platform: PlatformType, tasks: typeof availableTasks, isCompleted = false) => {
    if (tasks.length === 0) return null;
    const color = PLATFORM_COLORS[platform];
    return (
      <Animated.View
        key={platform + (isCompleted ? '-done' : '')}
        entering={FadeInDown.delay(PLATFORMS.indexOf(platform) * 80).springify()}
      >
        <ThemedView type="backgroundElement" style={[styles.platformSection, { borderLeftColor: color }]}>
          <View style={styles.platformSectionHeader}>
            <View style={[styles.platformSectionIcon, { backgroundColor: color + '18' }]}>
              <Ionicons name={PLATFORM_ICONS[platform]} size={16} color={color} />
            </View>
            <ThemedText style={styles.platformSectionName}>{PLATFORM_NAMES[platform]}</ThemedText>
            <View style={styles.platformSectionCount}>
              <ThemedText style={styles.platformSectionCountText}>{tasks.length}</ThemedText>
            </View>
          </View>
          <View style={styles.platformSectionTasks}>
            {tasks.map(task => renderTaskItem(task, isCompleted))}
          </View>
        </ThemedView>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SmartHeader
        title="Follow & Earn"
        subtitle="Complete tasks to earn PTS"
        rightContent={
          <View style={styles.earnedBadge}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <ThemedText style={styles.earnedText}>+{totalDailyEarnings} today</ThemedText>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <LinearGradient
          colors={['#2ECC7115', '#2ECC7105']}
          style={styles.statsBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{totalCompleted}</ThemedText>
              <ThemedText style={styles.statLabel}>Done</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: '#2ECC71' }]}>
                {totalDailyEarnings}
              </ThemedText>
              <ThemedText style={styles.statLabel}>PTS Today</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {availableTasks.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Left</ThemedText>
            </View>
          </View>

          {nextBonus && (
            <View style={styles.bonusHint}>
              <Ionicons name="gift-outline" size={12} color="#F59E0B" />
              <ThemedText style={styles.bonusHintText}>
                {nextBonus.bonusAt - nextBonus.completed} more {PLATFORM_NAMES[nextBonus.platform]} task{nextBonus.bonusAt - nextBonus.completed > 1 ? 's' : ''} → +{nextBonus.bonusAmt} PTS
              </ThemedText>
            </View>
          )}
        </LinearGradient>

        <ThemedText style={styles.sectionLabel}>Platform Progress</ThemedText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.platformRow}
        >
          {platProgress.map(p => {
            const color = PLATFORM_COLORS[p.platform];
            const pct = p.bonusAt > 0 ? Math.min((p.completed / p.bonusAt) * 100, 100) : 0;
            return (
              <ThemedView key={p.platform} type="backgroundElement" style={styles.platformCard}>
                <View style={[styles.platformIconWrap, { backgroundColor: color + '18' }]}>
                  <Ionicons name={PLATFORM_ICONS[p.platform]} size={18} color={color} />
                </View>
                <ThemedText style={styles.platformName}>
                  {PLATFORM_NAMES[p.platform]}
                </ThemedText>
                <View style={[styles.platformBarTrack, { backgroundColor: color + '15' }]}>
                  <View style={[styles.platformBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
                <ThemedText style={[styles.platformCount, p.earnedBonus && { color: '#2ECC71' }]}>
                  {p.completed}/{p.bonusAt}
                </ThemedText>
                {p.earnedBonus && (
                  <View style={styles.platformBonusBadge}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </ThemedView>
            );
          })}
        </ScrollView>

        {!tiktokAccount && (
          <ThemedView type="backgroundElement" style={styles.warningCard}>
            <Ionicons name="alert-circle" size={18} color="#F59E0B" />
            <ThemedText style={styles.warningText}>
              Connect your TikTok account first to earn from TikTok tasks.
            </ThemedText>
          </ThemedView>
        )}

        <ThemedText style={styles.sectionLabel}>
          Available Tasks
          {availableTasks.length > 0 && (
            <ThemedText style={styles.taskCount}>  ·  {availableTasks.length}</ThemedText>
          )}
        </ThemedText>

        {availableTasks.length === 0 ? (
          <Animated.View entering={FadeInUp} style={styles.allDone}>
            <View style={styles.allDoneIconWrap}>
              <LinearGradient
                colors={['#2ECC7120', '#2ECC7108']}
                style={styles.allDoneIconBg}
              >
                <Ionicons name="checkmark-circle" size={40} color="#2ECC71" />
              </LinearGradient>
            </View>
            <ThemedText style={styles.allDoneTitle}>All Caught Up!</ThemedText>
            <ThemedText style={styles.allDoneDesc}>
              You've completed every task available today. New tasks arrive tomorrow.
            </ThemedText>
          </Animated.View>
        ) : (
          PLATFORMS.map(platform => renderPlatformSection(platform, tasksByPlatform[platform]))
        )}

        {completedTasks.length > 0 && (
          <>
            <ThemedText style={[styles.sectionLabel, { marginTop: 8 }]}>
              Claimed Today
              <ThemedText style={styles.taskCount}>  ·  {completedTasks.length}</ThemedText>
            </ThemedText>
            {PLATFORMS.map(platform => renderPlatformSection(platform, completedByPlatform[platform], true))}
          </>
        )}
      </ScrollView>

      <ClaimToast
        visible={!!currentClaim}
        channelName={currentClaim?.channelName ?? ''}
        platform={currentClaim?.platform ?? 'facebook'}
        reward={currentClaim?.reward ?? 0}
        pageUrl={currentClaim?.pageUrl}
        onConfirm={() => {
          if (claimTask) {
            dispatch({ type: 'COMPLETE_FOLLOW_TASK', taskId: claimTask });
          }
          setClaimTask(null);
        }}
        onCancel={() => setClaimTask(null)}
      />

      <TikTokVerificationModal
        visible={!!tikTokVerification}
        taskId={tikTokVerification?.taskId ?? ''}
        targetUsername={tikTokVerification?.targetUsername ?? ''}
        targetProfileUrl={tikTokVerification?.targetProfileUrl ?? ''}
        reward={tikTokVerification?.reward}
        onComplete={handleTikTokComplete}
        onClose={handleTikTokClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  earnedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statsBanner: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bonusHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  bonusHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  taskCount: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
  },

  // Platform progress cards
  platformRow: {
    gap: 10,
    paddingRight: 16,
  },
  platformCard: {
    width: 112,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    alignItems: 'center',
  },
  platformIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    fontSize: 12,
    fontWeight: '700',
  },
  platformBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  platformBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  platformCount: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  platformBonusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Warning
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    flex: 1,
    lineHeight: 18,
  },

  // Platform task sections
  platformSection: {
    borderRadius: 18,
    borderLeftWidth: 3,
    paddingLeft: 0,
    overflow: 'hidden',
  },
  platformSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  platformSectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformSectionName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  platformSectionCount: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  platformSectionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  platformSectionTasks: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },

  // Task rows inside platform sections
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  taskPlatformIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  taskRowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskRowInfo: {
    flex: 1,
    gap: 3,
  },
  taskRowName: {
    fontSize: 13,
    fontWeight: '700',
  },
  completedText: {
    opacity: 0.5,
  },
  taskRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskRowCategory: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  taskRowCategoryText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  taskRowFollowers: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '500',
  },
  taskRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskRowReward: {},
  taskRowRewardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2ECC71',
    letterSpacing: -0.3,
  },
  taskRowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#2ECC71',
  },
  taskRowBtnLoading: {
    opacity: 0.5,
  },
  taskRowBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskRowCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2ECC7115',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // All done
  allDone: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  allDoneIconWrap: {},
  allDoneIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allDoneTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  allDoneDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
