import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SmartHeader } from '@/components/smart-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { KeyboardAvoidingWrapper } from '@/components/keyboard-avoiding-wrapper';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType, MOCK_FACEBOOK_PAGES, FacebookPage, TikTokProfileData } from '@/context/MockDataContext';
import { extractUsernameFromUrl, scrapeUserTikTokProfileWithRetry } from '@/services/tiktok-scraper';

type VerifyMethod = 'username' | 'link' | 'qrcode';

const PLATFORM_CONFIG: Record<PlatformType, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  facebook: { color: '#1877F2', icon: 'logo-facebook' },
  tiktok: { color: '#000000', icon: 'musical-notes' },
  telegram: { color: '#0088CC', icon: 'paper-plane' },
  youtube: { color: '#FF0000', icon: 'logo-youtube' },
};

const PLATFORMS: { key: PlatformType; label: string; subtitle: string }[] = [
  { key: 'facebook', label: 'Connect Facebook', subtitle: 'Link your Facebook page' },
  { key: 'tiktok', label: 'Connect TikTok', subtitle: 'Link your TikTok channel' },
  { key: 'telegram', label: 'Connect Telegram', subtitle: 'Link your Telegram channel' },
  { key: 'youtube', label: 'Connect YouTube', subtitle: 'Link your YouTube channel' },
];

const TIKTOK_METHODS: { key: VerifyMethod; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
  { key: 'username', icon: 'at-outline', label: 'Username', desc: 'Enter your @username' },
  { key: 'link', icon: 'link-outline', label: 'Share Link', desc: 'Paste your profile link' },
  { key: 'qrcode', icon: 'qr-code-outline', label: 'QR Code', desc: 'Scan your profile QR' },
];

const YOUTUBE_METHODS: { key: VerifyMethod; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
  { key: 'username', icon: 'at-outline', label: 'Username', desc: 'Enter your @username' },
  { key: 'link', icon: 'link-outline', label: 'Channel Link', desc: 'Paste your channel link' },
];

