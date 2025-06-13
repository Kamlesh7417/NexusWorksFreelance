import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          role: string;
          skills: string[];
          experience_level: string;
          bio: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          role: string;
          skills: string[];
          experience_level: string;
          bio?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          role?: string;
          skills?: string[];
          experience_level?: string;
          bio?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          budget_min: number;
          budget_max: number;
          deadline: string;
          client_id: string;
          status: string;
          skills_required: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          budget_min: number;
          budget_max: number;
          deadline: string;
          client_id: string;
          status?: string;
          skills_required: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          budget_min?: number;
          budget_max?: number;
          deadline?: string;
          client_id?: string;
          status?: string;
          skills_required?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      learning_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          progress_percentage: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          progress_percentage?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          progress_percentage?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};