/**
 * Tests for authentication forms
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthForms } from '@/components/auth/auth-forms'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/auth/signin',
  }),
}))

// Mock API calls
global.fetch = jest.fn()

describe('AuthForms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  describe('Login Form', () => {
    it('renders login form correctly', () => {
      render(<AuthForms mode="login" />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(<AuthForms mode="login" />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<AuthForms mode="login" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })

    it('submits login form with valid data', async () => {
      const user = userEvent.setup()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'mock-token',
          user: { id: '1', email: 'test@example.com', role: 'developer' }
        })
      })

      render(<AuthForms mode="login" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      })
    })

    it('displays error message on login failure', async () => {
      const user = userEvent.setup()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid credentials'
        })
      })

      render(<AuthForms mode="login" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('Registration Form', () => {
    it('renders registration form correctly', () => {
      render(<AuthForms mode="register" />)
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('validates password strength', async () => {
      const user = userEvent.setup()
      render(<AuthForms mode="register" />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, '123')
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })

    it('validates role selection', async () => {
      const user = userEvent.setup()
      render(<AuthForms mode="register" />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/please select a role/i)).toBeInTheDocument()
    })

    it('submits registration form with valid data', async () => {
      const user = userEvent.setup()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'mock-token',
          user: { id: '1', email: 'newuser@example.com', role: 'developer' }
        })
      })

      render(<AuthForms mode="register" />)
      
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
      await user.type(screen.getByLabelText(/password/i), 'securepassword123')
      
      const roleSelect = screen.getByLabelText(/role/i)
      await user.selectOptions(roleSelect, 'developer')
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: 'John',
            last_name: 'Doe',
            email: 'newuser@example.com',
            password: 'securepassword123',
            role: 'developer'
          })
        })
      })
    })
  })

  describe('GitHub OAuth', () => {
    it('renders GitHub sign-in button', () => {
      render(<AuthForms mode="login" />)
      
      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
    })

    it('handles GitHub OAuth flow', async () => {
      const user = userEvent.setup()
      
      // Mock window.location.href assignment
      delete (window as any).location
      window.location = { href: '' } as any

      render(<AuthForms mode="login" />)
      
      const githubButton = screen.getByRole('button', { name: /continue with github/i })
      await user.click(githubButton)
      
      expect(window.location.href).toContain('github.com/login/oauth/authorize')
    })
  })

  describe('Form Switching', () => {
    it('switches between login and register modes', async () => {
      const user = userEvent.setup()
      render(<AuthForms mode="login" />)
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      
      const switchLink = screen.getByText(/don't have an account/i)
      await user.click(switchLink)
      
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state during form submission', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      ;(fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ token: 'mock-token', user: {} })
        }), 100))
      )

      render(<AuthForms mode="login" />)
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<AuthForms mode="login" />)
      
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    })

    it('associates error messages with form fields', async () => {
      const user = userEvent.setup()
      render(<AuthForms mode="login" />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      const emailInput = screen.getByLabelText(/email/i)
      const emailError = screen.getByText(/email is required/i)
      
      expect(emailInput).toHaveAttribute('aria-describedby')
      expect(emailError).toHaveAttribute('id')
    })
  })
})