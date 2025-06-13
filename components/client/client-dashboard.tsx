'use client';

import { useState, useEffect } from 'react';
import { AuthService, User, ClientProfile } from '@/lib/auth';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  DollarSign, 
  Clock, 
  Star,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Eye,
  LogOut,
  User as UserIcon,
  Home
} from 'lucide-react';

export function ClientDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'developers' | 'messages'>('overview');

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    window.location.reload();
  };

  if (!user || user.role !== 'client') return null;

  const profile = user.profile as ClientProfile;

  const mockProjects = [
    {
      id: 'proj_1',
      title: 'AI Healthcare Dashboard',
      description: 'Comprehensive AI-powered dashboard for healthcare providers',
      budget: 5000,
      status: 'active',
      applicants: 12,
      deadline: '2024-02-15',
      skills: ['React', 'Node.js', 'AI/ML', 'Healthcare']
    },
    {
      id: 'proj_2',
      title: 'Mobile Banking App',
      description: 'Secure mobile banking application with biometric authentication',
      budget: 8000,
      status: 'in-review',
      applicants: 8,
      deadline: '2024-03-01',
      skills: ['React Native', 'Security', 'Fintech', 'UI/UX']
    },
    {
      id: 'proj_3',
      title: 'E-commerce Analytics Platform',
      description: 'Real-time analytics platform for e-commerce businesses',
      budget: 3500,
      status: 'completed',
      applicants: 15,
      deadline: '2024-01-20',
      skills: ['Python', 'Data Science', 'React', 'APIs']
    }
  ];

  const mockDevelopers = [
    {
      id: 'dev_1',
      name: 'Alexandra Reed',
      specialization: 'Full Stack & AI',
      rating: 4.9,
      hourlyRate: 85,
      completedProjects: 32,
      skills: ['React', 'Node.js', 'AI/ML', 'Python'],
      availability: 'available'
    },
    {
      id: 'dev_2',
      name: 'Marcus Tan',
      specialization: 'UI/UX & AR/VR',
      rating: 4.7,
      hourlyRate: 75,
      completedProjects: 28,
      skills: ['UI/UX', 'React', 'AR/VR', 'Figma'],
      availability: 'available'
    },
    {
      id: 'dev_3',
      name: 'Sofia Mendes',
      specialization: 'Blockchain & DeFi',
      rating: 5.0,
      hourlyRate: 90,
      completedProjects: 45,
      skills: ['Blockchain', 'Solidity', 'Web3', 'DeFi'],
      availability: 'busy'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'in-review': return 'text-yellow-400 bg-yellow-500/20';
      case 'completed': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-400 bg-green-500/20';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20';
      case 'unavailable': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Client Dashboard</h1>
            <p className="text-gray-300">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="nexus-action-btn flex items-center gap-2"
            >
              <Home size={16} />
              Public Site
            </button>
            <button className="nexus-action-btn flex items-center gap-2">
              <Plus size={16} />
              Post New Project
            </button>
            <button 
              onClick={handleLogout}
              className="nexus-back-btn flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 max-w-2xl">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'projects', label: 'My Projects', icon: Briefcase },
            { id: 'developers', label: 'Find Developers', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
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
                    <h3 className="font-semibold text-green-400">Total Spent</h3>
                    <p className="text-2xl font-bold">${profile.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Users size={24} className="text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-purple-400">Projects Posted</h3>
                    <p className="text-2xl font-bold">{profile.projectsPosted}</p>
                  </div>
                </div>
              </div>

              <div className="nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <Star size={24} className="text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-yellow-400">Success Rate</h3>
                    <p className="text-2xl font-bold">94%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div className="nexus-card">
              <h3 className="text-xl font-semibold text-cyan-400 mb-6">Recent Projects</h3>
              <div className="space-y-4">
                {mockProjects.slice(0, 3).map(project => (
                  <div key={project.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-cyan-400">{project.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm opacity-80 mb-3">{project.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-400">${project.budget.toLocaleString()}</span>
                      <span className="text-gray-400">{project.applicants} applicants</span>
                    </div>
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
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-3 py-2 text-white outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2">
                  <Filter size={16} />
                  Filter
                </button>
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
                  
                  <p className="text-sm opacity-80 mb-4">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Budget:</span>
                      <div className="font-semibold text-green-400">${project.budget.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Applicants:</span>
                      <div className="font-semibold">{project.applicants}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Deadline:</span>
                      <div className="font-semibold">{new Date(project.deadline).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="nexus-action-btn flex-1 text-sm py-2">
                      <Eye size={14} className="mr-1" />
                      View Details
                    </button>
                    <button className="nexus-action-btn text-sm py-2 px-4">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Developers Tab */}
        {activeTab === 'developers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-cyan-400">Find Developers</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by skills..."
                    className="bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-3 py-2 text-white outline-none"
                  />
                </div>
                <select className="bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none">
                  <option value="">All Specializations</option>
                  <option value="fullstack">Full Stack</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="mobile">Mobile</option>
                  <option value="blockchain">Blockchain</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockDevelopers.map(developer => (
                <div key={developer.id} className="nexus-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-400">{developer.name}</h4>
                      <p className="text-sm text-gray-400">{developer.specialization}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400" />
                        <span className="font-semibold">{developer.rating}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Rate:</span>
                      <div className="font-semibold text-green-400">${developer.hourlyRate}/hr</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Projects:</span>
                      <div className="font-semibold">{developer.completedProjects}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getAvailabilityColor(developer.availability)}`}>
                        {developer.availability}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {developer.skills.slice(0, 4).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="nexus-action-btn flex-1 text-sm py-2">
                      View Profile
                    </button>
                    <button className="nexus-action-btn text-sm py-2 px-4">
                      Invite
                    </button>
                  </div>
                </div>
              ))}
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
              <p className="text-sm">Your conversations with developers will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}