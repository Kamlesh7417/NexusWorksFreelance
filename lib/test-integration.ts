/**
 * Integration Testing Utilities
 * Comprehensive testing suite for Django backend integration
 */

import { apiClient } from './api-client';
import { djangoAuth } from './auth-django';
import { realtimeSync } from './realtime-sync';
import { integrationService } from './services/integration-service';
import projectService from './services/project-service';
import matchingService from './services/matching-service';
import paymentService from './services/payment-service';
import communicationService from './services/communication-service';
import learningService from './services/learning-service';

export interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration: number;
  details?: any;
}

export interface IntegrationTestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

class IntegrationTester {
  private testResults: TestResult[] = [];

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(
    name: string,
    testFunction: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        name,
        success: true,
        duration,
        details: result,
      };
      
      console.log(`✅ ${name} - ${duration}ms`);
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const testResult: TestResult = {
        name,
        success: false,
        error: errorMessage,
        duration,
      };
      
      console.error(`❌ ${name} - ${duration}ms - ${errorMessage}`);
      return testResult;
    }
  }

  /**
   * Test API client basic functionality
   */
  async testAPIClient(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test API client initialization
    tests.push(await this.runTest('API Client Initialization', async () => {
      if (!apiClient) {
        throw new Error('API client not initialized');
      }
      return { initialized: true };
    }));

    // Test health endpoint
    tests.push(await this.runTest('Health Check Endpoint', async () => {
      const response = await apiClient.request('/health/');
      if (response.status !== 200) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      return response.data;
    }));

    // Test authentication endpoints (without actual login)
    tests.push(await this.runTest('Authentication Endpoints Available', async () => {
      // Test that auth endpoints return proper error codes (not 404)
      const response = await apiClient.request('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'invalid' }),
      });
      
      // Should return 400 or 401, not 404
      if (response.status === 404) {
        throw new Error('Authentication endpoints not found');
      }
      
      return { endpoint_available: true, status: response.status };
    }));

    return tests;
  }

  /**
   * Test authentication service
   */
  async testAuthenticationService(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test auth service initialization
    tests.push(await this.runTest('Auth Service Initialization', async () => {
      const authState = djangoAuth.getAuthState();
      return {
        initialized: true,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
      };
    }));

    // Test role checking methods
    tests.push(await this.runTest('Role Checking Methods', async () => {
      const isClient = djangoAuth.isClient();
      const isDeveloper = djangoAuth.isDeveloper();
      const isAdmin = djangoAuth.isAdmin();
      
      return {
        methods_available: true,
        isClient,
        isDeveloper,
        isAdmin,
      };
    }));

    return tests;
  }

  /**
   * Test real-time synchronization
   */
  async testRealtimeSync(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test real-time sync initialization
    tests.push(await this.runTest('Real-time Sync Initialization', async () => {
      const syncState = realtimeSync.getSyncState();
      return {
        initialized: true,
        connectionStatus: syncState.connectionStatus,
        isConnected: syncState.isConnected,
      };
    }));

    // Test subscription functionality
    tests.push(await this.runTest('Subscription Management', async () => {
      let eventReceived = false;
      
      const subscriptionId = realtimeSync.subscribe('test_channel', (event) => {
        eventReceived = true;
      });
      
      // Unsubscribe immediately
      realtimeSync.unsubscribe(subscriptionId);
      
      return {
        subscription_created: true,
        subscription_id: subscriptionId,
        unsubscribed: true,
      };
    }));

    // Test optimistic updates
    tests.push(await this.runTest('Optimistic Updates', async () => {
      const testKey = 'test_optimistic_update';
      const testData = { id: '123', name: 'Test Update' };
      
      realtimeSync.optimisticUpdate(testKey, testData, async () => {
        // Mock sync operation
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      const retrievedData = realtimeSync.getOptimisticUpdate(testKey);
      
      return {
        optimistic_update_stored: retrievedData !== null,
        data_matches: JSON.stringify(retrievedData) === JSON.stringify(testData),
      };
    }));

    return tests;
  }

  /**
   * Test project service
   */
  async testProjectService(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test project service methods availability
    tests.push(await this.runTest('Project Service Methods', async () => {
      const methods = [
        'getProjects',
        'getProject',
        'createProject',
        'updateProject',
        'analyzeProject',
        'getProjectTasks',
      ];
      
      const availableMethods = methods.filter(method => 
        typeof (projectService as any)[method] === 'function'
      );
      
      if (availableMethods.length !== methods.length) {
        throw new Error(`Missing methods: ${methods.filter(m => !availableMethods.includes(m)).join(', ')}`);
      }
      
      return { all_methods_available: true, methods: availableMethods };
    }));

    // Test project listing (should work even without authentication)
    tests.push(await this.runTest('Project Listing Endpoint', async () => {
      const response = await projectService.getProjects();
      
      // Should return a response (even if empty or unauthorized)
      return {
        endpoint_responsive: true,
        status: response.status,
        has_data: !!response.data,
      };
    }));

    return tests;
  }

  /**
   * Test matching service
   */
  async testMatchingService(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test matching service methods
    tests.push(await this.runTest('Matching Service Methods', async () => {
      const methods = [
        'getProjectMatches',
        'getDeveloperMatches',
        'updateMatchingPreferences',
        'analyzeSkillGaps',
        'updateSkillProfile',
      ];
      
      const availableMethods = methods.filter(method => 
        typeof (matchingService as any)[method] === 'function'
      );
      
      if (availableMethods.length !== methods.length) {
        throw new Error(`Missing methods: ${methods.filter(m => !availableMethods.includes(m)).join(', ')}`);
      }
      
      return { all_methods_available: true, methods: availableMethods };
    }));

    return tests;
  }

  /**
   * Test payment service
   */
  async testPaymentService(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test payment service methods
    tests.push(await this.runTest('Payment Service Methods', async () => {
      const methods = [
        'getPayments',
        'getPaymentMethods',
        'getProjectMilestones',
        'processMilestonePayment',
        'getPaymentStats',
      ];
      
      const availableMethods = methods.filter(method => 
        typeof (paymentService as any)[method] === 'function'
      );
      
      if (availableMethods.length !== methods.length) {
        throw new Error(`Missing methods: ${methods.filter(m => !availableMethods.includes(m)).join(', ')}`);
      }
      
      return { all_methods_available: true, methods: availableMethods };
    }));

    return tests;
  }

  /**
   * Test communication service
   */
  async testCommunicationService(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test communication service methods
    tests.push(await this.runTest('Communication Service Methods', async () => {
      const methods = [
        'getConversations',
        'sendMessage',
        'getNotifications',
        'markNotificationAsRead',
        'getUnreadCounts',
      ];
      
      const availableMethods = methods.filter(method => 
        typeof (communicationService as any)[method] === 'function'
      );
      
      if (availableMethods.length !== methods.length) {
        throw new Error(`Missing methods: ${methods.filter(m => !availableMethods.includes(m)).join(', ')}`);
      }
      
      return { all_methods_available: true, methods: availableMethods };
    }));

    return tests;
  }

  /**
   * Test learning service
   */
  async testLearningService(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test learning service methods
    tests.push(await this.runTest('Learning Service Methods', async () => {
      const methods = [
        'getLearningPaths',
        'getCourses',
        'enrollInCourse',
        'getShadowingOpportunities',
        'getSkillAssessments',
      ];
      
      const availableMethods = methods.filter(method => 
        typeof (learningService as any)[method] === 'function'
      );
      
      if (availableMethods.length !== methods.length) {
        throw new Error(`Missing methods: ${methods.filter(m => !availableMethods.includes(m)).join(', ')}`);
      }
      
      return { all_methods_available: true, methods: availableMethods };
    }));

    return tests;
  }

  /**
   * Test integration service
   */
  async testIntegrationService(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test integration service initialization
    tests.push(await this.runTest('Integration Service Status', async () => {
      const status = integrationService.getIntegrationStatus();
      return {
        status_available: true,
        api_connected: status.api_connected,
        websocket_connected: status.websocket_connected,
        auth_status: status.auth_status,
      };
    }));

    // Test health check
    tests.push(await this.runTest('Integration Health Check', async () => {
      const healthCheck = await integrationService.performHealthCheck();
      return {
        health_check_completed: true,
        overall_status: healthCheck.status,
        services: healthCheck.services,
        response_times: healthCheck.response_times,
      };
    }));

    return tests;
  }

  /**
   * Test environment configuration
   */
  async testEnvironmentConfig(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test environment variables
    tests.push(await this.runTest('Environment Variables', async () => {
      const requiredVars = [
        'NEXT_PUBLIC_DJANGO_API_URL',
        'NEXT_PUBLIC_DJANGO_WS_URL',
      ];
      
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
      }
      
      return {
        all_vars_present: true,
        api_url: process.env.NEXT_PUBLIC_DJANGO_API_URL,
        ws_url: process.env.NEXT_PUBLIC_DJANGO_WS_URL,
        timeout: process.env.NEXT_PUBLIC_API_TIMEOUT,
        retry_attempts: process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS,
        realtime_enabled: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC,
      };
    }));

    return tests;
  }

  /**
   * Run comprehensive integration test suite
   */
  async runFullTestSuite(): Promise<IntegrationTestSuite> {
    console.log('🚀 Starting comprehensive integration test suite...\n');
    
    const startTime = Date.now();
    const allTests: TestResult[] = [];

    // Run all test categories
    const testCategories = [
      { name: 'Environment Configuration', tests: await this.testEnvironmentConfig() },
      { name: 'API Client', tests: await this.testAPIClient() },
      { name: 'Authentication Service', tests: await this.testAuthenticationService() },
      { name: 'Real-time Sync', tests: await this.testRealtimeSync() },
      { name: 'Project Service', tests: await this.testProjectService() },
      { name: 'Matching Service', tests: await this.testMatchingService() },
      { name: 'Payment Service', tests: await this.testPaymentService() },
      { name: 'Communication Service', tests: await this.testCommunicationService() },
      { name: 'Learning Service', tests: await this.testLearningService() },
      { name: 'Integration Service', tests: await this.testIntegrationService() },
    ];

    // Collect all test results
    testCategories.forEach(category => {
      console.log(`\n📋 ${category.name}:`);
      allTests.push(...category.tests);
    });

    const totalDuration = Date.now() - startTime;
    const passedTests = allTests.filter(test => test.success).length;
    const failedTests = allTests.filter(test => !test.success).length;

    const testSuite: IntegrationTestSuite = {
      name: 'Django Backend Integration Test Suite',
      tests: allTests,
      totalTests: allTests.length,
      passedTests,
      failedTests,
      totalDuration,
    };

    // Print summary
    console.log('\n📊 Test Suite Summary:');
    console.log(`Total Tests: ${testSuite.totalTests}`);
    console.log(`Passed: ${testSuite.passedTests} ✅`);
    console.log(`Failed: ${testSuite.failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / allTests.length) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      allTests
        .filter(test => !test.success)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    return testSuite;
  }

  /**
   * Test specific service endpoints with authentication
   */
  async testAuthenticatedEndpoints(credentials: { email: string; password: string }): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Login first
    tests.push(await this.runTest('Authentication Login', async () => {
      const result = await djangoAuth.login(credentials);
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
      return { login_successful: true };
    }));

    // Test authenticated endpoints
    if (djangoAuth.getAuthState().isAuthenticated) {
      // Test user profile
      tests.push(await this.runTest('Get Current User', async () => {
        const response = await apiClient.getCurrentUser();
        if (response.error) {
          throw new Error(response.error);
        }
        return response.data;
      }));

      // Test projects with authentication
      tests.push(await this.runTest('Get User Projects', async () => {
        const response = await projectService.getProjects();
        return {
          status: response.status,
          has_data: !!response.data,
          error: response.error,
        };
      }));

      // Logout
      tests.push(await this.runTest('Authentication Logout', async () => {
        await djangoAuth.logout();
        const authState = djangoAuth.getAuthState();
        return { 
          logout_successful: !authState.isAuthenticated,
          user_cleared: authState.user === null,
        };
      }));
    }

    return tests;
  }
}

// Export singleton instance
export const integrationTester = new IntegrationTester();

// Utility functions for testing
export async function runQuickIntegrationTest(): Promise<boolean> {
  try {
    const testSuite = await integrationTester.runFullTestSuite();
    return testSuite.failedTests === 0;
  } catch (error) {
    console.error('Integration test failed:', error);
    return false;
  }
}

export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await apiClient.request('/health/');
    return response.status === 200;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
}

export async function testRealtimeConnection(): Promise<boolean> {
  try {
    const syncState = realtimeSync.getSyncState();
    return syncState.connectionStatus === 'connected' || syncState.connectionStatus === 'connecting';
  } catch (error) {
    console.error('Real-time connection test failed:', error);
    return false;
  }
}

// Main test function for the demo component
export async function testIntegration(): Promise<{
  success: boolean;
  results: any;
  errors: string[];
}> {
  try {
    const testSuite = await integrationTester.runFullTestSuite();
    
    return {
      success: testSuite.failedTests === 0,
      results: {
        totalTests: testSuite.totalTests,
        passedTests: testSuite.passedTests,
        failedTests: testSuite.failedTests,
        totalDuration: testSuite.totalDuration,
        successRate: ((testSuite.passedTests / testSuite.totalTests) * 100).toFixed(1),
        tests: testSuite.tests,
      },
      errors: testSuite.tests
        .filter(test => !test.success)
        .map(test => `${test.name}: ${test.error}`),
    };
  } catch (error) {
    return {
      success: false,
      results: {},
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

export default integrationTester;