/**
 * Django Authentication Integration
 * Handles authentication flow between Next.js and Django backend
 */

import { apiClient, User, AuthTokens } from './api-client';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
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
  githubUsername?: string;
}

class DjangoAuthService {
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    // Initialize auth state on client side
    if (typeof window !== 'undefined') {
      this.initializeAuth();
    }
  }

  private async initializeAuth(): Promise<void> {
    this.setLoading(true);
    
    try {
      // Check if we have tokens in localStorage
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken && refreshToken) {
        // Verify token validity by fetching current user
        const response = await apiClient.getCurrentUser();
        
        if (response.data && !response.error) {
          this.setAuthState({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // Token is invalid, clear it
          this.clearAuth();
        }
      } else {
        this.setLoading(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.clearAuth();
    }
  }

  private setAuthState(newState: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...newState };
    this.notifyListeners();
  }

  private setLoading(isLoading: boolean): void {
    this.setAuthState({ isLoading });
  }

  private setError(error: string | null): void {
    this.setAuthState({ error });
  }

  private clearAuth(): void {
    apiClient.clearTokens();
    this.setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await apiClient.login(credentials.email, credentials.password);
      
      if (response.data && !response.error) {
        const { access, refresh, user } = response.data;
        
        // Store tokens
        apiClient.setTokens(access, refresh);
        
        // Update auth state
        this.setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        return { success: true };
      } else {
        const errorMessage = response.error || 'Login failed';
        this.setAuthState({
          isLoading: false,
          error: errorMessage,
        });
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      this.setAuthState({
        isLoading: false,
        error: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  }

  public async register(registerData: RegisterData): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);
    this.setError(null);

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      const error = 'Passwords do not match';
      this.setError(error);
      this.setLoading(false);
      return { success: false, error };
    }

    try {
      const { confirmPassword, ...userData } = registerData;
      const response = await apiClient.register(userData);
      
      if (response.data && !response.error) {
        const { access, refresh, user } = response.data;
        
        // Store tokens
        apiClient.setTokens(access, refresh);
        
        // Update auth state
        this.setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        return { success: true };
      } else {
        const errorMessage = response.error || 'Registration failed';
        this.setAuthState({
          isLoading: false,
          error: errorMessage,
        });
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      this.setAuthState({
        isLoading: false,
        error: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  }

  public async logout(): Promise<void> {
    this.setLoading(true);
    
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  public async refreshUser(): Promise<void> {
    if (!this.authState.isAuthenticated) return;

    try {
      const response = await apiClient.getCurrentUser();
      
      if (response.data && !response.error) {
        this.setAuthState({
          user: response.data,
        });
      } else {
        // If user fetch fails, clear auth
        this.clearAuth();
      }
    } catch (error) {
      console.error('User refresh error:', error);
      this.clearAuth();
    }
  }

  public isClient(): boolean {
    return this.authState.user?.role === 'client';
  }

  public isDeveloper(): boolean {
    return this.authState.user?.role === 'developer';
  }

  public isAdmin(): boolean {
    return this.authState.user?.role === 'admin';
  }

  public hasRole(role: string): boolean {
    return this.authState.user?.role === role;
  }

  public getUserId(): string | null {
    return this.authState.user?.id || null;
  }

  public getUser(): User | null {
    return this.authState.user;
  }
}

// Export singleton instance
export const djangoAuth = new DjangoAuthService();

// React hook for using Django auth in components
export function useDjangoAuth() {
  const [authState, setAuthState] = React.useState<AuthState>(djangoAuth.getAuthState());

  React.useEffect(() => {
    const unsubscribe = djangoAuth.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: djangoAuth.login.bind(djangoAuth),
    register: djangoAuth.register.bind(djangoAuth),
    logout: djangoAuth.logout.bind(djangoAuth),
    refreshUser: djangoAuth.refreshUser.bind(djangoAuth),
    isClient: djangoAuth.isClient.bind(djangoAuth),
    isDeveloper: djangoAuth.isDeveloper.bind(djangoAuth),
    isAdmin: djangoAuth.isAdmin.bind(djangoAuth),
    hasRole: djangoAuth.hasRole.bind(djangoAuth),
    getUserId: djangoAuth.getUserId.bind(djangoAuth),
    getUser: djangoAuth.getUser.bind(djangoAuth),
  };
}

// Import React for the hook
import React from 'react';

export default djangoAuth;