/**
 * Demo Marketplace Data for NexusWorks Platform
 */

export interface DemoProject {
  id: string;
  title: string;
  description: string;
  client_name: string;
  client_avatar?: string;
  budget_min: number;
  budget_max: number;
  skills_required: string[];
  complexity_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  project_type: 'web' | 'mobile' | 'desktop' | 'ai' | 'blockchain' | 'other';
  duration_weeks: number;
  posted_date: string;
  applications_count: number;
  is_featured: boolean;
  is_urgent: boolean;
  remote_ok: boolean;
  location?: string;
}

export interface DemoDeveloper {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  skills: string[];
  experience_level: 'junior' | 'mid' | 'senior' | 'expert';
  hourly_rate: number;
  rating: number;
  reviews_count: number;
  projects_completed: number;
  availability: 'available' | 'busy' | 'unavailable';
  location: string;
  github_username?: string;
  portfolio_url?: string;
  is_featured: boolean;
  is_verified: boolean;
  response_time: string;
  languages: string[];
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: 'proj-1',
    title: 'E-commerce Platform with AI Recommendations',
    description: 'Build a modern e-commerce platform with AI-powered product recommendations, real-time inventory management, and seamless payment integration.',
    client_name: 'TechStart Inc.',
    client_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
    budget_min: 15000,
    budget_max: 25000,
    skills_required: ['React', 'Node.js', 'Python', 'TensorFlow', 'AWS'],
    complexity_level: 'advanced',
    project_type: 'web',
    duration_weeks: 12,
    posted_date: '2024-01-15',
    applications_count: 23,
    is_featured: true,
    is_urgent: false,
    remote_ok: true,
    location: 'Remote'
  },
  {
    id: 'proj-2',
    title: 'Mobile App for Fitness Tracking',
    description: 'Create a comprehensive fitness tracking mobile app with workout plans, nutrition tracking, and social features.',
    client_name: 'FitLife Solutions',
    client_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
    budget_min: 8000,
    budget_max: 15000,
    skills_required: ['React Native', 'Firebase', 'Node.js', 'MongoDB'],
    complexity_level: 'intermediate',
    project_type: 'mobile',
    duration_weeks: 8,
    posted_date: '2024-01-18',
    applications_count: 31,
    is_featured: true,
    is_urgent: true,
    remote_ok: true,
    location: 'Remote'
  },
  {
    id: 'proj-3',
    title: 'Blockchain-based Supply Chain Management',
    description: 'Develop a blockchain solution for transparent supply chain tracking with smart contracts and real-time monitoring.',
    client_name: 'LogiChain Corp',
    budget_min: 20000,
    budget_max: 35000,
    skills_required: ['Solidity', 'Web3.js', 'React', 'Node.js', 'Ethereum'],
    complexity_level: 'expert',
    project_type: 'blockchain',
    duration_weeks: 16,
    posted_date: '2024-01-20',
    applications_count: 12,
    is_featured: false,
    is_urgent: false,
    remote_ok: true,
    location: 'Remote'
  },
  {
    id: 'proj-4',
    title: 'AI-Powered Content Management System',
    description: 'Build a CMS with AI content generation, automated SEO optimization, and intelligent content categorization.',
    client_name: 'ContentPro Media',
    budget_min: 12000,
    budget_max: 20000,
    skills_required: ['Vue.js', 'Python', 'OpenAI API', 'PostgreSQL', 'Docker'],
    complexity_level: 'advanced',
    project_type: 'ai',
    duration_weeks: 10,
    posted_date: '2024-01-22',
    applications_count: 18,
    is_featured: true,
    is_urgent: false,
    remote_ok: true,
    location: 'Remote'
  },
  {
    id: 'proj-5',
    title: 'Desktop Application for Data Visualization',
    description: 'Create a powerful desktop app for complex data visualization with interactive charts and real-time updates.',
    client_name: 'DataViz Analytics',
    budget_min: 10000,
    budget_max: 18000,
    skills_required: ['Electron', 'D3.js', 'TypeScript', 'Python', 'SQLite'],
    complexity_level: 'intermediate',
    project_type: 'desktop',
    duration_weeks: 9,
    posted_date: '2024-01-25',
    applications_count: 15,
    is_featured: false,
    is_urgent: true,
    remote_ok: false,
    location: 'San Francisco, CA'
  }
];

