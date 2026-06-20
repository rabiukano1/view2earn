import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';

export const announcementService = {
  async getActive() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tables<'announcements'>[];
  },
};
