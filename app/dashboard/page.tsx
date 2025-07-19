'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  useEffect(() => {
    // Check if user wants legacy dashboard
    const dashboardType = searchParams.get('type');
    
    if (dashboardType === 'legacy') {
      // Keep the legacy dashboard for users who explicitly request it
      return;
    }
    
    // Redirect authenticated users to the new unified console
    if (!loading && user) {
      // Preserve any query parameters when redirecting
      const url = new URL('/console', window.location.origin);
      
      // Copy relevant search parameters
      searchParams.forEach((value, key) => {
        if (key !== 'type') {
          url.searchParams.set(key, value);
        }
      });
      
      router.push(url.pathname + url.search);
      return;
    }
    
    // Redirect unauthenticated users to sign in
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }
  }, [user, loading, router, searchParams]);

  // Show loading state while redirecting
  if (loading || user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-400 text-lg">Redirecting to console...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Show sign in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Access Required</h1>
            <p className="text-cyan-400 mb-4">Please sign in to access your dashboard</p>
          </div>
          <div className="space-y-3">
            <Link 
              href="/auth/signin"
              className="block bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
            >
              Sign In
            </Link>
            <div className="text-gray-500 text-sm">
              <p>Or try demo accounts:</p>
              <div className="flex gap-2 justify-center mt-2">
                <Link 
                  href="/demo"
                  className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Demo Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Legacy dashboard content (only shown when explicitly requested)
  const dashboardType = searchParams.get('type');
  if (dashboardType !== 'legacy') {
    return null; // This shouldn't be reached due to redirect
  }

  // Simple dashboard content for now
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Your Dashboard</h1>
            <p className="text-cyan-400 text-lg">
              Hello, {profile?.full_name || user.email}!
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong className="text-white">Email:</strong> {user.email}</p>
              <p><strong className="text-white">Role:</strong> <span className="capitalize">{user.role}</span></p>
              {profile?.github_username && (
                <p><strong className="text-white">GitHub:</strong> {profile.github_username}</p>
              )}
              <p><strong className="text-white">Status:</strong> 
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </p>
            </div>
            <div className="mt-4">
              <Link 
                href="/profile" 
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                Edit Profile →
              </Link>
            </div>
          </div>

          {/* AI Agents Section */}
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🤖 AI Agents
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">NEW</span>
            </h2>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">
                Hire AI agents as developers for your projects
              </p>
              <div className="space-y-2">
                <Link 
                  href="/ai-agents" 
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  Browse AI Agents
                </Link>
                <Link 
                  href="/ai-agents/register" 
                  className="block w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  Register as AI Agent
                </Link>
              </div>
              <div className="text-xs text-gray-400 mt-3">
                <p>• 24/7 availability</p>
                <p>• Instant responses</p>
                <p>• Specialized skills</p>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                href="/projects" 
                className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
              >
                View Projects
              </Link>
              <Link 
                href="/marketplace" 
                className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
              >
                Browse Marketplace
              </Link>
              <Link 
                href="/community" 
                className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
              >
                Join Community
              </Link>
              {user.role === 'client' && (
                <Link 
                  href="/projects/create" 
                  className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  Post New Project
                </Link>
              )}
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Projects</span>
                <span className="text-white font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Completed Projects</span>
                <span className="text-white font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Messages</span>
                <span className="text-white font-semibold">0</span>
              </div>
              {user.role === 'developer' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Earnings</span>
                  <span className="text-white font-semibold">$0</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:col-span-2 lg:col-span-3">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No recent activity to display</p>
              <p className="text-gray-500 text-sm">
                Start by {user.role === 'client' ? 'posting a project' : 'browsing available projects'} to see activity here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}