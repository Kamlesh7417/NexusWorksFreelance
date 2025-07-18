'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Settings, Brain, Zap } from 'lucide-react';
import Link from 'next/link';
import DeveloperMatchingResults from '@/components/ai/developer-matching-results';
import SeniorDeveloperProposalInterface from '@/components/ai/senior-developer-proposal-interface';
import TeamHiringWorkflow from '@/components/ai/team-hiring-workflow';
import MatchingPreferences from '@/components/ai/matching-preferences';
import EnhancedAIAssistant from '@/components/ai/enhanced-ai-assistant';
import { projectService, ProjectProposal } from '@/lib/services/project-service';
import { matchingService, DetailedMatch } from '@/lib/services/matching-service';

export default function AIMatchingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<'matching' | 'proposal' | 'hiring' | 'preferences' | 'analysis'>('matching');
  const [project, setProject] = useState<any>(null);
  const [matches, setMatches] = useState<DetailedMatch[]>([]);
  const [proposal, setProposal] = useState<ProjectProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'developer' | 'senior_developer'>('client');

  useEffect(() => {
    loadProjectData();
    loadMatches();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const result = await projectService.getProject(projectId);
      if (result.data) {
        setProject(result.data);
        
        // Mock proposal data - replace with real API call
        const mockProposal: ProjectProposal = {
          project_id: projectId,
          budget_estimate: result.data.budget_estimate || 50000,
          timeline_estimate: '8-12 weeks',
          task_breakdown: [],
          senior_developer_notes: '',
          modifications: []
        };
        setProposal(mockProposal);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const result = await matchingService.getProjectMatches(projectId);
      if (result.data) {
        setMatches(result.data);
      }
    } catch (err) {
      console.error('Failed to load matches:', err);
    }
  };

  const handleDeveloperSelect = (developerId: string, taskIds: string[]) => {
    console.log('Developer selected:', developerId, taskIds);
  };

  const handleInviteDeveloper = (developerId: string) => {
    console.log('Inviting developer:', developerId);
  };

  const handleProposalUpdate = (updatedProposal: ProjectProposal) => {
    setProposal(updatedProposal);
  };

  const handleProposalSubmit = () => {
    console.log('Proposal submitted');
  };

  const handleTeamUpdate = (team: any[]) => {
    console.log('Team updated:', team);
  };

  const tabs = [
    { 
      id: 'matching', 
      name: 'Developer Matching', 
      icon: Users,
      description: 'AI-powered developer matching with confidence scores'
    },
    { 
      id: 'proposal', 
      name: 'Proposal Review', 
      icon: Brain,
      description: 'Senior developer proposal review and modification'
    },
    { 
      id: 'hiring', 
      name: 'Team Hiring', 
      icon: Zap,
      description: 'Dynamic team hiring with pricing workflow'
    },
    { 
      id: 'preferences', 
      name: 'Preferences', 
      icon: Settings,
      description: 'Matching preferences and filtering options'
    },
    { 
      id: 'analysis', 
      name: 'AI Analysis', 
      icon: Brain,
      description: 'Comprehensive AI analysis and insights'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Project
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">AI-Powered Matching & Proposals</h1>
              <p className="text-gray-400">
                {project?.title || 'Project'} - Advanced AI features for optimal team assembly
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-400">Project Status</div>
              <div className="text-lg font-semibold text-cyan-400 capitalize">
                {project?.status || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                    : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <tab.icon size={20} />
                  <span className="font-semibold">{tab.name}</span>
                </div>
                <p className="text-xs opacity-80">{tab.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          {activeTab === 'matching' && (
            <DeveloperMatchingResults
              projectId={projectId}
              onDeveloperSelect={handleDeveloperSelect}
              onInviteDeveloper={handleInviteDeveloper}
            />
          )}

          {activeTab === 'proposal' && proposal && (
            <SeniorDeveloperProposalInterface
              projectId={projectId}
              proposal={proposal}
              onProposalUpdate={handleProposalUpdate}
              onSubmit={handleProposalSubmit}
              isReadOnly={userRole !== 'senior_developer'}
            />
          )}

          {activeTab === 'hiring' && (
            <TeamHiringWorkflow
              projectId={projectId}
              matches={matches}
              onTeamUpdate={handleTeamUpdate}
            />
          )}

          {activeTab === 'preferences' && (
            <MatchingPreferences
              onPreferencesChange={(prefs) => console.log('Preferences updated:', prefs)}
              onFiltersChange={(filters) => console.log('Filters updated:', filters)}
            />
          )}

          {activeTab === 'analysis' && (
            <EnhancedAIAssistant
              projectId={projectId}
              showInteractiveFeatures={true}
            />
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Matches</div>
            <div className="text-2xl font-bold text-white">{matches.length}</div>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Avg Match Score</div>
            <div className="text-2xl font-bold text-cyan-400">
              {matches.length > 0 
                ? Math.round((matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length) * 100)
                : 0
              }%
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Available Devs</div>
            <div className="text-2xl font-bold text-green-400">
              {matches.filter(m => m.developer_profile.availability_status === 'available').length}
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Est. Budget</div>
            <div className="text-2xl font-bold text-green-400">
              ${project?.budget_estimate?.toLocaleString() || '0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}