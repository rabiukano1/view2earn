-- ============================================================
-- VIEW2EARN — Full Supabase Schema
-- Run this once in Supabase SQL Editor
-- ============================================================

-- 1. USER PROFILES (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  avatar_url    TEXT,
  kyc_status    TEXT DEFAULT 'pending'
                     CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  country       TEXT,
  balance       BIGINT NOT NULL DEFAULT 100,
  streak        INT NOT NULL DEFAULT 0,
  tasks_done    INT NOT NULL DEFAULT 0,
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  status        TEXT DEFAULT 'active'
                     CHECK (status IN ('active', 'suspended', 'banned')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 2. CONNECTED ACCOUNTS
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'telegram', 'youtube')),
  username        TEXT NOT NULL,
  display_name    TEXT,
  followers_count BIGINT DEFAULT 0,
  following_count BIGINT DEFAULT 0,
  avatar_url      TEXT,
  profile_url     TEXT,
  page_id         TEXT,
  page_access_token TEXT,
  page_url        TEXT,
  is_connected    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own accounts"
  ON public.connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all accounts"
  ON public.connected_accounts FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 3. FOLLOW TASKS (admin created, users complete them)
CREATE TABLE IF NOT EXISTS public.follow_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'telegram', 'youtube')),
  channel_name  TEXT NOT NULL,
  category      TEXT,
  reward        BIGINT NOT NULL DEFAULT 25,
  followers     TEXT,
  page_url      TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tasks"
  ON public.follow_tasks FOR SELECT
  USING (active = true OR auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can insert tasks"
  ON public.follow_tasks FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can update tasks"
  ON public.follow_tasks FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can delete tasks"
  ON public.follow_tasks FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 4. COMPLETED FOLLOW TASKS (track which user did which task)
CREATE TABLE IF NOT EXISTS public.completed_follow_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES public.follow_tasks(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  reward      BIGINT NOT NULL,
  bonus_awarded BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.completed_follow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own completions"
  ON public.completed_follow_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.completed_follow_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all completions"
  ON public.completed_follow_tasks FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 5. ORDERS (buy followers)
CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'telegram', 'youtube')),
  followers           BIGINT NOT NULL,
  cost                BIGINT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  progress            INT NOT NULL DEFAULT 0,
  page_id             TEXT,
  page_url            TEXT,
  estimated_delivery  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all orders"
  ON public.orders FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 6. PAYOUT REQUESTS
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name   TEXT,
  amount      BIGINT NOT NULL,
  method      TEXT NOT NULL,
  address     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payouts"
  ON public.payout_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payouts"
  ON public.payout_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all payouts"
  ON public.payout_requests FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can update payouts"
  ON public.payout_requests FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 7. TRANSACTIONS (balance history)
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount      BIGINT NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 8. ANNOUNCEMENTS / ADS (admin managed)
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  content     TEXT,
  cta         TEXT,
  link        TEXT,
  color       TEXT,
  image_url   TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active announcements"
  ON public.announcements FOR SELECT
  USING (active = true OR auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 9. APP SETTINGS (single row, admin managed)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id                INT PRIMARY KEY DEFAULT 1,
  min_withdrawal    BIGINT NOT NULL DEFAULT 500,
  exchange_rate     BIGINT NOT NULL DEFAULT 1000,
  new_user_bonus    BIGINT NOT NULL DEFAULT 100,
  watch_reward      BIGINT NOT NULL DEFAULT 15,
  platforms         JSONB NOT NULL DEFAULT '{
    "facebook": {"rewardPerFollow": 25, "dailyFollowLimit": 10, "bonusAtTasks": 10, "bonusAmount": 50},
    "tiktok":   {"rewardPerFollow": 25, "dailyFollowLimit": 10, "bonusAtTasks": 10, "bonusAmount": 50},
    "telegram": {"rewardPerFollow": 25, "dailyFollowLimit": 10, "bonusAtTasks": 10, "bonusAmount": 50},
    "youtube":  {"rewardPerFollow": 25, "dailyFollowLimit": 10, "bonusAtTasks": 10, "bonusAmount": 50}
  }'::jsonb,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT only_one_row CHECK (id = 1)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update settings"
  ON public.app_settings FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 10. AUDIT LOG (admin actions)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  details     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON public.audit_log FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 11. DAILY CHALLENGES / AI TASKS
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'challenge')),
  reward        BIGINT NOT NULL,
  instructions  TEXT,
  link_url      TEXT,
  icon          TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active AI tasks"
  ON public.ai_tasks FOR SELECT
  USING (active = true OR auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can insert AI tasks"
  ON public.ai_tasks FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can update AI tasks"
  ON public.ai_tasks FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can delete AI tasks"
  ON public.ai_tasks FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 12. QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  reward        BIGINT NOT NULL,
  passing_score INT NOT NULL DEFAULT 1,
  questions     JSONB NOT NULL DEFAULT '[]'::jsonb,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active quizzes"
  ON public.quizzes FOR SELECT
  USING (active = true OR auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can insert quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can update quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

CREATE POLICY "Admins can delete quizzes"
  ON public.quizzes FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE is_admin = true
  ));

