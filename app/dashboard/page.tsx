'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UnifiedDashboard } from '@/components/dashboard/unified-dashboard';
import { ClientDashboard } from '@/components/client/client-dashboard';
import { DeveloperDashboard } from '@/components/developer/developer-dashboard';
import { Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [useUnifiedDashboard, setUseUnifiedDashboard] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
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
        
        // Check URL parameter for dashboard type
        const dashboardType = searchParams.get('type');
        if (dashboardType === 'legacy') {
          setUseUnifiedDashboard(false);
        }
      } catch (error) {
        console.error('Dashboard error:', error);
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, supabase, searchParams]);

  const toggleDashboard = () => {
    const newType = useUnifiedDashboard ? 'legacy' : 'unified';
    setUseUnifiedDashboard(!useUnifiedDashboard);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    if (newType === 'legacy') {
      url.searchParams.set('type', 'legacy');
    } else {
      url.searchParams.delete('type');
    }
    window.history.replaceState({}, '', url.toString());
  };

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

  // Dashboard toggle button (fixed position)
  const DashboardToggle = () => (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={toggleDashboard}
        className="flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-all duration-200"
        title={`Switch to ${useUnifiedDashboard ? 'Legacy' : 'Unified'} Dashboard`}
      >
        {useUnifiedDashboard ? <ToggleRight size={20} className="text-cyan-400" /> : <ToggleLeft size={20} className="text-gray-400" />}
        <span className="text-sm">
          {useUnifiedDashboard ? 'Unified' : 'Legacy'} Dashboard
        </span>
      </button>
    </div>
  );

  // Render unified dashboard or legacy dashboard based on toggle
  if (useUnifiedDashboard) {
    return (
      <>
        <DashboardToggle />
        <UnifiedDashboard user={user} profile={profile} />
      </>
    );
  }

  // Render legacy role-specific dashboard
  return (
    <>
      <DashboardToggle />
      {profile.role === 'client' ? (
        <ClientDashboard user={user} profile={profile} />
      ) : (
        <DeveloperDashboard user={user} profile={profile} />
      )}
    </>
  );
}