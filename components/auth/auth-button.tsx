'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, LogOut, Settings, Github, Loader2, Bell, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { NotificationBadge } from '../ui/notification-badge';

export function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(profile);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profile);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email'
        }
      });

      if (error) {
        console.error('Sign in error:', error);
      }
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
        <Link 
          href="/auth/signin"
          className="text-gray-300 hover:text-white transition-colors"
        >
          Sign In
        </Link>
        <button
          onClick={handleSignIn}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          <Github size={16} />
          Get Started
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
          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg px-3 py-2 transition-all"
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.full_name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
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
        <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 border border-white/20 rounded-xl shadow-xl backdrop-blur-lg z-50 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <User size={20} className="text-cyan-400" />
                </div>
              )}
              <div>
                <div className="font-medium text-white">{profile?.full_name || user.email?.split('@')[0]}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <a 
              href="/dashboard" 
              className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Dashboard
            </a>
            <a 
              href="/profile" 
              className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Profile
            </a>
            <a 
              href="/messages" 
              className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <MessageSquare size={16} />
              Messages
            </a>
            <a 
              href="/settings" 
              className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Settings size={16} />
              Settings
            </a>
          </div>

          <div className="border-t border-white/10 p-2">
            <button 
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 w-full text-left rounded-lg transition-colors"
            >
              {signingOut ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
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