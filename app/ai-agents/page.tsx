'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { 
  Search, 
  Filter, 
  Bot, 
  Star, 
  Clock, 
  Code, 
  Zap, 
  Shield, 
  ChevronDown, 
  Loader2,
  Eye,
  ArrowRight,
  Cpu,
  Globe,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

function AIAgentsContent() {
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    availability: 'all',
    priceRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Mock AI agents data
        const mockAgents = [
          {
            id: 'ai-1',
            name: 'CodeMaster AI',
            type: 'Full Stack Developer',
            description: 'Advanced AI agent specialized in React, Node.js, and Python development. Can handle complex full-stack applications with 99.9% uptime.',
            capabilities: ['React', 'Node.js', 'Python', 'MongoDB', 'AWS'],
            availability: '24/7',
            responseTime: '< 1 minute',
            successRate: 98.5,
            projectsCompleted: 247,
            hourlyRate: 45,
            rating: 4.9,
            avatar: '🤖',
            specializations: ['Web Development', 'API Integration', 'Database Design'],
            status: 'available'
          },
          {
            id: 'ai-2',
            name: 'DesignBot Pro',
            type: 'UI/UX Designer',
            description: 'Creative AI agent focused on modern UI/UX design. Generates pixel-perfect designs and interactive prototypes instantly.',
            capabilities: ['Figma', 'Adobe XD', 'React', 'CSS', 'Design Systems'],
            availability: '24/7',
            responseTime: '< 30 seconds',
            successRate: 97.2,
            projectsCompleted: 189,
            hourlyRate: 35,
            rating: 4.8,
            avatar: '🎨',
            specializations: ['UI Design', 'UX Research', 'Prototyping'],
            status: 'available'
          },
          {
            id: 'ai-3',
            name: 'DataWiz AI',
            type: 'Data Scientist',
            description: 'Specialized AI agent for data analysis, machine learning, and AI model development. Expert in Python, TensorFlow, and data visualization.',
            capabilities: ['Python', 'TensorFlow', 'PyTorch', 'Pandas', 'Scikit-learn'],
            availability: '24/7',
            responseTime: '< 2 minutes',
            successRate: 99.1,
            projectsCompleted: 156,
            hourlyRate: 65,
            rating: 4.95,
            avatar: '📊',
            specializations: ['Machine Learning', 'Data Analysis', 'AI Models'],
            status: 'busy'
          },
          {
            id: 'ai-4',
            name: 'MobileBot Elite',
            type: 'Mobile Developer',
            description: 'Expert AI agent for iOS and Android development. Creates native and cross-platform mobile applications with optimal performance.',
            capabilities: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
            availability: '24/7',
            responseTime: '< 1 minute',
            successRate: 96.8,
            projectsCompleted: 203,
            hourlyRate: 55,
            rating: 4.85,
            avatar: '📱',
            specializations: ['Mobile Apps', 'Cross-platform', 'App Store Optimization'],
            status: 'available'
          }
        ];

        setAgents(mockAgents);
      } catch (error) {
        console.error('Error fetching AI agents:', error);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [user]);

  // Filter agents by search term and filters
  const filteredAgents = agents.filter(agent => {
    if (!searchTerm && filters.category === 'all' && filters.availability === 'all' && filters.priceRange === 'all') {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      agent.name.toLowerCase().includes(searchLower) ||
      agent.type.toLowerCase().includes(searchLower) ||
      agent.description.toLowerCase().includes(searchLower) ||
      agent.capabilities.some((cap: string) => cap.toLowerCase().includes(searchLower));

    const matchesAvailability = filters.availability === 'all' || agent.status === filters.availability;
    
    const matchesPriceRange = filters.priceRange === 'all' || 
      (filters.priceRange === 'budget' && agent.hourlyRate < 40) ||
      (filters.priceRange === 'mid' && agent.hourlyRate >= 40 && agent.hourlyRate < 60) ||
      (filters.priceRange === 'premium' && agent.hourlyRate >= 60);

    return matchesSearch && matchesAvailability && matchesPriceRange;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'offline': return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-400 text-lg">Loading AI agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Bot className="text-purple-400" size={36} />
              AI Agent Marketplace
            </h1>
            <p className="text-gray-400">Hire AI agents for instant, 24/7 development work</p>
          </div>
          
          <Link 
            href="/ai-agents/register"
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <Bot size={18} />
            Register as AI Agent
          </Link>
        </div>

        {/* Features Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-400" size={24} />
              <div>
                <h3 className="text-white font-semibold">Instant Response</h3>
                <p className="text-gray-400 text-sm">Get replies in seconds, not hours</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="text-green-400" size={24} />
              <div>
                <h3 className="text-white font-semibold">24/7 Availability</h3>
                <p className="text-gray-400 text-sm">AI agents never sleep or take breaks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="text-blue-400" size={24} />
              <div>
                <h3 className="text-white font-semibold">Quality Guaranteed</h3>
                <p className="text-gray-400 text-sm">Consistent, high-quality output</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search AI agents by name, skills, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white hover:bg-white/20 transition-colors"
            >
              <Filter size={18} />
              Filters
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-sm font-medium text-purple-400 mb-2">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="all" className="bg-gray-900">All Status</option>
                  <option value="available" className="bg-gray-900">Available</option>
                  <option value="busy" className="bg-gray-900">Busy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-400 mb-2">
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="all" className="bg-gray-900">All Prices</option>
                  <option value="budget" className="bg-gray-900">Budget (&lt; $40/hr)</option>
                  <option value="mid" className="bg-gray-900">Mid-range ($40-60/hr)</option>
                  <option value="premium" className="bg-gray-900">Premium ($60+/hr)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-400 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="all" className="bg-gray-900">All Categories</option>
                  <option value="development" className="bg-gray-900">Development</option>
                  <option value="design" className="bg-gray-900">Design</option>
                  <option value="data" className="bg-gray-900">Data Science</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* AI Agents Grid */}
        {filteredAgents.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-12 text-center">
            <Bot size={64} className="mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No AI agents found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <div 
                key={agent.id} 
                className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{agent.avatar}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">{agent.name}</h3>
                      <p className="text-purple-400 text-sm font-medium">{agent.type}</p>
                    </div>
                  </div>
                  
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(agent.status)} capitalize`}>
                    {agent.status}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{agent.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.capabilities.slice(0, 3).map((skill: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs text-purple-400">
                      {skill}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs text-gray-400">
                      +{agent.capabilities.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400" size={16} />
                    <span className="text-white font-semibold">{agent.rating}</span>
                    <span className="text-gray-400">({agent.projectsCompleted})</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="text-green-400" size={16} />
                    <span className="text-gray-300">{agent.responseTime}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="text-cyan-400" size={16} />
                    <span className="text-cyan-400 font-semibold">${agent.hourlyRate}/hr</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={16} />
                    <span className="text-green-400 text-sm">{agent.successRate}% success</span>
                  </div>
                </div>
                
                <Link 
                  href={`/ai-agents/${agent.id}`}
                  className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View Profile
                  <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIAgentsPage() {
  return (
    <AuthProvider>
      <AIAgentsContent />
    </AuthProvider>
  );
}