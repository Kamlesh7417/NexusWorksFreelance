'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from './project-context';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Code, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Eye,
  MessageSquare,
  Plus,
  RefreshCw,
  Star,
  GitMerge,
  Activity,
  Calendar,
  Hash,
  Folder,
  Download
} from 'lucide-react';

interface GitHubIntegrationProps {
  projectDetails: any;
  className?: string;
}

interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  default_branch: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  updated_at: string;
}

interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_branch: string;
  base_branch: string;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  reviewers: string[];
  labels: string[];
}

interface Commit {
  id: string;
  sha: string;
  message: string;
  author: string;
  date: string;
  html_url: string;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

interface CodeReview {
  id: string;
  pull_request_id: string;
  reviewer: string;
  state: 'pending' | 'approved' | 'changes_requested';
  body: string;
  submitted_at: string;
}

export function GitHubIntegration({ projectDetails, className = '' }: GitHubIntegrationProps) {
  const { hasPermission, isSeniorDeveloper } = useProject();
  const [activeTab, setActiveTab] = useState('overview');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [codeReviews, setCodeReviews] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load GitHub data
  const loadGitHubData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data - in real implementation, this would come from GitHub API
      const mockRepos: Repository[] = [
        {
          id: '1',
          name: 'ecommerce-frontend',
          full_name: 'client/ecommerce-frontend',
          description: 'React frontend for e-commerce platform',
          html_url: 'https://github.com/client/ecommerce-frontend',
          default_branch: 'main',
          language: 'TypeScript',
          stars: 15,
          forks: 3,
          open_issues: 8,
          updated_at: '2024-01-18T10:30:00Z'
        },
        {
          id: '2',
          name: 'ecommerce-backend',
          full_name: 'client/ecommerce-backend',
          description: 'Node.js backend API for e-commerce platform',
          html_url: 'https://github.com/client/ecommerce-backend',
          default_branch: 'main',
          language: 'JavaScript',
          stars: 12,
          forks: 2,
          open_issues: 5,
          updated_at: '2024-01-17T15:45:00Z'
        }
      ];

      const mockPRs: PullRequest[] = [
        {
          id: '1',
          number: 23,
          title: 'Add payment integration with Stripe',
          body: 'Implements Stripe payment processing for checkout flow',
          state: 'open',
          author: 'john_doe',
          created_at: '2024-01-17T09:00:00Z',
          updated_at: '2024-01-18T11:30:00Z',
          html_url: 'https://github.com/client/ecommerce-frontend/pull/23',
          head_branch: 'feature/stripe-integration',
          base_branch: 'main',
          commits: 8,
          additions: 245,
          deletions: 12,
          changed_files: 6,
          reviewers: ['jane_smith'],
          labels: ['feature', 'payment']
        },
        {
          id: '2',
          number: 22,
          title: 'Fix user authentication bug',
          body: 'Resolves issue with JWT token expiration handling',
          state: 'merged',
          author: 'jane_smith',
          created_at: '2024-01-16T14:20:00Z',
          updated_at: '2024-01-17T10:15:00Z',
          html_url: 'https://github.com/client/ecommerce-backend/pull/22',
          head_branch: 'bugfix/auth-token',
          base_branch: 'main',
          commits: 3,
          additions: 45,
          deletions: 18,
          changed_files: 2,
          reviewers: ['john_doe'],
          labels: ['bugfix', 'auth']
        }
      ];

      const mockCommits: Commit[] = [
        {
          id: '1',
          sha: 'a1b2c3d',
          message: 'Add Stripe payment component',
          author: 'john_doe',
          date: '2024-01-18T11:30:00Z',
          html_url: 'https://github.com/client/ecommerce-frontend/commit/a1b2c3d',
          stats: { additions: 89, deletions: 5, total: 94 }
        },
        {
          id: '2',
          sha: 'e4f5g6h',
          message: 'Update payment validation logic',
          author: 'john_doe',
          date: '2024-01-18T10:15:00Z',
          html_url: 'https://github.com/client/ecommerce-frontend/commit/e4f5g6h',
          stats: { additions: 34, deletions: 12, total: 46 }
        }
      ];

      const mockReviews: CodeReview[] = [
        {
          id: '1',
          pull_request_id: '1',
          reviewer: 'jane_smith',
          state: 'changes_requested',
          body: 'Please add error handling for failed payment attempts',
          submitted_at: '2024-01-18T09:45:00Z'
        }
      ];

      setRepositories(mockRepos);
      setPullRequests(mockPRs);
      setCommits(mockCommits);
      setCodeReviews(mockReviews);
      
      if (mockRepos.length > 0) {
        setSelectedRepo(mockRepos[0]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GitHub data');
      console.error('Error loading GitHub data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh GitHub data
  const refreshGitHubData = useCallback(async () => {
    setRefreshing(true);
    await loadGitHubData();
    setRefreshing(false);
  }, [loadGitHubData]);

  // Load data on mount
  useEffect(() => {
    loadGitHubData();
  }, [loadGitHubData]);

  // Get PR status info
  const getPRStatusInfo = (state: string) => {
    const statusMap = {
      open: { color: 'text-green-400', bg: 'bg-green-600/20', icon: GitPullRequest },
      closed: { color: 'text-red-400', bg: 'bg-red-600/20', icon: GitPullRequest },
      merged: { color: 'text-purple-400', bg: 'bg-purple-600/20', icon: GitMerge }
    };
    return statusMap[state as keyof typeof statusMap] || statusMap.open;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading GitHub integration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">GitHub Integration Error</h3>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={refreshGitHubData}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* GitHub Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-400">Repositories</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {repositories.length}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitPullRequest className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Open PRs</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {pullRequests.filter(pr => pr.state === 'open').length}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitCommit className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Recent Commits</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {commits.length}
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-gray-400">Code Reviews</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {codeReviews.length}
          </div>
        </div>
      </div>

      {/* Repository Selector */}
      {repositories.length > 1 && (
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Repository:</span>
            <select
              value={selectedRepo?.id || ''}
              onChange={(e) => {
                const repo = repositories.find(r => r.id === e.target.value);
                setSelectedRepo(repo || null);
              }}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {repositories.map(repo => (
                <option key={repo.id} value={repo.id}>
                  {repo.name}
                </option>
              ))}
            </select>
            <button
              onClick={refreshGitHubData}
              disabled={refreshing}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh GitHub Data"
            >
              <RefreshCw className={`h-4 w-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-700/50">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest },
          { id: 'commits', label: 'Commits', icon: GitCommit },
          { id: 'reviews', label: 'Code Reviews', icon: Eye }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && selectedRepo && (
        <div className="space-y-6">
          {/* Repository Info */}
          <div className="bg-gray-800/30 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedRepo.name}</h3>
                <p className="text-gray-400 mb-3">{selectedRepo.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Code className="h-4 w-4" />
                    {selectedRepo.language}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {selectedRepo.stars} stars
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-4 w-4" />
                    {selectedRepo.forks} forks
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {selectedRepo.open_issues} issues
                  </span>
                </div>
              </div>
              <a
                href={selectedRepo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Pull Requests</h3>
              <div className="space-y-3">
                {pullRequests.slice(0, 3).map(pr => {
                  const statusInfo = getPRStatusInfo(pr.state);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={pr.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <div className={`p-1 rounded ${statusInfo.bg}`}>
                        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">#{pr.number} {pr.title}</div>
                        <div className="text-gray-400 text-sm">
                          by {pr.author} • {new Date(pr.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Commits</h3>
              <div className="space-y-3">
                {commits.slice(0, 3).map(commit => (
                  <div key={commit.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="p-1 bg-blue-600/20 rounded">
                      <GitCommit className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{commit.message}</div>
                      <div className="text-gray-400 text-sm">
                        by {commit.author} • {new Date(commit.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <Hash className="h-3 w-3 inline mr-1" />
                      {commit.sha.substring(0, 7)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pull Requests Tab */}
      {activeTab === 'pull-requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Pull Requests</h3>
            {hasPermission('code_review') && (
              <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus className="h-4 w-4" />
                New PR
              </button>
            )}
          </div>

          <div className="space-y-4">
            {pullRequests.map(pr => {
              const statusInfo = getPRStatusInfo(pr.state);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div
                  key={pr.id}
                  className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 hover:border-gray-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {pr.state.charAt(0).toUpperCase() + pr.state.slice(1)}
                        </div>
                        <h4 className="text-lg font-semibold text-white">
                          #{pr.number} {pr.title}
                        </h4>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3">{pr.body}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>by {pr.author}</span>
                        <span>{pr.head_branch} → {pr.base_branch}</span>
                        <span>{pr.commits} commits</span>
                        <span className="text-green-400">+{pr.additions}</span>
                        <span className="text-red-400">-{pr.deletions}</span>
                      </div>

                      {pr.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {pr.labels.map((label, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title="View on GitHub"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                      
                      {hasPermission('code_review') && pr.state === 'open' && (
                        <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                          <Eye className="h-3 w-3" />
                          Review
                        </button>
                      )}
                    </div>
                  </div>

                  {pr.reviewers.length > 0 && (
                    <div className="pt-4 border-t border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Reviewers:</span>
                        <div className="flex items-center gap-2">
                          {pr.reviewers.map((reviewer, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            >
                              {reviewer.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commits Tab */}
      {activeTab === 'commits' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recent Commits</h3>
          
          <div className="space-y-3">
            {commits.map(commit => (
              <div
                key={commit.id}
                className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-1 bg-blue-600/20 rounded">
                        <GitCommit className="h-4 w-4 text-blue-400" />
                      </div>
                      <h4 className="text-white font-medium">{commit.message}</h4>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>by {commit.author}</span>
                      <span>{new Date(commit.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {commit.sha.substring(0, 7)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-400">+{commit.stats.additions}</span>
                    <span className="text-red-400">-{commit.stats.deletions}</span>
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="View on GitHub"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Code Reviews</h3>
            {isSeniorDeveloper() && (
              <div className="text-sm text-gray-400">
                Senior Developer Review Privileges
              </div>
            )}
          </div>

          {codeReviews.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No code reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {codeReviews.map(review => {
                const pr = pullRequests.find(p => p.id === review.pull_request_id);
                const statusColors = {
                  pending: 'text-yellow-400 bg-yellow-600/20',
                  approved: 'text-green-400 bg-green-600/20',
                  changes_requested: 'text-red-400 bg-red-600/20'
                };
                
                return (
                  <div
                    key={review.id}
                    className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-2 py-1 rounded-full text-xs ${statusColors[review.state]}`}>
                            {review.state.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <span className="text-white font-medium">
                            Review for PR #{pr?.number}
                          </span>
                        </div>
                        <h4 className="text-lg text-white mb-2">{pr?.title}</h4>
                        <p className="text-gray-400 text-sm">{review.body}</p>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        by {review.reviewer} • {new Date(review.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}