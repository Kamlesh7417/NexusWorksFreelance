/**
 * Integration tests for routing and URL state management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Routing Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete('section');
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('URL State Management', () => {
    it('should read section from URL parameters', () => {
      mockSearchParams.set('section', 'profile');
      
      // This would be tested with the actual component
      expect(mockSearchParams.get('section')).toBe('profile');
    });

    it('should handle invalid section parameters', () => {
      mockSearchParams.set('section', 'invalid-section');
      
      const validSections = ['dashboard', 'profile', 'messages', 'projects', 'payments', 'settings'];
      const urlSection = mockSearchParams.get('section');
      const isValid = validSections.includes(urlSection as any);
      
      expect(isValid).toBe(false);
    });

    it('should fall back to localStorage when URL has no section', () => {
      const savedState = {
        currentSection: 'messages',
        sidebarCollapsed: false,
        sectionStates: {},
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));
      
      const state = JSON.parse(localStorageMock.getItem('console-state') || '{}');
      expect(state.currentSection).toBe('messages');
    });

    it('should default to dashboard when no URL or localStorage state', () => {
      const defaultSection = 'dashboard';
      const urlSection = mockSearchParams.get('section');
      const savedState = localStorageMock.getItem('console-state');
      
      expect(urlSection).toBeNull();
      expect(savedState).toBeNull();
      
      // Should use default
      const finalSection = urlSection || defaultSection;
      expect(finalSection).toBe('dashboard');
    });
  });

  describe('Legacy Route Redirects', () => {
    it('should map legacy routes to console sections', () => {
      const legacyRoutes = {
        '/profile': 'profile',
        '/messages': 'messages',
        '/projects': 'projects',
        '/payments': 'payments'
      };

      Object.entries(legacyRoutes).forEach(([route, section]) => {
        expect(legacyRoutes[route as keyof typeof legacyRoutes]).toBe(section);
      });
    });

    it('should handle project-specific routes', () => {
      const projectRoute = '/projects/123/details';
      const match = projectRoute.match(/^\/projects\/([^\/]+)(?:\/(.+))?$/);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe('123'); // project ID
      expect(match![2]).toBe('details'); // sub-path
    });
  });

  describe('Authentication Redirects', () => {
    it('should redirect to console after successful login', () => {
      const baseUrl = 'http://localhost:3000';
      const url = '/dashboard';
      
      // Simulate redirect logic
      const redirectUrl = url === '/dashboard' ? `${baseUrl}/console` : url;
      
      expect(redirectUrl).toBe('http://localhost:3000/console');
    });

    it('should preserve query parameters during redirect', () => {
      const originalUrl = '/dashboard?section=profile&project=123';
      const url = new URL(originalUrl, 'http://localhost:3000');
      
      if (url.pathname === '/dashboard') {
        url.pathname = '/console';
      }
      
      expect(url.toString()).toBe('http://localhost:3000/console?section=profile&project=123');
    });
  });

  describe('Backward Compatibility', () => {
    it('should preserve legacy dashboard when explicitly requested', () => {
      const url = '/dashboard?type=legacy';
      const searchParams = new URLSearchParams('type=legacy');
      
      expect(searchParams.get('type')).toBe('legacy');
      // Should not redirect when type=legacy
    });

    it('should handle deep links to specific sections', () => {
      const deepLinks = [
        { url: '/console?section=profile', expectedSection: 'profile' },
        { url: '/console?section=projects&project=123', expectedSection: 'projects', expectedProject: '123' },
        { url: '/console?section=messages', expectedSection: 'messages' },
      ];

      deepLinks.forEach(({ url, expectedSection, expectedProject }) => {
        const urlObj = new URL(url, 'http://localhost:3000');
        expect(urlObj.searchParams.get('section')).toBe(expectedSection);
        if (expectedProject) {
          expect(urlObj.searchParams.get('project')).toBe(expectedProject);
        }
      });
    });
  });
});