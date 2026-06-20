# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Build / Verification
- TypeScript check: `npx tsc --noEmit`
- Start dev: `npx expo start`
- iOS build: `npx expo run:ios`
- Android build: `npx expo run:android`

# Project Architecture
## Supabase Service Layer (`src/services/`)
All data access goes through service modules:
- `profile.service.ts` - User profiles CRUD
- `accounts.service.ts` - Connected social accounts CRUD
- `orders.service.ts` - Follower orders
- `tasks.service.ts` - Follow tasks & completions
- `transactions.service.ts` - Transaction history
- `payout.service.ts` - Payout requests
- `announcements.service.ts` - Active announcements
- `app-settings.service.ts` - Platform configuration
- `ai-tasks.service.ts` - AI/dynamic tasks
- `challenges.service.ts` - Daily challenge progress
- `quiz.service.ts` - Quizzes
- `storage.service.ts` - Avatar uploads (Supabase Storage)

## State Management (`MockDataContext.tsx`)
All state is managed via `useReducer` with a flat action dispatch. The context:
1. Loads data from Supabase on mount (when `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_KEY` are set)
2. Falls back to mock data when Supabase is not configured
3. All screens use `useMockData()` - no direct Supabase calls in screens

## Auth (`AuthContext.tsx`)
- Uses Supabase Auth for signup/signin
- `expo-secure-store` for session persistence on native
- `AuthGate` in `_layout.tsx` handles routing
- Auto-creates profile row via `handle_new_user()` trigger

## Key Conventions
- All screens in `src/app/` (file-based routing)
- Components in `src/components/`
- Use `expo-router` `router.push()` for navigation
- Profile balance stored as integer (PTS * 1000) for precision
