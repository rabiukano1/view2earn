import { createContext, useContext, useReducer, useEffect, useRef, useState, ReactNode } from 'react';
import { loadAdConfig, saveAdConfig } from '@/utils/persistence';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profile.service';
import { connectedAccountService } from '@/services/accounts.service';
import { orderService } from '@/services/orders.service';
import { followTaskService } from '@/services/tasks.service';
import { transactionService } from '@/services/transactions.service';
import { announcementService } from '@/services/announcements.service';
import { challengeService } from '@/services/challenges.service';
import { payoutService } from '@/services/payout.service';
import { getErrorMessage } from '@/utils/error-handler';

export type PlatformType = 'facebook' | 'tiktok' | 'telegram' | 'youtube';
export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type PayoutStatus = 'pending' | 'approved' | 'rejected';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface ConnectedAccount {
  id: string;
  platform: PlatformType;
  username: string;
  displayName: string;
  isConnected: boolean;
  followersCount: number;
  avatarUrl?: string;
  pageId?: string;
  pageAccessToken?: string;
  pageUrl?: string;
  followingCount?: number;
  profileUrl?: string;
}

export interface FollowerOrder {
  id: string;
  platform: PlatformType;
  followers: number;
  cost: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  progress: number;
  pageId?: string;
  pageUrl?: string;
}

export interface FollowTask {
  id: string;
  platform: PlatformType;
  channelName: string;
  category: string;
  reward: number;
  followers: string;
  pageUrl?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  followersCount: number;
  accessToken: string;
  url: string;
}

export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  balance: number;
  isAdmin: boolean;
  avatarUrl?: string;
  status?: UserStatus;
  createdAt?: string;
  totalEarned?: number;
  totalSpent?: number;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: string;
  address: string;
  status: PayoutStatus;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  adminId: string;
  details: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  content: string;
  link?: string;
  cta?: string;
  active: boolean;
  createdAt: string;
  color?: string;
}

export interface AdMobConfig {
  appOpenId: string;
  interstitialId: string;
  bannerId: string;
  rewardedId: string;
}

export interface UnityAdsConfig {
  gameId: string;
}

export interface AudienceNetworkConfig {
  appId: string;
  interstitialPlacementId: string;
  bannerPlacementId: string;
  rewardedPlacementId: string;
}

export interface AdConfig {
  admob: AdMobConfig;
  unityAds: UnityAdsConfig;
  audienceNetwork: AudienceNetworkConfig;
}

export interface PerPlatformSettings {
  rewardPerFollow: number;
  dailyFollowLimit: number;
  bonusAtTasks: number;
  bonusAmount: number;
}

export interface PlatformSettings {
  platforms: Record<PlatformType, PerPlatformSettings>;
  minWithdrawal: number;
  exchangeRate: number;
  newUserBonus: number;
  watchReward: number;
}

export type AITaskType = 'daily' | 'weekly' | 'challenge';

export interface AIDynamicTask {
  id: string;
  title: string;
  description: string;
  type: AITaskType;
  reward: number;
  instructions?: string;
  linkUrl?: string;
  icon?: string;
  createdAt: string;
  active: boolean;
}

export interface AIQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface AIQuiz {
  id: string;
  title: string;
  description: string;
  questions: AIQuestion[];
  reward: number;
  passingScore: number;
  createdAt: string;
  active: boolean;
}

export interface DailyChallengeEntry {
  date: string;
  completedTaskIds: string[];
  completedQuizIds: string[];
  totalEarned: number;
}

export interface TikTokProfileData {
  username: string;
  displayName: string;
  followingCount: number;
  followersCount: number;
  isPrivate: boolean;
  avatarUrl?: string;
  profileUrl: string;
}

export type TikTokVerificationStep =
  | 'idle'
  | 'scraping_before'
  | 'browser_open'
  | 'awaiting_follow'
  | 'scraping_after'
  | 'verifying'
  | 'success'
  | 'failed';

export interface TikTokVerificationState {
  step: TikTokVerificationStep;
  userBefore?: { followingCount: number; followersCount: number };
  targetBefore?: { followingCount: number; followersCount: number };
  userAfter?: { followingCount: number; followersCount: number };
  targetAfter?: { followingCount: number; followersCount: number };
  error?: string;
}

export interface VerificationAttempt {
  id: string;
  taskId: string;
  targetUsername: string;
  passed: boolean;
  timestamp: string;
}

interface MockDataState {
  user: MockUser;
  connectedAccounts: ConnectedAccount[];
  orders: FollowerOrder[];
  followTasks: FollowTask[];
  completedFollowTasks: string[];
  completedFollowTasksPerPlatform: Record<PlatformType, string[]>;
  dailyFollowCount: number;
  balance: number;
  mockUsers: MockUser[];
  payoutRequests: PayoutRequest[];
  auditLog: AuditEntry[];
  settings: PlatformSettings;
  announcements: Announcement[];
  adConfig: AdConfig;
  aiTasks: AIDynamicTask[];
  aiQuizzes: AIQuiz[];
  dailyChallenges: DailyChallengeEntry[];
  verificationAttempts: VerificationAttempt[];
}

