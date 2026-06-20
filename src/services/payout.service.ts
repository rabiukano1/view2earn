import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';

export const payoutService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tables<'payout_requests'>[];
  },

  async create(request: {
    user_id: string;
    user_name: string | null;
    amount: number;
    method: string;
    address: string;
  }) {
    const { data, error } = await supabase
      .from('payout_requests')
      .insert(request)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'payout_requests'>;
  },
};
