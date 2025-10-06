'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';
import { apiClient, DeveloperProfile } from '@/lib/api-client';
import { useSmartNotifications } from '@/lib/services/smart-notifications';
import { ProfileManagement } from '@/components/profile/profile-management';
import { SkillsManager } from '@/components/profile/skills-manager';
import { ResumeUploader } from '@/components/profile/resume-uploader';
import { GitHubIntegration } from '@/components/profile/github-integration';
import { 
  User, 
  Save, 
  Loader2, 
  ArrowLeft, 
  Settings, 
  Code, 
  FileText, 
  Github,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, isDeveloper } = useDjangoAuth();
  const { showSuccess, showError } = useSmartNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Get active tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['general', 'skills', 'resume', 'github'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      router.push('/auth/signin');
      return;
    }

    loadProfileData();
  }, [user, isAuthenticated, authLoading, router]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load developer profile if user is a developer
      if (isDeveloper()) {
        const response = await apiClient.getDeveloperProfile();
        if (response.data) {
          setProfile(response.data);
        }
      }
      
      // Calculate profile completion
      calculateProfileCompletion();
      
    } catch (error) {
      console.error('Error loading profile data:', error);
      showError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    if (!user) return;
    
    let completion = 0;
    const totalFields = 7;
    
    // Basic info
    if (user.first_name && user.last_name) completion++;
    if (user.bio) completion++;
    if (user.location) completion++;
    
    // Developer-specific fields
    if (isDeveloper()) {
      if (profile?.skills && profile.skills.length > 0) completion++;
      if (profile?.hourly_rate && profile.hourly_rate > 0) completion++;
      if (user.github_username) completion++;
      // Resume upload would be checked here when implemented
      completion++; // Placeholder for resume
    } else {
      completion += 3; // Skip developer-specific fields for clients
    }
    
    setProfileCompletion(Math.round((completion / totalFields) * 100));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please sign in to view your profile</p>
          <Link href="/auth/signin" className="text-cyan-400 hover:text-cyan-300">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'skills', label: 'Skills', icon: Code, developerOnly: true },
    { id: 'resume', label: 'Resume', icon: FileText, developerOnly: true },
    { id: 'github', label: 'GitHub', icon: Github, developerOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.developerOnly || isDeveloper());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Profile Management</h1>
              <p className="text-gray-400">Manage your profile and account settings</p>
            </div>
            
            {/* Profile Completion */}
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                {user.profile_completed ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                )}
                <span className="text-sm text-gray-400">
                  Profile {profileCompletion}% complete
                </span>
              </div>
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center">
              <User size={32} className="text-cyan-400" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white mb-1">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user.username
                }
              </h2>
              <p className="text-cyan-400 capitalize mb-1">
                {user.role || user.user_type}
              </p>
              <p className="text-gray-400 text-sm">{user.email}</p>
              {user.location && (
                <p className="text-gray-400 text-sm">{user.location}</p>
              )}
            </div>
            
            {isDeveloper() && profile && (
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  ${profile.hourly_rate || 0}/hr
                </div>
                <div className="text-sm text-gray-400">
                  {profile.reputation_score.toFixed(1)}/5.0 rating
                </div>
                <div className="text-sm text-gray-400">
                  {profile.availability_status}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'general' && (
              <ProfileManagement 
                user={user} 
                profile={profile}
                onUpdate={loadProfileData}
              />
            )}
            
            {activeTab === 'skills' && isDeveloper() && (
              <SkillsManager 
                user={user}
                profile={profile}
                onUpdate={loadProfileData}
              />
            )}
            
            {activeTab === 'resume' && isDeveloper() && (
              <ResumeUploader 
                user={user}
                onUpdate={loadProfileData}
              />
            )}
            
            {activeTab === 'github' && isDeveloper() && (
              <GitHubIntegration 
                user={user}
                onUpdate={loadProfileData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}