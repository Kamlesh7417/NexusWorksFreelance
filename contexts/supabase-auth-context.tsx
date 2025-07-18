/**
 * Supabase Auth Context (Placeholder)
 * This is a placeholder to prevent build errors
 * The actual authentication is handled by Django backend
 */

'use client';

import React, { createContext, useContext, useState } from 'react';

interface SupabaseAuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<any>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    console.warn('Supabase auth is deprecated. Please use Django authentication instead.');
    return { data: null, error: { message: 'Supabase auth is deprecated' } };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.warn('Supabase auth is deprecated. Please use Django authentication instead.');
    return { data: null, error: { message: 'Supabase auth is deprecated' } };
  };

  const signOut = async () => {
    console.warn('Supabase auth is deprecated. Please use Django authentication instead.');
  };

  const updateProfile = async (updates: any) => {
    console.warn('Supabase auth is deprecated. Please use Django authentication instead.');
    return { data: null, error: { message: 'Supabase auth is deprecated' } };
  };

  return (
    <SupabaseAuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

export default SupabaseAuthContext;