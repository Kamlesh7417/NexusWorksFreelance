# Django Backend Integration

This document provides comprehensive information about the Next.js frontend integration with the Django backend API.

## Overview

The Django integration provides a complete solution for connecting the Next.js frontend with the Django backend, including:

- **API Client Service**: Centralized HTTP client with authentication, retry logic, and error handling
- **Authentication Management**: JWT token-based authentication with automatic refresh
- **Real-time Synchronization**: WebSocket-based real-time data updates
- **Service Layer**: Dedicated service classes for all major features
- **Error Handling**: Comprehensive error handling with circuit breaker pattern
- **Integration Testing**: Complete test suite for all integration components

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Service Layer  │    │ Django Backend  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Components  │ │◄──►│ │ API Client  │ │◄──►│ │ REST API    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Auth Hooks  │ │◄──►│ │ Auth Service│ │◄──►│ │ JWT Auth    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Real-time   │ │◄──►│ │ WebSocket   │ │◄──►│ │ WebSocket   │ │
│ │ Components  │ │    │ │ Client      │ │    │ │ Server      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment Configuration

### Required Environment Variables

Add these variables to your `.env.local` file:

```bash
# Django Backend Configuration
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000/api
NEXT_PUBLIC_DJANGO_WS_URL=ws://localhost:8000/ws
DJANGO_SECRET_KEY=your-django-secret-key

# API Configuration
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_API_RETRY_ATTEMPTS=3
NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC=true

# Additional Django Integration Settings
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_ENABLE_API_LOGGING=true
NEXT_PUBLIC_ENABLE_CIRCUIT_BREAKER=true
```

### Environment Variable Descriptions

- `NEXT_PUBLIC_DJANGO_API_URL`: Base URL for Django REST API
- `NEXT_PUBLIC_DJANGO_WS_URL`: WebSocket URL for real-time features
- `NEXT_PUBLIC_API_TIMEOUT`: Request timeout in milliseconds
- `NEXT_PUBLIC_API_RETRY_ATTEMPTS`: Number of retry attempts for failed requests
- `NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC`: Enable/disable real-time synchronization
- `NEXT_PUBLIC_ENABLE_API_LOGGING`: Enable detailed API request logging
- `NEXT_PUBLIC_ENABLE_CIRCUIT_BREAKER`: Enable circuit breaker for fault tolerance

## Core Components

### 1. API Client (`lib/api-client.ts`)

The central HTTP client that handles all communication with the Django backend.

**Features:**
- Automatic JWT token management
- Request/response interceptors
- Timeout handling
- Retry logic with exponential backoff
- Request ID tracking
- Type-safe interfaces

**Usage:**
```typescript
import { apiClient } from '@/lib/api-client';

// Make authenticated request
const response = await apiClient.getProjects();

// Make custom request
const customResponse = await apiClient.request('/custom-endpoint/', {
  method: 'POST',
  body: JSON.stringify({ data: 'value' }),
});
```

### 2. Authentication Service (`lib/auth-django.ts`)

Manages user authentication and session state.

**Features:**
- JWT token management
- Automatic token refresh
- Role-based access control
- React hooks for components
- Persistent authentication state

**Usage:**
```typescript
import { useDjangoAuth } from '@/lib/services';

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
}
```

### 3. Real-time Sync (`lib/realtime-sync.ts`)

Provides WebSocket-based real-time data synchronization.

**Features:**
- WebSocket connection management
- Event subscription system
- Optimistic updates
- Automatic reconnection
- Network status handling

**Usage:**
```typescript
import { useRealtimeSubscription } from '@/lib/services';

function ProjectDashboard({ projectId }) {
  // Subscribe to project-specific updates
  useRealtimeSubscription(`project_${projectId}`, (event) => {
    switch (event.type) {
      case 'task_updated':
        // Handle task update
        break;
      case 'payment_processed':
        // Handle payment update
        break;
    }
  });

  return <div>Dashboard content...</div>;
}
```

### 4. Service Layer

Dedicated service classes for each major feature area:

#### Project Service (`lib/services/project-service.ts`)
- Project CRUD operations
- Task management
- AI analysis integration
- Team management

#### Matching Service (`lib/services/matching-service.ts`)
- Developer-project matching
- Skill analysis
- Matching preferences
- Algorithm testing

#### Payment Service (`lib/services/payment-service.ts`)
- Payment processing
- Milestone management
- Payment methods
- Dispute handling

#### Communication Service (`lib/services/communication-service.ts`)
- Messaging system
- Notifications
- File attachments
- Conversation management

#### Learning Service (`lib/services/learning-service.ts`)
- Learning paths
- Course management
- Shadowing sessions
- Skill assessments

### 5. Error Handling (`lib/api-error-handler.ts`)

Comprehensive error handling with advanced patterns.

**Features:**
- Circuit breaker pattern
- Retry logic with exponential backoff
- User-friendly error messages
- Error categorization
- Monitoring and metrics

### 6. Integration Service (`lib/services/integration-service.ts`)

Unified interface for all Django backend integrations.

**Features:**
- Health monitoring
- Service status tracking
- Automatic reconnection
- Global event handling

## Usage Examples

### Basic API Usage

```typescript
import { services } from '@/lib/services';

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
});
```

### Authentication Hook

```typescript
import { useDjangoAuth } from '@/lib/services';

function AuthComponent() {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout,
    isClient,
    isDeveloper,
    isAdmin 
  } = useDjangoAuth();

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.email}!</p>
        <p>Role: {user?.role}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <LoginForm onLogin={login} />;
}
```

### Real-time Integration

