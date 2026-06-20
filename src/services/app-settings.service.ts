import { supabase } from '../lib/supabase';

export interface AppSettings {
  min_withdrawal: number;
  exchange_rate: number;
  new_user_bonus: number;
  watch_reward: number;
  platforms: Record<string, {
    rewardPerFollow: number;
    dailyFollowLimit: number;
    bonusAtTasks: number;
    bonusAmount: number;
  }>;
}

export const appSettingsService = {
  async get() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .single();
    if (error) throw error;
    return data as AppSettings;
  },
};
