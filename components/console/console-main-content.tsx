'use client';

import { Suspense, lazy, memo, useState, useEffect } from 'react';
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

// Import the new profile management components
const ProfileManagement = lazy(() => import('../profile/profile-management').then(module => ({ default: module.ProfileManagement })));
const SkillsManager = lazy(() => import('../profile/skills-manager').then(module => ({ default: module.SkillsManager })));
const ResumeUploader = lazy(() => import('../profile/resume-uploader').then(module => ({ default: module.ResumeUploader })));
const GitHubIntegration = lazy(() => import('../profile/github-integration').then(module => ({ default: module.GitHubIntegration })));

// Enhanced Dashboard Section with real data and quick actions - memoized for performance
const DashboardSection = memo(function DashboardSection() {
  const { setCurrentSection } = useConsole();
  const { user } = useDjangoAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch real profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setProfileLoading(true);
        const { apiClient } = await import('@/lib/api-client');

        // Fetch developer profile if user is a developer
        if (user.user_type === 'freelancer' || user.role === 'developer') {
          const profileResponse = await apiClient.getDeveloperProfile();
          if (profileResponse.data) {
            setProfile(profileResponse.data);
          } else {
            setProfile(user); // Fallback to user data
          }
        } else {
          // For clients, use user data as profile
          setProfile(user);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(user); // Fallback to user data
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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
            {/* Only clients can create projects */}
            {(user?.user_type === 'client' || user?.role === 'client') && (
              <button
                onClick={() => handleQuickAction('new-project')}
                className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors"
              >
                <FolderPlus size={16} />
                New Project
              </button>
            )}
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
        {profileLoading ? (
          <SkeletonDashboard />
        ) : (
          <Suspense fallback={<SkeletonDashboard />}>
            <UnifiedDashboard user={user} profile={profile} />
          </Suspense>
        )}
      </div>
    </div>
  );
});

// Memoized section components for performance
const ProfileSection = memo(function ProfileSection() {
  const { user, isDeveloper } = useDjangoAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Fetch real profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setProfileLoading(true);
        const { apiClient } = await import('@/lib/api-client');

        // Fetch developer profile if user is a developer
        if (user.user_type === 'freelancer' || user.role === 'developer') {
          const profileResponse = await apiClient.getDeveloperProfile();
          if (profileResponse.data) {
            setProfile(profileResponse.data);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleProfileUpdate = () => {
    // Refresh profile data after updates
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { apiClient } = await import('@/lib/api-client');

        if (user.user_type === 'freelancer' || user.role === 'developer') {
          const profileResponse = await apiClient.getDeveloperProfile();
          if (profileResponse.data) {
            setProfile(profileResponse.data);
          }
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    };

    fetchProfile();
  };

  if (profileLoading) {
    return <SkeletonProfile />;
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'skills', label: 'Skills', developerOnly: true },
    { id: 'resume', label: 'Resume', developerOnly: true },
    { id: 'github', label: 'GitHub', developerOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.developerOnly || isDeveloper());

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-2">Profile Management</h1>
        <p className="text-gray-400">Manage your profile and account settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700/50">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 transition-colors ${activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Suspense fallback={<SkeletonProfile />}>
          {activeTab === 'general' && (
            <ProfileManagement
              user={user}
              profile={profile}
              onUpdate={handleProfileUpdate}
            />
          )}

          {activeTab === 'skills' && isDeveloper() && (
            <SkillsManager
              user={user}
              profile={profile}
              onUpdate={handleProfileUpdate}
            />
          )}

          {activeTab === 'resume' && isDeveloper() && (
            <ResumeUploader
              user={user}
              onUpdate={handleProfileUpdate}
            />
          )}

          {activeTab === 'github' && isDeveloper() && (
            <GitHubIntegration
              user={user}
              onUpdate={handleProfileUpdate}
            />
          )}
        </Suspense>
      </div>
    </div>
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