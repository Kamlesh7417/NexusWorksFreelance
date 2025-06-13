'use client';

import { useState, useEffect } from 'react';
import { blockchainService, ProjectEscrowInfo } from '@/lib/blockchain';
import { Shield, Clock, CheckCircle, AlertTriangle, DollarSign, Users } from 'lucide-react';

interface Milestone {
  amount: string;
  description: string;
  status: number;
  dueDate: number;
  paid: boolean;
}

export function ProjectEscrow() {
  const [projects, setProjects] = useState<ProjectEscrowInfo[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectEscrowInfo | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadUserProjects();
  }, []);

  const loadUserProjects = async () => {
    // In a real implementation, you would fetch user's projects from the blockchain
    // For now, we'll simulate with mock data
    setIsLoading(true);
    try {
      // Mock project data
      const mockProjects: ProjectEscrowInfo[] = [
        {
          projectId: 1,
          client: '0x1234...5678',
          freelancer: '0x8765...4321',
          totalAmount: '5000',
          status: 1, // InProgress
          createdAt: Date.now() / 1000 - 86400 * 7, // 7 days ago
          completedAt: 0
        },
        {
          projectId: 2,
          client: '0x1234...5678',
          freelancer: '0x9876...1234',
          totalAmount: '3500',
          status: 2, // Completed
          createdAt: Date.now() / 1000 - 86400 * 30, // 30 days ago
          completedAt: Date.now() / 1000 - 86400 * 3 // 3 days ago
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Load projects error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectMilestones = async (projectId: number) => {
    // Mock milestone data
    const mockMilestones: Milestone[] = [
      {
        amount: '1500',
        description: 'Project setup and initial development',
        status: 1, // Completed
        dueDate: Date.now() / 1000 + 86400 * 7,
        paid: true
      },
      {
        amount: '2000',
        description: 'Core functionality implementation',
        status: 1, // Completed
        dueDate: Date.now() / 1000 + 86400 * 14,
        paid: false
      },
      {
        amount: '1500',
        description: 'Testing and deployment',
        status: 0, // Pending
        dueDate: Date.now() / 1000 + 86400 * 21,
        paid: false
      }
    ];
    setMilestones(mockMilestones);
  };

  const getStatusText = (status: number) => {
    const statuses = ['Created', 'In Progress', 'Completed', 'Disputed', 'Cancelled'];
    return statuses[status] || 'Unknown';
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-gray-400 bg-gray-500/20';
      case 1: return 'text-yellow-400 bg-yellow-500/20';
      case 2: return 'text-green-400 bg-green-500/20';
      case 3: return 'text-red-400 bg-red-500/20';
      case 4: return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getMilestoneStatusText = (status: number) => {
    const statuses = ['Pending', 'Completed', 'Disputed'];
    return statuses[status] || 'Unknown';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleProjectSelect = async (project: ProjectEscrowInfo) => {
    setSelectedProject(project);
    await loadProjectMilestones(project.projectId);
  };

  const handleCompleteMilestone = async (milestoneIndex: number) => {
    if (!selectedProject) return;

    try {
      const success = await blockchainService.completeMilestone(
        selectedProject.projectId,
        milestoneIndex
      );
      if (success) {
        await loadProjectMilestones(selectedProject.projectId);
      }
    } catch (error) {
      console.error('Complete milestone error:', error);
    }
  };

  const handleApproveMilestone = async (milestoneIndex: number) => {
    if (!selectedProject) return;

    try {
      const success = await blockchainService.approveMilestone(
        selectedProject.projectId,
        milestoneIndex
      );
      if (success) {
        await loadProjectMilestones(selectedProject.projectId);
      }
    } catch (error) {
      console.error('Approve milestone error:', error);
    }
  };

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Quantum Escrow Protocol</h2>
          <p className="text-sm opacity-80">Secure milestone-based payments with smart contracts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="nexus-action-btn flex items-center gap-2"
        >
          <Shield size={16} />
          Create Escrow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project List */}
        <div>
          <h3 className="font-semibold text-cyan-400 mb-4">Your Projects</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.projectId}
                  onClick={() => handleProjectSelect(project)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedProject?.projectId === project.projectId
                      ? 'bg-cyan-500/20 border-cyan-500/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Project #{project.projectId}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Total Amount</div>
                      <div className="font-semibold text-green-400">
                        {parseFloat(project.totalAmount).toLocaleString()} WORK
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Created</div>
                      <div className="font-semibold">
                        {formatDate(project.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs">
                    <div className="text-gray-400">
                      Client: {formatAddress(project.client)}
                    </div>
                    <div className="text-gray-400">
                      Freelancer: {formatAddress(project.freelancer)}
                    </div>
                  </div>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Shield size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No escrow projects found</p>
                  <p className="text-sm">Create your first secure project escrow</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project Details */}
        <div>
          {selectedProject ? (
            <div>
              <h3 className="font-semibold text-cyan-400 mb-4">
                Project #{selectedProject.projectId} Details
              </h3>
              
              {/* Project Overview */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={14} className="text-green-400" />
                      <span className="text-sm">Total Value</span>
                    </div>
                    <div className="font-bold text-green-400">
                      {parseFloat(selectedProject.totalAmount).toLocaleString()} WORK
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-yellow-400" />
                      <span className="text-sm">Status</span>
                    </div>
                    <div className={`font-bold ${getStatusColor(selectedProject.status).split(' ')[0]}`}>
                      {getStatusText(selectedProject.status)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Client</div>
                    <div className="font-mono">{formatAddress(selectedProject.client)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Freelancer</div>
                    <div className="font-mono">{formatAddress(selectedProject.freelancer)}</div>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h4 className="font-semibold text-cyan-400 mb-3">Project Milestones</h4>
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Milestone {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            milestone.status === 1 ? 'bg-green-500/20 text-green-400' :
                            milestone.status === 2 ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {getMilestoneStatusText(milestone.status)}
                          </span>
                          {milestone.paid && (
                            <CheckCircle size={16} className="text-green-400" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm opacity-80 mb-3">{milestone.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-gray-400">Amount: </span>
                          <span className="font-semibold text-green-400">
                            {parseFloat(milestone.amount).toLocaleString()} WORK
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Due: {formatDate(milestone.dueDate)}
                        </div>
                      </div>
                      
                      {/* Milestone Actions */}
                      <div className="mt-3 flex gap-2">
                        {milestone.status === 0 && (
                          <button
                            onClick={() => handleCompleteMilestone(index)}
                            className="nexus-action-btn text-sm px-3 py-1"
                          >
                            Mark Complete
                          </button>
                        )}
                        {milestone.status === 1 && !milestone.paid && (
                          <button
                            onClick={() => handleApproveMilestone(index)}
                            className="nexus-action-btn text-sm px-3 py-1"
                          >
                            Approve & Pay
                          </button>
                        )}
                        {milestone.status === 1 && !milestone.paid && (
                          <button className="nexus-back-btn text-sm px-3 py-1">
                            Dispute
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a project to view details</p>
              <p className="text-sm">Choose from your active escrow projects</p>
            </div>
          )}
        </div>
      </div>

      {/* Quantum Security Status */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-purple-400" />
          <span className="font-medium text-purple-400">Quantum Escrow Security</span>
        </div>
        <div className="text-sm opacity-80">
          All escrow contracts are secured with quantum-resistant encryption and automated dispute resolution mechanisms.
          Funds are released only upon milestone completion and approval.
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateEscrowModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateEscrowModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    freelancer: '',
    totalAmount: '',
    milestones: [
      { description: '', amount: '', dueDate: '' }
    ]
  });

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { description: '', amount: '', dueDate: '' }]
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const milestoneDescriptions = formData.milestones.map(m => m.description);
      const milestoneAmounts = formData.milestones.map(m => m.amount);
      const milestoneDueDates = formData.milestones.map(m => 
        Math.floor(new Date(m.dueDate).getTime() / 1000)
      );

      const projectId = await blockchainService.createProject(
        formData.freelancer,
        formData.totalAmount,
        milestoneDescriptions,
        milestoneAmounts,
        milestoneDueDates
      );

      if (projectId) {
        onClose();
        // Refresh projects list
      }
    } catch (error) {
      console.error('Create project error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white/5 border border-white/20 rounded-2xl p-8 max-w-2xl w-[90%] max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6">Create Quantum Escrow</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Freelancer Address
            </label>
            <input
              type="text"
              required
              value={formData.freelancer}
              onChange={(e) => setFormData(prev => ({ ...prev, freelancer: e.target.value }))}
              className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none font-mono"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Total Project Amount (WORK)
            </label>
            <input
              type="number"
              required
              value={formData.totalAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
              className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
              placeholder="5000"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-cyan-400">Project Milestones</label>
              <button
                type="button"
                onClick={addMilestone}
                className="nexus-action-btn text-sm px-3 py-1"
              >
                Add Milestone
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Milestone {index + 1}</span>
                    {formData.milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        required
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
                        placeholder="Milestone description"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        required
                        value={milestone.amount}
                        onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                        className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
                        placeholder="Amount"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="date"
                        required
                        value={milestone.dueDate}
                        onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                        className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="nexus-action-btn flex-1">
              Create Escrow
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