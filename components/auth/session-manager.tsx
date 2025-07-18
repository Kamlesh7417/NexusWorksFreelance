'use client';

import React, { useEffect, useState } from 'react';
import { useDjangoAuth } from './django-auth-provider';
import { authSyncService } from '@/lib/auth-sync';

interface SessionManagerProps {
  children: React.ReactNode;
}

export function SessionManager({ children }: SessionManagerProps) {
  const { user, accessToken, refreshUser, isAuthenticated } = useDjangoAuth();
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Sync user profile periodically
  useEffect(() => {
    if (!isAuthenticated || !accessToken || syncInProgress) return;

    const syncProfile = async () => {
      setSyncInProgress(true);
      try {
        await refreshUser();
      } catch (error) {
        console.error('Profile sync error:', error);
      } finally {
        setSyncInProgress(false);
      }
    };

    // Sync immediately on mount
    syncProfile();

    // Set up periodic sync (every 5 minutes)
    const interval = setInterval(syncProfile, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, accessToken, refreshUser, syncInProgress]);

  // Handle token refresh before expiry
  useEffect(() => {
    if (!accessToken) return;

    try {
      // Decode JWT to check expiry
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExpiry = tokenPayload.exp;
      const timeUntilExpiry = tokenExpiry - currentTime;

      // Refresh token 5 minutes before expiry
      if (timeUntilExpiry > 300) {
        const refreshTimeout = setTimeout(() => {
          refreshUser();
        }, (timeUntilExpiry - 300) * 1000);

        return () => clearTimeout(refreshTimeout);
      }
    } catch (error) {
      console.error('Token expiry check error:', error);
    }
  }, [accessToken, refreshUser]);

  return <>{children}</>;
}

// Hook for managing user session state
export function useSessionManager() {
  const { user, accessToken, isAuthenticated, isLoading } = useDjangoAuth();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncUserData = async () => {
    if (!accessToken) return null;

    try {
      const result = await authSyncService.getUserProfile(accessToken);
      if (result.data) {
        setLastSyncTime(new Date());
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('User data sync error:', error);
      return null;
    }
  };

  const updateProfile = async (updates: Parameters<typeof authSyncService.updateProfile>[1]) => {
    if (!accessToken) return false;

    try {
      const result = await authSyncService.updateProfile(accessToken, updates);
      if (!result.error) {
        setLastSyncTime(new Date());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const triggerGithubAnalysis = async () => {
    if (!accessToken) return false;

    try {
      const result = await authSyncService.triggerGithubAnalysis(accessToken);
      return !result.error;
    } catch (error) {
      console.error('GitHub analysis error:', error);
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    lastSyncTime,
    syncUserData,
    updateProfile,
    triggerGithubAnalysis,
  };
}