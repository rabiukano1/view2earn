import { Database } from './generated';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  kyc_status: 'pending' | 'verified' | 'rejected';
  country: string | null;
  balance: number;
  streak: number;
  tasks_done: number;
  is_admin: boolean;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
  updated_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: 'facebook' | 'tiktok' | 'telegram' | 'youtube';
  username: string;
  display_name: string | null;
  followers_count: number;
  following_count: number;
  avatar_url: string | null;
  profile_url: string | null;
  page_id: string | null;
  page_access_token: string | null;
  page_url: string | null;
  is_connected: boolean;
  created_at: string;
}

export interface FollowTask {
  id: string;
  platform: 'facebook' | 'tiktok' | 'telegram' | 'youtube';
  channel_name: string;
  category: string | null;
  reward: number;
  followers: string | null;
  page_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompletedFollowTask {
  id: string;
  user_id: string;
  task_id: string;
  platform: string;
  reward: number;
  bonus_awarded: boolean;
  completed_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  platform: 'facebook' | 'tiktok' | 'telegram' | 'youtube';
  followers: number;
  cost: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  progress: number;
  page_id: string | null;
  page_url: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  user_name: string | null;
  amount: number;
  method: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  cta: string | null;
  link: string | null;
  color: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: number;
  min_withdrawal: number;
  exchange_rate: number;
  new_user_bonus: number;
  watch_reward: number;
  platforms: Record<string, PerPlatformSettings>;
  updated_at: string;
}

export interface PerPlatformSettings {
  rewardPerFollow: number;
  dailyFollowLimit: number;
  bonusAtTasks: number;
  bonusAmount: number;
}

export interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  details: string | null;
  created_at: string;
}

export interface AITask {
  id: string;
  title: string;
  description: string | null;
  type: 'daily' | 'weekly' | 'challenge';
  reward: number;
  instructions: string | null;
  link_url: string | null;
  icon: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  passing_score: number;
  questions: QuizQuestion[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface UserChallengeProgress {
  id: string;
  user_id: string;
  date: string;
  completed_task_ids: string[];
  completed_quiz_ids: string[];
  total_earned: number;
  ad_watches_today: number;
  follow_count_today: number;
  created_at: string;
  updated_at: string;
}

export interface VerificationAttempt {
  id: string;
  user_id: string;
  task_id: string | null;
  target_username: string | null;
  passed: boolean;
  created_at: string;
}

export type PlatformType = 'facebook' | 'tiktok' | 'telegram' | 'youtube';
export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type PayoutStatus = 'pending' | 'approved' | 'rejected';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type AITaskType = 'daily' | 'weekly' | 'challenge';
