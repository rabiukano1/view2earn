import { useState, useCallback, useRef, useEffect } from 'react';
import { Pressable, StyleSheet, View, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useMockData } from '@/context/MockDataContext';
import {
  extractUsernameFromUrl,
  isPrivateAccount,
  scrapeUserTikTokProfileWithRetry,
  verifyFollow,
} from '@/services/tiktok-scraper';

interface Props {
  visible: boolean;
  taskId: string;
  targetUsername: string;
  targetProfileUrl: string;
  reward?: number;
  onComplete: (verified: boolean) => void;
  onClose: () => void;
}

type InternalStep =
  | 'initializing'
  | 'scraping_before'
  | 'browser'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'private_blocked'
  | 'rate_limited';

function TikTokVerificationModal({
  visible,
  taskId,
  targetUsername,
  targetProfileUrl,
  reward,
  onComplete,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();

  const [step, setStep] = useState<InternalStep>('initializing');
  const [error, setError] = useState('');
  const [showUnfollowCheck, setShowUnfollowCheck] = useState(false);
  const [reCheckLoading, setReCheckLoading] = useState(false);

  const userBeforeRef = useRef<{
    followingCount: number;
    followersCount: number;
  } | null>(null);
  const targetBeforeRef = useRef<{
    followingCount: number;
    followersCount: number;
  } | null>(null);

  const tiktokAccount = state.connectedAccounts.find(
    (a) => a.platform === 'tiktok'
  );

  const initVerification = useCallback(async () => {
    setStep('scraping_before');
    setError('');

    const targetUser = extractUsernameFromUrl(targetUsername) || targetUsername;

    if (isPrivateAccount(targetUser)) {
      setStep('private_blocked');
      return;
    }

    if (!tiktokAccount?.profileUrl) {
      setError('Connect your TikTok account first');
      setStep('failed');
      return;
    }

    try {
      const userProfile = await scrapeUserTikTokProfileWithRetry(
        extractUsernameFromUrl(tiktokAccount.profileUrl) || 'demouser_official'
      );
      const targetProfile = await scrapeUserTikTokProfileWithRetry(targetUser);

      userBeforeRef.current = {
        followingCount: userProfile.followingCount,
        followersCount: userProfile.followersCount,
      };
      targetBeforeRef.current = {
        followingCount: targetProfile.followingCount,
        followersCount: targetProfile.followersCount,
      };

      setStep('browser');
    } catch {
      setStep('rate_limited');
    }
  }, [tiktokAccount, targetUsername]);

  useEffect(() => {
    if (visible) {
      initVerification();
    } else {
      setStep('initializing');
      setError('');
      setShowUnfollowCheck(false);
      setReCheckLoading(false);
      userBeforeRef.current = null;
      targetBeforeRef.current = null;
    }
  }, [visible, initVerification]);

  const handleOpenTikTok = useCallback(() => {
    Linking.openURL(targetProfileUrl);
  }, [targetProfileUrl]);

  const handleFollowed = useCallback(async () => {
    setStep('verifying');
    setError('');

    const targetUser = extractUsernameFromUrl(targetUsername) || targetUsername;
    const userBefore = userBeforeRef.current;
    const targetBefore = targetBeforeRef.current;

    if (!userBefore || !targetBefore || !tiktokAccount?.profileUrl) {
      setError('Verification data missing. Try again.');
      setStep('failed');
      return;
    }

    try {
      const result = await verifyFollow(
        tiktokAccount.profileUrl,
        targetUser,
        userBefore,
        targetBefore
      );

      if (result.verified) {
        setStep('success');
        const platSettings = state.settings.platforms.tiktok;
        const finalReward = reward ?? platSettings.rewardPerFollow;
        dispatch({
          type: 'SET_VERIFIED_FOLLOW_RESULT',
          taskId,
          verified: true,
          reward: finalReward,
        });
        onComplete(true);
      } else {
        setStep('failed');
        setError(result.error || 'Follow not detected.');
        setShowUnfollowCheck(true);
        dispatch({
          type: 'SET_VERIFIED_FOLLOW_RESULT',
          taskId,
          verified: false,
        });
        onComplete(false);
      }
    } catch {
      setStep('rate_limited');
    }
  }, [
    targetUsername,
    tiktokAccount,
    taskId,
    reward,
    state.settings.platforms.tiktok,
    dispatch,
    onComplete,
  ]);

  const handleReCheck = useCallback(async () => {
    setReCheckLoading(true);
    setError('');

    const targetUser = extractUsernameFromUrl(targetUsername) || targetUsername;

    if (!tiktokAccount?.profileUrl || !userBeforeRef.current) {
      setError('Verification data missing. Try again.');
      setReCheckLoading(false);
      return;
    }

    try {
      const userProfile = await scrapeUserTikTokProfileWithRetry(
        extractUsernameFromUrl(tiktokAccount.profileUrl) || 'demouser_official'
      );
      const targetProfile = await scrapeUserTikTokProfileWithRetry(targetUser);

      const userAfter = {
        followingCount: userProfile.followingCount,
        followersCount: userProfile.followersCount,
      };
      const targetAfter = {
        followingCount: targetProfile.followingCount,
        followersCount: targetProfile.followersCount,
      };

      const userFollowed =
        userAfter.followingCount ===
        (userBeforeRef.current?.followingCount ?? 0) + 1;
      const targetReceived =
        targetAfter.followersCount ===
        (targetBeforeRef.current?.followersCount ?? 0) + 1;

      if (userFollowed && targetReceived) {
        setStep('success');
        const finalReward =
          reward ?? state.settings.platforms.tiktok.rewardPerFollow;
        dispatch({
          type: 'SET_VERIFIED_FOLLOW_RESULT',
          taskId,
          verified: true,
          reward: finalReward,
        });
        onComplete(true);
      } else {
        setError(
          'Follow still not detected. Make sure you followed the account and try again.'
        );
        setReCheckLoading(false);
      }
    } catch {
      setError('Could not verify. Try again');
      setReCheckLoading(false);
    }
  }, [targetUsername, tiktokAccount, taskId, reward, state.settings.platforms.tiktok, dispatch, onComplete]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const renderBrowser = () => {
    const displayName = extractUsernameFromUrl(targetUsername) || targetUsername;
    return (
      <View style={styles.browserContainer}>
        <View style={styles.profileSection}>
          <LinearGradient
            colors={['#2ECC7120', '#2ECC7108']}
            style={styles.profileAvatarBg}
          >
            <View style={styles.profileAvatar}>
              <Ionicons name="musical-notes" size={32} color="#000" />
            </View>
          </LinearGradient>
          <ThemedText style={styles.profileName}>@{displayName}</ThemedText>
          <View style={styles.rewardChip}>
            <Ionicons name="flash" size={14} color="#2ECC71" />
            <ThemedText style={styles.rewardChipText}>+{reward ?? 25} PTS</ThemedText>
          </View>
        </View>

        <View style={styles.stepsContainer}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Ionicons name="musical-notes" size={14} color="#fff" />
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepLabel}>Follow the account</ThemedText>
              <ThemedText style={styles.stepHint}>
                Tap the button below to open TikTok and follow @{displayName}
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.stepRow}>
            <View style={styles.stepDot}>
              <Ionicons name="checkmark" size={14} color="#8B949E" />
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={[styles.stepLabel, { color: '#8B949E' }]}>
                Confirm & earn
              </ThemedText>
              <ThemedText style={styles.stepHint}>
                Come back and tap confirm to verify and earn points
              </ThemedText>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleOpenTikTok}
          style={({ pressed }) => [
            styles.openBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={['#000', '#1a1a2e']}
            style={styles.openBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="musical-notes" size={20} color="#fff" />
            <ThemedText style={styles.openBtnText}>Open in TikTok</ThemedText>
            <Ionicons name="open-outline" size={16} color="#fff" />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleFollowed}
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={['#2ECC71', '#27ae60']}
            style={styles.confirmBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#000" />
            <ThemedText style={styles.confirmBtnText}>I've Followed — Verify</ThemedText>
          </LinearGradient>
        </Pressable>
      </View>
    );
  };

  const renderScraping = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIconWrap}>
        <LinearGradient
          colors={['#2ECC7120', '#2ECC7105']}
          style={styles.statusIconBg}
        >
          <Ionicons name="search" size={40} color="#2ECC71" />
        </LinearGradient>
      </View>
      <ThemedText style={styles.statusTitle}>Checking Profiles</ThemedText>
      <ThemedText style={styles.statusDesc}>
        Scraping profile data to verify...
      </ThemedText>
    </View>
  );

  const renderVerifying = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIconWrap}>
        <LinearGradient
          colors={['#2ECC7120', '#2ECC7105']}
          style={styles.statusIconBg}
        >
          <Ionicons name="sync" size={40} color="#2ECC71" />
        </LinearGradient>
      </View>
      <ThemedText style={styles.statusTitle}>Verifying Follow</ThemedText>
      <ThemedText style={styles.statusDesc}>
        Re-checking profiles to confirm...
      </ThemedText>
      <ThemedText style={styles.statusHint}>
        This takes a few seconds
      </ThemedText>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIconWrap}>
        <LinearGradient
          colors={['#2ECC7130', '#2ECC7110']}
          style={[styles.statusIconBg, styles.successBg]}
        >
          <Ionicons name="checkmark-circle" size={48} color="#2ECC71" />
        </LinearGradient>
      </View>
      <ThemedText style={[styles.statusTitle, { color: '#2ECC71' }]}>
        Follow Verified!
      </ThemedText>
      <ThemedText style={styles.statusDesc}>
        Points will be credited to your balance.
      </ThemedText>
      <Pressable
        onPress={handleClose}
        style={({ pressed }) => [
          styles.doneBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <LinearGradient
          colors={['#2ECC71', '#27ae60']}
          style={styles.doneBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <ThemedText style={styles.doneBtnText}>Done</ThemedText>
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderFailed = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIconWrap}>
        <LinearGradient
          colors={['#EF444420', '#EF444410']}
          style={[styles.statusIconBg, { borderColor: '#EF444430' }]}
        >
          <Ionicons name="close-circle" size={48} color="#EF4444" />
        </LinearGradient>
      </View>
      <ThemedText style={[styles.statusTitle, { color: '#EF4444' }]}>
        Verification Failed
      </ThemedText>
      <ThemedText style={styles.statusDesc}>{error}</ThemedText>

      {showUnfollowCheck && (
        <View style={styles.unfollowCheckSection}>
          <View style={styles.unfollowCheckInfo}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
            <ThemedText style={styles.unfollowCheckText}>
              Did you unfollow? We can re-check after 30 seconds to confirm.
            </ThemedText>
          </View>
          <Pressable
            onPress={handleReCheck}
            disabled={reCheckLoading}
            style={({ pressed }) => [
              styles.retryBtn,
              pressed && { opacity: 0.85 },
              reCheckLoading && { opacity: 0.5 },
            ]}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.retryBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="refresh" size={16} color="#000" />
              <ThemedText style={styles.retryBtnText}>
                {reCheckLoading ? 'Checking...' : 'Re-check after 30s'}
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      <View style={styles.failedActions}>
        <Pressable
          onPress={() => {
            setStep('browser');
            setError('');
            setShowUnfollowCheck(false);
          }}
          style={({ pressed }) => [
            styles.tryAgainBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <ThemedText style={styles.tryAgainText}>Try Again</ThemedText>
        </Pressable>
        <Pressable onPress={handleClose} style={styles.cancelBtn}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const renderPrivateBlocked = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIconWrap}>
        <LinearGradient
          colors={['#EF444420', '#EF444410']}
          style={[styles.statusIconBg, { borderColor: '#EF444430' }]}
        >
          <Ionicons name="eye-off" size={48} color="#EF4444" />
        </LinearGradient>
      </View>
      <ThemedText style={[styles.statusTitle, { color: '#EF4444' }]}>
        This account is private
      </ThemedText>
      <ThemedText style={styles.statusDesc}>
        You can only follow public accounts. This task requires a public TikTok
        profile.
      </ThemedText>
      <Pressable onPress={handleClose} style={styles.cancelBtn}>
        <ThemedText style={styles.cancelText}>Back</ThemedText>
      </Pressable>
    </View>
  );

  const renderRateLimited = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusIconWrap}>
        <LinearGradient
          colors={['#F59E0B20', '#F59E0B10']}
          style={[styles.statusIconBg, { borderColor: '#F59E0B30' }]}
        >
          <Ionicons name="warning" size={48} color="#F59E0B" />
        </LinearGradient>
      </View>
      <ThemedText style={[styles.statusTitle, { color: '#F59E0B' }]}>
        Could not verify
      </ThemedText>
      <ThemedText style={styles.statusDesc}>
        {error || 'TikTok is rate-limiting requests. Try again in a moment.'}
      </ThemedText>
      <View style={styles.failedActions}>
        <Pressable
          onPress={initVerification}
          style={({ pressed }) => [
            styles.tryAgainBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <ThemedText style={styles.tryAgainText}>Try Again</ThemedText>
        </Pressable>
        <Pressable onPress={handleClose} style={styles.cancelBtn}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'initializing':
      case 'scraping_before':
        return renderScraping();
      case 'browser':
        return renderBrowser();
      case 'verifying':
        return renderVerifying();
      case 'success':
        return renderSuccess();
      case 'failed':
        return renderFailed();
      case 'private_blocked':
        return renderPrivateBlocked();
      case 'rate_limited':
        return renderRateLimited();
      default:
        return null;
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      style={[styles.overlay, { paddingTop: insets.top }]}
    >
      <View
        style={[
          styles.modalContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.topBarClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.topBarTitle}>
            {step === 'browser' ? 'Follow on TikTok' : 'Verifying...'}
          </ThemedText>
          <View style={styles.topBarSpacer} />
        </View>
        {renderStep()}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topBarClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  topBarSpacer: {
    width: 36,
  },

  // Browser
  browserContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 28,
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
  },
  rewardChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2ECC71',
  },
  stepsContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepDotActive: {
    backgroundColor: '#2ECC71',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  stepHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 13,
    marginVertical: 4,
  },
  openBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  openBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  openBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  confirmBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },

  // Status screens
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  statusIconWrap: {},
  statusIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2ECC7130',
  },
  successBg: {
    borderColor: '#2ECC7150',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // Success
  doneBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    marginTop: 8,
  },
  doneBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },

  // Failed
  failedActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  tryAgainBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  tryAgainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },

  // Unfollow re-check
  unfollowCheckSection: {
    gap: 12,
    width: '100%',
    paddingTop: 8,
  },
  unfollowCheckInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  unfollowCheckText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
    lineHeight: 18,
  },
  retryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  retryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});

export { TikTokVerificationModal };
export default TikTokVerificationModal;
