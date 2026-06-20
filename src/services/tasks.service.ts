import { supabase } from '../lib/supabase';
import { Tables, Inserts } from '../types/supabase';

export const followTaskService = {
  async getActive() {
    const { data, error } = await supabase
      .from('follow_tasks')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tables<'follow_tasks'>[];
  },

  async getCompletedByUser(userId: string) {
    const { data, error } = await supabase
      .from('completed_follow_tasks')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data as Tables<'completed_follow_tasks'>[];
  },

  async markCompleted(record: Inserts<'completed_follow_tasks'>) {
    const { data, error } = await supabase
      .from('completed_follow_tasks')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data as Tables<'completed_follow_tasks'>;
  },

  async getCompletionCount(userId: string) {
    const { count, error } = await supabase
      .from('completed_follow_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count ?? 0;
  },

  async hasCompletedTask(userId: string, taskId: string) {
    const { data, error } = await supabase
      .from('completed_follow_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },
};