```typescript
import { useRealtimeSync, useRealtimeSubscription } from '@/lib/services';

function RealtimeComponent() {
  const { isConnected, lastSync, reconnect } = useRealtimeSync();

  // Subscribe to all events
  useRealtimeSubscription('*', (event) => {
    console.log('Event received:', event);
  });

  // Subscribe to specific events
  useRealtimeSubscription('project_updated', (event) => {
    // Handle project updates
  });

  return (
    <div>
      <p>Real-time Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Last Sync: {lastSync?.toLocaleString()}</p>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```

### Integration Status

```typescript
import { useIntegration } from '@/lib/services';

function SystemStatus() {
  const { 
    status, 
    healthCheck, 
    reconnectAll, 
    performHealthCheck 
  } = useIntegration();

  return (
    <div>
      <h3>System Status</h3>
      <p>API Connected: {status.api_connected ? 'Yes' : 'No'}</p>
      <p>WebSocket Connected: {status.websocket_connected ? 'Yes' : 'No'}</p>
      <p>Auth Status: {status.auth_status}</p>
      
      {healthCheck && (
        <div>
          <p>System Health: {healthCheck.status}</p>
          <p>API Response Time: {healthCheck.response_times.api}ms</p>
        </div>
      )}
      
      <button onClick={reconnectAll}>Reconnect All Services</button>
      <button onClick={performHealthCheck}>Run Health Check</button>
    </div>
  );
}
```

## Testing

### Integration Testing

The integration includes a comprehensive test suite:

```typescript
import { testIntegration } from '@/lib/test-integration';

// Run full integration test
const results = await testIntegration();
console.log('Test Results:', results);
```

### Manual Testing

Use the Django Integration Demo component to test all features:

```typescript
import { DjangoIntegrationDemo } from '@/components/integration/django-integration-demo';

function TestPage() {
  return <DjangoIntegrationDemo />;
}
```

### Health Checks

Monitor system health:

```typescript
import { integrationService } from '@/lib/services';

// Perform health check
const health = await integrationService.performHealthCheck();
console.log('System Health:', health);

// Get integration status
const status = integrationService.getIntegrationStatus();
console.log('Integration Status:', status);
```

## Error Handling

### API Errors

All API calls return a consistent error format:

```typescript
interface APIResponse<T> {
  data?: T;
  error?: string;
  status: number;
  message?: string;
}
```

### Error Categories

- **Network Errors**: Connection issues, timeouts
- **Authentication Errors**: Invalid tokens, expired sessions
- **Validation Errors**: Invalid input data
- **Server Errors**: Backend service issues
- **Rate Limiting**: Too many requests

### Circuit Breaker

The integration includes circuit breaker functionality to handle service failures gracefully:

```typescript
import { apiErrorHandler } from '@/lib/services';

// Check circuit breaker status
const status = apiErrorHandler.getCircuitBreakerStatus();
console.log('Circuit Breaker Status:', status);

// Reset circuit breaker
apiErrorHandler.resetCircuitBreaker('/api/projects/');
```

## Performance Optimization

### Caching

- Response caching for frequently accessed data
- Optimistic updates for better UX
- Local storage for authentication tokens

### Connection Management

- Connection pooling for HTTP requests
- WebSocket connection reuse
- Automatic reconnection on network changes

### Request Optimization

- Request deduplication
- Batch operations where possible
- Compression for large payloads

## Security

### Authentication

- JWT token-based authentication
- Automatic token refresh
- Secure token storage

### API Security

- Request signing
- CSRF protection
- Rate limiting
- Input validation

### WebSocket Security

- Token-based WebSocket authentication
- Message validation
- Connection limits

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check Django backend is running
   - Verify API URL configuration
   - Check network connectivity

2. **Authentication Failures**
   - Verify credentials
   - Check token expiration
   - Clear local storage

3. **WebSocket Issues**
   - Check WebSocket URL
   - Verify network allows WebSocket connections
   - Check browser compatibility

### Debug Mode

Enable debug logging:

```bash
NEXT_PUBLIC_ENABLE_API_LOGGING=true
```

### Health Monitoring

Use the integration service to monitor system health:

```typescript
// Monitor integration status
const unsubscribe = integrationService.onStatusChange((status) => {
  console.log('Integration status changed:', status);
});

// Cleanup
unsubscribe();
```

## Development

### Adding New Services

1. Create service class in `lib/services/`
2. Add to service exports in `lib/services/index.ts`
3. Add tests in `lib/test-integration.ts`
4. Update documentation

### Extending API Client

Add new endpoints to the API client:

```typescript
// In lib/api-client.ts
async getCustomData(): Promise<APIResponse<CustomData>> {
  return this.makeRequest('/custom-endpoint/');
}
```

### Adding Real-time Events

Handle new event types in the real-time sync:

```typescript
// In lib/realtime-sync.ts
case 'custom_event':
  this.handleCustomEvent(event);
  break;
```

## Deployment

### Environment Setup

Ensure all environment variables are configured for production:

```bash
NEXT_PUBLIC_DJANGO_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_DJANGO_WS_URL=wss://api.yourdomain.com/ws
```

### Build Configuration

The integration is automatically included in the Next.js build process.

### Monitoring

Set up monitoring for:
- API response times
- Error rates
- WebSocket connection status
- Authentication success rates

## Support

For issues or questions about the Django integration:

1. Check the troubleshooting section
2. Run the integration test suite
3. Review the demo component examples
4. Check the Django backend logs

## Changelog

### Version 1.0.0
- Initial Django backend integration
- Complete API client implementation
- Authentication service with JWT
- Real-time synchronization
- Comprehensive service layer
- Error handling and retry logic
- Integration testing suite
- Demo component and documentation