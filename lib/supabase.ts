import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials for Bolt.new compatibility
// In production, these should be moved to environment variables
const supabaseUrl = 'https://fvmytlubzjifwtvwfdpi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXl0bHViemppZnd0dndmZHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1ODM3NjMsImV4cCI6MjA2NDE1OTc2M30.26K2Ezli1v5bUhTaAYQyuCEji4hmR7HcddeP6MMmG8E';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database Types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'developer' | 'admin';
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  hourly_rate?: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string;
  developer_id?: string;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  budget_min: number;
  budget_max: number;
  deadline?: string;
  skills_required: string[];
  category: string;
  urgency: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  client?: UserProfile;
  developer?: UserProfile;
}

export interface ProjectBid {
  id: string;
  project_id: string;
  developer_id: string;
  amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  developer?: UserProfile;
  project?: Project;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  project_id?: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: UserProfile;
  receiver?: UserProfile;
}

// Authentication Service
export class AuthService {
  static async signUp(email: string, password: string, userData: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: userData.full_name || '',
            role: userData.role || 'client',
            bio: userData.bio || '',
            skills: userData.skills || [],
            hourly_rate: userData.hourly_rate || null,
            location: userData.location || '',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      console.error('Get user error:', error);
      return { user: null, error };
    }
  }

  static async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Get profile error:', error);
      return { data: null, error };
    }
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  }
}

// Project Service
export class ProjectService {
  static async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          client:user_profiles!projects_client_id_fkey(*)
        `)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Create project error:', error);
      return { data: null, error };
    }
  }

  static async getProjects(filters: any = {}) {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          client:user_profiles!projects_client_id_fkey(*),
          developer:user_profiles!projects_developer_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters.developer_id) {
        query = query.eq('developer_id', filters.developer_id);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Get projects error:', error);
      return { data: null, error };
    }
  }

  static async getProject(id: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:user_profiles!projects_client_id_fkey(*),
          developer:user_profiles!projects_developer_id_fkey(*)
        `)
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Get project error:', error);
      return { data: null, error };
    }
  }

  static async updateProject(id: string, updates: Partial<Project>) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          client:user_profiles!projects_client_id_fkey(*),
          developer:user_profiles!projects_developer_id_fkey(*)
        `)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Update project error:', error);
      return { data: null, error };
    }
  }

  static async deleteProject(id: string) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('Delete project error:', error);
      return { error };
    }
  }
}

// Bid Service
export class BidService {
  static async createBid(bidData: Omit<ProjectBid, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('project_bids')
        .insert({
          ...bidData,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          developer:user_profiles!project_bids_developer_id_fkey(*),
          project:projects(*)
        `)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Create bid error:', error);
      return { data: null, error };
    }
  }

  static async getBids(filters: any = {}) {
    try {
      let query = supabase
        .from('project_bids')
        .select(`
          *,
          developer:user_profiles!project_bids_developer_id_fkey(*),
          project:projects(*)
        `)
        .order('created_at', { ascending: false });

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters.developer_id) {
        query = query.eq('developer_id', filters.developer_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Get bids error:', error);
      return { data: null, error };
    }
  }

  static async updateBid(id: string, updates: Partial<ProjectBid>) {
    try {
      const { data, error } = await supabase
        .from('project_bids')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          developer:user_profiles!project_bids_developer_id_fkey(*),
          project:projects(*)
        `)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Update bid error:', error);
      return { data: null, error };
    }
  }
}

// Message Service
export class MessageService {
  static async sendMessage(messageData: Omit<Message, 'id' | 'created_at' | 'read'>) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...messageData,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(*),
          receiver:user_profiles!messages_receiver_id_fkey(*)
        `)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Send message error:', error);
      return { data: null, error };
    }
  }

  static async getMessages(userId: string, otherUserId?: string) {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(*),
          receiver:user_profiles!messages_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (otherUserId) {
        query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Get messages error:', error);
      return { data: null, error };
    }
  }

  static async markAsRead(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { data: null, error };
    }
  }
}

// Real-time Subscriptions
export class RealtimeService {
  static subscribeToProjects(callback: (payload: any) => void) {
    return supabase
      .channel('projects')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        callback
      )
      .subscribe();
  }

  static subscribeToBids(projectId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`project_bids:${projectId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'project_bids',
          filter: `project_id=eq.${projectId}`
        }, 
        callback
      )
      .subscribe();
  }

  static subscribeToMessages(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  static unsubscribe(subscription: any) {
    return supabase.removeChannel(subscription);
  }
}

// Storage Service
export class StorageService {
  static async uploadFile(bucket: string, path: string, file: File) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      return { data, error };
    } catch (error) {
      console.error('Upload file error:', error);
      return { data: null, error };
    }
  }

  static async downloadFile(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      return { data, error };
    } catch (error) {
      console.error('Download file error:', error);
      return { data: null, error };
    }
  }

  static getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static async deleteFile(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return { data, error };
    } catch (error) {
      console.error('Delete file error:', error);
      return { data: null, error };
    }
  }
}

// Utility function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Export the client for direct use if needed
export default supabase;