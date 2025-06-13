'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService, UserProfile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Initial session error:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await AuthService.getUserProfile(userId);
      
      if (error) {
        console.error('Load profile error:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    setLoading(true);
    try {
      const result = await AuthService.signUp(email, password, userData);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { data: null, error: new Error('No user logged in') };
    }

    try {
      const result = await AuthService.updateProfile(user.id, updates);
      
      if (result.data) {
        setProfile(result.data);
      }
      
      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}