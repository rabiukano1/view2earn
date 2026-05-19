import { useState, useCallback } from 'react';
import { RewardedAdOverlay } from '@/components/rewarded-ad-overlay';

export function useAdReward(onEarnedReward: () => void) {
  const [adVisible, setAdVisible] = useState(false);

  const showAd = useCallback(() => {
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
    />
  );

  return { showAd, adOverlay };
}
