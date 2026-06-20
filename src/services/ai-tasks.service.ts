import { supabase } from '../lib/supabase';
import { Tables, Inserts } from '../types/supabase';

export const aiTaskService = {
  async getActive() {
    const { data, error } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tables<'ai_tasks'>[];
  },

  async completeTask(userId: string, record: { task_id: string; reward: number }) {
    const { data, error } = await supabase
      .from('completed_follow_tasks')
      .insert({
        user_id: userId,
        task_id: record.task_id,
        platform: 'ai_task',
        reward: record.reward,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
