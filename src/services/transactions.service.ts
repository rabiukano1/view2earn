import { supabase } from '../lib/supabase';
import { Tables, Inserts } from '../types/supabase';

export const transactionService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tables<'transactions'>[];
  },

  async create(transaction: Inserts<'transactions'>) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'transactions'>;
  },

  async getTotalEarnings(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit');
    if (error) throw error;
    return data.reduce((sum, t) => sum + t.amount, 0);
  },
};
