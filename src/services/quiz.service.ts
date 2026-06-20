import { supabase } from '../lib/supabase';
import { Tables, Inserts } from '../types/supabase';

export const quizService = {
  async getActive() {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Tables<'quizzes'>[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Tables<'quizzes'>;
  },

  async markAttempt(userId: string, quizId: string, passed: boolean) {
    const { error } = await supabase.from('verification_attempts').insert({
      user_id: userId,
      task_id: quizId,
      passed,
    });
    if (error) throw error;
  },
};
