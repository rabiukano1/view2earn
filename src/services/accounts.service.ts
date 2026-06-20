import { supabase } from '../lib/supabase';
import { Tables, Inserts, Updates } from '../types/supabase';

export const connectedAccountService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data as Tables<'connected_accounts'>[];
  },

  async upsert(account: Inserts<'connected_accounts'>) {
    const { data, error } = await supabase
      .from('connected_accounts')
      .upsert(account, { onConflict: 'user_id,platform' })
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'connected_accounts'>;
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async verify(id: string, verified: boolean) {
    const { data, error } = await supabase
      .from('connected_accounts')
      .update({ is_connected: verified })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'connected_accounts'>;
  },
};
