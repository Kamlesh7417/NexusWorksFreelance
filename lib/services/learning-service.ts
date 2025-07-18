/**
 * Learning Service
 * Handles personalized learning paths, courses, and skill development
 */

import { apiClient, APIResponse, PaginatedResponse } from '../api-client';

export interface LearningPath {
  id: string;
  developer: string;
  current_skills: string[];
  target_skills: string[];
  recommended_courses: Course[];
  progress_percentage: number;
  estimated_completion_time: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills_covered: string[];
  prerequisites: string[];
  rating: number;
  enrollment_count: number;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  video_url?: string;
}

export interface CourseEnrollment {
  id: string;
  course: string;
  student: string;
  progress_percentage: number;
  completed_lessons: string[];
  current_lesson?: string;
  enrolled_at: string;
  completed_at?: string;
  certificate_url?: string;
}

export interface ShadowingSession {
  id: string;
  student: string;
  project: string;
  mentor: string;
  start_date: string;
  end_date: string;
  learning_credits_awarded: number;
  nda_signed: boolean;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';
  learning_objectives: string[];
  feedback?: string;
}

export interface SkillAssessment {
  id: string;
  skill: string;
  developer: string;
  proficiency_level: number;
  assessment_type: 'self_reported' | 'github_analysis' | 'peer_review' | 'formal_test';
  confidence_score: number;
  evidence: string[];
  assessed_at: string;
}

export interface LearningCredit {
  id: string;
  developer: string;
  amount: number;
  source: 'course_completion' | 'mentoring' | 'shadowing' | 'contribution' | 'purchase';
  description: string;
  earned_at: string;
  expires_at?: string;
}

class LearningService {
  /**
   * Get learning paths for current user
   */
  async getLearningPaths(): Promise<APIResponse<LearningPath[]>> {
    return apiClient.getLearningPaths();
  }

