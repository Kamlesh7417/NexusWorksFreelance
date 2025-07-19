/**
 * Demo Credentials for NexusWorks Platform
 * These are test accounts for demonstration purposes
 */

export interface DemoUser {
  email: string;
  password: string;
  role: 'client' | 'developer';
  profile: {
    id: string;
    full_name: string;
    avatar_url?: string;
    github_username?: string;
    skills?: string[];
    experience_level?: string;
    hourly_rate?: number;
    company?: string;
    projects_completed?: number;
    rating?: number;
  };
}

export const DEMO_CREDENTIALS: Record<'client' | 'developer', DemoUser> = {
  client: {
    email: 'demo.client@nexusworks.com',
    password: 'demo123',
    role: 'client',
    profile: {
      id: 'demo-client-1',
      full_name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      company: 'TechStart Inc.',
      projects_completed: 12,
      rating: 4.8
    }
  },
  developer: {
    email: 'demo.developer@nexusworks.com',
    password: 'demo123',
    role: 'developer',
    profile: {
      id: 'demo-developer-1',
      full_name: 'Alex Chen',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      github_username: 'alexchen-dev',
      skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS'],
      experience_level: 'Senior',
      hourly_rate: 85,
      projects_completed: 47,
      rating: 4.9
    }
  }
};

export function getDemoUser(role: 'client' | 'developer'): DemoUser {
  return DEMO_CREDENTIALS[role];
}

export function isDemoCredentials(email: string, password: string): boolean {
  return Object.values(DEMO_CREDENTIALS).some(
    user => user.email === email && user.password === password
  );
}

export function getDemoUserByEmail(email: string): DemoUser | null {
  return Object.values(DEMO_CREDENTIALS).find(user => user.email === email) || null;
}