'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'developer' | 'admin';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/auth/signin' 
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push(redirectTo);
          return;
        }

        // If role is required, check user profile
        if (requiredRole) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profileError || !profile) {
            router.push('/onboarding');
            return;
          }

          if (profile.role !== requiredRole && requiredRole !== 'admin') {
            router.push('/dashboard'); // Redirect to appropriate dashboard
            return;
          }
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push(redirectTo);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase, requiredRole, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}