/**
 * Matching Service
 * Handles AI-powered developer-project matching operations
 */

import { apiClient, DeveloperMatch, APIResponse } from '../api-client';

export interface MatchingPreferences {
  preferred_hourly_rate_min?: number;
  preferred_hourly_rate_max?: number;
  preferred_experience_levels?: ('junior' | 'mid' | 'senior' | 'expert')[];
  required_skills?: string[];
  preferred_skills?: string[];
  availability_requirement?: 'available' | 'any';
  location_preference?: string;
  timezone_preference?: string;
}

export interface MatchingFilters {
  min_score?: number;
  max_results?: number;
  include_unavailable?: boolean;
  skill_weight?: number;
  experience_weight?: number;
  availability_weight?: number;
}

export interface DetailedMatch extends DeveloperMatch {
  developer_profile: {
    user: {
      id: string;
      email: string;
      github_username?: string;
    };
    skills: string[];
    experience_level: string;
    hourly_rate: number;
    availability_status: string;
    reputation_score: number;
    completed_projects: number;
  };
  match_details: {
    skill_matches: string[];
    skill_gaps: string[];
    experience_fit: number;
    rate_compatibility: number;
    availability_score: number;
    reasoning: string;
  };
}

export interface MatchingAnalytics {
  total_matches_generated: number;
  average_match_score: number;
  top_matching_skills: string[];
  match_success_rate: number;
  average_response_time: number;
}

export interface SkillAnalysis {
  skill: string;
  proficiency_level: number;
  market_demand: number;
  learning_resources: string[];
  related_skills: string[];
  career_paths: string[];
}

class MatchingService {
  /**
   * Get developer matches for a specific project
   */
  async getProjectMatches(
    projectId: string, 
    filters?: MatchingFilters
  ): Promise<APIResponse<DetailedMatch[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/ai/project-matches/${projectId}/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get project matches for a specific developer
   */
  async getDeveloperMatches(
    developerId?: string,
    filters?: MatchingFilters
  ): Promise<APIResponse<DeveloperMatch[]>> {
    return apiClient.getDeveloperMatches(developerId);
  }

  /**
   * Update matching preferences for a user
   */
  async updateMatchingPreferences(preferences: MatchingPreferences): Promise<APIResponse<any>> {
    return apiClient.makeRequest('/matching/preferences/', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  /**
   * Get current matching preferences
   */
  async getMatchingPreferences(): Promise<APIResponse<MatchingPreferences>> {
    return apiClient.makeRequest('/matching/preferences/');
  }

  /**
   * Trigger manual re-matching for a project
   */
  async recomputeMatches(projectId: string): Promise<APIResponse<DetailedMatch[]>> {
    return apiClient.makeRequest(`/matching/recompute/${projectId}/`, {
      method: 'POST',
    });
  }

  /**
   * Provide feedback on a match
   */
  async provideFeedback(
    matchId: string, 
    feedback: {
      rating: number;
      comments?: string;
      helpful_factors?: string[];
      improvement_suggestions?: string[];
    }
  ): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/matching/feedback/${matchId}/`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  /**
   * Get matching analytics for dashboard
   */
  async getMatchingAnalytics(timeframe?: 'week' | 'month' | 'quarter'): Promise<APIResponse<MatchingAnalytics>> {
    const endpoint = `/matching/analytics/${timeframe ? `?timeframe=${timeframe}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Analyze skill gaps for a developer
   */
  async analyzeSkillGaps(
    developerId?: string,
    targetRole?: string
  ): Promise<APIResponse<{
    current_skills: SkillAnalysis[];
    missing_skills: SkillAnalysis[];
    improvement_recommendations: string[];
    learning_path: any[];
  }>> {
    const params = new URLSearchParams();
    if (targetRole) params.append('target_role', targetRole);
    
    const endpoint = developerId 
      ? `/ai/skill-analysis/${developerId}/${params.toString() ? `?${params.toString()}` : ''}`
      : `/ai/skill-analysis/${params.toString() ? `?${params.toString()}` : ''}`;
    
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get skill market trends
   */
  async getSkillTrends(skills?: string[]): Promise<APIResponse<{
    trending_skills: string[];
    declining_skills: string[];
    emerging_technologies: string[];
    market_rates: Record<string, number>;
  }>> {
    const params = new URLSearchParams();
    if (skills) {
      skills.forEach(skill => params.append('skills', skill));
    }
    
    const endpoint = `/ai/skill-trends/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Update developer skill profile from GitHub
   */
  async updateSkillProfile(developerId?: string): Promise<APIResponse<{
    updated_skills: string[];
    new_skills: string[];
    skill_confidence: Record<string, number>;
    analysis_summary: string;
  }>> {
    const endpoint = developerId 
      ? `/ai/update-skills/${developerId}/`
      : '/ai/update-skills/';
    
    return apiClient.makeRequest(endpoint, {
      method: 'POST',
    });
  }

  /**
   * Get recommended developers for a skill
   */
  async getSkillExperts(skill: string, limit: number = 10): Promise<APIResponse<any[]>> {
    return apiClient.makeRequest(`/matching/skill-experts/?skill=${encodeURIComponent(skill)}&limit=${limit}`);
  }

  /**
   * Get matching cache status and optimization info
   */
  async getMatchingCacheStatus(): Promise<APIResponse<{
    cache_hit_rate: number;
    last_optimization: string;
    pending_updates: number;
    cache_size: number;
  }>> {
    return apiClient.makeRequest('/matching/cache-status/');
  }

  /**
   * Optimize matching cache (admin only)
   */
  async optimizeMatchingCache(): Promise<APIResponse<{
    optimization_started: boolean;
    estimated_completion: string;
  }>> {
    return apiClient.makeRequest('/matching/optimize-cache/', {
      method: 'POST',
    });
  }

  /**
   * Get matching algorithm performance metrics
   */
  async getAlgorithmMetrics(): Promise<APIResponse<{
    vector_search_time: number;
    graph_traversal_time: number;
    hybrid_scoring_time: number;
    total_processing_time: number;
    accuracy_score: number;
  }>> {
    return apiClient.makeRequest('/matching/algorithm-metrics/');
  }

  /**
   * Test matching algorithm with custom parameters
   */
  async testMatching(
    projectDescription: string,
    requiredSkills: string[],
    algorithmParams?: {
      vector_weight?: number;
      graph_weight?: number;
      availability_weight?: number;
    }
  ): Promise<APIResponse<{
    matches: DetailedMatch[];
    algorithm_performance: any;
    recommendations: string[];
  }>> {
    return apiClient.makeRequest('/matching/test/', {
      method: 'POST',
      body: JSON.stringify({
        project_description: projectDescription,
        required_skills: requiredSkills,
        algorithm_params: algorithmParams,
      }),
    });
  }
}

export const matchingService = new MatchingService();
export default matchingService;