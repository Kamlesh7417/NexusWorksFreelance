'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Clock, 
  Star,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Eye,
  UserIcon,
  Award,
  Target,
  LogOut,
  Home,
  BookOpen,
  Users
} from 'lucide-react';

export function DeveloperDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'portfolio' | 'learning' | 'community' | 'messages'>('overview');

  const handleLogout = async () => {
    // Logout logic will be handled by the UserMenu component
  };

  if (!session?.user) return null;

  const profile = session.user.profile || {
    skills: [],
    hourlyRate: 0,
    experience: 'junior',
    specializations: [],
    availability: 'available',
    rating: 4.5,
    completedProjects: 0,
    totalEarnings: 0,
    portfolio: []
  };

  const mockProjects = [
    {
      id: 'proj_1',
      title: 'AI Healthcare Dashboard',
      client: 'TechCorp Inc.',
      budget: 5000,
      status: 'active',
      deadline: '2024-02-15',
      progress: 65,
      skills: ['React', 'Node.js', 'AI/ML', 'Healthcare']
    },
    {
      id: 'proj_2',
      title: 'Blockchain Voting System',
      client: 'GovTech Solutions',
      budget: 8000,
      status: 'pending',
      deadline: '2024-03-01',
      progress: 0,
      skills: ['Blockchain', 'Solidity', 'Security', 'Web3']
    },
    {
      id: 'proj_3',
      title: 'E-commerce Mobile App',
      client: 'RetailMax',
      budget: 6500,
      status: 'completed',
      deadline: '2024-01-20',
      progress: 100,
      skills: ['React Native', 'Node.js', 'Payment Integration']
    }
  ];

  const availableProjects = [
    {
      id: 'avail_1',
      title: 'Quantum Trading Algorithm',
      client: 'FinanceAI Corp',
      budget: 12000,
      deadline: '2024-04-01',
      skills: ['Quantum Computing', 'Python', 'Finance'],
      applicants: 8,
      matchScore: 95
    },
    {
      id: 'avail_2',
      title: 'AR Shopping Experience',
      client: 'RetailVR',
      budget: 7500,
      deadline: '2024-03-15',
      skills: ['AR/VR', 'Unity', 'React Native'],
      applicants: 12,
      matchScore: 78
    },
    {
      id: 'avail_3',
      title: 'Smart Contract Audit',
      client: 'DeFi Protocol',
      budget: 9000,
      deadline: '2024-02-28',
      skills: ['Blockchain', 'Security', 'Solidity'],
      applicants: 6,
      matchScore: 88
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'completed': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Developer Dashboard</h1>
            <p className="text-gray-300">Welcome back, {session.user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              profile.availability === 'available' ? 'bg-green-500/20 text-green-400' :
              profile.availability === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {profile.availability}
            </span>
            <button 
              onClick={() => window.location.href = '/'}
              className="nexus-action-btn flex items-center gap-2"
            >
              <Home size={16} />
              Public Site
            </button>
            <button className="nexus-action-btn">
              Update Availability
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 max-w-4xl">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'projects', label: 'My Projects', icon: Briefcase },
            { id: 'portfolio', label: 'Portfolio', icon: Award },
            { id: 'learning', label: 'Learning', icon: BookOpen },
            { id: 'community', label: 'Community', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase size={24} className="text-cyan-400" />
                  <div>
                    <h3 className="font-semibold text-cyan-400">Active Projects</h3>
                    <p className="text-2xl font-bold">{mockProjects.filter(p => p.status === 'active').length}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign size={24} className="text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-400">Total Earnings</h3>
                    <p className="text-2xl font-bold">${profile.totalEarnings?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Star size={24} className="text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-yellow-400">Rating</h3>
                    <p className="text-2xl font-bold">{profile.rating}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Target size={24} className="text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-purple-400">Completed</h3>
                    <p className="text-2xl font-bold">{profile.completedProjects}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Projects */}
            <div className="nexus-card">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Current Projects</h3>
              <div className="space-y-4">
                {mockProjects.filter(p => p.status === 'active').map(project => (
                  <div key={project.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-cyan-400">{project.title}</h4>
                      <span className="text-green-400 font-semibold">${project.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">Client: {project.client}</span>
                      <span className="text-sm text-gray-400">Due: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-400">{project.progress}% complete</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Projects */}
            <div className="nexus-card">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Recommended Projects</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {availableProjects.slice(0, 4).map(project => (
                  <div key={project.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-cyan-400">{project.title}</h4>
                      <span className={`font-semibold ${getMatchColor(project.matchScore)}`}>
                        {project.matchScore}% match
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">Client: {project.client}</div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-400 font-semibold">${project.budget.toLocaleString()}</span>
                      <span className="text-sm text-gray-400">{project.applicants} applicants</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button className="nexus-action-btn w-full text-sm py-2">
                      Apply Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-cyan-400">My Projects</h3>
              <div className="flex items-center gap-4">
                <select className="bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockProjects.map(project => (
                <div key={project.id} className="nexus-card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-cyan-400">{project.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-4">Client: {project.client}</div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Budget:</span>
                      <div className="font-semibold text-green-400">${project.budget.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Deadline:</span>
                      <div className="font-semibold">{new Date(project.deadline).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {project.status === 'active' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button className="nexus-action-btn flex-1 text-sm py-2">
                      <Eye size={14} className="mr-1" />
                      View Details
                    </button>
                    {project.status === 'active' && (
                      <button className="nexus-action-btn text-sm py-2 px-4">
                        Update
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-cyan-400">Portfolio</h3>
              <button className="nexus-action-btn">
                Add Project
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {profile.portfolio.map(item => (
                <div key={item.id} className="nexus-card">
                  <div className="w-full h-32 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                    <Award size={32} className="text-cyan-400" />
                  </div>
                  
                  <h4 className="font-semibold text-cyan-400 mb-2">{item.title}</h4>
                  <p className="text-sm opacity-80 mb-4">{item.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.technologies.map((tech, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-4">
                    Completed: {new Date(item.completedAt).toLocaleDateString()}
                  </div>
                  
                  <button className="nexus-action-btn w-full text-sm py-2">
                    View Project
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="nexus-card">
            <h3 className="text-xl font-semibold text-cyan-400 mb-6">Developer Learning Hub</h3>
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto mb-4 text-cyan-400" />
              <p className="text-lg mb-4">Access the full learning platform</p>
              <p className="text-sm text-gray-400 mb-6">
                Explore courses, coding environments, shadowing opportunities, and skill assessments
              </p>
              <button 
                onClick={() => window.location.href = '/?page=learning'}
                className="nexus-action-btn"
              >
                Go to Learning Platform
              </button>
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="nexus-card">
            <h3 className="text-xl font-semibold text-cyan-400 mb-6">Developer Community</h3>
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-purple-400" />
              <p className="text-lg mb-4">Join the developer community</p>
              <p className="text-sm text-gray-400 mb-6">
                Connect with peers, join events, participate in forums, and contribute to open source
              </p>
              <button 
                onClick={() => window.location.href = '/?page=community'}
                className="nexus-action-btn"
              >
                Go to Community Hub
              </button>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="nexus-card">
            <h3 className="text-xl font-semibold text-cyan-400 mb-6">Messages</h3>
            <div className="text-center py-12 text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Your conversations with clients will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}