type MockAction =
  | { type: 'CONNECT_ACCOUNT'; platform: PlatformType }
  | { type: 'CONNECT_FACEBOOK_PAGE'; page: FacebookPage }
  | { type: 'CONNECT_TIKTOK'; profile: TikTokProfileData }
  | { type: 'DISCONNECT_ACCOUNT'; id: string }
  | { type: 'PLACE_ORDER'; order: FollowerOrder }
  | { type: 'CANCEL_ORDER'; id: string }
  | { type: 'COMPLETE_FOLLOW_TASK'; taskId: string }
  | { type: 'ADD_FOLLOW_TASKS'; tasks: FollowTask[] }
  | { type: 'ADMIN_VERIFY_ORDER'; orderId: string; progress: number }
  | { type: 'ADMIN_RELEASE_ESCROW' }
  | { type: 'SET_BALANCE'; balance: number }
  | { type: 'UPDATE_ORDER_PROGRESS'; orderId: string; progress: number }
  | { type: 'ADMIN_SET_USER_STATUS'; userId: string; status: UserStatus }
  | { type: 'ADMIN_ADJUST_USER_BALANCE'; userId: string; amount: number }
  | { type: 'ADMIN_UPDATE_TASK'; task: FollowTask }
  | { type: 'ADMIN_REMOVE_TASK'; taskId: string }
  | { type: 'ADMIN_APPROVE_PAYOUT'; payoutId: string }
  | { type: 'ADMIN_REJECT_PAYOUT'; payoutId: string }
  | { type: 'ADMIN_LOG_ACTION'; entry: AuditEntry }
  | { type: 'ADMIN_UPDATE_SETTINGS'; settings: Partial<PlatformSettings> & { platforms?: Partial<Record<PlatformType, Partial<PerPlatformSettings>>> } }
  | { type: 'ADMIN_CREATE_ANNOUNCEMENT'; announcement: Announcement }
  | { type: 'ADMIN_UPDATE_ANNOUNCEMENT'; announcement: Announcement }
  | { type: 'ADMIN_REMOVE_ANNOUNCEMENT'; id: string }
  | { type: 'ADMIN_UPDATE_AD_CONFIG'; adConfig: Partial<AdConfig> }
  | { type: 'SET_AVATAR'; avatarUrl: string }
  | { type: 'ADMIN_ADD_AI_TASK'; task: AIDynamicTask }
  | { type: 'ADMIN_UPDATE_AI_TASK'; task: AIDynamicTask }
  | { type: 'ADMIN_REMOVE_AI_TASK'; taskId: string }
  | { type: 'ADMIN_ADD_QUIZ'; quiz: AIQuiz }
  | { type: 'ADMIN_UPDATE_QUIZ'; quiz: AIQuiz }
  | { type: 'ADMIN_REMOVE_QUIZ'; quizId: string }
  | { type: 'COMPLETE_AI_TASK'; taskId: string; reward: number }
  | { type: 'COMPLETE_QUIZ'; quizId: string; reward: number }
  | { type: 'UPDATE_TIKTOK_PROFILE'; accountId: string; profile: Partial<TikTokProfileData> }
  | { type: 'SET_VERIFIED_FOLLOW_RESULT'; taskId: string; verified: boolean; reward?: number }
  | { type: 'RECORD_VERIFICATION_ATTEMPT'; taskId: string; targetUsername: string; passed: boolean }
  | { type: 'SET_AUTH_USER'; user: Partial<MockUser> }
  | { type: 'INIT_STATE'; state: Partial<MockDataState> };

const PLATFORM_USERNAMES: Record<PlatformType, string[]> = {
  facebook: ['demo.user', 'john.doe', 'jane.smith'],
  tiktok: ['@demouser_official', '@john_doe', '@jane_smith'],
  telegram: ['demo_user', 'john_doe', 'jane_smith'],
  youtube: ['@DemoUserYT', '@JohnDoeYT', '@JaneSmithYT'],
};

const PLATFORM_DISPLAY: Record<PlatformType, string[]> = {
  facebook: ['Demo User', 'John Doe', 'Jane Smith'],
  tiktok: ['Demo User', 'John Doe', 'Jane Smith'],
  telegram: ['Demo User', 'John Doe', 'Jane Smith'],
  youtube: ['Demo User', 'John Doe', 'Jane Smith'],
};

export const MOCK_FACEBOOK_PAGES: FacebookPage[] = [
  { id: 'fb-page-1', name: 'Demo Business Hub', category: 'Business', followersCount: 1250, accessToken: 'mock-token-1', url: 'https://www.facebook.com/profile.php?id=61577601656447' },
  { id: 'fb-page-2', name: 'Tech Reviews Pro', category: 'Tech', followersCount: 3400, accessToken: 'mock-token-2', url: 'https://www.facebook.com/TechReviewsPro' },
  { id: 'fb-page-3', name: 'Local Deals & Offers', category: 'Shopping', followersCount: 890, accessToken: 'mock-token-3', url: 'https://www.facebook.com/LocalDealsOffers' },
];

