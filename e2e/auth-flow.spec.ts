import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('user can register as developer', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Sign Up')
    
    // Fill registration form
    await page.fill('[data-testid="first-name"]', 'John')
    await page.fill('[data-testid="last-name"]', 'Doe')
    await page.fill('[data-testid="email"]', 'john.doe@example.com')
    await page.fill('[data-testid="password"]', 'securepassword123')
    await page.selectOption('[data-testid="role"]', 'developer')
    
    // Submit form
    await page.click('[data-testid="register-button"]')
    
    // Should redirect to dashboard or onboarding
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/)
    
    // Should show welcome message or user info
    await expect(page.locator('text=Welcome')).toBeVisible()
  })

  test('user can login with valid credentials', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    
    // Fill login form
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'testpassword123')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Should show user menu or profile
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('shows error for invalid login credentials', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    
    // Fill login form with invalid credentials
    await page.fill('[data-testid="email"]', 'invalid@example.com')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('user can login with GitHub OAuth', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    
    // Click GitHub login button
    await page.click('[data-testid="github-login"]')
    
    // Should redirect to GitHub OAuth (in real test, would mock this)
    // For now, just check that the redirect happens
    await expect(page).toHaveURL(/github\.com\/login\/oauth\/authorize/)
  })

  test('user can logout', async ({ page }) => {
    // First login (assuming we have a test user)
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Click user menu
    await page.click('[data-testid="user-menu"]')
    
    // Click logout
    await page.click('text=Logout')
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
    
    // Should show login/signup buttons again
    await expect(page.locator('text=Sign In')).toBeVisible()
  })

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/signin/)
    
    // Should show login form
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('form validation works correctly', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Sign Up')
    
    // Try to submit empty form
    await page.click('[data-testid="register-button"]')
    
    // Should show validation errors
    await expect(page.locator('text=First name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
    
    // Test email validation
    await page.fill('[data-testid="email"]', 'invalid-email')
    await page.click('[data-testid="register-button"]')
    await expect(page.locator('text=Invalid email format')).toBeVisible()
    
    // Test password validation
    await page.fill('[data-testid="email"]', 'valid@example.com')
    await page.fill('[data-testid="password"]', '123')
    await page.click('[data-testid="register-button"]')
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })
})