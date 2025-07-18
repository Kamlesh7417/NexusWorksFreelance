/**
 * Django Integration Demo Component
 * Comprehensive demonstration of Django backend integration features
 * Tests all aspects of task 21: Next.js frontend with Django backend API integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  useDjangoAuth, 
  useIntegration, 
  useRealtimeSync, 
  useRealtimeSubscription,
  services 
} from '@/lib/services';

export function DjangoIntegrationDemo() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<Record<string, any>>({});
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use Django authentication
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    login,
    logout,
  } = useDjangoAuth();

  // Use integration service
  const {
    status: integrationStatus,
    healthCheck,
    reconnectAll,
    performHealthCheck,
  } = useIntegration();

  // Use real-time sync
  const {
    isConnected: realtimeConnected,
    connectionStatus,
    lastSync,
    subscribe,
    unsubscribe,
  } = useRealtimeSync();

  // Subscribe to real-time events
  useRealtimeSubscription('*', (event) => {
    console.log('Received real-time event:', event);
    setRealtimeEvents(prev => [
      { ...event, timestamp: new Date().toISOString() },
      ...prev.slice(0, 9) // Keep last 10 events
    ]);
  });

  // Test individual API services
  const testApiService = async (serviceName: string) => {
    setApiTestResults(prev => ({ ...prev, [serviceName]: { loading: true } }));
    
    try {
      let result;
      switch (serviceName) {
        case 'projects':
          result = await services.projects.getProjects({ page: 1 });
          break;
        case 'matching':
          result = await services.matching.getMatchingAnalytics();
          break;
        case 'payments':
          result = await services.payments.getPayments();
          break;
        case 'communication':
          result = await services.communication.getConversations();
          break;
        case 'learning':
          result = await services.learning.getLearningPaths();
          break;
        default:
          throw new Error('Unknown service');
      }
      
      setApiTestResults(prev => ({
        ...prev,
        [serviceName]: {
          loading: false,
          success: result.status < 400,
          status: result.status,
          data: result.data,
          error: result.error,
        }
      }));
    } catch (error) {
      setApiTestResults(prev => ({
        ...prev,
        [serviceName]: {
          loading: false,
          success: false,
          error: error.message,
        }
      }));
    }
  };

  // Test all API services
  const testAllApiServices = async () => {
    const services = ['projects', 'matching', 'payments', 'communication', 'learning'];
    for (const service of services) {
      await testApiService(service);
    }
  };

  // Run integration test
  const runIntegrationTest = async () => {
    setIsRunningTest(true);
    try {
      const { testIntegration } = await import('@/lib/test-integration');
      const results = await testIntegration();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to run integration test:', error);
      setTestResults({
        success: false,
        results: {},
        errors: [`Test execution failed: ${error.message}`],
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  // Test login
  const handleTestLogin = async () => {
    try {
      const result = await login({
        email: 'test@example.com',
        password: 'testpassword',
      });
      
      if (!result.success) {
        alert(`Login failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Login error: ${error.message}`);
    }
  };

  // Test API call
  const testApiCall = async () => {
    try {
      const response = await services.projects.getProjects({ page: 1 });
      console.log('Projects API response:', response);
      alert(`API call successful. Status: ${response.status}`);
    } catch (error) {
      console.error('API call failed:', error);
      alert(`API call failed: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'auth', label: 'Authentication' },
    { id: 'api', label: 'API Services' },
    { id: 'realtime', label: 'Real-time' },
    { id: 'testing', label: 'Testing' },
    { id: 'examples', label: 'Examples' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Django Integration Demo</h1>
        <p className="text-gray-600">
          Comprehensive demonstration of Next.js frontend integration with Django backend API
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Integration Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900">API Connection</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {integrationStatus.api_connected ? '✅ Connected' : '❌ Disconnected'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900">Authentication</h3>
                    <p className="text-sm text-green-700 mt-1">
                      {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-900">Real-time</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      {realtimeConnected ? '✅ Connected' : '❌ Disconnected'}
                    </p>
                  </div>
                </div>
              </div>

              {healthCheck && (
                <div>
                  <h3 className="text-lg font-medium mb-3">System Health</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Overall Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        healthCheck.status === 'healthy' ? 'bg-green-100 text-green-800' :
                        healthCheck.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {healthCheck.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>API: {healthCheck.services.api ? '✅' : '❌'}</div>
                      <div>WebSocket: {healthCheck.services.websocket ? '✅' : '❌'}</div>
                      <div>Database: {healthCheck.services.database ? '✅' : '❌'}</div>
                      <div>AI Services: {healthCheck.services.ai_services ? '✅' : '❌'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Authentication Tab */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Authentication Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Current Status</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Loading:</strong> {authLoading ? '⏳ Yes' : '✅ No'}</p>
                    <p><strong>User:</strong> {user?.email || 'None'}</p>
                    <p><strong>Role:</strong> {user?.role || 'None'}</p>
                    <p><strong>User ID:</strong> {user?.id || 'None'}</p>
                    <p><strong>Error:</strong> {authError || 'None'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Actions</h3>
                  <div className="space-y-2">
                    {!isAuthenticated ? (
                      <button
                        onClick={handleTestLogin}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        disabled={authLoading}
                      >
                        Test Login
                      </button>
                    ) : (
                      <button
                        onClick={logout}
                        className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                        disabled={authLoading}
                      >
                        Logout
                      </button>
                    )}
                    <button
                      onClick={() => services.auth.refreshUser()}
                      className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Refresh User Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Services Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">API Service Testing</h2>
                <button
                  onClick={testAllApiServices}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Test All Services
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['projects', 'matching', 'payments', 'communication', 'learning'].map((serviceName) => (
                  <div key={serviceName} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium capitalize">{serviceName} Service</h3>
                      <button
                        onClick={() => testApiService(serviceName)}
                        disabled={apiTestResults[serviceName]?.loading}
                        className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {apiTestResults[serviceName]?.loading ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                    
                    {apiTestResults[serviceName] && (
                      <div className="text-sm">
                        <p className={`font-medium ${
                          apiTestResults[serviceName].success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {apiTestResults[serviceName].success ? '✅ Success' : '❌ Failed'}
                        </p>
                        <p>Status: {apiTestResults[serviceName].status || 'N/A'}</p>
                        {apiTestResults[serviceName].error && (
                          <p className="text-red-600 mt-1">Error: {apiTestResults[serviceName].error}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Tab */}
          {activeTab === 'realtime' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Real-time Data Synchronization</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Connection Status</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Connected:</strong> {realtimeConnected ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Status:</strong> {connectionStatus}</p>
                    <p><strong>Last Sync:</strong> {lastSync?.toLocaleString() || 'Never'}</p>
                    <p><strong>Pending Updates:</strong> {integrationStatus.pending_operations}</p>
                  </div>
                  <button
                    onClick={() => services.realtime.reconnect()}
                    className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Reconnect
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Recent Events</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {realtimeEvents.length > 0 ? (
                      realtimeEvents.map((event, index) => (
                        <div key={index} className="text-xs bg-white p-2 rounded">
                          <div className="font-medium">{event.type}</div>
                          <div className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No events received yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Testing Tab */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Integration Testing</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Comprehensive Integration Test</h3>
                  <button
                    onClick={runIntegrationTest}
                    disabled={isRunningTest}
                    className="bg-indigo-500 text-white px-6 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {isRunningTest ? 'Running Test...' : 'Run Integration Test'}
                  </button>
                </div>

                {testResults && (
                  <div className="mt-4">
                    <div className={`p-4 rounded mb-4 ${
                      testResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <strong>Test Result:</strong> {testResults.success ? 'PASSED ✅' : 'FAILED ❌'}
                    </div>

                    {testResults.errors.length > 0 && (
                      <div className="bg-red-50 p-4 rounded mb-4">
                        <strong>Errors:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {testResults.errors.map((error, index) => (
                            <li key={index} className="text-red-700">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-white p-4 rounded border">
                      <strong>Detailed Results:</strong>
                      <pre className="mt-2 text-xs overflow-auto max-h-60">
                        {JSON.stringify(testResults.results, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Usage Examples</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">1. Authentication Hook</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { useDjangoAuth } from '@/lib/services';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    isLoading 
  } = useDjangoAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password'
    });
    
    if (result.success) {
      console.log('Login successful');
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.email}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">2. API Service Usage</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { services } from '@/lib/services';

// Get projects
const projects = await services.projects.getProjects({ page: 1 });

// Get developer matches
const matches = await services.matching.getProjectMatches(projectId);

// Process payment
const payment = await services.payments.processMilestonePayment({
  milestone_id: 'milestone-123',
  amount: 1000,
  distributions: [...],
  payment_method_id: 'pm-123'
});

// Send message
const message = await services.communication.sendMessage({
  conversation: 'conv-123',
  content: 'Hello world!'
});`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">3. Real-time Subscriptions</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { useRealtimeSubscription } from '@/lib/services';

function ProjectDashboard({ projectId }) {
  // Subscribe to project-specific updates
  useRealtimeSubscription(\`project_\${projectId}\`, (event) => {
    switch (event.type) {
      case 'task_updated':
        // Handle task update
        break;
      case 'payment_processed':
        // Handle payment update
        break;
    }
  });

  // Subscribe to all events
  useRealtimeSubscription('*', (event) => {
    console.log('Event received:', event);
  });

  return <div>Dashboard content...</div>;
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">4. Integration Service</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { useIntegration } from '@/lib/services';

function SystemStatus() {
  const { 
    status, 
    healthCheck, 
    reconnectAll, 
    performHealthCheck 
  } = useIntegration();

  return (
    <div>
      <p>API Connected: {status.api_connected ? 'Yes' : 'No'}</p>
      <p>WebSocket Connected: {status.websocket_connected ? 'Yes' : 'No'}</p>
      <p>System Health: {healthCheck?.status}</p>
      
      <button onClick={reconnectAll}>
        Reconnect All Services
      </button>
      <button onClick={performHealthCheck}>
        Run Health Check
      </button>
    </div>
  );
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DjangoIntegrationDemo;