import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Modal, ActivityIndicator, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from './themed-text';

const AD_LOAD_TIMEOUT = 15000;

interface Props {
  visible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  reward?: number;
  adUnitId?: string;
}

// Using dynamic TestIds from react-native-google-mobile-ads

export function RewardedAdOverlay({ visible, onComplete, onDismiss, reward, adUnitId }: Props) {
  const [showLoading, setShowLoading] = useState(false);
  const dismissedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) {
      dismissedRef.current = false;
      setShowLoading(false);
      return;
    }

    dismissedRef.current = false;
    setShowLoading(true);

    let RewardedAd: any;
    let AdEventType: any;
    let TestIds: any;
    try {
      const { TurboModuleRegistry } = require('react-native');
      if (!TurboModuleRegistry.get('RNGoogleMobileAdsModule')) {
        onDismiss();
        return;
      }
      const gma = require('react-native-google-mobile-ads');
      RewardedAd = gma.RewardedAd;
      AdEventType = gma.AdEventType;
      TestIds = gma.TestIds;
    } catch {
      onDismiss();
      return;
    }

    let actualAdUnitId = (adUnitId || '').trim();
    
    // If user pasted the Android or iOS test ID, use the dynamic TestIds.REWARDED 
    // so it works correctly on their current platform.
    if (
      actualAdUnitId === 'ca-app-pub-3940256099942544/5224354917' || 
      actualAdUnitId === 'ca-app-pub-3940256099942544/1712485313' ||
      !actualAdUnitId
    ) {
      actualAdUnitId = TestIds.REWARDED;
    }

    let unsubLoaded: any;
    let unsubClosed: any;
    let unsubEarned: any;
    let unsubError: any;

    const cleanup = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (unsubLoaded) unsubLoaded();
      if (unsubClosed) unsubClosed();
      if (unsubEarned) unsubEarned();
      if (unsubError) unsubError();
    };

    let fallbackTried = false;

    const loadAdWithId = (idToLoad: string) => {
      const ad = RewardedAd.createForAdRequest(idToLoad, {
        requestNonPersonalizedAdsOnly: true,
      });
      adRef.current = ad;

      unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        if (dismissedRef.current) return;
        cleanup();
        setShowLoading(false);
        ad.show();
      });

      unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (dismissedRef.current) return;
        dismissedRef.current = true;
        cleanup();
        onDismiss();
      });

      unsubEarned = ad.addAdEventListener(AdEventType.EARNED_REWARD, () => {
        if (dismissedRef.current) return;
        dismissedRef.current = true;
        cleanup();
        onComplete();
      });

      unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
        if (dismissedRef.current) return;
        cleanup();
        
        // If the user's provided ID failed, automatically fallback to TestIds.REWARDED
        if (!fallbackTried && idToLoad !== TestIds.REWARDED) {
          fallbackTried = true;
          timeoutRef.current = setTimeout(handleTimeout, AD_LOAD_TIMEOUT); // reset timeout for fallback
          loadAdWithId(TestIds.REWARDED);
        } else {
          dismissedRef.current = true;
          onDismiss();
        }
      });

      ad.load();
    };

    const handleTimeout = () => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        cleanup();
        onDismiss();
      }
    };

    loadAdWithId(actualAdUnitId);

    timeoutRef.current = setTimeout(handleTimeout, AD_LOAD_TIMEOUT);

    return () => {
      cleanup();
    };
  }, [visible, onComplete, onDismiss]);

  if (!visible || !showLoading) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.container}
      >
        <LinearGradient
          colors={['#0a0a0f', '#1a1a2e']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <View style={styles.brandCircle}>
            <Ionicons name="flash" size={44} color="#2ECC71" />
          </View>
          <ThemedText style={styles.brandName}>VIEW2EARN</ThemedText>
          <ActivityIndicator size="large" color="#2ECC71" style={{ marginTop: 24 }} />
          <ThemedText style={styles.loadingText}>Loading ad…</ThemedText>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  brandCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#2ECC71',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
});
