'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectManager } from '@/lib/project-management';
import { ProjectDashboard } from './project-dashboard';
import { FreelancerMatcher } from './freelancer-matcher';
import { RealTimeNotifications } from './real-time-notifications';
import { Plus, FolderOpen, Search, Filter } from 'lucide-react';

export function ProjectManagementSystem() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Load mock projects
    loadMockProjects();
  }, []);

  const loadMockProjects = async () => {
    const mockProjects = [
      {
        name: 'AI Healthcare Dashboard',
        description: 'Develop a comprehensive AI-powered dashboard for healthcare providers to track patient data, predict health outcomes, and optimize treatment plans using machine learning algorithms.',
        budget: { allocated: 5000, spent: 1250, currency: 'USD' },
        team: ['Alexandra Reed', 'Marcus Tan', 'Sofia Mendes'],
        githubRepo: {
          owner: 'nexusworks',
          repo: 'ai-healthcare-dashboard',
          url: 'https://github.com/nexusworks/ai-healthcare-dashboard'
        }
      },
      {
        name: 'Quantum Encryption Protocol',
        description: 'Design and implement a quantum-resistant encryption system for financial transactions, ensuring security against future quantum computing threats.',
        budget: { allocated: 8000, spent: 2400, currency: 'USD' },
        team: ['James Okoro', 'Li Wei Zhang'],
        githubRepo: {
          owner: 'nexusworks',
          repo: 'quantum-encryption',
          url: 'https://github.com/nexusworks/quantum-encryption'
        }
      },
      {
        name: 'AR Product Visualization',
        description: 'Create an augmented reality application that allows customers to visualize furniture and home decor in their real-world environment before making a purchase.',
        budget: { allocated: 3500, spent: 875, currency: 'USD' },
        team: ['Marcus Tan', 'Alexandra Reed']
      }
    ];

    const createdProjects = await Promise.all(
      mockProjects.map(project => ProjectManager.createProject(project))
    );

    setProjects(createdProjects);
    if (createdProjects.length > 0) {
      setSelectedProject(createdProjects[0]);
    }
  };

  const createProject = async (projectData: any) => {
    const newProject = await ProjectManager.createProject(projectData);
    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    setShowCreateModal(false);
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    setSelectedProject(updatedProject);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <RealTimeNotifications />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Project Sidebar */}
          <div className="w-80 space-y-4">
            <div className="nexus-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-cyan-400">Projects</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="nexus-action-btn p-2"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-cyan-500/30 rounded-lg pl-10 pr-3 py-2 text-white outline-none"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Project List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? 'bg-cyan-500/20 border-cyan-500/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-cyan-400 text-sm">{project.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        project.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs opacity-70 mb-2 line-clamp-2">{project.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{project.tasks.length} tasks</span>
                      <span className="text-cyan-400">
                        {ProjectManager.calculateProjectProgress(project)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProjects.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No projects found</p>
                  <p className="text-sm">Create your first project to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {selectedProject ? (
              <>
                <ProjectDashboard 
                  project={selectedProject} 
                  onProjectUpdate={updateProject}
                />
                <FreelancerMatcher project={selectedProject} />
              </>
            ) : (
              <div className="nexus-card text-center py-12">
                <FolderOpen size={64} className="mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Project Selected</h3>
                <p className="text-gray-500">Select a project from the sidebar to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createProject}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
    timeline: '30'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: formData.name,
      description: formData.description,
      budget: {
        allocated: parseInt(formData.budget) || 0,
        spent: 0,
        currency: 'USD'
      },
      timeline: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + parseInt(formData.timeline) * 24 * 60 * 60 * 1000).toISOString(),
        milestones: []
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white/5 border border-white/20 rounded-2xl p-8 max-w-2xl w-[90%]">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6">Create New Project</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Project Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none min-h-[100px]"
              placeholder="Describe your project requirements and goals"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Budget (USD)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Timeline (days)
              </label>
              <input
                type="number"
                value={formData.timeline}
                onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="nexus-action-btn flex-1">
              Create Project
            </button>
            <button type="button" onClick={onClose} className="nexus-back-btn flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}