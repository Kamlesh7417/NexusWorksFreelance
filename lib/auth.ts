// Authentication and user management system
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'developer';
  avatar?: string;
  profile: ClientProfile | DeveloperProfile;
  createdAt: string;
  lastLogin: string;
}

export interface ClientProfile {
  company?: string;
  industry?: string;
  projectsPosted: number;
  totalSpent: number;
  preferredBudget: {
    min: number;
    max: number;
  };
  requirements: string[];
}

export interface DeveloperProfile {
  skills: string[];
  hourlyRate: number;
  experience: 'junior' | 'mid' | 'senior' | 'expert';
  specializations: string[];
  availability: 'available' | 'busy' | 'unavailable';
  rating: number;
  completedProjects: number;
  totalEarnings: number;
  portfolio: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  projectUrl?: string;
  completedAt: string;
}

// Demo users for testing
export const DEMO_USERS: User[] = [
  // Client Users
  {
    id: 'client_1',
    email: 'client@demo.com',
    name: 'Sarah Johnson',
    role: 'client',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150',
    profile: {
      company: 'TechCorp Inc.',
      industry: 'Healthcare Technology',
      projectsPosted: 12,
      totalSpent: 45000,
      preferredBudget: { min: 2000, max: 10000 },
      requirements: ['AI/ML', 'Healthcare Compliance', 'HIPAA', 'React', 'Node.js']
    } as ClientProfile,
    createdAt: '2023-01-15T10:00:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'client_2',
    email: 'startup@demo.com',
    name: 'Michael Chen',
    role: 'client',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150',
    profile: {
      company: 'InnovateLab',
      industry: 'Fintech',
      projectsPosted: 8,
      totalSpent: 28000,
      preferredBudget: { min: 1000, max: 5000 },
      requirements: ['Blockchain', 'Smart Contracts', 'Security', 'React', 'Python']
    } as ClientProfile,
    createdAt: '2023-03-20T14:30:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'client_3',
    email: 'enterprise@demo.com',
    name: 'Emily Rodriguez',
    role: 'client',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=150',
    profile: {
      company: 'Global Solutions Ltd.',
      industry: 'Enterprise Software',
      projectsPosted: 25,
      totalSpent: 120000,
      preferredBudget: { min: 5000, max: 25000 },
      requirements: ['Enterprise Architecture', 'Microservices', 'Cloud', 'DevOps', 'Java']
    } as ClientProfile,
    createdAt: '2022-11-10T09:15:00Z',
    lastLogin: new Date().toISOString()
  },

  // Developer Users
  {
    id: 'dev_1',
    email: 'dev@demo.com',
    name: 'Alexandra Reed',
    role: 'developer',
    avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?w=150',
    profile: {
      skills: ['React', 'Node.js', 'TypeScript', 'AI/ML', 'Quantum Computing', 'Python', 'TensorFlow'],
      hourlyRate: 85,
      experience: 'senior',
      specializations: ['Full Stack Development', 'AI Integration', 'Quantum Computing'],
      availability: 'available',
      rating: 4.9,
      completedProjects: 32,
      totalEarnings: 156000,
      portfolio: [
        {
          id: 'p1',
          title: 'AI Healthcare Dashboard',
          description: 'Comprehensive AI-powered dashboard for healthcare providers',
          technologies: ['React', 'Node.js', 'TensorFlow', 'Python'],
          completedAt: '2023-10-15T00:00:00Z'
        },
        {
          id: 'p2',
          title: 'Quantum Trading Algorithm',
          description: 'Advanced quantum computing algorithm for financial trading',
          technologies: ['Quantum Computing', 'Python', 'Qiskit'],
          completedAt: '2023-09-20T00:00:00Z'
        }
      ]
    } as DeveloperProfile,
    createdAt: '2022-08-12T16:45:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'dev_2',
    email: 'designer@demo.com',
    name: 'Marcus Tan',
    role: 'developer',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=150',
    profile: {
      skills: ['UI/UX Design', 'React', 'Figma', 'AR/VR', 'Prototyping', 'Adobe Creative Suite'],
      hourlyRate: 75,
      experience: 'senior',
      specializations: ['Product Design', 'User Experience', 'AR/VR Interfaces'],
      availability: 'available',
      rating: 4.7,
      completedProjects: 28,
      totalEarnings: 98000,
      portfolio: [
        {
          id: 'p3',
          title: 'AR Shopping Experience',
          description: 'Immersive AR application for retail shopping',
          technologies: ['AR/VR', 'React Native', 'Unity', 'Figma'],
          completedAt: '2023-11-01T00:00:00Z'
        }
      ]
    } as DeveloperProfile,
    createdAt: '2022-12-05T11:20:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'dev_3',
    email: 'blockchain@demo.com',
    name: 'Sofia Mendes',
    role: 'developer',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=150',
    profile: {
      skills: ['Blockchain', 'Solidity', 'Web3', 'Smart Contracts', 'DeFi', 'Ethereum', 'Python'],
      hourlyRate: 90,
      experience: 'expert',
      specializations: ['Blockchain Development', 'Smart Contracts', 'DeFi Protocols'],
      availability: 'busy',
      rating: 5.0,
      completedProjects: 45,
      totalEarnings: 234000,
      portfolio: [
        {
          id: 'p4',
          title: 'DeFi Lending Protocol',
          description: 'Decentralized lending platform with automated market making',
          technologies: ['Solidity', 'Web3', 'React', 'Node.js'],
          completedAt: '2023-10-30T00:00:00Z'
        }
      ]
    } as DeveloperProfile,
    createdAt: '2022-06-18T13:10:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'dev_4',
    email: 'security@demo.com',
    name: 'James Okoro',
    role: 'developer',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=150',
    profile: {
      skills: ['Cybersecurity', 'Blockchain', 'Penetration Testing', 'Encryption', 'Python', 'Go'],
      hourlyRate: 95,
      experience: 'expert',
      specializations: ['Blockchain Security', 'Smart Contract Auditing', 'Penetration Testing'],
      availability: 'available',
      rating: 4.8,
      completedProjects: 38,
      totalEarnings: 187000,
      portfolio: [
        {
          id: 'p5',
          title: 'Smart Contract Security Audit',
          description: 'Comprehensive security audit for DeFi protocol',
          technologies: ['Solidity', 'Security Testing', 'Python'],
          completedAt: '2023-11-10T00:00:00Z'
        }
      ]
    } as DeveloperProfile,
    createdAt: '2022-09-22T08:30:00Z',
    lastLogin: new Date().toISOString()
  }
];

export class AuthService {
  private static currentUser: User | null = null;

  static async login(email: string, password: string): Promise<User | null> {
    // Demo login - in production, this would validate against a real backend
    const user = DEMO_USERS.find(u => u.email === email);
    
    if (user && password === 'demo123') {
      this.currentUser = { ...user, lastLogin: new Date().toISOString() };
      localStorage.setItem('nexus_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    
    return null;
  }

  static logout(): void {
    this.currentUser = null;
    localStorage.removeItem('nexus_user');
  }

  static getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    
    const stored = localStorage.getItem('nexus_user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }
    
    return null;
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static isClient(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'client';
  }

  static isDeveloper(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'developer';
  }

  static updateProfile(updates: Partial<User>): User | null {
    if (!this.currentUser) return null;
    
    this.currentUser = { ...this.currentUser, ...updates };
    localStorage.setItem('nexus_user', JSON.stringify(this.currentUser));
    return this.currentUser;
  }
}