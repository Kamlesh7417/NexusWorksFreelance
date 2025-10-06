'use client';

import React, { useState, useCallback } from 'react';
import { DjangoUser } from '@/components/auth/django-auth-provider';
import { apiClient } from '@/lib/api-client';
import { useSmartNotifications } from '@/lib/services/smart-notifications';
import {
    Github,
    ExternalLink,
    Loader2,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Star,
    GitBranch,
    Code,
    Calendar,
    TrendingUp,
    Award,
    Users,
    BookOpen
} from 'lucide-react';

interface GitHubIntegrationProps {
    user: DjangoUser;
    onUpdate: () => void;
}

interface GitHubRepository {
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    updated_at: string;
    html_url: string;
}

interface GitHubAnalysis {
    username: string;
    profile_url: string;
    repositories: GitHubRepository[];
    languages: { [key: string]: number };
    total_commits: number;
    total_stars: number;
    total_repositories: number;
    account_age_years: number;
    activity_score: number;
    skills_detected: string[];
    analysis_date: string;
    recommendations: string[];
}

export function GitHubIntegration({ user, onUpdate }: GitHubIntegrationProps) {
    const { showSuccess, showError } = useSmartNotifications();
    const [connecting, setConnecting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [githubUsername, setGithubUsername] = useState(user.github_username || '');
    const [analysis, setAnalysis] = useState<GitHubAnalysis | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Load existing GitHub analysis on component mount
    React.useEffect(() => {
        if (user.github_username) {
            loadGitHubAnalysis();
        }
    }, [user.github_username]);

    const loadGitHubAnalysis = async () => {
        try {
            const response = await apiClient.makeRequest('/ai-services/github-analysis/', {
                method: 'GET'
            });

            if (response.data && !response.error) {
                setAnalysis(response.data as GitHubAnalysis);
            }
        } catch (error) {
            console.error('Error loading GitHub analysis:', error);
        }
    };

    const handleConnectGitHub = async () => {
        if (!githubUsername.trim()) {
            showError('Please enter a GitHub username');
            return;
        }

        setConnecting(true);
        try {
            // Update user profile with GitHub username via direct API call
            const response = await apiClient.makeRequest('/users/profile/', {
                method: 'PATCH',
                body: JSON.stringify({
                    github_username: githubUsername.trim()
                })
            });

            if (response.error) {
                throw new Error(response.error);
            }

            showSuccess('GitHub username saved! Starting profile analysis...');

            // Trigger skill analysis
            await triggerSkillAnalysis();

            onUpdate();
        } catch (error) {
            console.error('GitHub connection error:', error);
            showError(error instanceof Error ? error.message : 'Failed to connect GitHub');
        } finally {
            setConnecting(false);
        }
    };

    const triggerSkillAnalysis = async () => {
        setAnalyzing(true);
        try {
            const response = await apiClient.makeRequest('/ai-services/trigger-skill-update/', {
                method: 'POST'
            });

            if (response.error) {
                throw new Error(response.error);
            }

            showSuccess('GitHub analysis started! This may take a few minutes...');

            // Poll for analysis completion
            setTimeout(() => {
                loadGitHubAnalysis();
                setAnalyzing(false);
            }, 5000);

        } catch (error) {
            console.error('Skill analysis error:', error);
            showError(error instanceof Error ? error.message : 'Failed to analyze GitHub profile');
            setAnalyzing(false);
        }
    };

    const handleRefreshAnalysis = async () => {
        if (!user.github_username) return;
        await triggerSkillAnalysis();
    };

    const handleDisconnectGitHub = async () => {
        try {
            const response = await apiClient.makeRequest('/users/profile/', {
                method: 'PATCH',
                body: JSON.stringify({
                    github_username: ''
                })
            });

            if (response.error) {
                throw new Error(response.error);
            }

            setGithubUsername('');
            setAnalysis(null);
            showSuccess('GitHub account disconnected');
            onUpdate();
        } catch (error) {
            console.error('GitHub disconnection error:', error);
            showError('Failed to disconnect GitHub');
        }
    };

    const formatLanguagePercentage = (languages: { [key: string]: number }) => {
        const total = Object.values(languages).reduce((sum, count) => sum + count, 0);
        return Object.entries(languages)
            .map(([lang, count]) => ({
                language: lang,
                percentage: Math.round((count / total) * 100)
            }))
            .sort((a, b) => b.percentage - a.percentage);
    };

    const getActivityLevel = (score: number) => {
        if (score >= 80) return { level: 'Very Active', color: 'text-green-400' };
        if (score >= 60) return { level: 'Active', color: 'text-blue-400' };
        if (score >= 40) return { level: 'Moderate', color: 'text-yellow-400' };
        return { level: 'Low Activity', color: 'text-gray-400' };
    };

    const renderGitHubAnalysis = () => {
        if (!analysis) return null;

        const languageStats = formatLanguagePercentage(analysis.languages);
        const activityLevel = getActivityLevel(analysis.activity_score);

        return (
            <div className="space-y-6">
                {/* Profile Overview */}
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <Github size={24} className="text-purple-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-white">GitHub Profile Analysis</h4>
                                <a
                                    href={analysis.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                                >
                                    @{analysis.username}
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm text-gray-400 mb-1">Last analyzed</div>
                            <div className="text-sm text-white">
                                {new Date(analysis.analysis_date).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{analysis.total_repositories}</div>
                            <div className="text-sm text-gray-400">Repositories</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{analysis.total_stars}</div>
                            <div className="text-sm text-gray-400">Total Stars</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{analysis.total_commits}</div>
                            <div className="text-sm text-gray-400">Commits</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{analysis.account_age_years}</div>
                            <div className="text-sm text-gray-400">Years Active</div>
                        </div>
                    </div>

                    {/* Activity Level */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-gray-400" />
                            <span className="text-gray-300">Activity Level</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${activityLevel.color}`}>
                                {activityLevel.level}
                            </span>
                            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-500"
                                    style={{ width: `${analysis.activity_score}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Programming Languages */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h5 className="font-medium text-white mb-4 flex items-center gap-2">
                        <Code size={18} />
                        Programming Languages
                    </h5>

                    <div className="space-y-3">
                        {languageStats.slice(0, 8).map((lang, index) => (
                            <div key={lang.language} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
                                    <span className="text-gray-300">{lang.language}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                                            style={{ width: `${lang.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-400 w-8 text-right">
                                        {lang.percentage}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skills Detected */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h5 className="font-medium text-white mb-4 flex items-center gap-2">
                        <Award size={18} />
                        Skills Detected ({analysis.skills_detected.length})
                    </h5>

                    <div className="flex flex-wrap gap-2">
                        {analysis.skills_detected.map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm text-cyan-400"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Top Repositories */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h5 className="font-medium text-white mb-4 flex items-center gap-2">
                        <BookOpen size={18} />
                        Top Repositories
                    </h5>

                    <div className="space-y-4">
                        {analysis.repositories.slice(0, 5).map((repo, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <a
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-white hover:text-cyan-400 transition-colors flex items-center gap-1"
                                        >
                                            {repo.name}
                                            <ExternalLink size={12} />
                                        </a>
                                        {repo.description && (
                                            <p className="text-gray-400 text-sm mt-1">{repo.description}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        {repo.language && (
                                            <span className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                                {repo.language}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Star size={12} />
                                            {repo.stars}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <GitBranch size={12} />
                                            {repo.forks}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500">
                                    Updated {new Date(repo.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Recommendations */}
                {analysis.recommendations.length > 0 && (
                    <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-lg p-6">
                        <h5 className="font-medium text-white mb-4 flex items-center gap-2">
                            <CheckCircle size={18} />
                            AI Recommendations
                        </h5>

                        <div className="space-y-3">
                            {analysis.recommendations.map((rec, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-gray-300 text-sm">{rec}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <Github size={20} />
                    GitHub Integration
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                    Connect your GitHub account for automated skill analysis and portfolio enhancement
                </p>
            </div>

            {!user.github_username ? (
                /* Connect GitHub */
                <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Github size={32} className="text-purple-400" />
                    </div>

                    <h4 className="text-lg font-semibold text-white mb-2">Connect Your GitHub Account</h4>
                    <p className="text-gray-400 mb-6">
                        Automatically analyze your repositories to extract skills, showcase your work, and improve your profile
                    </p>

                    <div className="max-w-md mx-auto space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-cyan-400 mb-2 text-left">
                                GitHub Username
                            </label>
                            <input
                                type="text"
                                value={githubUsername}
                                onChange={(e) => setGithubUsername(e.target.value)}
                                placeholder="your-github-username"
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                            />
                        </div>

                        <button
                            onClick={handleConnectGitHub}
                            disabled={connecting || !githubUsername.trim()}
                            className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {connecting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Github size={16} />
                            )}
                            {connecting ? 'Connecting...' : 'Connect GitHub'}
                        </button>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Code size={16} className="text-purple-400" />
                            <span>Skill extraction from code</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <TrendingUp size={16} className="text-purple-400" />
                            <span>Activity analysis</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Award size={16} className="text-purple-400" />
                            <span>Portfolio showcase</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* GitHub Connected */
                <div className="space-y-6">
                    {/* Connection Status */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <CheckCircle size={20} className="text-green-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-white">GitHub Connected</h4>
                                    <a
                                        href={`https://github.com/${user.github_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                                    >
                                        @{user.github_username}
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleRefreshAnalysis}
                                    disabled={analyzing}
                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                                    title="Refresh analysis"
                                >
                                    {analyzing ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={16} />
                                    )}
                                </button>
                                <button
                                    onClick={handleDisconnectGitHub}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded-lg transition-colors text-sm"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>

                        {analyzing && (
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-400 text-sm">
                                    <Loader2 size={16} className="animate-spin" />
                                    Analyzing your GitHub profile... This may take a few minutes.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Analysis Results */}
                    {analysis && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white">Analysis Results</h4>
                                <button
                                    onClick={() => setShowAnalysis(!showAnalysis)}
                                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                                >
                                    {showAnalysis ? 'Hide Details' : 'Show Details'}
                                </button>
                            </div>

                            {showAnalysis && renderGitHubAnalysis()}
                        </div>
                    )}

                    {/* No Analysis Yet */}
                    {!analysis && !analyzing && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
                            <AlertCircle size={48} className="text-yellow-400 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-yellow-400 mb-2">Analysis Pending</h4>
                            <p className="text-gray-300 mb-4">
                                Your GitHub profile hasn't been analyzed yet. Click refresh to start the analysis.
                            </p>
                            <button
                                onClick={handleRefreshAnalysis}
                                className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Start Analysis
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}