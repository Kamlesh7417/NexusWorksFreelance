/**
 * Community Service
 * Handles community events, hackathons, meetups, and virtual meetings
 */

import { apiClient, APIResponse, PaginatedResponse } from '../api-client';

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  event_type: 'meetup' | 'hackathon' | 'workshop' | 'webinar' | 'networking';
  start_date: string;
  end_date: string;
  location?: string;
  is_virtual: boolean;
  max_participants?: number;
  current_participants: number;
  organizer: string;
  skills_focus: string[];
  registration_deadline?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  meeting_url?: string;
  recording_url?: string;
  materials_url?: string;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event: string;
  participant: string;
  registered_at: string;
  attendance_status: 'registered' | 'attended' | 'no_show';
  feedback?: string;
  rating?: number;
}

export interface Hackathon {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_teams: number;
  max_team_size: number;
  current_teams: number;
  prizes: HackathonPrize[];
  judges: string[];
  sponsors: string[];
  rules: string[];
  status: 'registration' | 'ongoing' | 'judging' | 'completed';
  submission_deadline: string;
  created_at: string;
}

export interface HackathonPrize {
  position: number;
  title: string;
  description: string;
  value: number;
  sponsor?: string;
}

export interface HackathonTeam {
  id: string;
  hackathon: string;
  name: string;
  description: string;
  members: TeamMember[];
  leader: string;
  skills_needed: string[];
  is_recruiting: boolean;
  project_idea?: string;
  submission?: HackathonSubmission;
  created_at: string;
}

export interface TeamMember {
  user_id: string;
  username: string;
  role: string;
  skills: string[];
  joined_at: string;
}

export interface HackathonSubmission {
  id: string;
  team: string;
  project_title: string;
  description: string;
  demo_url?: string;
  github_url?: string;
  presentation_url?: string;
  technologies_used: string[];
  submitted_at: string;
  score?: number;
  feedback?: string;
}

export interface VirtualMeeting {
  id: string;
  title: string;
  description: string;
  host: string;
  start_time: string;
  duration_minutes: number;
  meeting_url: string;
  meeting_id: string;
  passcode?: string;
  max_participants?: number;
  current_participants: number;
  is_recording_enabled: boolean;
  recording_url?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  participants: MeetingParticipant[];
  created_at: string;
}

