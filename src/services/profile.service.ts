import { supabase } from '../lib/supabase';
import { Tables, Inserts, Updates } from '../types/supabase';

export const profileService = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Tables<'profiles'>;
  },

  async upsert(profile: Inserts<'profiles'>) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'profiles'>;
  },

  async update(id: string, updates: Updates<'profiles'>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'profiles'>;
  },

  async addBalance(id: string, amount: number) {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    const newBalance = (profile?.balance ?? 0) + amount;
    const { data, error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'profiles'>;
  },

  subscribeToProfile(id: string, callback: (profile: Tables<'profiles'>) => void) {
    return supabase
      .channel(`profile:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${id}` },
        (payload) => {
          callback(payload.new as Tables<'profiles'>);
        },
      )
      .subscribe();
  },
};
