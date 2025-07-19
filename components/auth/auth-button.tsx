'use client';

import { useState } from 'react';
import { User, LogOut, Settings, Github, Loader2, Bell, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './auth-provider';

// Simple notification badge component
function NotificationBadge({ userId }: { userId: string }) {
  // For now, show a static notification count
  // In the future, this would fetch real notifications from the backend
  const notificationCount = 3;

  return (
    <div className="relative">
      <Bell size={20} className="text-gray-400 hover:text-white transition-colors cursor-pointer" />
      {notificationCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {notificationCount > 9 ? '9+' : notificationCount}
        </span>
      )}
    </div>
  );
}

export function AuthButton() {
  const { user, profile, signOut, signIn, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={handleSignIn}
          className="nexus-action-btn"
        >
          <Github size={16} />
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        {/* Notifications */}
        {user && <NotificationBadge userId={user.id} />}
        
        {/* Messages */}
        <Link href="/messages" className="relative">
          <MessageSquare size={20} className="text-gray-400 hover:text-white transition-colors" />
        </Link>
        
        {/* User Menu */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 nexus-card px-3 py-2 hover:scale-105 transition-all duration-300"
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.full_name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
              <User size={16} className="text-cyan-400" />
            </div>
          )}
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-white">
              {profile?.full_name || user.email?.split('@')[0]}
            </div>
            <div className="text-xs text-gray-400 capitalize">
              {profile?.role || 'User'}
            </div>
          </div>
        </button>
      </div>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 nexus-card z-50 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                  <User size={20} className="text-cyan-400" />
                </div>
              )}
              <div>
                <div className="font-medium text-white">{profile?.full_name || user.email?.split('@')[0]}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
                <div className="text-xs text-cyan-400 capitalize font-medium">{profile?.role || 'User'}</div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <a 
              href="/dashboard" 
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center">
                <Settings size={12} className="text-blue-400" />
              </div>
              Dashboard
            </a>
            <a 
              href="/profile" 
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <div className="w-5 h-5 bg-purple-500/20 rounded flex items-center justify-center">
                <User size={12} className="text-purple-400" />
              </div>
              Profile
            </a>
            <a 
              href="/messages" 
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center">
                <MessageSquare size={12} className="text-green-400" />
              </div>
              Messages
            </a>
            <a 
              href="/projects" 
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <div className="w-5 h-5 bg-cyan-500/20 rounded flex items-center justify-center">
                <Github size={12} className="text-cyan-400" />
              </div>
              Projects
            </a>
          </div>

          <div className="border-t border-white/10 p-2">
            <button 
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 w-full text-left rounded-lg transition-colors"
            >
              {signingOut ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <div className="w-5 h-5 bg-red-500/20 rounded flex items-center justify-center">
                  <LogOut size={12} className="text-red-400" />
                </div>
              )}
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}