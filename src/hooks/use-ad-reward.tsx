import { useState, useCallback } from 'react';
import { RewardedAdOverlay } from '@/components/rewarded-ad-overlay';

export function useAdReward(onEarnedReward: () => void, reward?: number, adUnitId?: string) {
  const [adVisible, setAdVisible] = useState(false);

  const showAd = useCallback(() => {
    try {
      const { TurboModuleRegistry } = require('react-native');
      if (!TurboModuleRegistry.get('RNGoogleMobileAdsModule')) {
        return;
      }
    } catch {
      return;
    }
    setAdVisible(true);
  }, []);

  const handleComplete = useCallback(() => {
    setAdVisible(false);
    onEarnedReward();
  }, [onEarnedReward]);

  const handleDismiss = useCallback(() => {
    setAdVisible(false);
  }, []);

  const adOverlay = (
    <RewardedAdOverlay
      visible={adVisible}
      onComplete={handleComplete}
      onDismiss={handleDismiss}
      reward={reward}
      adUnitId={adUnitId}
    />
  );

  return { showAd, adOverlay };
}
