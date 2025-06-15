'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, User, Briefcase, Settings, LogOut, Home } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { LoginButton } from '@/components/auth/login-button';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-400 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/80 border-b border-white/10 backdrop-blur-lg p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-xl font-bold text-white">NexusWorks</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-4">
              <a href="/dashboard" className="text-white hover:text-cyan-400 transition-colors">Dashboard</a>
              <a href="/projects" className="text-white hover:text-cyan-400 transition-colors">Projects</a>
              <a href="/messages" className="text-white hover:text-cyan-400 transition-colors">Messages</a>
              <a href="/community" className="text-white hover:text-cyan-400 transition-colors">Community</a>
            </nav>
            
            {session ? (
              <UserMenu user={session.user} />
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Welcome, {session?.user?.name || 'Developer'}!</h2>
          <p className="text-gray-300 mb-6">
            Your NexusWorks dashboard gives you access to projects, messages, and community resources.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-cyan-500/30 transition-colors">
              <Briefcase size={24} className="text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Your Projects</h3>
              <p className="text-gray-400 text-sm mb-4">Manage your active projects and proposals</p>
              <button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 py-2 rounded-lg transition-colors">
                View Projects
              </button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-cyan-500/30 transition-colors">
              <User size={24} className="text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Your Profile</h3>
              <p className="text-gray-400 text-sm mb-4">Update your skills, portfolio and availability</p>
              <button className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 py-2 rounded-lg transition-colors">
                Edit Profile
              </button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-cyan-500/30 transition-colors">
              <Settings size={24} className="text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Account Settings</h3>
              <p className="text-gray-400 text-sm mb-4">Manage your account preferences and security</p>
              <button className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 py-2 rounded-lg transition-colors">
                Settings
              </button>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-4 text-left transition-colors">
                <div className="font-medium text-white mb-1">Find Projects</div>
                <div className="text-sm text-gray-400">Browse available projects</div>
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-4 text-left transition-colors">
                <div className="font-medium text-white mb-1">Create Project</div>
                <div className="text-sm text-gray-400">Post a new project</div>
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-4 text-left transition-colors">
                <div className="font-medium text-white mb-1">Messages</div>
                <div className="text-sm text-gray-400">Check your inbox</div>
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-4 text-left transition-colors">
                <div className="font-medium text-white mb-1">Payments</div>
                <div className="text-sm text-gray-400">Manage transactions</div>
              </button>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Account Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Account Type:</span>
                <span className="text-white font-medium capitalize">{session?.user?.role || 'Developer'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">GitHub:</span>
                <span className="text-white font-medium">{session?.user?.profile?.github_username || 'Connected'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Email:</span>
                <span className="text-white font-medium">{session?.user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Member Since:</span>
                <span className="text-white font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Back to Home */}
        <div className="flex justify-center">
          <a 
            href="/"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors"
          >
            <Home size={16} />
            Back to Home
          </a>
        </div>
      </main>
    </div>
  );
}