-- 13. USER CHALLENGE PROGRESS (daily tracking)
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_task_ids    TEXT[] DEFAULT '{}',
  completed_quiz_ids    TEXT[] DEFAULT '{}',
  total_earned          BIGINT NOT NULL DEFAULT 0,
  ad_watches_today      INT NOT NULL DEFAULT 0,
  follow_count_today    INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, date)
);

ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.user_challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_challenge_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- 14. VERIFICATION ATTEMPTS (follow verification)
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES public.follow_tasks(id) ON DELETE SET NULL,
  target_username TEXT,
  passed          BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attempts"
  ON public.verification_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.verification_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP (TRIGGER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, balance, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      NEW.email
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    100,
    COALESCE(NEW.email = 'admin@view2earn.com', false)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SYNC PROFILE ON USER UPDATE (TRIGGER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    email      = COALESCE(NEW.email, email),
    full_name  = COALESCE(
                   NEW.raw_user_meta_data ->> 'full_name',
                   NEW.raw_user_meta_data ->> 'name',
                   full_name
                 ),
    avatar_url = COALESCE(
                   NEW.raw_user_meta_data ->> 'avatar_url',
                   avatar_url
                 ),
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================================
-- INSERT DEFAULT SETTINGS ROW
-- ============================================================
INSERT INTO public.app_settings (id, min_withdrawal, exchange_rate, new_user_bonus, watch_reward)
VALUES (1, 500, 1000, 100, 15)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED SAMPLE FOLLOW TASKS
-- ============================================================
INSERT INTO public.follow_tasks (platform, channel_name, category, reward, followers) VALUES
  ('tiktok',   'TechTok',     'Tech',     25, '12.4K'),
  ('youtube',  'DevJourney',  'Education',25, '45.2K'),
  ('facebook', 'CryptoDaily', 'Crypto',   25, '8.7K'),
  ('telegram', 'AI Updates',  'AI',       25, '3.1K'),
  ('tiktok',   'MusicVibes',  'Music',    25, '67.8K'),
  ('youtube',  'TravelBug',   'Travel',   25, '89.1K')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED SAMPLE ANNOUNCEMENTS
-- ============================================================
INSERT INTO public.announcements (title, subtitle, content, cta, link, color, active) VALUES
  ('Welcome to View2Earn!', 'Start earning today', 'Complete tasks and earn points that you can redeem for rewards.', 'Get Started', '/follow-to-earn', '#2ECC71', true),
  ('Double Points Weekend', 'Limited time offer', 'Earn double points on all follow tasks this weekend!', 'Start Earning', '/follow-to-earn', '#3B82F6', true),
  ('New YouTube Tasks', 'More ways to earn', 'We added new YouTube channels for you to follow and earn.', 'View Tasks', '/follow-to-earn', '#8B5CF6', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_completed_tasks_user ON public.completed_follow_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_tasks_date ON public.completed_follow_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON public.user_challenge_progress(user_id, date);
