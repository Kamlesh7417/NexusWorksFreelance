'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Settings, Briefcase, MessageSquare, User as UserIcon, Github } from 'lucide-react';

interface UserMenuProps {
  user: any;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 transition-colors"
      >
        {user.image ? (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <UserIcon size={16} className="text-cyan-400" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-black/90 border border-white/20 rounded-xl shadow-xl backdrop-blur-lg z-50 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {user.image ? (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <UserIcon size={20} className="text-cyan-400" />
                </div>
              )}
              <div>
                <div className="font-medium text-white">{user.name}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <a 
              href="/dashboard" 
              className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Briefcase size={16} />
              Dashboard
            </a>
            <a 
              href="/profile" 
              className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <UserIcon size={16} />
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
              className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 w-full text-left rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}