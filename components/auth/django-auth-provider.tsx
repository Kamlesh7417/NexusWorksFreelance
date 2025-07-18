'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Types
export interface DjangoUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: 'client' | 'developer' | 'admin';
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
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  isClient: () => boolean;
  isDeveloper: () => boolean;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Django API client
const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

class DjangoApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Request failed');
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async login(email: string, password: string) {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });
  }

  async register(userData: Omit<RegisterData, 'confirmPassword'>) {
    return this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        username: userData.email,
        email: userData.email,
        password: userData.password,
        password_confirm: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        github_username: userData.githubUsername || '',
      }),
    });
  }

  async getCurrentUser(accessToken: string) {
    return this.request('/auth/user/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }
}

const apiClient = new DjangoApiClient(DJANGO_API_URL);

// Auth Provider Component
function DjangoAuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    accessToken: null,
    refreshToken: null,
  });

  // Initialize auth state from NextAuth session
  useEffect(() => {
    if (status === 'loading') {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (session?.user) {
      setAuthState({
        user: {
          id: session.user.id!,
          email: session.user.email!,
          username: session.user.username!,
          first_name: session.user.name?.split(' ')[0] || '',
          last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
          user_type: session.user.role as 'client' | 'developer' | 'admin',
          github_username: session.user.githubUsername,
          profile_completed: session.user.profileCompleted || false,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        accessToken: session.accessToken || null,
        refreshToken: session.refreshToken || null,
      });
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        accessToken: null,
        refreshToken: null,
      });
    }
  }, [session, status]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Login failed',
        }));
        return { success: false, error: result.error || 'Login failed' };
      }

      // Success will be handled by the session effect
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
      const { confirmPassword, ...userData } = data;
      const response = await apiClient.register(userData);

      if (response.error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error,
        }));
        return { success: false, error: response.error };
      }

      // After successful registration, sign in the user
      const loginResult = await login({
        email: data.email,
        password: data.password,
      });

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
    await signOut({ redirect: false });
    router.push('/');
  };

  const signInWithGithub = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    await signIn('github', { callbackUrl: '/dashboard' });
  };

  const refreshUser = async (): Promise<void> => {
    if (!authState.accessToken) return;

    try {
      const response = await apiClient.getCurrentUser(authState.accessToken);
      
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

  const isClient = (): boolean => authState.user?.user_type === 'client';
  const isDeveloper = (): boolean => authState.user?.user_type === 'developer';
  const isAdmin = (): boolean => authState.user?.user_type === 'admin';
  const hasRole = (role: string): boolean => authState.user?.user_type === role;

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    signInWithGithub,
    isClient,
    isDeveloper,
    isAdmin,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Main Provider with SessionProvider wrapper
export function DjangoAuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <DjangoAuthProviderInner>
        {children}
      </DjangoAuthProviderInner>
    </SessionProvider>
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
export type { AuthContextType, DjangoUser, LoginCredentials, RegisterData };