const FOLLOW_TASKS: FollowTask[] = [
  { id: 'task-1', platform: 'tiktok', channelName: 'Fitness Beast', category: 'Fitness', reward: 25, followers: '12.5K', pageUrl: 'https://www.tiktok.com/@fitnessbeast' },
  { id: 'task-2', platform: 'facebook', channelName: 'Daily Memes', category: 'Entertainment', reward: 15, followers: '45K', pageUrl: 'https://www.facebook.com/DailyMemes' },
  { id: 'task-3', platform: 'telegram', channelName: 'Crypto News', category: 'Crypto', reward: 20, followers: '8.2K', pageUrl: 'https://t.me/cryptonews' },
  { id: 'task-4', platform: 'tiktok', channelName: 'Cooking Master', category: 'Food', reward: 25, followers: '6.8K', pageUrl: 'https://www.tiktok.com/@cookingmaster' },
  { id: 'task-5', platform: 'facebook', channelName: 'Tech Reviews', category: 'Tech', reward: 15, followers: '22K', pageUrl: 'https://www.facebook.com/TechReviews' },
  { id: 'task-6', platform: 'telegram', channelName: 'AI Updates', category: 'Tech', reward: 20, followers: '3.1K', pageUrl: 'https://t.me/aiupdates' },
  { id: 'task-7', platform: 'tiktok', channelName: 'Travel Vlogs', category: 'Travel', reward: 25, followers: '15K', pageUrl: 'https://www.tiktok.com/@travelvlogs' },
  { id: 'task-8', platform: 'facebook', channelName: 'Motivational Quotes', category: 'Lifestyle', reward: 15, followers: '67K', pageUrl: 'https://www.facebook.com/MotivationalQuotes' },
  { id: 'task-9', platform: 'telegram', channelName: 'Gaming Community', category: 'Gaming', reward: 20, followers: '5.4K', pageUrl: 'https://t.me/gamingcommunity' },
  { id: 'task-10', platform: 'tiktok', channelName: 'Pet Lovers', category: 'Animals', reward: 25, followers: '9.7K', pageUrl: 'https://www.tiktok.com/@petlovers' },
  { id: 'task-11', platform: 'facebook', channelName: 'Fashion Trends', category: 'Fashion', reward: 15, followers: '33K', pageUrl: 'https://www.facebook.com/FashionTrends' },
  { id: 'task-12', platform: 'tiktok', channelName: 'Music Discovery', category: 'Music', reward: 25, followers: '18K', pageUrl: 'https://www.tiktok.com/@musicdiscovery' },
  { id: 'task-13', platform: 'youtube', channelName: 'Tech Unboxed', category: 'Tech', reward: 25, followers: '2.1M', pageUrl: 'https://www.youtube.com/@TechUnboxed' },
];

const initialAccounts: ConnectedAccount[] = [
  { id: 'acct-1', platform: 'facebook', username: 'demo.user', displayName: 'Demo User', isConnected: true, followersCount: 845 },
  { id: 'acct-2', platform: 'tiktok', username: '@demouser_official', displayName: 'Demo User', isConnected: true, followersCount: 389, followingCount: 512, profileUrl: 'https://www.tiktok.com/@demouser_official' },
  { id: 'acct-3', platform: 'telegram', username: '@demo_user_tg', displayName: 'Demo User', isConnected: true, followersCount: 512 },
  { id: 'acct-4', platform: 'youtube', username: '@DemoUserYT', displayName: 'Demo User', isConnected: true, followersCount: 1240 },
];

const initialOrders: FollowerOrder[] = [
  { id: 'V2E-482916', platform: 'facebook', followers: 500, cost: 1800, status: 'in-progress', createdAt: '2026-05-18T10:30:00Z', estimatedDelivery: '2026-05-22T10:30:00Z', progress: 30 },
  { id: 'V2E-731024', platform: 'tiktok', followers: 100, cost: 500, status: 'completed', createdAt: '2026-05-15T14:00:00Z', estimatedDelivery: '2026-05-17T14:00:00Z', progress: 100 },
];