export default function SocialConnectScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();
  const { connectedAccounts } = state;
  const [refreshing, setRefreshing] = useState(false);
  const [verifyPlatform, setVerifyPlatform] = useState<PlatformType | null>(null);
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('username');
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [fbPages, setFbPages] = useState<FacebookPage[]>([]);
  const [fbPageStep, setFbPageStep] = useState<'login' | 'pages' | 'verify'>('login');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const openVerification = useCallback((platform: PlatformType) => {
    setVerifyPlatform(platform);
    setVerifyInput('');
    setVerifyError('');
    if (platform === 'facebook') {
      setFbPageStep('login');
      setFbPages(MOCK_FACEBOOK_PAGES);
      setVerifyMethod('link');
    } else {
      setVerifyMethod('username');
    }
  }, []);

  const closeVerification = useCallback(() => {
    setVerifyPlatform(null);
    setVerifyInput('');
    setVerifyError('');
    setFbPages([]);
    setFbPageStep('login');
  }, []);

  const handleSelectPage = useCallback((page: FacebookPage) => {
    dispatch({ type: 'CONNECT_FACEBOOK_PAGE', page });
    closeVerification();
  }, [dispatch, closeVerification]);

  const handleVerify = useCallback(async () => {
    const trimmed = verifyInput.trim();
    const platform = verifyPlatform!;

    if (platform === 'facebook') {
      if (fbPageStep === 'login') {
        setFbPageStep('pages');
        return;
      }
      if (!trimmed) {
        setVerifyError('Paste your Facebook Page link');
        return;
      }
      const valid = trimmed.includes('facebook.com') || trimmed.includes('fb.com');
      if (!valid) {
        setVerifyError('Enter a valid Facebook link (facebook.com/...)');
        return;
      }
      dispatch({ type: 'CONNECT_ACCOUNT', platform });
      closeVerification();
    } else if (platform === 'tiktok') {
      if (!trimmed) {
        setVerifyError('Enter your TikTok info');
        return;
      }

      let username: string | null = null;
      if (verifyMethod === 'username') {
        const clean = trimmed.replace(/^@/, '');
        if (clean.length < 2) {
          setVerifyError('Enter a valid username (min 2 characters)');
          return;
        }
        username = clean;
      } else if (verifyMethod === 'link') {
        const valid = trimmed.includes('tiktok.com') || trimmed.includes('vm.tiktok');
        if (!valid) {
          setVerifyError('Enter a valid TikTok link (tiktok.com/...)');
          return;
        }
        username = extractUsernameFromUrl(trimmed);
        if (!username) {
          setVerifyError('Could not extract username from that link');
          return;
        }
      }

      if (!username) {
        setVerifyError('Enter a valid TikTok username or link');
        return;
      }

      setVerifyLoading(true);
      setVerifyError('');

      try {
        const profile = await scrapeUserTikTokProfileWithRetry(username);
        dispatch({ type: 'CONNECT_TIKTOK', profile });
        closeVerification();
      } catch (err: any) {
        setVerifyError(err?.message || 'Could not verify. Try again');
      } finally {
        setVerifyLoading(false);
      }
    } else if (platform === 'youtube') {
      if (!trimmed) {
        setVerifyError('Enter your YouTube info');
        return;
      }
      if (verifyMethod === 'username') {
        const clean = trimmed.replace(/^@/, '');
        if (clean.length < 2) {
          setVerifyError('Enter a valid username (min 2 characters)');
          return;
        }
      } else if (verifyMethod === 'link') {
        const valid = trimmed.includes('youtube.com') || trimmed.includes('youtu.be');
        if (!valid) {
          setVerifyError('Enter a valid YouTube link (youtube.com/@...)');
          return;
        }
      }
      setVerifyError('');
      dispatch({ type: 'CONNECT_ACCOUNT', platform });
      closeVerification();
    }
  }, [verifyInput, verifyMethod, verifyPlatform, dispatch, closeVerification]);

  const handleDisconnect = useCallback((id: string, name: string) => {
    dispatch({ type: 'DISCONNECT_ACCOUNT', id });
  }, [dispatch]);

  const totalFollowers = useMemo(
    () => connectedAccounts.reduce((sum, a) => sum + a.followersCount, 0),
    [connectedAccounts]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SmartHeader
        title="Connect Social Accounts"
        subtitle="Link your channels to start earning and growing"
        rightContent={
          <View style={styles.followersChip}>
            <Ionicons name="people" size={14} color="#2ECC71" />
            <ThemedText style={styles.followersChipText}>
              {totalFollowers.toLocaleString()}
            </ThemedText>
          </View>
        }
      />

      <KeyboardAvoidingWrapper>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Connected Accounts</ThemedText>

          {connectedAccounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={40} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No accounts connected yet
              </ThemedText>
            </View>
          ) : (
            connectedAccounts.map((account, index) => (
              <Animated.View
                key={account.id}
                entering={FadeInDown.delay(index * 100).springify()}
              >
                <View style={[styles.accountCard, { borderColor: theme.textSecondary + '30' }]}>
                  <View style={[styles.platformIcon, { backgroundColor: PLATFORM_CONFIG[account.platform].color + '20' }]}>
                    <Ionicons
                      name={PLATFORM_CONFIG[account.platform].icon}
                      size={22}
                      color={PLATFORM_CONFIG[account.platform].color}
                    />
                  </View>
                  <View style={styles.accountInfo}>
                    <ThemedText type="smallBold">{account.displayName}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      @{account.username} • {account.followersCount.toLocaleString()} followers
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#2ECC7120' }]}>
                    <View style={styles.statusDot} />
                    <ThemedText style={styles.statusText}>Connected</ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleDisconnect(account.id, account.displayName)}
                    style={styles.disconnectBtn}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </Animated.View>
            ))
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Add Account</ThemedText>

          {PLATFORMS.map((platform, index) => (
            <Animated.View
              key={platform.key}
              entering={FadeInDown.delay(200 + index * 100).springify()}
            >
              <Pressable
                onPress={() => openVerification(platform.key)}
                style={({ pressed }) => [
                  styles.addCard,
                  { backgroundColor: PLATFORM_CONFIG[platform.key].color + '15', borderColor: PLATFORM_CONFIG[platform.key].color + '30' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name={PLATFORM_CONFIG[platform.key].icon}
                  size={28}
                  color={PLATFORM_CONFIG[platform.key].color}
                />
                <View style={styles.addCardText}>
                  <ThemedText type="smallBold">{platform.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{platform.subtitle}</ThemedText>
                </View>
                <Ionicons name="add-circle" size={24} color={PLATFORM_CONFIG[platform.key].color} />
              </Pressable>
            </Animated.View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Ionicons name="stats-chart" size={20} color="#2ECC71" />
            <ThemedText type="smallBold" style={styles.statsTitle}>Account Summary</ThemedText>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{connectedAccounts.length}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Connected</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{totalFollowers.toLocaleString()}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Total Followers</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>500</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">PTS Earned</ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
      </KeyboardAvoidingWrapper>

      {verifyPlatform && (
        <Animated.View
          entering={FadeInUp.duration(250).springify()}
          style={styles.verifyOverlay}
        >
          <Pressable style={styles.verifyBackdrop} onPress={closeVerification} />
          <KeyboardAvoidingWrapper headerOffset={0}>
          <Animated.View
            entering={FadeInUp.duration(350).springify().damping(18)}
            style={[styles.verifyModal, { paddingBottom: insets.bottom + 16 }]}
          >
            <LinearGradient
              colors={['#1a1a2e', '#0f0f1a']}
              style={styles.verifyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {verifyPlatform === 'facebook' ? (
                <>
                  <View style={styles.verifyHeader}>
                    <View style={styles.verifyPlatformRow}>
                      <View style={[styles.verifyPlatformIcon, { backgroundColor: '#1877F2' }]}>
                        <Ionicons name="logo-facebook" size={20} color="#fff" />
                      </View>
                      <View>
                        <ThemedText style={styles.verifyTitle}>
                          {fbPageStep === 'login' ? 'Facebook Login' : fbPageStep === 'pages' ? 'Select Your Page' : 'Verify Page'}
                        </ThemedText>
                        <ThemedText style={styles.verifySubtitle}>
                          {fbPageStep === 'login' ? 'Verify your Facebook identity' : fbPageStep === 'pages' ? 'Choose which Page to connect' : 'Confirm page link'}
                        </ThemedText>
                      </View>
                    </View>
                    <Pressable onPress={closeVerification} style={styles.verifyClose}>
                      <Ionicons name="close" size={22} color="#fff" />
                    </Pressable>
                  </View>

                  {fbPageStep === 'login' && (
                    <View style={styles.fbLoginBody}>
                      <View style={styles.fbLoginIcon}>
                        <Ionicons name="logo-facebook" size={48} color="#1877F2" />
                      </View>
                      <ThemedText style={styles.fbLoginTitle}>Continue with Facebook</ThemedText>
                      <ThemedText style={styles.fbLoginDesc}>
                        We'll verify you're the admin of your Page. No posts or personal data will be shared.
                      </ThemedText>
                      <View style={styles.fbPermsList}>
                        <View style={styles.fbPermItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                          <ThemedText style={styles.fbPermText}>Read your Pages list</ThemedText>
                        </View>
                        <View style={styles.fbPermItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                          <ThemedText style={styles.fbPermText}>Read Page follower count</ThemedText>
                        </View>
                        <View style={styles.fbPermItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                          <ThemedText style={styles.fbPermText}>We never post as your Page</ThemedText>
                        </View>
                      </View>
                    </View>
                  )}

                  {fbPageStep === 'pages' && (
                    <View style={styles.fbPagesBody}>
                      <ThemedText style={styles.fbPagesHint}>
                        You manage {fbPages.length} Pages. Select one to connect:
                      </ThemedText>
                      {fbPages.map((page, i) => (
                        <Animated.View key={page.id} entering={FadeInDown.delay(i * 80).springify()}>
                          <Pressable
                            onPress={() => handleSelectPage(page)}
                            style={({ pressed }) => [
                              styles.fbPageCard,
                              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                            ]}
                          >
                            <LinearGradient
                              colors={['#1877F220', '#1877F210']}
                              style={styles.fbPageIcon}
                            >
                              <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                            </LinearGradient>
                            <View style={styles.fbPageInfo}>
                              <ThemedText type="smallBold">{page.name}</ThemedText>
                              <ThemedText type="small" themeColor="textSecondary">
                                {page.category} • {page.followersCount.toLocaleString()} followers
                              </ThemedText>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#8B949E" />
                          </Pressable>
                        </Animated.View>
                      ))}
                      <Pressable
                        onPress={() => setFbPageStep('verify')}
                        style={({ pressed }) => [styles.fbSkipLink, pressed && { opacity: 0.7 }]}
                      >
                        <Ionicons name="link-outline" size={14} color="#8B949E" />
                        <ThemedText style={styles.fbSkipText}>Paste Page link instead</ThemedText>
                      </Pressable>
                    </View>
                  )}

                  {fbPageStep === 'verify' && (
                    <>
                      <View style={styles.fbSteps}>
                        <View style={styles.fbStep}>
                          <View style={styles.fbStepNum}>
                            <ThemedText style={styles.fbStepNumText}>1</ThemedText>
                          </View>
                          <View style={styles.fbStepContent}>
                            <ThemedText style={styles.fbStepTitle}>Switch to your Page</ThemedText>
                            <ThemedText style={styles.fbStepDesc}>
                              Tap your profile picture → Switch profiles → Select your Page
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.fbStep}>
                          <View style={styles.fbStepNum}>
                            <ThemedText style={styles.fbStepNumText}>2</ThemedText>
                          </View>
                          <View style={styles.fbStepContent}>
                            <ThemedText style={styles.fbStepTitle}>Copy Page link</ThemedText>
                            <ThemedText style={styles.fbStepDesc}>
                              Go to your Page • Tap ••• → Copy Link
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.fbStep}>
                          <View style={styles.fbStepNum}>
                            <ThemedText style={styles.fbStepNumText}>3</ThemedText>
                          </View>
                          <View style={styles.fbStepContent}>
                            <ThemedText style={styles.fbStepTitle}>Paste link below</ThemedText>
                            <ThemedText style={styles.fbStepDesc}>
                              Paste the copied Page link to verify
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      <View style={[styles.verifyInput, { borderColor: verifyError ? '#EF4444' : 'rgba(255,255,255,0.1)' }]}>
                        <View style={[styles.urlDomain, { backgroundColor: '#1877F220' }]}>
                          <Ionicons name="logo-facebook" size={14} color="#1877F2" />
                          <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#1877F2' }}>facebook.com</ThemedText>
                        </View>
                        <TextInput
                          style={[styles.verifyField, { color: theme.text }]}
                          placeholder="/profile.php?id=..."
                          placeholderTextColor={theme.textSecondary + '60'}
                          value={verifyInput}
                          onChangeText={(t) => { setVerifyInput(t); setVerifyError(''); }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="url"
                        />
                      </View>
                      {verifyError ? (
                        <View style={styles.verifyErrorRow}>
                          <Ionicons name="alert-circle" size={14} color="#EF4444" />
                          <ThemedText style={styles.verifyErrorText}>{verifyError}</ThemedText>
                        </View>
                      ) : null}
                      <ThemedText style={styles.fbExample}>
                        Example: facebook.com/profile.php?id=61577601656447
                      </ThemedText>
                    </>
                  )}
                </>
              ) : verifyPlatform === 'youtube' ? (
                <>
                  <View style={styles.verifyHeader}>
                    <View style={styles.verifyPlatformRow}>
                      <View style={[styles.verifyPlatformIcon, { backgroundColor: '#FF0000' }]}>
                        <Ionicons name="logo-youtube" size={20} color="#fff" />
                      </View>
                      <View>
                        <ThemedText style={styles.verifyTitle}>Verify YouTube Channel</ThemedText>
                        <ThemedText style={styles.verifySubtitle}>
                          Choose a method to verify ownership
                        </ThemedText>
                      </View>
                    </View>
                    <Pressable onPress={closeVerification} style={styles.verifyClose}>
                      <Ionicons name="close" size={22} color="#fff" />
                    </Pressable>
                  </View>

                  <View style={styles.methodsRow}>
                    {YOUTUBE_METHODS.map((method) => {
                      const active = verifyMethod === method.key;
                      return (
                        <Pressable
                          key={method.key}
                          onPress={() => { setVerifyMethod(method.key); setVerifyError(''); }}
                          style={({ pressed }) => [
                            styles.methodChip,
                            active && styles.methodChipActive,
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <Ionicons
                            name={method.icon}
                            size={16}
                            color={active ? '#2ECC71' : '#8B949E'}
                          />
                          <ThemedText style={[
                            styles.methodLabel,
                            active && { color: '#2ECC71', fontWeight: '700' },
                          ]}>
                            {method.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  {verifyMethod === 'username' && (
                    <View style={styles.verifyBody}>
                      <ThemedText style={styles.verifyHint}>
                        Enter your YouTube @username to verify
                      </ThemedText>
                      <View style={[styles.verifyInput, { borderColor: verifyError ? '#EF4444' : 'rgba(255,255,255,0.1)' }]}>
                        <View style={styles.verifyPrefix}>
                          <ThemedText style={styles.verifyPrefixText}>@</ThemedText>
                        </View>
                        <TextInput
                          style={[styles.verifyField, { color: theme.text }]}
                          placeholder="username"
                          placeholderTextColor={theme.textSecondary + '60'}
                          value={verifyInput.replace(/^@/, '')}
                          onChangeText={(t) => { setVerifyInput('@' + t.replace(/^@/, '')); setVerifyError(''); }}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      {verifyError ? (
                        <View style={styles.verifyErrorRow}>
                          <Ionicons name="alert-circle" size={14} color="#EF4444" />
                          <ThemedText style={styles.verifyErrorText}>{verifyError}</ThemedText>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {verifyMethod === 'link' && (
                    <View style={styles.verifyBody}>
                      <ThemedText style={styles.verifyHint}>
                        Paste your YouTube channel link
                      </ThemedText>
                      <View style={[styles.verifyInput, { borderColor: verifyError ? '#EF4444' : 'rgba(255,255,255,0.1)' }]}>
                        <View style={[styles.urlDomain, { backgroundColor: '#FF000020' }]}>
                          <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                          <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#FF0000' }}>youtube.com</ThemedText>
                        </View>
                        <TextInput
                          style={[styles.verifyField, { color: theme.text }]}
                          placeholder="/@username"
                          placeholderTextColor={theme.textSecondary + '60'}
                          value={verifyInput}
                          onChangeText={(t) => { setVerifyInput(t); setVerifyError(''); }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="url"
                        />
                      </View>
                      {verifyError ? (
                        <View style={styles.verifyErrorRow}>
                          <Ionicons name="alert-circle" size={14} color="#EF4444" />
                          <ThemedText style={styles.verifyErrorText}>{verifyError}</ThemedText>
                        </View>
                      ) : (
                        <ThemedText style={styles.verifyLinkHint}>
                          Format: youtube.com/@username
                        </ThemedText>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.verifyHeader}>
                    <View style={styles.verifyPlatformRow}>
                      <View style={[styles.verifyPlatformIcon, { backgroundColor: '#000' }]}>
                        <Ionicons name="musical-notes" size={20} color="#fff" />
                      </View>
                      <View>
                        <ThemedText style={styles.verifyTitle}>Verify TikTok Account</ThemedText>
                        <ThemedText style={styles.verifySubtitle}>
                          Choose a method to verify ownership
                        </ThemedText>
                      </View>
                    </View>
                    <Pressable onPress={closeVerification} style={styles.verifyClose}>
                      <Ionicons name="close" size={22} color="#fff" />
                    </Pressable>
                  </View>

                  <View style={styles.methodsRow}>
                    {TIKTOK_METHODS.map((method) => {
                      const active = verifyMethod === method.key;
                      return (
                        <Pressable
                          key={method.key}
                          onPress={() => { setVerifyMethod(method.key); setVerifyError(''); }}
                          style={({ pressed }) => [
                            styles.methodChip,
                            active && styles.methodChipActive,
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <Ionicons
                            name={method.icon}
                            size={16}
                            color={active ? '#2ECC71' : '#8B949E'}
                          />
                          <ThemedText style={[
                            styles.methodLabel,
                            active && { color: '#2ECC71', fontWeight: '700' },
                          ]}>
                            {method.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  {verifyMethod === 'username' && (
                    <View style={styles.verifyBody}>
                      <ThemedText style={styles.verifyHint}>
                        Enter your TikTok username to verify
                      </ThemedText>
                      <View style={[styles.verifyInput, { borderColor: verifyError ? '#EF4444' : 'rgba(255,255,255,0.1)' }]}>
                        <View style={styles.verifyPrefix}>
                          <ThemedText style={styles.verifyPrefixText}>@</ThemedText>
                        </View>
                        <TextInput
                          style={[styles.verifyField, { color: theme.text }]}
                          placeholder="username"
                          placeholderTextColor={theme.textSecondary + '60'}
                          value={verifyInput.replace(/^@/, '')}
                          onChangeText={(t) => { setVerifyInput('@' + t.replace(/^@/, '')); setVerifyError(''); }}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      {verifyError ? (
                        <View style={styles.verifyErrorRow}>
                          <Ionicons name="alert-circle" size={14} color="#EF4444" />
                          <ThemedText style={styles.verifyErrorText}>{verifyError}</ThemedText>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {verifyMethod === 'link' && (
                    <View style={styles.verifyBody}>
                      <ThemedText style={styles.verifyHint}>
                        Paste your TikTok profile link or share link
                      </ThemedText>
                      <View style={[styles.verifyInput, { borderColor: verifyError ? '#EF4444' : 'rgba(255,255,255,0.1)' }]}>
                        <TextInput
                          style={[styles.verifyField, { color: theme.text }]}
                          placeholder="tiktok.com/@username"
                          placeholderTextColor={theme.textSecondary + '60'}
                          value={verifyInput}
                          onChangeText={(t) => { setVerifyInput(t); setVerifyError(''); }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="url"
                        />
                      </View>
                      {verifyError ? (
                        <View style={styles.verifyErrorRow}>
                          <Ionicons name="alert-circle" size={14} color="#EF4444" />
                          <ThemedText style={styles.verifyErrorText}>{verifyError}</ThemedText>
                        </View>
                      ) : (
                        <ThemedText style={styles.verifyLinkHint}>
                          Works with: tiktok.com/@user, vm.tiktok.com/...
                        </ThemedText>
                      )}
                    </View>
                  )}

                  {verifyMethod === 'qrcode' && (
                    <View style={styles.verifyBody}>
                      <View style={styles.qrInfo}>
                        <LinearGradient
                          colors={['#000', '#1a1a2e']}
                          style={styles.qrPlaceholder}
                        >
                          <Ionicons name="qr-code" size={64} color="#fff" />
                        </LinearGradient>
                        <ThemedText style={styles.qrTitle}>Scan TikTok QR Code</ThemedText>
                        <ThemedText style={styles.qrDesc}>
                          Open TikTok, go to your profile, tap the QR icon in the top right, and enter the code shown
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </>
              )}

              {verifyPlatform === 'facebook' && fbPageStep === 'pages' ? null : (
                <Pressable
                  onPress={handleVerify}
                  disabled={verifyLoading}
                  style={({ pressed }) => [
                    { transform: [{ scale: pressed && !verifyLoading ? 0.97 : 1 }] },
                  ]}
                >
                  <LinearGradient
                    colors={['#2ECC71', '#27ae60']}
                    style={[styles.verifyBtn, verifyLoading && { opacity: 0.6 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {verifyLoading ? (
                      <Ionicons name="sync" size={20} color="#000" />
                    ) : (
                      <Ionicons name="checkmark-circle" size={20} color="#000" />
                    )}
                    <ThemedText style={styles.verifyBtnText}>
                      {verifyLoading
                        ? 'Verifying...'
                        : verifyPlatform === 'facebook'
                          ? fbPageStep === 'login'
                            ? 'Continue with Facebook'
                            : 'Verify & Connect Page'
                          : verifyMethod === 'qrcode'
                            ? 'I Scanned the QR Code'
                            : 'Verify & Connect'}
                    </ThemedText>
                  </LinearGradient>
                </Pressable>
              )}
            </LinearGradient>
          </Animated.View>
          </KeyboardAvoidingWrapper>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  followersChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#2ECC7120',
  },
  followersChipText: { fontSize: 13, fontWeight: '700', color: '#2ECC71' },
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
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
    backgroundColor: '#2ECC71',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2ECC71',
  },
  disconnectBtn: {
    padding: 4,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  addCardText: {
    flex: 1,
    gap: 2,
  },
  statsCard: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsTitle: {
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Verification Modal
  verifyOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  verifyBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  verifyModal: {
    borderRadius: 28,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  verifyGradient: {
    padding: 24,
    gap: 20,
  },
  verifyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  verifyPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifyPlatformIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  verifySubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  verifyClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Method Chips
  methodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  methodChipActive: {
    backgroundColor: '#2ECC7115',
    borderColor: '#2ECC71',
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B949E',
  },

  // Verify Body
  verifyBody: {
    gap: 10,
  },
  verifyHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  verifyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  verifyPrefix: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  verifyPrefixText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2ECC71',
  },
  verifyField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingRight: 12,
  },
  verifyErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifyErrorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  verifyLinkHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
  },

  // Facebook Login
  fbLoginBody: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  fbLoginIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1877F215',
    alignItems: 'center', justifyContent: 'center',
  },
  fbLoginTitle: {
    fontSize: 18, fontWeight: '800',
  },
  fbLoginDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 8,
  },
  fbPermsList: {
    gap: 10, paddingVertical: 4,
  },
  fbPermItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  fbPermText: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)',
  },
  fbPagesBody: {
    gap: 10,
  },
  fbPagesHint: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },
  fbPageCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 16, gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  fbPageIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  fbPageInfo: {
    flex: 1, gap: 2,
  },
  fbSkipLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  fbSkipText: {
    fontSize: 12, color: '#8B949E', fontWeight: '600',
  },

  // Facebook Steps
  fbSteps: {
    gap: 12,
  },
  fbStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  fbStepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1877F220',
    alignItems: 'center', justifyContent: 'center',
  },
  fbStepNumText: {
    fontSize: 13, fontWeight: '800', color: '#1877F2',
  },
  fbStepContent: {
    flex: 1, gap: 2,
  },
  fbStepTitle: {
    fontSize: 14, fontWeight: '700',
  },
  fbStepDesc: {
    fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18,
  },
  urlDomain: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginLeft: 2,
  },
  fbExample: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
  },

  // QR Code
  qrInfo: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  qrPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2ECC7140',
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  qrDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // Verify Button
  verifyBtn: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
});