export const DEMO_DEVELOPERS: DemoDeveloper[] = [
  {
    id: 'dev-1',
    name: 'Alex Chen',
    title: 'Full-Stack Developer & AI Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    skills: ['React', 'Node.js', 'Python', 'TensorFlow', 'AWS', 'Docker'],
    experience_level: 'senior',
    hourly_rate: 85,
    rating: 4.9,
    reviews_count: 47,
    projects_completed: 52,
    availability: 'available',
    location: 'San Francisco, CA',
    github_username: 'alexchen-dev',
    portfolio_url: 'https://alexchen.dev',
    is_featured: true,
    is_verified: true,
    response_time: '< 1 hour',
    languages: ['English', 'Mandarin']
  },
  {
    id: 'dev-2',
    name: 'Sarah Rodriguez',
    title: 'Mobile App Developer',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
    experience_level: 'senior',
    hourly_rate: 75,
    rating: 4.8,
    reviews_count: 38,
    projects_completed: 41,
    availability: 'available',
    location: 'Austin, TX',
    github_username: 'sarah-mobile',
    portfolio_url: 'https://sarahrodriguez.dev',
    is_featured: true,
    is_verified: true,
    response_time: '< 2 hours',
    languages: ['English', 'Spanish']
  },
  {
    id: 'dev-3',
    name: 'Marcus Johnson',
    title: 'Blockchain Developer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    skills: ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'DeFi'],
    experience_level: 'expert',
    hourly_rate: 120,
    rating: 5.0,
    reviews_count: 29,
    projects_completed: 31,
    availability: 'busy',
    location: 'New York, NY',
    github_username: 'marcus-blockchain',
    portfolio_url: 'https://marcusblockchain.com',
    is_featured: true,
    is_verified: true,
    response_time: '< 4 hours',
    languages: ['English']
  },
  {
    id: 'dev-4',
    name: 'Emily Zhang',
    title: 'UI/UX Designer & Frontend Developer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    skills: ['Figma', 'React', 'Vue.js', 'TypeScript', 'Tailwind CSS'],
    experience_level: 'mid',
    hourly_rate: 65,
    rating: 4.7,
    reviews_count: 33,
    projects_completed: 28,
    availability: 'available',
    location: 'Seattle, WA',
    github_username: 'emily-design',
    portfolio_url: 'https://emilyzhang.design',
    is_featured: false,
    is_verified: true,
    response_time: '< 3 hours',
    languages: ['English', 'Mandarin']
  },
  {
    id: 'dev-5',
    name: 'David Kumar',
    title: 'DevOps Engineer & Cloud Architect',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    experience_level: 'senior',
    hourly_rate: 90,
    rating: 4.9,
    reviews_count: 25,
    projects_completed: 34,
    availability: 'available',
    location: 'Remote',
    github_username: 'david-devops',
    portfolio_url: 'https://davidkumar.cloud',
    is_featured: false,
    is_verified: true,
    response_time: '< 1 hour',
    languages: ['English', 'Hindi']
  }
];

export function getFilteredProjects(filters: {
  search?: string;
  skills_required?: string;
  complexity_level?: string;
  budget_range?: string;
  project_type?: string;
}): DemoProject[] {
  let filtered = [...DEMO_PROJECTS];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(project => 
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.skills_required.some(skill => skill.toLowerCase().includes(searchLower))
    );
  }

  if (filters.skills_required) {
    filtered = filtered.filter(project =>
      project.skills_required.some(skill => 
        skill.toLowerCase().includes(filters.skills_required!.toLowerCase())
      )
    );
  }

  if (filters.complexity_level) {
    filtered = filtered.filter(project => project.complexity_level === filters.complexity_level);
  }

  if (filters.project_type) {
    filtered = filtered.filter(project => project.project_type === filters.project_type);
  }

  if (filters.budget_range) {
    const [min, max] = filters.budget_range.split('-').map(Number);
    filtered = filtered.filter(project => 
      project.budget_min >= min && project.budget_max <= max
    );
  }

  return filtered;
}

export function getFilteredDevelopers(filters: {
  search?: string;
  skills?: string;
  experience_level?: string;
  availability?: string;
  hourly_rate_max?: number;
}): DemoDeveloper[] {
  let filtered = [...DEMO_DEVELOPERS];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(dev => 
      dev.name.toLowerCase().includes(searchLower) ||
      dev.title.toLowerCase().includes(searchLower) ||
      dev.skills.some(skill => skill.toLowerCase().includes(searchLower))
    );
  }

  if (filters.skills) {
    filtered = filtered.filter(dev =>
      dev.skills.some(skill => 
        skill.toLowerCase().includes(filters.skills!.toLowerCase())
      )
    );
  }

  if (filters.experience_level) {
    filtered = filtered.filter(dev => dev.experience_level === filters.experience_level);
  }

  if (filters.availability) {
    filtered = filtered.filter(dev => dev.availability === filters.availability);
  }

  if (filters.hourly_rate_max) {
    filtered = filtered.filter(dev => dev.hourly_rate <= filters.hourly_rate_max!);
  }

  return filtered;
}