function mockReducer(state: MockDataState, action: MockAction): MockDataState {
  switch (action.type) {
    case 'INIT_STATE':
      return { ...state, ...action.state };
    case 'CONNECT_ACCOUNT': {
      const used = state.connectedAccounts.find(a => a.platform === action.platform);
      if (used) return state;
      const idx = state.connectedAccounts.length % 3;
      const newAccount: ConnectedAccount = {
        id: `acct-${Date.now()}`,
        platform: action.platform,
        username: PLATFORM_USERNAMES[action.platform][idx],
        displayName: PLATFORM_DISPLAY[action.platform][idx],
        isConnected: true,
        followersCount: Math.floor(Math.random() * 500) + 100,
      };
      return { ...state, connectedAccounts: [...state.connectedAccounts, newAccount] };
    }
    case 'CONNECT_FACEBOOK_PAGE': {
      const used = state.connectedAccounts.find(a => a.platform === 'facebook');
      if (used) return state;
      const newAccount: ConnectedAccount = {
        id: `acct-${Date.now()}`,
        platform: 'facebook',
        username: action.page.name.toLowerCase().replace(/\s+/g, '.'),
        displayName: action.page.name,
        isConnected: true,
        followersCount: action.page.followersCount,
        pageId: action.page.id,
        pageAccessToken: action.page.accessToken,
        pageUrl: action.page.url,
      };
      return { ...state, connectedAccounts: [...state.connectedAccounts, newAccount] };
    }
    case 'DISCONNECT_ACCOUNT':
      return {
        ...state,
        connectedAccounts: state.connectedAccounts.filter(a => a.id !== action.id),
      };
    case 'PLACE_ORDER':
      return {
        ...state,
        orders: [action.order, ...state.orders],
        balance: state.balance - action.order.cost,
      };
    case 'CANCEL_ORDER': {
      const order = state.orders.find(o => o.id === action.id);
      if (!order) return state;
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.id ? { ...o, status: 'cancelled' as const } : o),
        balance: state.balance + order.cost,
      };
    }
    case 'COMPLETE_FOLLOW_TASK': {
      if (state.completedFollowTasks.includes(action.taskId)) return state;
      const task = state.followTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const plat = task.platform;
      const platSet = state.settings.platforms[plat];
      const perPlatCompleted = state.completedFollowTasksPerPlatform[plat] || [];
      const bonusSteps = perPlatCompleted.length + 1 === platSet.bonusAtTasks;
      return {
        ...state,
        completedFollowTasks: [...state.completedFollowTasks, action.taskId],
        completedFollowTasksPerPlatform: {
          ...state.completedFollowTasksPerPlatform,
          [plat]: [...perPlatCompleted, action.taskId],
        },
        dailyFollowCount: state.dailyFollowCount + 1,
        balance: state.balance + platSet.rewardPerFollow + (bonusSteps ? platSet.bonusAmount : 0),
      };
    }
    case 'ADD_FOLLOW_TASKS':
      return {
        ...state,
        followTasks: [...action.tasks, ...state.followTasks],
      };
    case 'ADMIN_VERIFY_ORDER':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.orderId
            ? { ...o, progress: action.progress, status: action.progress >= 100 ? 'completed' : o.status }
            : o
        ),
      };
    case 'ADMIN_RELEASE_ESCROW':
      return state;
    case 'SET_BALANCE':
      return { ...state, balance: action.balance };
    case 'UPDATE_ORDER_PROGRESS':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.orderId ? { ...o, progress: action.progress } : o
        ),
      };
    case 'ADMIN_SET_USER_STATUS':
      return {
        ...state,
        mockUsers: state.mockUsers.map(u =>
          u.id === action.userId ? { ...u, status: action.status } : u
        ),
      };
    case 'ADMIN_ADJUST_USER_BALANCE':
      return {
        ...state,
        mockUsers: state.mockUsers.map(u =>
          u.id === action.userId ? { ...u, balance: Math.max(0, u.balance + action.amount) } : u
        ),
      };
    case 'ADMIN_UPDATE_TASK':
      return {
        ...state,
        followTasks: state.followTasks.map(t =>
          t.id === action.task.id ? action.task : t
        ),
      };
    case 'ADMIN_REMOVE_TASK':
      return {
        ...state,
        followTasks: state.followTasks.filter(t => t.id !== action.taskId),
        completedFollowTasks: state.completedFollowTasks.filter(id => id !== action.taskId),
      };
    case 'ADMIN_APPROVE_PAYOUT':
      return {
        ...state,
        payoutRequests: state.payoutRequests.map(p =>
          p.id === action.payoutId ? { ...p, status: 'approved' as PayoutStatus } : p
        ),
      };
    case 'ADMIN_REJECT_PAYOUT':
      return {
        ...state,
        payoutRequests: state.payoutRequests.map(p =>
          p.id === action.payoutId ? { ...p, status: 'rejected' as PayoutStatus } : p
        ),
      };
    case 'ADMIN_LOG_ACTION':
      return {
        ...state,
        auditLog: [action.entry, ...state.auditLog],
      };
    case 'ADMIN_UPDATE_SETTINGS': {
      const { platforms: platUpdate, ...rest } = action.settings;
      const mergedPlatforms = platUpdate
        ? (Object.keys(platUpdate) as PlatformType[]).reduce((acc, k) => {
            acc[k] = { ...state.settings.platforms[k], ...platUpdate[k] };
            return acc;
          }, { ...state.settings.platforms })
        : state.settings.platforms;
      return {
        ...state,
        settings: { ...state.settings, ...rest, platforms: mergedPlatforms },
      };
    }
    case 'ADMIN_CREATE_ANNOUNCEMENT':
      return {
        ...state,
        announcements: [action.announcement, ...state.announcements],
      };
    case 'ADMIN_UPDATE_ANNOUNCEMENT':
      return {
        ...state,
        announcements: state.announcements.map(a =>
          a.id === action.announcement.id ? action.announcement : a
        ),
      };
    case 'ADMIN_REMOVE_ANNOUNCEMENT':
      return {
        ...state,
        announcements: state.announcements.filter(a => a.id !== action.id),
      };
    case 'ADMIN_UPDATE_AD_CONFIG':
      return {
        ...state,
        adConfig: { ...state.adConfig, ...action.adConfig },
      };
    case 'SET_AVATAR':
      return {
        ...state,
        user: { ...state.user, avatarUrl: action.avatarUrl },
        mockUsers: state.mockUsers.map(u =>
          u.id === state.user.id ? { ...u, avatarUrl: action.avatarUrl } : u
        ),
      };
    case 'ADMIN_ADD_AI_TASK':
      return { ...state, aiTasks: [action.task, ...state.aiTasks] };
    case 'ADMIN_UPDATE_AI_TASK':
      return {
        ...state,
        aiTasks: state.aiTasks.map(t => t.id === action.task.id ? action.task : t),
      };
    case 'ADMIN_REMOVE_AI_TASK':
      return {
        ...state,
        aiTasks: state.aiTasks.filter(t => t.id !== action.taskId),
      };
    case 'ADMIN_ADD_QUIZ':
      return { ...state, aiQuizzes: [action.quiz, ...state.aiQuizzes] };
    case 'ADMIN_UPDATE_QUIZ':
      return {
        ...state,
        aiQuizzes: state.aiQuizzes.map(q => q.id === action.quiz.id ? action.quiz : q),
      };
    case 'ADMIN_REMOVE_QUIZ':
      return {
        ...state,
        aiQuizzes: state.aiQuizzes.filter(q => q.id !== action.quizId),
      };
    case 'COMPLETE_AI_TASK': {
      const today = new Date().toISOString().split('T')[0];
      const existing = state.dailyChallenges.find(d => d.date === today);
      const entry: DailyChallengeEntry = existing
        ? { ...existing, completedTaskIds: [...existing.completedTaskIds, action.taskId], totalEarned: existing.totalEarned + action.reward }
        : { date: today, completedTaskIds: [action.taskId], completedQuizIds: [], totalEarned: action.reward };
      return {
        ...state,
        balance: state.balance + action.reward,
        dailyChallenges: existing
          ? state.dailyChallenges.map(d => d.date === today ? entry : d)
          : [...state.dailyChallenges, entry],
      };
    }
    case 'COMPLETE_QUIZ': {
      const td = new Date().toISOString().split('T')[0];
      const ex = state.dailyChallenges.find(d => d.date === td);
      const en: DailyChallengeEntry = ex
        ? { ...ex, completedQuizIds: [...ex.completedQuizIds, action.quizId], totalEarned: ex.totalEarned + action.reward }
        : { date: td, completedTaskIds: [], completedQuizIds: [action.quizId], totalEarned: action.reward };
      return {
        ...state,
        balance: state.balance + action.reward,
        dailyChallenges: ex
          ? state.dailyChallenges.map(d => d.date === td ? en : d)
          : [...state.dailyChallenges, en],
      };
    }
    case 'CONNECT_TIKTOK': {
      const used = state.connectedAccounts.find(a => a.platform === 'tiktok');
      if (used) {
        return {
          ...state,
          connectedAccounts: state.connectedAccounts.map(a =>
            a.platform === 'tiktok'
              ? { ...a, username: action.profile.username, displayName: action.profile.displayName, followersCount: action.profile.followersCount, followingCount: action.profile.followingCount, profileUrl: action.profile.profileUrl, avatarUrl: action.profile.avatarUrl, isConnected: true }
              : a
          ),
        };
      }
      const newAccount: ConnectedAccount = {
        id: `acct-${Date.now()}`,
        platform: 'tiktok',
        username: action.profile.username,
        displayName: action.profile.displayName,
        isConnected: true,
        followersCount: action.profile.followersCount,
        followingCount: action.profile.followingCount,
        profileUrl: action.profile.profileUrl,
        avatarUrl: action.profile.avatarUrl,
      };
      return { ...state, connectedAccounts: [...state.connectedAccounts, newAccount] };
    }
    case 'UPDATE_TIKTOK_PROFILE': {
      return {
        ...state,
        connectedAccounts: state.connectedAccounts.map(a =>
          a.id === action.accountId
            ? { ...a, ...action.profile }
            : a
        ),
      };
    }
    case 'SET_VERIFIED_FOLLOW_RESULT': {
      const task = state.followTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      if (!action.verified) {
        return {
          ...state,
          verificationAttempts: [
            ...state.verificationAttempts,
            { id: `v-${Date.now()}`, taskId: action.taskId, targetUsername: task.channelName, passed: false, timestamp: new Date().toISOString() },
          ],
        };
      }
      if (state.completedFollowTasks.includes(action.taskId)) return state;
      const plat = task.platform;
      const platSet = state.settings.platforms[plat];
      const reward = action.reward ?? platSet.rewardPerFollow;
      const perPlatCompleted = state.completedFollowTasksPerPlatform[plat] || [];
      const bonusSteps = perPlatCompleted.length + 1 === platSet.bonusAtTasks;
      return {
        ...state,
        completedFollowTasks: [...state.completedFollowTasks, action.taskId],
        completedFollowTasksPerPlatform: {
          ...state.completedFollowTasksPerPlatform,
          [plat]: [...perPlatCompleted, action.taskId],
        },
        dailyFollowCount: state.dailyFollowCount + 1,
        balance: state.balance + reward + (bonusSteps ? platSet.bonusAmount : 0),
        verificationAttempts: [
          ...state.verificationAttempts,
          { id: `v-${Date.now()}`, taskId: action.taskId, targetUsername: task.channelName, passed: true, timestamp: new Date().toISOString() },
        ],
      };
    }
    case 'RECORD_VERIFICATION_ATTEMPT': {
      return {
        ...state,
        verificationAttempts: [
          ...state.verificationAttempts,
          { id: `v-${Date.now()}`, taskId: action.taskId, targetUsername: action.targetUsername, passed: action.passed, timestamp: new Date().toISOString() },
        ],
      };
    }
    case 'SET_AUTH_USER': {
      return {
        ...state,
        user: { ...state.user, ...action.user },
      };
    }
    default:
      return state;
  }
}

