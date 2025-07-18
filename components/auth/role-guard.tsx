'use client';

import React, { ReactNode } from 'react';
import { useDjangoAuth } from './django-auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null, 
  redirectTo,
  requireAuth = true 
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useDjangoAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated && redirectTo) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, requireAuth, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  // Check role permissions
  if (user && !allowedRoles.includes(user.user_type)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Specific role guards
export function ClientOnlyGuard({ children, fallback, redirectTo }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['client']} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
}

export function DeveloperOnlyGuard({ children, fallback, redirectTo }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['developer']} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
}

export function AdminOnlyGuard({ children, fallback, redirectTo }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
}

export function AuthenticatedGuard({ children, fallback, redirectTo }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['client', 'developer', 'admin']} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
}

// Component to conditionally render based on roles
interface ConditionalRenderProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  fallback?: ReactNode;
}

export function ConditionalRender({ 
  children, 
  allowedRoles = ['client', 'developer', 'admin'], 
  requireAuth = true,
  fallback = null 
}: ConditionalRenderProps) {
  const { user, isAuthenticated, isLoading } = useDjangoAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (user && !allowedRoles.includes(user.user_type)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}