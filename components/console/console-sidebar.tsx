'use client';

import { useState } from 'react';
import { useConsole, ConsoleSection } from './unified-console';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  LayoutDashboard, 
  User, 
  MessageSquare, 
  FolderOpen, 
  CreditCard, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation item interface
interface NavigationItem {
  id: ConsoleSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  permissions?: string[];
  quickActions?: QuickAction[];
}

// Quick action interface
interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export function ConsoleSidebar() {
  const { state, setCurrentSection, toggleSidebar } = useConsole();
  const { user, hasRole } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Navigation items configuration
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      quickActions: [
        {
          id: 'create-project',
          label: 'Create Project',
          icon: Plus,
          onClick: () => {
            // TODO: Implement quick project creation
            console.log('Create project');
          }
        }
      ]
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: 0, // TODO: Get actual unread count
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderOpen,
      quickActions: [
        {
          id: 'new-project',
          label: 'New Project',
          icon: Plus,
          onClick: () => {
            // TODO: Navigate to project creation
            setCurrentSection('projects');
          }
        }
      ]
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Filter items based on user permissions
  const visibleItems = navigationItems.filter(item => {
    if (!item.permissions) return true;
    return item.permissions.some(permission => hasRole(permission));
  });

  const handleItemClick = (itemId: ConsoleSection) => {
    setCurrentSection(itemId);
  };

  return (
    <div className={cn(
      "bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col",
      state.sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!state.sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white font-semibold">NexusWorks</span>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title={state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {state.sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.currentSection === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                  isActive 
                    ? "bg-cyan-600 text-white shadow-lg" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
                title={state.sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400"
                )} />
                
                {!state.sidebarCollapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Quick actions dropdown */}
              {!state.sidebarCollapsed && item.quickActions && isHovered && (
                <div className="absolute left-full top-0 ml-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[160px] z-50">
                  {item.quickActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        <ActionIcon className="w-4 h-4" />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-gray-800">
        {!state.sidebarCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role || 'Member'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}