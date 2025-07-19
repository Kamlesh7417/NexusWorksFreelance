'use client';

import { Suspense, lazy, memo } from 'react';
import { useConsole } from './unified-console';
import { useDjangoAuth } from '../auth/django-auth-provider';
import { SectionErrorBoundary } from './error-boundary';
import { SectionLoader, SkeletonDashboard, SkeletonProfile, LoadingOverlay } from './loading-states';
import { Loader2, MessageSquare, FolderPlus, Settings as SettingsIcon } from 'lucide-react';
import { usePerformanceOptimization } from '@/lib/hooks/use-performance-optimization';

// Lazy load section components for code splitting
const ProfileManager = lazy(() => import('./profile-manager').then(module => ({ default: module.ProfileManager })));
const MessageCenter = lazy(() => import('./message-center').then(module => ({ default: module.MessageCenter })));
const ProjectManager = lazy(() => import('./project-manager').then(module => ({ default: module.ProjectManager })));
const PaymentManagementInterface = lazy(() => import('../payments/payment-management-interface').then(module => ({ default: module.PaymentManagementInterface })));
const UnifiedDashboard = lazy(() => import('../dashboard/unified-dashboard').then(module => ({ default: module.UnifiedDashboard })));

// Enhanced Dashboard Section with real data and quick actions - memoized for performance
const DashboardSection = memo(function DashboardSection() {
  const { setCurrentSection } = useConsole();
  const { user } = useDjangoAuth();
  const profile = user; // In Django auth, user contains profile info
  
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-project':
        setCurrentSection('projects');
        break;
      case 'message':
        setCurrentSection('messages');
        break;
      case 'settings':
        setCurrentSection('settings');
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="h-full overflow-y-auto">
      {/* Quick Actions Bar */}
      <div className="bg-gray-900/50 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
            <p className="text-gray-400 text-sm">
              Welcome back, {profile?.first_name && profile?.last_name 
                ? `${profile.first_name} ${profile.last_name}` 
                : user?.username || user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleQuickAction('new-project')}
              className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors"
            >
              <FolderPlus size={16} />
              New Project
            </button>
            <button 
              onClick={() => handleQuickAction('message')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <MessageSquare size={16} />
              Message
            </button>
            <button 
              onClick={() => handleQuickAction('settings')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <SettingsIcon size={16} />
              Settings
            </button>
          </div>
        </div>
      </div>
      
      {/* Unified Dashboard Content */}
      <div className="flex-1 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Suspense fallback={<SkeletonDashboard />}>
          <UnifiedDashboard user={user} profile={profile} />
        </Suspense>
      </div>
    </div>
  );
});

// Memoized section components for performance
const ProfileSection = memo(function ProfileSection() {
  return (
    <Suspense fallback={<SkeletonProfile />}>
      <ProfileManager />
    </Suspense>
  );
});

const MessagesSection = memo(function MessagesSection() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-2">Messages</h1>
        <p className="text-gray-400">Manage your conversations and communications</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<SectionLoader message="Loading messages..." />}>
          <MessageCenter />
        </Suspense>
      </div>
    </div>
  );
});

const ProjectsSection = memo(function ProjectsSection() {
  return (
    <Suspense fallback={<SectionLoader message="Loading projects..." />}>
      <ProjectManager />
    </Suspense>
  );
});

const PaymentsSection = memo(function PaymentsSection() {
  const { user } = useDjangoAuth();
  const userRole = user?.user_type || 'developer';
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <Suspense fallback={<SectionLoader message="Loading payments..." />}>
          <PaymentManagementInterface 
            userRole={userRole as 'client' | 'developer' | 'admin'}
          />
        </Suspense>
      </div>
    </div>
  );
});

const SettingsSection = memo(function SettingsSection() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure your account and application preferences</p>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400">Settings interface will be implemented here</p>
      </div>
    </div>
  );
});

export function ConsoleMainContent() {
  const { state } = useConsole();
  const { createDebouncedCallback } = usePerformanceOptimization('ConsoleMainContent');

  // Render the appropriate section based on current selection with error boundaries
  const renderSection = () => {
    switch (state.currentSection) {
      case 'dashboard':
        return (
          <SectionErrorBoundary section="dashboard">
            <DashboardSection />
          </SectionErrorBoundary>
        );
      case 'profile':
        return (
          <SectionErrorBoundary section="profile">
            <ProfileSection />
          </SectionErrorBoundary>
        );
      case 'messages':
        return (
          <SectionErrorBoundary section="messages">
            <MessagesSection />
          </SectionErrorBoundary>
        );
      case 'projects':
        return (
          <SectionErrorBoundary section="projects">
            <ProjectsSection />
          </SectionErrorBoundary>
        );
      case 'payments':
        return (
          <SectionErrorBoundary section="payments">
            <PaymentsSection />
          </SectionErrorBoundary>
        );
      case 'settings':
        return (
          <SectionErrorBoundary section="settings">
            <SettingsSection />
          </SectionErrorBoundary>
        );
      default:
        return (
          <SectionErrorBoundary section="dashboard">
            <DashboardSection />
          </SectionErrorBoundary>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-black">
      {renderSection()}
    </div>
  );
}