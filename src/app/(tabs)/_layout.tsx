import { useState, useRef, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppOpenAdOverlay } from '@/components/app-open-ad-overlay';
import AppTabs from '@/components/app-tabs';
import { useMockData } from '@/context/MockDataContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { state } = useMockData();
  const [showAppOpenAd, setShowAppOpenAd] = useState(false);
  const [adsInited, setAdsInited] = useState(false);
  const hasShownRef = useRef(false);

  useEffect(() => {
    setAdsInited(true);
  }, []);

  useEffect(() => {
    if (!adsInited) return;
    if (hasShownRef.current) return;
    const adUnitId = state.adConfig.admob.appOpenId;
    if (!adUnitId) return;
    hasShownRef.current = true;
    setShowAppOpenAd(true);
  }, [adsInited, state.adConfig.admob.appOpenId]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
      <AppOpenAdOverlay
        visible={showAppOpenAd}
        adUnitId={state.adConfig.admob.appOpenId}
        onDismiss={() => setShowAppOpenAd(false)}
      />
    </ThemeProvider>
  );
}
