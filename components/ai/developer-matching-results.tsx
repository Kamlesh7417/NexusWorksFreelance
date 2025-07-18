'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Code, 
  TrendingUp, 
  Award, 
  Github, 
  Mail,
  Loader2,
  RefreshCw,
  Filter,
  SortAsc,
  Eye,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { matchingService, DetailedMatch, MatchingFilters } from '@/lib/services/matching-service';

interface DeveloperMatchingResultsProps {
  projectId: string;
  onDeveloperSelect?: (developerId: string, taskIds: string[]) => void;
  onInviteDeveloper?: (developerId: string) => void;
}

export default function DeveloperMatchingResults({ 
  projectId, 
  onDeveloperSelect, 
  onInviteDeveloper 
}: DeveloperMatchingResultsProps) {
  const [matches, setMatches] = useState<DetailedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchingFilters>({
    min_score: 0.6,
    max_results: 20,
    include_unavailable: false
  });
  const [sortBy, setSortBy] = useState<'score' | 'rate' | 'experience' | 'availability'>('score');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, [projectId, filters]);

  const loadMatches = async () => {
    try {
      setError(null);
      const result = await matchingService.getProjectMatches(projectId, filters);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setMatches(result.data || []);
    } catch (err) {
      console.error('Failed to load matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load developer matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshMatches = async () => {
    setRefreshing(true);
    await loadMatches();
  };

  const recomputeMatches = async () => {
    setRefreshing(true);
    try {
      const result = await matchingService.recomputeMatches(projectId);
      if (result.error) {
        throw new Error(result.error);
      }
      setMatches(result.data || []);
    } catch (err) {
      console.error('Failed to recompute matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to recompute matches');
    } finally {
      setRefreshing(false);
    }
  };

  const sortedMatches = [...matches].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.match_score - a.match_score;
      case 'rate':
        return a.developer_profile.hourly_rate - b.developer_profile.hourly_rate;
      case 'experience':
        return b.developer_profile.reputation_score - a.developer_profile.reputation_score;
      case 'availability':
        return b.availability_score - a.availability_score;
      default:
        return b.match_score - a.match_score;
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.8) return 'text-blue-400';
    if (score >= 0.7) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 0.9) return 'bg-green-500/20 border-green-500/40';
    if (score >= 0.8) return 'bg-blue-500/20 border-blue-500/40';
    if (score >= 0.7) return 'bg-yellow-500/20 border-yellow-500/40';
    return 'bg-orange-500/20 border-orange-500/40';
  };

  const getAvailabilityStatus = (status: string) => {
    switch (status) {
      case 'available':
        return { color: 'text-green-400', bg: 'bg-green-500/20', text: 'Available' };
      case 'busy':
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', text: 'Busy' };
      case 'unavailable':
        return { color: 'text-red-400', bg: 'bg-red-500/20', text: 'Unavailable' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-500/20', text: 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Developer Matches</h2>
          <p className="text-gray-400">
            Found {matches.length} developers matching your project requirements
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Filter size={16} />
            Filters
          </button>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="score" className="bg-gray-900">Best Match</option>
            <option value="rate" className="bg-gray-900">Lowest Rate</option>
            <option value="experience" className="bg-gray-900">Most Experienced</option>
            <option value="availability" className="bg-gray-900">Most Available</option>
          </select>
          
          <button
            onClick={refreshMatches}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <button
            onClick={recomputeMatches}
            disabled={refreshing}
            className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <TrendingUp size={16} />
            Recompute
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Match Score</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.min_score}
                onChange={(e) => setFilters(prev => ({ ...prev, min_score: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">{Math.round((filters.min_score || 0) * 100)}%</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Results</label>
              <input
                type="number"
                min="5"
                max="50"
                value={filters.max_results}
                onChange={(e) => setFilters(prev => ({ ...prev, max_results: parseInt(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Include Unavailable</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.include_unavailable}
                  onChange={(e) => setFilters(prev => ({ ...prev, include_unavailable: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-white text-sm">Show all developers</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Matches List */}
      <div className="space-y-4">
        {sortedMatches.map((match) => {
          const availability = getAvailabilityStatus(match.developer_profile.availability_status);
          
          return (
            <div
              key={match.developer}
              className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {match.developer_profile.user.email.split('@')[0]}
                      </h3>
                      
                      {/* Match Score Badge */}
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getScoreBackground(match.match_score)}`}>
                        <span className={getScoreColor(match.match_score)}>
                          {Math.round(match.match_score * 100)}% Match
                        </span>
                      </div>
                      
                      {/* Availability Status */}
                      <div className={`px-2 py-1 rounded-full text-xs ${availability.bg}`}>
                        <span className={availability.color}>{availability.text}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400" />
                        <span>{match.developer_profile.reputation_score.toFixed(1)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        <span>${match.developer_profile.hourly_rate}/hr</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Award size={14} />
                        <span className="capitalize">{match.developer_profile.experience_level}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <CheckCircle size={14} />
                        <span>{match.developer_profile.completed_projects} projects</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {match.developer_profile.user.github_username && (
                    <a
                      href={`https://github.com/${match.developer_profile.user.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Github size={16} className="text-gray-400" />
                    </a>
                  )}
                  
                  <button
                    onClick={() => setSelectedDeveloper(selectedDeveloper === match.developer ? null : match.developer)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Eye size={16} className="text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => onInviteDeveloper?.(match.developer)}
                    className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Mail size={14} />
                    Invite
                  </button>
                </div>
              </div>
              
              {/* Skills */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Skills</div>
                <div className="flex flex-wrap gap-2">
                  {match.developer_profile.skills.slice(0, 8).map((skill, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs ${
                        match.match_details.skill_matches.includes(skill)
                          ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                          : 'bg-gray-500/20 border border-gray-500/40 text-gray-400'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                  {match.developer_profile.skills.length > 8 && (
                    <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs text-gray-400">
                      +{match.developer_profile.skills.length - 8} more
                    </span>
                  )}
                </div>
              </div>
              
              {/* Match Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Vector Score</div>
                  <div className="font-semibold text-white">{Math.round(match.vector_score * 100)}%</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Graph Score</div>
                  <div className="font-semibold text-white">{Math.round(match.graph_score * 100)}%</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Availability</div>
                  <div className="font-semibold text-white">{Math.round(match.availability_score * 100)}%</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Rate Fit</div>
                  <div className="font-semibold text-white">{Math.round(match.match_details.rate_compatibility * 100)}%</div>
                </div>
              </div>
              
              {/* Expanded Details */}
              {selectedDeveloper === match.developer && (
                <div className="border-t border-white/20 pt-4 space-y-4">
                  {/* Skill Analysis */}
                  <div>
                    <h4 className="text-sm font-medium text-cyan-400 mb-2">Skill Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-2">Matching Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {match.match_details.skill_matches.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded text-xs text-green-400">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {match.match_details.skill_gaps.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-400 mb-2">Skill Gaps</div>
                          <div className="flex flex-wrap gap-1">
                            {match.match_details.skill_gaps.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded text-xs text-orange-400">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* AI Reasoning */}
                  <div>
                    <h4 className="text-sm font-medium text-cyan-400 mb-2">AI Analysis</h4>
                    <p className="text-sm text-gray-300 bg-white/5 rounded-lg p-3">
                      {match.match_details.reasoning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {matches.length === 0 && !loading && (
        <div className="text-center py-12">
          <User size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Matches Found</h3>
          <p className="text-gray-400 mb-4">
            No developers match your current criteria. Try adjusting your filters or project requirements.
          </p>
          <button
            onClick={recomputeMatches}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-6 py-3 rounded-lg transition-colors"
          >
            Recompute Matches
          </button>
        </div>
      )}
    </div>
  );
}