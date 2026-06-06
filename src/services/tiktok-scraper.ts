import { TikTokProfileData } from '@/context/MockDataContext';

const MOCK_TARGET_PROFILES: Record<string, TikTokProfileData> = {
  'fitnessbeast': {
    username: 'fitnessbeast',
    displayName: 'Fitness Beast',
    followingCount: 1234,
    followersCount: 12500,
    isPrivate: false,
    profileUrl: 'https://www.tiktok.com/@fitnessbeast',
  },
  'cookingmaster': {
    username: 'cookingmaster',
    displayName: 'Cooking Master',
    followingCount: 891,
    followersCount: 6800,
    isPrivate: false,
    profileUrl: 'https://www.tiktok.com/@cookingmaster',
  },
  'travelvlogs': {
    username: 'travelvlogs',
    displayName: 'Travel Vlogs',
    followingCount: 2105,
    followersCount: 15000,
    isPrivate: false,
    profileUrl: 'https://www.tiktok.com/@travelvlogs',
  },
  'petlovers': {
    username: 'petlovers',
    displayName: 'Pet Lovers',
    followingCount: 567,
    followersCount: 9700,
    isPrivate: false,
    profileUrl: 'https://www.tiktok.com/@petlovers',
  },
  'musicdiscovery': {
    username: 'musicdiscovery',
    displayName: 'Music Discovery',
    followingCount: 3421,
    followersCount: 18000,
    isPrivate: false,
    profileUrl: 'https://www.tiktok.com/@musicdiscovery',
  },
  'privaccount': {
    username: 'privaccount',
    displayName: 'Private Account',
    followingCount: 100,
    followersCount: 500,
    isPrivate: true,
    profileUrl: 'https://www.tiktok.com/@privaccount',
  },
};

export function extractUsernameFromUrl(url: string): string | null {
  const clean = url.trim().replace(/^@/, '');

  const tiktokMatch = clean.match(
    /(?:tiktok\.com\/|vm\.tiktok\.com\/)(?:@)?([a-zA-Z0-9_.-]+)/i
  );
  if (tiktokMatch) return tiktokMatch[1].toLowerCase();

  const usernameMatch = clean.match(/^[a-zA-Z0-9_.-]{2,24}$/);
  if (usernameMatch) return usernameMatch[0].toLowerCase();

  return null;
}

export function isPrivateAccount(username: string): boolean {
  const profile = MOCK_TARGET_PROFILES[username.toLowerCase()];
  return profile?.isPrivate ?? false;
}

export async function scrapeTikTokProfile(
  username: string
): Promise<TikTokProfileData> {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));

  const known = MOCK_TARGET_PROFILES[username.toLowerCase()];
  if (known) {
    if (known.isPrivate) {
      return { ...known };
    }
    const followingCount =
      known.followingCount + followSimulator.getPendingFollows(username);
    return { ...known, followingCount };
  }

  return {
    username: username.toLowerCase(),
    displayName: username,
    followingCount: Math.floor(Math.random() * 2000) + 100,
    followersCount: Math.floor(Math.random() * 50000) + 1000,
    isPrivate: false,
    profileUrl: `https://www.tiktok.com/@${username.toLowerCase()}`,
  };
}

class FollowSimulator {
  private targetFollowersDelta: Record<string, number> = {};
  private userFollowingDelta: number = 0;

  recordFollow(targetUsername: string) {
    const key = targetUsername.toLowerCase();
    this.targetFollowersDelta[key] = (this.targetFollowersDelta[key] || 0) + 1;
    this.userFollowingDelta += 1;
  }

  getPendingFollows(targetUsername: string): number {
    return this.targetFollowersDelta[targetUsername.toLowerCase()] || 0;
  }

  getUserFollowingDelta(): number {
    return this.userFollowingDelta;
  }

  reset() {
    this.targetFollowersDelta = {};
    this.userFollowingDelta = 0;
  }
}

export const followSimulator = new FollowSimulator();

export async function verifyFollow(
  userProfileUrl: string,
  targetUsername: string,
  userBefore: { followingCount: number; followersCount: number },
  targetBefore: { followingCount: number; followersCount: number }
): Promise<{
  verified: boolean;
  userAfter: { followingCount: number; followersCount: number };
  targetAfter: { followingCount: number; followersCount: number };
  error?: string;
}> {
  const waitTime = 3000 + Math.random() * 2000;
  await new Promise((r) => setTimeout(r, waitTime));

  const userScraped = await scrapeTikTokProfile(
    extractUsernameFromUrl(userProfileUrl) || 'demouser_official'
  );
  const targetScraped = await scrapeTikTokProfile(targetUsername);

  const userAfter = {
    followingCount: userScraped.followingCount,
    followersCount: userScraped.followersCount,
  };
  const targetAfter = {
    followingCount: targetScraped.followingCount,
    followersCount: targetScraped.followersCount,
  };

  const userFollowed = userAfter.followingCount === userBefore.followingCount + 1;
  const targetReceived = targetAfter.followersCount === targetBefore.followersCount + 1;

  if (userFollowed && targetReceived) {
    followSimulator.recordFollow(targetUsername);
    return { verified: true, userAfter, targetAfter };
  }

  return {
    verified: false,
    userAfter,
    targetAfter,
    error: 'Follow not detected. Make sure you followed the account.',
  };
}

export async function scrapeUserTikTokProfileWithRetry(
  username: string,
  retries = 1
): Promise<TikTokProfileData> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await scrapeTikTokProfile(username);
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      throw new Error('Could not verify. Try again');
    }
  }
  throw new Error('Could not verify. Try again');
}
