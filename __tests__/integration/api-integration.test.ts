/**
 * Integration tests for Next.js and Django API communication
 */
import { ApiClient } from '@/lib/api-client'
import { ProjectService } from '@/lib/services/project-service'
import { MatchingService } from '@/lib/services/matching-service'
import { AuthService } from '@/lib/auth-django'

// Mock fetch for controlled testing
global.fetch = jest.fn()

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  describe('Authentication Integration', () => {
    it('handles user login flow', async () => {
      // Mock successful login response
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'mock-jwt-token',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'developer',
            first_name: 'Test',
            last_name: 'User'
          }
        })
      })

      const authService = new AuthService()
      const result = await authService.login('test@example.com', 'password123')

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.DJANGO_API_URL}/api/auth/login/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        }
      )

      expect(result).toEqual({
        success: true,
        token: 'mock-jwt-token',
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          role: 'developer'
        })
      })
    })

    it('handles authentication errors', async () => {
      // Mock authentication error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Invalid credentials'
        })
      })

      const authService = new AuthService()
      const result = await authService.login('test@example.com', 'wrongpassword')

      expect(result).toEqual({
        success: false,
        error: 'Invalid credentials'
      })
    })

    it('handles token refresh', async () => {
      // Mock token refresh response
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'new-jwt-token',
          expires_in: 3600
        })
      })

      const authService = new AuthService()
      const result = await authService.refreshToken('old-token')

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.DJANGO_API_URL}/api/auth/refresh/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer old-token'
          }
        }
      )

      expect(result.token).toBe('new-jwt-token')
    })
  })

  describe('Project Service Integration', () => {
    const mockToken = 'mock-jwt-token'
    let projectService: ProjectService

    beforeEach(() => {
      projectService = new ProjectService(mockToken)
    })

    it('creates a new project', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'A test project for integration testing with comprehensive requirements',
        budget_estimate: 10000,
        timeline_estimate: 30
      }

      // Mock successful project creation
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'project-123',
          ...projectData,
          status: 'analyzing',
          created_at: '2024-01-15T10:00:00Z'
        })
      })

      const result = await projectService.createProject(projectData)

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.DJANGO_API_URL}/api/projects/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(projectData)
        }
      )

      expect(result).toEqual(
        expect.objectContaining({
          id: 'project-123',
          title: 'Test Project',
          status: 'analyzing'
        })
      )
    })

    it('retrieves project analysis results', async () => {
      const projectId = 'project-123'

      // Mock analysis results
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          complexity_score: 7.5,
          required_skills: ['Python', 'Django', 'React'],
          estimated_timeline: 35,
          budget_range: { min: 8000, max: 12000 },
          senior_developer_required: true,
          task_breakdown: [
            {
              title: 'Backend API Development',
              description: 'Develop REST API with Django',
              skills: ['Python', 'Django', 'PostgreSQL'],
              estimated_hours: 40
            },
            {
              title: 'Frontend Development',
              description: 'Build React frontend',
              skills: ['React', 'JavaScript', 'CSS'],
              estimated_hours: 30
            }
          ]
        })
      })

      const result = await projectService.getProjectAnalysis(projectId)

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.DJANGO_API_URL}/api/projects/${projectId}/analysis/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      )

      expect(result).toEqual(
        expect.objectContaining({
          complexity_score: 7.5,
          required_skills: expect.arrayContaining(['Python', 'Django', 'React']),
          senior_developer_required: true
        })
      )
    })

    it('handles project creation errors', async () => {
      const projectData = {
        title: '',
        description: 'Short',
        budget_estimate: -100,
        timeline_estimate: 0
      }

      // Mock validation errors
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          errors: {
            title: ['This field is required'],
            description: ['Description must be at least 50 characters'],
            budget_estimate: ['Budget must be positive']
          }
        })
      })

      await expect(projectService.createProject(projectData)).rejects.toThrow()
    })
  })

  describe('Matching Service Integration', () => {
    const mockToken = 'mock-jwt-token'
    let matchingService: MatchingService

    beforeEach(() => {
      matchingService = new MatchingService(mockToken)
    })

    it('retrieves developer matches for project', async () => {
      const projectId = 'project-123'

      // Mock matching results
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            {
              developer_id: 'dev-1',
              developer: {
                id: 'dev-1',
                email: 'senior@example.com',
                first_name: 'Senior',
                last_name: 'Developer',
                profile: {
                  skills: ['Python', 'Django', 'React', 'Leadership'],
                  experience_level: 'senior',
                  hourly_rate: 120.00
                }
              },
              match_score: 0.95,
              skill_match_score: 0.92,
              availability_score: 1.0,
              experience_match_score: 0.98,
              matching_details: {
                matched_skills: ['Python', 'Django', 'React'],
                missing_skills: [],
                experience_level: 'senior'
              }
            },
            {
              developer_id: 'dev-2',
              developer: {
                id: 'dev-2',
                email: 'mid@example.com',
                first_name: 'Mid',
                last_name: 'Developer',
                profile: {
                  skills: ['Python', 'Django'],
                  experience_level: 'mid',
                  hourly_rate: 75.00
                }
              },
              match_score: 0.82,
              skill_match_score: 0.85,
              availability_score: 1.0,
              experience_match_score: 0.75,
              matching_details: {
                matched_skills: ['Python', 'Django'],
                missing_skills: ['React'],
                experience_level: 'mid'
              }
            }
          ]
        })
      })

      const result = await matchingService.getProjectMatches(projectId)

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.DJANGO_API_URL}/api/projects/${projectId}/matches/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      )

      expect(result.matches).toHaveLength(2)
      expect(result.matches[0]).toEqual(
        expect.objectContaining({
          developer_id: 'dev-1',
          match_score: 0.95,
          matching_details: expect.objectContaining({
            matched_skills: expect.arrayContaining(['Python', 'Django', 'React'])
          })
        })
      )
    })

    it('handles matching service errors', async () => {
      const projectId = 'invalid-project'

      // Mock not found error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Project not found'
        })
      })

      await expect(matchingService.getProjectMatches(projectId)).rejects.toThrow('Project not found')
    })

    it('retrieves task-specific matches', async () => {
      const projectId = 'project-123'

      // Mock task matches
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          task_matches: [
            {
              task_id: 'task-1',
              task_title: 'Backend Development',
              matches: [
                {
                  developer_id: 'dev-1',
                  match_score: 0.9,
                  hourly_rate: 85.00,
                  estimated_cost: 3400.00
                }
              ]
            },
            {
              task_id: 'task-2',
              task_title: 'Frontend Development',
              matches: [
                {
                  developer_id: 'dev-2',
                  match_score: 0.88,
                  hourly_rate: 70.00,
                  estimated_cost: 2100.00
                }
              ]
            }
          ]
        })
      })

      const result = await matchingService.getTaskMatches(projectId)

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.DJANGO_API_URL}/api/projects/${projectId}/task-matches/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      )

      expect(result.task_matches).toHaveLength(2)
      expect(result.task_matches[0].task_title).toBe('Backend Development')
    })
  })

  describe('Error Handling and Retry Logic', () => {
    it('retries failed requests', async () => {
      const apiClient = new ApiClient('mock-token')

      // Mock first request failure, second success
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' })
        })

      const result = await apiClient.get('/api/test-endpoint/')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ data: 'success' })
    })

    it('handles network errors', async () => {
      const apiClient = new ApiClient('mock-token')

      // Mock network error
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(apiClient.get('/api/test-endpoint/')).rejects.toThrow('Network error')
    })

    it('handles rate limiting', async () => {
      const apiClient = new ApiClient('mock-token')

      // Mock rate limit response
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: (header: string) => {
            if (header === 'Retry-After') return '60'
            return null
          }
        },
        json: async () => ({ error: 'Rate limit exceeded' })
      })

      await expect(apiClient.get('/api/test-endpoint/')).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('Real-time Data Synchronization', () => {
    it('handles WebSocket connection for real-time updates', async () => {
      // Mock WebSocket
      const mockWebSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }

      global.WebSocket = jest.fn(() => mockWebSocket) as any

      const { WebSocketClient } = await import('@/lib/websocket-client')
      const wsClient = new WebSocketClient('ws://localhost:8000/ws/')

      // Simulate connection
      const connectHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )?.[1]
      connectHandler?.()

      // Simulate receiving project update
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]
      
      const mockEvent = {
        data: JSON.stringify({
          type: 'project_update',
          project_id: 'project-123',
          status: 'analysis_complete',
          data: {
            complexity_score: 7.5,
            required_skills: ['Python', 'React']
          }
        })
      }

      messageHandler?.(mockEvent)

      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })
  })
})