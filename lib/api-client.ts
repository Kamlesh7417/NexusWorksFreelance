/**
 * Django Backend API Client
 * Handles all communication with the Django REST API backend
 */

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  message?: string;
}

// Helper function to check if API response is successful
export const isSuccessResponse = <T>(response: APIResponse<T>): response is APIResponse<T> & { data: T } => {
  return response.status >= 200 && response.status < 300 && !response.error && response.data !== undefined;
};

export interface APIError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: string;
  email: string;
  role: 'client' | 'developer' | 'admin';
  github_username?: string;
  created_at: string;
  is_verified: boolean;
}

export interface DeveloperProfile {
  user: string;
  skills: string[];
  experience_level: 'junior' | 'mid' | 'senior' | 'expert';
  hourly_rate: number;
  availability_status: 'available' | 'busy' | 'unavailable';
  github_analysis: Record<string, any>;
  skill_embeddings: number[];
  reputation_score: number;
}

export interface Project {
  id: string;
  client: string;
  title: string;
  description: string;
  ai_analysis: Record<string, any>;
  status: 'analyzing' | 'proposal_review' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  budget_estimate: number;
  timeline_estimate: string;
  senior_developer?: string;
  created_at: string;
}

export interface Task {
  id: string;
  project: string;
  title: string;
  description: string;
  required_skills: string[];
  estimated_hours: number;
  priority: number;
  dependencies: string[];
  assigned_developer?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed';
  completion_percentage: number;
}

export interface DeveloperMatch {
  task: string;
  developer: string;
  match_score: number;
  vector_score: number;
  graph_score: number;
  availability_score: number;
  created_at: string;
}

export interface Payment {
  id: string;
  milestone: string;
  developer: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: string;
}

class APIClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';
    
    // Load tokens from localStorage if available
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  /**
   * Get API timeout from environment variables
   */
  private getTimeout(): number {
    return parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000');
  }

  /**
   * Get retry attempts from environment variables
   */
  private getRetryAttempts(): number {
    return parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3');
  }

  public async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    headers['X-Request-ID'] = requestId;

    const operation = async (): Promise<APIResponse<T>> => {
      const timeout = this.getTimeout();
      const response = await fetch(url, {
        ...options,
        headers,
        // Add timeout support using environment variable
        signal: AbortSignal.timeout(timeout),
      });

      // Handle token refresh for 401 errors
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
            signal: AbortSignal.timeout(timeout),
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    };

    try {
      // Import error handler dynamically to avoid circular dependency
      const { withErrorHandling } = await import('./api-error-handler');
      return await withErrorHandling(operation, endpoint);
    } catch (error) {
      console.error(`API request failed [${requestId}]:`, error);
      return {
        status: 0,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    const status = response.status;
    
    try {
      const data = await response.json();
      
      if (response.ok) {
        return { data, status };
      } else {
        return {
          status,
          error: data.message || data.error || 'Request failed',
          data: data.details || data,
        };
      }
    } catch (error) {
      // Handle non-JSON responses
      const text = await response.text();
      return {
        status,
        error: text || 'Invalid response format',
      };
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performTokenRefresh(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.access, this.refreshToken);
        return true;
      } else {
        // Refresh token is invalid, clear all tokens
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Expose makeRequest for custom endpoints
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest(endpoint, options);
  }

  // Expose makeRequest method directly for services (avoid circular reference)
  public async makeAPIRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest(endpoint, options);
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<APIResponse<AuthTokens & { user: User }>> {
    return this.makeRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    role: 'client' | 'developer';
    github_username?: string;
  }): Promise<APIResponse<AuthTokens & { user: User }>> {
    return this.makeRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<APIResponse<void>> {
    const response = await this.makeRequest<void>('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh: this.refreshToken }),
    });
    this.clearTokens();
    return response;
  }

  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.makeRequest('/auth/user/');
  }

  // User and Profile endpoints
  async getDeveloperProfile(userId?: string): Promise<APIResponse<DeveloperProfile>> {
    const endpoint = userId ? `/users/developers/${userId}/` : '/users/profile/';
    return this.makeRequest(endpoint);
  }

  async updateDeveloperProfile(profileData: Partial<DeveloperProfile>): Promise<APIResponse<DeveloperProfile>> {
    return this.makeRequest('/users/profile/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  // Project endpoints
  async getProjects(params?: {
    status?: string;
    client?: string;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<Project>>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/projects/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getProject(projectId: string): Promise<APIResponse<Project>> {
    return this.makeRequest(`/projects/${projectId}/`);
  }

  async createProject(projectData: {
    title: string;
    description: string;
  }): Promise<APIResponse<Project>> {
    return this.makeRequest('/projects/', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(projectId: string, projectData: Partial<Project>): Promise<APIResponse<Project>> {
    return this.makeRequest(`/projects/${projectId}/`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  }

  // Task endpoints
  async getProjectTasks(projectId: string): Promise<APIResponse<Task[]>> {
    return this.makeRequest(`/projects/${projectId}/tasks/`);
  }

  async getTask(taskId: string): Promise<APIResponse<Task>> {
    return this.makeRequest(`/tasks/${taskId}/`);
  }

  async updateTask(taskId: string, taskData: Partial<Task>): Promise<APIResponse<Task>> {
    return this.makeRequest(`/tasks/${taskId}/`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  }

  // AI and Matching endpoints
  async analyzeProject(projectId: string): Promise<APIResponse<{ analysis: any; tasks: Task[] }>> {
    return this.makeRequest(`/ai/analyze-project/${projectId}/`, {
      method: 'POST',
    });
  }

  async getProjectMatches(projectId: string): Promise<APIResponse<DeveloperMatch[]>> {
    return this.makeRequest(`/ai/project-matches/${projectId}/`);
  }

  async getDeveloperMatches(developerId?: string): Promise<APIResponse<DeveloperMatch[]>> {
    const endpoint = developerId 
      ? `/ai/developer-matches/${developerId}/`
      : '/ai/developer-matches/';
    return this.makeRequest(endpoint);
  }

  async updateSkillProfile(): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('/ai/update-skills/', {
      method: 'POST',
    });
  }

  // Payment endpoints
  async getPayments(params?: {
    project?: string;
    developer?: string;
    status?: string;
  }): Promise<APIResponse<PaginatedResponse<Payment>>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/payments/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async processPayment(paymentId: string): Promise<APIResponse<Payment>> {
    return this.makeRequest(`/payments/${paymentId}/process/`, {
      method: 'POST',
    });
  }

  // Communication endpoints
  async getConversations(): Promise<APIResponse<any[]>> {
    return this.makeRequest('/communications/conversations/');
  }

  async sendMessage(conversationId: string, message: string): Promise<APIResponse<any>> {
    return this.makeRequest('/communications/messages/', {
      method: 'POST',
      body: JSON.stringify({
        conversation: conversationId,
        content: message,
      }),
    });
  }

  // Learning endpoints
  async getLearningPaths(): Promise<APIResponse<any[]>> {
    return this.makeRequest('/learning/paths/');
  }

  async getCourses(params?: { skill?: string }): Promise<APIResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params?.skill) {
      searchParams.append('skill', params.skill);
    }
    
    const endpoint = `/learning/courses/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Community endpoints
  async getEvents(): Promise<APIResponse<any[]>> {
    return this.makeRequest('/community/events/');
  }

  async registerForEvent(eventId: string): Promise<APIResponse<any>> {
    return this.makeRequest(`/community/events/${eventId}/register/`, {
      method: 'POST',
    });
  }

  // Marketplace endpoints
  async getFeaturedProjects(): Promise<APIResponse<any[]>> {
    return this.makeRequest('/marketplace/featured-projects/');
  }

  async getFeaturedDevelopers(): Promise<APIResponse<any[]>> {
    return this.makeRequest('/marketplace/featured-developers/');
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;