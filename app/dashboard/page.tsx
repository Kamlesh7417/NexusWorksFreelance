'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ClientDashboard } from '@/components/client/client-dashboard';
import { DeveloperDashboard } from '@/components/developer/developer-dashboard';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/auth/signin');
          return;
        }

        setUser(user);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          router.push('/onboarding');
          return;
        }

        // Check if profile is complete
        if (!profile.skills || profile.skills.length === 0) {
          router.push('/onboarding');
          return;
        }

        setProfile(profile);
      } catch (error) {
        console.error('Dashboard error:', error);
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Unable to load your profile</p>
          <Link 
            href="/auth/signin"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  if (profile.role === 'client') {
    return <ClientDashboard user={user} profile={profile} />;
  } else {
    return <DeveloperDashboard user={user} profile={profile} />;
  }
}