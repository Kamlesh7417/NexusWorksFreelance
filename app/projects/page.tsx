'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';
import { apiClient, Project, PaginatedResponse } from '@/lib/api-client';
import { ClientOnly, DeveloperOnly, SmartRoleMessage } from '@/components/auth/role-based-access';
import { useSmartNotifications } from '@/lib/services/smart-notifications';
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

function ProjectsContent() {
  const { user, loading: authLoading, isClient, isDeveloper } = useDjangoAuth();
  const { showRoleBasedMessage, checkProfileCompleteness } = useSmartNotifications();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: 'analyzing,proposal_review,approved', // Show active projects
    client: '',
    page: 1
  });
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    
    // Show smart notifications for profile completion
    if (user && !authLoading) {
      checkProfileCompleteness(user);
    }
  }, [user, authLoading, router, checkProfileCompleteness]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching projects with filters:', filters);
        
        // Build API parameters
        const apiParams: any = {
          page: currentPage
        };
        
        // Add status filter for active projects
        if (filters.status) {
          apiParams.status = filters.status;
        }
        
        // Add client filter if specified
        if (filters.client) {
          apiParams.client = filters.client;
        }
        
        // Role-based filtering: developers see all available projects, clients see their own
        if (isClient()) {
          // Clients see their own projects
          apiParams.client = user.id;
        }
        // Developers see all available projects (no additional filtering needed)
        
        const response = await apiClient.getProjects(apiParams);
        console.log('Projects API response:', response);
        
        if (response.error) {
          setError(response.error);
          setProjects([]);
          setTotalCount(0);
          setTotalPages(1);
        } else if (response.data) {
          const projectsData = response.data as PaginatedResponse<Project>;
          setProjects(projectsData.results || []);
          setTotalCount(projectsData.count || 0);
          setTotalPages(Math.ceil((projectsData.count || 0) / 10)); // Assuming 10 items per page
        } else {
          // Fallback to empty state
          setProjects([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch projects');
        setProjects([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, filters, currentPage, isClient]);

  // Filter projects by search term
  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower)
    );
  });



  const statusOptions = [
    { id: 'analyzing,proposal_review,approved', name: 'Available Projects' },
    { id: 'analyzing', name: 'Analyzing' },
    { id: 'proposal_review', name: 'Proposal Review' },
    { id: 'approved', name: 'Approved' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzing': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'proposal_review': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'approved': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'in_progress': return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
      case 'completed': return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
      case 'cancelled': return 'text-red-400 bg-red-500/20 border-red-500/40';
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
          
          <ClientOnly>
            <Link 
              href="/projects/create"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={18} />
              Post a Project
            </Link>
          </ClientOnly>
          
          <SmartRoleMessage
            clientMessage="Manage your posted projects and find the perfect developers"
            developerMessage="Browse available projects and submit proposals to showcase your skills"
            className="text-sm text-gray-400"
          />
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
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
              {isClient() && (
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    Show All Projects
                  </label>
                  <button
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      client: prev.client === '' ? user?.id || '' : '',
                      page: 1 
                    }))}
                    className={`w-full px-4 py-3 rounded-lg transition-colors ${
                      filters.client === '' 
                        ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400' 
                        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {filters.client === '' ? 'Showing All Projects' : 'Show All Projects'}
                  </button>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Results per page
                </label>
                <div className="text-sm text-gray-400">
                  Showing {projects.length} of {totalCount} projects
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-cyan-400" />
            <p className="text-gray-400 mt-4">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-2xl p-12 text-center">
            <div className="text-red-400 mb-4">⚠️ Error Loading Projects</div>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Retry
            </button>
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
                  status: 'analyzing,proposal_review,approved',
                  client: isClient() ? user?.id || '' : '',
                  page: 1
                });
                setCurrentPage(1);
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
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      {project.ai_analysis && (
                        <span className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-400">
                          AI Analyzed
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <Users size={14} className="text-cyan-400" />
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{project.description}</p>
                
                {project.ai_analysis && project.ai_analysis.required_skills && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.ai_analysis.required_skills.slice(0, 3).map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-400">
                        {skill}
                      </span>
                    ))}
                    {project.ai_analysis.required_skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs text-gray-400">
                        +{project.ai_analysis.required_skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  {project.budget_estimate && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-400" />
                      <span className="text-green-400 font-semibold">
                        ${project.budget_estimate.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {project.timeline_estimate && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-yellow-400" />
                      <span className="text-gray-300">
                        {project.timeline_estimate}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar size={16} className="text-blue-400" />
                    <span className="text-gray-300">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link 
                    href={`/projects/${project.id}`}
                    className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                    <ArrowRight size={14} className="ml-1" />
                  </Link>
                  
                  <DeveloperOnly>
                    <button
                      onClick={() => {
                        if (!user?.profile_completed) {
                          showRoleBasedMessage(user!, 'incomplete_profile');
                        } else {
                          // Handle proposal submission
                          console.log('Submit proposal for project:', project.id);
                        }
                      }}
                      className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Users size={16} />
                      Submit Proposal
                    </button>
                  </DeveloperOnly>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-4">
            <button
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                setCurrentPage(newPage);
                setFilters(prev => ({ ...prev, page: newPage }));
              }}
              disabled={currentPage === 1}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      setFilters(prev => ({ ...prev, page: pageNum }));
                    }}
                    className={`rounded-lg px-4 py-2 transition-colors ${
                      currentPage === pageNum
                        ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && (
                <>
                  <span className="px-2 py-2 text-gray-400">...</span>
                  <button
                    onClick={() => {
                      setCurrentPage(totalPages);
                      setFilters(prev => ({ ...prev, page: totalPages }));
                    }}
                    className={`rounded-lg px-4 py-2 transition-colors ${
                      currentPage === totalPages
                        ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1);
                setCurrentPage(newPage);
                setFilters(prev => ({ ...prev, page: newPage }));
              }}
              disabled={currentPage === totalPages}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
        
        {/* Results Summary */}
        {totalCount > 0 && (
          <div className="text-center mt-4 text-sm text-gray-400">
            Showing page {currentPage} of {totalPages} ({totalCount} total projects)
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}