import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SmartHeader } from '@/components/smart-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useMockData, PlatformType } from '@/context/MockDataContext';

const PRESET_AVATARS = [
  { icon: 'person', color: '#2ECC71', bg: '#2ECC7120', label: 'Green' },
  { icon: 'person', color: '#3B82F6', bg: '#3B82F620', label: 'Blue' },
  { icon: 'person', color: '#8B5CF6', bg: '#8B5CF620', label: 'Purple' },
  { icon: 'person', color: '#F59E0B', bg: '#F59E0B20', label: 'Gold' },
  { icon: 'person', color: '#FF0000', bg: '#FF000020', label: 'Red' },
  { icon: 'person', color: '#EC4899', bg: '#EC489920', label: 'Pink' },
  { icon: 'person', color: '#06B6D4', bg: '#06B6D420', label: 'Cyan' },
  { icon: 'person', color: '#FFFFFF', bg: 'rgba(255,255,255,0.06)', label: 'White' },
];

const AVATAR_SIZE = 80;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: 'send-outline', iconColor: '#2ECC71', label: 'Send Points', route: '' },
  { icon: 'wallet-outline', iconColor: '#3B82F6', label: 'Wallet', route: '/(tabs)/wallet' },
  { icon: 'time-outline', iconColor: '#8B5CF6', label: 'History', route: '/follower-orders' },
  { icon: 'help-circle-outline', iconColor: '#F59E0B', label: 'Help Center', route: '' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { state, dispatch } = useMockData();
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const adminTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAvatarPress = useCallback(() => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);

    if (adminTapTimer.current) clearTimeout(adminTapTimer.current);
    adminTapTimer.current = setTimeout(() => setAdminTapCount(0), 3000);

    if (newCount >= 7) {
      setAdminTapCount(0);
      setPasscode('');
      setShowPasscode(true);
    }
  }, [adminTapCount]);

  const handlePasscodeSubmit = useCallback(() => {
    if (passcode === '1234' || state.user.email === 'admin@view2earn.com') {
      setShowPasscode(false);
      setPasscode('');
      router.push('/admin-panel');
    } else {
      Alert.alert('Access Denied', 'Invalid passcode');
      setPasscode('');
    }
  }, [passcode, state.user.email]);

  const handlePickPhoto = useCallback((avatarUrl: string) => {
    dispatch({ type: 'SET_AVATAR', avatarUrl });
    setShowAvatarPicker(false);
  }, [dispatch]);

  const handleUploadPhoto = useCallback(async () => {
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
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        dispatch({ type: 'SET_AVATAR', avatarUrl: result.assets[0].uri });
        setShowAvatarPicker(false);
      }
    } catch {
      Alert.alert('Unavailable', 'Photo upload is not available on this device. Try selecting a preset avatar instead.');
    }
  }, [dispatch]);

  const handleCopy = useCallback((label: string, value: string) => {
    Alert.alert('Copied', `${label}: ${value}`);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/(auth)/sign-in') },
    ]);
  }, []);

  const activeOrders = state.orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SmartHeader
        title="Profile"
        rightContent={
          <Pressable onPress={() => {}} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2ECC71" colors={["#2ECC71"]} />}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <ThemedView type="backgroundElement" style={styles.profileCard}>
            <Pressable onPress={handleAvatarPress} style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {state.user.avatarUrl?.startsWith('preset-') ? (
                  <LinearGradient
                    colors={[state.user.avatarUrl.replace('preset-', '') + '40', state.user.avatarUrl.replace('preset-', '') + '15']}
                    style={styles.avatarGradient}
                  >
                    <Ionicons name="person" size={36} color={state.user.avatarUrl.replace('preset-', '')} />
                  </LinearGradient>
                ) : state.user.avatarUrl ? (
                  <Image source={{ uri: state.user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={theme.textSecondary} />
                )}
              </View>
              <Pressable onPress={() => setShowAvatarPicker(true)} style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </Pressable>
            </Pressable>
            <ThemedText type="smallBold" style={styles.profileName}>{state.user.fullName}</ThemedText>
            <Pressable onPress={() => handleCopy('UID', state.user.id)} style={styles.copyChip}>
              <ThemedText type="small" themeColor="textSecondary">{state.user.id.slice(0, 8)}</ThemedText>
              <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleCopy('Email', state.user.email)} style={styles.copyChip}>
              <Ionicons name="mail-outline" size={14} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">{state.user.email}</ThemedText>
            </Pressable>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{state.balance.toLocaleString()}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Points</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>7</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Streak</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{state.completedFollowTasks.length}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Tasks</ThemedText>
              </View>
            </View>
          </ThemedView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Social Media</ThemedText>
            <Pressable
              onPress={() => router.push('/social-connect')}
              style={({ pressed }) => [styles.socialRow, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="globe-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.socialInfo}>
                <ThemedText type="smallBold">Connected Accounts</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {state.connectedAccounts.length} connected
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/follower-orders')}
              style={({ pressed }) => [styles.socialRow, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="clipboard-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.socialInfo}>
                <ThemedText type="smallBold">Active Orders</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {activeOrders} {activeOrders === 1 ? 'order' : 'orders'} in progress
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/follow-to-earn')}
              style={({ pressed }) => [styles.socialRow, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="cash-outline" size={20} color="#F59E0B" />
              </View>
              <View style={styles.socialInfo}>
                <ThemedText type="smallBold">Follow Tasks Completed</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {state.completedFollowTasks.length} tasks done
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          </ThemedView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Account</ThemedText>
            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  if (item.route.startsWith('/')) {
                    router.push(item.route as any);
                  } else {
                    Alert.alert(item.label, 'Coming soon!');
                  }
                }}
                style={({ pressed }) => [
                  styles.menuRow,
                  index < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.textSecondary + '15' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '20' }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <ThemedText type="smallBold" style={styles.menuLabel}>{item.label}</ThemedText>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Pressable>
            ))}
          </ThemedView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <Pressable onPress={handleLogout} style={styles.logoutRow}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <ThemedText style={styles.logoutText}>Log Out</ThemedText>
            </Pressable>
            <View style={styles.versionRow}>
              <ThemedText type="small" themeColor="textSecondary">VIEW2EARN v1.0.0</ThemedText>
            </View>
          </ThemedView>
        </Animated.View>
      </ScrollView>

      <Modal visible={showAvatarPicker} transparent animationType="fade" onRequestClose={() => setShowAvatarPicker(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.modalWrap}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: '#2ECC7120' }]}>
                <Ionicons name="image-outline" size={24} color="#2ECC71" />
              </View>
              <ThemedText type="smallBold" style={{ fontSize: 18 }}>Choose Avatar</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Select a profile picture style</ThemedText>
            </View>
            <View style={styles.avatarGrid}>
              {PRESET_AVATARS.map((av) => {
                const isActive = state.user.avatarUrl === `preset-${av.color}`;
                return (
                  <Pressable
                    key={av.color}
                    onPress={() => handlePickPhoto(`preset-${av.color}`)}
                    style={({ pressed }) => [
                      styles.avatarOption,
                      { backgroundColor: av.bg },
                      isActive && styles.avatarOptionActive,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <LinearGradient
                      colors={[av.color + '30', av.color + '10']}
                      style={styles.avatarOptionGradient}
                    >
                      <Ionicons name="person" size={28} color={av.color} />
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={handleUploadPhoto}
              style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#3B82F6" />
              <ThemedText type="smallBold" style={styles.uploadBtnText}>Upload Photo</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setShowAvatarPicker(false)}
              style={({ pressed }) => [styles.modalCancel, pressed && { opacity: 0.7 }]}
            >
              <ThemedText type="smallBold" themeColor="textSecondary">Cancel</ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showPasscode} transparent animationType="fade" onRequestClose={() => setShowPasscode(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.passcodeModal}>
            <View style={styles.passcodeHeader}>
              <View style={[styles.passcodeIconWrap, { backgroundColor: '#2ECC7120' }]}>
                <Ionicons name="shield-checkmark" size={28} color="#2ECC71" />
              </View>
              <ThemedText type="smallBold" style={{ fontSize: 18 }}>Admin Access</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Enter passcode to continue</ThemedText>
            </View>
            <TextInput
              style={styles.passcodeInput}
              placeholder="••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={passcode}
              onChangeText={setPasscode}
              onSubmitEditing={handlePasscodeSubmit}
              autoFocus
            />
            <Pressable onPress={handlePasscodeSubmit} style={({ pressed }) => [styles.passcodeSubmit, pressed && { opacity: 0.85 }]}>
              <ThemedText type="smallBold" style={styles.passcodeSubmitText}>Unlock Panel</ThemedText>
            </Pressable>
            <Pressable onPress={() => { setShowPasscode(false); setPasscode(''); }} style={({ pressed }) => [styles.modalCancel, pressed && { opacity: 0.7 }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">Cancel</ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#070B14',
  },
  profileName: {
    fontSize: 20,
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statBox: {
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
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialInfo: {
    flex: 1,
    gap: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  // Avatar Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalWrap: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    gap: 20,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 6,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionActive: {
    borderColor: '#2ECC71',
  },
  avatarOptionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#3B82F615',
  },
  uploadBtnText: {
    fontSize: 15,
    color: '#3B82F6',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  passcodeModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    gap: 20,
    alignItems: 'center',
  },
  passcodeHeader: {
    alignItems: 'center',
    gap: 6,
  },
  passcodeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  passcodeInput: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
  },
  passcodeSubmit: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passcodeSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
