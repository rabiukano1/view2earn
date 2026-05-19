import { useState, useCallback, useMemo } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SmartHeader } from '@/components/smart-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType } from '@/context/MockDataContext';

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

export default function FollowToEarnScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleClaim = useCallback((taskId: string) => {
    setLoadingTask(taskId);
    setTimeout(() => {
      setLoadingTask(null);
      const task = state.followTasks.find(t => t.id === taskId);
      if (!task) return;

      Alert.alert(
        'Follow to Earn',
        `Follow ${task.channelName} on ${task.platform} to claim your reward!`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'I Followed',
            onPress: () => {
              dispatch({ type: 'COMPLETE_FOLLOW_TASK', taskId });
            },
          },
        ]
      );
    }, 1500);
  }, [state.followTasks, dispatch]);

  const progressPercent = (state.completedFollowTasks.length / 10) * 100;

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
        <ThemedView type="backgroundElement" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <ThemedText type="smallBold">Daily Progress</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {state.completedFollowTasks.length}/10 tasks completed
              </ThemedText>
            </View>
            <View style={styles.bonusBadge}>
              <Ionicons name="gift-outline" size={14} color="#F59E0B" />
              <ThemedText style={styles.bonusText}>+50 PTS bonus</ThemedText>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.textSecondary + '20' }]}>
            <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Complete 10 tasks to earn a 50 PTS bonus!
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.earningsBanner}>
          <Ionicons name="trending-up" size={20} color="#2ECC71" />
          <View style={styles.earningsInfo}>
            <ThemedText type="small" themeColor="textSecondary">Today's Earnings</ThemedText>
            <ThemedText type="smallBold" style={{ color: '#2ECC71' }}>
              {totalDailyEarnings} PTS
            </ThemedText>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsInfo}>
            <ThemedText type="small" themeColor="textSecondary">This Week</ThemedText>
            <ThemedText type="smallBold" style={{ color: '#2ECC71' }}>850 PTS</ThemedText>
          </View>
        </ThemedView>

        <ThemedText type="smallBold" style={styles.sectionLabel}>Available Tasks</ThemedText>

        {availableTasks.length === 0 ? (
          <Animated.View entering={FadeInUp} style={styles.allDone}>
            <Ionicons name="checkmark-circle" size={48} color="#2ECC71" />
            <ThemedText type="smallBold" style={styles.allDoneTitle}>All Done!</ThemedText>
            <ThemedText themeColor="textSecondary">Come back tomorrow for new tasks</ThemedText>
          </Animated.View>
        ) : (
          availableTasks.map((task, index) => (
            <Animated.View
              key={task.id}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <ThemedView type="backgroundElement" style={styles.taskCard}>
                <View style={styles.taskLeft}>
                  <View style={[styles.taskPlatformIcon, { backgroundColor: PLATFORM_COLORS[task.platform] + '20' }]}>
                    <Ionicons
                      name={PLATFORM_ICONS[task.platform]}
                      size={20}
                      color={PLATFORM_COLORS[task.platform]}
                    />
                  </View>
                  <View style={styles.taskInfo}>
                    <ThemedText type="smallBold">{task.channelName}</ThemedText>
                    <View style={styles.taskMeta}>
                      <View style={styles.categoryTag}>
                        <ThemedText style={styles.categoryText}>{task.category}</ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {task.followers} followers
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <View style={styles.taskRight}>
                  <ThemedText style={styles.rewardText}>+{task.reward}</ThemedText>
                  <ThemedText type="small" style={styles.rewardLabel}>PTS</ThemedText>
                  <Pressable
                    onPress={() => handleClaim(task.id)}
                    disabled={loadingTask === task.id}
                    style={[
                      styles.claimBtn,
                      loadingTask === task.id && styles.claimBtnLoading,
                    ]}
                  >
                    <ThemedText style={styles.claimBtnText}>
                      {loadingTask === task.id ? '...' : 'Follow & Claim'}
                    </ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            </Animated.View>
          ))
        )}

        {completedTasks.length > 0 && (
          <>
            <ThemedText type="smallBold" style={[styles.sectionLabel, { marginTop: 8 }]}>
              Claimed Today
            </ThemedText>
            {completedTasks.map((task, index) => (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(index * 40).springify()}
              >
                <ThemedView type="backgroundElement" style={[styles.taskCard, styles.taskCompleted]}>
                  <View style={styles.taskLeft}>
                    <View style={[styles.taskPlatformIcon, { backgroundColor: PLATFORM_COLORS[task.platform] + '20' }]}>
                      <Ionicons
                        name={PLATFORM_ICONS[task.platform]}
                        size={20}
                        color={PLATFORM_COLORS[task.platform]}
                      />
                    </View>
                    <View style={styles.taskInfo}>
                      <ThemedText type="smallBold" style={{ opacity: 0.6 }}>{task.channelName}</ThemedText>
                      <View style={styles.taskMeta}>
                        <View style={[styles.categoryTag, { opacity: 0.6 }]}>
                          <ThemedText style={styles.categoryText}>{task.category}</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.taskRight}>
                    <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
                  </View>
                </ThemedView>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
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
    gap: 12,
  },
  progressCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  bonusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#2ECC71',
  },
  earningsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  earningsInfo: {
    gap: 2,
  },
  earningsDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabel: {
    fontSize: 16,
    paddingTop: 4,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  taskCompleted: {
    opacity: 0.7,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  taskPlatformIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
    gap: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B949E',
  },
  taskRight: {
    alignItems: 'center',
    gap: 2,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2ECC71',
  },
  rewardLabel: {
    fontSize: 10,
    color: '#2ECC71',
    fontWeight: '600',
  },
  claimBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2ECC71',
  },
  claimBtnLoading: {
    opacity: 0.6,
  },
  claimBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  allDone: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  allDoneTitle: {
    fontSize: 18,
  },
});
