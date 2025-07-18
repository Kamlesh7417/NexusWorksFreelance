/**
 * User Profile Synchronization Service
 * Handles syncing user data between Next.js frontend and Django backend
 */

import { DjangoUser } from '@/components/auth/django-auth-provider';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  hourly_rate?: number;
  availability_hours_per_week?: number;
  user_type?: 'client' | 'developer' | 'admin';
}

export interface SkillData {
  skill_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience: number;
  is_primary: boolean;
}

class AuthSyncService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Request failed');
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async updateProfile(accessToken: string, profileData: ProfileUpdateData) {
    return this.request('/users/profile/update/', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(profileData),
    });
  }

  async getUserProfile(accessToken: string): Promise<{ data: DjangoUser | null; error: string | null }> {
    return this.request('/auth/user/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async updateUserSkills(accessToken: string, skills: SkillData[]) {
    return this.request('/users/skills/bulk-update/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ skills }),
    });
  }

  async getUserSkills(accessToken: string) {
    return this.request('/users/skills/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async triggerGithubAnalysis(accessToken: string) {
    return this.request('/ai-services/analyze-github/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async getAvailableSkills() {
    return this.request('/users/skills/available/', {
      method: 'GET',
    });
  }

  async uploadResume(accessToken: string, resumeFile: File) {
    const formData = new FormData();
    formData.append('resume', resumeFile);

    return this.request('/ai-services/upload-resume/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });
  }

  async completeOnboarding(accessToken: string, onboardingData: {
    skills: SkillData[];
    bio: string;
    hourly_rate?: number;
    availability_hours_per_week?: number;
    location?: string;
    timezone?: string;
  }) {
    // Update profile first
    const profileResult = await this.updateProfile(accessToken, {
      bio: onboardingData.bio,
      hourly_rate: onboardingData.hourly_rate,
      availability_hours_per_week: onboardingData.availability_hours_per_week,
      location: onboardingData.location,
      timezone: onboardingData.timezone,
    });

    if (profileResult.error) {
      return profileResult;
    }

    // Update skills
    const skillsResult = await this.updateUserSkills(accessToken, onboardingData.skills);

    if (skillsResult.error) {
      return skillsResult;
    }

    // Mark profile as completed
    return this.request('/users/profile/complete/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async getProjectMatches(accessToken: string, projectId?: string) {
    const endpoint = projectId 
      ? `/matching/project-matches/${projectId}/`
      : '/matching/developer-matches/';
    
    return this.request(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async getUserProjects(accessToken: string, status?: string) {
    const endpoint = status 
      ? `/projects/?status=${status}`
      : '/projects/';
    
    return this.request(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async createProject(accessToken: string, projectData: {
    title: string;
    description: string;
    budget_min?: number;
    budget_max?: number;
    timeline_weeks?: number;
    required_skills?: string[];
  }) {
    return this.request('/projects/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(projectData),
    });
  }

  async getNotifications(accessToken: string, unread_only = false) {
    const endpoint = unread_only 
      ? '/communications/notifications/?unread_only=true'
      : '/communications/notifications/';
    
    return this.request(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async markNotificationRead(accessToken: string, notificationId: string) {
    return this.request(`/communications/notifications/${notificationId}/mark-read/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }
}

// Export singleton instance
export const authSyncService = new AuthSyncService(DJANGO_API_URL);

// Helper functions for common operations
export async function syncUserProfile(accessToken: string): Promise<DjangoUser | null> {
  const result = await authSyncService.getUserProfile(accessToken);
  return result.data;
}

export async function updateUserProfile(accessToken: string, updates: ProfileUpdateData): Promise<boolean> {
  const result = await authSyncService.updateProfile(accessToken, updates);
  return !result.error;
}

export async function completeUserOnboarding(
  accessToken: string, 
  onboardingData: Parameters<typeof authSyncService.completeOnboarding>[1]
): Promise<boolean> {
  const result = await authSyncService.completeOnboarding(accessToken, onboardingData);
  return !result.error;
}

export default authSyncService;