  /**
   * Create personalized learning path
   */
  async createLearningPath(data: {
    target_skills: string[];
    target_role?: string;
    timeline_preference?: string;
    learning_style?: string;
  }): Promise<APIResponse<LearningPath>> {
    return apiClient.makeRequest('/learning/paths/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update learning path progress
   */
  async updateLearningPathProgress(pathId: string, completedSkills: string[]): Promise<APIResponse<LearningPath>> {
    return apiClient.makeRequest(`/learning/paths/${pathId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ completed_skills: completedSkills }),
    });
  }

  /**
   * Get available courses
   */
  async getCourses(filters?: {
    skill?: string;
    difficulty?: string;
    is_free?: boolean;
    search?: string;
    page?: number;
  }): Promise<APIResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/learning/courses/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get course details
   */
  async getCourse(courseId: string): Promise<APIResponse<Course>> {
    return apiClient.makeRequest(`/learning/courses/${courseId}/`);
  }

  /**
   * Enroll in course
   */
  async enrollInCourse(courseId: string): Promise<APIResponse<CourseEnrollment>> {
    return apiClient.makeRequest(`/learning/courses/${courseId}/enroll/`, {
      method: 'POST',
    });
  }

  /**
   * Get course enrollments
   */
  async getCourseEnrollments(): Promise<APIResponse<CourseEnrollment[]>> {
    return apiClient.makeRequest('/learning/enrollments/');
  }

  /**
   * Update course progress
   */
  async updateCourseProgress(enrollmentId: string, data: {
    completed_lessons?: string[];
    current_lesson?: string;
    progress_percentage?: number;
  }): Promise<APIResponse<CourseEnrollment>> {
    return apiClient.makeRequest(`/learning/enrollments/${enrollmentId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Complete course
   */
  async completeCourse(enrollmentId: string): Promise<APIResponse<{
    enrollment: CourseEnrollment;
    certificate_url: string;
    credits_awarded: number;
  }>> {
    return apiClient.makeRequest(`/learning/enrollments/${enrollmentId}/complete/`, {
      method: 'POST',
    });
  }

  /**
   * Get shadowing opportunities
   */
  async getShadowingOpportunities(filters?: {
    skill?: string;
    project_type?: string;
    mentor_experience?: string;
  }): Promise<APIResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/learning/shadowing/opportunities/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Request shadowing session
   */
  async requestShadowingSession(data: {
    project_id: string;
    learning_objectives: string[];
    duration_weeks: number;
    message_to_mentor?: string;
  }): Promise<APIResponse<ShadowingSession>> {
    return apiClient.makeRequest('/learning/shadowing/requests/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get shadowing sessions
   */
  async getShadowingSessions(filters?: {
    status?: string;
    role?: 'student' | 'mentor';
  }): Promise<APIResponse<ShadowingSession[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/learning/shadowing/sessions/${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Approve/reject shadowing request
   */
  async respondToShadowingRequest(sessionId: string, data: {
    approved: boolean;
    message?: string;
    nda_required?: boolean;
  }): Promise<APIResponse<ShadowingSession>> {
    return apiClient.makeRequest(`/learning/shadowing/sessions/${sessionId}/respond/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Complete shadowing session
   */
  async completeShadowingSession(sessionId: string, data: {
    feedback: string;
    skills_learned: string[];
    rating: number;
  }): Promise<APIResponse<ShadowingSession>> {
    return apiClient.makeRequest(`/learning/shadowing/sessions/${sessionId}/complete/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get skill assessments
   */
  async getSkillAssessments(developerId?: string): Promise<APIResponse<SkillAssessment[]>> {
    const endpoint = developerId 
      ? `/learning/assessments/?developer=${developerId}`
      : '/learning/assessments/';
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Create skill assessment
   */
  async createSkillAssessment(data: {
    skill: string;
    proficiency_level: number;
    assessment_type: string;
    evidence?: string[];
  }): Promise<APIResponse<SkillAssessment>> {
    return apiClient.makeRequest('/learning/assessments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Take skill test
   */
  async takeSkillTest(skill: string): Promise<APIResponse<{
    test_id: string;
    questions: any[];
    time_limit: number;
  }>> {
    return apiClient.makeRequest('/learning/skill-tests/', {
      method: 'POST',
      body: JSON.stringify({ skill }),
    });
  }

  /**
   * Submit skill test
   */
  async submitSkillTest(testId: string, answers: any[]): Promise<APIResponse<{
    score: number;
    proficiency_level: number;
    feedback: string;
    certificate_url?: string;
  }>> {
    return apiClient.makeRequest(`/learning/skill-tests/${testId}/submit/`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  /**
   * Get learning credits
   */
  async getLearningCredits(): Promise<APIResponse<{
    total_credits: number;
    available_credits: number;
    credits_history: LearningCredit[];
  }>> {
    return apiClient.makeRequest('/learning/credits/');
  }

  /**
   * Purchase learning credits
   */
  async purchaseLearningCredits(amount: number, paymentMethodId: string): Promise<APIResponse<{
    transaction_id: string;
    credits_added: number;
    new_balance: number;
  }>> {
    return apiClient.makeRequest('/learning/credits/purchase/', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        payment_method_id: paymentMethodId,
      }),
    });
  }

  /**
   * Get learning recommendations
   */
  async getLearningRecommendations(): Promise<APIResponse<{
    recommended_courses: Course[];
    trending_skills: string[];
    skill_gaps: string[];
    market_opportunities: string[];
  }>> {
    return apiClient.makeRequest('/learning/recommendations/');
  }

  /**
   * Get learning analytics
   */
  async getLearningAnalytics(timeframe?: string): Promise<APIResponse<{
    courses_completed: number;
    skills_learned: number;
    learning_hours: number;
    credits_earned: number;
    progress_by_skill: Record<string, number>;
    learning_streak: number;
  }>> {
    const endpoint = `/learning/analytics/${timeframe ? `?timeframe=${timeframe}` : ''}`;
    return apiClient.makeRequest(endpoint);
  }

  /**
   * Get mentoring opportunities
   */
  async getMentoringOpportunities(): Promise<APIResponse<any[]>> {
    return apiClient.makeRequest('/learning/mentoring/opportunities/');
  }

  /**
   * Apply to be a mentor
   */
  async applyToBeMentor(data: {
    skills: string[];
    experience_years: number;
    mentoring_experience?: string;
    availability_hours: number;
  }): Promise<APIResponse<any>> {
    return apiClient.makeRequest('/learning/mentoring/apply/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get mentoring sessions
   */
  async getMentoringSessions(): Promise<APIResponse<any[]>> {
    return apiClient.makeRequest('/learning/mentoring/sessions/');
  }
}

export const learningService = new LearningService();
export default learningService;