const MockDataContext = createContext<{
  state: MockDataState;
  dispatch: React.Dispatch<MockAction>;
  initialized: boolean;
} | null>(null);

const MOCK_USERS: MockUser[] = [
  { id: 'u-1', email: 'alice@demo.com', fullName: 'Alice Johnson', balance: 2340, isAdmin: false, status: 'active', createdAt: '2026-04-01T08:00:00Z', totalEarned: 4500, totalSpent: 2160 },
  { id: 'u-2', email: 'bob@demo.com', fullName: 'Bob Smith', balance: 890, isAdmin: false, status: 'active', createdAt: '2026-04-03T10:30:00Z', totalEarned: 2100, totalSpent: 1210 },
  { id: 'u-3', email: 'carol@demo.com', fullName: 'Carol Davis', balance: 150, isAdmin: false, status: 'active', createdAt: '2026-04-05T14:00:00Z', totalEarned: 1200, totalSpent: 1050 },
  { id: 'u-4', email: 'dan@demo.com', fullName: 'Dan Wilson', balance: 0, isAdmin: false, status: 'suspended', createdAt: '2026-04-02T09:00:00Z', totalEarned: 800, totalSpent: 800 },
  { id: 'u-5', email: 'eve@demo.com', fullName: 'Eve Martinez', balance: 4100, isAdmin: false, status: 'active', createdAt: '2026-03-28T16:00:00Z', totalEarned: 6200, totalSpent: 2100 },
];

