import { test, expect } from '@playwright/test'

test.describe('Project Creation and AI Matching Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client user
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email"]', 'client@example.com')
    await page.fill('[data-testid="password"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('client can create project and get AI analysis', async ({ page }) => {
    // Navigate to project creation
    await page.click('text=Create Project')
    await expect(page).toHaveURL(/\/projects\/create/)
    
    // Fill project form
    await page.fill('[data-testid="project-title"]', 'E-commerce Platform')
    await page.fill('[data-testid="project-description"]', 
      'Build a comprehensive e-commerce platform with user authentication, product catalog, shopping cart, payment processing, and admin dashboard. Need both backend API and frontend interface with modern design.'
    )
    await page.fill('[data-testid="budget-estimate"]', '15000')
    await page.selectOption('[data-testid="timeline-estimate"]', '45')
    
    // Submit for AI analysis
    await page.click('[data-testid="analyze-project"]')
    
    // Should show loading state
    await expect(page.locator('text=Analyzing project')).toBeVisible()
    
    // Wait for analysis results
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 })
    
    // Should show complexity score
    await expect(page.locator('[data-testid="complexity-score"]')).toBeVisible()
    
    // Should show required skills
    await expect(page.locator('[data-testid="required-skills"]')).toBeVisible()
    await expect(page.locator('text=Python')).toBeVisible()
    await expect(page.locator('text=React')).toBeVisible()
    
    // Should show task breakdown
    await expect(page.locator('[data-testid="task-breakdown"]')).toBeVisible()
    await expect(page.locator('text=Backend')).toBeVisible()
    await expect(page.locator('text=Frontend')).toBeVisible()
    
    // Should indicate if senior developer is required
    const seniorRequired = await page.locator('[data-testid="senior-required"]').isVisible()
    if (seniorRequired) {
      await expect(page.locator('text=Senior developer required')).toBeVisible()
    }
  })

  test('client can view developer matches', async ({ page }) => {
    // Create project first (assuming it exists or create it)
    await page.goto('/projects/create')
    await page.fill('[data-testid="project-title"]', 'Test Matching Project')
    await page.fill('[data-testid="project-description"]', 
      'A test project for checking developer matching functionality with various skill requirements.'
    )
    await page.fill('[data-testid="budget-estimate"]', '8000')
    await page.click('[data-testid="analyze-project"]')
    
    // Wait for analysis
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 })
    
    // Navigate to matching results
    await page.click('[data-testid="view-matches"]')
    
    // Should show developer matches
    await expect(page.locator('[data-testid="developer-matches"]')).toBeVisible()
    
    // Should show match scores
    await expect(page.locator('[data-testid="match-score"]').first()).toBeVisible()
    
    // Should show developer profiles
    await expect(page.locator('[data-testid="developer-profile"]').first()).toBeVisible()
    
    // Should show skill matching details
    await expect(page.locator('[data-testid="skill-match"]').first()).toBeVisible()
    
    // Can view developer details
    await page.click('[data-testid="view-developer-details"]')
    await expect(page.locator('[data-testid="developer-details-modal"]')).toBeVisible()
    
    // Should show developer skills, experience, and portfolio
    await expect(page.locator('[data-testid="developer-skills"]')).toBeVisible()
    await expect(page.locator('[data-testid="developer-experience"]')).toBeVisible()
  })

  test('client can assign senior developer and modify proposal', async ({ page }) => {
    // Navigate to project that needs senior developer
    await page.goto('/projects')
    await page.click('[data-testid="project-card"]')
    
    // Should show senior developer assignment option
    await expect(page.locator('[data-testid="assign-senior-dev"]')).toBeVisible()
    
    // Select senior developer
    await page.click('[data-testid="assign-senior-dev"]')
    await page.click('[data-testid="senior-dev-option"]')
    await page.click('[data-testid="confirm-assignment"]')
    
    // Should show proposal review stage
    await expect(page.locator('text=Proposal Review')).toBeVisible()
    
    // Senior developer should be able to modify proposal
    // (This would require logging in as senior developer)
    // For now, just check that the interface shows the proposal
    await expect(page.locator('[data-testid="project-proposal"]')).toBeVisible()
    await expect(page.locator('[data-testid="budget-breakdown"]')).toBeVisible()
    await expect(page.locator('[data-testid="timeline-details"]')).toBeVisible()
  })

  test('project status updates correctly through workflow', async ({ page }) => {
    // Create new project
    await page.goto('/projects/create')
    await page.fill('[data-testid="project-title"]', 'Status Test Project')
    await page.fill('[data-testid="project-description"]', 
      'Testing project status updates through the complete workflow from creation to completion.'
    )
    await page.fill('[data-testid="budget-estimate"]', '5000')
    await page.click('[data-testid="analyze-project"]')
    
    // Initial status should be "Analyzing"
    await expect(page.locator('[data-testid="project-status"]')).toContainText('Analyzing')
    
    // After analysis, should move to next stage
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 })
    
    // Status should update
    await expect(page.locator('[data-testid="project-status"]')).not.toContainText('Analyzing')
    
    // Should show next steps
    await expect(page.locator('[data-testid="next-steps"]')).toBeVisible()
  })

  test('client can edit project details before final submission', async ({ page }) => {
    // Create project
    await page.goto('/projects/create')
    await page.fill('[data-testid="project-title"]', 'Editable Project')
    await page.fill('[data-testid="project-description"]', 
      'Initial description that will be edited to test the editing functionality.'
    )
    await page.fill('[data-testid="budget-estimate"]', '6000')
    await page.click('[data-testid="analyze-project"]')
    
    // Wait for analysis
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 })
    
    // Click edit project
    await page.click('[data-testid="edit-project"]')
    
    // Should make form editable again
    await expect(page.locator('[data-testid="project-title"]')).not.toBeDisabled()
    
    // Edit project details
    await page.fill('[data-testid="project-title"]', 'Updated Project Title')
    await page.fill('[data-testid="budget-estimate"]', '8000')
    
    // Re-analyze with updated details
    await page.click('[data-testid="analyze-project"]')
    
    // Should show updated analysis
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('text=Updated Project Title')).toBeVisible()
  })

  test('error handling works correctly', async ({ page }) => {
    // Test form validation
    await page.goto('/projects/create')
    await page.click('[data-testid="analyze-project"]')
    
    // Should show validation errors
    await expect(page.locator('text=Project title is required')).toBeVisible()
    await expect(page.locator('text=Project description is required')).toBeVisible()
    
    // Test description length validation
    await page.fill('[data-testid="project-title"]', 'Short Description Test')
    await page.fill('[data-testid="project-description"]', 'Too short')
    await page.click('[data-testid="analyze-project"]')
    
    await expect(page.locator('text=Description must be at least 50 characters')).toBeVisible()
    
    // Test budget validation
    await page.fill('[data-testid="project-description"]', 
      'This is a longer description that meets the minimum character requirement for testing.'
    )
    await page.fill('[data-testid="budget-estimate"]', '100')
    await page.click('[data-testid="analyze-project"]')
    
    await expect(page.locator('text=Budget must be at least $500')).toBeVisible()
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to project creation
    await page.goto('/projects/create')
    
    // Form should be responsive
    await expect(page.locator('[data-testid="project-form"]')).toBeVisible()
    
    // Fill form on mobile
    await page.fill('[data-testid="project-title"]', 'Mobile Test Project')
    await page.fill('[data-testid="project-description"]', 
      'Testing the project creation form on mobile devices to ensure responsive design works correctly.'
    )
    await page.fill('[data-testid="budget-estimate"]', '7000')
    
    // Submit should work on mobile
    await page.click('[data-testid="analyze-project"]')
    
    // Results should be mobile-friendly
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 })
    
    // Check that content is not cut off
    const analysisResults = page.locator('[data-testid="analysis-results"]')
    const boundingBox = await analysisResults.boundingBox()
    expect(boundingBox?.width).toBeLessThanOrEqual(375)
  })
})