export interface MeetingParticipant {
  user_id: string;
  username: string;
  joined_at?: string;
  left_at?: string;
  duration_minutes?: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  title: string;
  content: string;
  post_type: 'discussion' | 'question' | 'announcement' | 'showcase';
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityComment {
  id: string;
  post: string;
  author: string;
  content: string;
  parent_comment?: string;
  likes_count: number;
  created_at: string;
}

class CommunityService {
  /**
   * Get community events
   */
  async getEvents(filters?: {
    event_type?: string;
    status?: string;
    skills_focus?: string;
    is_virtual?: boolean;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<CommunityEvent>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/community/events/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get event details
   */
  async getEvent(eventId: string): Promise<APIResponse<CommunityEvent>> {
    return apiClient.makeRequest(`/community/events/${eventId}/`);
  }

  /**
   * Create community event
   */
  async createEvent(data: {
    title: string;
    description: string;
    event_type: string;
    start_date: string;
    end_date: string;
    location?: string;
    is_virtual: boolean;
    max_participants?: number;
    skills_focus: string[];
    registration_deadline?: string;
  }): Promise<APIResponse<CommunityEvent>> {
    return apiClient.makeRequest('/community/events/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Register for event
   */
  async registerForEvent(eventId: string): Promise<APIResponse<EventRegistration>> {
    return apiClient.makeRequest(`/community/events/${eventId}/register/`, {
      method: 'POST',
    });
  }

  /**
   * Cancel event registration
   */
  async cancelEventRegistration(eventId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest(`/community/events/${eventId}/cancel-registration/`, {
      method: 'DELETE',
    });
  }

  /**
   * Get user's event registrations
   */
  async getMyRegistrations(): Promise<APIResponse<EventRegistration[]>> {
    return apiClient.makeRequest('/community/registrations/');
  }

  /**
   * Submit event feedback
   */
  async submitEventFeedback(registrationId: string, data: {
    feedback: string;
    rating: number;
  }): Promise<APIResponse<EventRegistration>> {
    return apiClient.makeRequest(`/community/registrations/${registrationId}/feedback/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get hackathons
   */
  async getHackathons(filters?: {
    status?: string;
    theme?: string;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<Hackathon>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/community/hackathons/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get hackathon details
   */
  async getHackathon(hackathonId: string): Promise<APIResponse<Hackathon>> {
    return apiClient.makeRequest(`/community/hackathons/${hackathonId}/`);
  }

  /**
   * Get hackathon teams
   */
  async getHackathonTeams(hackathonId: string): Promise<APIResponse<HackathonTeam[]>> {
    return apiClient.makeRequest(`/community/hackathons/${hackathonId}/teams/`);
  }

  /**
   * Create hackathon team
   */
  async createHackathonTeam(hackathonId: string, data: {
    name: string;
    description: string;
    skills_needed: string[];
    project_idea?: string;
  }): Promise<APIResponse<HackathonTeam>> {
    return apiClient.makeRequest(`/community/hackathons/${hackathonId}/teams/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Join hackathon team
   */
  async joinHackathonTeam(teamId: string, data: {
    role: string;
    message?: string;
  }): Promise<APIResponse<HackathonTeam>> {
    return apiClient.makeRequest(`/community/teams/${teamId}/join/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Leave hackathon team
   */
  async leaveHackathonTeam(teamId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest(`/community/teams/${teamId}/leave/`, {
      method: 'POST',
    });
  }

  /**
   * Submit hackathon project
   */
  async submitHackathonProject(teamId: string, data: {
    project_title: string;
    description: string;
    demo_url?: string;
    github_url?: string;
    presentation_url?: string;
    technologies_used: string[];
  }): Promise<APIResponse<HackathonSubmission>> {
    return apiClient.makeRequest(`/community/teams/${teamId}/submit/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get hackathon submissions
   */
  async getHackathonSubmissions(hackathonId: string): Promise<APIResponse<HackathonSubmission[]>> {
    return apiClient.makeRequest(`/community/hackathons/${hackathonId}/submissions/`);
  }

  /**
   * Create virtual meeting
   */
  async createVirtualMeeting(data: {
    title: string;
    description: string;
    start_time: string;
    duration_minutes: number;
    max_participants?: number;
    is_recording_enabled: boolean;
  }): Promise<APIResponse<VirtualMeeting>> {
    return apiClient.makeRequest('/community/meetings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get virtual meetings
   */
  async getVirtualMeetings(filters?: {
    status?: string;
    host?: string;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<VirtualMeeting>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/community/meetings/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Join virtual meeting
   */
  async joinVirtualMeeting(meetingId: string): Promise<APIResponse<{
    meeting_url: string;
    meeting_id: string;
    passcode?: string;
  }>> {
    return apiClient.makeRequest(`/community/meetings/${meetingId}/join/`, {
      method: 'POST',
    });
  }

  /**
   * End virtual meeting
   */
  async endVirtualMeeting(meetingId: string): Promise<APIResponse<VirtualMeeting>> {
    return apiClient.makeRequest(`/community/meetings/${meetingId}/end/`, {
      method: 'POST',
    });
  }

  /**
   * Get community posts
   */
  async getCommunityPosts(filters?: {
    post_type?: string;
    tags?: string;
    author?: string;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<CommunityPost>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/community/posts/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Create community post
   */
  async createCommunityPost(data: {
    title: string;
    content: string;
    post_type: string;
    tags: string[];
  }): Promise<APIResponse<CommunityPost>> {
    return apiClient.makeRequest('/community/posts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get post comments
   */
  async getPostComments(postId: string): Promise<APIResponse<CommunityComment[]>> {
    return apiClient.makeRequest(`/community/posts/${postId}/comments/`);
  }

  /**
   * Create comment
   */
  async createComment(postId: string, data: {
    content: string;
    parent_comment?: string;
  }): Promise<APIResponse<CommunityComment>> {
    return apiClient.makeRequest(`/community/posts/${postId}/comments/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Like post
   */
  async likePost(postId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest(`/community/posts/${postId}/like/`, {
      method: 'POST',
    });
  }

  /**
   * Unlike post
   */
  async unlikePost(postId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest(`/community/posts/${postId}/unlike/`, {
      method: 'POST',
    });
  }

  /**
   * Like comment
   */
  async likeComment(commentId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest(`/community/comments/${commentId}/like/`, {
      method: 'POST',
    });
  }

  /**
   * Get community stats
   */
  async getCommunityStats(): Promise<APIResponse<{
    total_members: number;
    active_events: number;
    upcoming_hackathons: number;
    total_posts: number;
    monthly_growth: number;
  }>> {
    return apiClient.makeRequest('/community/stats/');
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(): Promise<APIResponse<{
    topics: string[];
    popular_skills: string[];
    active_discussions: CommunityPost[];
  }>> {
    return apiClient.makeRequest('/community/trending/');
  }
}

export const communityService = new CommunityService();
export default communityService;