const MOCK_PAYOUTS: PayoutRequest[] = [
  { id: 'pay-1', userId: 'u-5', userName: 'Eve Martinez', amount: 2000, method: 'PayPal', address: 'eve@paypal.me', status: 'pending', createdAt: '2026-05-19T14:30:00Z' },
  { id: 'pay-2', userId: 'u-1', userName: 'Alice Johnson', amount: 1000, method: 'PayPal', address: 'alice@paypal.me', status: 'pending', createdAt: '2026-05-20T09:15:00Z' },
  { id: 'pay-3', userId: 'u-2', userName: 'Bob Smith', amount: 500, method: 'Crypto', address: '0x1234...abcd', status: 'approved', createdAt: '2026-05-18T11:00:00Z' },
  { id: 'pay-4', userId: 'u-3', userName: 'Carol Davis', amount: 300, method: 'PayPal', address: 'carol@paypal.me', status: 'rejected', createdAt: '2026-05-17T16:45:00Z' },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to View2Earn!',
    subtitle: 'Start earning rewards today',
    content: 'Complete social tasks, watch ads, and earn PTS points. Redeem for PayPal, Crypto, and more! Get started with a 100 PTS welcome bonus.',
    cta: 'Start Earning',
    active: true,
    createdAt: '2026-05-15T08:00:00Z',
    color: '#2ECC71',
  },
  {
    id: 'ann-2',
    title: 'Double Points Weekend',
    subtitle: 'Earn 2x on all follow tasks',
    content: 'This weekend only! Earn double PTS on every follow task you complete. Invite friends to earn even more.',
    cta: 'View Tasks',
    active: true,
    createdAt: '2026-05-20T10:00:00Z',
    color: '#F59E0B',
  },
  {
    id: 'ann-3',
    title: 'YouTube Now Available',
    subtitle: 'Connect & earn on YouTube',
    content: 'You can now connect your YouTube channel and complete follow tasks. Earn bonus PTS for your first YouTube task.',
    cta: 'Connect Now',
    link: '/social-connect',
    active: true,
    createdAt: '2026-05-18T14:00:00Z',
    color: '#FF0000',
  },
  {
    id: 'ann-4',
    title: 'Referral Bonus Active',
    subtitle: '100 PTS per referral',
    content: 'Invite your friends to join View2Earn and earn 100 PTS for each referral. No limit - refer as many as you want!',
    cta: 'Refer Now',
    active: true,
    createdAt: '2026-05-16T09:00:00Z',
    color: '#8B5CF6',
  },
];

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'audit-1', action: 'order_verified', adminId: 'mock-user-1', details: 'Verified order V2E-482916 (300 followers)', timestamp: '2026-05-20T10:00:00Z' },
  { id: 'audit-2', action: 'escrow_released', adminId: 'mock-user-1', details: 'Released 500 PTS from escrow', timestamp: '2026-05-19T15:30:00Z' },
  { id: 'audit-3', action: 'user_suspended', adminId: 'mock-user-1', details: 'Suspended user Dan Wilson (u-4)', timestamp: '2026-05-18T09:00:00Z' },
];

const PER_PLATFORM_DEFAULTS: PerPlatformSettings = {
  rewardPerFollow: 25,
  dailyFollowLimit: 10,
  bonusAtTasks: 10,
  bonusAmount: 50,
};

const DEFAULT_SETTINGS: PlatformSettings = {
  platforms: {
    facebook: { ...PER_PLATFORM_DEFAULTS },
    tiktok: { ...PER_PLATFORM_DEFAULTS },
    telegram: { ...PER_PLATFORM_DEFAULTS },
    youtube: { ...PER_PLATFORM_DEFAULTS },
  },
  minWithdrawal: 500,
  exchangeRate: 1000,
  newUserBonus: 100,
  watchReward: 15,
};

const DEFAULT_AD_CONFIG: AdConfig = {
  admob: {
    appOpenId: '',
    interstitialId: '',
    bannerId: '',
    rewardedId: '',
  },
  unityAds: {
    gameId: '',
  },
  audienceNetwork: {
    appId: '',
    interstitialPlacementId: '',
    bannerPlacementId: '',
    rewardedPlacementId: '',
  },
};

