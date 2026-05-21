import { createContext, useContext, useReducer, ReactNode } from 'react';

export type PlatformType = 'facebook' | 'tiktok' | 'telegram' | 'youtube';
export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

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
}

interface MockDataState {
  user: MockUser;
  connectedAccounts: ConnectedAccount[];
  orders: FollowerOrder[];
  followTasks: FollowTask[];
  completedFollowTasks: string[];
  dailyFollowCount: number;
  balance: number;
}

type MockAction =
  | { type: 'CONNECT_ACCOUNT'; platform: PlatformType }
  | { type: 'CONNECT_FACEBOOK_PAGE'; page: FacebookPage }
  | { type: 'DISCONNECT_ACCOUNT'; id: string }
  | { type: 'PLACE_ORDER'; order: FollowerOrder }
  | { type: 'CANCEL_ORDER'; id: string }
  | { type: 'COMPLETE_FOLLOW_TASK'; taskId: string }
  | { type: 'ADD_FOLLOW_TASKS'; tasks: FollowTask[] }
  | { type: 'ADMIN_VERIFY_ORDER'; orderId: string; progress: number }
  | { type: 'ADMIN_RELEASE_ESCROW' }
  | { type: 'SET_BALANCE'; balance: number }
  | { type: 'UPDATE_ORDER_PROGRESS'; orderId: string; progress: number };

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
  { id: 'acct-2', platform: 'tiktok', username: '@demouser_official', displayName: 'Demo User', isConnected: true, followersCount: 389 },
  { id: 'acct-3', platform: 'telegram', username: '@demo_user_tg', displayName: 'Demo User', isConnected: true, followersCount: 512 },
  { id: 'acct-4', platform: 'youtube', username: '@DemoUserYT', displayName: 'Demo User', isConnected: true, followersCount: 1240 },
];

const initialOrders: FollowerOrder[] = [
  { id: 'V2E-482916', platform: 'facebook', followers: 500, cost: 1800, status: 'in-progress', createdAt: '2026-05-18T10:30:00Z', estimatedDelivery: '2026-05-22T10:30:00Z', progress: 30 },
  { id: 'V2E-731024', platform: 'tiktok', followers: 100, cost: 500, status: 'completed', createdAt: '2026-05-15T14:00:00Z', estimatedDelivery: '2026-05-17T14:00:00Z', progress: 100 },
];

function mockReducer(state: MockDataState, action: MockAction): MockDataState {
  switch (action.type) {
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
      const bonusSteps = state.completedFollowTasks.length + 1 === 10;
      return {
        ...state,
        completedFollowTasks: [...state.completedFollowTasks, action.taskId],
        dailyFollowCount: state.dailyFollowCount + 1,
        balance: state.balance + task.reward + (bonusSteps ? 50 : 0),
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
    default:
      return state;
  }
}

const MockDataContext = createContext<{
  state: MockDataState;
  dispatch: React.Dispatch<MockAction>;
} | null>(null);

const today = new Date().toISOString().split('T')[0];

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
  dailyFollowCount: 2,
  balance: 1250,
};

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mockReducer, initialState);

  return (
    <MockDataContext.Provider value={{ state, dispatch }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider');
  return ctx;
}
