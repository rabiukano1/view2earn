export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          kyc_status: string;
          country: string | null;
          balance: number;
          streak: number;
          tasks_done: number;
          is_admin: boolean;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          kyc_status?: string;
          country?: string | null;
          balance?: number;
          streak?: number;
          tasks_done?: number;
          is_admin?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          kyc_status?: string;
          country?: string | null;
          balance?: number;
          streak?: number;
          tasks_done?: number;
          is_admin?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          username: string;
          display_name: string | null;
          followers_count: number;
          following_count: number;
          avatar_url: string | null;
          profile_url: string | null;
          page_id: string | null;
          page_access_token: string | null;
          page_url: string | null;
          is_connected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          username: string;
          display_name?: string | null;
          followers_count?: number;
          following_count?: number;
          avatar_url?: string | null;
          profile_url?: string | null;
          page_id?: string | null;
          page_access_token?: string | null;
          page_url?: string | null;
          is_connected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: string;
          username?: string;
          display_name?: string | null;
          followers_count?: number;
          following_count?: number;
          avatar_url?: string | null;
          profile_url?: string | null;
          page_id?: string | null;
          page_access_token?: string | null;
          page_url?: string | null;
          is_connected?: boolean;
          created_at?: string;
        };
      };
      follow_tasks: {
        Row: {
          id: string;
          platform: string;
          channel_name: string;
          category: string | null;
          reward: number;
          followers: string | null;
          page_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: string;
          channel_name: string;
          category?: string | null;
          reward: number;
          followers?: string | null;
          page_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform?: string;
          channel_name?: string;
          category?: string | null;
          reward?: number;
          followers?: string | null;
          page_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      completed_follow_tasks: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          platform: string;
          reward: number;
          bonus_awarded: boolean;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          platform: string;
          reward: number;
          bonus_awarded?: boolean;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          platform?: string;
          reward?: number;
          bonus_awarded?: boolean;
          completed_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          followers: number;
          cost: number;
          status: string;
          progress: number;
          page_id: string | null;
          page_url: string | null;
          estimated_delivery: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          followers: number;
          cost: number;
          status?: string;
          progress?: number;
          page_id?: string | null;
          page_url?: string | null;
          estimated_delivery?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: string;
          followers?: number;
          cost?: number;
          status?: string;
          progress?: number;
          page_id?: string | null;
          page_url?: string | null;
          estimated_delivery?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payout_requests: {
        Row: {
          id: string;
          user_id: string;
          user_name: string | null;
          amount: number;
          method: string;
          address: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name?: string | null;
          amount: number;
          method: string;
          address: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_name?: string | null;
          amount?: number;
          method?: string;
          address?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          description: string | null;
          reference_type: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          description?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          description?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          content: string | null;
          cta: string | null;
          link: string | null;
          color: string | null;
          image_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          content?: string | null;
          cta?: string | null;
          link?: string | null;
          color?: string | null;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          content?: string | null;
          cta?: string | null;
          link?: string | null;
          color?: string | null;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: number;
          min_withdrawal: number;
          exchange_rate: number;
          new_user_bonus: number;
          watch_reward: number;
          platforms: Record<string, {
            rewardPerFollow: number;
            dailyFollowLimit: number;
            bonusAtTasks: number;
            bonusAmount: number;
          }>;
          updated_at: string;
        };
        Insert: {
          id?: number;
          min_withdrawal?: number;
          exchange_rate?: number;
          new_user_bonus?: number;
          watch_reward?: number;
          platforms?: Record<string, {
            rewardPerFollow: number;
            dailyFollowLimit: number;
            bonusAtTasks: number;
            bonusAmount: number;
          }>;
          updated_at?: string;
        };
        Update: {
          id?: number;
          min_withdrawal?: number;
          exchange_rate?: number;
          new_user_bonus?: number;
          watch_reward?: number;
          platforms?: Record<string, {
            rewardPerFollow: number;
            dailyFollowLimit: number;
            bonusAtTasks: number;
            bonusAmount: number;
          }>;
          updated_at?: string;
        };
      };
      ai_tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: string;
          reward: number;
          instructions: string | null;
          link_url: string | null;
          icon: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type: string;
          reward: number;
          instructions?: string | null;
          link_url?: string | null;
          icon?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          type?: string;
          reward?: number;
          instructions?: string | null;
          link_url?: string | null;
          icon?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          reward: number;
          passing_score: number;
          questions: {
            id: string;
            text: string;
            options: string[];
            correctIndex: number;
          }[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          reward: number;
          passing_score?: number;
          questions?: {
            id: string;
            text: string;
            options: string[];
            correctIndex: number;
          }[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          reward?: number;
          passing_score?: number;
          questions?: {
            id: string;
            text: string;
            options: string[];
            correctIndex: number;
          }[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_challenge_progress: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          completed_task_ids: string[];
          completed_quiz_ids: string[];
          total_earned: number;
          ad_watches_today: number;
          follow_count_today: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          completed_task_ids?: string[];
          completed_quiz_ids?: string[];
          total_earned?: number;
          ad_watches_today?: number;
          follow_count_today?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          completed_task_ids?: string[];
          completed_quiz_ids?: string[];
          total_earned?: number;
          ad_watches_today?: number;
          follow_count_today?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      verification_attempts: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          target_username: string | null;
          passed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          target_username?: string | null;
          passed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          target_username?: string | null;
          passed?: boolean;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          details?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
