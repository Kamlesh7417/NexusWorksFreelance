/**
 * Tests for AI project submission form
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectSubmissionForm } from '@/components/ai/project-submission-form'

// Mock API calls
global.fetch = jest.fn()

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/projects/create',
  }),
}))

describe('ProjectSubmissionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  it('renders project submission form correctly', () => {
    render(<ProjectSubmissionForm />)
    
    expect(screen.getByLabelText(/project title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/project description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/budget estimate/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/timeline/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyze project/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<ProjectSubmissionForm />)
    
    const submitButton = screen.getByRole('button', { name: /analyze project/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/project title is required/i)).toBeInTheDocument()
    expect(screen.getByText(/project description is required/i)).toBeInTheDocument()
    expect(screen.getByText(/budget estimate is required/i)).toBeInTheDocument()
  })

  it('validates minimum description length', async () => {
    const user = userEvent.setup()
    render(<ProjectSubmissionForm />)
    
    const descriptionInput = screen.getByLabelText(/project description/i)
    await user.type(descriptionInput, 'Too short')
    
    const submitButton = screen.getByRole('button', { name: /analyze project/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/description must be at least 50 characters/i)).toBeInTheDocument()
  })

  it('validates budget range', async () => {
    const user = userEvent.setup()
    render(<ProjectSubmissionForm />)
    
    const budgetInput = screen.getByLabelText(/budget estimate/i)
    await user.type(budgetInput, '100')
    
    const submitButton = screen.getByRole('button', { name: /analyze project/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/budget must be at least \$500/i)).toBeInTheDocument()
  })

  it('submits project for AI analysis', async () => {
    const user = userEvent.setup()
    
    // Mock successful API response
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'project-123',
        analysis: {
          complexity_score: 7.5,
          required_skills: ['Python', 'Django', 'React'],
          estimated_timeline: 30,
          senior_developer_required: true
        }
      })
    })

    render(<ProjectSubmissionForm />)
    
    // Fill out the form
    await user.type(screen.getByLabelText(/project title/i), 'E-commerce Platform')
    await user.type(
      screen.getByLabelText(/project description/i), 
      'Build a comprehensive e-commerce platform with user authentication, product catalog, shopping cart, and payment processing. Need both backend API and frontend interface.'
    )
    await user.type(screen.getByLabelText(/budget estimate/i), '10000')
    await user.selectOptions(screen.getByLabelText(/timeline/i), '30')
    
    const submitButton = screen.getByRole('button', { name: /analyze project/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': expect.any(String)
        },
        body: JSON.stringify({
          title: 'E-commerce Platform',
          description: expect.stringContaining('Build a comprehensive e-commerce platform'),
          budget_estimate: 10000,
          timeline_estimate: 30
        })
      })
    })
  })

  it('displays AI analysis results', async () => {
    const user = userEvent.setup()
    
    // Mock successful API response with analysis
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'project-123',
        analysis: {
          complexity_score: 8.2,
          required_skills: ['Python', 'Django', 'React', 'PostgreSQL'],
          estimated_timeline: 45,
          budget_range: { min: 8000, max: 12000 },
          senior_developer_required: true,
          task_breakdown: [
            { title: 'Backend API', hours: 60, skills: ['Python', 'Django'] },
            { title: 'Frontend UI', hours: 40, skills: ['React', 'JavaScript'] }
          ]
        }
      })
    })

    render(<ProjectSubmissionForm />)
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/project title/i), 'Complex Project')
    await user.type(
      screen.getByLabelText(/project description/i), 
      'A very complex project requiring multiple technologies and senior expertise'
    )
    await user.type(screen.getByLabelText(/budget estimate/i), '10000')
    
    const submitButton = screen.getByRole('button', { name: /analyze project/i })
    await user.click(submitButton)
    
    // Wait for analysis results to appear
    await waitFor(() => {
      expect(screen.getByText(/ai analysis results/i)).toBeInTheDocument()
      expect(screen.getByText(/complexity score: 8.2/i)).toBeInTheDocument()
      expect(screen.getByText(/senior developer required/i)).toBeInTheDocument()
      expect(screen.getByText(/python/i)).toBeInTheDocument()
      expect(screen.getByText(/react/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during analysis', async () => {
    const user = userEvent.setup()
    
    // Mock delayed response
    ;(fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ id: 'project-123', analysis: {} })
      }), 100))
    )

    render(<ProjectSubmissionForm />)
    
    // Fill form
    await user.type(screen.getByLabelText(/project title/i), 'Test Project')
    await user.type(
      screen.getByLabelText(/project description/i), 
      'A test project for checking loading states during AI analysis'
    )
    await user.type(screen.getByLabelText(/budget estimate/i), '5000')
    
    const submitButton = screen.getByRole('button', { name: /analyze project/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/analyzing project/i)).toBeInTheDocument()
    expect(screen.getByText(/ai is analyzing your project/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Analysis service temporarily unavailable'
      })
    })

    render(<ProjectSubmissionForm />)
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/project title/i), 'Error Test')
    await user.type(
      screen.getByLabelText(/project description/i), 
      'Testing error handling in the project submission form'
    )
    await user.type(screen.getByLabelText(/budget estimate/i), '5000')
    
    const submitButton = screen.getByRole('button', { name: /analyze project/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/analysis service temporarily unavailable/i)).toBeInTheDocument()
    })
  })

  it('allows editing project details after analysis', async () => {
    const user = userEvent.setup()
    
    // Mock successful analysis
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'project-123',
        analysis: {
          complexity_score: 6.0,
          required_skills: ['JavaScript', 'React'],
          estimated_timeline: 20
        }
      })
    })

    render(<ProjectSubmissionForm />)
    
    // Submit initial form
    await user.type(screen.getByLabelText(/project title/i), 'Initial Title')
    await user.type(
      screen.getByLabelText(/project description/i), 
      'Initial description that meets the minimum length requirement for testing'
    )
    await user.type(screen.getByLabelText(/budget estimate/i), '5000')
    
    await user.click(screen.getByRole('button', { name: /analyze project/i }))
    
    // Wait for results and edit button
    await waitFor(() => {
      expect(screen.getByText(/ai analysis results/i)).toBeInTheDocument()
    })
    
    const editButton = screen.getByRole('button', { name: /edit project/i })
    await user.click(editButton)
    
    // Form should be editable again
    const titleInput = screen.getByLabelText(/project title/i)
    expect(titleInput).not.toBeDisabled()
    
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')
    
    expect(titleInput).toHaveValue('Updated Title')
  })

  it('displays task breakdown in analysis results', async () => {
    const user = userEvent.setup()
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'project-123',
        analysis: {
          complexity_score: 7.0,
          task_breakdown: [
            { title: 'Database Setup', hours: 16, skills: ['PostgreSQL'] },
            { title: 'API Development', hours: 32, skills: ['Python', 'Django'] },
            { title: 'Frontend Development', hours: 24, skills: ['React', 'TypeScript'] }
          ]
        }
      })
    })

    render(<ProjectSubmissionForm />)
    
    // Submit form
    await user.type(screen.getByLabelText(/project title/i), 'Task Breakdown Test')
    await user.type(
      screen.getByLabelText(/project description/i), 
      'Testing the display of task breakdown in analysis results'
    )
    await user.type(screen.getByLabelText(/budget estimate/i), '8000')
    
    await user.click(screen.getByRole('button', { name: /analyze project/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/task breakdown/i)).toBeInTheDocument()
      expect(screen.getByText(/database setup/i)).toBeInTheDocument()
      expect(screen.getByText(/api development/i)).toBeInTheDocument()
      expect(screen.getByText(/frontend development/i)).toBeInTheDocument()
      expect(screen.getByText(/16 hours/i)).toBeInTheDocument()
      expect(screen.getByText(/32 hours/i)).toBeInTheDocument()
      expect(screen.getByText(/24 hours/i)).toBeInTheDocument()
    })
  })
})