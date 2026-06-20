-- ============================================
-- View2Earn Full Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  country TEXT,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  streak INTEGER NOT NULL DEFAULT 0,
  tasks_done INTEGER NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns if they don't exist (for re-runs against existing tables)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tasks_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Connected Accounts
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'telegram', 'youtube')),
  username TEXT NOT NULL,
  display_name TEXT,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT,
  profile_url TEXT,
  page_id TEXT,
  page_access_token TEXT,
  page_url TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- 3. Follow Tasks
CREATE TABLE IF NOT EXISTS public.follow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'telegram', 'youtube')),
  channel_name TEXT NOT NULL,
  category TEXT,
  reward NUMERIC NOT NULL DEFAULT 0 CHECK (reward >= 0),
  followers TEXT,
  page_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Completed Follow Tasks
CREATE TABLE IF NOT EXISTS public.completed_follow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.follow_tasks(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  reward NUMERIC NOT NULL DEFAULT 0,
  bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'telegram', 'youtube')),
  followers INTEGER NOT NULL CHECK (followers > 0),
  cost NUMERIC NOT NULL CHECK (cost >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  page_id TEXT,
  page_url TEXT,
  estimated_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Payout Requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT,
  cta TEXT,
  link TEXT,
  color TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. App Settings (singleton row)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  min_withdrawal NUMERIC NOT NULL DEFAULT 10,
  exchange_rate NUMERIC NOT NULL DEFAULT 1,
  new_user_bonus NUMERIC NOT NULL DEFAULT 5,
  watch_reward NUMERIC NOT NULL DEFAULT 0.01,
  platforms JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. AI Tasks
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'challenge')),
  reward NUMERIC NOT NULL DEFAULT 0 CHECK (reward >= 0),
  instructions TEXT,
  link_url TEXT,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  reward NUMERIC NOT NULL DEFAULT 0 CHECK (reward >= 0),
  passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  questions JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. User Challenge Progress
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_task_ids TEXT[] NOT NULL DEFAULT '{}',
  completed_quiz_ids TEXT[] NOT NULL DEFAULT '{}',
  total_earned NUMERIC NOT NULL DEFAULT 0,
  ad_watches_today INTEGER NOT NULL DEFAULT 0,
  follow_count_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 13. Verification Attempts
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID,
  target_username TEXT,
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON public.connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_tasks_user_id ON public.completed_follow_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_tasks_task_id ON public.completed_follow_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON public.payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_tasks_active ON public.follow_tasks(active);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(active);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_active ON public.ai_tasks(active);
CREATE INDEX IF NOT EXISTS idx_quizzes_active ON public.quizzes(active);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_date ON public.user_challenge_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user ON public.verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin, balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email = 'admin@view2earn.com',
    CASE WHEN NEW.email = 'admin@view2earn.com' THEN 10000 ELSE 5 END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_follow_tasks_updated_at
  BEFORE UPDATE ON public.follow_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_ai_tasks_updated_at
  BEFORE UPDATE ON public.ai_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_challenge_progress_updated_at
  BEFORE UPDATE ON public.user_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_follow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer helper to check admin status (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true);
$$;

-- Profiles: users can read/update own profile, admins can read all
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Connected accounts: users can CRUD own
CREATE POLICY accounts_select_own ON public.connected_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY accounts_insert_own ON public.connected_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY accounts_update_own ON public.connected_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY accounts_delete_own ON public.connected_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Follow tasks: anyone can read active
CREATE POLICY tasks_select_active ON public.follow_tasks
  FOR SELECT USING (active = true OR public.is_admin());

-- Completed tasks: own only
CREATE POLICY completed_tasks_select_own ON public.completed_follow_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY completed_tasks_insert_own ON public.completed_follow_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Orders: own only
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payout requests: own only
CREATE POLICY payouts_select_own ON public.payout_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY payouts_insert_own ON public.payout_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions: own only
CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Announcements: anyone can read active
CREATE POLICY announcements_select_active ON public.announcements
  FOR SELECT USING (active = true OR public.is_admin());

-- App settings: anyone can read
CREATE POLICY app_settings_select ON public.app_settings
  FOR SELECT USING (true);

-- AI tasks: anyone can read active
CREATE POLICY ai_tasks_select_active ON public.ai_tasks
  FOR SELECT USING (active = true OR public.is_admin());

-- Quizzes: anyone can read active
CREATE POLICY quizzes_select_active ON public.quizzes
  FOR SELECT USING (active = true OR public.is_admin());

-- Challenge progress: own only
CREATE POLICY challenge_select_own ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY challenge_insert_own ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY challenge_update_own ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Verification attempts: own only
CREATE POLICY verification_select_own ON public.verification_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY verification_insert_own ON public.verification_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit logs: admins only
CREATE POLICY audit_admin_only ON public.audit_logs
  FOR ALL USING (public.is_admin());

