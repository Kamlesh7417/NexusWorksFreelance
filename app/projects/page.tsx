'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Search, 
  Filter, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  Tag, 
  Clock, 
  ChevronDown, 
  Loader2, 
  Plus,
  Star,
  Users,
  Eye,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    minBudget: '',
    maxBudget: '',
    skills: '',
    urgency: 'all',
    status: 'active'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
    };

    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('projects')
          .select(`
            *,
            client:user_profiles!projects_client_id_fkey(id, full_name, avatar_url, role)
          `)
          .eq('status', filters.status);

        // Apply category filter
        if (filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }

        // Apply budget filters
        if (filters.minBudget) {
          query = query.gte('budget_min', parseInt(filters.minBudget));
        }
        if (filters.maxBudget) {
          query = query.lte('budget_max', parseInt(filters.maxBudget));
        }

        // Apply urgency filter
        if (filters.urgency !== 'all') {
          query = query.eq('urgency', filters.urgency);
        }

        // Apply skills filter
        if (filters.skills) {
          const skillsArray = filters.skills.split(',').map(s => s.trim());
          query = query.contains('skills_required', skillsArray);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [supabase, filters]);

  // Filter projects by search term
  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower)
    );
  });

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'web-development', name: 'Web Development' },
    { id: 'mobile-app', name: 'Mobile App' },
    { id: 'ai-ml', name: 'AI/Machine Learning' },
    { id: 'blockchain', name: 'Blockchain' },
    { id: 'design', name: 'UI/UX Design' },
    { id: 'other', name: 'Other' }
  ];

  const urgencyOptions = [
    { id: 'all', name: 'All Urgency' },
    { id: 'low', name: 'Low' },
    { id: 'medium', name: 'Medium' },
    { id: 'high', name: 'High' }
  ];

  const statusOptions = [
    { id: 'active', name: 'Active' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'completed', name: 'Completed' }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Project Marketplace</h1>
            <p className="text-gray-400">Find the perfect project for your skills</p>
          </div>
          
          {profile?.role !== 'client' && (
            <Link 
              href="/projects/create"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={18} />
              Post a Project
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
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
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
            >
              {statusOptions.map(option => (
                <option key={option.id} value={option.id} className="bg-gray-900">
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="bg-gray-900">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Budget Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minBudget}
                    onChange={(e) => setFilters(prev => ({ ...prev, minBudget: e.target.value }))}
                    className="w-1/2 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxBudget}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxBudget: e.target.value }))}
                    className="w-1/2 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Urgency
                </label>
                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                >
                  {urgencyOptions.map(option => (
                    <option key={option.id} value={option.id} className="bg-gray-900">
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="React, Node.js, Python..."
                  value={filters.skills}
                  onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-cyan-400" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-12 text-center">
            <Briefcase size={64} className="mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your filters or search criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  category: 'all',
                  minBudget: '',
                  maxBudget: '',
                  skills: '',
                  urgency: 'all',
                  status: 'active'
                });
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <div 
                key={project.id} 
                className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1">{project.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 capitalize">{project.category.replace('-', ' ')}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(project.urgency)}`}>
                        {project.urgency}
                      </span>
                    </div>
                  </div>
                  
                  {project.client && (
                    <div className="flex items-center gap-2">
                      {project.client.avatar_url ? (
                        <img 
                          src={project.client.avatar_url} 
                          alt={project.client.full_name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                          <Users size={14} className="text-cyan-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{project.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.skills_required && project.skills_required.slice(0, 3).map((skill: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-400">
                      {skill}
                    </span>
                  ))}
                  {project.skills_required && project.skills_required.length > 3 && (
                    <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs text-gray-400">
                      +{project.skills_required.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-green-400" />
                    <span className="text-green-400 font-semibold">
                      ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                    </span>
                  </div>
                  
                  {project.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-yellow-400" />
                      <span className="text-gray-300">
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <Link 
                  href={`/projects/${project.id}`}
                  className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View Details
                  <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination Placeholder */}
        {filteredProjects.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors">
                Previous
              </button>
              <button className="bg-cyan-500/20 border border-cyan-500/40 rounded-lg px-4 py-2 text-cyan-400 hover:bg-cyan-500/30 transition-colors">
                1
              </button>
              <button className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors">
                2
              </button>
              <button className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors">
                3
              </button>
              <button className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}