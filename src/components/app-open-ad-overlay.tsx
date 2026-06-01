import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Modal, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from './themed-text';

const AD_LOAD_TIMEOUT = 10000;

interface Props {
  visible: boolean;
  adUnitId: string | null;
  onDismiss: () => void;
}

export function AppOpenAdOverlay({ visible, adUnitId, onDismiss }: Props) {
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
    if (!adUnitId) {
      onDismiss();
      return;
    }

    dismissedRef.current = false;
    setShowLoading(true);

    let AppOpenAd: any;
    let AdEventType: any;
    try {
      const { TurboModuleRegistry } = require('react-native');
      if (!TurboModuleRegistry.get('RNGoogleMobileAdsModule')) {
        onDismiss();
        return;
      }
      const gma = require('react-native-google-mobile-ads');
      AppOpenAd = gma.AppOpenAd;
      AdEventType = gma.AdEventType;
    } catch {
      onDismiss();
      return;
    }

    const ad = AppOpenAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      if (dismissedRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setShowLoading(false);
      ad.show();
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      unsubLoaded();
      unsubClosed();
      unsubError();
      onDismiss();
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      if (dismissedRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      dismissedRef.current = true;
      unsubLoaded();
      unsubClosed();
      unsubError();
      onDismiss();
    });

    ad.load();

    timeoutRef.current = setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        unsubLoaded();
        unsubClosed();
        unsubError();
        onDismiss();
      }
    }, AD_LOAD_TIMEOUT);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [visible, adUnitId, onDismiss]);

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
