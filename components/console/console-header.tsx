'use client';

import { useState, useRef, useEffect } from 'react';
import { useConsole } from './unified-console';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';
import { NotificationCenter } from './notification-center';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Home,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConsoleHeader() {
  const { state, setSearchQuery } = useConsole();
  const { user, logout } = useDjangoAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }

    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get section title
  const getSectionTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      profile: 'Profile',
      messages: 'Messages',
      projects: 'Projects',
      payments: 'Payments',
      settings: 'Settings',
    };
    return titles[state.currentSection] || 'Console';
  };

  // Get breadcrumb items
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Console', icon: Home, href: '#' },
      { label: getSectionTitle(), icon: null, href: '#' }
    ];
    return breadcrumbs;
  };

  const handleSignOut = async () => {
    await logout();
    setShowUserMenu(false);
  };



  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumbs and title */}
        <div className="flex items-center space-x-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm">
            {getBreadcrumbs().map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <div className="flex items-center space-x-1">
                  {item.icon && (
                    <item.icon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={cn(
                    index === getBreadcrumbs().length - 1 
                      ? "text-white font-medium" 
                      : "text-gray-400 hover:text-gray-300"
                  )}>
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Right side - Search, notifications, user menu */}
        <div className="flex items-center space-x-4">
          {/* Global search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={state.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-64"
            />
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">
                  {user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {user?.role || user?.user_type || 'Member'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* User menu dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm font-medium text-white">
                    {user?.first_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user?.email}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    // TODO: Navigate to profile section
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Navigate to settings section
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                
                <div className="border-t border-gray-700 mt-2 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}