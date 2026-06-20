import { supabase } from '../lib/supabase';
import { Tables, Inserts, Updates } from '../types/supabase';

export const orderService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tables<'orders'>[];
  },

  async create(order: Inserts<'orders'>) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'orders'>;
  },

  async updateStatus(id: string, status: string, progress?: number) {
    const updates: Updates<'orders'> = { status };
    if (progress !== undefined) updates.progress = progress;
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'orders'>;
  },
};
