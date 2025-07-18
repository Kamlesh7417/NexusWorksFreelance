/**
 * Services Index
 * Centralized exports for all Django backend integration services
 */

// Core API and Auth
export { apiClient, type APIResponse, type APIError } from '../api-client';
export { djangoAuth, useDjangoAuth, type AuthState, type LoginCredentials, type RegisterData } from '../auth-django';
export { realtimeSync, useRealtimeSync, useRealtimeSubscription, type RealtimeEvent, type SyncState } from '../realtime-sync';
export { apiErrorHandler, withErrorHandling, type RetryConfig, type CircuitBreakerConfig } from '../api-error-handler';

// Import for services object
import { djangoAuth } from '../auth-django';
import { apiClient } from '../api-client';
import { realtimeSync } from '../realtime-sync';

// Service Classes
export { default as projectService, type ProjectFilters, type CreateProjectData, type ProjectAnalysisResult } from './project-service';
export { default as matchingService, type MatchingPreferences, type DetailedMatch, type SkillAnalysis } from './matching-service';
export { default as paymentService, type PaymentMethod, type Milestone, type PaymentRequest } from './payment-service';
export { default as communicationService, type Conversation, type Message, type Notification } from './communication-service';
export { default as communityService, type CommunityEvent, type Hackathon, type VirtualMeeting } from './community-service';
export { default as learningService, type LearningPath, type Course, type ShadowingSession } from './learning-service';
export { default as marketplaceService, type FeaturedProject, type FeaturedDeveloper } from './marketplace-service';

// Import service instances
import projectService from './project-service';
import matchingService from './matching-service';
import paymentService from './payment-service';
import communicationService from './communication-service';
import communityService from './community-service';
import learningService from './learning-service';
import marketplaceService from './marketplace-service';

// Integration Service
export { integrationService, useIntegration, type IntegrationStatus, type HealthCheck } from './integration-service';

// Import integration service
import { integrationService } from './integration-service';

// Convenience exports for common operations
export const services = {
  auth: djangoAuth,
  api: apiClient,
  realtime: realtimeSync,
  projects: projectService,
  matching: matchingService,
  payments: paymentService,
  communication: communicationService,
  community: communityService,
  learning: learningService,
  marketplace: marketplaceService,
  integration: integrationService,
};

// Initialize integration service
if (typeof window !== 'undefined') {
  integrationService.initialize().catch(error => {
    console.error('Failed to initialize integration service:', error);
  });
}

export default services;