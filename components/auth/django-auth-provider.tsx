'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Types
export interface DjangoUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: 'freelancer' | 'client' | 'both';
  role?: 'client' | 'developer' | 'admin';
  github_username?: string;
  profile_completed: boolean;
  bio?: string;
  location?: string;
  timezone?: string;
  hourly_rate?: number;
  availability_hours_per_week?: number;
  overall_rating?: number;
  total_reviews?: number;
  projects_completed?: number;
  total_earnings?: number;
  created_at?: string;
  last_active?: string;
}

export interface AuthState {
  user: DjangoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'client' | 'developer';
  firstName: string;
  lastName: string;
  githubUsername?: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithDemo: (role: 'client' | 'developer') => Promise<{ success: boolean; error?: string }>;
  isClient: () => boolean;
  isDeveloper: () => boolean;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Import the main API client
import { apiClient } from '@/lib/api-client';

// Auth Provider Component
function DjangoAuthProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    accessToken: null,
    refreshToken: null,
  });

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have tokens in localStorage
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (accessToken && refreshToken) {
          // Set tokens in API client
          apiClient.setTokens(accessToken, refreshToken);
          
          // Verify token validity by fetching current user
          const response = await apiClient.getCurrentUser();
          
          if (response.data && !response.error) {
            console.log('Django auth: User restored from tokens', response.data);
            setAuthState({
              user: response.data as DjangoUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              accessToken,
              refreshToken,
            });
          } else {
            // Token is invalid, clear it
            apiClient.clearTokens();
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              accessToken: null,
              refreshToken: null,
            });
          }
        } else {
          console.log('Django auth: No tokens found');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        apiClient.clearTokens();
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          accessToken: null,
          refreshToken: null,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.login(email, password);
      
      if (response.error || !response.data) {
        const errorMessage = response.error || 'Login failed';
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }

      const { access, refresh, user } = response.data;
      
      // Store tokens
      apiClient.setTokens(access, refresh);
      
      // Update auth state
      setAuthState({
        user: user as DjangoUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        accessToken: access,
        refreshToken: refresh,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    if (data.password !== data.confirmPassword) {
      const error = 'Passwords do not match';
      setAuthState(prev => ({ ...prev, isLoading: false, error }));
      return { success: false, error };
    }

    try {
      const { confirmPassword, firstName, lastName, githubUsername, ...userData } = data;
      const response = await apiClient.register({
        ...userData,
        first_name: firstName,
        last_name: lastName,
        github_username: githubUsername
      });

      if (response.error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error,
        }));
        return { success: false, error: response.error };
      }

      // After successful registration, sign in the user
      const loginResult = await login(data.email, data.password);

      return loginResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Clear tokens from API client and localStorage
      apiClient.clearTokens();
      
      // Update auth state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        accessToken: null,
        refreshToken: null,
      });
      
      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server logout fails
      apiClient.clearTokens();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        accessToken: null,
        refreshToken: null,
      });
      router.push('/');
    }
  };

  const signInWithGithub = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    // TODO: Implement GitHub OAuth with Django backend
    console.log('GitHub OAuth not implemented yet');
    setAuthState(prev => ({ ...prev, isLoading: false, error: 'GitHub OAuth not implemented yet' }));
  };

  const signInWithDemo = async (role: 'client' | 'developer'): Promise<{ success: boolean; error?: string }> => {
    // Demo credentials
    const demoCredentials = {
      client: { email: 'client@demo.com', password: 'demo123' },
      developer: { email: 'dev@demo.com', password: 'demo123' }
    };
    
    const credentials = demoCredentials[role];
    return await login(credentials.email, credentials.password);
  };

  const refreshUser = async (): Promise<void> => {
    if (!authState.accessToken) return;

    try {
      const response = await apiClient.getCurrentUser();
      
      if (response.data) {
        setAuthState(prev => ({
          ...prev,
          user: response.data,
        }));
      }
    } catch (error) {
      console.error('User refresh error:', error);
    }
  };

  const isClient = (): boolean => {
    const user = authState.user;
    return user?.role === 'client' || user?.user_type === 'client';
  };
  
  const isDeveloper = (): boolean => {
    const user = authState.user;
    return user?.role === 'developer' || user?.user_type === 'freelancer';
  };
  
  const isAdmin = (): boolean => {
    const user = authState.user;
    return user?.role === 'admin';
  };
  
  const hasRole = (role: string): boolean => {
    const user = authState.user;
    return user?.role === role || user?.user_type === role;
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    signInWithGithub,
    signInWithDemo,
    isClient,
    isDeveloper,
    isAdmin,
    hasRole,
    loading: authState.isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Main Provider - pure Django auth, no NextAuth
export function DjangoAuthProvider({ children }: { children: ReactNode }) {
  return (
    <DjangoAuthProviderInner>
      {children}
    </DjangoAuthProviderInner>
  );
}

// Hook to use auth context
export function useDjangoAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useDjangoAuth must be used within a DjangoAuthProvider');
  }
  return context;
}

// Export types
export type { AuthContextType };