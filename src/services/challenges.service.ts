import { supabase } from '../lib/supabase';
import { Tables, Inserts, Updates } from '../types/supabase';

export const challengeService = {
  async getToday(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    if (error) throw error;
    return data as Tables<'user_challenge_progress'> | null;
  },

  async upsert(progress: Inserts<'user_challenge_progress'>) {
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .upsert(progress, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'user_challenge_progress'>;
  },

  async update(id: string, updates: Updates<'user_challenge_progress'>) {
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'user_challenge_progress'>;
  },
};