-- ============================================
-- Insert default app_settings
-- ============================================
INSERT INTO public.app_settings (id, min_withdrawal, exchange_rate, new_user_bonus, watch_reward, platforms)
VALUES (1, 10, 1, 5, 0.01, '{
  "facebook": {"rewardPerFollow": 0.05, "dailyFollowLimit": 20, "bonusAtTasks": 10, "bonusAmount": 0.50},
  "tiktok": {"rewardPerFollow": 0.05, "dailyFollowLimit": 20, "bonusAtTasks": 10, "bonusAmount": 0.50},
  "telegram": {"rewardPerFollow": 0.03, "dailyFollowLimit": 30, "bonusAtTasks": 15, "bonusAmount": 0.30},
  "youtube": {"rewardPerFollow": 0.05, "dailyFollowLimit": 20, "bonusAtTasks": 10, "bonusAmount": 0.50}
}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Insert sample follow tasks
-- ============================================
INSERT INTO public.follow_tasks (platform, channel_name, category, reward, followers, page_url) VALUES
  ('telegram', 'Crypto News Daily', 'crypto', 0.05, '12500', 'https://t.me/cryptonews'),
  ('telegram', 'DeFi Alerts', 'crypto', 0.05, '8900', 'https://t.me/defialerts'),
  ('telegram', 'NFT Community', 'nft', 0.05, '15200', 'https://t.me/nftcommunity'),
  ('tiktok', '@techreview', 'tech', 0.08, '45000', 'https://tiktok.com/@techreview'),
  ('tiktok', '@cryptotips', 'crypto', 0.08, '32000', 'https://tiktok.com/@cryptotips'),
  ('facebook', 'Web3 Developers', 'tech', 0.05, '28000', 'https://facebook.com/web3devs'),
  ('facebook', 'AI Research Lab', 'tech', 0.05, '22000', 'https://facebook.com/airesearch'),
  ('youtube', '@CodeWithMe', 'tech', 0.10, '120000', 'https://youtube.com/@CodeWithMe'),
  ('youtube', '@CryptoExplained', 'crypto', 0.10, '95000', 'https://youtube.com/@CryptoExplained'),
  ('telegram', 'Airdrop Hunter', 'crypto', 0.05, '18000', 'https://t.me/airdrophunter')
  ON CONFLICT DO NOTHING;

-- ============================================
-- Insert sample AI tasks
-- ============================================
INSERT INTO public.ai_tasks (title, description, type, reward, instructions, link_url, icon) VALUES
  ('Watch a Tech Review', 'Watch a 2-minute tech review video and learn about the latest gadgets', 'daily', 0.05, 'Watch the video and come back to claim your reward.', 'https://example.com/tech-review', 'eye'),
  ('Complete a Quiz', 'Test your knowledge of blockchain technology', 'daily', 0.10, 'Answer 5 questions about blockchain basics.', null, 'brain'),
  ('Watch an Educational Video', 'Learn about DeFi in this 3-minute explainer', 'daily', 0.05, 'Watch the full video to earn rewards.', 'https://example.com/defi', 'book-open'),
  ('Weekly Challenge', 'Complete 10 follow tasks this week', 'weekly', 1.00, 'Complete 10 follow tasks across any platform before the week ends.', null, 'award'),
  ('Telegram Master', 'Complete 5 Telegram follow tasks', 'challenge', 0.75, 'Complete 5 Telegram follow tasks to earn a bonus reward.', null, 'message-circle')
ON CONFLICT DO NOTHING;

-- ============================================
-- Insert sample quizzes
-- ============================================
INSERT INTO public.quizzes (title, description, reward, passing_score, questions, active) VALUES
  (
    'Blockchain Basics',
    'Test your understanding of blockchain fundamentals',
    0.25,
    70,
    '[
      {"id": "q1", "text": "What is a blockchain?", "options": ["A type of database", "A social network", "A programming language", "A web browser"], "correctIndex": 0},
      {"id": "q2", "text": "What is a smart contract?", "options": ["A legal document", "Self-executing code on blockchain", "A type of cryptocurrency", "A hardware wallet"], "correctIndex": 1},
      {"id": "q3", "text": "What is DeFi?", "options": ["Decentralized Finance", "Digital Finance", "Direct Finance", "Distributed File System"], "correctIndex": 0},
      {"id": "q4", "text": "What is a dApp?", "options": ["Desktop Application", "Decentralized Application", "Database App", "Digital App"], "correctIndex": 1},
      {"id": "q5", "text": "What consensus mechanism does Bitcoin use?", "options": ["Proof of Stake", "Proof of Work", "Delegated Proof of Stake", "Proof of Authority"], "correctIndex": 1}
    ]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- Insert sample announcements
-- ============================================
INSERT INTO public.announcements (title, subtitle, content, cta, link, color, active) VALUES
  ('Welcome to View2Earn!', 'Start earning today', 'Complete tasks, watch content, and earn rewards. Connect your social accounts to get started.', 'Get Started', null, '#6366f1', true),
  ('New Follow Tasks Available', 'Earn more rewards', 'New follow tasks have been added across Telegram, TikTok, and more platforms.', 'View Tasks', null, '#f59e0b', true)
ON CONFLICT DO NOTHING;