const SEED_AI_TASKS: AIDynamicTask[] = [
  { id: 'ai-task-1', title: 'Watch Tech Review', description: 'Watch a 2-minute tech review video and share your thoughts', type: 'daily', reward: 30, instructions: 'Watch the video and write a brief comment', linkUrl: 'https://youtube.com/watch?v=demo', icon: 'videocam', createdAt: '2026-05-20T08:00:00Z', active: true },
  { id: 'ai-task-2', title: 'Rate Your Experience', description: 'Rate your experience with the app today', type: 'daily', reward: 15, icon: 'star', createdAt: '2026-05-20T08:00:00Z', active: true },
  { id: 'ai-task-3', title: 'Share on Social Media', description: 'Share a referral link on your social media', type: 'daily', reward: 50, instructions: 'Post the referral link on any social platform', linkUrl: 'https://view2earn.com/refer', icon: 'share-social', createdAt: '2026-05-20T08:00:00Z', active: true },
  { id: 'ai-task-4', title: 'Weekly Survey', description: 'Complete our weekly survey about new features', type: 'weekly', reward: 100, instructions: 'Answer 5 questions about app features', icon: 'clipboard', createdAt: '2026-05-20T08:00:00Z', active: true },
  { id: 'ai-task-5', title: 'Invite a Friend', description: 'Invite a friend to join View2Earn', type: 'challenge', reward: 200, instructions: 'Send your referral link to a friend and ask them to sign up', linkUrl: 'https://view2earn.com/refer', icon: 'people', createdAt: '2026-05-20T08:00:00Z', active: true },
];

const SEED_QUIZZES: AIQuiz[] = [
  {
    id: 'quiz-1',
    title: 'Social Media Knowledge',
    description: 'Test your knowledge about social media platforms',
    questions: [
      { id: 'q-1', text: 'Which platform has the most active users?', options: ['Facebook', 'Twitter', 'LinkedIn', 'Pinterest'], correctIndex: 0 },
      { id: 'q-2', text: 'What does "impression" mean in social media?', options: ['A paid ad', 'Times content is displayed', 'Number of followers', 'A direct message'], correctIndex: 1 },
      { id: 'q-3', text: 'Which platform is best for B2B marketing?', options: ['Instagram', 'TikTok', 'LinkedIn', 'Snapchat'], correctIndex: 2 },
    ],
    reward: 75,
    passingScore: 2,
    createdAt: '2026-05-20T08:00:00Z',
    active: true,
  },
  {
    id: 'quiz-2',
    title: 'Digital Trends 2026',
    description: 'How well do you know the latest digital trends?',
    questions: [
      { id: 'q-4', text: 'What is the predicted number of smartphone users by 2027?', options: ['5 billion', '6.8 billion', '7.5 billion', '4.2 billion'], correctIndex: 1 },
      { id: 'q-5', text: 'Which technology is driving the most change in digital marketing?', options: ['Blockchain', 'AI/Machine Learning', 'Quantum Computing', 'VR/AR'], correctIndex: 1 },
    ],
    reward: 100,
    passingScore: 1,
    createdAt: '2026-05-20T08:00:00Z',
    active: true,
  },
];

const today = new Date().toISOString().split('T')[0];

const INITIAL_COMPLETED_PER_PLATFORM: Record<PlatformType, string[]> = {
  facebook: ['task-5'],
  tiktok: ['task-1'],
  telegram: [],
  youtube: [],
};

const supabaseConfigured = () => {
  return !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_KEY);
};

