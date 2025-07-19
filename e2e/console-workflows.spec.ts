import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
};

test.describe('Console User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
    await page.route('**/api/auth/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 1,
              email: testUser.email,
              role: 'developer',
            },
            token: 'mock-jwt-token',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock API endpoints
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/profile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            full_name: 'Test User',
            email: testUser.email,
            skills: ['JavaScript', 'React', 'Node.js'],
          }),
        });
      } else if (url.includes('/projects')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              title: 'Test Project',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
            },
          ]),
        });
      } else if (url.includes('/messages')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              content: 'Test message',
              sender: 'Test Sender',
              timestamp: '2024-01-01T00:00:00Z',
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('complete console navigation workflow', async ({ page }) => {
    // Navigate to console
    await page.goto('/console');

    // Should be on dashboard by default
    await expect(page.locator('[data-testid="console-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="console-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="console-main-content"]')).toBeVisible();

    // Check initial section is dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Navigate to profile section
    await page.click('button:has-text("Profile")');
    await expect(page.locator('text=Profile Management')).toBeVisible();

    // Navigate to messages section
    await page.click('button:has-text("Messages")');
    await expect(page.locator('text=Messages')).toBeVisible();

    // Navigate to projects section
    await page.click('button:has-text("Projects")');
    await expect(page.locator('text=Projects')).toBeVisible();

    // Navigate to payments section
    await page.click('button:has-text("Payments")');
    await expect(page.locator('text=Payments')).toBeVisible();

    // Navigate to settings section
    await page.click('button:has-text("Settings")');
    await expect(page.locator('text=Settings')).toBeVisible();

    // Return to dashboard
    await page.click('button:has-text("Dashboard")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('sidebar collapse and expand workflow', async ({ page }) => {
    await page.goto('/console');

    // Sidebar should be expanded by default
    await expect(page.locator('[data-testid="console-sidebar"]')).toHaveClass(/w-64/);

    // Collapse sidebar
    await page.click('[title="Collapse sidebar"]');
    await expect(page.locator('[data-testid="console-sidebar"]')).toHaveClass(/w-16/);

    // Expand sidebar
    await page.click('[title="Expand sidebar"]');
    await expect(page.locator('[data-testid="console-sidebar"]')).toHaveClass(/w-64/);
  });

  test('global search functionality', async ({ page }) => {
    await page.goto('/console');

    // Find search input
    const searchInput = page.locator('input[placeholder="Search..."]');
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('test query');
    await expect(searchInput).toHaveValue('test query');

    // Search should persist across section changes
    await page.click('button:has-text("Profile")');
    await expect(searchInput).toHaveValue('test query');

    // Clear search
    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');
  });

  test('user menu workflow', async ({ page }) => {
    await page.goto('/console');

    // Click user menu button
    await page.click('[data-testid="user-menu-button"]');

    // Check menu items
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Sign Out')).toBeVisible();

    // Click outside to close menu
    await page.click('body');
    await expect(page.locator('text=Sign Out')).not.toBeVisible();
  });

  test('profile management workflow', async ({ page }) => {
    await page.goto('/console?section=profile');

    // Should be on profile section
    await expect(page.locator('text=Profile Management')).toBeVisible();

    // Check profile form elements
    await expect(page.locator('input[name="full_name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();

    // Update profile information
    await page.fill('input[name="full_name"]', 'Updated Test User');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Should show success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
  });

  test('project management workflow', async ({ page }) => {
    await page.goto('/console?section=projects');

    // Should be on projects section
    await expect(page.locator('text=Project Management')).toBeVisible();

    // Check project list
    await expect(page.locator('text=Test Project')).toBeVisible();

    // Create new project
    await page.click('button:has-text("Create Project")');
    await expect(page.locator('text=Create New Project')).toBeVisible();

    // Fill project form
    await page.fill('input[name="title"]', 'New Test Project');
    await page.fill('textarea[name="description"]', 'Test project description');

    // Submit project
    await page.click('button:has-text("Create Project")');
    
    // Should return to project list
    await expect(page.locator('text=Project Management')).toBeVisible();
  });

  test('message center workflow', async ({ page }) => {
    await page.goto('/console?section=messages');

    // Should be on messages section
    await expect(page.locator('text=Message Center')).toBeVisible();

    // Check message list
    await expect(page.locator('text=Test message')).toBeVisible();

    // Compose new message
    await page.click('button:has-text("Compose")');
    await expect(page.locator('text=New Message')).toBeVisible();

    // Fill message form
    await page.fill('input[name="recipient"]', 'test@recipient.com');
    await page.fill('input[name="subject"]', 'Test Subject');
    await page.fill('textarea[name="content"]', 'Test message content');

    // Send message
    await page.click('button:has-text("Send")');
    
    // Should return to message list
    await expect(page.locator('text=Message Center')).toBeVisible();
  });

  test('payment management workflow', async ({ page }) => {
    await page.goto('/console?section=payments');

    // Should be on payments section
    await expect(page.locator('text=Payment Management')).toBeVisible();

    // Check payment tabs
    await expect(page.locator('text=Payment History')).toBeVisible();
    await expect(page.locator('text=Payment Methods')).toBeVisible();
    await expect(page.locator('text=Milestones')).toBeVisible();

    // Switch to payment methods tab
    await page.click('text=Payment Methods');
    await expect(page.locator('text=Add Payment Method')).toBeVisible();

    // Switch to milestones tab
    await page.click('text=Milestones');
    await expect(page.locator('text=Project Milestones')).toBeVisible();
  });

  test('responsive design workflow', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/console');

    // Sidebar should be visible and expanded
    await expect(page.locator('[data-testid="console-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="console-sidebar"]')).toHaveClass(/w-64/);

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 600 });
    
    // Sidebar should still be visible but may be collapsible
    await expect(page.locator('[data-testid="console-sidebar"]')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Console should still be functional
    await expect(page.locator('[data-testid="console-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="console-main-content"]')).toBeVisible();
  });

  test('state persistence workflow', async ({ page }) => {
    await page.goto('/console');

    // Navigate to profile section
    await page.click('button:has-text("Profile")');
    await expect(page.url()).toContain('section=profile');

    // Refresh page
    await page.reload();

    // Should still be on profile section
    await expect(page.url()).toContain('section=profile');
    await expect(page.locator('text=Profile Management')).toBeVisible();

    // Navigate to messages
    await page.click('button:has-text("Messages")');
    await expect(page.url()).toContain('section=messages');

    // Open new tab with same URL
    const newPage = await page.context().newPage();
    await newPage.goto(page.url());

    // Should be on messages section in new tab
    await expect(newPage.locator('text=Message Center')).toBeVisible();

    await newPage.close();
  });

  test('error handling workflow', async ({ page }) => {
    // Mock API error
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/console?section=profile');

    // Should show error message
    await expect(page.locator('text=Error loading profile')).toBeVisible();

    // Should have retry button
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // Should be able to navigate to other sections
    await page.click('button:has-text("Dashboard")');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('keyboard navigation workflow', async ({ page }) => {
    await page.goto('/console');

    // Test Tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Test Enter key on navigation items
    await page.focus('button:has-text("Profile")');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Profile Management')).toBeVisible();

    // Test Escape key to close dropdowns
    await page.click('[data-testid="user-menu-button"]');
    await expect(page.locator('text=Sign Out')).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Sign Out')).not.toBeVisible();
  });

  test('notification workflow', async ({ page }) => {
    await page.goto('/console');

    // Check notification center
    await expect(page.locator('[data-testid="notification-center"]')).toBeVisible();

    // Click notification center
    await page.click('[data-testid="notification-center"]');

    // Should show notifications dropdown
    await expect(page.locator('text=Notifications')).toBeVisible();

    // Mock real-time notification
    await page.evaluate(() => {
      // Simulate WebSocket message
      window.dispatchEvent(new CustomEvent('notification', {
        detail: {
          type: 'message',
          title: 'New Message',
          message: 'You have received a new message',
        }
      }));
    });

    // Should show notification badge
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible();
  });
});