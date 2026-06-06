# Supabase Setup Guide for KYCPort Auth

This guide covers every step to configure Supabase as the auth backend for KYCPort OIDC. Follow these steps in order — do not skip any.

---

## 1. Create a Supabase Project

1. Go to https://supabase.com and sign in (or create an account).
2. Click **New project**.
3. Fill in:
   - **Name**: `view2earn`
   - **Database Password**: Generate a strong password and save it somewhere safe.
   - **Region**: Choose the region closest to your users (e.g., `US East (N. Virginia)`).
   - **Pricing Plan**: Free tier is fine to start.
4. Click **Create new project**.
5. Wait 1-3 minutes for the project to provision.

---

## 2. Get Your Supabase API Credentials

1. In the Supabase Dashboard, go to **Project Settings** (gear icon) → **API**.
2. Under **Project URL**, copy the value — this is `NEXT_PUBLIC_SUPABASE_URL`.
3. Under **Project API keys** → **anon public** (labeled **Publishable key** in newer dashboards), copy the value — this is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Save these to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> The `.env` file must be in the **project root** directory. It is gitignored by default `.gitignore` (pattern: `.env*.local`). Do NOT commit it.

---

## 3. Configure Auth Settings

1. In the Supabase Dashboard, go to **Authentication** → **Settings** (Providers tab → Settings sub-tab).
2. Under **General**, set:
   - **Site URL**: `view2earn://` (the app's custom URL scheme)
   - **Redirect URLs**: add each of the following on its own line:
     ```
     view2earn://
     view2earn://*
     com.rabiukano.view2earn://*
     https://your-project-id.supabase.co/auth/v1/callback
     ```
3. Under **Security**:
   - **JWT expiry**: leave at default (3600 seconds / 1 hour)
   - **Enable manual linking**: `disabled` (unless you need account linking)
4. Under **SMTP Settings** (optional): configure if you want email-based flows later. Not required for KYCPort OIDC.

---

## 4. Add KYCPort as a Custom OIDC Provider

1. In the Supabase Dashboard, go to **Authentication** → **Providers**.
2. Click **Add New Provider** → **OIDC**.
3. Configure the following fields **exactly**:

| Field | Value |
|---|---|
| **Provider ID** | `kycport` |
| **Provider Name** | `KYCPort` (display name, optional) |
| **Use OIDC Auto-discovery** | ✅ Enabled (toggle ON) |
| **Issuer URL** | Your KYCPort OIDC issuer URL (get this from KYCPort) |
| **Client ID** | Your KYCPort OAuth client ID |
| **Client Secret** | Your KYCPort OAuth client secret |
| **Redirect URI allowlist** | Add these (one per line): |
| | `view2earn://` |
| | `com.rabiukano.view2earn://` |
| | `https://your-project-id.supabase.co/auth/v1/callback` |

> The `custom:` prefix is **automatically added** by Supabase — the provider ID in the API becomes `custom:kycport`. In the app code, we use the short name `kycport` in `signInWithOAuth({ provider: 'kycport' })`.

4. Click **Save**.
5. After saving, the provider status should show as **Enabled**. You should see a row for `kycport` with a green dot.

---

## 5. (Optional) Configure KYCPort OIDC Application

This step happens on the KYCPort side. Add these redirect URIs to your KYCPort OAuth application:

```
view2earn://
com.rabiukano.view2earn://
https://your-project-id.supabase.co/auth/v1/callback
```

> Your KYCPort Issuer URL typically looks like `https://api.kycport.com/oidc` or a custom domain. Get the exact value from the KYCPort dashboard under OIDC settings.

---

## 6. SQL Schema — user_profiles Table

Open the **SQL Editor** in the Supabase Dashboard (top nav → **SQL Editor** → **New query**) and run:

```sql
-- ============================================================
-- 1. CREATE user_profiles TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  avatar_url    TEXT,
  kyc_status    TEXT DEFAULT 'pending'
                     CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  country       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for sign-up trigger)
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role has full access (admin operations)
CREATE POLICY "Service role has full access"
  ON public.user_profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. AUTO-CREATE PROFILE ON USER SIGNUP (FUNCTION + TRIGGER)
-- ============================================================

-- Function that creates a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      NEW.email
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger that fires after a user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. SYNC USER METADATA ON UPDATE (FUNCTION + TRIGGER)
-- ============================================================

-- Optional: sync profile when user metadata is updated
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
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_status
  ON public.user_profiles(kyc_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at
  ON public.user_profiles(created_at DESC);

-- ============================================================
-- 6. (OPTIONAL) SERVICE ROLE: CREATE PROFILES FOR EXISTING USERS
-- ============================================================
-- Run this once if there are already users in auth.users BEFORE
-- the trigger was created:
--
-- INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
-- SELECT
--   id,
--   email,
--   COALESCE(
--     raw_user_meta_data ->> 'full_name',
--     raw_user_meta_data ->> 'name',
--     email
--   ),
--   raw_user_meta_data ->> 'avatar_url'
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;
```

<details>
<summary><b>What this SQL does (explanation)</b></summary>

- Creates a `user_profiles` table linked to `auth.users` via foreign key with CASCADE delete
- Each profile has: email, full_name, avatar_url, kyc_status (from KYCPort), country
- Enables RLS so users can only see/edit their own row
- Creates a trigger `on_auth_user_created` that auto-inserts a profile row every time a new user signs up via KYCPort
- Creates a trigger `on_auth_user_updated` that syncs profile fields when KYCPort sends updated user metadata
- Adds performance indexes on kyc_status and created_at
</details>
                     
---

## 7. Verify the Setup

### 7a. Check the KYCPort Provider is Active

Run this query in the SQL Editor:

```sql
SELECT * FROM auth.sso_providers;
```

You should see a row with `id` = `custom:kycport` and `enabled` = `true`.

### 7b. Manually Test OIDC Discovery

```sql
SELECT
  name,
  oidc_issuer_url,
  enabled
FROM auth.sso_providers
WHERE name = 'kycport';
```

### 7c. Test the Full Auth Flow

1. In your app, call `useAuth().signIn()` (or `signInWithKycPort()` directly).
2. The app opens a browser with the KYCPort login page.
3. After authenticating, the browser redirects to your app.
4. Check that the session was created:

```sql
-- How many users have signed up via KYCPort?
SELECT COUNT(*) FROM auth.users;

-- View the user metadata KYCPort sent
SELECT id, email, raw_user_meta_data FROM auth.users;
```

5. Verify a profile was auto-created:

```sql
SELECT * FROM public.user_profiles;
```

---

## 8. Troubleshooting

### "No authentication URL returned"
- Confirm the OIDC provider is enabled: check `auth.sso_providers` table.
- Confirm the Issuer URL in Supabase matches exactly what KYCPort provides.

### "Invalid code" or "Code exchange failed"
- The Redirect URL in Supabase settings must **exactly match** the redirect used by the app.
- The app uses `view2earn:///` (with trailing slash) from `Linking.createURL('/')`. Ensure this is in your allowed redirect URLs.
- KYCPort client ID and secret must match between KYCPort and Supabase.

### Session is not persisted after app restart
- Confirm `expo-secure-store` is correctly installed and configured in `app.json` plugins.
- Confirm `babel.config.js` and `metro.config.js` are set up for `react-native-quick-crypto`.

### "relation public.user_profiles does not exist"
- Run the full SQL script from §6 above.
- The `fetchUserProfile()` function queries `public.user_profiles` — it's optional but the table must exist if you use it.

### `auth.uid()` returns NULL in RLS policies
- RLS policies that use `auth.uid()` require the user to be authenticated (bearer token in the request header). For client-side queries from the app after login, this is handled automatically by the Supabase client SDK.

---

## 9. Supabase Dashboard Reference

Quick nav reference:

| Page | Path |
|---|---|
| API Credentials | Project Settings (gear) → API |
| Auth Providers | Authentication → Providers |
| Auth Settings (redirect URLs) | Authentication → Providers → Settings |
| SQL Editor | SQL Editor (top nav) |
| Table Editor | Table Editor (top nav) |
| Database Triggers | Database → Triggers |

---

## 10. Architecture Summary

```
+----------------+       +------------------+       +-------------+
|   Mobile App   | ----> |   Supabase Auth  | ----> |   KYCPort   |
| (expo-web-     |       | (OIDC Provider)  |       | (OIDC IdP)  |
|  browser)      | <---- |                  | <---- |             |
+----------------+       +------------------+       +-------------+
       |                          |
       | store session            | auto-create profile
       v                          v
+------------------+    +------------------+
| expo-secure-store |    | user_profiles    |
| (keychain/        |    | (PostgreSQL)     |
|  keystore)        |    +------------------+
+------------------+
```

---

## Final Checklist

- [ ] Supabase project created
- [ ] `.env` file has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Auth Settings: Site URL set to `view2earn://`
- [ ] Auth Settings: Redirect URLs include custom schemes + Supabase callback
- [ ] KYCPort OIDC provider added with correct Issuer URL, Client ID, Client Secret
- [ ] `user_profiles` table created via SQL Editor
- [ ] RLS policies applied
- [ ] Auto-profile trigger (`on_auth_user_created`) created
- [ ] Dependencies installed: `npx expo install @supabase/supabase-js expo-secure-store react-native-quick-crypto react-native-url-polyfill`
- [ ] Build and test with `eas build --platform ios|android`