const initialState: MockDataState = {
  user: {
    id: 'mock-user-1',
    email: 'demo@view2earn.com',
    fullName: 'Demo User',
    balance: 1250,
    isAdmin: false,
  },
  connectedAccounts: initialAccounts,
  orders: initialOrders,
  followTasks: FOLLOW_TASKS,
  completedFollowTasks: ['task-1', 'task-5'],
  completedFollowTasksPerPlatform: INITIAL_COMPLETED_PER_PLATFORM,
  dailyFollowCount: 2,
  balance: 1250,
  mockUsers: MOCK_USERS,
  payoutRequests: MOCK_PAYOUTS,
  auditLog: MOCK_AUDIT,
  settings: DEFAULT_SETTINGS,
  announcements: SEED_ANNOUNCEMENTS,
  adConfig: DEFAULT_AD_CONFIG,
  aiTasks: SEED_AI_TASKS,
  aiQuizzes: SEED_QUIZZES,
  dailyChallenges: [],
  verificationAttempts: [],
};

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(mockReducer, initialState);
  const [initialized, setInitialized] = useState(false);
  const loadedRef = useRef(false);
  const { user: authUser, profile } = useAuth();
  const initRef = useRef(false);

  useEffect(() => {
    if (authUser && !initRef.current && supabaseConfigured()) {
      initRef.current = true;
      (async () => {
        try {
          const [dbProfile, dbAccounts, dbOrders, dbCompletedTasks, dbTransactions, dbAnnouncements, dbPayouts, dbChallenges] = await Promise.all([
            profileService.getById(authUser.id).catch(() => null),
            connectedAccountService.getByUserId(authUser.id).catch(() => []),
            orderService.getByUserId(authUser.id).catch(() => []),
            followTaskService.getCompletedByUser(authUser.id).catch(() => []),
            transactionService.getByUserId(authUser.id).catch(() => []),
            announcementService.getActive().catch(() => []),
            payoutService.getByUserId(authUser.id).catch(() => []),
            challengeService.getToday(authUser.id).catch(() => null),
          ]);

          const dbTasks = await followTaskService.getActive().catch(() => null);
          if (dbTasks) {
            const supabaseFollowTasks: FollowTask[] = dbTasks.map(t => ({
              id: t.id,
              platform: t.platform as PlatformType,
              channelName: t.channel_name,
              category: t.category ?? '',
              reward: Math.round((t.reward ?? 0.05) * 1000),
              followers: t.followers ?? '',
              pageUrl: t.page_url ?? undefined,
            }));
            if (supabaseFollowTasks.length > 0) {
              rawDispatch({ type: 'INIT_STATE', state: { followTasks: supabaseFollowTasks } });
            }
          }

          const supabaseAccounts: ConnectedAccount[] = dbAccounts.map(a => ({
            id: a.id,
            platform: a.platform as PlatformType,
            username: a.username,
            displayName: a.display_name ?? a.username,
            isConnected: a.is_connected,
            followersCount: a.followers_count,
            followingCount: a.following_count,
            pageId: a.page_id ?? undefined,
            pageAccessToken: a.page_access_token ?? undefined,
            pageUrl: a.page_url ?? undefined,
            profileUrl: a.profile_url ?? undefined,
            avatarUrl: a.avatar_url ?? undefined,
          }));

          const supabaseOrders: FollowerOrder[] = dbOrders.map(o => ({
            id: o.id,
            platform: o.platform as PlatformType,
            followers: o.followers,
            cost: Math.round(o.cost * 1000),
            status: o.status as OrderStatus,
            createdAt: o.created_at,
            estimatedDelivery: o.estimated_delivery ?? '',
            progress: o.progress,
            pageId: o.page_id ?? undefined,
            pageUrl: o.page_url ?? undefined,
          }));

          const completedIds = dbCompletedTasks.map(c => c.task_id);
          const totalEarned = dbTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + Math.round(t.amount * 1000), 0);

          rawDispatch({
            type: 'INIT_STATE',
            state: {
              user: {
                id: authUser.id,
                email: authUser.email ?? '',
                fullName: profile?.full_name ?? authUser.user_metadata?.full_name ?? '',
                balance: Math.round((dbProfile?.balance ?? 0) * 1000),
                isAdmin: dbProfile?.is_admin ?? false,
                avatarUrl: dbProfile?.avatar_url ?? undefined,
                status: (dbProfile?.status as UserStatus) ?? 'active',
                createdAt: dbProfile?.created_at,
                totalEarned,
              },
              balance: Math.round((dbProfile?.balance ?? 0) * 1000),
              connectedAccounts: supabaseAccounts,
              orders: supabaseOrders,
              completedFollowTasks: completedIds,
              announcements: dbAnnouncements.length > 0
                ? dbAnnouncements.map(a => ({
                    id: a.id,
                    title: a.title,
                    subtitle: a.subtitle ?? undefined,
                    imageUrl: a.image_url ?? undefined,
                    content: a.content ?? '',
                    link: a.link ?? undefined,
                    cta: a.cta ?? undefined,
                    active: a.active,
                    createdAt: a.created_at,
                    color: a.color ?? undefined,
                  }))
                : SEED_ANNOUNCEMENTS,
            },
          });

          if (dbChallenges) {
            rawDispatch({
              type: 'INIT_STATE',
              state: {
                dailyChallenges: [{
                  date: dbChallenges.date,
                  completedTaskIds: dbChallenges.completed_task_ids ?? [],
                  completedQuizIds: dbChallenges.completed_quiz_ids ?? [],
                  totalEarned: Math.round((dbChallenges.total_earned ?? 0) * 1000),
                }],
              },
            });
          }

          if (dbPayouts.length > 0) {
            rawDispatch({
              type: 'INIT_STATE',
              state: {
                payoutRequests: dbPayouts.map(p => ({
                  id: p.id,
                  userId: p.user_id,
                  userName: p.user_name ?? '',
                  amount: Math.round(p.amount * 1000),
                  method: p.method,
                  address: p.address,
                  status: p.status as PayoutStatus,
                  createdAt: p.created_at,
                })),
              },
            });
          }
        } catch (err) {
          console.warn('[MockData] Supabase sync failed, using mock data:', getErrorMessage(err));
        }
      })().finally(() => {
        setInitialized(true);
      });
    } else if (!supabaseConfigured()) {
      setInitialized(true);
    } else {
      initRef.current = true;
      setInitialized(true);
    }
  }, [authUser?.id, profile?.full_name, profile?.avatar_url]);

  useEffect(() => {
    if (authUser) {
      rawDispatch({
        type: 'SET_AUTH_USER',
        user: {
          id: authUser.id,
          email: authUser.email ?? '',
          fullName: profile?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'User',
          avatarUrl: profile?.avatar_url,
        },
      });
    }
  }, [authUser?.id, profile?.full_name, profile?.avatar_url]);

  useEffect(() => {
    loadAdConfig().then(config => {
      if (config) {
        rawDispatch({ type: 'ADMIN_UPDATE_AD_CONFIG', adConfig: config });
      }
      loadedRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    saveAdConfig(state.adConfig);
  }, [state.adConfig]);

  return (
    <MockDataContext.Provider value={{ state, dispatch: rawDispatch, initialized }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider');
  return ctx;
}
