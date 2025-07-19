'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { djangoAuth, AuthState } from '@/lib/auth-django';
import { getDemoUser, isDemoCredentials, getDemoUserByEmail } from '@/lib/demo-credentials';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  signIn: () => void;
  signInWithDemo: (role: 'client' | 'developer') => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    role: 'client' | 'developer';
    githubUsername?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  isClient: () => boolean;
  isDeveloper: () => boolean;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  getUserId: () => string | null;
  getUser: () => any;
  profile: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(djangoAuth.getAuthState());
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = djangoAuth.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (authState.user && authState.isAuthenticated) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [authState.user, authState.isAuthenticated]);

  // Initialize demo session on mount
  useEffect(() => {
    const demoUser = localStorage.getItem('demo_user');
    const demoProfile = localStorage.getItem('demo_profile');
    
    if (demoUser && demoProfile) {
      try {
        const user = JSON.parse(demoUser);
        const profile = JSON.parse(demoProfile);
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        setProfile(profile);
      } catch (error) {
        console.error('Error loading demo session:', error);
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_profile');
      }
    }
  }, []);

  const loadProfile = async () => {
    try {
      // For now, create a profile from user data
      // In the future, this could fetch additional profile data from the backend
      if (authState.user) {
        const userProfile = {
          id: authState.user.id,
          full_name: authState.user.email.split('@')[0], // Use email prefix as name
          email: authState.user.email,
          avatar_url: null,
          role: authState.user.role,
          github_username: authState.user.github_username,
          is_verified: authState.user.is_verified,
          created_at: authState.user.created_at
        };
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const signOut = async () => {
    try {
      // Clear demo session
      localStorage.removeItem('demo_user');
      localStorage.removeItem('demo_profile');
      
      await djangoAuth.logout();
      setProfile(null);
      
      // Reset auth state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const signIn = () => {
    // Redirect to sign-in page or open modal
    window.location.href = '/auth/signin';
  };

  const signInWithDemo = async (role: 'client' | 'developer') => {
    const demoUser = getDemoUser(role);
    return await login(demoUser.email, demoUser.password);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check if it's demo credentials first
      if (isDemoCredentials(email, password)) {
        const demoUser = getDemoUserByEmail(email);
        if (demoUser) {
          // Simulate successful login with demo user
          const mockUser = {
            id: demoUser.profile.id,
            email: demoUser.email,
            role: demoUser.role,
            github_username: demoUser.profile.github_username,
            created_at: new Date().toISOString(),
            is_verified: true
          };
          
          setAuthState({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Set demo profile
          setProfile(demoUser.profile);
          
          // Store demo session in localStorage
          localStorage.setItem('demo_user', JSON.stringify(mockUser));
          localStorage.setItem('demo_profile', JSON.stringify(demoUser.profile));
          
          setLoading(false);
          return { success: true };
        }
      }
      
      // Otherwise use Django auth
      const result = await djangoAuth.login({ email, password });
      setLoading(false);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
    role: 'client' | 'developer';
    githubUsername?: string;
  }) => {
    return await djangoAuth.register(data);
  };

  const refreshUser = async () => {
    await djangoAuth.refreshUser();
  };

  const isClient = () => {
    return djangoAuth.isClient();
  };

  const isDeveloper = () => {
    return djangoAuth.isDeveloper();
  };

  const isAdmin = () => {
    return djangoAuth.isAdmin();
  };

  const hasRole = (role: string) => {
    return djangoAuth.hasRole(role);
  };

  const getUserId = () => {
    return djangoAuth.getUserId();
  };

  const getUser = () => {
    return djangoAuth.getUser();
  };

  const value: AuthContextType = {
    ...authState,
    profile,
    loading,
    signOut,
    signIn,
    signInWithDemo,
    login,
    register,
    refreshUser,
    isClient,
    isDeveloper,
    isAdmin,
    hasRole,
    getUserId,
    getUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}