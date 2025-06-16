'use client';

import { useState, useEffect } from 'react';
import { PageType } from '@/app/page';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Zap, 
  Target,
  TrendingUp,
  Award,
  Sparkles,
  Eye,
  Heart,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Globe,
  Code,
  Palette,
  Database,
  Shield
} from 'lucide-react';

interface MarketplacePageProps {
  onPageChange: (page: PageType) => void;
}

export function MarketplacePage({ onPageChange }: MarketplacePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const [activeDeveloper, setActiveDeveloper] = useState(0);

  const projectCategories = [
    { id: 'all', name: 'All Projects', icon: Globe, count: 12450, color: 'text-cyan-400' },
    { id: 'ai', name: 'AI/ML', icon: Database, count: 3200, color: 'text-purple-400' },
    { id: 'blockchain', name: 'Blockchain', icon: Shield, count: 2800, color: 'text-green-400' },
    { id: 'web', name: 'Web Development', icon: Code, count: 4100, color: 'text-blue-400' },
    { id: 'mobile', name: 'Mobile Apps', icon: Users, count: 1900, color: 'text-yellow-400' },
    { id: 'design', name: 'UI/UX Design', icon: Palette, count: 1450, color: 'text-pink-400' }
  ];

  const featuredProjects = [
    {
      id: 'proj_1',
      title: 'Advanced Trading Algorithm',
      description: 'Build advanced algorithms for high-frequency trading with machine learning optimization.',
      client: 'FinTech Corp',
      budget: { min: 15000, max: 25000 },
      deadline: '2024-03-15',
      skills: ['Python', 'Machine Learning', 'Finance', 'API Integration'],
      applicants: 8,
      views: 234,
      featured: true,
      urgency: 'high',
      matchScore: 95,
      category: 'ai',
      clientRating: 4.9,
      projectType: 'Fixed Price'
    },
    {
      id: 'proj_2',
      title: 'AR Shopping Experience',
      description: 'Create immersive augmented reality shopping experience for luxury retail with gesture controls.',
      client: 'LuxuryVR Inc',
      budget: { min: 8000, max: 12000 },
      deadline: '2024-02-28',
      skills: ['AR/VR', 'Unity', 'React Native', 'UI/UX'],
      applicants: 15,
      views: 456,
      featured: true,
      urgency: 'medium',
      matchScore: 88,
      category: 'mobile',
      clientRating: 4.7,
      projectType: 'Hourly'
    },
    {
      id: 'proj_3',
      title: 'DeFi Protocol Security Audit',
      description: 'Comprehensive security audit for next-generation DeFi lending protocol with smart contract analysis.',
      client: 'SecureDefi Labs',
      budget: { min: 12000, max: 18000 },
      deadline: '2024-04-01',
      skills: ['Blockchain', 'Security', 'Solidity', 'Smart Contracts'],
      applicants: 6,
      views: 189,
      featured: true,
      urgency: 'high',
      matchScore: 92,
      category: 'blockchain',
      clientRating: 5.0,
      projectType: 'Fixed Price'
    },
    {
      id: 'proj_4',
      title: 'Healthcare Dashboard',
      description: 'Develop comprehensive AI-powered dashboard for healthcare providers with predictive analytics.',
      client: 'MedTech Solutions',
      budget: { min: 6000, max: 10000 },
      deadline: '2024-03-20',
      skills: ['React', 'Node.js', 'Data Visualization', 'Healthcare'],
      applicants: 22,
      views: 567,
      featured: false,
      urgency: 'medium',
      matchScore: 85,
      category: 'web',
      clientRating: 4.8,
      projectType: 'Milestone'
    }
  ];

  const topDevelopers = [
    {
      id: 'dev_1',
      name: 'Alexandra Reed',
      title: 'Full Stack Developer',
      avatar: '👩‍💻',
      rating: 4.9,
      hourlyRate: 95,
      completedProjects: 42,
      skills: ['React', 'Node.js', 'Python', 'TypeScript'],
      specializations: ['Full Stack Development', 'API Integration'],
      location: 'San Francisco, CA',
      availability: 'available',
      responseTime: '2 hours',
      successRate: 98,
      earnings: 245000,
      badges: ['Top Rated', 'Expert', 'Fast Responder'],
      recentWork: 'Trading System for FinTech'
    },
    {
      id: 'dev_2',
      name: 'Marcus Chen',
      title: 'Security Expert',
      avatar: '🛡️',
      rating: 5.0,
      hourlyRate: 110,
      completedProjects: 38,
      skills: ['Blockchain', 'Security', 'Solidity', 'Web3'],
      specializations: ['Smart Contract Auditing', 'DeFi Protocols'],
      location: 'Singapore',
      availability: 'available',
      responseTime: '1 hour',
      successRate: 100,
      earnings: 320000,
      badges: ['Security Master', 'DeFi Expert', 'Top Performer'],
      recentWork: 'DeFi Protocol Audit'
    },
    {
      id: 'dev_3',
      name: 'Sofia Rodriguez',
      title: 'AR/VR Developer',
      avatar: '🥽',
      rating: 4.8,
      hourlyRate: 85,
      completedProjects: 29,
      skills: ['AR/VR', 'Unity', 'React Native', 'UI/UX'],
      specializations: ['Immersive Experiences', '3D Development'],
      location: 'Barcelona, Spain',
      availability: 'busy',
      responseTime: '4 hours',
      successRate: 96,
      earnings: 180000,
      badges: ['AR Pioneer', 'Design Excellence', 'Innovation Leader'],
      recentWork: 'Virtual Showroom for Luxury Brands'
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    
    // Cycle through featured projects
    const projectTimer = setInterval(() => {
      setActiveProject(prev => (prev + 1) % featuredProjects.length);
    }, 5000);

    // Cycle through top developers
    const developerTimer = setInterval(() => {
      setActiveDeveloper(prev => (prev + 1) % topDevelopers.length);
    }, 4000);

    return () => {
      clearInterval(projectTimer);
      clearInterval(developerTimer);
    };
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-400 bg-green-500/20';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20';
      case 'unavailable': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (!isLoaded) {
    return (
      <div className="nexus-loading-overlay flex">
        <div className="nexus-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="nexus-welcome-section">
        <h1>Project Marketplace</h1>
        <p className="mb-6">Connect with elite developers and cutting-edge projects</p>
      </div>

      {/* Featured Projects Section */}
      <div className="nexus-container space-y-8 mb-16">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Featured Projects</h2>
        
        {/* Project Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {projectCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div 
                key={category.id}
                className="nexus-card text-center cursor-pointer group transition-all duration-500"
                onClick={() => setSelectedCategory(category.id)}
              >
                <Icon size={32} className={`${category.color} mx-auto mb-3 group-hover:animate-bounce`} />
                <h3 className={`font-semibold ${category.color} mb-1`}>{category.name}</h3>
                <p className="text-sm text-gray-400">{category.count.toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        {/* Active Project Spotlight */}
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 mb-6 border border-purple-500/30 transition-all duration-500">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Project Spotlight</span>
            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">Featured</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h4 className="text-xl font-bold text-cyan-400 mb-3">{featuredProjects[activeProject].title}</h4>
              <p className="text-gray-300 mb-4">{featuredProjects[activeProject].description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {featuredProjects[activeProject].skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Budget:</span>
                  <div className="font-semibold text-green-400">
                    ${featuredProjects[activeProject].budget.min.toLocaleString()} - ${featuredProjects[activeProject].budget.max.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Deadline:</span>
                  <div className="font-semibold">{new Date(featuredProjects[activeProject].deadline).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-gray-400">Applicants:</span>
                  <div className="font-semibold text-purple-400">{featuredProjects[activeProject].applicants}</div>
                </div>
                <div>
                  <span className="text-gray-400">Match Score:</span>
                  <div className={`font-semibold ${getMatchColor(featuredProjects[activeProject].matchScore)}`}>
                    {featuredProjects[activeProject].matchScore}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="font-semibold text-cyan-400 mb-2">Client Info</h5>
                <div className="text-sm">
                  <div className="font-medium">{featuredProjects[activeProject].client}</div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={12} />
                    <span>{featuredProjects[activeProject].clientRating}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="font-semibold text-cyan-400 mb-2">Project Stats</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Views:</span>
                    <span className="font-semibold">{featuredProjects[activeProject].views}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-semibold">{featuredProjects[activeProject].projectType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgency:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(featuredProjects[activeProject].urgency)}`}>
                      {featuredProjects[activeProject].urgency}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="nexus-action-btn flex-1 text-sm py-2">
                  Apply Now
                </button>
                <button className="nexus-action-btn text-sm py-2 px-3">
                  <Heart size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featuredProjects.map((project, index) => (
            <div 
              key={project.id} 
              className="nexus-card group cursor-pointer transition-all duration-500"
              onClick={() => setActiveProject(index)}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-cyan-400 group-hover:text-white transition-colors">{project.title}</h4>
                <div className="flex items-center gap-2">
                  {project.featured && <Award size={16} className="text-yellow-400" />}
                  <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(project.urgency)}`}>
                    {project.urgency}
                  </span>
                </div>
              </div>
              
              <p className="text-sm opacity-80 mb-4 line-clamp-2">{project.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {project.skills.slice(0, 3).map((skill, skillIndex) => (
                  <span key={skillIndex} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
                {project.skills.length > 3 && (
                  <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs">
                    +{project.skills.length - 3}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-400">Budget:</span>
                  <div className="font-semibold text-green-400">
                    ${project.budget.min.toLocaleString()}+
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Match:</span>
                  <div className={`font-semibold ${getMatchColor(project.matchScore)}`}>
                    {project.matchScore}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{project.applicants}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    <span>{project.views}</span>
                  </div>
                </div>
                <button className="nexus-action-btn text-xs px-3 py-1">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Developers Section */}
      <div className="nexus-container space-y-8 mb-16">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Top Developers</h2>
        
        {/* Developer Spotlight */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-6 border border-green-500/30 transition-all duration-500">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Top Performer</span>
            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">Featured</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{topDevelopers[activeDeveloper].avatar}</div>
                <div>
                  <h4 className="text-xl font-bold text-cyan-400">{topDevelopers[activeDeveloper].name}</h4>
                  <p className="text-gray-400">{topDevelopers[activeDeveloper].title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400" />
                      <span className="font-semibold">{topDevelopers[activeDeveloper].rating}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getAvailabilityColor(topDevelopers[activeDeveloper].availability)}`}>
                      {topDevelopers[activeDeveloper].availability}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {topDevelopers[activeDeveloper].skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {topDevelopers[activeDeveloper].badges.map((badge, index) => (
                  <span key={index} className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-xs text-yellow-400">
                    {badge}
                  </span>
                ))}
              </div>
              
              <p className="text-sm text-gray-300">
                <strong>Recent Work:</strong> {topDevelopers[activeDeveloper].recentWork}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="font-semibold text-cyan-400 mb-3">Performance Stats</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-semibold text-green-400">{topDevelopers[activeDeveloper].successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects:</span>
                    <span className="font-semibold">{topDevelopers[activeDeveloper].completedProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span className="font-semibold text-cyan-400">{topDevelopers[activeDeveloper].responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Earnings:</span>
                    <span className="font-semibold text-green-400">${topDevelopers[activeDeveloper].earnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="font-semibold text-cyan-400 mb-2">Rate & Location</h5>
                <div className="text-sm">
                  <div className="font-semibold text-green-400 mb-1">${topDevelopers[activeDeveloper].hourlyRate}/hour</div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span>{topDevelopers[activeDeveloper].location}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="nexus-action-btn flex-1 text-sm py-2">
                  Hire Now
                </button>
                <button className="nexus-action-btn text-sm py-2 px-3">
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topDevelopers.map((developer, index) => (
            <div 
              key={developer.id}
              className="nexus-card group cursor-pointer transition-all duration-500"
              onClick={() => setActiveDeveloper(index)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl group-hover:scale-125 transition-all duration-300">{developer.avatar}</div>
                <div>
                  <h4 className="font-semibold text-cyan-400 group-hover:text-white transition-colors">{developer.name}</h4>
                  <p className="text-sm text-gray-400">{developer.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" />
                      <span className="text-sm font-semibold">{developer.rating}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getAvailabilityColor(developer.availability)}`}>
                      {developer.availability}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {developer.skills.slice(0, 3).map((skill, skillIndex) => (
                  <span key={skillIndex} className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-400">Rate:</span>
                  <div className="font-semibold text-green-400">${developer.hourlyRate}/hr</div>
                </div>
                <div>
                  <span className="text-gray-400">Projects:</span>
                  <div className="font-semibold">{developer.completedProjects}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin size={10} />
                    <span>{developer.location.split(',')[0]}</span>
                  </div>
                </div>
                <button className="nexus-action-btn text-xs px-3 py-1">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Analytics Section */}
      <div className="nexus-container space-y-8 mb-16">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Market Analytics</h2>
        
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 rounded-lg p-4 text-center transition-all duration-300">
            <Target size={24} className="text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-cyan-400">12,450</div>
            <div className="text-sm text-gray-400">Active Projects</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center transition-all duration-300">
            <Users size={24} className="text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">8,900</div>
            <div className="text-sm text-gray-400">Active Developers</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center transition-all duration-300">
            <DollarSign size={24} className="text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-400">$2.4M</div>
            <div className="text-sm text-gray-400">Monthly Volume</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center transition-all duration-300">
            <TrendingUp size={24} className="text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400">+23%</div>
            <div className="text-sm text-gray-400">Growth Rate</div>
          </div>
        </div>

        {/* Trending Technologies */}
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-cyan-400 mb-4">Trending Technologies</h4>
          <div className="space-y-3">
            {[
              { name: 'AI/Machine Learning', growth: '+180%', projects: 8900, color: 'text-cyan-400' },
              { name: 'Blockchain & Web3', growth: '+250%', projects: 5670, color: 'text-green-400' },
              { name: 'AR/VR Development', growth: '+420%', projects: 3200, color: 'text-yellow-400' },
              { name: 'Mobile Development', growth: '+340%', projects: 2450, color: 'text-purple-400' }
            ].map((tech, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className={`font-semibold ${tech.color}`}>{tech.name}</div>
                  <div className="text-sm text-gray-400">{tech.projects.toLocaleString()} projects</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-400">{tech.growth}</div>
                  <div className="text-xs text-gray-400">growth</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="font-semibold text-cyan-400 mb-4">Success Metrics</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Project Success Rate</span>
                  <span>94.2%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Client Satisfaction</span>
                  <span>98.5%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>On-Time Delivery</span>
                  <span>91.8%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full" style={{ width: '91.8%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="font-semibold text-cyan-400 mb-4">Average Rates by Category</h4>
            <div className="space-y-3">
              {[
                { category: 'AI/ML Engineering', rate: 95, color: 'text-cyan-400' },
                { category: 'Blockchain Security', rate: 110, color: 'text-green-400' },
                { category: 'Full Stack Development', rate: 85, color: 'text-blue-400' },
                { category: 'AR/VR Development', rate: 90, color: 'text-yellow-400' },
                { category: 'Mobile Development', rate: 75, color: 'text-purple-400' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className={`text-sm ${item.color}`}>{item.category}</span>
                  <span className="font-semibold text-green-400">${item.rate}/hr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}