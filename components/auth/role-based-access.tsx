'use client';

import React from 'react';
import { useDjangoAuth } from './django-auth-provider';
import { Shield, AlertCircle } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: ('client' | 'developer' | 'admin')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

interface RoleBasedComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Role Guard Component - Shows content only if user has required role
 */
export function RoleGuard({ allowedRoles, children, fallback, redirectTo }: RoleGuardProps) {
  const { user, loading, hasRole } = useDjangoAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user) {
    if (redirectTo) {
      window.location.href = `/auth/signin?redirectTo=${encodeURIComponent(redirectTo)}`;
      return null;
    }
    
    return fallback || (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-400 mb-2">Authentication Required</h3>
        <p className="text-gray-300">Please sign in to access this content.</p>
      </div>
    );
  }

  const userHasAccess = allowedRoles.some(role => hasRole(role));

  if (!userHasAccess) {
    return fallback || (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
        <Shield className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">Access Restricted</h3>
        <p className="text-gray-300">
          This feature is only available for {allowedRoles.join(', ')} users.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Your current role: {user.role || user.user_type}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Client Only Component - Shows content only for clients
 */
export function ClientOnly({ children, fallback }: RoleBasedComponentProps) {
  return (
    <RoleGuard allowedRoles={['client']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Developer Only Component - Shows content only for developers
 */
export function DeveloperOnly({ children, fallback }: RoleBasedComponentProps) {
  return (
    <RoleGuard allowedRoles={['developer']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Admin Only Component - Shows content only for admins
 */
export function AdminOnly({ children, fallback }: RoleBasedComponentProps) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Role-based Navigation Item
 */
interface RoleBasedNavItemProps {
  allowedRoles: ('client' | 'developer' | 'admin')[];
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function RoleBasedNavItem({ allowedRoles, href, children, className, onClick }: RoleBasedNavItemProps) {
  const { user, hasRole } = useDjangoAuth();

  if (!user) return null;

  const userHasAccess = allowedRoles.some(role => hasRole(role));
  if (!userHasAccess) return null;

  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

/**
 * Role-based Button Component
 */
interface RoleBasedButtonProps {
  allowedRoles: ('client' | 'developer' | 'admin')[];
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  fallbackMessage?: string;
}

export function RoleBasedButton({ 
  allowedRoles, 
  children, 
  className, 
  onClick, 
  disabled,
  fallbackMessage 
}: RoleBasedButtonProps) {
  const { user, hasRole } = useDjangoAuth();

  if (!user) return null;

  const userHasAccess = allowedRoles.some(role => hasRole(role));
  
  if (!userHasAccess) {
    if (fallbackMessage) {
      return (
        <div className="text-sm text-gray-400 p-2 border border-gray-600 rounded-lg">
          {fallbackMessage}
        </div>
      );
    }
    return null;
  }

  return (
    <button 
      className={className} 
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/**
 * Smart Role Message Component - Shows different messages based on user role
 */
interface SmartRoleMessageProps {
  clientMessage?: string;
  developerMessage?: string;
  adminMessage?: string;
  defaultMessage?: string;
  className?: string;
}

export function SmartRoleMessage({ 
  clientMessage, 
  developerMessage, 
  adminMessage, 
  defaultMessage,
  className = "text-sm text-gray-400"
}: SmartRoleMessageProps) {
  const { user, isClient, isDeveloper, isAdmin } = useDjangoAuth();

  if (!user) return null;

  let message = defaultMessage;
  
  if (isClient() && clientMessage) {
    message = clientMessage;
  } else if (isDeveloper() && developerMessage) {
    message = developerMessage;
  } else if (isAdmin() && adminMessage) {
    message = adminMessage;
  }

  if (!message) return null;

  return <div className={className}>{message}</div>;
}

/**
 * Profile Completion Guard - Shows content only if profile is complete
 */
interface ProfileCompletionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireComplete?: boolean;
}

export function ProfileCompletionGuard({ 
  children, 
  fallback, 
  requireComplete = true 
}: ProfileCompletionGuardProps) {
  const { user } = useDjangoAuth();

  if (!user) return null;

  const shouldShow = requireComplete ? user.profile_completed : !user.profile_completed;

  if (!shouldShow) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleAccess() {
  const { user, isClient, isDeveloper, isAdmin, hasRole } = useDjangoAuth();

  return {
    user,
    isClient,
    isDeveloper, 
    isAdmin,
    hasRole,
    canCreateProjects: isClient(),
    canBidOnProjects: isDeveloper(),
    canAccessAdminPanel: isAdmin(),
    isProfileComplete: user?.profile_completed || false,
    needsProfileCompletion: user && !user.profile_completed,
  };
}