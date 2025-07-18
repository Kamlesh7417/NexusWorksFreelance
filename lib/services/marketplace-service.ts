/**
 * Marketplace Service
 * Handles featured projects, developers, and premium marketplace features
 */

import { apiClient, APIResponse, PaginatedResponse } from '../api-client';

export interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  client: string;
  budget_range: string;
  duration_estimate: string;
  skills_required: string[];
  complexity_level: 'simple' | 'moderate' | 'complex' | 'enterprise';
  project_type: string;
  is_featured: boolean;
  featured_until: string;
  applications_count: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface FeaturedDeveloper {
  id: string;
  user: string;
  username: string;
  title: string;
  bio: string;
  skills: string[];
  experience_years: number;
  hourly_rate: number;
  availability_status: 'available' | 'busy' | 'unavailable';
  rating: number;
  completed_projects: number;
  is_featured: boolean;
  featured_until: string;
  portfolio_items: PortfolioItem[];
  testimonials: Testimonial[];
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  project_url?: string;
  github_url?: string;
  image_url?: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  client: string;
  client_name: string;
  rating: number;
  comment: string;
  project_title: string;
  created_at: string;
}

export interface MarketplaceSubscription {
  id: string;
  user: string;
  subscription_type: 'basic' | 'premium' | 'enterprise';
  features: string[];
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string;
}

export interface MarketplaceAnalytics {
  profile_views: number;
  project_applications: number;
  client_inquiries: number;
  conversion_rate: number;
  top_skills: string[];
  performance_score: number;
}

export interface SavedSearch {
  id: string;
  user: string;
  name: string;
  search_type: 'projects' | 'developers';
  filters: Record<string, any>;
  notification_enabled: boolean;
  created_at: string;
}

class MarketplaceService {
  /**
   * Get featured projects
   */
  async getFeaturedProjects(filters?: {
    skills_required?: string;
    complexity_level?: string;
    budget_range?: string;
    project_type?: string;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<FeaturedProject>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/marketplace/featured-projects/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get featured developers
   */
  async getFeaturedDevelopers(filters?: {
    skills?: string;
    experience_years?: string;
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    availability_status?: string;
    rating_min?: number;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<FeaturedDeveloper>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/marketplace/featured-developers/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<APIResponse<FeaturedProject>> {
    return apiClient.makeRequest(`/marketplace/projects/${projectId}/`);
  }

  /**
   * Get developer profile
   */
  async getDeveloperProfile(developerId: string): Promise<APIResponse<FeaturedDeveloper>> {
    return apiClient.makeRequest(`/marketplace/developers/${developerId}/`);
  }

  /**
   * Apply to featured project
   */
  async applyToProject(projectId: string, data: {
    cover_letter: string;
    proposed_rate: number;
    estimated_timeline: string;
    relevant_experience: string;
  }): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/marketplace/projects/${projectId}/apply/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Contact featured developer
   */
  async contactDeveloper(developerId: string, data: {
    subject: string;
    message: string;
    project_details?: string;
    budget_range?: string;
  }): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/marketplace/developers/${developerId}/contact/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get marketplace subscriptions
   */
  async getSubscriptions(): Promise<APIResponse<{
    available_plans: any[];
    current_subscription?: MarketplaceSubscription;
  }>> {
    return apiClient.makeRequest('/marketplace/subscriptions/');
  }

  /**
   * Subscribe to marketplace plan
   */
  async subscribe(data: {
    subscription_type: string;
    billing_cycle: string;
    payment_method_id: string;
  }): Promise<APIResponse<MarketplaceSubscription>> {
    return apiClient.makeRequest('/marketplace/subscriptions/subscribe/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest(`/marketplace/subscriptions/${subscriptionId}/cancel/`, {
      method: 'POST',
    });
  }

  /**
   * Get marketplace analytics
   */
  async getAnalytics(timeframe?: string): Promise<APIResponse<MarketplaceAnalytics>> {
    const endpoint = `/marketplace/analytics/${timeframe ? `?timeframe=${timeframe}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Feature project (premium feature)
   */
  async featureProject(projectId: string, data: {
    duration_days: number;
    payment_method_id: string;
  }): Promise<APIResponse<any>> {
    return apiClient.makeRequest(`/marketplace/projects/${projectId}/feature/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Feature developer profile (premium feature)
   */
  async featureDeveloperProfile(data: {
    duration_days: number;
    payment_method_id: string;
  }): Promise<APIResponse<any>> {
    return apiClient.makeRequest('/marketplace/developers/feature-profile/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Save search
   */
  async saveSearch(data: {
    name: string;
    search_type: string;
    filters: Record<string, any>;
    notification_enabled: boolean;
  }): Promise<APIResponse<SavedSearch>> {
    return apiClient.makeRequest('/marketplace/saved-searches/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(): Promise<APIResponse<SavedSearch[]>> {
    return apiClient.makeRequest('/marketplace/saved-searches/');
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(searchId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest(`/marketplace/saved-searches/${searchId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Get marketplace trends
   */
  async getMarketplaceTrends(): Promise<APIResponse<{
    trending_skills: string[];
    popular_project_types: string[];
    average_rates: Record<string, number>;
    market_demand: Record<string, number>;
  }>> {
    return apiClient.makeRequest('/marketplace/trends/');
  }

  /**
   * Get similar projects
   */
  async getSimilarProjects(projectId: string): Promise<APIResponse<FeaturedProject[]>> {
    return apiClient.makeRequest(`/marketplace/projects/${projectId}/similar/`);
  }

  /**
   * Get similar developers
   */
  async getSimilarDevelopers(developerId: string): Promise<APIResponse<FeaturedDeveloper[]>> {
    return apiClient.makeRequest(`/marketplace/developers/${developerId}/similar/`);
  }

  /**
   * Add to favorites
   */
  async addToFavorites(itemType: 'project' | 'developer', itemId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest('/marketplace/favorites/', {
      method: 'POST',
      body: JSON.stringify({
        item_type: itemType,
        item_id: itemId,
      }),
    });
  }

  /**
   * Remove from favorites
   */
  async removeFromFavorites(itemType: 'project' | 'developer', itemId: string): Promise<APIResponse<void>> {
    return apiClient.makeRequest('/marketplace/favorites/', {
      method: 'DELETE',
      body: JSON.stringify({
        item_type: itemType,
        item_id: itemId,
      }),
    });
  }

  /**
   * Get favorites
   */
  async getFavorites(): Promise<APIResponse<{
    projects: FeaturedProject[];
    developers: FeaturedDeveloper[];
  }>> {
    return apiClient.makeRequest('/marketplace/favorites/');
  }

  /**
   * Report inappropriate content
   */
  async reportContent(data: {
    content_type: 'project' | 'developer' | 'review';
    content_id: string;
    reason: string;
    description: string;
  }): Promise<APIResponse<void>> {
    return apiClient.makeRequest('/marketplace/reports/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const marketplaceService = new MarketplaceService();
export default marketplaceService;